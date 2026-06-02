-- ============================================================
-- Migration: aca_get_form_config_completo_filters
-- Data: 2026-05-07
-- Descrição: Adiciona os filtros de tipo_proc e tipo_cand na busca de configuração
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_form_config_completo(
    p_id_entidade UUID,
    p_programa_id UUID DEFAULT NULL,
    p_area_id UUID DEFAULT NULL,
    p_tipo_proc TEXT DEFAULT 'seletivo',
    p_tipo_cand TEXT DEFAULT 'estudante'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_target_programa_id UUID := p_programa_id;
    v_target_area_id UUID := p_area_id;
BEGIN
    IF v_target_programa_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.aca_form_config WHERE programa_id = v_target_programa_id AND tipo_proc::text = p_tipo_proc AND tipo_cand::text = p_tipo_cand AND (id_entidade = p_id_entidade OR id_entidade IS NULL)) THEN
            IF v_target_area_id IS NULL THEN
                SELECT id_area INTO v_target_area_id FROM public.aca_programa WHERE id = v_target_programa_id;
            END IF;
            v_target_programa_id := NULL;
        END IF;
    END IF;

    WITH config_data AS (
        SELECT 
            fc.bloco_nome,
            fc.bloco_ordem,
            jsonb_agg(
                jsonb_build_object(
                    'config_id', fc.id,
                    'pergunta_id', p.id,
                    'nome_interno', p.nome_interno,
                    'label', p.label,
                    'placeholder', p.placeholder,
                    'tipo_pergunta', p.tipo_pergunta,
                    'opcoes', p.opcoes,
                    'largura', fc.largura,
                    'altura', fc.altura,
                    'obrigatorio', fc.obrigatorio,
                    'pergunta_ordem', fc.pergunta_ordem,
                    'depende_de_pergunta_id', fc.depende_de_pergunta_id,
                    'resposta_esperada', fc.resposta_esperada
                ) ORDER BY fc.pergunta_ordem ASC
            ) as perguntas
        FROM public.aca_form_config fc
        JOIN public.cmct_pergunta_form p ON p.id = fc.pergunta_id
        WHERE (fc.id_entidade = p_id_entidade OR (fc.id_entidade IS NULL AND p.global = true))
          AND fc.tipo_proc::text = p_tipo_proc
          AND fc.tipo_cand::text = p_tipo_cand
          AND (
            (v_target_programa_id IS NOT NULL AND fc.programa_id = v_target_programa_id)
            OR (v_target_programa_id IS NULL AND v_target_area_id IS NOT NULL AND fc.area_id = v_target_area_id)
          )
        GROUP BY fc.bloco_nome, fc.bloco_ordem
        ORDER BY fc.bloco_ordem ASC
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'bloco', bloco_nome,
            'ordem', bloco_ordem,
            'perguntas', perguntas
        )
    ) INTO v_result
    FROM config_data;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_form_config_completo(UUID, UUID, UUID, TEXT, TEXT) TO authenticated, anon;
