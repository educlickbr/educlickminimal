-- ============================================================
-- Migration: 20260713100038 — Fix aca_get_editais_publicos
-- ============================================================
-- Adiciona id_form_config ao SELECT para que a página
-- pública de inscrição consiga carregar o formulário.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_editais_publicos(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.criado_em DESC), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            e.id,
            e.nome,
            e.descricao,
            e.data_ini,
            e.data_fim,
            e.id_form_config,
            e.criado_em
        FROM public.aca_edital_docente e
        WHERE e.id_entidade = p_id_entidade
          AND e.status = 'ativo'
          AND e.data_fim >= CURRENT_DATE
        ORDER BY e.criado_em DESC
    ) sub;

    RETURN JSONB_BUILD_OBJECT('success', true, 'itens', v_itens);
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_get_editais_publicos(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.aca_get_editais_publicos(UUID) TO authenticated;
