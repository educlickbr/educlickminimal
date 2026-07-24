-- ============================================================
-- Migration: 20260713100035 — Fix auth flows para login público
-- ============================================================
-- 1. auth_verificar_email: verifica auth.users para detectar
--    contas existentes mesmo sem id_user em user_expandido.
-- 2. RPCs de código: GRANT TO anon (chamadas antes do login).
-- 3. RPCs de vínculo: GRANT TO anon (chamadas no onboarding).
-- ============================================================

-- ============================================================
-- 1. Fix auth_verificar_email — verifica auth.users
-- ============================================================
-- Se o signUp criou a conta no auth.users mas o vínculo
-- falhou (id_user NULL em user_expandido), esta RPC detecta
-- corretamente e retorna pode_criar_conta = false.
-- ============================================================
CREATE OR REPLACE FUNCTION public.auth_verificar_email(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_auth_exists BOOLEAN;
    v_auth_id UUID;
BEGIN
    -- Busca em user_expandido
    SELECT id, nome_completo, id_user
    INTO v_user
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    -- Verifica se existe em auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = p_email)
    INTO v_auth_exists;

    SELECT id INTO v_auth_id
    FROM auth.users
    WHERE email = p_email
    LIMIT 1;

    -- Se não existe em lugar nenhum
    IF v_user.id IS NULL AND NOT v_auth_exists THEN
        RETURN jsonb_build_object(
            'existe', false,
            'pode_criar_conta', false,
            'tem_conta', false
        );
    END IF;

    -- Existe só no auth (signUp direto por ex)
    IF v_user.id IS NULL AND v_auth_exists THEN
        RETURN jsonb_build_object(
            'existe', false,
            'pode_criar_conta', false,
            'tem_conta', true,
            'message', 'Faça login com sua senha.'
        );
    END IF;

    -- Existe em user_expandido mas id_user não foi vinculado
    -- mesmo tendo conta no auth.users — vincula automaticamente
    IF v_user.id_user IS NULL AND v_auth_exists THEN
        UPDATE public.user_expandido
        SET id_user = v_auth_id
        WHERE id = v_user.id;

        RETURN jsonb_build_object(
            'existe', true,
            'pode_criar_conta', false,
            'nome', v_user.nome_completo,
            'id_user_expandido', v_user.id,
            'fix', true
        );
    END IF;

    -- Existe em user_expandido — retorna status do id_user
    RETURN jsonb_build_object(
        'existe', true,
        'pode_criar_conta', v_user.id_user IS NULL,
        'nome', v_user.nome_completo,
        'id_user_expandido', v_user.id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.auth_verificar_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_verificar_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.auth_verificar_email(TEXT) TO authenticated;

-- ============================================================
-- 2. RPCs de código — GRANT TO anon
-- ============================================================
-- Chamadas pela tela de login ANTES do usuário se autenticar.
-- Já são SECURITY DEFINER, só falta o grant.
-- ============================================================

REVOKE ALL ON FUNCTION public.aca_gerar_codigo_verificacao(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_gerar_codigo_verificacao(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.aca_gerar_codigo_verificacao(UUID, INTEGER) TO authenticated;

REVOKE ALL ON FUNCTION public.aca_verificar_codigo(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_verificar_codigo(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.aca_verificar_codigo(UUID, TEXT) TO authenticated;

-- ============================================================
-- 3. RPCs de vínculo de conta — GRANT TO anon
-- ============================================================
-- Chamadas durante o onboarding (criação de conta).
-- O usuário ainda não está autenticado no momento da chamada.
-- Já são SECURITY DEFINER, só falta o grant.
-- ============================================================

REVOKE ALL ON FUNCTION public.aca_vincular_auth_user(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_vincular_auth_user(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.aca_vincular_auth_user(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.aca_atribuir_papel_auth(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_atribuir_papel_auth(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.aca_atribuir_papel_auth(UUID, UUID) TO authenticated;

-- ============================================================
-- 4. RPC para find-or-create user_expandido (público)
-- ============================================================
-- Usada pelo BFF vincular-conta quando o user_expandido
-- não existe ainda. Essential: chamada ANTES do login,
-- então precisa ser DEFINER + anon.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_find_or_create_user_expandido(
    p_email TEXT,
    p_nome TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Busca existente
    SELECT id INTO v_id
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    -- Se não existe, cria
    IF v_id IS NULL THEN
        INSERT INTO public.user_expandido (nome_completo, email)
        VALUES (
            COALESCE(NULLIF(p_nome, ''), split_part(p_email, '@', 1)),
            p_email
        )
        RETURNING id INTO v_id;
    END IF;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_find_or_create_user_expandido(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.aca_find_or_create_user_expandido(TEXT, TEXT) TO authenticated;
