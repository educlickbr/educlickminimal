-- ============================================================
-- Migration: revoke_anon_from_academic_rpcs
-- Data: 2026-06-03
-- Descrição: Remove acesso anon de RPCs acadêmicas sensíveis.
-- ============================================================

REVOKE ALL ON FUNCTION public.aca_get_programas_publicos(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.aca_get_programas_publicos(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.aca_get_areas_publicas(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.aca_get_areas_publicas(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;
