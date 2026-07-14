-- ============================================================
-- Migration: 20260713100006 — RPC aca_criar_docente_completo
-- ============================================================
-- Cria user_expandido, salva respostas das perguntas globais
-- e vincula como docente em uma única transação.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_criar_docente_completo(
    p_id_entidade UUID,
    p_nome TEXT,
    p_email TEXT,
    p_respostas JSONB,  -- { "id_pergunta": "resposta", ... }
    p_criado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_expandido_id UUID;
    v_docente_id UUID;
    v_pergunta_id UUID;
    v_resposta TEXT;
    v_existing JSONB;
BEGIN
    -- 1. Verifica se já existe user_expandido com este email
    SELECT id INTO v_user_expandido_id
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        -- Cria novo user_expandido
        INSERT INTO public.user_expandido (nome_completo, email)
        VALUES (p_nome, p_email)
        RETURNING id INTO v_user_expandido_id;
    ELSE
        -- Atualiza nome se já existir
        UPDATE public.user_expandido
        SET nome_completo = p_nome
        WHERE id = v_user_expandido_id;
    END IF;

    -- 2. Salva respostas das perguntas globais
    FOR v_pergunta_id, v_resposta IN
        SELECT key::UUID, value::TEXT
        FROM jsonb_each_text(p_respostas)
    LOOP
        INSERT INTO public.aca_resposta_form (
            id_entidade, id_user_expandido, id_pergunta,
            resposta, criado_por, modificado_por, modificado_em
        )
        VALUES (
            p_id_entidade, v_user_expandido_id, v_pergunta_id,
            v_resposta, p_criado_por, p_criado_por, NOW()
        )
        ON CONFLICT (id_user_expandido, id_pergunta) DO UPDATE SET
            resposta = EXCLUDED.resposta,
            modificado_por = p_criado_por,
            modificado_em = NOW();
    END LOOP;

    -- 3. Vincula como docente (se já existir, reativa)
    INSERT INTO public.aca_docente (id_entidade, id_user_expandido, ativo, criado_por)
    VALUES (p_id_entidade, v_user_expandido_id, true, p_criado_por)
    ON CONFLICT (id_entidade, id_user_expandido) DO UPDATE SET
        ativo = true,
        modificado_por = p_criado_por,
        modificado_em = NOW()
    RETURNING id INTO v_docente_id;

    RETURN jsonb_build_object(
        'success', true,
        'id_user_expandido', v_user_expandido_id,
        'id_docente', v_docente_id
    );
END;
$$;

-- Permissão
GRANT EXECUTE ON FUNCTION public.aca_criar_docente_completo(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
