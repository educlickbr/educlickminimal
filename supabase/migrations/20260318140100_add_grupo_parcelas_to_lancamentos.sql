-- Migration: Adiciona id_grupo_parcelas para agrupar parcelas de um mesmo parcelamento
-- Permite buscar, editar e deletar todas as parcelas juntas sem tabela extra.

ALTER TABLE public.fin_lancamentos
  ADD COLUMN IF NOT EXISTS id_grupo_parcelas uuid NULL;

COMMENT ON COLUMN public.fin_lancamentos.id_grupo_parcelas IS
  'Quando parcelado=true, todas as parcelas geradas compartilham o mesmo id_grupo_parcelas. Permite editar e deletar o grupo inteiro de uma vez.';

-- Índice para busca eficiente por grupo de parcelas
CREATE INDEX IF NOT EXISTS idx_fin_lancamentos_grupo_parcelas
  ON public.fin_lancamentos (id_grupo_parcelas)
  WHERE id_grupo_parcelas IS NOT NULL;
