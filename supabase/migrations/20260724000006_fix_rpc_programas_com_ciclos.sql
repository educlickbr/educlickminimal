-- ============================================================
-- Migration: 20260724000006 — fix aca_get_programas_com_ciclos
-- Descrição: Corrige erro "DISTINCT + ORDER BY" no aggregate.
--            DISTINCT movido para a subquery.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_programas_com_ciclos(
    p_id_entidade UUID,
    p_ano_semestre VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_programas JSONB;
    v_ano_semestres JSONB;
BEGIN
    -- Programas que têm ciclos (com filtro opcional de ano_semestre)
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.descricao), '[]'::JSONB)
    INTO v_programas
    FROM (
        SELECT DISTINCT p.id, p.descricao
        FROM public.aca_programa p
        INNER JOIN public.aca_ciclo_programa cp ON cp.id_programa = p.id
        INNER JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
        WHERE p.id_entidade = p_id_entidade
          AND (p_ano_semestre IS NULL OR c.ano_semestre = p_ano_semestre)
        ORDER BY p.descricao
    ) sub;

    -- Anos/semestres disponíveis nos ciclos da entidade
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub DESC), '[]'::JSONB)
    INTO v_ano_semestres
    FROM (
        SELECT DISTINCT c.ano_semestre
        FROM public.aca_ciclo c
        INNER JOIN public.aca_ciclo_programa cp ON cp.id_ciclo = c.id
        INNER JOIN public.aca_programa p ON p.id = cp.id_programa
        WHERE p.id_entidade = p_id_entidade
          AND c.ano_semestre IS NOT NULL
        ORDER BY c.ano_semestre DESC
    ) sub;

    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'programas', v_programas,
        'ano_semestres', v_ano_semestres
    );
END;
$$;
