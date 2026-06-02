-- ============================================================
-- RPC: aca_delete_modulo
-- Data: 2026-04-16
-- Descrição: Trata exclusão de módulo e fornece aviso sobre vínculos
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_delete_modulo(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_curso_nome TEXT;
    v_plano_titulo TEXT;
    v_ciclo_desc TEXT;
    v_deleted_id UUID;
BEGIN
    -- 1. Verifica se está sendo usado em algum Curso
    SELECT c.nome_curso INTO v_curso_nome
    FROM public.aca_curso_modulo cm
    JOIN public.aca_curso c ON c.id = cm.id_curso
    WHERE cm.id_modulo = p_id AND cm.id_entidade = p_id_entidade
    LIMIT 1;

    IF v_curso_nome IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Este módulo está inserido na grade do curso "' || v_curso_nome || '". Remova-o da grade do curso antes de excluí-lo.'
        );
    END IF;

    -- 2. Verifica se possui Planos de Aula vinculados
    SELECT p.titulo_plano INTO v_plano_titulo
    FROM public.aca_plano_de_aula p
    WHERE p.id_modulo = p_id AND p.id_entidade = p_id_entidade
    LIMIT 1;

    IF v_plano_titulo IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Há planos de aula cadastrados neste módulo (ex: "' || v_plano_titulo || '"). Exclua os planos de aula primeiro.'
        );
    END IF;

    -- 3. Verifica se possui Ciclos/Turmas
    SELECT c.descricao INTO v_ciclo_desc
    FROM public.aca_ciclo c
    WHERE c.id_modulo = p_id AND c.id_entidade = p_id_entidade
    LIMIT 1;

    IF v_ciclo_desc IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Este módulo possui ciclos agendados (ex: "' || v_ciclo_desc || '"). Exclua os ciclos vinculados primeiro.'
        );
    END IF;

    -- Executa a exclusão (Carga Horária será excluída via CASCADE caso exista, se configurado assim no banco)
    DELETE FROM public.aca_modulo
    WHERE id = p_id 
      AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Módulo não encontrado ou sem permissão para excluir'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_deleted_id,
        'message', 'Módulo excluído com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;
