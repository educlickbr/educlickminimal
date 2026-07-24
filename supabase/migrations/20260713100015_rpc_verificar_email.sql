-- ============================================================
-- Migration: 20260713100015 — RPC pública verificar email
-- ============================================================
-- RPC SECURITY DEFINER para consultar user_expandido sem
-- ser bloqueado pela RLS (usada na tela de login antes
-- do usuário estar autenticado).
-- ============================================================

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
        RETURN jsonb_build_object(
            'existe', false,
            'pode_criar_conta', false
        );
    END IF;

    RETURN jsonb_build_object(
        'existe', true,
        'pode_criar_conta', v_user.id_user IS NULL,
        'nome', v_user.nome_completo,
        'id_user_expandido', v_user.id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.auth_verificar_email(TEXT) TO authenticated;
