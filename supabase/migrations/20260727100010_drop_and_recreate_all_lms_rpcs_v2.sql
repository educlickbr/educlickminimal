-- ============================================================
-- Migration: drop_and_recreate_all_lms_rpcs_v2
-- Data: 2026-07-27
-- Descrição: Dropa TODAS as RPCs do LMS e recria com a versão
--            final que inclui: busca, filtro por criador,
--            nome do criador (LEFT JOIN user_expandido),
--            e sem campos de timing.
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- DROP — limpeza total
-- ═══════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.lms_upsert_conteudo CASCADE;
DROP FUNCTION IF EXISTS public.lms_list_conteudos CASCADE;
DROP FUNCTION IF EXISTS public.lms_upsert_bloco CASCADE;
DROP FUNCTION IF EXISTS public.lms_delete_bloco CASCADE;
DROP FUNCTION IF EXISTS public.lms_delete_conteudo CASCADE;
DROP FUNCTION IF EXISTS public.lms_list_blocos CASCADE;
DROP FUNCTION IF EXISTS public.lms_list_conteudos_do_bloco CASCADE;
DROP FUNCTION IF EXISTS public.lms_associar_conteudo_bloco CASCADE;
DROP FUNCTION IF EXISTS public.lms_desassociar_conteudo_bloco CASCADE;
DROP FUNCTION IF EXISTS public.lms_list_distribuicoes CASCADE;
DROP FUNCTION IF EXISTS public.lms_upsert_distribuicao CASCADE;
DROP FUNCTION IF EXISTS public.lms_delete_distribuicao CASCADE;
DROP FUNCTION IF EXISTS public.lms_list_escopos_disponiveis CASCADE;

