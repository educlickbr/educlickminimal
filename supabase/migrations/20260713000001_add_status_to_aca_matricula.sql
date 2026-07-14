-- ============================================================
-- Migration: Add status column to aca_matricula
-- Data: 2026-07-13
-- Descrição: Adiciona coluna status para controle de matrículas
--            ativas, inativas ou canceladas.
-- ============================================================

-- 1. Adicionar coluna status com default 'ativa'
ALTER TABLE public.aca_matricula
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativa';

-- 2. Constraint CHECK para valores válidos (DO block pq ADD CONSTRAINT IF NOT EXISTS não existe no PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_aca_matricula_status'
          AND conrelid = 'public.aca_matricula'::regclass
    ) THEN
        ALTER TABLE public.aca_matricula
        ADD CONSTRAINT chk_aca_matricula_status
        CHECK (status IN ('ativa', 'inativa', 'cancelada'));
    END IF;
END;
$$;

-- 3. Índice para filtrar por status (consultas administrativas)
CREATE INDEX IF NOT EXISTS idx_aca_matricula_status
    ON public.aca_matricula (status);

-- 4. Atualizar RPC aca_criar_matricula para setar status 'ativa'
-- (já é o default, mas vamos explicitar para clareza)
CREATE OR REPLACE FUNCTION public.aca_criar_matricula(
    p_id_entidade UUID,
    p_id_programa UUID,
    p_id_usuario UUID,
    p_id_pedido UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
    v_existente UUID;
BEGIN
    -- Verificar se já existe matrícula
    SELECT id INTO v_existente
    FROM public.aca_matricula
    WHERE id_programa = p_id_programa AND id_usuario = p_id_usuario;

    IF v_existente IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'id', v_existente, 'message', 'Aluno já matriculado');
    END IF;

    INSERT INTO public.aca_matricula (
        id_entidade, id_programa, id_usuario, id_pedido,
        status,
        criado_por, modificado_por
    )
    VALUES (
        p_id_entidade, p_id_programa, p_id_usuario, p_id_pedido,
        'ativa',
        COALESCE(p_usuario_id, p_id_usuario), COALESCE(p_usuario_id, p_id_usuario)
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;
