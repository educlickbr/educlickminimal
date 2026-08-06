-- ============================================================
-- Migration: 20260726000000 — Módulo Calendário de Salas (v1)
-- Descrição: Cria as tabelas de salas, grade horária por sala
--            e reservas para o calendário de salas (admin).
-- ============================================================

-- -------------------------------------------------------
-- 1. acd_sala — Salas físicas
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acd_sala (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    capacidade INTEGER,
    cor TEXT NOT NULL DEFAULT '#8b5cf6',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ,

    CONSTRAINT uq_acd_sala_entidade_nome UNIQUE (id_entidade, nome)
);

ALTER TABLE public.acd_sala ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- 2. acd_sala_horario — Grade de horários vinculada a cada sala
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acd_sala_horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_sala UUID NOT NULL REFERENCES public.acd_sala(id) ON DELETE CASCADE,
    indice INTEGER NOT NULL,
    nome_turno TEXT NOT NULL,
    hora_ini TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_acd_sala_horario_indice UNIQUE (id_sala, indice)
);

ALTER TABLE public.acd_sala_horario ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_acd_sala_horario_sala
    ON public.acd_sala_horario (id_sala);

-- -------------------------------------------------------
-- 3. acd_reserva_sala — Reservas de sala
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acd_reserva_sala (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_sala_horario UUID NOT NULL REFERENCES public.acd_sala_horario(id),
    data DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('aula', 'evento')),
    status TEXT NOT NULL DEFAULT 'reservado' CHECK (status IN ('reservado', 'cancelado')),

    -- Se for aula vinculada ao calendário acadêmico
    id_aula UUID REFERENCES public.aca_calendario(id) ON DELETE SET NULL,

    -- Se for evento avulso
    evento_nome TEXT,

    observacoes TEXT,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ,

    CONSTRAINT uq_acd_reserva_slot UNIQUE (id_sala_horario, data)
);

ALTER TABLE public.acd_reserva_sala ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_acd_reserva_data
    ON public.acd_reserva_sala (data);
CREATE INDEX IF NOT EXISTS idx_acd_reserva_range
    ON public.acd_reserva_sala (data, id_sala_horario);
CREATE INDEX IF NOT EXISTS idx_acd_reserva_id_aula
    ON public.acd_reserva_sala (id_aula);

-- -------------------------------------------------------
-- 4. RLS Policies
-- -------------------------------------------------------

-- acd_sala
CREATE POLICY "acd_sala: select para admin e membros da entidade"
    ON public.acd_sala FOR SELECT
    USING (
        (auth.jwt() ->> 'papel'::text) = 'admin'::text
        OR id_entidade IN (
            SELECT e.ent::uuid
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
        )
    );

CREATE POLICY "acd_sala: insert para admin"
    ON public.acd_sala FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

CREATE POLICY "acd_sala: update para admin"
    ON public.acd_sala FOR UPDATE
    USING ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

CREATE POLICY "acd_sala: delete para admin"
    ON public.acd_sala FOR DELETE
    USING ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

-- acd_sala_horario
CREATE POLICY "acd_sala_horario: select para admin e membros"
    ON public.acd_sala_horario FOR SELECT
    USING (
        (auth.jwt() ->> 'papel'::text) = 'admin'::text
        OR id_entidade IN (
            SELECT e.ent::uuid
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
        )
    );

CREATE POLICY "acd_sala_horario: insert para admin"
    ON public.acd_sala_horario FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

CREATE POLICY "acd_sala_horario: update para admin"
    ON public.acd_sala_horario FOR UPDATE
    USING ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

CREATE POLICY "acd_sala_horario: delete para admin"
    ON public.acd_sala_horario FOR DELETE
    USING ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

-- acd_reserva_sala
CREATE POLICY "acd_reserva_sala: select para admin e membros"
    ON public.acd_reserva_sala FOR SELECT
    USING (
        (auth.jwt() ->> 'papel'::text) = 'admin'::text
        OR id_entidade IN (
            SELECT e.ent::uuid
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
        )
    );

CREATE POLICY "acd_reserva_sala: insert para admin"
    ON public.acd_reserva_sala FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

