-- ============================================================
-- RPC: aca_list_areas
-- Data: 2026-06-17
-- Descrição: Lista áreas educacionais de uma entidade (paginado)
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_list_areas(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_itens JSONB;
BEGIN
    v_offset := (p_pagina - 1) * p_limite;

    SELECT COUNT(*) INTO v_total
    FROM public.aca_area
    WHERE id_entidade = p_id_entidade;

    SELECT jsonb_agg(sub) INTO v_itens
    FROM (
        SELECT id, nome_area, descricao, id_entidade, criado_em
        FROM public.aca_area
        WHERE id_entidade = p_id_entidade
        ORDER BY nome_area ASC
        LIMIT p_limite OFFSET v_offset
    ) sub;

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb),
        'total', v_total,
        'pagina', p_pagina,
        'limite', p_limite
    );
END;
$$;
