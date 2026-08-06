-- ============================================================
-- Migration: 20260727000000 — Adiciona id_evento + id_programa
-- Descrição: Complementa acd_reserva_sala com FK para eventos
--            (aca_evento) e programas (aca_programa), permitindo
--            vincular reservas diretamente a essas entidades.
-- ============================================================

-- -------------------------------------------------------
-- 1. Adicionar coluna id_programa
-- -------------------------------------------------------
ALTER TABLE public.acd_reserva_sala
    ADD COLUMN IF NOT EXISTS id_programa UUID
    REFERENCES public.aca_programa(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_acd_reserva_id_programa
    ON public.acd_reserva_sala (id_programa);

-- -------------------------------------------------------
-- 2. Adicionar coluna id_evento
-- -------------------------------------------------------
ALTER TABLE public.acd_reserva_sala
    ADD COLUMN IF NOT EXISTS id_evento UUID
    REFERENCES public.aca_evento(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_acd_reserva_id_evento
    ON public.acd_reserva_sala (id_evento);

-- -------------------------------------------------------
-- 3. Atualizar RPC acd_get_reservas_range (inclui novos campos)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_get_reservas_range(
    p_id_entidade UUID,
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', r.id,
            'id_sala', r.id_sala,
            'id_horario', r.id_horario,
            'slot_key', r.id_sala::text || '_' || r.id_horario::text,
            'data', r.data::text,
            'tipo', r.tipo,
            'status', r.status,
            'evento_nome', r.evento_nome,
            'observacoes', r.observacoes,

            -- Aula vinculada
            'id_aula', r.id_aula,
            'aula_titulo', ac.observacao,
            'aula_dt_hora_ini', ac.dt_hora_ini::text,
            'aula_dt_hora_fim', ac.dt_hora_fim::text,
            'aula_status', ac.status,

            -- Programa (direto ou via aula)
            'id_programa', r.id_programa,
            'programa_nome', prog.descricao,

            -- Evento
            'id_evento', r.id_evento,
            'evento_descricao', ev.nome_evento,

            -- Docente
            'id_docente', admc.id_docente,
            'docente_nome', ue.nome_completo,
            'docente_email', ue.email,

            -- Ciclo/componente
            'id_ciclo', ac.id_ciclo,
            'id_atribuicao_docente', ac.id_atribuicao_docente
        )
        ORDER BY r.data, h.indice
    ) INTO v_result
    FROM public.acd_reserva_sala r
    JOIN public.acd_horario h ON h.id = r.id_horario
    LEFT JOIN public.aca_calendario ac ON ac.id = r.id_aula
    LEFT JOIN public.aca_programa prog ON prog.id = COALESCE(r.id_programa, (
        SELECT cp.id_programa FROM public.aca_ciclo_programa cp
        WHERE cp.id_ciclo = ac.id_ciclo LIMIT 1
    ))
    LEFT JOIN public.aca_evento ev ON ev.id = r.id_evento
    LEFT JOIN public.aca_docente_modulo_componente_ciclo admc
        ON admc.id = ac.id_atribuicao_docente
    LEFT JOIN public.aca_docente d ON d.id = admc.id_docente
    LEFT JOIN public.user_expandido ue ON ue.id = d.id_user_expandido
    WHERE r.id_entidade = p_id_entidade
      AND r.data >= p_data_inicio
      AND r.data <= p_data_fim
      AND r.status = 'reservado';

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- -------------------------------------------------------
-- 4. Atualizar RPC acd_get_aulas_sem_reserva (inclui id_programa)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_get_aulas_sem_reserva(
    p_id_entidade UUID,
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ac.id,
            'dt_hora_ini', ac.dt_hora_ini::text,
            'dt_hora_fim', ac.dt_hora_fim::text,
            'observacao', ac.observacao,
            'status', ac.status,
            'data', (ac.dt_hora_ini AT TIME ZONE 'America/Sao_Paulo')::date,
            'hora_ini', (ac.dt_hora_ini AT TIME ZONE 'America/Sao_Paulo')::time,
            'hora_fim', (ac.dt_hora_fim AT TIME ZONE 'America/Sao_Paulo')::time,
            'id_ciclo', ac.id_ciclo,
            'id_atribuicao_docente', ac.id_atribuicao_docente,
            'id_programa', prog.id,
            'programa_nome', prog.descricao,
            'id_docente', d.id,
            'docente_nome', ue.nome_completo,
            'ciclo_nome', ciclo.nome,
            'componente_nome', comp.nome
        )
    ) INTO v_result
    FROM public.aca_calendario ac
    JOIN public.aca_ciclo ciclo ON ciclo.id = ac.id_ciclo
    JOIN public.aca_ciclo_programa cp ON cp.id_ciclo = ciclo.id
    JOIN public.aca_programa prog ON prog.id = cp.id_programa
    LEFT JOIN public.aca_docente_modulo_componente_ciclo admc
        ON admc.id = ac.id_atribuicao_docente
    LEFT JOIN public.aca_docente d ON d.id = admc.id_docente
    LEFT JOIN public.user_expandido ue ON ue.id = d.id_user_expandido
    LEFT JOIN public.aca_modulo_componente mc ON mc.id = admc.id_modulo_componente
    LEFT JOIN public.aca_componente comp ON comp.id = mc.id_componente
    WHERE ac.id_entidade = p_id_entidade
      AND (ac.dt_hora_ini AT TIME ZONE 'America/Sao_Paulo')::date >= p_data_inicio
      AND (ac.dt_hora_ini AT TIME ZONE 'America/Sao_Paulo')::date <= p_data_fim
      AND ac.status = 'agendada'
      AND NOT EXISTS (
          SELECT 1 FROM public.acd_reserva_sala r
          WHERE r.id_aula = ac.id AND r.status = 'reservado'
      )
    ORDER BY ac.dt_hora_ini;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- -------------------------------------------------------
