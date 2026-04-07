-- MIGRATION: RPC para buscar nome do usuário em user_expandido
-- Data: 2026-03-18

CREATE OR REPLACE FUNCTION public.get_user_expandido_header(
  p_id_user uuid
)
RETURNS TABLE (
  id_user uuid,
  email text,
  nome_completo text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ue.id_user, ue.email, ue.nome_completo
  FROM public.user_expandido ue
  WHERE ue.id_user = p_id_user
  ORDER BY ue.criado_em DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_expandido_header(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_expandido_header(uuid) TO service_role;
