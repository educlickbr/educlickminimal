-- ============================================================
-- Migration: 20260726100000 — Refatora horários para globais
-- Descrição: Transforma acd_sala_horario (por sala) em acd_horario
--            (global). As reservas passam a usar id_sala + id_horario
--            separados em vez de id_sala_horario composto.
--
-- Pré-requisito: 20260726000000 (v1)
-- ============================================================

-- -------------------------------------------------------
-- 1. Criar acd_horario (tabela global, sem id_sala)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acd_horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    indice INTEGER NOT NULL,
    nome_turno TEXT NOT NULL,
    hora_ini TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_acd_horario_indice UNIQUE (id_entidade, indice)
);

ALTER TABLE public.acd_horario ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- 2. Migrar dados de acd_sala_horario → acd_horario
--    (deduplicado: mesmos horários viram um único registro global)
-- -------------------------------------------------------
INSERT INTO public.acd_horario (id_entidade, indice, nome_turno, hora_ini, hora_fim, ativo, criado_em)
SELECT DISTINCT ON (sh.id_entidade, sh.indice)
    sh.id_entidade,
    sh.indice,
    sh.nome_turno,
    sh.hora_ini,
    sh.hora_fim,
    bool_or(sh.ativo) OVER (PARTITION BY sh.id_entidade, sh.indice),
    MIN(sh.criado_em) OVER (PARTITION BY sh.id_entidade, sh.indice)
FROM public.acd_sala_horario sh
WHERE NOT EXISTS (
    SELECT 1 FROM public.acd_horario h
    WHERE h.id_entidade = sh.id_entidade AND h.indice = sh.indice
);

-- -------------------------------------------------------
-- 3. Adicionar colunas id_sala e id_horario em acd_reserva_sala
-- -------------------------------------------------------
ALTER TABLE public.acd_reserva_sala
    ADD COLUMN IF NOT EXISTS id_sala UUID REFERENCES public.acd_sala(id),
    ADD COLUMN IF NOT EXISTS id_horario UUID REFERENCES public.acd_horario(id);

-- -------------------------------------------------------
-- 4. Backfill: popular id_sala e id_horario a partir de acd_sala_horario
-- -------------------------------------------------------
UPDATE public.acd_reserva_sala r
SET
    id_sala = sh.id_sala,
    id_horario = h.id
FROM public.acd_sala_horario sh
LEFT JOIN public.acd_horario h
    ON h.id_entidade = sh.id_entidade
    AND h.indice = sh.indice
WHERE r.id_sala_horario = sh.id
  AND r.id_sala IS NULL;

-- -------------------------------------------------------
-- 5. Tornar NOT NULL as novas colunas
-- -------------------------------------------------------
ALTER TABLE public.acd_reserva_sala
    ALTER COLUMN id_sala SET NOT NULL,
    ALTER COLUMN id_horario SET NOT NULL;

-- -------------------------------------------------------
-- 6. Remover FK antiga e coluna id_sala_horario
-- -------------------------------------------------------
ALTER TABLE public.acd_reserva_sala
    DROP CONSTRAINT IF EXISTS acd_reserva_sala_id_sala_horario_fkey,
    DROP COLUMN IF EXISTS id_sala_horario;

-- -------------------------------------------------------
-- 7. Remover tabela acd_sala_horario e suas policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS "acd_sala_horario: select para admin e membros"
    ON public.acd_sala_horario;
DROP POLICY IF EXISTS "acd_sala_horario: insert para admin"
    ON public.acd_sala_horario;
DROP POLICY IF EXISTS "acd_sala_horario: update para admin"
    ON public.acd_sala_horario;
DROP POLICY IF EXISTS "acd_sala_horario: delete para admin"
    ON public.acd_sala_horario;
DROP TABLE IF EXISTS public.acd_sala_horario;

