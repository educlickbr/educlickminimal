-- ============================================================
-- RPCs para Gestão de Programas (Turmas/Edições de Cursos)
-- Data: 2026-04-01
-- ============================================================

-- 1. Buscar Programas Paginado
CREATE OR REPLACE FUNCTION public.aca_get_programas_paginado(
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
            p.*,
            c.nome_curso,
            (SELECT COUNT(*) FROM public.aca_ciclo_programa WHERE id_programa = p.id) as qtd_ciclos,
            COUNT(*) OVER() AS total_registros
        FROM public.aca_programa p
        JOIN public.aca_curso c ON c.id = p.id_curso
        WHERE p.id_entidade = p_id_entidade
          AND (
            p_busca IS NULL 
            OR unaccent(p.descricao) ILIKE unaccent('%' || p_busca || '%')
            OR unaccent(c.nome_curso) ILIKE unaccent('%' || p_busca || '%')
          )
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
                    'id_curso', id_curso,
                    'nome_curso', nome_curso,
                    'descricao', descricao,
                    'qtd_ciclos', qtd_ciclos,
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

-- 2. Upsert Programa
CREATE OR REPLACE FUNCTION public.aca_upsert_programa(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_curso UUID DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_entidade IS NULL OR p_id_curso IS NULL THEN
        RAISE EXCEPTION 'ID da entidade e do curso são obrigatórios';
    END IF;

    INSERT INTO public.aca_programa (
        id,
        id_entidade,
        id_curso,
        descricao,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade,
        p_id_curso,
        p_descricao,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        id_curso      = COALESCE(p_id_curso, aca_programa.id_curso),
        descricao     = COALESCE(p_descricao, aca_programa.descricao),
        modificado_por = p_usuario_id,
        modificado_em  = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id,
        'message', 'Programa salvo com sucesso'
    );
END;
$$;
