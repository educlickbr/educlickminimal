-- MIGRATION: Cria RPC específico para top 3 despesas de categorias por período
-- Data: 2026-03-23

DROP FUNCTION IF EXISTS public.fin_get_top_categorias_periodo(uuid, text, text, integer);
CREATE OR REPLACE FUNCTION public.fin_get_top_categorias_periodo(
  p_id_entidade uuid,
  p_data_inicio text,
  p_data_fim text,
  p_limit integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  nome text,
  total numeric(12,2)
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE cat_tree AS (
      -- Root parents: either belong to the entity or are global (id_entidade IS NULL)
      SELECT c.id, c.id as root_id, c.nome as root_nome 
      FROM public.fin_categorias c 
      WHERE c.id_pai IS NULL 
        AND (c.id_entidade = p_id_entidade OR c.id_entidade IS NULL)
      
      UNION ALL
      
      SELECT c.id, ct.root_id, ct.root_nome
      FROM public.fin_categorias c
      JOIN cat_tree ct ON c.id_pai = ct.id
  )
  SELECT 
    ct.root_id as id, 
    ct.root_nome as nome, 
    SUM(l.valor) as total
  FROM public.fin_lancamentos l
  JOIN cat_tree ct ON ct.id = l.id_categoria
  WHERE l.id_entidade = p_id_entidade 
    AND l.tipo = 'despesa'
    AND l.id_lancamento_pai IS NULL
    AND l.data >= p_data_inicio::date
    AND l.data <= p_data_fim::date
  GROUP BY ct.root_id, ct.root_nome
  ORDER BY total DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fin_get_top_categorias_periodo(uuid, text, text, integer) TO authenticated, service_role;
