-- ============================================================
-- Migration: add_audit_cols_to_lms_conteudo_operacional
-- Data: 2026-08-06
-- Descrição: Adiciona modificado_por/modificado_em na
--   lms_conteudo_operacional — a RPC lms_upsert_operacional
--   já grava nessas colunas no DO UPDATE, mas elas não
--   existiam na tabela (causava erro 500 ao associar no
--   Currículo). Alinha com o padrão das demais tabelas.
-- ============================================================

ALTER TABLE public.lms_conteudo_operacional
    ADD COLUMN IF NOT EXISTS modificado_por UUID REFERENCES public.user_expandido(id),
    ADD COLUMN IF NOT EXISTS modificado_em TIMESTAMPTZ DEFAULT NOW();
