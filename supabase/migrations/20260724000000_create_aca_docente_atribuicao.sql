-- ============================================================
-- Migration: 20260724000000 — create aca_docente_atribuicao
-- Descrição: Cria a tabela de atribuição de docentes a
--            (ciclo × módulo_componente) e adiciona a coluna
--            id_atribuicao_docente em aca_calendario.
--
--            A atribuição vincula um docente a um componente
--            dentro de um ciclo específico (iteração do módulo),
--            permitindo múltiplos docentes por (ciclo, componente)
--            com papéis distintos (titular, substituto, auxiliar).
-- ============================================================

-- -------------------------------------------------------
-- 1. Tabela: aca_docente_modulo_componente_ciclo
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aca_docente_modulo_componente_ciclo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ciclo UUID NOT NULL REFERENCES public.aca_ciclo(id) ON DELETE CASCADE,
    id_modulo_componente UUID NOT NULL REFERENCES public.aca_modulo_componente(id) ON DELETE CASCADE,
    id_docente UUID NOT NULL REFERENCES public.aca_docente(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL DEFAULT 'titular'
        CHECK (tipo IN ('titular', 'substituto', 'auxiliar')),
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ,

    -- Um mesmo docente só pode ter um papel por (ciclo, componente)
    UNIQUE(id_ciclo, id_modulo_componente, id_docente)
);

ALTER TABLE public.aca_docente_modulo_componente_ciclo ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- 2. Índices
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_aca_docente_atribuicao_ciclo
    ON public.aca_docente_modulo_componente_ciclo (id_ciclo);
CREATE INDEX IF NOT EXISTS idx_aca_docente_atribuicao_modcomp
    ON public.aca_docente_modulo_componente_ciclo (id_modulo_componente);
CREATE INDEX IF NOT EXISTS idx_aca_docente_atribuicao_docente
    ON public.aca_docente_modulo_componente_ciclo (id_docente);

-- -------------------------------------------------------
-- 3. Coluna em aca_calendario para vínculo com atribuição
-- -------------------------------------------------------
ALTER TABLE public.aca_calendario
ADD COLUMN IF NOT EXISTS id_atribuicao_docente UUID
    REFERENCES public.aca_docente_modulo_componente_ciclo(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_aca_calendario_atribuicao
    ON public.aca_calendario (id_atribuicao_docente);

-- -------------------------------------------------------
-- 4. RLS — Policies
-- -------------------------------------------------------
CREATE POLICY "aca_docente_atribuicao: select para admin e membros da entidade"
    ON public.aca_docente_modulo_componente_ciclo
    FOR SELECT
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid IN (
                SELECT c.id_entidade
                FROM public.aca_ciclo c
                WHERE c.id = aca_docente_modulo_componente_ciclo.id_ciclo
            )
        ))
    );

CREATE POLICY "aca_docente_atribuicao: insert para admin e membros da entidade"
    ON public.aca_docente_modulo_componente_ciclo
    FOR INSERT
    WITH CHECK (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid IN (
                SELECT c.id_entidade
                FROM public.aca_ciclo c
                WHERE c.id = id_ciclo
            )
        ))
    );

CREATE POLICY "aca_docente_atribuicao: update para admin e membros da entidade"
    ON public.aca_docente_modulo_componente_ciclo
    FOR UPDATE
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid IN (
                SELECT c.id_entidade
                FROM public.aca_ciclo c
                WHERE c.id = id_ciclo
            )
        ))
    );

CREATE POLICY "aca_docente_atribuicao: delete para admin e membros da entidade"
    ON public.aca_docente_modulo_componente_ciclo
    FOR DELETE
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE e.ent::uuid IN (
                SELECT c.id_entidade
                FROM public.aca_ciclo c
                WHERE c.id = id_ciclo
            )
        ))
    );
