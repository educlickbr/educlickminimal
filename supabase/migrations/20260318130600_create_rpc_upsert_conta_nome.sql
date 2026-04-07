-- MIGRATION: RPC para criar/editar contas (upsert)
-- Data: 2026-03-18

CREATE OR REPLACE FUNCTION public.upsert_conta_nome(
  p_id uuid DEFAULT NULL,
  p_nome text DEFAULT NULL,
  p_tipo public.fin_tipo_conta DEFAULT 'Banco'::public.fin_tipo_conta,
  p_id_pai uuid DEFAULT NULL,
  p_nivel integer DEFAULT NULL,
  p_id_entidade uuid DEFAULT NULL
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.fin_contas%ROWTYPE;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.fin_contas (
      id_entidade,
      nome,
      tipo,
      id_pai,
      nivel
    )
    VALUES (
      p_id_entidade,
      p_nome,
      p_tipo,
      p_id_pai,
      p_nivel
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.fin_contas c
    SET nome = COALESCE(NULLIF(trim(p_nome), ''), c.nome)
    WHERE c.id = p_id
    RETURNING * INTO v_row;
  END IF;

  RETURN QUERY
  SELECT v_row.id, v_row.id_entidade, v_row.nome, v_row.tipo, v_row.saldo_inicial, v_row.id_pai, v_row.nivel, v_row.ordem, v_row.criado_por, v_row.criado_em;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_conta_nome(uuid, text, public.fin_tipo_conta, uuid, integer, uuid) TO authenticated;