-- -------------------------------------------------------
-- 8. Atualizar unique constraint em acd_reserva_sala
-- -------------------------------------------------------
ALTER TABLE public.acd_reserva_sala
    DROP CONSTRAINT IF EXISTS uq_acd_reserva_slot,
    ADD CONSTRAINT uq_acd_reserva_slot UNIQUE (id_sala, id_horario, data);

-- -------------------------------------------------------
-- 9. Novos índices
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_acd_reserva_sala
    ON public.acd_reserva_sala (id_sala);
CREATE INDEX IF NOT EXISTS idx_acd_reserva_horario
    ON public.acd_reserva_sala (id_horario);
DROP INDEX IF EXISTS idx_acd_reserva_range;
CREATE INDEX IF NOT EXISTS idx_acd_reserva_range
    ON public.acd_reserva_sala (data, id_sala, id_horario);

-- -------------------------------------------------------
-- 10. RLS Policies para acd_horario
-- -------------------------------------------------------
CREATE POLICY "acd_horario: select para admin e membros"
    ON public.acd_horario FOR SELECT
    USING (
        (auth.jwt() ->> 'papel'::text) = 'admin'::text
        OR id_entidade IN (
            SELECT e.ent::uuid
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
        )
    );

CREATE POLICY "acd_horario: insert para admin"
    ON public.acd_horario FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

CREATE POLICY "acd_horario: update para admin"
    ON public.acd_horario FOR UPDATE
    USING ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

CREATE POLICY "acd_horario: delete para admin"
    ON public.acd_horario FOR DELETE
    USING ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

-- -------------------------------------------------------
-- 11. RPC: acd_get_salas_horarios (CROSS JOIN)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_get_salas_horarios(
    p_id_entidade UUID
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
            'id_sala', s.id,
            'id_horario', h.id,
            'slot_key', s.id::text || '_' || h.id::text,
            'sala_nome', s.nome,
            'sala_cor', s.cor,
            'sala_id', s.id,
            'horario_id', h.id,
            'indice', h.indice,
            'turno_nome', h.nome_turno,
            'hora_ini', h.hora_ini::text,
            'hora_fim', h.hora_fim::text,
            'horario_total', h.hora_ini::text || ' - ' || h.hora_fim::text
        )
        ORDER BY s.nome, h.indice
    ) INTO v_result
    FROM public.acd_sala s
    CROSS JOIN public.acd_horario h
    WHERE s.id_entidade = p_id_entidade
      AND h.id_entidade = p_id_entidade
      AND s.ativo = true
      AND h.ativo = true;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- -------------------------------------------------------
-- 12. RPC: acd_get_reservas_range (atualizada)
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
            'id_aula', r.id_aula,
            'aula_titulo', ac.observacao,
            'aula_dt_hora_ini', ac.dt_hora_ini::text,
            'aula_dt_hora_fim', ac.dt_hora_fim::text,
            'aula_status', ac.status,
            'id_docente', admc.id_docente,
            'docente_nome', ue.nome_completo,
            'docente_email', ue.email,
            'id_ciclo', ac.id_ciclo,
            'id_atribuicao_docente', ac.id_atribuicao_docente
        )
        ORDER BY r.data, h.indice
    ) INTO v_result
    FROM public.acd_reserva_sala r
    JOIN public.acd_horario h ON h.id = r.id_horario
    LEFT JOIN public.aca_calendario ac ON ac.id = r.id_aula
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
-- 13. RPC: acd_upsert_reserva_batch (atualizada)
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
            id_aula, evento_nome, observacoes, criado_por
        ) VALUES (
            (v_rec->>'id_entidade')::uuid,
            (v_rec->>'id_sala')::uuid,
            (v_rec->>'id_horario')::uuid,
            (v_rec->>'data')::date,
            COALESCE(v_rec->>'tipo', 'evento'),
            COALESCE(v_rec->>'status', 'reservado'),
            (v_rec->>'id_aula')::uuid,
            v_rec->>'evento_nome',
            v_rec->>'observacoes',
            p_usuario_id
        )
        ON CONFLICT (id_sala, id_horario, data)
        DO UPDATE SET
            tipo = COALESCE(EXCLUDED.tipo, acd_reserva_sala.tipo),
            status = COALESCE(EXCLUDED.status, 'reservado'),
            id_aula = EXCLUDED.id_aula,
            evento_nome = EXCLUDED.evento_nome,
            observacoes = EXCLUDED.observacoes,
            modificado_por = p_usuario_id,
            modificado_em = NOW();

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'qtd', v_count);
END;
$$;

