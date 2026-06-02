-- ============================================================
-- Funções do Calendário: Simulação Atualizada (Feriados Globais e Eventos)
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_simular_calendario_ciclo(
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
