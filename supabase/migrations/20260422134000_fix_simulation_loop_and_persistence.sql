-- ============================================================
-- RPCs: aca_calcular_cronograma_aulas & aca_gerar_calendario_ciclo
-- Data: 2026-04-22
-- Descrição:
--   - aca_calcular_cronograma_aulas:
--       > Inclui trava contra loop infinito (duração <= 0).
--       > Feriados e Eventos agora SÓ são checados se o dia for 
--         candidato a aula (regular ou extra). Isso limpa o dashboard.
--   - aca_gerar_calendario_ciclo:
--       > Garante que dias marcados como 'feriado' ou 'evento' 
--         NÃO sejam salvos na tabela aca_calendario.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_calcular_cronograma_aulas(
    p_id_entidade UUID,
    p_id_modulo   UUID,
    p_data_inicio DATE,
    p_dias_semana JSONB,
    p_dias_extras JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    v_carga_total      INTEGER;
    v_carga_restante   INTEGER;
    v_data_atual       DATE;
    v_dia_semana_atual INTEGER;
    v_dias_gerados     JSONB := '[]'::jsonb;
    v_feriado_nome     TEXT;
    v_evento_nome      TEXT;
    v_hora_ini         TIME;
    v_hora_fim         TIME;
    v_obs              TEXT;
    v_duracao_minutos  INTEGER;
    v_loop_safety      INTEGER := 0;
    v_modulo_existe    BOOLEAN;
    
    v_is_candidate     BOOLEAN;
    v_tipo_candidato   TEXT;
BEGIN
    -- 0. Confere se o módulo existe
    SELECT EXISTS(
        SELECT 1 FROM public.aca_modulo
        WHERE id = p_id_modulo AND id_entidade = p_id_entidade
    ) INTO v_modulo_existe;

    IF NOT v_modulo_existe THEN
        RETURN jsonb_build_object('success', false, 'message', 'Módulo não encontrado para esta entidade.');
    END IF;

    -- 1. Carga = soma dos componentes do módulo
    SELECT COALESCE(SUM(mc.carga_horaria), 0)
    INTO v_carga_total
    FROM public.aca_modulo_componente mc
    WHERE mc.id_modulo = p_id_modulo;

    IF v_carga_total <= 0 THEN
        RETURN jsonb_build_object('success', false,
            'message', 'O módulo não possui componentes com carga horária configurada.');
    END IF;

    v_carga_restante := v_carga_total;
    v_data_atual     := p_data_inicio;

    WHILE v_carga_restante > 0 LOOP
        v_loop_safety := v_loop_safety + 1;
        IF v_loop_safety > 2000 THEN
            RETURN jsonb_build_object('success', false,
                'message', 'Loop de simulação excedido. Verifique se os dias da semana ou extras têm carga horária > 0 e se não há muitos feriados/eventos bloqueando continuamente o progresso.');
        END IF;

        v_is_candidate   := false;
        v_tipo_candidato := '';

        -- A. O dia é um Dia Extra (reposição/inclusão pontual)?
        SELECT (x->>'hora_ini')::time, (x->>'hora_fim')::time, x->>'observacoes'
        INTO v_hora_ini, v_hora_fim, v_obs
        FROM jsonb_array_elements(COALESCE(p_dias_extras, '[]'::jsonb)) x
        WHERE (x->>'data')::date = v_data_atual
        LIMIT 1;

        IF FOUND THEN
            v_is_candidate   := true;
            v_tipo_candidato := 'extra';
            -- Coalesce pra garantir um texto default, não substituindo um vazio se for nulo
            v_obs := COALESCE(v_obs, 'Encontro Extra'); 
        ELSE
            -- B. O dia é um Dia de Aula Regular (da grade padrão)?
            v_dia_semana_atual := EXTRACT(dow FROM v_data_atual);
            SELECT (x->>'hora_ini')::time, (x->>'hora_fim')::time
            INTO v_hora_ini, v_hora_fim
            FROM jsonb_array_elements(COALESCE(p_dias_semana, '[]'::jsonb)) x
            WHERE (x->>'dia_sem')::int = v_dia_semana_atual
            LIMIT 1;

            IF FOUND THEN
                v_is_candidate   := true;
                v_tipo_candidato := 'regular';
                v_obs            := 'Aula Regular';
            END IF;
        END IF;

        -- C. Se NÃO for candidato a aula neste dia atual, apenas avançar.
        -- O dashboard fica limpo, sem mostrar feriados num Sábado sem aula, por ex.
        IF NOT v_is_candidate THEN
            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- D. Validação crítica para EVITAR LOOPS INFINITOS
        v_duracao_minutos := EXTRACT(EPOCH FROM (v_hora_fim - v_hora_ini))/60;
        IF v_duracao_minutos IS NULL OR v_duracao_minutos <= 0 THEN
             RETURN jsonb_build_object('success', false, 'message', 
                 'Duração de aula zero ou negativa detectada para o dia ' || to_char(v_data_atual, 'DD/MM/YYYY') || '. Verifique os horários configurados.');
        END IF;

        -- =========================================================================
        -- Aqui sabemos que é um dia onde Haveria Aula. Vamos checar os bloqueadores!
        -- =========================================================================

        -- Verifica Feriado (mesmo se o tipo for extra - o usuário pode decidir dar aula, mas preferimos pular/avisar para ser seguro. Originalmente pulávamos, agora avisamos e pulamos).
        SELECT nome INTO v_feriado_nome
        FROM public.aca_feriado
        WHERE (
            id_entidade IS NULL
            OR is_global = true
            OR id_entidade::text = ANY(
                SELECT jsonb_array_elements_text(auth.jwt() -> 'entidades')
            )
        )
        AND (
            data = v_data_atual
            OR (
                recorrente_anual = true
                AND EXTRACT(month FROM data) = EXTRACT(month FROM v_data_atual)
                AND EXTRACT(day   FROM data) = EXTRACT(day   FROM v_data_atual)
            )
        )
        LIMIT 1;

        IF FOUND THEN
            -- Exibe como feriado e NÃO consome carga
            v_dias_gerados := v_dias_gerados || jsonb_build_object(
                'data',            v_data_atual,
                'tipo',            'feriado',
                'hora_ini',        NULL,
                'hora_fim',        NULL,
                'duracao_minutos', 0,
                'observacao',      v_feriado_nome
            );
            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- Verifica Evento Escolar bloqueante
        SELECT nome_evento INTO v_evento_nome
        FROM public.aca_evento
        WHERE sobrescrever_calendario = true
          AND v_data_atual >= data_inicio AND v_data_atual <= data_fim
          AND id_entidade::text = ANY(
              SELECT jsonb_array_elements_text(auth.jwt() -> 'entidades')
          )
        LIMIT 1;

        IF FOUND THEN
            -- Exibe como evento e NÃO consome carga
            v_dias_gerados := v_dias_gerados || jsonb_build_object(
                'data',            v_data_atual,
                'tipo',            'evento',
                'hora_ini',        NULL,
                'hora_fim',        NULL,
                'duracao_minutos', 0,
                'observacao',      v_evento_nome
            );
            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- E. Se não há bloqueios, aula acontece!
        v_carga_restante  := v_carga_restante - v_duracao_minutos;
        v_dias_gerados    := v_dias_gerados || jsonb_build_object(
            'data',            v_data_atual,
            'tipo',            v_tipo_candidato,
            'hora_ini',        to_char(v_hora_ini, 'HH24:MI'),
            'hora_fim',        to_char(v_hora_fim, 'HH24:MI'),
            'duracao_minutos', v_duracao_minutos,
            'observacao',      v_obs
        );
        
        v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;

    RETURN jsonb_build_object(
        'success',       true,
        'data_fim',      (v_data_atual - INTERVAL '1 day')::date,
        'saldo_minutos', v_carga_restante,
        'dias_gerados',  v_dias_gerados
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;


-- ============================================================
-- RPC Principal: aca_gerar_calendario_ciclo
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_gerar_calendario_ciclo(
    p_id_entidade UUID,
    p_id_ciclo UUID,
    p_usuario_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    v_modulo_id UUID;
    v_data_inicio DATE;
    v_dias_semana JSONB;
    v_dias_extras JSONB;
    v_simulacao JSONB;
    
    v_is_sucesso BOOLEAN;
    v_saldo_minutos INTEGER;
    v_data_fim DATE;
    v_itens JSONB;
    
    x JSONB;
    v_hora_ini TIME;
    v_hora_fim TIME;
    v_data_aula DATE;
BEGIN
    SELECT id_modulo, data_ini INTO v_modulo_id, v_data_inicio
    FROM public.aca_ciclo WHERE id = p_id_ciclo AND id_entidade = p_id_entidade;

    IF v_modulo_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ciclo não encontrado.');
    END IF;

    -- Coletar dias da semana
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('dia_sem', n_dia_sem, 'hora_ini', to_char(hora_ini, 'HH24:MI'), 'hora_fim', to_char(hora_fim, 'HH24:MI'))
    ), '[]'::jsonb) INTO v_dias_semana
    FROM public.aca_ciclo_dia_semana WHERE id_ciclo = p_id_ciclo;

    -- Coletar dias extras
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('data', data, 'hora_ini', to_char(hora_ini, 'HH24:MI'), 'hora_fim', to_char(hora_fim, 'HH24:MI'), 'observacoes', observacoes)
    ), '[]'::jsonb) INTO v_dias_extras
    FROM public.aca_ciclo_dia_extra WHERE id_ciclo = p_id_ciclo;

    -- Chama a nova simulação limpa
    SELECT public.aca_calcular_cronograma_aulas(
        p_id_entidade, v_modulo_id, v_data_inicio, v_dias_semana, v_dias_extras
    ) INTO v_simulacao;

    -- Analisar resultado
    v_is_sucesso := (v_simulacao->>'success')::boolean;
    v_saldo_minutos := (v_simulacao->>'saldo_minutos')::int;
    v_data_fim := (v_simulacao->>'data_fim')::date;
    v_itens := v_simulacao->'dias_gerados';

    IF NOT v_is_sucesso THEN
        RETURN v_simulacao; -- Retorna a mensagem de erro da simulação com detalhes importantes
    END IF;

    IF v_saldo_minutos <> 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Matemática de horas falhou. O ciclo excede ou falta horas (saldo: ' || v_saldo_minutos || '). Salve ou atualize as regras de dias.');
    END IF;

    -- Apagar calendário futuro que será re-criado
    DELETE FROM public.aca_calendario WHERE id_ciclo = p_id_ciclo;

    -- Inserir novo calendário:
    -- ATENÇÃO: NÃO persiste eventos informativos (feriados/eventos bloqueantes),
    --          já que a tabela aca_calendario (not-null) espera horários de aula reais.
    FOR x IN SELECT * FROM jsonb_array_elements(v_itens) LOOP
        -- Ignora os dias puramente informativos
        IF (x->>'tipo') IN ('feriado', 'evento') THEN
             CONTINUE;
        END IF;

        v_data_aula := (x->>'data')::date;
        v_hora_ini := (x->>'hora_ini')::time;
        v_hora_fim := (x->>'hora_fim')::time;
        
        INSERT INTO public.aca_calendario (
            id_ciclo,
            id_entidade,
            dt_hora_ini,
            dt_hora_fim,
            observacao,
            criado_por,
            modificado_por
        ) VALUES (
            p_id_ciclo,
            p_id_entidade,
            (v_data_aula + v_hora_ini),
            (v_data_aula + v_hora_fim),
            x->>'observacao',
            p_usuario_id,
            p_usuario_id
        );
    END LOOP;
    
    -- Atualizar Cycle end date
    UPDATE public.aca_ciclo 
       SET data_fim = v_data_fim,
           modificado_por = p_usuario_id,
           modificado_em = now()
     WHERE id = p_id_ciclo;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Calendário gerado com sucesso.',
        'data_fim', v_data_fim,
        'qtd_aulas', jsonb_array_length(v_itens) -- Retorna infos gerais
    );
END;
$$;
