-- ======================================================
-- FIX: aca_upsert_resposta_form permitir limpar resposta
-- O COALESCE no ON CONFLICT impedia setar resposta/id_arquivo
-- como NULL (ex: ao remover um arquivo, a resposta deve limpar).
-- Agora sempre sobrescreve com o valor fornecido.
-- ======================================================

CREATE OR REPLACE FUNCTION public.aca_upsert_resposta_form(
    p_id_entidade UUID,
    p_id_user_expandido UUID,
    p_id_pergunta UUID,
    p_resposta TEXT DEFAULT NULL,
    p_id_arquivo UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.aca_resposta_form (
        id_entidade,
        id_user_expandido,
        id_pergunta,
        resposta,
        id_arquivo,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        p_id_entidade,
        p_id_user_expandido,
        p_id_pergunta,
        p_resposta,
        p_id_arquivo,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id_user_expandido, id_pergunta) DO UPDATE SET
        resposta = EXCLUDED.resposta,
        id_arquivo = EXCLUDED.id_arquivo,
        modificado_por = p_usuario_id,
        modificado_em = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id,
        'message', 'Resposta salva com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;

-- Mantém SECURITY INVOKER conforme migration 20260602081500
ALTER FUNCTION public.aca_upsert_resposta_form(UUID, UUID, UUID, TEXT, UUID, UUID) SECURITY INVOKER;
