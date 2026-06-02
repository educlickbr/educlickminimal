-- ============================================================
-- Migration: aca_update_user_sys_fields
-- Data: 2026-05-07
-- Descrição: RPC para atualizar os campos base do usuário (nome, sobrenome, email)
--            durante o preenchimento do formulário.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_update_user_sys_fields(
    p_id_user_expandido UUID,
    p_field TEXT,
    p_value TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_field = 'nome' THEN
        UPDATE public.user_expandido SET nome = p_value WHERE id = p_id_user_expandido;
    ELSIF p_field = 'sobrenome' THEN
        UPDATE public.user_expandido SET sobrenome = p_value WHERE id = p_id_user_expandido;
    ELSIF p_field = 'email' THEN
        UPDATE public.user_expandido SET email = p_value WHERE id = p_id_user_expandido;
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Campo inválido');
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Atualizado com sucesso');
END;
$$;

REVOKE ALL ON FUNCTION public.aca_update_user_sys_fields(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_update_user_sys_fields(UUID, TEXT, TEXT) TO authenticated;
