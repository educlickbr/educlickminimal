-- ============================================================
-- Migration: 20260713100004 — RPCs aca_docente_vinculo
-- ============================================================
-- RPCs para gerenciar vínculos docente × componente
-- ============================================================

-- -------------------------------------------------------
-- aca_get_vinculos_docente — Listar vínculos de um docente
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
    SELECT COALESCE(JSONB_AGG(sub ORDER BY comp.nome), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            dv.id,
            dv.id_componente,
            comp.nome AS componente_nome,
            dv.elegivel
        FROM public.aca_docente_vinculo dv
        JOIN public.aca_componente comp ON comp.id = dv.id_componente
        WHERE dv.id_docente = p_id_docente
        ORDER BY comp.nome
    ) sub;

    RETURN JSONB_BUILD_OBJECT('success', true, 'itens', v_itens);
END;
$$;

-- -------------------------------------------------------
-- aca_upsert_vinculos_docente — Salvar lote de vínculos
-- -------------------------------------------------------
-- Estratégia: substitui todos os vínculos do docente pelo lote enviado
CREATE OR REPLACE FUNCTION public.aca_upsert_vinculos_docente(
    p_id_docente UUID,
    p_vinculos JSONB,  -- [{ "id_componente": "uuid", "elegivel": true }, ...]
    p_criado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_item JSONB;
BEGIN
    -- Remove vínculos existentes
    DELETE FROM public.aca_docente_vinculo
    WHERE id_docente = p_id_docente;

    -- Insere novos vínculos
    FOR v_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(p_vinculos)
    LOOP
        INSERT INTO public.aca_docente_vinculo
            (id_docente, id_componente, elegivel, criado_por)
        VALUES (
            p_id_docente,
            (v_item->>'id_componente')::UUID,
            COALESCE((v_item->>'elegivel')::BOOLEAN, true),
            p_criado_por
        );
    END LOOP;

    RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;

-- -------------------------------------------------------
-- aca_get_componentes_para_vinculo — Lista todos os componentes
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
        SELECT id, nome, carga_horaria
        FROM public.aca_componente
        WHERE id_entidade = p_id_entidade
        ORDER BY nome
    ) sub;

    RETURN JSONB_BUILD_OBJECT('success', true, 'itens', v_itens);
END;
$$;