CREATE POLICY "acd_reserva_sala: update para admin"
    ON public.acd_reserva_sala FOR UPDATE
    USING ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

CREATE POLICY "acd_reserva_sala: delete para admin"
    ON public.acd_reserva_sala FOR DELETE
    USING ((auth.jwt() ->> 'papel'::text) = 'admin'::text);

-- -------------------------------------------------------
-- 5. RPC: acd_get_salas_horarios
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
            'id', sh.id,
            'id_sala', s.id,
            'sala_nome', s.nome,
            'sala_cor', s.cor,
            'sala_capacidade', s.capacidade,
            'indice', sh.indice,
            'turno_nome', sh.nome_turno,
            'hora_ini', sh.hora_ini::text,
            'hora_fim', sh.hora_fim::text,
            'horario_total', sh.hora_ini::text || ' - ' || sh.hora_fim::text
        )
        ORDER BY s.nome, sh.indice
    ) INTO v_result
    FROM public.acd_sala_horario sh
    JOIN public.acd_sala s ON s.id = sh.id_sala
    WHERE sh.id_entidade = p_id_entidade
      AND s.ativo = true
      AND sh.ativo = true;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- -------------------------------------------------------
-- 6. RPC: acd_get_reservas_range
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
            'id_sala_horario', r.id_sala_horario,
            'data', r.data::text,
            'tipo', r.tipo,
            'status', r.status,
            'evento_nome', r.evento_nome,
            'observacoes', r.observacoes,

            -- Dados da aula vinculada
            'id_aula', r.id_aula,
            'aula_titulo', ac.observacao,
            'aula_dt_hora_ini', ac.dt_hora_ini::text,
            'aula_dt_hora_fim', ac.dt_hora_fim::text,
            'aula_status', ac.status,

            -- Dados do docente
            'id_docente', admc.id_docente,
            'docente_nome', ue.nome_completo,
            'docente_email', ue.email,

            -- Ciclo/componente
            'id_ciclo', ac.id_ciclo,
            'id_atribuicao_docente', ac.id_atribuicao_docente
        )
        ORDER BY r.data, sh.indice
    ) INTO v_result
    FROM public.acd_reserva_sala r
    JOIN public.acd_sala_horario sh ON sh.id = r.id_sala_horario
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
-- 7. RPC: acd_upsert_reserva_batch
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
    v_id_entidade UUID;
    v_count INT := 0;
BEGIN
    FOR v_rec IN SELECT * FROM jsonb_array_elements(p_reservas) LOOP
        SELECT sh.id_entidade INTO v_id_entidade
        FROM public.acd_sala_horario sh
        WHERE sh.id = (v_rec->>'id_sala_horario')::uuid;

        IF v_id_entidade IS NULL THEN CONTINUE; END IF;

        INSERT INTO public.acd_reserva_sala (
            id_entidade, id_sala_horario, data, tipo, status,
            id_aula, evento_nome, observacoes, criado_por
        ) VALUES (
            v_id_entidade,
            (v_rec->>'id_sala_horario')::uuid,
            (v_rec->>'data')::date,
            COALESCE(v_rec->>'tipo', 'evento'),
            COALESCE(v_rec->>'status', 'reservado'),
            (v_rec->>'id_aula')::uuid,
            v_rec->>'evento_nome',
            v_rec->>'observacoes',
            p_usuario_id
        )
        ON CONFLICT (id_sala_horario, data)
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
-- 8. RPC: acd_delete_reserva_sala
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_delete_reserva_sala(
    p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_deleted UUID;
BEGIN
    DELETE FROM public.acd_reserva_sala
    WHERE id = p_id
    RETURNING id INTO v_deleted;

    IF v_deleted IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Reserva não encontrada');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_deleted);
END;
$$;

-- -------------------------------------------------------
-- 9. RPC: acd_get_aulas_sem_reserva
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
-- 10. RPC: acd_get_salas_simples (para selects/dropdowns)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acd_get_salas_simples(
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
            'nome', nome,
            'cor', cor,
            'capacidade', capacidade
        )
        ORDER BY nome
    ) INTO v_result
    FROM public.acd_sala
    WHERE id_entidade = p_id_entidade AND ativo = true;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
