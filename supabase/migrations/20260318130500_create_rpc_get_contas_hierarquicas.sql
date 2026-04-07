-- MIGRATION: RPC para buscar contas paginadas e hierárquicas
-- Data: 2026-03-18

CREATE OR REPLACE FUNCTION public.get_contas_hierarquicas(
  p_id_pai uuid DEFAULT NULL,
  p_nivel integer DEFAULT 1,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  id_entidade uuid,
  nome text,
  tipo public.fin_tipo_conta,
  saldo_inicial numeric,
  id_pai uuid,
  nivel integer,
  ordem integer,
  criado_por uuid,
  criado_em timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.id_entidade, c.nome, c.tipo, c.saldo_inicial, c.id_pai, c.nivel, c.ordem, c.criado_por, c.criado_em
  FROM public.fin_contas c
  WHERE (
    (p_id_pai IS NULL AND c.id_pai IS NULL)
    OR (p_id_pai IS NOT NULL AND c.id_pai = p_id_pai)
  )
  AND c.nivel = p_nivel
  ORDER BY c.ordem NULLS LAST, c.nome ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_contas_hierarquicas(uuid, integer, integer, integer) TO authenticated;
