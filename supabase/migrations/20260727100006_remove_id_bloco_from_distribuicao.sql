-- ============================================================
-- Migration: remove_id_bloco_from_distribuicao
-- Data: 2026-07-27
-- Descrição: Remove id_bloco do lms_distribuicao e
--            lms_conteudo_operacional. A relação bloco ↔ conteúdo
--            já é gerida pelo lms_conteudo_bloco (Repositório).
--            A distribuição e o currículo trabalham sempre no
--            nível atômico do CONTEÚDO.
-- ============================================================

-- 1. Remove constraints que referenciam id_bloco
ALTER TABLE public.lms_distribuicao
    DROP CONSTRAINT IF EXISTS lms_distribuicao_alvo_check,
    DROP CONSTRAINT IF EXISTS lms_distribuicao_id_bloco_fkey;

ALTER TABLE public.lms_conteudo_operacional
    DROP CONSTRAINT IF EXISTS lms_operacional_alvo_check,
    DROP CONSTRAINT IF EXISTS lms_conteudo_operacional_id_bloco_fkey;

-- 2. Remove coluna id_bloco
ALTER TABLE public.lms_distribuicao
    DROP COLUMN IF EXISTS id_bloco;

ALTER TABLE public.lms_conteudo_operacional
    DROP COLUMN IF EXISTS id_bloco;

-- 3. Torna id_conteudo NOT NULL (agora é o único alvo)
--    Mas mantém a FK existente. Se o conteúdo for deletado,
--    a distribuição/currículo também é removida (CASCADE).
--    NOTA: se a FK atual for ON DELETE CASCADE, manter. Se for
--    ON DELETE SET NULL, ajustar.
DO $$
BEGIN
    -- Verifica se a coluna já é NOT NULL antes de alterar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lms_distribuicao' AND column_name = 'id_conteudo'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.lms_distribuicao
            ALTER COLUMN id_conteudo SET NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lms_conteudo_operacional' AND column_name = 'id_conteudo'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.lms_conteudo_operacional
            ALTER COLUMN id_conteudo SET NOT NULL;
    END IF;
END;
$$;

-- 4. Reajusta índices (remove os de bloco)
DROP INDEX IF EXISTS idx_lms_distribuicao_bloco;
DROP INDEX IF EXISTS idx_lms_op_bloco;
