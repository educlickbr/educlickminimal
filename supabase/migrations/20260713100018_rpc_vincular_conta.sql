-- ============================================================
-- Migration: 20260713100018 — RPCs para vincular conta
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_vincular_auth_user(
    p_id_user_expandido UUID,
    p_id_user UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.user_expandido
    SET id_user = p_id_user
    WHERE id = p_id_user_expandido;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário não encontrado.');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.aca_atribuir_papel_auth(
    p_id_user UUID,
    p_id_papel UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_papeis_auth (id_user, id_papel)
    VALUES (p_id_user, p_id_papel)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_vincular_auth_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aca_atribuir_papel_auth(UUID, UUID) TO authenticated;