-- 5. Nova RPC: acd_get_eventos_range
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_get_eventos_range(
    p_id_entidade UUID,
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'nome_evento', nome_evento,
            'data_inicio', data_inicio::text,
            'data_fim', data_fim::text,
            'descricao', descricao
        )
        ORDER BY data_inicio
    ) INTO v_result
    FROM public.aca_evento
    WHERE id_entidade = p_id_entidade
      AND data_inicio <= p_data_fim
      AND data_fim >= p_data_inicio;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- -------------------------------------------------------
-- 6. Atualizar RPC acd_upsert_reserva_batch (inclui novos campos)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_upsert_reserva_batch(
    p_reservas JSONB,
    p_usuario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_rec JSONB;
    v_count INT := 0;
BEGIN
    FOR v_rec IN SELECT * FROM jsonb_array_elements(p_reservas) LOOP
        INSERT INTO public.acd_reserva_sala (
            id_entidade, id_sala, id_horario, data, tipo, status,
            id_aula, id_programa, id_evento, evento_nome, observacoes, criado_por
        ) VALUES (
            (v_rec->>'id_entidade')::uuid,
            (v_rec->>'id_sala')::uuid,
            (v_rec->>'id_horario')::uuid,
            (v_rec->>'data')::date,
            COALESCE(v_rec->>'tipo', 'evento'),
            COALESCE(v_rec->>'status', 'reservado'),
            (v_rec->>'id_aula')::uuid,
            (v_rec->>'id_programa')::uuid,
            (v_rec->>'id_evento')::uuid,
            v_rec->>'evento_nome',
            v_rec->>'observacoes',
            p_usuario_id
        )
        ON CONFLICT (id_sala, id_horario, data)
        DO UPDATE SET
            tipo = COALESCE(EXCLUDED.tipo, acd_reserva_sala.tipo),
            status = COALESCE(EXCLUDED.status, 'reservado'),
            id_aula = EXCLUDED.id_aula,
            id_programa = EXCLUDED.id_programa,
            id_evento = EXCLUDED.id_evento,
            evento_nome = EXCLUDED.evento_nome,
            observacoes = EXCLUDED.observacoes,
            modificado_por = p_usuario_id,
            modificado_em = NOW();

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'qtd', v_count);
END;
$$;
