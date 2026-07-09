-- ============================================================
-- RPC: com_get_oferta_por_id
-- Busca oferta pelo UUID (global, sem depender de slug+entidade)
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_get_oferta_por_id(
    p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'oferta', jsonb_build_object(
            'id', of.id,
            'id_entidade', of.id_entidade,
            'id_produto', of.id_produto,
            'slug', of.slug,
            'nome_curto', of.nome_curto,
            'valor_centavos', of.valor_centavos,
            'tipo_pagamento', of.tipo_pagamento,
            'parcelamento_maximo', of.parcelamento_maximo,
            'disponivel_a_partir_de', of.disponivel_a_partir_de,
            'disponivel_ate', of.disponivel_ate,
            'visibilidade', of.visibilidade,
            'exige_elegibilidade', of.exige_elegibilidade,
            'is_ativa', of.is_ativa,
            'nome_produto', pr.nome_produto,
            'programa_descricao', pg.descricao,
            'programa_id', pg.id
        )
    ) INTO v_result
    FROM public.com_oferta of
    JOIN public.com_produto pr ON pr.id = of.id_produto
    JOIN public.aca_programa pg ON pg.id = pr.id_programa
    WHERE of.id = p_id;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Oferta não encontrada');
    END IF;

    RETURN v_result;
END;
$$;
