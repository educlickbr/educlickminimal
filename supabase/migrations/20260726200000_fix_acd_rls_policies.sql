-- ============================================================
-- Migration: 20260726200000 — Fix RLS policies for acd_* tables
-- Descrição: As policies originais permitiam apenas admin.
--            Agora seguem o padrão do projeto: admin OU aca_%
--            com verificação de entidade via JWT.
-- ============================================================

-- -------------------------------------------------------
-- 1. Remover policies antigas das 3 tabelas
-- -------------------------------------------------------
DROP POLICY IF EXISTS "acd_sala: select para admin e membros da entidade" ON public.acd_sala;
DROP POLICY IF EXISTS "acd_sala: insert para admin" ON public.acd_sala;
DROP POLICY IF EXISTS "acd_sala: update para admin" ON public.acd_sala;
DROP POLICY IF EXISTS "acd_sala: delete para admin" ON public.acd_sala;

DROP POLICY IF EXISTS "acd_horario: select para admin e membros" ON public.acd_horario;
DROP POLICY IF EXISTS "acd_horario: insert para admin" ON public.acd_horario;
DROP POLICY IF EXISTS "acd_horario: update para admin" ON public.acd_horario;
DROP POLICY IF EXISTS "acd_horario: delete para admin" ON public.acd_horario;

DROP POLICY IF EXISTS "acd_reserva_sala: select para admin e membros" ON public.acd_reserva_sala;
DROP POLICY IF EXISTS "acd_reserva_sala: insert para admin" ON public.acd_reserva_sala;
DROP POLICY IF EXISTS "acd_reserva_sala: update para admin" ON public.acd_reserva_sala;
DROP POLICY IF EXISTS "acd_reserva_sala: delete para admin" ON public.acd_reserva_sala;

-- -------------------------------------------------------
-- 2. Criar policies unificadas (ALL) para cada tabela
-- -------------------------------------------------------

-- acd_sala
CREATE POLICY acd_policy_all_access_acd_sala ON public.acd_sala
    AS PERMISSIVE
    FOR ALL
    USING (
        (
            (auth.jwt() ->> 'papel'::text) = 'admin'::text
            OR (auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text
        )
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
            WHERE (e.ent_id)::uuid = acd_sala.id_entidade
        )
    )
    WITH CHECK (
        (
            (auth.jwt() ->> 'papel'::text) = 'admin'::text
            OR (auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text
        )
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
            WHERE (e.ent_id)::uuid = acd_sala.id_entidade
        )
    );

-- acd_horario
CREATE POLICY acd_policy_all_access_acd_horario ON public.acd_horario
    AS PERMISSIVE
    FOR ALL
    USING (
        (
            (auth.jwt() ->> 'papel'::text) = 'admin'::text
            OR (auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text
        )
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
            WHERE (e.ent_id)::uuid = acd_horario.id_entidade
        )
    )
    WITH CHECK (
        (
            (auth.jwt() ->> 'papel'::text) = 'admin'::text
            OR (auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text
        )
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
            WHERE (e.ent_id)::uuid = acd_horario.id_entidade
        )
    );

-- acd_reserva_sala
CREATE POLICY acd_policy_all_access_acd_reserva_sala ON public.acd_reserva_sala
    AS PERMISSIVE
    FOR ALL
    USING (
        (
            (auth.jwt() ->> 'papel'::text) = 'admin'::text
            OR (auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text
        )
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
            WHERE (e.ent_id)::uuid = acd_reserva_sala.id_entidade
        )
    )
    WITH CHECK (
        (
            (auth.jwt() ->> 'papel'::text) = 'admin'::text
            OR (auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text
        )
        AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
            WHERE (e.ent_id)::uuid = acd_reserva_sala.id_entidade
        )
    );
