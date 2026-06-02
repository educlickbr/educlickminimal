-- ============================================================
-- RPC: aca_delete_area
-- Data: 2026-04-16
-- Descrição: Exclui uma área educacional
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_delete_area(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_deleted_id UUID;
BEGIN
    DELETE FROM public.aca_area
    WHERE id = p_id 
      AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Área não encontrada ou sem permissão para excluir'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_deleted_id,
        'message', 'Área excluída com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;
