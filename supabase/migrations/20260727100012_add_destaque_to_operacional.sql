-- ============================================================
-- Migration: add_destaque_to_operacional
-- Data: 2026-07-27
-- Descrição: Adiciona coluna destaque ao lms_conteudo_operacional
--            para permitir que conteúdos sejam destacados
--            no currículo do programa.
-- ============================================================

ALTER TABLE public.lms_conteudo_operacional
    ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT FALSE;
