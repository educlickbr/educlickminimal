-- ============================================================
-- Renomeação do Motor de Calendário (Simular -> Calcular Cronograma)
-- Data: 2026-04-20
-- ============================================================

-- 1. DROPAR a função antiga (simular)
DROP FUNCTION IF EXISTS public.aca_simular_calendario_ciclo(UUID, UUID, DATE, JSONB, JSONB);


-- 2. CRIAR a nova função com o nome adequado (calcular_cronograma_aulas)
CREATE OR REPLACE FUNCTION public.aca_calcular_cronograma_aulas(
    p_id_entidade UUID,
    p_id_modulo UUID,
    p_data_inicio DATE,
    p_dias_semana JSONB,
    p_dias_extras JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    v_carga_total INTEGER;
    v_carga_restante INTEGER;
    v_data_atual DATE;
    v_dia_semana_atual INTEGER;
    v_dias_gerados JSONB := '[]'::jsonb;
    v_feriado_nome TEXT;
    v_evento_nome TEXT;
    
    v_hora_ini TIME;
    v_hora_fim TIME;
    v_obs TEXT;
    v_duracao_minutos INTEGER;
    v_loop_safety INTEGER := 0;
BEGIN
    SELECT COALESCE(carga_horaria, 0) INTO v_carga_total
    FROM public.aca_modulo WHERE id = p_id_modulo AND id_entidade = p_id_entidade;

    IF v_carga_total IS NULL OR v_carga_total <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Módulo não encontrado ou não tem Carga Horária (em minutos) configurada.');
    END IF;

    v_carga_restante := v_carga_total;
    v_data_atual := p_data_inicio;

    WHILE v_carga_restante > 0 LOOP
        v_loop_safety := v_loop_safety + 1;
        IF v_loop_safety > 2000 THEN
            RETURN jsonb_build_object('success', false, 'message', 'Loop de simulação excedido. Verifique se você cadastrou os dias da semana corretamente e evite ciclos imensos > 5 anos.');
        END IF;

        -- 1. Verifica se a data atual é um dia extra cadastrado
        SELECT (x->>'hora_ini')::time, (x->>'hora_fim')::time, x->>'observacoes'
        INTO v_hora_ini, v_hora_fim, v_obs
        FROM jsonb_array_elements(COALESCE(p_dias_extras, '[]'::jsonb)) x
        WHERE (x->>'data')::date = v_data_atual
        LIMIT 1;

        IF FOUND THEN
            v_duracao_minutos := EXTRACT(EPOCH FROM (v_hora_fim - v_hora_ini))/60;
            v_carga_restante := v_carga_restante - v_duracao_minutos;

            v_dias_gerados := v_dias_gerados || jsonb_build_object(
                'data', v_data_atual,
                'tipo', 'extra',
                'hora_ini', to_char(v_hora_ini, 'HH24:MI'),
                'hora_fim', to_char(v_hora_fim, 'HH24:MI'),
                'duracao_minutos', v_duracao_minutos,
                'observacao', COALESCE(v_obs, 'Encontro Extra')
            );

            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- 2. Verifica se a data atual é feriado ou recesso
        SELECT nome INTO v_feriado_nome 
        FROM public.aca_feriado 
        WHERE (id_entidade = p_id_entidade OR id_entidade IS NULL OR is_global = true) 
          AND (
            data = v_data_atual 
            OR (recorrente_anual = true AND EXTRACT(month from data) = EXTRACT(month from v_data_atual) AND EXTRACT(day from data) = EXTRACT(day from v_data_atual))
          ) LIMIT 1;

        IF FOUND THEN
            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- 2.5 Verifica se a data atual é um evento que sobrescreve o calendário
        SELECT nome_evento INTO v_evento_nome
        FROM public.aca_evento
        WHERE id_entidade = p_id_entidade 
          AND sobrescrever_calendario = true
          AND v_data_atual >= data_inicio AND v_data_atual <= data_fim
        LIMIT 1;

        IF FOUND THEN
            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- 3. Verifica se a data atual bate com a grade semanal regular ($dow=0 é Dom, $dow=6 é Sáb)
        v_dia_semana_atual := EXTRACT(dow FROM v_data_atual);
        
        SELECT (x->>'hora_ini')::time, (x->>'hora_fim')::time
        INTO v_hora_ini, v_hora_fim
        FROM jsonb_array_elements(COALESCE(p_dias_semana, '[]'::jsonb)) x
        WHERE (x->>'dia_sem')::int = v_dia_semana_atual
        LIMIT 1;

        IF FOUND THEN
            v_duracao_minutos := EXTRACT(EPOCH FROM (v_hora_fim - v_hora_ini))/60;
            v_carga_restante := v_carga_restante - v_duracao_minutos;

            v_dias_gerados := v_dias_gerados || jsonb_build_object(
                'data', v_data_atual,
                'tipo', 'regular',
                'hora_ini', to_char(v_hora_ini, 'HH24:MI'),
                'hora_fim', to_char(v_hora_fim, 'HH24:MI'),
                'duracao_minutos', v_duracao_minutos,
                'observacao', 'Aula Regular'
            );

            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- Se não caiu em nenhuma regra de ter aula, apenas avançamos a data
        v_data_atual := v_data_atual + INTERVAL '1 day';
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'data_fim', (v_data_atual - INTERVAL '1 day')::date,
        'saldo_minutos', v_carga_restante,
        'dias_gerados', v_dias_gerados
    );
END;
$$;


-- 3. ATUALIZAR a função principal de gerar calendário (O COMMIT FINAL NO BANCO)
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

    -- CHAMA A NOVA FUNÇÃO AQUI:
    SELECT public.aca_calcular_cronograma_aulas(
        p_id_entidade, v_modulo_id, v_data_inicio, v_dias_semana, v_dias_extras
    ) INTO v_simulacao;

    -- Analisar resultado
    v_is_sucesso := (v_simulacao->>'success')::boolean;
    v_saldo_minutos := (v_simulacao->>'saldo_minutos')::int;
    v_data_fim := (v_simulacao->>'data_fim')::date;
    v_itens := v_simulacao->'dias_gerados';

    IF NOT v_is_sucesso THEN
        RETURN v_simulacao; -- Retorna a mensagem de erro direto da simulação
    END IF;

    IF v_saldo_minutos <> 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Matemática de horas falhou. O ciclo excede ou falta horas (saldo: ' || v_saldo_minutos || '). Salve ou atualize as regras de dias.');
    END IF;

    -- Apagar calendário futuro que seria re-criado ou limpo
    DELETE FROM public.aca_calendario WHERE id_ciclo = p_id_ciclo;

    -- Inserir novo calendário
    FOR x IN SELECT * FROM jsonb_array_elements(v_itens) LOOP
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
        'qtd_aulas', jsonb_array_length(v_itens)
    );
END;
$$;
