-- ============================================================
-- Migration: Cancelamento e Reagendamento de Aulas
-- Data: 2026-05-04
-- Descrição: 
--   1. Adiciona status e id_aula_origem à aca_calendario
--   2. RPC aca_cancelar_aula
--   3. RPC aca_reagendar_aula_cancelada
--   4. Atualiza aca_get_calendario_programa para retornar novos campos
-- ============================================================

-- 1. Alterar Tabela
ALTER TABLE public.aca_calendario 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'agendada',
ADD COLUMN IF NOT EXISTS id_aula_origem UUID REFERENCES public.aca_calendario(id) ON DELETE SET NULL;

-- 2. RPC: Cancelar Aula
CREATE OR REPLACE FUNCTION public.aca_cancelar_aula(
    p_id_aula     uuid,
    p_id_entidade uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.aca_calendario
    SET status = 'cancelada', modificado_em = NOW()
    WHERE id = p_id_aula AND id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Aula não encontrada ou sem permissão.');
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. RPC: Reagendar Aula Cancelada
CREATE OR REPLACE FUNCTION public.aca_reagendar_aula_cancelada(
    p_id_aula     uuid,
    p_nova_data   date,
    p_id_entidade uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_aula public.aca_calendario%ROWTYPE;
    v_novo_id uuid;
BEGIN
    -- Obter a aula original (cancelada)
    SELECT * INTO v_aula
    FROM public.aca_calendario
    WHERE id = p_id_aula AND id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Aula não encontrada ou sem permissão.');
    END IF;

    IF v_aula.status != 'cancelada' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Apenas aulas canceladas podem ser reagendadas como reposição.');
    END IF;

    -- Inserir nova aula no novo dia, mantendo os mesmos horários
    INSERT INTO public.aca_calendario (
        id_entidade, id_ciclo, observacao,
        dt_hora_ini, dt_hora_fim,
        status, id_aula_origem
    ) VALUES (
        p_id_entidade, v_aula.id_ciclo, v_aula.observacao,
        (p_nova_data + (v_aula.dt_hora_ini AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC',
        (p_nova_data + (v_aula.dt_hora_fim AT TIME ZONE 'UTC')::time) AT TIME ZONE 'UTC',
        'reagendada', p_id_aula
    ) RETURNING id INTO v_novo_id;

    RETURN jsonb_build_object('success', true, 'novo_id', v_novo_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. Atualizar RPC: aca_get_calendario_programa
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
            'ciclo_desc', COALESCE(ci.descricao, 'Ciclo'),
            'status',     COALESCE(c.status, 'agendada'),
            'id_aula_origem', c.id_aula_origem
        )
        ORDER BY c.dt_hora_ini
    )
    INTO v_aulas
    FROM public.aca_calendario c
    LEFT JOIN public.aca_ciclo ci ON ci.id = c.id_ciclo
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

    -- Fallback se não houver datas
    IF v_min_ano IS NULL THEN
        v_min_ano  := EXTRACT(YEAR FROM now())::int;
        v_max_ano  := v_min_ano;
        v_min_date := make_date(v_min_ano, 1, 1);
        v_max_date := make_date(v_max_ano, 12, 31);
    END IF;

    -- 4. Busca feriados:
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
