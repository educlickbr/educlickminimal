-- MIGRATION: Corrige get_contas_hierarquicas para dados legados sem nivel
-- Data: 2026-03-18

-- 1) Backfill de nivel para fin_contas (dados existentes)
WITH RECURSIVE contas_niveis AS (
  SELECT c.id, c.id_pai, 1::integer AS nivel_calc
  FROM public.fin_contas c
  WHERE c.id_pai IS NULL

  UNION ALL

  SELECT f.id, f.id_pai, (cn.nivel_calc + 1)::integer AS nivel_calc
  FROM public.fin_contas f
  JOIN contas_niveis cn ON f.id_pai = cn.id
)
UPDATE public.fin_contas fc
SET nivel = cn.nivel_calc
FROM contas_niveis cn
WHERE fc.id = cn.id
  AND (fc.nivel IS NULL OR fc.nivel <> cn.nivel_calc);

-- 2) Recria função com fallback para nivel nulo (segurança adicional)
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
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.id_entidade,
    c.nome,
    c.tipo,
    c.saldo_inicial,
    c.id_pai,
    c.nivel,
    c.ordem,
    c.criado_por,
    c.criado_em
  FROM public.fin_contas c
  WHERE (
    (p_id_pai IS NULL AND c.id_pai IS NULL)
    OR (p_id_pai IS NOT NULL AND c.id_pai = p_id_pai)
  )
  AND COALESCE(c.nivel, CASE WHEN c.id_pai IS NULL THEN 1 ELSE p_nivel END) = p_nivel
  ORDER BY c.ordem NULLS LAST, c.nome ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
