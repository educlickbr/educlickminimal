-- ============================================================
-- Migration: 20260724000004 — RLS policies for academic tables
-- Descrição: Adiciona políticas RLS para tabelas acadêmicas
--            que não tinham: aca_programa, aca_ciclo,
--            aca_ciclo_programa, aca_modulo, aca_modulo_componente,
--            aca_componente, aca_calendario
-- ============================================================

-- -------------------------------------------------------
-- 1. aca_programa
-- -------------------------------------------------------
CREATE POLICY "aca_programa: admin e membros podem ver"
    ON public.aca_programa FOR SELECT
    USING (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid = aca_programa.id_entidade
        ))
    );

-- -------------------------------------------------------
-- 2. aca_ciclo
-- -------------------------------------------------------
CREATE POLICY "aca_ciclo: admin e membros podem ver"
    ON public.aca_ciclo FOR SELECT
    USING (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid = aca_ciclo.id_entidade
        ))
    );

-- -------------------------------------------------------
-- 3. aca_ciclo_programa
-- -------------------------------------------------------
CREATE POLICY "aca_ciclo_programa: admin e membros podem ver"
    ON public.aca_ciclo_programa FOR SELECT
    USING (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid = aca_ciclo_programa.id_entidade
        ))
    );

-- -------------------------------------------------------
-- 4. aca_modulo
-- -------------------------------------------------------
CREATE POLICY "aca_modulo: admin e membros podem ver"
    ON public.aca_modulo FOR SELECT
    USING (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid = aca_modulo.id_entidade
        ))
    );

-- -------------------------------------------------------
-- 5. aca_modulo_componente
-- -------------------------------------------------------
CREATE POLICY "aca_modulo_componente: admin e membros podem ver"
    ON public.aca_modulo_componente FOR SELECT
    USING (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid = aca_modulo_componente.id_entidade
        ))
    );

-- -------------------------------------------------------
-- 6. aca_componente
-- -------------------------------------------------------
CREATE POLICY "aca_componente: admin e membros podem ver"
    ON public.aca_componente FOR SELECT
    USING (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid = aca_componente.id_entidade
        ))
    );

-- -------------------------------------------------------
-- 7. aca_calendario
-- -------------------------------------------------------
CREATE POLICY "aca_calendario: admin e membros podem ver"
    ON public.aca_calendario FOR SELECT
    USING (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid IN (
                SELECT c.id_entidade
                FROM public.aca_ciclo c
                WHERE c.id = aca_calendario.id_ciclo
            )
        ))
    );