-- -------------------------------------------------------
-- 14. RPC: acd_get_aulas_sem_reserva (atualizada, sem ref a sh)
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
            'id_docente', d.id,
            'docente_nome', ue.nome_completo,
            'ciclo_nome', ciclo.nome,
            'programa_nome', prog.descricao,
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
-- 15. RPC: acd_get_horarios (lista slots globais)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_get_horarios(
    p_id_entidade UUID
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
            'indice', indice,
            'nome_turno', nome_turno,
            'hora_ini', hora_ini::text,
            'hora_fim', hora_fim::text,
            'ativo', ativo
        )
        ORDER BY indice
    ) INTO v_result
    FROM public.acd_horario
    WHERE id_entidade = p_id_entidade;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- -------------------------------------------------------
-- 16. RPC: acd_upsert_sala
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_upsert_sala(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_nome TEXT DEFAULT NULL,
    p_cor TEXT DEFAULT '#8b5cf6',
    p_capacidade INTEGER DEFAULT NULL,
    p_ativo BOOLEAN DEFAULT true,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NOT NULL THEN
        UPDATE public.acd_sala
        SET nome = COALESCE(p_nome, nome),
            cor = COALESCE(p_cor, cor),
            capacidade = COALESCE(p_capacidade, capacidade),
            ativo = COALESCE(p_ativo, ativo),
            modificado_por = p_usuario_id,
            modificado_em = NOW()
        WHERE id = p_id AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;
    ELSE
        INSERT INTO public.acd_sala (id_entidade, nome, cor, capacidade, ativo, criado_por)
        VALUES (p_id_entidade, p_nome, p_cor, p_capacidade, p_ativo, p_usuario_id)
        RETURNING id INTO v_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- -------------------------------------------------------
-- 17. RPC: acd_delete_sala
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_delete_sala(
    p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_deleted UUID;
BEGIN
    DELETE FROM public.acd_sala WHERE id = p_id RETURNING id INTO v_deleted;

    IF v_deleted IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Sala não encontrada');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_deleted);
END;
$$;

-- -------------------------------------------------------
-- 18. RPC: acd_upsert_horario
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_upsert_horario(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_indice INTEGER DEFAULT NULL,
    p_nome_turno TEXT DEFAULT NULL,
    p_hora_ini TIME DEFAULT NULL,
    p_hora_fim TIME DEFAULT NULL,
    p_ativo BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NOT NULL THEN
        UPDATE public.acd_horario
        SET indice = COALESCE(p_indice, indice),
            nome_turno = COALESCE(p_nome_turno, nome_turno),
            hora_ini = COALESCE(p_hora_ini, hora_ini),
            hora_fim = COALESCE(p_hora_fim, hora_fim),
            ativo = COALESCE(p_ativo, ativo)
        WHERE id = p_id AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;
    ELSE
        INSERT INTO public.acd_horario (id_entidade, indice, nome_turno, hora_ini, hora_fim, ativo)
        VALUES (p_id_entidade, p_indice, p_nome_turno, p_hora_ini, p_hora_fim, p_ativo)
        RETURNING id INTO v_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- -------------------------------------------------------
-- 19. RPC: acd_delete_horario
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_delete_horario(
    p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_deleted UUID;
BEGIN
    DELETE FROM public.acd_horario WHERE id = p_id RETURNING id INTO v_deleted;

    IF v_deleted IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Horário não encontrado');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_deleted);
END;
$$;
