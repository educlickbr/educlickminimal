-- ============================================================
-- Migration: 20260724000010 — fix aca_get_docentes_por_entidade v4
-- Descrição: Dropa AMBAS as assinaturas (2 params e 3 params)
--            e recria apenas com a correta (2 params).
-- ============================================================

DROP FUNCTION IF EXISTS public.aca_get_docentes_por_entidade(UUID, TEXT);
DROP FUNCTION IF EXISTS public.aca_get_docentes_por_entidade(UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.aca_get_docentes_por_entidade(
    p_id_entidade UUID,
    p_busca TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.nome), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            d.id,
            d.id_user_expandido,
            ue.nome_completo AS nome,
            ue.email
        FROM public.aca_docente d
        JOIN public.user_expandido ue ON ue.id = d.id_user_expandido
        WHERE d.id_entidade = p_id_entidade
          AND d.ativo = true
          AND (
              p_busca IS NULL
              OR p_busca = ''
              OR ue.nome_completo ILIKE '%' || p_busca || '%'
              OR ue.email ILIKE '%' || p_busca || '%'
          )
        ORDER BY ue.nome_completo
    ) sub;

    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'itens', v_itens
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_get_docentes_por_entidade(UUID, TEXT) TO authenticated;
