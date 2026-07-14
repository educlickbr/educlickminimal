-- ============================================================
-- Migration: 20260713100003 — RPCs aca_edital_docente_inscricao
-- ============================================================
-- RPCs para listar e avaliar inscrições em editais
-- ============================================================

-- -------------------------------------------------------
-- aca_get_inscricoes_edital — Listar inscrições de um edital
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_inscricoes_edital(
    p_id_edital UUID,
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
    FROM public.aca_edital_docente_inscricao
    WHERE id_edital = p_id_edital;

    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.criado_em DESC), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            i.id,
            i.id_candidato,
            ue.nome_completo,
            ue.email,
            i.status,
            i.criado_em
        FROM public.aca_edital_docente_inscricao i
        JOIN public.user_expandido ue ON ue.id = i.id_candidato
        WHERE i.id_edital = p_id_edital
        ORDER BY i.criado_em DESC
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
-- aca_avaliar_inscricao_docente — Mudar status de uma inscrição
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_avaliar_inscricao_docente(
    p_id UUID,
    p_status TEXT,
    p_modificado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- Valida status
    IF p_status NOT IN ('aguardando', 'aprovado', 'recusado', 'suplente') THEN
        RETURN JSONB_BUILD_OBJECT(
            'success', false,
            'message', 'Status inválido: deve ser aguardando, aprovado, recusado ou suplente'
        );
    END IF;

    UPDATE public.aca_edital_docente_inscricao
    SET status = p_status,
        modificado_por = p_modificado_por,
        modificado_em = NOW()
    WHERE id = p_id;

    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'id', p_id,
        'status', p_status
    );
END;
$$;

-- -------------------------------------------------------
-- aca_get_editais_para_dropdown — Lista editais ativos para dropdown
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_editais_para_dropdown(
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
        SELECT id, nome, status, data_ini, data_fim
        FROM public.aca_edital_docente
        WHERE id_entidade = p_id_entidade
        ORDER BY nome
    ) sub;

    RETURN JSONB_BUILD_OBJECT('success', true, 'itens', v_itens);
END;
$$;
