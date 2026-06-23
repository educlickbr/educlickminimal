-- ======================================================
-- FIX: Corrige FK de aca_resposta_form.id_arquivo
-- A constraint referenciada glb_arquivo(id) mas a tabela
-- correta é global_arquivos(id).
-- ======================================================

-- 1. Remove FK errada
ALTER TABLE public.aca_resposta_form
  DROP CONSTRAINT IF EXISTS aca_resposta_form_id_arquivo_fkey;

-- 2. Adiciona FK correta → global_arquivos
ALTER TABLE public.aca_resposta_form
  ADD CONSTRAINT aca_resposta_form_id_arquivo_fkey
    FOREIGN KEY (id_arquivo) REFERENCES public.global_arquivos(id)
    ON DELETE SET NULL;
