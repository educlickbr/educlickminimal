-- ============================================================
-- RPCs para Gestão de Cursos e Grade de Módulos
-- Data: 2026-04-01
-- ============================================================

-- Garantir unicidade para permitir upsert na relação curso <-> módulo
ALTER TABLE public.aca_curso_modulo 
    ADD CONSTRAINT uq_aca_curso_modulo UNIQUE (id_curso, id_modulo);

-- 1. Buscar Cursos Paginado
CREATE OR REPLACE FUNCTION public.aca_get_cursos_paginado(
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
            c.*,
            (SELECT COUNT(*) FROM public.aca_curso_modulo WHERE id_curso = c.id) as qtd_modulos,
            COUNT(*) OVER() AS total_registros
        FROM public.aca_curso c
        WHERE c.id_entidade = p_id_entidade
          AND (
            p_busca IS NULL 
            OR unaccent(c.nome_curso) ILIKE unaccent('%' || p_busca || '%')
            OR unaccent(c.descricao) ILIKE unaccent('%' || p_busca || '%')
          )
    ),
    ordenado AS (
        SELECT * FROM base
        ORDER BY nome_curso ASC
        LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'pagina_atual', p_pagina,
        'qtd_total', COALESCE(MAX(total_registros), 0),
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'nome_curso', nome_curso,
                    'descricao', descricao,
                    'tipo_modelo', tipo_modelo,
                    'qtd_modulos', qtd_modulos,
                    'criado_em', criado_em
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;

-- 2. Upsert Curso
CREATE OR REPLACE FUNCTION public.aca_upsert_curso(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_nome_curso TEXT DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_tipo_modelo TEXT DEFAULT 'simples',
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

    IF p_nome_curso IS NULL AND p_id IS NULL THEN
        RAISE EXCEPTION 'Nome do curso é obrigatório para novos registros';
    END IF;

    INSERT INTO public.aca_curso (
        id,
        id_entidade,
        nome_curso,
        descricao,
        tipo_modelo,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade,
        p_nome_curso,
        p_descricao,
        p_tipo_modelo,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_curso    = COALESCE(p_nome_curso, aca_curso.nome_curso),
        descricao      = COALESCE(p_descricao, aca_curso.descricao),
        tipo_modelo    = COALESCE(p_tipo_modelo, aca_curso.tipo_modelo),
        modificado_por = p_usuario_id,
        modificado_em  = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id,
        'message', 'Curso salvo com sucesso'
    );
END;
$$;

-- 3. Buscar Módulos de um Curso
CREATE OR REPLACE FUNCTION public.aca_get_modulos_do_curso(p_id_curso UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id_modulo', cm.id_modulo,
                'nome_modulo', m.nome_modulo,
                'descricao', m.descricao,
                'carga_horaria', m.carga_horaria,
                'ordem', cm.ordem
            )
            ORDER BY cm.ordem ASC
        )
        FROM public.aca_curso_modulo cm
        JOIN public.aca_modulo m ON m.id = cm.id_modulo
        WHERE cm.id_curso = p_id_curso
    ), '[]'::jsonb);
END;
$$;

-- 4. Adicionar/Atualizar Módulo no Curso
CREATE OR REPLACE FUNCTION public.aca_add_modulo_ao_curso(
    p_id_curso UUID,
    p_id_modulo UUID,
    p_ordem INTEGER DEFAULT 0,
    p_id_entidade UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    INSERT INTO public.aca_curso_modulo (
        id_curso,
        id_modulo,
        ordem,
        id_entidade,
        criado_por,
        modificado_por
    )
    VALUES (
        p_id_curso,
        p_id_modulo,
        p_ordem,
        p_id_entidade,
        p_usuario_id,
        p_usuario_id
    )
    ON CONFLICT (id_curso, id_modulo) DO UPDATE SET
        ordem = p_ordem,
        modificado_por = p_usuario_id,
        modificado_em = NOW();

    RETURN jsonb_build_object('success', true, 'message', 'Módulo vinculado ao curso');
END;
$$;

-- 5. Remover Módulo do Curso
CREATE OR REPLACE FUNCTION public.aca_remove_modulo_do_curso(
    p_id_curso UUID,
    p_id_modulo UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    DELETE FROM public.aca_curso_modulo
    WHERE id_curso = p_id_curso AND id_modulo = p_id_modulo;

    RETURN jsonb_build_object('success', true, 'message', 'Módulo removido do curso');
END;
$$;
