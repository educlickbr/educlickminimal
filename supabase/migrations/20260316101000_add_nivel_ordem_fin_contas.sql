-- MIGRATION: Adiciona nivel e ordem em fin_contas
-- Data: 2026-03-16
-- Autor: Automático (Copilot)

ALTER TABLE public.fin_contas ADD COLUMN IF NOT EXISTS nivel integer NULL;
ALTER TABLE public.fin_contas ADD COLUMN IF NOT EXISTS ordem integer NULL;

-- Atualize os níveis das contas raiz, se desejar:
-- UPDATE public.fin_contas SET nivel = 1 WHERE id_pai IS NULL;

-- Fim da migration
