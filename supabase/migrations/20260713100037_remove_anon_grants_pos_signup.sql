-- ============================================================
-- Migration: 20260713100037 — Remove anon grants pós-signUp
-- ============================================================
-- aca_vincular_auth_user e aca_atribuir_papel_auth são
-- chamadas APÓS o signUp (usuário já autenticado).
-- O GRANT TO anon adicionado em 00035 é desnecessário.
-- ============================================================

REVOKE ALL ON FUNCTION public.aca_vincular_auth_user(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_vincular_auth_user(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.aca_atribuir_papel_auth(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_atribuir_papel_auth(UUID, UUID) TO authenticated;
