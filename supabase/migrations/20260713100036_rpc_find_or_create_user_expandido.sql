-- ============================================================
-- Migration: 20260713100036 — RPC find-or-create user_expandido
-- ============================================================
-- Usada pelo BFF vincular-conta quando o user_expandido
-- ainda não existe no momento do signUp.
-- SECURITY DEFINER porque precisa bypassar RLS.
-- GRANT TO authenticated porque é chamada APÓS o signUp
-- (usuário já tem sessão ativa).
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
    -- 1. Busca existente
    SELECT id INTO v_id
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    -- 2. Se não existe, cria
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

GRANT EXECUTE ON FUNCTION public.aca_find_or_create_user_expandido(TEXT, TEXT) TO authenticated;
