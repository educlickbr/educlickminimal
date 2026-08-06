-- ============================================================
-- RPCs: LMS — Blocos (Repositório)
-- Data: 2026-07-27
-- Descrição: CRUD de blocos de conteúdo do Repositório
-- ============================================================

-- 1. Listar Blocos Paginado
CREATE OR REPLACE FUNCTION public.lms_list_blocos(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20,
    p_busca TEXT DEFAULT NULL
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
            b.*,
            (SELECT COUNT(*) FROM public.lms_bloco_item WHERE id_bloco = b.id) AS qtd_itens,
            COUNT(*) OVER() AS total_registros
        FROM public.lms_bloco b
        WHERE b.id_entidade = p_id_entidade
          AND (p_busca IS NULL OR unaccent(b.titulo) ILIKE unaccent('%' || p_busca || '%'))
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
                    'titulo', titulo,
                    'descricao', descricao,
                    'cor_ident', cor_ident,
                    'ativo', ativo,
                    'qtd_itens', qtd_itens,
                    'id_entidade', id_entidade,
                    'criado_em', criado_em,
                    'criado_por', criado_por
                ) ORDER BY criado_em DESC
            ), '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;

-- 2. Upsert Bloco
CREATE OR REPLACE FUNCTION public.lms_upsert_bloco(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_titulo TEXT DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_cor_ident TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'ID da entidade é obrigatório';
    END IF;

    INSERT INTO public.lms_bloco (
        id, id_entidade, titulo, descricao, cor_ident,
        criado_por, modificado_por, modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade, p_titulo, p_descricao, p_cor_ident,
        p_usuario_id, p_usuario_id, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        titulo        = COALESCE(p_titulo, lms_bloco.titulo),
        descricao     = COALESCE(p_descricao, lms_bloco.descricao),
        cor_ident     = COALESCE(p_cor_ident, lms_bloco.cor_ident),
        modificado_por = p_usuario_id,
        modificado_em  = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Bloco salvo com sucesso');
END;
$$;

-- 3. Delete Bloco (com verificação de segurança)
CREATE OR REPLACE FUNCTION public.lms_delete_bloco(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_deleted_id UUID;
BEGIN
    DELETE FROM public.lms_bloco
    WHERE id = p_id AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Bloco não encontrado ou sem permissão');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_deleted_id, 'message', 'Bloco excluído com sucesso');
END;
$$;

-- 4. Listar Itens de um Bloco
CREATE OR REPLACE FUNCTION public.lms_list_itens_do_bloco(
    p_id_bloco UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', bi.id,
                'tipo', bi.tipo,
                'titulo', bi.titulo,
                'descricao', bi.descricao,
                'ordem', bi.ordem,
                'data_disponivel', bi.data_disponivel,
                'data_entrega_limite', bi.data_entrega_limite,
                'duracao_minutos', bi.duracao_minutos,
                'tentativas_permitidas', bi.tentativas_permitidas,
                'pontuacao_maxima', bi.pontuacao_maxima,
                'ativo', bi.ativo
            ) ORDER BY bi.ordem ASC, bi.criado_em ASC
        )
        FROM public.lms_bloco_item bi
        WHERE bi.id_bloco = p_id_bloco
    ), '[]'::jsonb);
END;
$$;
