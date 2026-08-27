-- ============================================================
-- RPC: aca_get_areas_publicas
-- Data: 2026-08-27
-- Descrição: Corrige a versão deployada no banco, que quebrava
--            com erro 42803 (column "aca_area.nome_area" must
--            appear in the GROUP BY clause...). A função passou
--            a ter um GROUP BY incompleto fora das migrations do
--            repo; esta migration restaura a definição correta:
--            lista as áreas da entidade para o filtro da página
--            pública /oferta.
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
        )
    ) INTO v_result
    FROM public.aca_area
    WHERE id_entidade = p_id_entidade
    ORDER BY nome_area ASC;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Garante o estado final de permissões (anon + authenticated)
REVOKE ALL ON FUNCTION public.aca_get_areas_publicas(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_areas_publicas(UUID) TO anon, authenticated;
