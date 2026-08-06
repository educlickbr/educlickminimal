-- ============================================================
-- Migration: fix_lms_conteudo_sem_timing
-- Data: 2026-07-27
-- Descrição: Remove campos de timing (datas, prazos, tentativas,
--            pontuação) do lms_conteudo (Repositório).
--            Esses campos pertencem ao lms_conteudo_operacional
--            (Currículo), onde o conteúdo ganha vida na execução.
--            O Repositório é conteúdo perene, reutilizável.
-- ============================================================

-- 1. Remove colunas de timing do lms_conteudo (Repositório)
ALTER TABLE public.lms_conteudo
    DROP COLUMN IF EXISTS data_disponivel,
    DROP COLUMN IF EXISTS data_entrega_limite,
    DROP COLUMN IF EXISTS duracao_minutos,
    DROP COLUMN IF EXISTS tentativas_permitidas,
    DROP COLUMN IF EXISTS pontuacao_maxima;

-- 2. Adiciona colunas de timing no lms_conteudo_operacional (Currículo)
--    É aqui que o professor define QUANDO e COMO o conteúdo roda
--    para um Programa, Ciclo ou Aula específicos.
ALTER TABLE public.lms_conteudo_operacional
    ADD COLUMN IF NOT EXISTS data_disponivel         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS data_entrega_limite     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS duracao_minutos         INTEGER,
    ADD COLUMN IF NOT EXISTS tentativas_permitidas   INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS pontuacao_maxima        NUMERIC(6,2);

-- 3. Atualiza RPC lms_upsert_conteudo: remove parâmetros de timing
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

-- 4. Atualiza RPC lms_list_conteudos: remove campos de timing do retorno
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
