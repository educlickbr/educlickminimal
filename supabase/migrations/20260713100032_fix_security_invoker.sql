-- ============================================================
-- Migration: 20260713100032 — Fix security model
-- ============================================================
-- Corrige as RPCs públicas para SECURITY INVOKER + GRANT anon
-- RLS protege os dados. DEFINER é só para triggers.
-- ============================================================

-- a) aca_inscrever_edital_publico
CREATE OR REPLACE FUNCTION public.aca_inscrever_edital_publico(
    p_id_edital UUID,
    p_id_entidade UUID,
    p_nome TEXT,
    p_email TEXT,
    p_respostas JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_candidato_id UUID;
    v_inscricao_id UUID;
    v_papel_candidato_id UUID;
    v_pergunta_id UUID;
    v_resposta TEXT;
BEGIN
    SELECT id INTO v_candidato_id
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    IF v_candidato_id IS NULL THEN
        INSERT INTO public.user_expandido (nome_completo, email)
        VALUES (p_nome, p_email)
        RETURNING id INTO v_candidato_id;
    ELSE
        UPDATE public.user_expandido
        SET nome_completo = p_nome
        WHERE id = v_candidato_id;
    END IF;

    INSERT INTO public.user_entidade_user (id_entidade, id_user)
    VALUES (p_id_entidade, v_candidato_id)
    ON CONFLICT DO NOTHING;

    FOR v_pergunta_id, v_resposta IN
        SELECT key::UUID, value::TEXT
        FROM jsonb_each_text(p_respostas)
        WHERE key NOT LIKE 'sys-%'
    LOOP
        INSERT INTO public.aca_resposta_form (
            id_entidade, id_user_expandido, id_pergunta,
            resposta, criado_em
        )
        VALUES (
            p_id_entidade, v_candidato_id, v_pergunta_id,
            v_resposta, NOW()
        );
    END LOOP;

    INSERT INTO public.aca_edital_docente_inscricao
        (id_edital, id_candidato, status)
    VALUES
        (p_id_edital, v_candidato_id, 'aguardando')
    RETURNING id INTO v_inscricao_id;

    RETURN jsonb_build_object(
        'success', true,
        'id_inscricao', v_inscricao_id,
        'id_user_expandido', v_candidato_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_inscrever_edital_publico(UUID, UUID, TEXT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.aca_inscrever_edital_publico(UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;

-- b) auth_verificar_email
CREATE OR REPLACE FUNCTION public.auth_verificar_email(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
BEGIN
    SELECT id, nome_completo, id_user
    INTO v_user
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    IF v_user.id IS NULL THEN
        RETURN jsonb_build_object('existe', false, 'pode_criar_conta', false);
    END IF;

    RETURN jsonb_build_object(
        'existe', true,
        'pode_criar_conta', v_user.id_user IS NULL,
        'nome', v_user.nome_completo,
        'id_user_expandido', v_user.id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.auth_verificar_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.auth_verificar_email(TEXT) TO authenticated;
