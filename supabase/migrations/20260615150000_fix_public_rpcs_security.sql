-- ============================================================
-- Migration: fix_public_rpcs_security
-- Data: 2026-06-15
-- Descrição: Garante SECURITY DEFINER e acesso anon/authenticated
--            para RPCs públicas (vitrine e inscrições).
-- ============================================================

-- 1. Programas Públicos (Vitrine) - Aberto ao público
ALTER FUNCTION public.aca_get_programas_publicos(UUID) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.aca_get_programas_publicos(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_programas_publicos(UUID) TO anon, authenticated;

-- 2. Áreas Públicas (Filtros Vitrine) - Aberto ao público
ALTER FUNCTION public.aca_get_areas_publicas(UUID) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.aca_get_areas_publicas(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_areas_publicas(UUID) TO anon, authenticated;

-- 3. Configuração de Formulário - RESTRITO A AUTENTICADOS
-- O formulário exige que o usuário esteja logado para salvar respostas.
ALTER FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID, TEXT, TEXT) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;
