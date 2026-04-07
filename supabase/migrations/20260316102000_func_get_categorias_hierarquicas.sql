-- MIGRATION: Função para buscar categorias paginadas e hierárquicas
-- Data: 2026-03-16
-- Autor: Copilot

CREATE OR REPLACE FUNCTION public.get_categorias_hierarquicas(
    p_id_pai uuid DEFAULT NULL,
    p_nivel integer DEFAULT 1,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    id_entidade uuid,
    nome text,
    tipo text,
    id_pai uuid,
    nivel integer,
    ordem integer,
    criado_por uuid,
    criado_em timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, id_entidade, nome, tipo, id_pai, nivel, ordem, criado_por, criado_em
    FROM public.fin_categorias
    WHERE (p_id_pai IS NULL AND id_pai IS NULL OR p_id_pai IS NOT NULL AND id_pai = p_id_pai)
      AND (nivel = p_nivel)
    ORDER BY ordem NULLS LAST, nome ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Para remover: DROP FUNCTION IF EXISTS public.get_categorias_hierarquicas(uuid, integer, integer, integer);
