-- ============================================================
-- RPC: nxt_upsert_user_expandido
-- Data: 2026-10-06
-- Descrição: Criação/upsert de usuário após signup (onboarding público),
--            vinculando user_expandido, user_papeis_auth e user_entidade_user
--            para emissão correta dos claims pelo hook jwt_custom_claims.
-- Justificativa SECURITY DEFINER: Chamada durante fluxo de cadastro
--                                 público/onboarding antes ou logo após
--                                 a confirmação de sessão, precisando
--                                 ignorar RLS para provisionar vínculos.
-- ============================================================

CREATE OR REPLACE FUNCTION public.nxt_upsert_user_expandido(
    p_user_id UUID,
    p_nome TEXT,
    p_sobrenome TEXT DEFAULT '',
    p_email TEXT DEFAULT '',
    p_papel_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_papel TEXT DEFAULT 'aca_candidato'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_expandido_id UUID;
    v_papel_id UUID;
    v_entidade_id UUID := p_id_entidade;
    v_nome_completo TEXT;
    v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
BEGIN
    -- Se o email não foi passado explicitamente, busca de auth.users
    IF v_email IS NULL OR v_email = '' THEN
        SELECT email INTO v_email
        FROM auth.users
        WHERE id = p_user_id;
    END IF;

    -- Concatena nome completo
    v_nome_completo := TRIM(COALESCE(p_nome, '') || ' ' || COALESCE(p_sobrenome, ''));
    IF v_nome_completo = '' THEN
        v_nome_completo := split_part(COALESCE(v_email, ''), '@', 1);
    END IF;

    -- Se não passou entidade, resolve a entidade padrão
    IF v_entidade_id IS NULL THEN
        SELECT id INTO v_entidade_id
        FROM public.user_entidades
        WHERE dominios @> '["localhost"]'::jsonb
           OR nome_entidade = 'educlick_modelo'
        LIMIT 1;

        IF v_entidade_id IS NULL THEN
            SELECT id INTO v_entidade_id
            FROM public.user_entidades
            ORDER BY criado_em ASC
            LIMIT 1;
        END IF;
    END IF;

    -- 1. Cria ou atualiza user_expandido
    SELECT id INTO v_user_expandido_id
    FROM public.user_expandido
    WHERE id_user = p_user_id OR (v_email <> '' AND email = v_email)
    ORDER BY (CASE WHEN id_user = p_user_id THEN 0 ELSE 1 END)
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        INSERT INTO public.user_expandido (
            id_user,
            nome_completo,
            email,
            email_verificado
        )
        VALUES (
            p_user_id,
            v_nome_completo,
            v_email,
            false
        )
        RETURNING id INTO v_user_expandido_id;
    ELSE
        UPDATE public.user_expandido
        SET id_user = p_user_id,
            nome_completo = COALESCE(NULLIF(v_nome_completo, ''), nome_completo),
            email = COALESCE(NULLIF(v_email, ''), email)
        WHERE id = v_user_expandido_id;
    END IF;

    -- 2. Resolve o papel do usuário
    IF p_papel_id IS NOT NULL THEN
        SELECT id INTO v_papel_id
        FROM public.user_papeis
        WHERE id = p_papel_id;
    END IF;

    IF v_papel_id IS NULL AND p_papel IS NOT NULL AND p_papel <> '' THEN
        SELECT id INTO v_papel_id
        FROM public.user_papeis
        WHERE nome = p_papel OR id::text = p_papel
        LIMIT 1;
    END IF;

    IF v_papel_id IS NULL THEN
        SELECT id INTO v_papel_id
        FROM public.user_papeis
        WHERE nome = 'aca_candidato'
        LIMIT 1;
    END IF;

    -- 3. Vincula papel em user_papeis_auth
    IF v_papel_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.user_papeis_auth
            WHERE id_user = p_user_id AND id_papel = v_papel_id
        ) THEN
            INSERT INTO public.user_papeis_auth (id_user, id_papel, id_entidade)
            VALUES (p_user_id, v_papel_id, v_entidade_id);
        END IF;
    END IF;

    -- 4. Vincula entidade em user_entidade_user
    IF v_entidade_id IS NOT NULL AND v_user_expandido_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.user_entidade_user
            WHERE id_user = v_user_expandido_id AND id_entidade = v_entidade_id
        ) THEN
            INSERT INTO public.user_entidade_user (id_user, id_entidade)
            VALUES (v_user_expandido_id, v_entidade_id);
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id_user_expandido', v_user_expandido_id,
        'id_user', p_user_id,
        'id_papel', v_papel_id,
        'id_entidade', v_entidade_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.nxt_upsert_user_expandido(UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.nxt_upsert_user_expandido(UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nxt_upsert_user_expandido(UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT) TO service_role;
