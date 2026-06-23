-- ============================================================
-- RPC: aca_validar_form_obrigatorio
-- Valida se todos os campos obrigatórios do formulário foram
-- respondidos antes de finalizar a inscrição.
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_validar_form_obrigatorio(
    p_id_entidade UUID,
    p_area_id UUID DEFAULT NULL,
    p_programa_id UUID DEFAULT NULL,
    p_tipo_proc TEXT DEFAULT 'seletivo',
    p_tipo_cand TEXT DEFAULT 'estudante',
    p_user_expandido_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pendentes JSONB;
BEGIN
    -- Find all required fields for this form config
    -- then check which ones don't have a valid answer
    WITH obrigatorias AS (
        SELECT fc.pergunta_id, p.label
        FROM public.aca_form_config fc
        JOIN public.cmct_pergunta_form p ON p.id = fc.pergunta_id
        WHERE (fc.id_entidade = p_id_entidade OR (fc.id_entidade IS NULL AND p.global = true))
          AND fc.obrigatorio = true
          AND fc.tipo_proc::text = p_tipo_proc
          AND fc.tipo_cand::text = p_tipo_cand
          AND (
            (p_area_id IS NOT NULL AND fc.area_id = p_area_id)
            OR (p_programa_id IS NOT NULL AND fc.programa_id = p_programa_id)
          )
        ORDER BY fc.bloco_ordem, fc.pergunta_ordem
    ),
    respondidas AS (
        SELECT id_pergunta
        FROM public.aca_resposta_form
        WHERE id_user_expandido = p_user_expandido_id
          AND (
            (resposta IS NOT NULL AND resposta != '')
            OR id_arquivo IS NOT NULL
          )
    )
    SELECT jsonb_agg(jsonb_build_object(
        'pergunta_id', o.pergunta_id,
        'label', o.label
    )) INTO v_pendentes
    FROM obrigatorias o
    LEFT JOIN respondidas r ON r.id_pergunta = o.pergunta_id
    WHERE r.id_pergunta IS NULL;

    IF v_pendentes IS NULL OR jsonb_array_length(v_pendentes) = 0 THEN
        RETURN jsonb_build_object('success', true, 'valid', true);
    ELSE
        RETURN jsonb_build_object('success', true, 'valid', false, 'pendentes', v_pendentes);
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_validar_form_obrigatorio(UUID, UUID, UUID, TEXT, TEXT, UUID) TO authenticated;
