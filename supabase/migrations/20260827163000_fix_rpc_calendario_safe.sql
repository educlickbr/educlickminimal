-- ============================================================
-- Migration: Fix RPC aca_get_calendario_programa (v4 resiliente)
-- Data: 2026-08-27
-- Descrição: Garante a criação/existência das colunas em aca_calendario
-- e recria a RPC com SECURITY DEFINER (para leitura segura de user_expandido)
-- e tratamento defensivo de joins para que o calendário NUNCA fique em branco.
-- ============================================================

-- 1. Garante a criação das colunas em aca_calendario
ALTER TABLE public.aca_calendario
  ADD COLUMN IF NOT EXISTS id_componente UUID REFERENCES public.aca_componente(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_docente_override UUID REFERENCES public.aca_docente(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sub_turma TEXT NULL,
  ADD COLUMN IF NOT EXISTS id_aula_parceira UUID REFERENCES public.aca_calendario(id) ON DELETE SET NULL;

-- 2. Recria a RPC aca_get_calendario_programa com SECURITY DEFINER para acessar nomes de docentes em user_expandido
CREATE OR REPLACE FUNCTION public.aca_get_calendario_programa(
    p_id_programa   uuid,
    p_id_entidade   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

    -- 2. Busca aulas do calendário com tratamento seguro de componentes e docentes
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
        SELECT admc.id_docente
        FROM public.aca_docente_modulo_componente_ciclo admc
        WHERE admc.id_ciclo = c.id_ciclo
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

    -- 5. Busca eventos
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

GRANT EXECUTE ON FUNCTION public.aca_get_calendario_programa(uuid, uuid) TO authenticated, anon;
