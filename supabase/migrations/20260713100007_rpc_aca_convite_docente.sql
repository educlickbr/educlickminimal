-- ============================================================
-- Migration: 20260713100007 — Convite para autocadastro docente
-- ============================================================
-- Tabela para gerenciar convites de autocadastro de docentes.
-- Cada convite tem um token único que expira após uso.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.aca_docente_convite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    email TEXT,  -- opcional: se preenchido, o link já vem com o email
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    usado BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_por UUID REFERENCES public.user_expandido(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aca_docente_convite_token
    ON public.aca_docente_convite (token);

-- -------------------------------------------------------
-- RPC: aca_gerar_convite_docente
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_gerar_convite_docente(
    p_id_entidade UUID,
    p_email TEXT DEFAULT NULL,
    p_criado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_token UUID;
    v_id UUID;
BEGIN
    INSERT INTO public.aca_docente_convite
        (id_entidade, email, criado_por)
    VALUES
        (p_id_entidade, p_email, p_criado_por)
    RETURNING id, token INTO v_id, v_token;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id,
        'token', v_token
    );
END;
$$;

-- -------------------------------------------------------
-- RPC: aca_completar_cadastro_docente
-- -------------------------------------------------------
-- Chamada AFTER o auth.signUp() — completa o cadastro
-- com user_expandido, respostas e vínculo docente.
-- SECURITY DEFINER para poder criar user_expandido mesmo
-- sendo um usuário recem-criado.
-- -------------------------------------------------------
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
    v_pergunta_id UUID;
    v_resposta TEXT;
BEGIN
    -- 1. Valida o token
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

    -- 2. Usa o id_user_expandido passado (do signUp) ou cria um novo
    v_user_expandido_id := p_id_user_expandido;

    IF v_user_expandido_id IS NULL THEN
        -- Cria user_expandido sem auth vinculado (fallback)
        INSERT INTO public.user_expandido (nome_completo, email)
        VALUES (p_nome, v_convite.email)
        RETURNING id INTO v_user_expandido_id;
    ELSE
        -- Atualiza o user_expandido já existente ou cria um
        INSERT INTO public.user_expandido (id, nome_completo, email)
        VALUES (v_user_expandido_id, p_nome, v_convite.email)
        ON CONFLICT (id) DO UPDATE SET
            nome_completo = EXCLUDED.nome_completo,
            email = COALESCE(EXCLUDED.email, user_expandido.email);
    END IF;

    -- 3. Salva respostas das perguntas globais
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

    -- 4. Vincula como docente
    INSERT INTO public.aca_docente (id_entidade, id_user_expandido, ativo)
    VALUES (v_convite.id_entidade, v_user_expandido_id, true)
    ON CONFLICT (id_entidade, id_user_expandido) DO UPDATE SET
        ativo = true,
        modificado_em = NOW()
    RETURNING id INTO v_docente_id;

    -- 5. Marca convite como usado
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

GRANT EXECUTE ON FUNCTION public.aca_gerar_convite_docente(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aca_completar_cadastro_docente(UUID, TEXT, JSONB, UUID) TO authenticated;
