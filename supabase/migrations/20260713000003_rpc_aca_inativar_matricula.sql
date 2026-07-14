-- ============================================================
-- Migration: RPC aca_inativar_matricula
-- Data: 2026-07-13
-- Descrição: Altera o status de uma matrícula.
--            Usado pelo admin para inativar/cancelar/reativar
--            matrículas de alunos.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_inativar_matricula(
    p_id UUID,
    p_status TEXT DEFAULT 'inativa'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_status_atual TEXT;
    v_status_valido BOOLEAN;
BEGIN
    -- Validar status permitido
    SELECT p_status IN ('ativa', 'inativa', 'cancelada') INTO v_status_valido;
    IF NOT v_status_valido THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Status inválido. Use: ativa, inativa ou cancelada'
        );
    END IF;

    -- Verificar se a matrícula existe
    SELECT m.status INTO v_status_atual
    FROM public.aca_matricula m
    WHERE m.id = p_id;

    IF v_status_atual IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Matrícula não encontrada'
        );
    END IF;

    -- Se já está no status desejado, retorna sucesso sem alterar
    IF v_status_atual = p_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'id', p_id,
            'status', p_status,
            'message', 'Matrícula já está com este status'
        );
    END IF;

    -- Atualizar status
    UPDATE public.aca_matricula
    SET status = p_status,
        modificado_em = NOW()
    WHERE id = p_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', p_id,
        'status', p_status
    );
END;
$$;
