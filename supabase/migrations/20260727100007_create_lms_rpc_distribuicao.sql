-- ============================================================
-- RPCs: LMS — Distribuição
-- Data: 2026-07-27
-- Descrição: Listar, criar e remover associações de conteúdo
--            aos escopos do Blueprint (Área, Curso, Módulo,
--            Componente).
-- ============================================================

-- 1. Listar distribuições por escopo
--    Retorna todos os conteúdos associados a um determinado
--    escopo (ex: todos os conteúdos de um Curso específico).
CREATE OR REPLACE FUNCTION public.lms_list_distribuicoes(
    p_escopo TEXT,        -- 'area', 'curso', 'modulo', 'componente'
    p_escopo_id UUID      -- id do item no escopo
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH base AS (
        SELECT
            d.id AS distribuidor_id,
            d.id_conteudo,
            d.id_area,
            d.id_curso,
            d.id_modulo,
            d.id_componente,
            d.ativo,
            d.criado_em,
            c.titulo AS conteudo_titulo,
            c.tipo AS conteudo_tipo,
            c.id_arquivo,
            c.url,
            COALESCE(
                (
                    SELECT jsonb_agg(jsonb_build_object('id', b.id, 'titulo', b.titulo))
                    FROM public.lms_conteudo_bloco cb
                    JOIN public.lms_bloco b ON b.id = cb.id_bloco
                    WHERE cb.id_conteudo = c.id
                ),
                '[]'::jsonb
            ) AS blocos
        FROM public.lms_distribuicao d
        JOIN public.lms_conteudo c ON c.id = d.id_conteudo
        WHERE
            CASE p_escopo
                WHEN 'area'       THEN d.id_area = p_escopo_id
                WHEN 'curso'      THEN d.id_curso = p_escopo_id
                WHEN 'modulo'     THEN d.id_modulo = p_escopo_id
                WHEN 'componente' THEN d.id_componente = p_escopo_id
                ELSE FALSE
            END
    )
    SELECT jsonb_build_object(
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', distribuidor_id,
                    'id_conteudo', id_conteudo,
                    'conteudo_titulo', conteudo_titulo,
                    'conteudo_tipo', conteudo_tipo,
                    'id_arquivo', id_arquivo,
                    'url', url,
                    'blocos', blocos,
                    'ativo', ativo,
                    'criado_em', criado_em
                ) ORDER BY criado_em DESC
            ), '[]'::jsonb
        )
    ) INTO v_result
    FROM base;

    RETURN v_result;
END;
$$;

-- Adiciona UNIQUE na tabela para evitar duplicatas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lms_distribuicao_unique'
    ) THEN
        ALTER TABLE public.lms_distribuicao
            ADD CONSTRAINT lms_distribuicao_unique
            UNIQUE (id_conteudo, id_area, id_curso, id_modulo, id_componente);
    END IF;
END;
$$;

-- 2. Associar conteúdo a um escopo
CREATE OR REPLACE FUNCTION public.lms_upsert_distribuicao(
    p_id_entidade UUID,
    p_id_conteudo UUID,
    p_id_area UUID DEFAULT NULL,
    p_id_curso UUID DEFAULT NULL,
    p_id_modulo UUID DEFAULT NULL,
    p_id_componente UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_conteudo IS NULL THEN
        RAISE EXCEPTION 'ID do conteúdo é obrigatório';
    END IF;

    -- Garante que exatamente um escopo foi fornecido
    IF (
        (p_id_area IS NOT NULL)::INT +
        (p_id_curso IS NOT NULL)::INT +
        (p_id_modulo IS NOT NULL)::INT +
        (p_id_componente IS NOT NULL)::INT
    ) != 1 THEN
        RAISE EXCEPTION 'Exatamente um escopo deve ser informado (area, curso, modulo ou componente)';
    END IF;

    INSERT INTO public.lms_distribuicao (
        id_entidade, id_conteudo,
        id_area, id_curso, id_modulo, id_componente,
        criado_por
    )
    VALUES (
        p_id_entidade, p_id_conteudo,
        p_id_area, p_id_curso, p_id_modulo, p_id_componente,
        p_usuario_id
    )
    ON CONFLICT (id_conteudo, id_area, id_curso, id_modulo, id_componente)
    -- Se já existir essa associação, não faz nada (único)
    DO NOTHING
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Esta associação já existe');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Conteúdo associado ao escopo');
END;
$$;

-- 3. Remover associação
CREATE OR REPLACE FUNCTION public.lms_delete_distribuicao(
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
    DELETE FROM public.lms_distribuicao
    WHERE id = p_id AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Associação não encontrada');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_deleted_id, 'message', 'Associação removida');
END;
$$;

-- 4. Listar itens de um escopo + verificar se já tem distribuição
--    Função auxiliar: retorna todos os itens de um escopo (ex: todos
--    os cursos da entidade) com um flag indicando se já existe
--    distribuição de um determinado conteúdo específico.
--    (Usada no modal de associação)
CREATE OR REPLACE FUNCTION public.lms_list_escopos_disponiveis(
    p_tipo_escopo TEXT,       -- 'area', 'curso', 'modulo', 'componente'
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF p_tipo_escopo = 'area' THEN
        SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'nome', nome_area, 'descricao', descricao
        ) ORDER BY nome_area) INTO v_result
        FROM public.aca_area WHERE id_entidade = p_id_entidade;
    ELSIF p_tipo_escopo = 'curso' THEN
        SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'nome', nome_curso, 'descricao', descricao
        ) ORDER BY nome_curso) INTO v_result
        FROM public.aca_curso WHERE id_entidade = p_id_entidade;
    ELSIF p_tipo_escopo = 'modulo' THEN
        SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'nome', nome_modulo, 'descricao', descricao
        ) ORDER BY nome_modulo) INTO v_result
        FROM public.aca_modulo WHERE id_entidade = p_id_entidade;
    ELSIF p_tipo_escopo = 'componente' THEN
        SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'nome', nome_componente, 'descricao', descricao
        ) ORDER BY nome_componente) INTO v_result
        FROM public.aca_componente WHERE id_entidade = p_id_entidade;
    ELSE
        RETURN '[]'::jsonb;
    END IF;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
