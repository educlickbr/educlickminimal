-- MIGRATION: Cria RPCs para top 3 despesas por categoria, conta e local
-- Data: 2026-03-23

-- 1. Top Categorias
DROP FUNCTION IF EXISTS public.fin_get_top_categorias(uuid, integer);
CREATE OR REPLACE FUNCTION public.fin_get_top_categorias(
  p_id_entidade uuid,
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
      SELECT c.id, c.id as root_id, c.nome as root_nome 
      FROM public.fin_categorias c 
      WHERE c.id_pai IS NULL AND c.id_entidade = p_id_entidade
      
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
  GROUP BY ct.root_id, ct.root_nome
  ORDER BY total DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fin_get_top_categorias(uuid, integer) TO authenticated, service_role;


-- 2. Top Contas
DROP FUNCTION IF EXISTS public.fin_get_top_contas(uuid, integer);
CREATE OR REPLACE FUNCTION public.fin_get_top_contas(
  p_id_entidade uuid,
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
  WITH RECURSIVE cnt_tree AS (
      SELECT c.id, c.id as root_id, c.nome as root_nome 
      FROM public.fin_contas c 
      WHERE c.id_pai IS NULL AND c.id_entidade = p_id_entidade
      
      UNION ALL
      
      SELECT c.id, ct.root_id, ct.root_nome
      FROM public.fin_contas c
      JOIN cnt_tree ct ON c.id_pai = ct.id
  )
  SELECT 
    ct.root_id as id, 
    ct.root_nome as nome, 
    SUM(l.valor) as total
  FROM public.fin_lancamentos l
  JOIN cnt_tree ct ON ct.id = l.id_conta
  WHERE l.id_entidade = p_id_entidade 
    AND l.tipo = 'despesa'
    AND l.id_lancamento_pai IS NULL
  GROUP BY ct.root_id, ct.root_nome
  ORDER BY total DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fin_get_top_contas(uuid, integer) TO authenticated, service_role;


-- 3. Top Locais
DROP FUNCTION IF EXISTS public.fin_get_top_locais(uuid, integer);
CREATE OR REPLACE FUNCTION public.fin_get_top_locais(
  p_id_entidade uuid,
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
  SELECT 
    loc.id, 
    loc.nome, 
    SUM(l.valor) as total
  FROM public.fin_lancamentos l
  JOIN public.fin_locais loc ON loc.id = l.id_local
  WHERE l.id_entidade = p_id_entidade 
    AND l.tipo = 'despesa'
    AND l.id_lancamento_pai IS NULL
  GROUP BY loc.id, loc.nome
  ORDER BY total DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fin_get_top_locais(uuid, integer) TO authenticated, service_role;
