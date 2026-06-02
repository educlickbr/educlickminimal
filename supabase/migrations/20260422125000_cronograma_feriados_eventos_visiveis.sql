-- ============================================================
-- RPC: aca_calcular_cronograma_aulas  (feriados e eventos visíveis)
-- Data: 2026-04-22
-- Novidades:
--   ✓ Feriados → aparecem no cronograma com tipo 'feriado'
--   ✓ Eventos com sobrescrever_calendario=true → tipo 'evento'
--   ✓ Feriados buscados via JWT (todas as entidades do usuário)
--   ✓ Eventos bloqueantes buscados via JWT (mesma lógica)
--   Nenhum destes desconta da carga horária: são informativos.
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
BEGIN
    -- 0. Módulo existe?
    SELECT EXISTS(
        SELECT 1 FROM public.aca_modulo
        WHERE id = p_id_modulo AND id_entidade = p_id_entidade
    ) INTO v_modulo_existe;

    IF NOT v_modulo_existe THEN
        RETURN jsonb_build_object('success', false, 'message', 'Módulo não encontrado para esta entidade.');
    END IF;

    -- 1. Carga horária = soma dos componentes
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
                'message', 'Loop de simulação excedido. Verifique os dias configurados.');
        END IF;

        -- A. Dia extra cadastrado manualmente (prioridade máxima — conta como aula)
        SELECT (x->>'hora_ini')::time, (x->>'hora_fim')::time, x->>'observacoes'
        INTO v_hora_ini, v_hora_fim, v_obs
        FROM jsonb_array_elements(COALESCE(p_dias_extras, '[]'::jsonb)) x
        WHERE (x->>'data')::date = v_data_atual
        LIMIT 1;

        IF FOUND THEN
            v_duracao_minutos := EXTRACT(EPOCH FROM (v_hora_fim - v_hora_ini))/60;
            v_carga_restante  := v_carga_restante - v_duracao_minutos;
            v_dias_gerados    := v_dias_gerados || jsonb_build_object(
                'data',            v_data_atual,
                'tipo',            'extra',
                'hora_ini',        to_char(v_hora_ini, 'HH24:MI'),
                'hora_fim',        to_char(v_hora_fim, 'HH24:MI'),
                'duracao_minutos', v_duracao_minutos,
                'observacao',      COALESCE(v_obs, 'Encontro Extra')
            );
            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- B. Feriado ou recesso (todas as entidades do usuário via JWT)
        --    → aparece no cronograma como informação, mas NÃO conta como aula
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
            -- Registra o feriado no cronograma para visualização
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

        -- C. Evento que sobrescreve o calendário (todas as entidades do usuário via JWT)
        --    → aparece no cronograma como informação, mas NÃO conta como aula
        SELECT nome_evento INTO v_evento_nome
        FROM public.aca_evento
        WHERE sobrescrever_calendario = true
          AND v_data_atual >= data_inicio AND v_data_atual <= data_fim
          AND id_entidade::text = ANY(
              SELECT jsonb_array_elements_text(auth.jwt() -> 'entidades')
          )
        LIMIT 1;

        IF FOUND THEN
            -- Registra o evento no cronograma para visualização
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

        -- D. Grade semanal regular
        v_dia_semana_atual := EXTRACT(dow FROM v_data_atual);

        SELECT (x->>'hora_ini')::time, (x->>'hora_fim')::time
        INTO v_hora_ini, v_hora_fim
        FROM jsonb_array_elements(COALESCE(p_dias_semana, '[]'::jsonb)) x
        WHERE (x->>'dia_sem')::int = v_dia_semana_atual
        LIMIT 1;

        IF FOUND THEN
            v_duracao_minutos := EXTRACT(EPOCH FROM (v_hora_fim - v_hora_ini))/60;
            v_carga_restante  := v_carga_restante - v_duracao_minutos;
            v_dias_gerados    := v_dias_gerados || jsonb_build_object(
                'data',            v_data_atual,
                'tipo',            'regular',
                'hora_ini',        to_char(v_hora_ini, 'HH24:MI'),
                'hora_fim',        to_char(v_hora_fim, 'HH24:MI'),
                'duracao_minutos', v_duracao_minutos,
                'observacao',      'Aula Regular'
            );
            v_data_atual := v_data_atual + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- Nenhuma regra: avança o dia
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
