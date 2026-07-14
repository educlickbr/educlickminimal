-- ============================================================
-- Migration: 20260713100002 — RPCs aca_edital_docente
-- ============================================================
-- RPCs para CRUD de editais
-- ============================================================

-- -------------------------------------------------------
-- aca_get_editais_docente — Listar editais
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_get_editais_docente(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT COALESCE(JSONB_AGG(sub ORDER BY sub.criado_em DESC), '[]'::JSONB)
    INTO v_itens
    FROM (
        SELECT
            e.id,
            e.nome,
            e.descricao,
            e.data_ini,
            e.data_fim,
            e.status,
            e.id_form_config,
            e.criado_em,
            COALESCE(i.qtd, 0) AS qtd_inscricoes
        FROM public.aca_edital_docente e
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS qtd
            FROM public.aca_edital_docente_inscricao
            WHERE id_edital = e.id
        ) i ON true
        WHERE e.id_entidade = p_id_entidade
        ORDER BY e.criado_em DESC
    ) sub;

    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'itens', v_itens
    );
END;
$$;

-- -------------------------------------------------------
-- aca_upsert_edital_docente — Criar/atualizar edital
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_upsert_edital_docente(
    p_id_entidade UUID,
    p_nome TEXT,
    p_descricao TEXT DEFAULT NULL,
    p_data_ini DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_status TEXT DEFAULT 'ativo',
    p_id_form_config UUID DEFAULT NULL,
    p_criado_por UUID DEFAULT NULL,
    p_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO public.aca_edital_docente
            (id_entidade, nome, descricao, data_ini, data_fim, status, id_form_config, criado_por)
        VALUES
            (p_id_entidade, p_nome, p_descricao, p_data_ini, p_data_fim, p_status, p_id_form_config, p_criado_por)
        RETURNING id INTO v_id;

        RETURN JSONB_BUILD_OBJECT('success', true, 'id', v_id, 'created', true);
    ELSE
        UPDATE public.aca_edital_docente
        SET nome = p_nome,
            descricao = p_descricao,
            data_ini = p_data_ini,
            data_fim = p_data_fim,
            status = p_status,
            id_form_config = p_id_form_config,
            modificado_por = p_criado_por,
            modificado_em = NOW()
        WHERE id = p_id AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;

        RETURN JSONB_BUILD_OBJECT('success', true, 'id', v_id, 'created', false);
    END IF;
END;
$$;

-- -------------------------------------------------------
-- aca_delete_edital_docente — Excluir edital
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aca_delete_edital_docente(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    DELETE FROM public.aca_edital_docente
    WHERE id = p_id AND id_entidade = p_id_entidade;

    RETURN JSONB_BUILD_OBJECT('success', true);
END;
$$;
