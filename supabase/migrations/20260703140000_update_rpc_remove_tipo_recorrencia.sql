-- ============================================================
-- Migration: update_rpc_remove_tipo_recorrencia
-- Data: 2026-07-03
-- Descrição: Remove tipo_recorrencia das RPCs de com_produto
--            (a coluna foi dropada, mas as RPCs ainda referenciam)
-- ============================================================

-- ============================================================
-- 1. com_get_produtos (sem tipo_recorrencia)
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_get_produtos(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 50,
    p_id_programa UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset INTEGER := (p_pagina - 1) * p_limite;
    v_result JSONB;
BEGIN
    WITH base AS (
        SELECT
            pr.id,
            pr.id_entidade,
            pr.id_programa,
            pr.nome_produto,
            pr.descricao,
            pr.is_ativo,
            pr.criado_por,
            pr.criado_em,
            pr.modificado_em,
            pg.descricao AS programa_descricao,
            pg.gratuito,
            pg.exige_processo_seletivo,
            c.nome_curso,
            COUNT(*) OVER() AS total_registros
        FROM public.com_produto pr
        JOIN public.aca_programa pg ON pg.id = pr.id_programa
        LEFT JOIN public.aca_curso c ON c.id = pg.id_curso
        WHERE pr.id_entidade = p_id_entidade
          AND (p_id_programa IS NULL OR pr.id_programa = p_id_programa)
    ),
    ordenado AS (
        SELECT * FROM base
        ORDER BY criado_em DESC
        LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'pagina_atual', p_pagina,
        'qtd_total', COALESCE(MAX(total_registros), 0),
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'id_entidade', id_entidade,
                    'id_programa', id_programa,
                    'nome_produto', nome_produto,
                    'descricao', descricao,
                    'is_ativo', is_ativo,
                    'programa_descricao', programa_descricao,
                    'nome_curso', nome_curso,
                    'gratuito', gratuito,
                    'exige_processo_seletivo', exige_processo_seletivo,
                    'criado_em', criado_em,
                    'modificado_em', modificado_em
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;


-- ============================================================
-- 2. com_upsert_produto (sem tipo_recorrencia)
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_upsert_produto(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_programa UUID DEFAULT NULL,
    p_nome_produto TEXT DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_is_ativo BOOLEAN DEFAULT true,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_entidade IS NULL OR p_id_programa IS NULL THEN
        RAISE EXCEPTION 'Entidade e programa são obrigatórios';
    END IF;

    IF p_nome_produto IS NULL OR trim(p_nome_produto) = '' THEN
        RAISE EXCEPTION 'Nome do produto é obrigatório';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.com_produto
        WHERE id_entidade = p_id_entidade
          AND id_programa = p_id_programa
          AND nome_produto = trim(p_nome_produto)
          AND (p_id IS NULL OR id <> p_id)
    ) THEN
        RAISE EXCEPTION 'Já existe um produto com este nome para este programa';
    END IF;

    INSERT INTO public.com_produto (
        id, id_entidade, id_programa, nome_produto, descricao,
        is_ativo,
        criado_por, modificado_por, modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade, p_id_programa, trim(p_nome_produto), p_descricao,
        COALESCE(p_is_ativo, true),
        p_usuario_id, p_usuario_id, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        id_programa      = COALESCE(p_id_programa, com_produto.id_programa),
        nome_produto     = COALESCE(trim(p_nome_produto), com_produto.nome_produto),
        descricao        = COALESCE(p_descricao, com_produto.descricao),
        is_ativo         = COALESCE(p_is_ativo, com_produto.is_ativo),
        modificado_por   = p_usuario_id,
        modificado_em    = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Já existe um produto com este nome para este programa';
    WHEN OTHERS THEN
        RAISE;
END;
$$;
