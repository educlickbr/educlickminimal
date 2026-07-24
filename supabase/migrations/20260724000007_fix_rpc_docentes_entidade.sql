-- ============================================================
-- Migration: 20260724000007 — fix aca_get_docentes_por_entidade
-- Descrição: Recria a RPC como SECURITY DEFINER porque ela
--            precisa acessar user_expandido (outros usuários)
--            para montar a lista de docentes.
--            Justificativa: função administrativa usada apenas
--            no módulo de atribuição por admin/gestores.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_docentes_por_entidade(
    p_id_entidade UUID,
    p_busca TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
