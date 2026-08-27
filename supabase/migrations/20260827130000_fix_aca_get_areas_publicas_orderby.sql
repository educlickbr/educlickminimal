-- ============================================================
-- RPC: aca_get_areas_publicas — correção definitiva
-- Data: 2026-08-27
-- Descrição: Follow-up da migration 20260827120000 (já aplicada),
--            que restaurava a definição da função mas manteve o
--            erro 42803 (column "aca_area.nome_area" must appear
--            in the GROUP BY clause or be used in an aggregate
--            function).
--
--            Causa raiz: o ORDER BY nome_area ficava FORA do
--            agregado. Em consulta com agregado e sem GROUP BY,
--            o PostgreSQL exige que a coluna do ORDER BY esteja
--            no GROUP BY ou dentro de um agregado → erro 42803.
--            A correção move o ORDER BY para DENTRO do jsonb_agg
--            (aggregate ORDER BY), mantendo a ordenação por nome.
--
--            SECURITY DEFINER: chamada por visitantes anônimos
--            (página pública, antes do login) — justificativa
--            de exceção da regra do projeto.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_areas_publicas(p_id_entidade UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'nome_area', nome_area
        ) ORDER BY nome_area ASC
    ) INTO v_result
    FROM public.aca_area
    WHERE id_entidade = p_id_entidade;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.aca_get_areas_publicas(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_areas_publicas(UUID) TO anon, authenticated;
