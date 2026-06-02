-- ============================================================
-- RPC: frm_get_formularios_salvos
-- Lista todas as configurações de formulário únicas por entidade,
-- retornando o nome do contexto (área ou programa), tipo_proc e tipo_cand.
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_get_formularios_salvos(
    p_id_entidade uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'area_id',      fc.area_id,
                'programa_id',  fc.programa_id,
                'tipo_proc',    fc.tipo_proc,
                'tipo_cand',    fc.tipo_cand,
                'total_campos', fc.total_campos,
                -- Nome do contexto: área ou programa
                'contexto_tipo',  CASE
                                    WHEN fc.area_id IS NOT NULL THEN 'area'
                                    ELSE 'programa'
                                  END,
                'contexto_nome',  CASE
                                    WHEN fc.area_id IS NOT NULL THEN ar.nome_area
                                    ELSE pr.descricao
                                  END
            ) ORDER BY fc.tipo_proc ASC, fc.tipo_cand ASC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM (
        -- Agrega as combinações únicas e conta campos
        SELECT
            area_id,
            programa_id,
            tipo_proc,
            tipo_cand,
            COUNT(*) AS total_campos
        FROM public.aca_form_config
        WHERE id_entidade = p_id_entidade
        GROUP BY area_id, programa_id, tipo_proc, tipo_cand
    ) fc
    LEFT JOIN public.aca_area ar      ON ar.id = fc.area_id
    LEFT JOIN public.aca_programa pr  ON pr.id = fc.programa_id;

    RETURN jsonb_build_object('success', true, 'data', v_result);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
