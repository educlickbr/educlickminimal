-- MIGRATION: RPC para atualizar nome de categoria
-- Data: 2026-03-18

CREATE OR REPLACE FUNCTION public.upsert_categoria_nome(
  p_id uuid,
  p_nome text
)
RETURNS TABLE (
  id uuid,
  nome text,
  tipo text,
  id_pai uuid,
  nivel integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.fin_categorias c
  SET nome = p_nome
  WHERE c.id = p_id
  RETURNING c.id, c.nome, c.tipo, c.id_pai, c.nivel;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_categoria_nome(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_categoria_nome(uuid, text) TO service_role;
