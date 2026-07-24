-- ============================================================
-- Migration: 20260724000008 — fix aca_get_docentes_por_entidade
-- Descrição: Adiciona SET search_path e GRANT EXECUTE,
--            seguindo mesmo padrão da aca_get_docentes.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_docentes_por_entidade(
    p_id_entidade UUID,
    p_busca TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', d.id,
            'id_user_expandido', d.id_user_expandido,
            'nome', COALESCE(uex.nome_completo, '—'),
            'email', uex.email
        ) ORDER BY uex.nome_completo
    ) INTO v_itens
    FROM public.aca_docente d
    INNER JOIN public.user_expandido uex ON uex.id = d.id_user_expandido
    WHERE d.id_entidade = p_id_entidade
      AND d.ativo = true
      AND (
          p_busca IS NULL
          OR uex.nome_completo ILIKE '%' || p_busca || '%'
          OR uex.email ILIKE '%' || p_busca || '%'
      );

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_get_docentes_por_entidade(UUID, TEXT) TO authenticated;
