-- ============================================================
-- Migration: 20260713100020 — Insert user_entidade_user
-- ============================================================
-- Garante que o docente seja vinculado à entidade correta
-- tanto no autocadastro (via link) quanto no futuro.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_completar_cadastro_docente(
    p_token UUID,
    p_nome TEXT,
    p_respostas JSONB DEFAULT '{}',
    p_id_user_expandido UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_convite RECORD;
    v_user_expandido_id UUID;
    v_docente_id UUID;
    v_papel_docente_id UUID;
    v_pergunta_id UUID;
    v_resposta TEXT;
BEGIN
    SELECT * INTO v_convite
    FROM public.aca_docente_convite
    WHERE token = p_token
      AND usado = false
    FOR UPDATE;

    IF v_convite.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Link inválido ou já utilizado.'
        );
    END IF;

    -- Busca ou cria user_expandido com id_user vinculado
    SELECT id INTO v_user_expandido_id
    FROM public.user_expandido
    WHERE email = v_convite.email
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        INSERT INTO public.user_expandido (id_user, nome_completo, email)
        VALUES (p_id_user_expandido, p_nome, v_convite.email)
        RETURNING id INTO v_user_expandido_id;
    ELSE
        UPDATE public.user_expandido
        SET id_user = COALESCE(p_id_user_expandido, id_user),
            nome_completo = COALESCE(p_nome, nome_completo)
        WHERE id = v_user_expandido_id;
    END IF;

    -- Respostas
    FOR v_pergunta_id, v_resposta IN
        SELECT key::UUID, value::TEXT
        FROM jsonb_each_text(p_respostas)
    LOOP
        INSERT INTO public.aca_resposta_form (
            id_entidade, id_user_expandido, id_pergunta,
            resposta, criado_em, modificado_em
        )
        VALUES (
            v_convite.id_entidade, v_user_expandido_id, v_pergunta_id,
            v_resposta, NOW(), NOW()
        )
        ON CONFLICT (id_user_expandido, id_pergunta) DO UPDATE SET
            resposta = EXCLUDED.resposta,
            modificado_em = NOW();
    END LOOP;

    -- Vincula docente
    INSERT INTO public.aca_docente (id_entidade, id_user_expandido, ativo)
    VALUES (v_convite.id_entidade, v_user_expandido_id, true)
    ON CONFLICT (id_entidade, id_user_expandido) DO UPDATE SET
        ativo = true,
        modificado_em = NOW()
    RETURNING id INTO v_docente_id;

    -- Vincula entidade (user_entidade_user)
    INSERT INTO public.user_entidade_user (id_entidade, id_user)
    VALUES (v_convite.id_entidade, v_user_expandido_id)
    ON CONFLICT DO NOTHING;

    -- Papel
    IF p_id_user_expandido IS NOT NULL THEN
        SELECT id INTO v_papel_docente_id
        FROM public.user_papeis
        WHERE nome = 'aca_docente';

        IF v_papel_docente_id IS NOT NULL THEN
            INSERT INTO public.user_papeis_auth (id_user, id_papel)
            VALUES (p_id_user_expandido, v_papel_docente_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    UPDATE public.aca_docente_convite
    SET usado = true
    WHERE id = v_convite.id;

    RETURN jsonb_build_object(
        'success', true,
        'id_user_expandido', v_user_expandido_id,
        'id_docente', v_docente_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_completar_cadastro_docente(UUID, TEXT, JSONB, UUID) TO authenticated;
