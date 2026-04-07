-- MIGRATION: Cria RPC específico para top 3 despesas de locais por período
-- Data: 2026-03-23

DROP FUNCTION IF EXISTS public.fin_get_top_locais_periodo(uuid, text, text, integer);
CREATE OR REPLACE FUNCTION public.fin_get_top_locais_periodo(
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
  SELECT 
    loc.id, 
    loc.nome, 
    SUM(l.valor) as total
  FROM public.fin_lancamentos l
  JOIN public.fin_locais loc ON loc.id = l.id_local
  WHERE l.id_entidade = p_id_entidade 
    AND l.tipo = 'despesa'
    AND l.id_lancamento_pai IS NULL
    AND l.data >= p_data_inicio::date
    AND l.data <= p_data_fim::date
  GROUP BY loc.id, loc.nome
  ORDER BY total DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fin_get_top_locais_periodo(uuid, text, text, integer) TO authenticated, service_role;
