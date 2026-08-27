-- ============================================================
-- Migration: Novas colunas em aca_calendario e RPCs para Gestão Avançada de Calendário
-- Data: 2026-08-27
-- ============================================================

-- 1. Novas colunas em aca_calendario
ALTER TABLE public.aca_calendario
  ADD COLUMN IF NOT EXISTS id_componente UUID REFERENCES public.aca_componente(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_docente_override UUID REFERENCES public.aca_docente(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sub_turma TEXT NULL,
  ADD COLUMN IF NOT EXISTS id_aula_parceira UUID REFERENCES public.aca_calendario(id) ON DELETE SET NULL;

-- 2. Atualizar RPC aca_get_calendario_programa para retornar novos campos de aula + docente atribuído
CREATE OR REPLACE FUNCTION public.aca_get_calendario_programa(
    p_id_programa   uuid,
    p_id_entidade   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_ciclo_ids     uuid[];
    v_min_ano       int;
    v_max_ano       int;
    v_min_date      date;
    v_max_date      date;
    v_aulas         jsonb;
    v_feriados      jsonb;
    v_eventos       jsonb;
BEGIN
    -- 1. Busca os ciclos vinculados ao programa
    SELECT array_agg(id_ciclo)
    INTO v_ciclo_ids
    FROM public.aca_ciclo_programa
    WHERE id_programa = p_id_programa;

    IF v_ciclo_ids IS NULL OR array_length(v_ciclo_ids, 1) = 0 THEN
        RETURN jsonb_build_object('success', true, 'itens', '[]'::jsonb);
    END IF;

    -- 2. Busca aulas do calendário com componente e docente (titular ou override)
    SELECT jsonb_agg(
        jsonb_build_object(
            '_tipo',              'aula',
            'id',                 c.id,
            'data',               to_char(c.dt_hora_ini AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
            'hora_ini',           to_char(c.dt_hora_ini AT TIME ZONE 'UTC', 'HH24:MI'),
            'hora_fim',           to_char(c.dt_hora_fim AT TIME ZONE 'UTC', 'HH24:MI'),
            'dt_hora_ini',        c.dt_hora_ini,
            'dt_hora_fim',        c.dt_hora_fim,
            'observacao',         c.observacao,
            'status',             COALESCE(c.status, 'agendada'),
            'id_ciclo',           c.id_ciclo,
            'ciclo_desc',         COALESCE(ci.descricao, 'Ciclo'),
            'id_componente',      c.id_componente,
            'nome_componente',    comp.nome_componente,
            'sub_turma',          c.sub_turma,
            'id_aula_parceira',   c.id_aula_parceira,
            'id_docente',         COALESCE(c.id_docente_override, d_atrib.id_docente),
            'nome_docente',       COALESCE(u_override.nome, u_atrib.nome),
            'is_docente_override', (c.id_docente_override IS NOT NULL)
        )
        ORDER BY c.dt_hora_ini
    )
    INTO v_aulas
    FROM public.aca_calendario c
    LEFT JOIN public.aca_ciclo ci ON ci.id = c.id_ciclo
    LEFT JOIN public.aca_componente comp ON comp.id = c.id_componente
    LEFT JOIN public.aca_docente d_override ON d_override.id = c.id_docente_override
    LEFT JOIN public.user_expandido u_override ON u_override.id = d_override.id_user_expandido
    LEFT JOIN LATERAL (
        SELECT id_docente
        FROM public.aca_docente_modulo_componente_ciclo
        WHERE id_ciclo = c.id_ciclo
          AND (c.id_componente IS NULL OR id_modulo_componente IN (
              SELECT id FROM public.aca_modulo_componente WHERE id_componente = c.id_componente
          ))
        LIMIT 1
    ) d_atrib ON true
    LEFT JOIN public.aca_docente d_atrib_obj ON d_atrib_obj.id = d_atrib.id_docente
    LEFT JOIN public.user_expandido u_atrib ON u_atrib.id = d_atrib_obj.id_user_expandido
    WHERE c.id_entidade = p_id_entidade
      AND c.id_ciclo = ANY(v_ciclo_ids);

    -- 3. Determina o range de anos e datas das aulas
    SELECT
        EXTRACT(YEAR FROM MIN(dt_hora_ini AT TIME ZONE 'UTC'))::int,
        EXTRACT(YEAR FROM MAX(dt_hora_ini AT TIME ZONE 'UTC'))::int,
        MIN(dt_hora_ini AT TIME ZONE 'UTC')::date,
        MAX(dt_hora_ini AT TIME ZONE 'UTC')::date
    INTO v_min_ano, v_max_ano, v_min_date, v_max_date
    FROM public.aca_calendario
    WHERE id_entidade = p_id_entidade
      AND id_ciclo = ANY(v_ciclo_ids);

    IF v_min_ano IS NULL THEN
        v_min_ano  := EXTRACT(YEAR FROM now())::int;
        v_max_ano  := v_min_ano;
        v_min_date := make_date(v_min_ano, 1, 1);
        v_max_date := make_date(v_max_ano, 12, 31);
    END IF;

    -- 4. Busca feriados
    SELECT jsonb_agg(sub ORDER BY sub_data)
    INTO v_feriados
    FROM (
        SELECT
            jsonb_build_object(
                '_tipo',            'feriado',
                'id',               f.id,
                'data',             to_char(f.data, 'YYYY-MM-DD'),
                'nome',             f.nome,
                'recorrente_anual', f.recorrente_anual,
                'is_global',        COALESCE(f.is_global, false)
            ) AS sub,
            f.data AS sub_data
        FROM public.aca_feriado f
        WHERE (f.id_entidade = p_id_entidade OR f.id_entidade IS NULL OR COALESCE(f.is_global, false) = true)
          AND f.recorrente_anual = false
          AND f.data >= make_date(v_min_ano, 1, 1)
          AND f.data <= make_date(v_max_ano, 12, 31)

        UNION ALL

        SELECT
            jsonb_build_object(
                '_tipo',            'feriado',
                'id',               f.id || '_' || yr,
                'data',             to_char(make_date(yr, EXTRACT(MONTH FROM f.data)::int, EXTRACT(DAY FROM f.data)::int), 'YYYY-MM-DD'),
                'nome',             f.nome,
                'recorrente_anual', true,
                'is_global',        COALESCE(f.is_global, false)
            ) AS sub,
            make_date(yr, EXTRACT(MONTH FROM f.data)::int, EXTRACT(DAY FROM f.data)::int) AS sub_data
        FROM public.aca_feriado f
        CROSS JOIN generate_series(v_min_ano, v_max_ano) AS yr
        WHERE (f.id_entidade = p_id_entidade OR f.id_entidade IS NULL OR COALESCE(f.is_global, false) = true)
          AND f.recorrente_anual = true
    ) sub_q;

    -- 5. Busca eventos da entidade
    SELECT jsonb_agg(
        jsonb_build_object(
            '_tipo',        'evento',
            'id',           e.id,
            'nome_evento',  e.nome_evento,
            'data_inicio',  to_char(e.data_inicio, 'YYYY-MM-DD'),
            'data_fim',     to_char(e.data_fim, 'YYYY-MM-DD'),
            'descricao',    e.descricao
        )
        ORDER BY e.data_inicio
    )
    INTO v_eventos
    FROM public.aca_evento e
    WHERE e.id_entidade = p_id_entidade
      AND e.data_fim   >= v_min_date
      AND e.data_inicio <= v_max_date;

    RETURN jsonb_build_object(
        'success', true,
        'itens',   COALESCE(v_aulas, '[]'::jsonb)
                || COALESCE(v_feriados, '[]'::jsonb)
                || COALESCE(v_eventos, '[]'::jsonb)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. RPC aca_atualizar_aula_detalhes
CREATE OR REPLACE FUNCTION public.aca_atualizar_aula_detalhes(
    p_id_aula             uuid,
    p_id_entidade         uuid,
    p_id_componente       uuid DEFAULT NULL,
    p_id_docente_override uuid DEFAULT NULL,
    p_observacao          text DEFAULT NULL,
    p_sub_turma           text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.aca_calendario
    SET id_componente       = p_id_componente,
        id_docente_override = p_id_docente_override,
        observacao          = p_observacao,
        sub_turma           = p_sub_turma
    WHERE id = p_id_aula
      AND id_entidade = p_id_entidade;

    RETURN jsonb_build_object('success', true, 'message', 'Aula atualizada com sucesso');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. RPC aca_swap_aulas (Permuta)
CREATE OR REPLACE FUNCTION public.aca_swap_aulas(
    p_id_aula_1     uuid,
    p_id_aula_2     uuid,
    p_id_entidade   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_dt_ini_1 timestamptz;
    v_dt_fim_1 timestamptz;
    v_dt_ini_2 timestamptz;
    v_dt_fim_2 timestamptz;
BEGIN
    SELECT dt_hora_ini, dt_hora_fim INTO v_dt_ini_1, v_dt_fim_1
    FROM public.aca_calendario WHERE id = p_id_aula_1 AND id_entidade = p_id_entidade;

    SELECT dt_hora_ini, dt_hora_fim INTO v_dt_ini_2, v_dt_fim_2
    FROM public.aca_calendario WHERE id = p_id_aula_2 AND id_entidade = p_id_entidade;

    IF v_dt_ini_1 IS NULL OR v_dt_ini_2 IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Uma ou ambas as aulas não foram encontradas.');
    END IF;

    UPDATE public.aca_calendario
    SET dt_hora_ini = v_dt_ini_2,
        dt_hora_fim = v_dt_fim_2,
        status = CASE WHEN status = 'cancelada' THEN 'agendada' ELSE status END
    WHERE id = p_id_aula_1 AND id_entidade = p_id_entidade;

    UPDATE public.aca_calendario
    SET dt_hora_ini = v_dt_ini_1,
        dt_hora_fim = v_dt_fim_1,
        status = CASE WHEN status = 'cancelada' THEN 'agendada' ELSE status END
    WHERE id = p_id_aula_2 AND id_entidade = p_id_entidade;

    RETURN jsonb_build_object('success', true, 'message', 'Permuta realizada com sucesso');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 5. RPC aca_dividir_aula (Turma A / B)
CREATE OR REPLACE FUNCTION public.aca_dividir_aula(
    p_id_aula             uuid,
    p_id_entidade         uuid,
    p_id_componente_b     uuid DEFAULT NULL,
    p_id_docente_b        uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_aula                record;
    v_nova_aula_id        uuid;
BEGIN
    SELECT * INTO v_aula FROM public.aca_calendario WHERE id = p_id_aula AND id_entidade = p_id_entidade;
    IF v_aula.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Aula de origem não encontrada.');
    END IF;

    v_nova_aula_id := gen_random_uuid();

    -- Atualiza aula original para Turma A
    UPDATE public.aca_calendario
    SET sub_turma = 'A',
        id_aula_parceira = v_nova_aula_id
    WHERE id = p_id_aula;

    -- Cria nova aula para Turma B no mesmo dia/horário
    INSERT INTO public.aca_calendario (
        id, id_entidade, id_ciclo, dt_hora_ini, dt_hora_fim, observacao,
        id_componente, id_docente_override, sub_turma, id_aula_parceira, status
    ) VALUES (
        v_nova_aula_id, v_aula.id_entidade, v_aula.id_ciclo, v_aula.dt_hora_ini, v_aula.dt_hora_fim, v_aula.observacao,
        COALESCE(p_id_componente_b, v_aula.id_componente), COALESCE(p_id_docente_b, v_aula.id_docente_override),
        'B', p_id_aula, COALESCE(v_aula.status, 'agendada')
    );

    RETURN jsonb_build_object('success', true, 'novo_id', v_nova_aula_id, 'message', 'Aula dividida em Turma A e Turma B com sucesso.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 6. RPCs para páginas públicas
CREATE OR REPLACE FUNCTION public.aca_get_calendario_ciclo_publico(
    p_id_ciclo uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'ciclo', (SELECT jsonb_build_object('id', id, 'descricao', descricao, 'ano_semestre', ano_semestre) FROM public.aca_ciclo WHERE id = p_id_ciclo),
        'aulas', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id,
                'data', to_char(c.dt_hora_ini AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
                'hora_ini', to_char(c.dt_hora_ini AT TIME ZONE 'UTC', 'HH24:MI'),
                'hora_fim', to_char(c.dt_hora_fim AT TIME ZONE 'UTC', 'HH24:MI'),
                'componente', comp.nome_componente,
                'docente', u.nome,
                'sub_turma', c.sub_turma,
                'status', c.status
            ) ORDER BY c.dt_hora_ini)
            FROM public.aca_calendario c
            LEFT JOIN public.aca_componente comp ON comp.id = c.id_componente
            LEFT JOIN public.aca_docente d ON d.id = c.id_docente_override
            LEFT JOIN public.user_expandido u ON u.id = d.id_user_expandido
            WHERE c.id_ciclo = p_id_ciclo
        ), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.aca_get_calendario_docente_publico(
    p_id_docente uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'docente', (
            SELECT jsonb_build_object('id', d.id, 'nome', u.nome, 'email', u.email)
            FROM public.aca_docente d
            JOIN public.user_expandido u ON u.id = d.id_user_expandido
            WHERE d.id = p_id_docente
        ),
        'aulas', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id,
                'data', to_char(c.dt_hora_ini AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
                'hora_ini', to_char(c.dt_hora_ini AT TIME ZONE 'UTC', 'HH24:MI'),
                'hora_fim', to_char(c.dt_hora_fim AT TIME ZONE 'UTC', 'HH24:MI'),
                'ciclo', ci.descricao,
                'componente', comp.nome_componente,
                'sub_turma', c.sub_turma,
                'status', c.status
            ) ORDER BY c.dt_hora_ini)
            FROM public.aca_calendario c
            LEFT JOIN public.aca_ciclo ci ON ci.id = c.id_ciclo
            LEFT JOIN public.aca_componente comp ON comp.id = c.id_componente
            WHERE c.id_docente_override = p_id_docente
               OR c.id_ciclo IN (
                   SELECT id_ciclo FROM public.aca_docente_modulo_componente_ciclo WHERE id_docente = p_id_docente
               )
        ), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;
