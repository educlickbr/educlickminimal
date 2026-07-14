-- ============================================================
-- Migration: 20260713100011 — Add escopo column to aca_form_config
-- ============================================================
-- Escopo explícito: 'area', 'programa' ou 'global'.
-- Regra: docente → global, estudante → area/programa
-- Mantém compatibilidade com assinaturas existentes.
-- ============================================================

-- 1. Adiciona coluna escopo
ALTER TABLE public.aca_form_config
ADD COLUMN IF NOT EXISTS escopo TEXT;

-- 2. Popula escopo com base nos dados existentes
UPDATE public.aca_form_config
SET escopo = CASE
    WHEN area_id IS NOT NULL THEN 'area'
    WHEN programa_id IS NOT NULL THEN 'programa'
    ELSE 'area'
END
WHERE escopo IS NULL;

-- 3. Torna NOT NULL depois de populado
ALTER TABLE public.aca_form_config
ALTER COLUMN escopo SET NOT NULL;

-- 4. CHECK constraint no escopo
ALTER TABLE public.aca_form_config
ADD CONSTRAINT chk_aca_form_config_escopo
CHECK (escopo IN ('area', 'programa', 'global'));

-- 5. Atualiza a constraint check_entidade para aceitar global
ALTER TABLE public.aca_form_config
DROP CONSTRAINT IF EXISTS check_entidade;

ALTER TABLE public.aca_form_config
ADD CONSTRAINT check_entidade CHECK (
    (escopo = 'area' AND area_id IS NOT NULL AND programa_id IS NULL) OR
    (escopo = 'programa' AND area_id IS NULL AND programa_id IS NOT NULL) OR
    (escopo = 'global' AND area_id IS NULL AND programa_id IS NULL)
);

