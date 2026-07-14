-- ============================================================
-- Migration: 20260713100009 — Add valor_hora_aula to aca_docente
-- ============================================================
-- Valor da hora/aula do docente, em centavos (integer).
-- Apenas admin pode ver/editar (protegido por RLS/RPCs).
-- ============================================================

ALTER TABLE public.aca_docente
ADD COLUMN IF NOT EXISTS valor_hora_aula INTEGER;

-- Atualiza a RPC aca_get_docentes para retornar o valor
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

    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.nome_completo), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            d.id,
            d.id_user_expandido,
            ue.nome_completo,
            ue.email,
            d.ativo,
            d.valor_hora_aula,
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

-- RPC para atualizar o valor hora/aula
CREATE OR REPLACE FUNCTION public.aca_set_valor_hora_aula(
    p_id UUID,
    p_valor INTEGER,
    p_modificado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.aca_docente
    SET valor_hora_aula = p_valor,
        modificado_por = p_modificado_por,
        modificado_em = NOW()
    WHERE id = p_id;

    RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_set_valor_hora_aula(UUID, INTEGER, UUID) TO authenticated;
