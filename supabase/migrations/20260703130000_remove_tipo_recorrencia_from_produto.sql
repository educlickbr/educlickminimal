-- ============================================================
-- Migration: remove_tipo_recorrencia_from_produto
-- Data: 2026-07-03
-- Descrição: Remove tipo_recorrencia de com_produto (a decisão
--            de pagamento único/recorrente é da oferta, não do produto)
-- ============================================================

ALTER TABLE public.com_produto DROP COLUMN IF EXISTS tipo_recorrencia;
