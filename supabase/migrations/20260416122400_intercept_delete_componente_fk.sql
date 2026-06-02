-- ============================================================
-- RPC: aca_delete_componente (Atualização)
-- Data: 2026-04-16
-- Descrição: Tratamento amigável para chave estrangeira de Plano de Aula e Módulos
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_delete_componente(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_plano_aula TEXT;
    v_modulo TEXT;
    v_deleted_id UUID;
BEGIN
    -- 1. Verifica se está sendo usado em algum Plano de Aula
    SELECT titulo_plano INTO v_plano_aula
    FROM public.aca_plano_de_aula
    WHERE id_componente = p_id AND id_entidade = p_id_entidade
    LIMIT 1;

    IF v_plano_aula IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Há um plano de aula usando este componente (ex: "' || v_plano_aula || '"). Delete o plano de aula primeiro.'
        );
    END IF;

    -- 2. Verifica se está sendo usado em alguma Carga Horária de Módulo
    SELECT m.nome_modulo INTO v_modulo
    FROM public.aca_carga_horaria ch
    JOIN public.aca_modulo m ON m.id = ch.id_modulo
    WHERE ch.id_componente = p_id AND ch.id_entidade = p_id_entidade
    LIMIT 1;

    IF v_modulo IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Este componente está vinculado ao módulo "' || v_modulo || '". Desvincule o componente do módulo antes de excluí-lo.'
        );
    END IF;

    -- Executa a exclusão
    DELETE FROM public.aca_componente
    WHERE id = p_id 
      AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Componente não encontrado ou sem permissão para excluir'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_deleted_id,
        'message', 'Componente excluído com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;
