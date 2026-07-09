-- ============================================================
-- Migration: com_get_oferta_por_slug_v2
-- Data: 2026-07-04
-- Descrição: Busca oferta por slug + entidade (seguro multi-tenant)
-- ============================================================

DROP FUNCTION IF EXISTS public.com_get_oferta_por_slug;

CREATE OR REPLACE FUNCTION public.com_get_oferta_por_slug(
    p_slug TEXT,
    p_id_entidade UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'oferta', jsonb_build_object(
            'id', of.id,
            'slug', of.slug,
            'nome_curto', of.nome_curto,
            'valor_centavos', of.valor_centavos,
            'tipo_pagamento', of.tipo_pagamento,
            'parcelamento_maximo', of.parcelamento_maximo,
            'recorrencia_periodo', of.recorrencia_periodo,
            'recorrencia_intervalo', of.recorrencia_intervalo,
            'disponivel_ate', of.disponivel_ate,
            'id_entidade', of.id_entidade,

            'produto_id', pr.id,
            'nome_produto', pr.nome_produto,

            'programa_id', pg.id,
            'programa_descricao', pg.descricao,
            'gratuito', pg.gratuito,
            'exige_processo_seletivo', pg.exige_processo_seletivo,

            'nome_curso', c.nome_curso,
            'area_id', a.id,
            'nome_area', a.nome_area
        )
    ) INTO v_result
    FROM public.com_oferta of
    JOIN public.com_produto pr ON pr.id = of.id_produto
    JOIN public.aca_programa pg ON pg.id = pr.id_programa
    LEFT JOIN public.aca_curso c ON c.id = pg.id_curso
    LEFT JOIN public.aca_area a ON a.id = pg.id_area
    WHERE of.slug = p_slug
      AND (p_id_entidade IS NULL OR of.id_entidade = p_id_entidade)
      AND of.is_ativa = true
      AND of.visibilidade = 'publica'
      AND (of.disponivel_a_partir_de IS NULL OR of.disponivel_a_partir_de <= NOW())
      AND (of.disponivel_ate IS NULL OR of.disponivel_ate >= NOW());

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Oferta não encontrada');
    END IF;

    RETURN v_result;
END;
$$;
