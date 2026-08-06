-- ============================================================
-- Migration: fix_unique_operacional_idx
-- Data: 2026-07-27
-- Descrição: Remove constraint antiga e cria índice único
--            funcional que trata NULLs corretamente.
-- ============================================================

-- Remove constraint (que criou um índice por baixo)
ALTER TABLE public.lms_conteudo_operacional
    DROP CONSTRAINT IF EXISTS lms_conteudo_operacional_unique;

-- Remove índice residual se existir
DROP INDEX IF EXISTS lms_conteudo_operacional_unique;

-- Cria índice único funcional (trata NULLs como '0000...')
CREATE UNIQUE INDEX IF NOT EXISTS lms_conteudo_operacional_unique
    ON public.lms_conteudo_operacional
    (id_conteudo, id_programa,
     COALESCE(id_ciclo, '00000000-0000-0000-0000-000000000000'::uuid),
     COALESCE(id_calendario, '00000000-0000-0000-0000-000000000000'::uuid));
