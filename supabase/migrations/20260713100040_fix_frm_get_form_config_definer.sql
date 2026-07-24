-- ============================================================
-- Migration: 20260713100040 — Fix frm_get_form_config DEFINER
-- ============================================================
-- A RPC é SECURITY INVOKER, mas o usuário logado (candidato)
-- não tem entidade no JWT ainda (só será vinculada pós-form).
-- A RLS de aca_form_config bloqueia o SELECT.
--
-- Solução: SECURITY DEFINER para bypassar RLS.
-- Seguro porque é apenas leitura de config de formulário.
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
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.frm_get_form_config(uuid, uuid, uuid, tipo_processo, tipo_candidatura, text) TO authenticated;
