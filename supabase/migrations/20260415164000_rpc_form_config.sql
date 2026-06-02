-- ============================================================
-- RPC: frm_upsert_form_config
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_upsert_form_config(
    p_id_entidade uuid,
    p_area_id uuid,
    p_programa_id uuid,
    p_tipo_proc tipo_processo,
    p_tipo_cand tipo_candidatura,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    item jsonb;
BEGIN
    -- Validar a constraint base do form_config (ou um ou outro preenchido)
    IF (p_area_id IS NOT NULL AND p_programa_id IS NOT NULL) OR (p_area_id IS NULL AND p_programa_id IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Especifique apenas area_id ou programa_id.');
    END IF;

    -- Deletar a configuração anterior para esta combinação
    DELETE FROM public.aca_form_config
    WHERE id_entidade = p_id_entidade
      AND (area_id = p_area_id OR (area_id IS NULL AND p_area_id IS NULL))
      AND (programa_id = p_programa_id OR (programa_id IS NULL AND p_programa_id IS NULL))
      AND tipo_proc = p_tipo_proc
      AND tipo_cand = p_tipo_cand;

    -- Inserir os novos itens
    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO public.aca_form_config (
                id_entidade,
                area_id,
                programa_id,
                tipo_proc,
                tipo_cand,
                pergunta_id,
                bloco_nome,
                bloco_ordem,
                pergunta_ordem,
                largura,
                altura,
                obrigatorio,
                depende_de_pergunta_id,
                resposta_esperada
            )
            VALUES (
                p_id_entidade,
                p_area_id,
                p_programa_id,
                p_tipo_proc,
                p_tipo_cand,
                (item->>'pergunta_id')::uuid,
                COALESCE(item->>'bloco_nome', 'Dados Gerais'),
                COALESCE((item->>'bloco_ordem')::int, 1),
                COALESCE((item->>'pergunta_ordem')::int, 1),
                COALESCE((item->>'largura')::tipo_largura, '2'::tipo_largura),
                COALESCE((item->>'altura')::int, 36),
                COALESCE((item->>'obrigatorio')::boolean, false),
                NULLIF(item->>'depende_de_pergunta_id', '')::uuid,
                item->>'resposta_esperada'
            );
        END LOOP;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ============================================================
-- RPC: frm_get_form_config
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_get_form_config(
    p_id_entidade uuid,
    p_area_id uuid,
    p_programa_id uuid,
    p_tipo_proc tipo_processo,
    p_tipo_cand tipo_candidatura
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
                'id', fc.id,
                'pergunta_id', fc.pergunta_id,
                'bloco_nome', fc.bloco_nome,
                'bloco_ordem', fc.bloco_ordem,
                'pergunta_ordem', fc.pergunta_ordem,
                'largura', fc.largura,
                'altura', fc.altura,
                'obrigatorio', fc.obrigatorio,
                'depende_de_pergunta_id', fc.depende_de_pergunta_id,
                'resposta_esperada', fc.resposta_esperada,
                'cmct_pergunta_form', row_to_json(p)
            ) ORDER BY fc.bloco_ordem ASC, fc.pergunta_ordem ASC
        ), 
        '[]'::jsonb
    )
    INTO v_result
    FROM public.aca_form_config fc
    JOIN public.cmct_pergunta_form p ON p.id = fc.pergunta_id
    WHERE fc.id_entidade = p_id_entidade
      AND (fc.area_id = p_area_id OR (fc.area_id IS NULL AND p_area_id IS NULL))
      AND (fc.programa_id = p_programa_id OR (fc.programa_id IS NULL AND p_programa_id IS NULL))
      AND fc.tipo_proc = p_tipo_proc
      AND fc.tipo_cand = p_tipo_cand;

    RETURN jsonb_build_object('success', true, 'data', v_result);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
