-- ============================================================
-- Migration: drop_and_recreate_lms_rpcs
-- Data: 2026-07-27
-- Descrição: Dropa TODAS as versões duplicadas das RPCs do LMS
--            e recria uma única versão correta de cada uma.
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- DROP todas as versões (limpeza total)
-- ═══════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.lms_upsert_conteudo(p_id uuid, p_id_entidade uuid, p_tipo text, p_titulo text, p_descricao text, p_id_arquivo uuid, p_url text, p_usuario_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.lms_upsert_conteudo(p_id uuid, p_id_entidade uuid, p_tipo text, p_titulo text, p_descricao text, p_id_arquivo uuid, p_url text, p_data_disponivel timestamptz, p_data_entrega_limite timestamptz, p_duracao_minutos integer, p_tentativas_permitidas integer, p_pontuacao_maxima numeric, p_usuario_id uuid) CASCADE;

DROP FUNCTION IF EXISTS public.lms_list_conteudos(p_id_entidade uuid, p_pagina integer, p_limite integer, p_busca text, p_tipo text) CASCADE;

DROP FUNCTION IF EXISTS public.lms_upsert_bloco(p_id uuid, p_id_entidade uuid, p_titulo text, p_descricao text, p_cor_ident text, p_usuario_id uuid) CASCADE;

DROP FUNCTION IF EXISTS public.lms_delete_bloco(p_id uuid, p_id_entidade uuid) CASCADE;

DROP FUNCTION IF EXISTS public.lms_delete_conteudo(p_id uuid, p_id_entidade uuid) CASCADE;

DROP FUNCTION IF EXISTS public.lms_list_blocos(p_id_entidade uuid, p_pagina integer, p_limite integer, p_busca text) CASCADE;

DROP FUNCTION IF EXISTS public.lms_list_conteudos_do_bloco(p_id_bloco uuid) CASCADE;

DROP FUNCTION IF EXISTS public.lms_associar_conteudo_bloco(p_id_conteudo uuid, p_id_bloco uuid, p_ordem integer) CASCADE;

DROP FUNCTION IF EXISTS public.lms_desassociar_conteudo_bloco(p_id_conteudo uuid, p_id_bloco uuid) CASCADE;

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_upssert_conteudo (versão SEM timing)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_upsert_conteudo(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_tipo TEXT DEFAULT NULL,
    p_titulo TEXT DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_id_arquivo UUID DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
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
        criado_por, modificado_por, modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade, p_tipo::lms_tipo_item, p_titulo, p_descricao,
        p_id_arquivo, p_url,
        p_usuario_id, p_usuario_id, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        tipo              = COALESCE(p_tipo::lms_tipo_item, lms_conteudo.tipo),
        titulo            = COALESCE(p_titulo, lms_conteudo.titulo),
        descricao         = COALESCE(p_descricao, lms_conteudo.descricao),
        id_arquivo        = COALESCE(p_id_arquivo, lms_conteudo.id_arquivo),
        url               = COALESCE(p_url, lms_conteudo.url),
        modificado_por    = p_usuario_id,
        modificado_em     = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Conteúdo salvo com sucesso');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_list_conteudos (SEM timing)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_list_conteudos(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20,
    p_busca TEXT DEFAULT NULL,
    p_tipo TEXT DEFAULT NULL
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

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_upsert_bloco
-- ═══════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_delete_bloco
-- ═══════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_delete_conteudo
-- ═══════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_list_blocos
-- ═══════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_list_conteudos_do_bloco
-- ═══════════════════════════════════════════════════════════
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
                'ativo', c.ativo
            ) ORDER BY c.titulo ASC
        )
        FROM public.lms_conteudo_bloco cb
        JOIN public.lms_conteudo c ON c.id = cb.id_conteudo
        WHERE cb.id_bloco = p_id_bloco
    ), '[]'::jsonb);
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_associar_conteudo_bloco
-- ═══════════════════════════════════════════════════════════
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
    INSERT INTO public.lms_conteudo_bloco (id_conteudo, id_bloco)
    VALUES (p_id_conteudo, p_id_bloco)
    ON CONFLICT (id_conteudo, id_bloco) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'message', 'Conteúdo associado ao bloco');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- RECRIAR: lms_desassociar_conteudo_bloco
-- ═══════════════════════════════════════════════════════════
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
