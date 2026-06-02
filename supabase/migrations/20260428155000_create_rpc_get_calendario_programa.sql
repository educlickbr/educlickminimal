-- ============================================================
-- RPC: aca_get_calendario_programa
-- Data: 2026-04-28
-- Descrição: Retorna o calendário consolidado de um programa acadêmico,
--            incluindo aulas (aca_calendario) e feriados (aca_feriado)
--            relevantes para o período do programa.
--            Segurança garantida pelo RLS das tabelas envolvidas.
-- ============================================================

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
    v_aulas         jsonb;
    v_feriados      jsonb;
BEGIN
    -- 1. Busca os ciclos vinculados ao programa
    SELECT array_agg(id_ciclo)
    INTO v_ciclo_ids
    FROM public.aca_ciclo_programa
    WHERE id_programa = p_id_programa;

    IF v_ciclo_ids IS NULL OR array_length(v_ciclo_ids, 1) = 0 THEN
        RETURN jsonb_build_object('success', true, 'itens', '[]'::jsonb);
    END IF;

    -- 2. Busca aulas do calendário para esses ciclos
    SELECT jsonb_agg(
        jsonb_build_object(
            '_tipo',      'aula',
            'id',         c.id,
            'data',       to_char(c.dt_hora_ini AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
            'hora_ini',   to_char(c.dt_hora_ini AT TIME ZONE 'UTC', 'HH24:MI'),
            'hora_fim',   to_char(c.dt_hora_fim AT TIME ZONE 'UTC', 'HH24:MI'),
            'dt_hora_ini', c.dt_hora_ini,
            'dt_hora_fim', c.dt_hora_fim,
            'observacao', c.observacao,
            'id_ciclo',   c.id_ciclo,
            'nome_modulo', COALESCE(c.observacao, 'Aula'),
            'ciclo_desc', COALESCE(ci.descricao, 'Ciclo')
        )
        ORDER BY c.dt_hora_ini
    )
    INTO v_aulas
    FROM public.aca_calendario c
    LEFT JOIN public.aca_ciclo ci ON ci.id = c.id_ciclo
    WHERE c.id_entidade = p_id_entidade
      AND c.id_ciclo = ANY(v_ciclo_ids);

    -- 3. Determina o range de anos das aulas para buscar feriados relevantes
    SELECT
        EXTRACT(YEAR FROM MIN(dt_hora_ini))::int,
        EXTRACT(YEAR FROM MAX(dt_hora_ini))::int
    INTO v_min_ano, v_max_ano
    FROM public.aca_calendario
    WHERE id_entidade = p_id_entidade
      AND id_ciclo = ANY(v_ciclo_ids);

    -- Fallback se não houver datas
    IF v_min_ano IS NULL THEN
        v_min_ano := EXTRACT(YEAR FROM now())::int;
        v_max_ano := v_min_ano;
    END IF;

    -- 4. Busca feriados da entidade (e globais) no período do programa
    SELECT jsonb_agg(
        jsonb_build_object(
            '_tipo',            'feriado',
            'id',               f.id,
            'data',             to_char(f.data, 'YYYY-MM-DD'),
            'nome',             f.nome,
            'recorrente_anual', f.recorrente_anual,
            'is_global',        COALESCE(f.is_global, false)
        )
        ORDER BY f.data
    )
    INTO v_feriados
    FROM public.aca_feriado f
    WHERE (f.id_entidade = p_id_entidade OR f.id_entidade IS NULL OR f.is_global = true)
      AND (
          (f.data >= make_date(v_min_ano, 1, 1) AND f.data <= make_date(v_max_ano, 12, 31))
          OR f.recorrente_anual = true
      );

    RETURN jsonb_build_object(
        'success', true,
        'itens',   COALESCE(v_aulas, '[]'::jsonb) || COALESCE(v_feriados, '[]'::jsonb)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
