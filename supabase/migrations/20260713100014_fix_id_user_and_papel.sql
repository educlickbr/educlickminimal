-- ============================================================
-- Migration: 20260713100014 — Fix id_user + papel docente
-- ============================================================
-- Corrige a RPC aca_completar_cadastro_docente para:
-- 1. Setar id_user no user_expandido (ao invés de sobrescrever o id)
-- 2. Inserir papel aca_docente em user_papeis_auth
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

    -- 2. Busca ou cria user_expandido com id_user vinculado
    SELECT id INTO v_user_expandido_id
    FROM public.user_expandido
    WHERE email = v_convite.email
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        -- Cria novo user_expandido com id_user
        INSERT INTO public.user_expandido (id_user, nome_completo, email)
        VALUES (p_id_user_expandido, p_nome, v_convite.email)
        RETURNING id INTO v_user_expandido_id;
    ELSE
        -- Atualiza existente: seta id_user e nome
        UPDATE public.user_expandido
        SET id_user = COALESCE(p_id_user_expandido, id_user),
            nome_completo = COALESCE(p_nome, nome_completo)
        WHERE id = v_user_expandido_id;
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

    -- 5. Atribui papel aca_docente (se p_id_user_expandido informado)
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

    -- 6. Marca convite como usado
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

-- Também corrige a RPC aca_criar_docente_completo (admin)
-- para setar id_user quando o user_expandido já existir
-- com o mesmo email (caso o auth já tenha sido criado antes)
CREATE OR REPLACE FUNCTION public.aca_criar_docente_completo(
    p_id_entidade UUID,
    p_nome TEXT,
    p_email TEXT,
    p_respostas JSONB DEFAULT '{}',
    p_valor_hora_aula INTEGER DEFAULT NULL,
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
    v_papel_docente_id UUID;
    v_auth_user_id UUID;
BEGIN
    -- 1. Verifica se já existe user_expandido com este email
    SELECT id, id_user INTO v_user_expandido_id, v_auth_user_id
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        INSERT INTO public.user_expandido (nome_completo, email)
        VALUES (p_nome, p_email)
        RETURNING id INTO v_user_expandido_id;
    ELSE
        UPDATE public.user_expandido
        SET nome_completo = p_nome
        WHERE id = v_user_expandido_id;
    END IF;

    -- 2. Salva respostas
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

    -- 3. Vincula como docente
    INSERT INTO public.aca_docente (id_entidade, id_user_expandido, ativo, valor_hora_aula, criado_por)
    VALUES (p_id_entidade, v_user_expandido_id, true, p_valor_hora_aula, p_criado_por)
    ON CONFLICT (id_entidade, id_user_expandido) DO UPDATE SET
        ativo = true,
        valor_hora_aula = COALESCE(p_valor_hora_aula, aca_docente.valor_hora_aula),
        modificado_por = p_criado_por,
        modificado_em = NOW()
    RETURNING id INTO v_docente_id;

    -- 4. Se o user_expandido já tem auth, atribui papel docente
    IF v_auth_user_id IS NOT NULL THEN
        SELECT id INTO v_papel_docente_id
        FROM public.user_papeis
        WHERE nome = 'aca_docente';

        IF v_papel_docente_id IS NOT NULL THEN
            INSERT INTO public.user_papeis_auth (id_user, id_papel)
            VALUES (v_auth_user_id, v_papel_docente_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id_user_expandido', v_user_expandido_id,
        'id_docente', v_docente_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_completar_cadastro_docente(UUID, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aca_criar_docente_completo(UUID, TEXT, TEXT, JSONB, INTEGER, UUID) TO authenticated;
