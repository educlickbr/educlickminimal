-- ============================================================
-- Migration: 20260713100001 — RPCs aca_docente
-- ============================================================
-- RPCs para CRUD de docentes
-- ============================================================

-- -------------------------------------------------------
-- aca_get_docentes — Lista docentes paginada
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_docentes(
    p_id_entidade UUID,
    p_busca TEXT DEFAULT NULL,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_itens JSONB;
BEGIN
    v_offset := (p_pagina - 1) * p_limite;

    -- Total
    SELECT COUNT(*)
    INTO v_total
    FROM public.aca_docente d
    JOIN public.user_expandido ue ON ue.id = d.id_user_expandido
    WHERE d.id_entidade = p_id_entidade
      AND (
          p_busca IS NULL
          OR p_busca = ''
          OR ue.nome_completo ILIKE '%' || p_busca || '%'
          OR ue.email ILIKE '%' || p_busca || '%'
      );

    -- Itens
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.nome_completo), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            d.id,
            d.id_user_expandido,
            ue.nome_completo,
            ue.email,
            d.ativo,
            d.criado_em,
            (
                SELECT COALESCE(JSONB_AGG(comp ORDER BY comp), '[]'::JSONB)
                FROM (
                    SELECT aca_componente.nome
                    FROM public.aca_docente_vinculo
                    JOIN public.aca_componente ON aca_componente.id = aca_docente_vinculo.id_componente
                    WHERE aca_docente_vinculo.id_docente = d.id
                      AND aca_docente_vinculo.elegivel = true
                    ORDER BY aca_componente.nome
                ) comp
            ) AS componentes
        FROM public.aca_docente d
        JOIN public.user_expandido ue ON ue.id = d.id_user_expandido
        WHERE d.id_entidade = p_id_entidade
          AND (
              p_busca IS NULL
              OR p_busca = ''
              OR ue.nome_completo ILIKE '%' || p_busca || '%'
              OR ue.email ILIKE '%' || p_busca || '%'
          )
        ORDER BY ue.nome_completo
        LIMIT p_limite
        OFFSET v_offset
    ) sub;

    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'itens', v_itens,
        'total', v_total,
        'pagina', p_pagina,
        'limite', p_limite
    );
END;
$$;

-- -------------------------------------------------------
-- aca_upsert_docente — Criar ou reativar docente
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_upsert_docente(
    p_id_entidade UUID,
    p_id_user_expandido UUID,
    p_criado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
    v_existente BOOLEAN;
BEGIN
    -- Verifica se já existe
    SELECT EXISTS(
        SELECT 1 FROM public.aca_docente
        WHERE id_entidade = p_id_entidade
          AND id_user_expandido = p_id_user_expandido
    ) INTO v_existente;

    IF v_existente THEN
        -- Reativa se estava inativo
        UPDATE public.aca_docente
        SET ativo = true,
            modificado_por = p_criado_por,
            modificado_em = NOW()
        WHERE id_entidade = p_id_entidade
          AND id_user_expandido = p_id_user_expandido
        RETURNING id INTO v_id;

        RETURN JSONB_BUILD_OBJECT(
            'success', true,
            'id', v_id,
            'created', false
        );
    ELSE
        INSERT INTO public.aca_docente (id_entidade, id_user_expandido, criado_por)
        VALUES (p_id_entidade, p_id_user_expandido, p_criado_por)
        RETURNING id INTO v_id;

        RETURN JSONB_BUILD_OBJECT(
            'success', true,
            'id', v_id,
            'created', true
        );
    END IF;
END;
$$;

-- -------------------------------------------------------
-- aca_toggle_docente — Ativar/desativar docente
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_toggle_docente(
    p_id UUID,
    p_ativo BOOLEAN,
    p_modificado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.aca_docente
    SET ativo = p_ativo,
        modificado_por = p_modificado_por,
        modificado_em = NOW()
    WHERE id = p_id;

    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'id', p_id,
        'ativo', p_ativo
    );
END;
$$;
