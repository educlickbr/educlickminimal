-- ============================================================
-- Política de Segurança: SECURITY INVOKER em todas as RPCs (CORRIGIDO v2)
-- Data: 2026-03-30
-- Removido drop acidental da função atual de componentes.
-- ============================================================

-- ── Limpeza de Funções Obsoletas (Overloads de versões anteriores) ────────

-- Módulo tinha 5 parâmetros na migração 20260325 e passou para 6 na 20260327
DROP FUNCTION IF EXISTS public.aca_upsert_modulo(uuid, uuid, text, text, uuid);

-- ── Funções de Sessão e Contexto ────────────────────────────

ALTER FUNCTION public.nxt_get_user_session_v1(uuid) SECURITY INVOKER;
ALTER FUNCTION public.aca_get_contexto_por_url(text) SECURITY INVOKER;
ALTER FUNCTION public.get_user_expandido_header(uuid) SECURITY INVOKER;

-- ── Acadêmico — Componentes ──────────────────────────────────

ALTER FUNCTION public.aca_upsert_componente(uuid, uuid, text, text, uuid) SECURITY INVOKER;
ALTER FUNCTION public.aca_get_componentes_paginado(uuid, integer, integer, text, text, text) SECURITY INVOKER;
ALTER FUNCTION public.aca_delete_componente(uuid, uuid) SECURITY INVOKER;

-- ── Acadêmico — Módulos e Planos ─────────────────────────────

ALTER FUNCTION public.aca_upsert_modulo(uuid, uuid, text, text, integer, uuid) SECURITY INVOKER;
ALTER FUNCTION public.aca_get_modulos_paginado(uuid, integer, integer, text) SECURITY INVOKER;
ALTER FUNCTION public.aca_upsert_plano_de_aula(uuid, uuid, uuid, uuid, text, text, uuid) SECURITY INVOKER;
ALTER FUNCTION public.aca_get_planos_por_modulo(uuid) SECURITY INVOKER;

-- ── Financeiro ───────────────────────────────────────────────

-- Categoria
ALTER FUNCTION public.upsert_categoria_nome(uuid, text, text, uuid, integer, uuid) SECURITY INVOKER;
ALTER FUNCTION public.delete_categoria_segura(uuid, boolean) SECURITY INVOKER;

-- Conta
ALTER FUNCTION public.upsert_conta_nome(uuid, text, public.fin_tipo_conta, uuid, integer, uuid) SECURITY INVOKER;
ALTER FUNCTION public.delete_conta_segura(uuid, boolean) SECURITY INVOKER;
