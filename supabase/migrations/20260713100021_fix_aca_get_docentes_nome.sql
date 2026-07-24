-- ============================================================
-- Migration: 20260713100021 — Fix aca_get_docentes column name
-- ============================================================
-- Corrige a referência de aca_componente.nome para
-- aca_componente.nome_componente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_docentes(
    p_id_entidade UUID,
    p_busca TEXT DEFAULT NULL,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_itens JSONB;
BEGIN
    v_offset := (p_pagina - 1) * p_limite;

    SELECT COUNT(*)
    INTO v_total
    FROM public.aca_docente d
    JOIN public.user_expandido ue ON ue.id = d.id_user_expandido
    WHERE d.id_entidade = p_id_entidade
      AND (
          p_busca IS NULL
          OR p_busca = ''
          OR ue.nome_completo ILIKE '%' || p_busca || '%'
          OR ue.email ILIKE '%' || p_busca || '%'
      );

    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.nome_completo), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            d.id,
            d.id_user_expandido,
            ue.nome_completo,
            ue.email,
            d.ativo,
            d.valor_hora_aula,
            d.criado_em,
            (
                SELECT COALESCE(JSONB_AGG(comp ORDER BY comp), '[]'::JSONB)
                FROM (
                    SELECT ac.nome_componente
                    FROM public.aca_docente_vinculo dv
                    JOIN public.aca_componente ac ON ac.id = dv.id_componente
                    WHERE dv.id_docente = d.id
                      AND dv.elegivel = true
                    ORDER BY ac.nome_componente
                ) comp
            ) AS componentes
        FROM public.aca_docente d
        JOIN public.user_expandido ue ON ue.id = d.id_user_expandido
        WHERE d.id_entidade = p_id_entidade
          AND (
              p_busca IS NULL
              OR p_busca = ''
              OR ue.nome_completo ILIKE '%' || p_busca || '%'
              OR ue.email ILIKE '%' || p_busca || '%'
          )
        ORDER BY ue.nome_completo
        LIMIT p_limite
        OFFSET v_offset
    ) sub;

    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'itens', v_itens,
        'total', v_total,
        'pagina', p_pagina,
        'limite', p_limite
    );
END;
$$;
