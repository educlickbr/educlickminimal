-- ============================================================
-- Migration: 20260713100039 — Fix escopo backfill para global
-- ============================================================
-- A migration 00011 setou escopo = 'area' quando area_id e
-- programa_id são NULL. O correto é 'global'.
-- Isso afeta formulários de docente (escopo global).
-- ============================================================

-- Corrige registros existentes
UPDATE public.aca_form_config
SET escopo = 'global'
WHERE escopo = 'area'
  AND area_id IS NULL
  AND programa_id IS NULL;

-- Corrige também o default no upsert para quando ambos são NULL
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
        ELSE 'global'  -- ← CORRIGIDO: antes era 'area'
    END);

    v_old_escopo := CASE
        WHEN p_old_area_id IS NOT NULL THEN 'area'
        WHEN p_old_programa_id IS NOT NULL THEN 'programa'
        ELSE 'global'  -- ← CORRIGIDO: antes era 'area'
    END;

    -- Deleta configuração antiga (se houver mudança de chave)
    IF (p_old_area_id IS NOT NULL OR p_old_programa_id IS NOT NULL OR p_old_tipo_proc IS NOT NULL OR p_old_tipo_cand IS NOT NULL) THEN
        DELETE FROM public.aca_form_config
        WHERE id_entidade = p_id_entidade
          AND COALESCE(area_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_old_area_id, '00000000-0000-0000-0000-000000000000')
          AND COALESCE(programa_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_old_programa_id, '00000000-0000-0000-0000-000000000000')
          AND tipo_proc = COALESCE(p_old_tipo_proc, p_tipo_proc)
          AND tipo_cand = COALESCE(p_old_tipo_cand, p_tipo_cand);
    END IF;

    -- Deleta configuração existente para evitar duplicatas
    DELETE FROM public.aca_form_config
    WHERE id_entidade = p_id_entidade
      AND COALESCE(area_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_area_id, '00000000-0000-0000-0000-000000000000')
      AND COALESCE(programa_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_programa_id, '00000000-0000-0000-0000-000000000000')
      AND tipo_proc = p_tipo_proc
      AND tipo_cand = p_tipo_cand;

    -- Insere os itens
    WITH itens AS (
        SELECT
            (item->>'pergunta_id')::uuid AS pergunta_id,
            COALESCE(item->>'bloco_nome', 'Dados Gerais') AS bloco_nome,
            (item->>'bloco_ordem')::int AS bloco_ordem,
            (item->>'pergunta_ordem')::int AS pergunta_ordem,
            COALESCE((item->>'largura')::tipo_largura, '2') AS largura,
            COALESCE((item->>'altura')::int, 36) AS altura,
            (item->>'obrigatorio')::boolean AS obrigatorio,
            NULL::uuid AS depende_de_pergunta_id,
            NULL::text AS resposta_esperada
        FROM jsonb_array_elements(p_items) AS item
    )
    INSERT INTO public.aca_form_config (
        id_entidade, area_id, programa_id, tipo_proc, tipo_cand, escopo,
        pergunta_id, bloco_nome, bloco_ordem, pergunta_ordem,
        largura, altura, obrigatorio,
        depende_de_pergunta_id, resposta_esperada
    )
    SELECT
        p_id_entidade, p_area_id, p_programa_id, p_tipo_proc, p_tipo_cand, v_escopo,
        pergunta_id, bloco_nome, bloco_ordem, pergunta_ordem,
        largura, altura, obrigatorio,
        depende_de_pergunta_id, resposta_esperada
    FROM itens;

    RETURN jsonb_build_object('success', true);
END;
$$;
