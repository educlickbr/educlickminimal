-- ============================================================
-- RPC: aca_delete_plano_de_aula
-- Data: 2026-04-16
-- Descrição: Trata exclusão de plano de aula e referências
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_delete_plano_de_aula(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_ref_title TEXT;
    v_deleted_id UUID;
BEGIN
    -- 1. Verifica se existem referências/arquivos anexados (embora pudesse usar CASCADE)
    SELECT titulo INTO v_ref_title
    FROM public.aca_ref_plano_de_aula
    WHERE id_plano_aula = p_id AND id_entidade = p_id_entidade
    LIMIT 1;

    -- Dependendo da regra de negócios, o plano pode ser deletado puxando as referências em CASCADE
    -- Mas como estamos padronizando avisos gentis... ou talvez para referências de plano, CASCADE seja melhor.
    -- Na tabela aca_ref_plano_de_aula o ON DELETE CASCADE já existe:
    -- id_plano_aula UUID REFERENCES public.aca_plano_de_aula(id) ON DELETE CASCADE
    -- Portanto não precisamos nos preocupar com isso.

    -- Executa a exclusão (As referências serão excluídas via CASCADE)
    DELETE FROM public.aca_plano_de_aula
    WHERE id = p_id 
      AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Plano de aula não encontrado ou sem permissão para excluir'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_deleted_id,
        'message', 'Plano de aula excluído com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;
