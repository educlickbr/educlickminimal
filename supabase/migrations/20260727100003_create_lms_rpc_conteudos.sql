-- ============================================================
-- RPCs: LMS — Conteúdos (Repositório)
-- Data: 2026-07-27
-- Descrição: CRUD de conteúdos + associação com blocos
-- ============================================================

-- 1. Listar Conteúdos Paginado (com blocos associados)
CREATE OR REPLACE FUNCTION public.lms_list_conteudos(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20,
    p_busca TEXT DEFAULT NULL,
    p_tipo TEXT DEFAULT NULL  -- 'material', 'atividade', 'avaliacao' ou NULL para todos
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
            c.*,
            COUNT(*) OVER() AS total_registros,
            COALESCE(
                (
                    SELECT jsonb_agg(jsonb_build_object('id', b.id, 'titulo', b.titulo))
                    FROM public.lms_conteudo_bloco cb
                    JOIN public.lms_bloco b ON b.id = cb.id_bloco
                    WHERE cb.id_conteudo = c.id
                ),
                '[]'::jsonb
            ) AS blocos
        FROM public.lms_conteudo c
        WHERE c.id_entidade = p_id_entidade
          AND (p_busca IS NULL OR unaccent(c.titulo) ILIKE unaccent('%' || p_busca || '%'))
          AND (p_tipo IS NULL OR c.tipo::text = p_tipo)
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
                    'tipo', tipo,
                    'titulo', titulo,
                    'descricao', descricao,
                    'ordem', ordem,
                    'id_arquivo', id_arquivo,
                    'url', url,
                    'data_disponivel', data_disponivel,
                    'data_entrega_limite', data_entrega_limite,
                    'duracao_minutos', duracao_minutos,
                    'tentativas_permitidas', tentativas_permitidas,
                    'pontuacao_maxima', pontuacao_maxima,
                    'ativo', ativo,
                    'blocos', blocos,
                    'criado_em', criado_em
                ) ORDER BY criado_em DESC
            ), '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;

-- 2. Upsert Conteúdo
CREATE OR REPLACE FUNCTION public.lms_upsert_conteudo(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_tipo TEXT DEFAULT NULL,
    p_titulo TEXT DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_id_arquivo UUID DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_data_disponivel TIMESTAMPTZ DEFAULT NULL,
    p_data_entrega_limite TIMESTAMPTZ DEFAULT NULL,
    p_duracao_minutos INTEGER DEFAULT NULL,
    p_tentativas_permitidas INTEGER DEFAULT 1,
    p_pontuacao_maxima NUMERIC(6,2) DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_entidade IS NULL OR p_tipo IS NULL OR p_titulo IS NULL THEN
        RAISE EXCEPTION 'Entidade, tipo e título são obrigatórios';
    END IF;

    INSERT INTO public.lms_conteudo (
        id, id_entidade, tipo, titulo, descricao, id_arquivo, url,
        data_disponivel, data_entrega_limite, duracao_minutos,
        tentativas_permitidas, pontuacao_maxima,
        criado_por, modificado_por, modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade, p_tipo::lms_tipo_item, p_titulo, p_descricao,
        p_id_arquivo, p_url,
        p_data_disponivel, p_data_entrega_limite, p_duracao_minutos,
        COALESCE(p_tentativas_permitidas, 1), p_pontuacao_maxima,
        p_usuario_id, p_usuario_id, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        tipo              = COALESCE(p_tipo::lms_tipo_item, lms_conteudo.tipo),
        titulo            = COALESCE(p_titulo, lms_conteudo.titulo),
        descricao         = COALESCE(p_descricao, lms_conteudo.descricao),
        id_arquivo        = COALESCE(p_id_arquivo, lms_conteudo.id_arquivo),
        url               = COALESCE(p_url, lms_conteudo.url),
        data_disponivel   = COALESCE(p_data_disponivel, lms_conteudo.data_disponivel),
        data_entrega_limite = COALESCE(p_data_entrega_limite, lms_conteudo.data_entrega_limite),
        duracao_minutos   = COALESCE(p_duracao_minutos, lms_conteudo.duracao_minutos),
        tentativas_permitidas = COALESCE(p_tentativas_permitidas, lms_conteudo.tentativas_permitidas),
        pontuacao_maxima  = COALESCE(p_pontuacao_maxima, lms_conteudo.pontuacao_maxima),
        modificado_por    = p_usuario_id,
        modificado_em     = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Conteúdo salvo com sucesso');
END;
$$;

-- 3. Delete Conteúdo
CREATE OR REPLACE FUNCTION public.lms_delete_conteudo(
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
    DELETE FROM public.lms_conteudo
    WHERE id = p_id AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Conteúdo não encontrado ou sem permissão');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_deleted_id, 'message', 'Conteúdo excluído com sucesso');
END;
$$;

-- 4. Listar Conteúdos de um Bloco
CREATE OR REPLACE FUNCTION public.lms_list_conteudos_do_bloco(
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
                'id', c.id,
                'tipo', c.tipo,
                'titulo', c.titulo,
                'descricao', c.descricao,
                'id_arquivo', c.id_arquivo,
                'url', c.url,
                'ordem', cb.ordem,
                'data_disponivel', c.data_disponivel,
                'data_entrega_limite', c.data_entrega_limite,
                'duracao_minutos', c.duracao_minutos,
                'tentativas_permitidas', c.tentativas_permitidas,
                'pontuacao_maxima', c.pontuacao_maxima,
                'ativo', c.ativo
            ) ORDER BY cb.ordem ASC, c.titulo ASC
        )
        FROM public.lms_conteudo_bloco cb
        JOIN public.lms_conteudo c ON c.id = cb.id_conteudo
        WHERE cb.id_bloco = p_id_bloco
    ), '[]'::jsonb);
END;
$$;

-- 5. Associar Conteúdo a Bloco
CREATE OR REPLACE FUNCTION public.lms_associar_conteudo_bloco(
    p_id_conteudo UUID,
    p_id_bloco UUID,
    p_ordem INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    INSERT INTO public.lms_conteudo_bloco (id_conteudo, id_bloco, ordem)
    VALUES (p_id_conteudo, p_id_bloco, p_ordem)
    ON CONFLICT (id_conteudo, id_bloco) DO UPDATE SET
        ordem = COALESCE(p_ordem, lms_conteudo_bloco.ordem);

    RETURN jsonb_build_object('success', true, 'message', 'Conteúdo associado ao bloco');
END;
$$;

-- 6. Desassociar Conteúdo de Bloco
CREATE OR REPLACE FUNCTION public.lms_desassociar_conteudo_bloco(
    p_id_conteudo UUID,
    p_id_bloco UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    DELETE FROM public.lms_conteudo_bloco
    WHERE id_conteudo = p_id_conteudo AND id_bloco = p_id_bloco;

    RETURN jsonb_build_object('success', true, 'message', 'Conteúdo desassociado do bloco');
END;
$$;

-- 7. Listar Blocos (atualizado: conta conteúdos via lms_conteudo_bloco)
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
            (SELECT COUNT(*) FROM public.lms_conteudo_bloco WHERE id_bloco = b.id) AS qtd_itens,
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

-- 8. Atualizar lms_upsert_bloco (adicionar upsert de bloco, se não existir)
-- (já existe da migration anterior, mantido)

-- 9. Atualizar lms_delete_bloco (já existe da migration anterior, mantido)