-- ============================================================
-- RPC: frm_upsert_form_config (V3 — adiciona escopo)
-- ============================================================
-- Mantém a assinatura V2 + p_escopo. Se escopo não informado,
-- é deduzido de area_id/programa_id (compatibilidade reversa).
CREATE OR REPLACE FUNCTION public.frm_upsert_form_config(
    p_id_entidade uuid,
    p_area_id uuid,
    p_programa_id uuid,
    p_tipo_proc tipo_processo,
    p_tipo_cand tipo_candidatura,
    p_items jsonb,
    p_old_area_id uuid DEFAULT NULL,
    p_old_programa_id uuid DEFAULT NULL,
    p_old_tipo_proc tipo_processo DEFAULT NULL,
    p_old_tipo_cand tipo_candidatura DEFAULT NULL,
    p_escopo TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_escopo TEXT;
    v_old_escopo TEXT;
BEGIN
    -- Deduz escopo se não informado (compatibilidade reversa)
    v_escopo := COALESCE(p_escopo, CASE
        WHEN p_area_id IS NOT NULL THEN 'area'
        WHEN p_programa_id IS NOT NULL THEN 'programa'
        ELSE 'area'
    END);

    v_old_escopo := CASE
        WHEN p_old_area_id IS NOT NULL THEN 'area'
        WHEN p_old_programa_id IS NOT NULL THEN 'programa'
        ELSE v_escopo
    END;

    -- Remove configuração antiga (se mudou de escopo)
    IF (p_old_area_id IS NOT NULL OR p_old_programa_id IS NOT NULL OR p_old_tipo_proc IS NOT NULL OR p_old_tipo_cand IS NOT NULL) THEN
        DELETE FROM public.aca_form_config
        WHERE id_entidade = p_id_entidade
          AND tipo_proc = COALESCE(p_old_tipo_proc, p_tipo_proc)
          AND tipo_cand = COALESCE(p_old_tipo_cand, p_tipo_cand)
          AND (
              (v_old_escopo = 'area' AND area_id = p_old_area_id AND programa_id IS NULL) OR
              (v_old_escopo = 'programa' AND programa_id = p_old_programa_id AND area_id IS NULL) OR
              (v_old_escopo = 'global' AND area_id IS NULL AND programa_id IS NULL)
          );
    ELSE
        DELETE FROM public.aca_form_config
        WHERE id_entidade = p_id_entidade
          AND tipo_proc = p_tipo_proc
          AND tipo_cand = p_tipo_cand
          AND (
              (v_escopo = 'area' AND area_id = p_area_id AND programa_id IS NULL) OR
              (v_escopo = 'programa' AND programa_id = p_programa_id AND area_id IS NULL) OR
              (v_escopo = 'global' AND area_id IS NULL AND programa_id IS NULL)
          );
    END IF;

    -- Insere novos itens
    WITH itens AS (
        SELECT
            (jsonb_array_elements(p_items)->>'pergunta_id')::uuid AS pergunta_id,
            COALESCE(jsonb_array_elements(p_items)->>'bloco_nome', 'Dados Gerais') AS bloco_nome,
            COALESCE((jsonb_array_elements(p_items)->>'bloco_ordem')::int, 1) AS bloco_ordem,
            COALESCE((jsonb_array_elements(p_items)->>'pergunta_ordem')::int, 1) AS pergunta_ordem,
            COALESCE((jsonb_array_elements(p_items)->>'largura')::tipo_largura, '2') AS largura,
            COALESCE((jsonb_array_elements(p_items)->>'altura')::int, 36) AS altura,
            COALESCE((jsonb_array_elements(p_items)->>'obrigatorio')::boolean, false) AS obrigatorio,
            (jsonb_array_elements(p_items)->>'depende_de_pergunta_id')::uuid AS depende_de_pergunta_id,
            jsonb_array_elements(p_items)->>'resposta_esperada' AS resposta_esperada
    )
    INSERT INTO public.aca_form_config (
        id_entidade, area_id, programa_id, escopo,
        tipo_proc, tipo_cand,
        pergunta_id, bloco_nome, bloco_ordem, pergunta_ordem,
        largura, altura, obrigatorio,
        depende_de_pergunta_id, resposta_esperada
    )
    SELECT
        p_id_entidade,
        CASE WHEN v_escopo = 'area' THEN p_area_id ELSE NULL END,
        CASE WHEN v_escopo = 'programa' THEN p_programa_id ELSE NULL END,
        v_escopo,
        p_tipo_proc, p_tipo_cand,
        pergunta_id, bloco_nome, bloco_ordem, pergunta_ordem,
        largura, altura, obrigatorio,
        depende_de_pergunta_id, resposta_esperada
    FROM itens;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: frm_get_form_config (V2 — adiciona escopo)
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_get_form_config(
    p_id_entidade uuid,
    p_area_id uuid DEFAULT NULL,
    p_programa_id uuid DEFAULT NULL,
    p_tipo_proc tipo_processo DEFAULT 'matricula',
    p_tipo_cand tipo_candidatura DEFAULT 'estudante',
    p_escopo TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_escopo TEXT;
    v_result jsonb;
BEGIN
    v_escopo := COALESCE(p_escopo, CASE
        WHEN p_area_id IS NOT NULL THEN 'area'
        WHEN p_programa_id IS NOT NULL THEN 'programa'
        ELSE 'global'
    END);

    SELECT jsonb_agg(
        jsonb_build_object(
            'pergunta_id', fc.pergunta_id,
            'pergunta_nome_interno', p.nome_interno,
            'pergunta_label', p.label,
            'pergunta_placeholder', p.placeholder,
            'pergunta_tipo', p.tipo_pergunta,
            'pergunta_opcoes', p.opcoes,
            'pergunta_global', p.global,
            'bloco_nome', fc.bloco_nome,
            'bloco_ordem', fc.bloco_ordem,
            'pergunta_ordem', fc.pergunta_ordem,
            'largura', fc.largura,
            'altura', fc.altura,
            'obrigatorio', fc.obrigatorio,
            'depende_de_pergunta_id', fc.depende_de_pergunta_id,
            'resposta_esperada', fc.resposta_esperada
        ) ORDER BY fc.bloco_ordem, fc.pergunta_ordem
    ) INTO v_result
    FROM public.aca_form_config fc
    JOIN public.cmct_pergunta_form p ON p.id = fc.pergunta_id
    WHERE fc.id_entidade = p_id_entidade
      AND fc.tipo_proc = p_tipo_proc
      AND fc.tipo_cand = p_tipo_cand
      AND fc.escopo = v_escopo
      AND (
          (v_escopo = 'area' AND fc.area_id = p_area_id AND fc.programa_id IS NULL) OR
          (v_escopo = 'programa' AND fc.programa_id = p_programa_id AND fc.area_id IS NULL) OR
          (v_escopo = 'global' AND fc.area_id IS NULL AND fc.programa_id IS NULL)
      );

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_result, '[]'::jsonb)
    );
END;
$$;

-- ============================================================
-- RPC: frm_get_formularios_salvos (V2 — inclui escopo)
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_get_formularios_salvos(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(sub ORDER BY sub.tipo_cand, sub.escopo)
    INTO v_result
    FROM (
        SELECT DISTINCT
            fc.escopo,
            fc.tipo_proc,
            fc.tipo_cand,
            fc.area_id,
            a.nome_area AS area_nome,
            fc.programa_id,
            prog.descricao AS programa_nome,
            COUNT(*) OVER (PARTITION BY fc.escopo, fc.tipo_proc, fc.tipo_cand,
                COALESCE(fc.area_id::TEXT, ''), COALESCE(fc.programa_id::TEXT, '')) AS qtd_perguntas
        FROM public.aca_form_config fc
        LEFT JOIN public.aca_area a ON a.id = fc.area_id
        LEFT JOIN public.aca_programa prog ON prog.id = fc.programa_id
        WHERE fc.id_entidade = p_id_entidade
    ) sub;

    RETURN jsonb_build_object('success', true, 'itens', COALESCE(v_result, '[]'::jsonb));
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.frm_upsert_form_config(uuid, uuid, uuid, tipo_processo, tipo_candidatura, jsonb, uuid, uuid, tipo_processo, tipo_candidatura, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.frm_get_form_config(uuid, uuid, uuid, tipo_processo, tipo_candidatura, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.frm_get_formularios_salvos(uuid) TO authenticated;
