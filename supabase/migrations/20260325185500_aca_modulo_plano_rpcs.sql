-- ==========================================
-- RPCs for Modules and Lesson Plans
-- ==========================================

-- 1. UPSERT MODULO
CREATE OR REPLACE FUNCTION public.aca_upsert_modulo(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_nome_modulo TEXT DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'ID da entidade é obrigatório';
    END IF;

    IF p_nome_modulo IS NULL AND p_id IS NULL THEN
        RAISE EXCEPTION 'Nome do módulo é obrigatório para novos registros';
    END IF;

    INSERT INTO public.aca_modulo (
        id,
        id_entidade,
        nome_modulo,
        descricao,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade,
        p_nome_modulo,
        p_descricao,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_modulo = COALESCE(p_nome_modulo, aca_modulo.nome_modulo),
        descricao = COALESCE(p_descricao, aca_modulo.descricao),
        modificado_por = p_usuario_id,
        modificado_em = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id,
        'message', 'Módulo salvo com sucesso'
    );
END;
$$;

-- 2. GET MODULOS PAGINADO
CREATE OR REPLACE FUNCTION public.aca_get_modulos_paginado(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20,
    p_busca TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offset INTEGER := (p_pagina - 1) * p_limite;
    v_result JSONB;
BEGIN
    WITH base AS (
        SELECT 
            m.*,
            (SELECT COUNT(*) FROM public.aca_plano_de_aula WHERE id_modulo = m.id) as qtd_planos,
            COUNT(*) OVER() AS total_registros
        FROM public.aca_modulo m
        WHERE m.id_entidade = p_id_entidade
          AND (
            p_busca IS NULL 
            OR unaccent(m.nome_modulo) ILIKE unaccent('%' || p_busca || '%')
            OR unaccent(m.descricao) ILIKE unaccent('%' || p_busca || '%')
          )
    ),
    ordenado AS (
        SELECT * FROM base
        ORDER BY nome_modulo ASC
        LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'pagina_atual', p_pagina,
        'qtd_total', COALESCE(MAX(total_registros), 0),
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'nome_modulo', nome_modulo,
                    'descricao', descricao,
                    'qtd_planos', qtd_planos,
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

-- 3. UPSERT PLANO DE AULA
CREATE OR REPLACE FUNCTION public.aca_upsert_plano_de_aula(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_modulo UUID DEFAULT NULL,
    p_id_componente UUID DEFAULT NULL,
    p_titulo_plano TEXT DEFAULT NULL,
    p_ementa TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id_entidade IS NULL OR p_id_modulo IS NULL OR p_id_componente IS NULL THEN
        RAISE EXCEPTION 'Entidade, Módulo e Componente são obrigatórios';
    END IF;

    INSERT INTO public.aca_plano_de_aula (
        id,
        id_entidade,
        id_modulo,
        id_componente,
        titulo_plano,
        ementa,
        criado_por,
        modificado_por,
        modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade,
        p_id_modulo,
        p_id_componente,
        p_titulo_plano,
        p_ementa,
        p_usuario_id,
        p_usuario_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        id_componente = COALESCE(p_id_componente, aca_plano_de_aula.id_componente),
        titulo_plano = COALESCE(p_titulo_plano, aca_plano_de_aula.titulo_plano),
        ementa = COALESCE(p_ementa, aca_plano_de_aula.ementa),
        modificado_por = p_usuario_id,
        modificado_em = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_id,
        'message', 'Plano de aula salvo'
    );
END;
$$;

-- 4. GET PLANOS POR MODULO
CREATE OR REPLACE FUNCTION public.aca_get_planos_por_modulo(p_id_modulo UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'id_componente', p.id_componente,
                'nome_componente', c.nome_componente,
                'titulo_plano', p.titulo_plano,
                'ementa', p.ementa
            )
        )
        FROM public.aca_plano_de_aula p
        JOIN public.aca_componente c ON c.id = p.id_componente
        WHERE p.id_modulo = p_id_modulo
        ORDER BY p.criado_em ASC
    ), '[]'::jsonb);
END;
$$;
