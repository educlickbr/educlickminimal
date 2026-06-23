-- ============================================================
-- RPC: aca_verificar_inscricoes_lote
-- Verifica em lote se o usuário autenticado está inscrito
-- em cada um dos processos fornecidos.
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_verificar_inscricoes_lote(
    p_id_processos UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_expandido_id UUID;
    v_result JSONB;
BEGIN
    SELECT ue.id INTO v_user_expandido_id
    FROM public.user_expandido ue
    WHERE ue.id_user = auth.uid()
    LIMIT 1;

    SELECT COALESCE(jsonb_object_agg(psi.id_processo, true), '{}'::jsonb)
    INTO v_result
    FROM public.aca_processo_seletivo_inscricoes psi
    WHERE psi.id_usuario = v_user_expandido_id
      AND psi.id_processo = ANY(p_id_processos);

    RETURN jsonb_build_object('success', true, 'inscritos', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_verificar_inscricoes_lote(UUID[]) TO authenticated;
