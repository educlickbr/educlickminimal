-- ============================================================
-- Migration: 20260727000300 — reserva_grupo_id + reserva_escopo
-- Descrição: Adiciona identificador de grupo e escopo às reservas
--            de sala. Todas as reservas criadas num mesmo lote
--            (ex: período inteiro) compartilham o mesmo grupo_id.
-- ============================================================

-- -------------------------------------------------------
-- 1. Adicionar colunas
-- -------------------------------------------------------
ALTER TABLE public.acd_reserva_sala
    ADD COLUMN IF NOT EXISTS reserva_grupo_id UUID,
    ADD COLUMN IF NOT EXISTS reserva_escopo TEXT CHECK (reserva_escopo IN ('horario', 'periodo', 'dia'));

CREATE INDEX IF NOT EXISTS idx_acd_reserva_grupo
    ON public.acd_reserva_sala (reserva_grupo_id);

-- -------------------------------------------------------
-- 2. RPC: acd_upsert_reserva_batch (com grupo + escopo)
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
    v_grupo_id UUID;
    v_count INT := 0;
BEGIN
    -- Gera um grupo_id único para todo o lote
    v_grupo_id := gen_random_uuid();

    FOR v_rec IN SELECT * FROM jsonb_array_elements(p_reservas) LOOP
        INSERT INTO public.acd_reserva_sala (
            id_entidade, id_sala, id_horario, data, tipo, status,
            id_aula, id_programa, id_evento, observacoes,
            reserva_grupo_id, reserva_escopo, criado_por
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
            v_rec->>'observacoes',
            v_grupo_id,
            COALESCE(v_rec->>'reserva_escopo', 'horario'),
            p_usuario_id
        )
        ON CONFLICT (id_sala, id_horario, data)
        DO UPDATE SET
            tipo = COALESCE(EXCLUDED.tipo, acd_reserva_sala.tipo),
            status = COALESCE(EXCLUDED.status, 'reservado'),
            id_aula = EXCLUDED.id_aula,
            id_programa = EXCLUDED.id_programa,
            id_evento = EXCLUDED.id_evento,
            observacoes = COALESCE(EXCLUDED.observacoes, acd_reserva_sala.observacoes),
            reserva_escopo = COALESCE(EXCLUDED.reserva_escopo, acd_reserva_sala.reserva_escopo),
            modificado_por = p_usuario_id,
            modificado_em = NOW();

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'qtd', v_count);
END;
$$;

-- -------------------------------------------------------
-- 3. RPC: acd_get_reservas_range (com grupo + escopo)
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
            'observacoes', r.observacoes,
            'reserva_grupo_id', r.reserva_grupo_id,
            'reserva_escopo', r.reserva_escopo,

            -- Aula
            'id_aula', r.id_aula,
            'aula_titulo', ac.observacao,
            'aula_dt_hora_ini', ac.dt_hora_ini::text,
            'aula_dt_hora_fim', ac.dt_hora_fim::text,
            'aula_status', ac.status,

            -- Programa
            'id_programa', r.id_programa,
            'programa_nome', prog.descricao,

            -- Evento
            'id_evento', r.id_evento,
            'evento_descricao', ev.nome_evento,

            -- Docente
            'id_docente', admc.id_docente,
            'docente_nome', ue.nome_completo,
            'docente_email', ue.email,

            -- Ciclo
            'id_ciclo', ac.id_ciclo,
            'id_atribuicao_docente', ac.id_atribuicao_docente
        )
        ORDER BY r.data, h.indice
    ) INTO v_result
    FROM public.acd_reserva_sala r
    JOIN public.acd_horario h ON h.id = r.id_horario
    LEFT JOIN public.aca_calendario ac ON ac.id = r.id_aula
    LEFT JOIN public.aca_programa prog ON prog.id = COALESCE(r.id_programa, (
        SELECT cp.id_programa FROM public.aca_ciclo_programa cp WHERE cp.id_ciclo = ac.id_ciclo LIMIT 1
    ))
    LEFT JOIN public.aca_evento ev ON ev.id = r.id_evento
    LEFT JOIN public.aca_docente_modulo_componente_ciclo admc ON admc.id = ac.id_atribuicao_docente
    LEFT JOIN public.aca_docente d ON d.id = admc.id_docente
    LEFT JOIN public.user_expandido ue ON ue.id = d.id_user_expandido
    WHERE r.id_entidade = p_id_entidade
      AND r.data >= p_data_inicio
      AND r.data <= p_data_fim
      AND r.status = 'reservado';

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
