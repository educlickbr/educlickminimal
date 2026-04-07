-- Adiciona a coluna id_local na tabela fin_lancamentos vinculando à nova tabela fin_locais
ALTER TABLE public.fin_lancamentos ADD COLUMN id_local uuid NULL;
ALTER TABLE public.fin_lancamentos ADD CONSTRAINT fin_lancamentos_id_local_fkey FOREIGN KEY (id_local) REFERENCES public.fin_locais(id) ON DELETE SET NULL;

-- Index para performance nas buscas por local
CREATE INDEX IF NOT EXISTS idx_fin_lancamentos_id_local ON public.fin_lancamentos(id_local);
