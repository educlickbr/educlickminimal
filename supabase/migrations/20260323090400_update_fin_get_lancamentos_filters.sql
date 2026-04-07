-- MIGRATION: Update fin_get_lancamentos RPC to support location and category recursion
-- Data: 2026-03-23

DROP FUNCTION IF EXISTS public.fin_get_lancamentos(uuid, uuid, uuid, date, date, boolean);
DROP FUNCTION IF EXISTS public.fin_get_lancamentos(uuid, uuid, uuid, uuid, date, date, boolean);

CREATE OR REPLACE FUNCTION public.fin_get_lancamentos(
  p_id_entidade       uuid,
  p_id_conta          uuid DEFAULT NULL,
  p_id_categoria      uuid DEFAULT NULL,
  p_id_local          uuid DEFAULT NULL,
  p_data_inicio       date DEFAULT NULL,
  p_data_fim          date DEFAULT NULL,
  p_apenas_pai        boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  id_entidade uuid,
  id_conta uuid,
  conta_nome text,
  id_categoria uuid,
  categoria_nome text,
  id_local uuid,
  local_nome text,
  id_lancamento_pai uuid,
  descricao text,
  valor numeric(12,2),
  tipo text,
  data date,
  parcelado boolean,
  parcela_n integer,
  qtd_parcelas integer,
  id_grupo_parcelas uuid,
  criado_por uuid,
  criado_em timestamptz
) 
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE cat_tree AS (
    SELECT id FROM public.fin_categorias WHERE id = p_id_categoria
    UNION
    SELECT c.id FROM public.fin_categorias c
    INNER JOIN cat_tree ct ON c.id_pai = ct.id
  )
  SELECT 
    l.id, 
    l.id_entidade, 
    l.id_conta, 
    c.nome as conta_nome,
    l.id_categoria, 
    cat.nome as categoria_nome,
    l.id_local,
    loc.nome as local_nome,
    l.id_lancamento_pai, 
    l.descricao, 
    l.valor, 
    l.tipo, 
    l.data,
    l.parcelado, 
    l.parcela_n, 
    l.qtd_parcelas, 
    l.id_grupo_parcelas,
    l.criado_por, 
    l.criado_em
  FROM public.fin_lancamentos l
  LEFT JOIN public.fin_contas c ON l.id_conta = c.id
  LEFT JOIN public.fin_categorias cat ON l.id_categoria = cat.id
  LEFT JOIN public.fin_locais loc ON l.id_local = loc.id
  WHERE l.id_entidade = p_id_entidade
    AND (p_id_conta IS NULL OR l.id_conta = p_id_conta)
    AND (p_id_local IS NULL OR l.id_local = p_id_local)
    AND (p_id_categoria IS NULL OR l.id_categoria IN (SELECT id FROM cat_tree))
    AND (p_data_inicio IS NULL OR l.data >= p_data_inicio)
    AND (p_data_fim IS NULL OR l.data <= p_data_fim)
    AND (NOT p_apenas_pai OR l.id_lancamento_pai IS NULL)
  ORDER BY l.data DESC, l.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fin_get_lancamentos(uuid, uuid, uuid, uuid, date, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_get_lancamentos(uuid, uuid, uuid, uuid, date, date, boolean) TO service_role;
