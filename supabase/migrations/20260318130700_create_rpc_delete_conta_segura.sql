-- MIGRATION: RPC para exclusão segura de conta
-- Data: 2026-03-18

CREATE OR REPLACE FUNCTION public.delete_conta_segura(
  p_id uuid,
  p_confirmar boolean DEFAULT false
)
RETURNS TABLE (
  can_delete boolean,
  deleted boolean,
  motivo text,
  has_children boolean,
  has_lancamentos boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_children boolean := false;
  v_has_lancamentos boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.fin_contas c
    WHERE c.id_pai = p_id
  ) INTO v_has_children;

  SELECT EXISTS (
    SELECT 1
    FROM public.fin_lancamentos l
    WHERE l.id_conta = p_id
  ) INTO v_has_lancamentos;

  IF v_has_children THEN
    RETURN QUERY SELECT false, false, 'Não é possível excluir: esta conta possui filhos. Exclua os filhos primeiro.', true, v_has_lancamentos;
    RETURN;
  END IF;

  IF v_has_lancamentos THEN
    RETURN QUERY SELECT false, false, 'Não é possível excluir: existem lançamentos vinculados a esta conta.', v_has_children, true;
    RETURN;
  END IF;

  IF NOT p_confirmar THEN
    RETURN QUERY SELECT true, false, 'Conta apta para exclusão.', false, false;
    RETURN;
  END IF;

  DELETE FROM public.fin_contas c
  WHERE c.id = p_id;

  RETURN QUERY SELECT true, true, 'Conta excluída com sucesso.', false, false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_conta_segura(uuid, boolean) TO authenticated;
