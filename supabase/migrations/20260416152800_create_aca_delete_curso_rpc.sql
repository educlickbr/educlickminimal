-- ============================================================
-- RPC: aca_delete_curso
-- Data: 2026-04-16
-- Descrição: Trata exclusão de curso e fornece aviso sobre vínculos
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_delete_curso(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_programa_desc TEXT;
    v_deleted_id UUID;
BEGIN
    -- 1. Verifica se possui Programas (Turmas)
    SELECT p.descricao INTO v_programa_desc
    FROM public.aca_programa p
    WHERE p.id_curso = p_id AND p.id_entidade = p_id_entidade
    LIMIT 1;

    IF v_programa_desc IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Este curso possui turmas ou programas vinculados (ex: "' || v_programa_desc || '"). Exclua as turmas associadas e tente novamente.'
        );
    END IF;

    -- Executa a exclusão (Grade de Módulos, Áreas e Projeto Pedagógico serão excluídos via CASCADE)
    DELETE FROM public.aca_curso
    WHERE id = p_id 
      AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Curso não encontrado ou sem permissão para excluir'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_deleted_id,
        'message', 'Curso excluído com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;
