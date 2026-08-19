-- ═══════════════════════════════════════════════════════════
-- Drop do overload órfão: lms_upsert_avaliacao_completa (7 params)
-- Data: 2026-08-19
-- Histórico:
--   00000/00001  → assinatura de 6 params (com DROP)
--   00004        → DROP da de 6 + CREATE de 7 params (com p_ordem_perguntas)
--   19100002     → DROP da de 6 (no-op: já não existia) + CREATE de 9 params
--                  (p_ordem_perguntas + p_ambiente_seguro + p_autoavaliacao)
-- Resultado: a versão de 7 params (00004) SOBROU no banco como overload.
-- O BFF sempre chama com 9 params (PostgREST resolve para a nova), mas a
-- de 7 fica como código morto — este DROP remove o overload antigo.
-- ═══════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.lms_upsert_avaliacao_completa(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_nome TEXT,
    p_descricao TEXT,
    p_ordem_perguntas TEXT,
    p_perguntas JSONB,
    p_usuario_id UUID
);
