-- ============================================================
-- Política de Segurança: SECURITY INVOKER para Respostas de Formulário
-- Data: 2026-06-02
-- Autor: Equipe EduClick
-- ============================================================

ALTER FUNCTION public.aca_upsert_resposta_form(UUID, UUID, UUID, TEXT, UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.aca_get_respostas_usuario(UUID, UUID[]) SECURITY INVOKER;