-- ═══════════════════════════════════════════════════════════
-- 1. lms_upsert_conteudo
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
    INSERT INTO public.lms_conteudo (id, id_entidade, tipo, titulo, descricao, id_arquivo, url, criado_por, modificado_por, modificado_em)
    VALUES (COALESCE(p_id, gen_random_uuid()), p_id_entidade, p_tipo::lms_tipo_item, p_titulo, p_descricao, p_id_arquivo, p_url, p_usuario_id, p_usuario_id, NOW())
    ON CONFLICT (id) DO UPDATE SET
        tipo = COALESCE(p_tipo::lms_tipo_item, lms_conteudo.tipo),
        titulo = COALESCE(p_titulo, lms_conteudo.titulo),
        descricao = COALESCE(p_descricao, lms_conteudo.descricao),
        id_arquivo = COALESCE(p_id_arquivo, lms_conteudo.id_arquivo),
        url = COALESCE(p_url, lms_conteudo.url),
        modificado_por = p_usuario_id, modificado_em = NOW()
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Conteúdo salvo com sucesso');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 2. lms_list_conteudos (com busca, filtro tipo, criador, nome do criador)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_list_conteudos(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20,
    p_busca TEXT DEFAULT NULL,
    p_tipo TEXT DEFAULT NULL,
    p_criado_por UUID DEFAULT NULL
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
        SELECT c.*, ux.nome || ' ' || ux.sobrenome AS criado_por_nome,
            COUNT(*) OVER() AS total_registros,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('id', b.id, 'titulo', b.titulo))
                FROM public.lms_conteudo_bloco cb JOIN public.lms_bloco b ON b.id = cb.id_bloco
                WHERE cb.id_conteudo = c.id), '[]'::jsonb) AS blocos
        FROM public.lms_conteudo c
        LEFT JOIN public.user_expandido ux ON ux.id = c.criado_por
        WHERE c.id_entidade = p_id_entidade
          AND (p_busca IS NULL OR unaccent(c.titulo) ILIKE unaccent('%' || p_busca || '%'))
          AND (p_tipo IS NULL OR c.tipo::text = p_tipo)
          AND (p_criado_por IS NULL OR c.criado_por = p_criado_por)
    ), ordenado AS (
        SELECT * FROM base ORDER BY criado_em DESC LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object('pagina_atual', p_pagina, 'qtd_total', COALESCE(MAX(total_registros), 0),
        'itens', COALESCE(jsonb_agg(jsonb_build_object(
            'id', id, 'tipo', tipo, 'titulo', titulo, 'descricao', descricao,
            'ordem', ordem, 'id_arquivo', id_arquivo, 'url', url,
            'ativo', ativo, 'blocos', blocos,
            'criado_por', criado_por, 'criado_por_nome', criado_por_nome, 'criado_em', criado_em
        ) ORDER BY criado_em DESC), '[]'::jsonb)
    ) INTO v_result FROM ordenado;
    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 3. lms_delete_conteudo
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_delete_conteudo(p_id UUID, p_id_entidade UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_deleted_id UUID;
BEGIN
    DELETE FROM public.lms_conteudo WHERE id = p_id AND id_entidade = p_id_entidade RETURNING id INTO v_deleted_id;
    IF v_deleted_id IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Conteúdo não encontrado');
    END IF;
    RETURN jsonb_build_object('success', true, 'id', v_deleted_id, 'message', 'Conteúdo excluído');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 4. lms_upsert_bloco
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_upsert_bloco(
    p_id UUID DEFAULT NULL, p_id_entidade UUID DEFAULT NULL,
    p_titulo TEXT DEFAULT NULL, p_descricao TEXT DEFAULT NULL,
    p_cor_ident TEXT DEFAULT NULL, p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO public.lms_bloco (id, id_entidade, titulo, descricao, cor_ident, criado_por, modificado_por, modificado_em)
    VALUES (COALESCE(p_id, gen_random_uuid()), p_id_entidade, p_titulo, p_descricao, p_cor_ident, p_usuario_id, p_usuario_id, NOW())
    ON CONFLICT (id) DO UPDATE SET titulo = COALESCE(p_titulo, lms_bloco.titulo), descricao = COALESCE(p_descricao, lms_bloco.descricao), cor_ident = COALESCE(p_cor_ident, lms_bloco.cor_ident), modificado_por = p_usuario_id, modificado_em = NOW()
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Bloco salvo');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 5. lms_delete_bloco
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_delete_bloco(p_id UUID, p_id_entidade UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_deleted_id UUID;
BEGIN
    DELETE FROM public.lms_bloco WHERE id = p_id AND id_entidade = p_id_entidade RETURNING id INTO v_deleted_id;
    IF v_deleted_id IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Bloco não encontrado');
    END IF;
    RETURN jsonb_build_object('success', true, 'id', v_deleted_id, 'message', 'Bloco excluído');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 6. lms_list_blocos
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_list_blocos(
    p_id_entidade UUID, p_pagina INTEGER DEFAULT 1, p_limite INTEGER DEFAULT 20, p_busca TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_offset INTEGER := (p_pagina - 1) * p_limite; v_result JSONB;
BEGIN
    WITH base AS (
        SELECT b.*, (SELECT COUNT(*) FROM public.lms_conteudo_bloco WHERE id_bloco = b.id) AS qtd_itens,
            COUNT(*) OVER() AS total_registros
        FROM public.lms_bloco b WHERE b.id_entidade = p_id_entidade
          AND (p_busca IS NULL OR unaccent(b.titulo) ILIKE unaccent('%' || p_busca || '%'))
    ), ordenado AS (
        SELECT * FROM base ORDER BY criado_em DESC LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object('pagina_atual', p_pagina, 'qtd_total', COALESCE(MAX(total_registros), 0),
        'itens', COALESCE(jsonb_agg(jsonb_build_object(
            'id', id, 'titulo', titulo, 'descricao', descricao, 'cor_ident', cor_ident,
            'ativo', ativo, 'qtd_itens', qtd_itens, 'id_entidade', id_entidade, 'criado_em', criado_em, 'criado_por', criado_por
        ) ORDER BY criado_em DESC), '[]'::jsonb)
    ) INTO v_result FROM ordenado;
    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 7. lms_list_conteudos_do_bloco
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_list_conteudos_do_bloco(p_id_bloco UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'tipo', c.tipo, 'titulo', c.titulo, 'descricao', c.descricao,
        'id_arquivo', c.id_arquivo, 'url', c.url, 'ativo', c.ativo
    ) ORDER BY c.titulo ASC) FROM public.lms_conteudo_bloco cb
    JOIN public.lms_conteudo c ON c.id = cb.id_conteudo WHERE cb.id_bloco = p_id_bloco), '[]'::jsonb);
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 8. lms_associar_conteudo_bloco
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_associar_conteudo_bloco(p_id_conteudo UUID, p_id_bloco UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    INSERT INTO public.lms_conteudo_bloco (id_conteudo, id_bloco) VALUES (p_id_conteudo, p_id_bloco)
    ON CONFLICT (id_conteudo, id_bloco) DO NOTHING;
    RETURN jsonb_build_object('success', true, 'message', 'Conteúdo associado ao bloco');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 9. lms_desassociar_conteudo_bloco
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_desassociar_conteudo_bloco(p_id_conteudo UUID, p_id_bloco UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    DELETE FROM public.lms_conteudo_bloco WHERE id_conteudo = p_id_conteudo AND id_bloco = p_id_bloco;
    RETURN jsonb_build_object('success', true, 'message', 'Conteúdo desassociado');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 10. lms_list_distribuicoes
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_list_distribuicoes(p_escopo TEXT, p_escopo_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result JSONB;
BEGIN
    WITH base AS (
        SELECT d.id AS distribuidor_id, d.id_conteudo, d.id_area, d.id_curso, d.id_modulo, d.id_componente,
            d.ativo, d.criado_em, c.titulo AS conteudo_titulo, c.tipo AS conteudo_tipo, c.id_arquivo, c.url,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('id', b.id, 'titulo', b.titulo))
                FROM public.lms_conteudo_bloco cb JOIN public.lms_bloco b ON b.id = cb.id_bloco
                WHERE cb.id_conteudo = c.id), '[]'::jsonb) AS blocos
        FROM public.lms_distribuicao d JOIN public.lms_conteudo c ON c.id = d.id_conteudo
        WHERE CASE p_escopo
            WHEN 'area' THEN d.id_area = p_escopo_id
            WHEN 'curso' THEN d.id_curso = p_escopo_id
            WHEN 'modulo' THEN d.id_modulo = p_escopo_id
            WHEN 'componente' THEN d.id_componente = p_escopo_id
            ELSE FALSE END
    )
    SELECT jsonb_build_object('itens', COALESCE(jsonb_agg(jsonb_build_object(
        'id', distribuidor_id, 'id_conteudo', id_conteudo, 'conteudo_titulo', conteudo_titulo,
        'conteudo_tipo', conteudo_tipo, 'id_arquivo', id_arquivo, 'url', url, 'blocos', blocos,
        'ativo', ativo, 'criado_em', criado_em
    ) ORDER BY criado_em DESC), '[]'::jsonb)) INTO v_result FROM base;
    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 11. lms_upsert_distribuicao
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_upsert_distribuicao(
    p_id_entidade UUID, p_id_conteudo UUID,
    p_id_area UUID DEFAULT NULL, p_id_curso UUID DEFAULT NULL,
    p_id_modulo UUID DEFAULT NULL, p_id_componente UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_id UUID;
BEGIN
    IF (p_id_area IS NOT NULL)::INT + (p_id_curso IS NOT NULL)::INT + (p_id_modulo IS NOT NULL)::INT + (p_id_componente IS NOT NULL)::INT != 1 THEN
        RAISE EXCEPTION 'Exatamente um escopo deve ser informado';
    END IF;
    INSERT INTO public.lms_distribuicao (id_entidade, id_conteudo, id_area, id_curso, id_modulo, id_componente, criado_por)
    VALUES (p_id_entidade, p_id_conteudo, p_id_area, p_id_curso, p_id_modulo, p_id_componente, p_usuario_id)
    ON CONFLICT (id_conteudo, id_area, id_curso, id_modulo, id_componente) DO NOTHING
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Associação já existe');
    END IF;
    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Conteúdo associado');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 12. lms_delete_distribuicao
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_delete_distribuicao(p_id UUID, p_id_entidade UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_deleted_id UUID;
BEGIN
    DELETE FROM public.lms_distribuicao WHERE id = p_id AND id_entidade = p_id_entidade RETURNING id INTO v_deleted_id;
    IF v_deleted_id IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Associação não encontrada');
    END IF;
    RETURN jsonb_build_object('success', true, 'id', v_deleted_id, 'message', 'Associação removida');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 13. lms_list_escopos_disponiveis
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_list_escopos_disponiveis(p_tipo_escopo TEXT, p_id_entidade UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result JSONB;
BEGIN
    IF p_tipo_escopo = 'area' THEN
        SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome_area, 'descricao', descricao) ORDER BY nome_area) INTO v_result
        FROM public.aca_area WHERE id_entidade = p_id_entidade;
    ELSIF p_tipo_escopo = 'curso' THEN
        SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome_curso, 'descricao', descricao) ORDER BY nome_curso) INTO v_result
        FROM public.aca_curso WHERE id_entidade = p_id_entidade;
    ELSIF p_tipo_escopo = 'modulo' THEN
        SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome_modulo, 'descricao', descricao) ORDER BY nome_modulo) INTO v_result
        FROM public.aca_modulo WHERE id_entidade = p_id_entidade;
    ELSIF p_tipo_escopo = 'componente' THEN
        SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome_componente, 'descricao', descricao) ORDER BY nome_componente) INTO v_result
        FROM public.aca_componente WHERE id_entidade = p_id_entidade;
    ELSE RETURN '[]'::jsonb; END IF;
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
