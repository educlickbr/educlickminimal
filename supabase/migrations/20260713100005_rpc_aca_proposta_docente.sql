-- ============================================================
-- Migration: 20260713100005 — RPCs aca_docente_proposta
-- ============================================================
-- RPCs para gerenciar propostas/currículos recebidos
-- ============================================================

-- -------------------------------------------------------
-- aca_get_propostas_docente — Listar propostas (paginada)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_propostas_docente(
    p_id_entidade UUID,
    p_filtro TEXT DEFAULT 'todas',  -- 'todas', 'nao_vistas', 'vistas', 'consideradas'
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
    FROM public.aca_docente_proposta
    WHERE id_entidade = p_id_entidade
      AND (
          p_filtro = 'todas'
          OR (p_filtro = 'nao_vistas' AND visto = false)
          OR (p_filtro = 'vistas' AND visto = true)
          OR (p_filtro = 'consideradas' AND considerado IS NOT NULL)
      );

    -- Itens
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.criado_em DESC), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            p.id,
            p.nome,
            p.telefone,
            p.email,
            p.minibio,
            p.id_curriculo,
            p.visto,
            p.considerado,
            p.criado_em,
            e.nome AS edital_nome,
            e.id AS id_edital
        FROM public.aca_docente_proposta p
        LEFT JOIN public.aca_edital_docente e ON e.id = p.id_edital
        WHERE p.id_entidade = p_id_entidade
          AND (
              p_filtro = 'todas'
              OR (p_filtro = 'nao_vistas' AND p.visto = false)
              OR (p_filtro = 'vistas' AND p.visto = true)
              OR (p_filtro = 'consideradas' AND p.considerado IS NOT NULL)
          )
        ORDER BY p.criado_em DESC
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
-- aca_marcar_visto_proposta — Marcar proposta como vista
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_marcar_visto_proposta(
    p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.aca_docente_proposta
    SET visto = true,
        modificado_em = NOW()
    WHERE id = p_id;

    RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;

-- -------------------------------------------------------
-- aca_considerar_proposta — Marcar proposta como considerada ou dispensada
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_considerar_proposta(
    p_id UUID,
    p_considerado BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.aca_docente_proposta
    SET considerado = p_considerado,
        modificado_em = NOW()
    WHERE id = p_id;

    RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;

-- -------------------------------------------------------
-- aca_delete_proposta_docente — Excluir proposta
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_delete_proposta_docente(
    p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    DELETE FROM public.aca_docente_proposta
    WHERE id = p_id;

    RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;

-- -------------------------------------------------------
-- aca_inserir_proposta_publica — Inserir proposta (uso público)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_inserir_proposta_publica(
    p_id_entidade UUID,
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT DEFAULT NULL,
    p_minibio TEXT DEFAULT NULL,
    p_id_curriculo UUID DEFAULT NULL,
    p_id_edital UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.aca_docente_proposta
        (id_entidade, nome, telefone, email, minibio, id_curriculo, id_edital)
    VALUES
        (p_id_entidade, p_nome, p_telefone, p_email, p_minibio, p_id_curriculo, p_id_edital)
    RETURNING id INTO v_id;

    RETURN JSONB_BUILD_OBJECT('success', true, 'id', v_id);
END;
$$;
