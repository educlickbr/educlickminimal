-- MIGRATION: Cria RPC para exclusão de lançamentos
-- Data: 2026-03-23

DROP FUNCTION IF EXISTS public.fin_delete_lancamento(uuid, uuid);
CREATE OR REPLACE FUNCTION public.fin_delete_lancamento(
  p_id uuid,
  p_id_entidade uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Se for um lançamento pai, deleta os filhos antes (analíticos)
  -- Nota: Se for parcelado, talvez queiramos deletar o grupo todo?
  -- Mas por enquanto vamos deletar o lançamento específico selecionado.
  -- Se o usuário quiser deletar a série toda, teremos outra lógica depois.
  
  DELETE FROM public.fin_lancamentos 
  WHERE (id = p_id OR id_lancamento_pai = p_id)
    AND id_entidade = p_id_entidade;
    
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fin_delete_lancamento(uuid, uuid) TO authenticated, service_role;
