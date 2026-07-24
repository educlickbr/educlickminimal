-- ============================================================
-- Migration: 20260724000003 — fix RPCs aca_vinculo_docente e
--            aca_get_componentes_para_vinculo
-- Data: 2026-07-24
-- Descrição: Corrige erros nas RPCs existentes:
--   1. aca_get_vinculos_docente: ORDER BY refereciava "comp"
--      que não está visível no outer query.
--   2. aca_get_componentes_para_vinculo: SELECT incluía
--      "carga_horaria" que não existe em aca_componente.
-- ============================================================

-- -------------------------------------------------------
-- 1. aca_get_vinculos_docente
--    ORDER BY comp.nome_componente → ORDER BY sub.componente_nome
--    (comp é alias dentro da subquery, não visível fora)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_vinculos_docente(
    p_id_docente UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.componente_nome), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            dv.id,
            dv.id_componente,
            comp.nome_componente AS componente_nome,
            dv.elegivel
        FROM public.aca_docente_vinculo dv
        JOIN public.aca_componente comp ON comp.id = dv.id_componente
        WHERE dv.id_docente = p_id_docente
    ) sub;

    RETURN JSONB_BUILD_OBJECT('success', true, 'itens', v_itens);
END;
$$;

-- -------------------------------------------------------
-- 2. aca_get_componentes_para_vinculo
--    Remove coluna "carga_horaria" (não existe em aca_componente)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_componentes_para_vinculo(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.nome), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT id, nome_componente AS nome
        FROM public.aca_componente
        WHERE id_entidade = p_id_entidade
        ORDER BY nome_componente
    ) sub;

    RETURN JSONB_BUILD_OBJECT('success', true, 'itens', v_itens);
END;
$$;
