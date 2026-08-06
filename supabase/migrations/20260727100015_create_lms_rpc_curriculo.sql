-- ============================================================
-- RPCs: LMS — Currículo
-- Data: 2026-07-27
-- Descrição: Listar árvore do currículo, toggle ativar/desativar,
--            toggle destaque, injetar conteúdo no programa.
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. lms_list_curriculo
-- Retorna a árvore completa de conteúdos de um programa,
-- organizada por escopo (area, curso, modulo, componente,
-- ciclo, aula), com flag de herdado/ativo/destaque.
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_list_curriculo(
    p_id_programa UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_programa JSONB;
    v_modulos JSONB;
    v_ciclos JSONB;
    v_aulas JSONB;
    v_conteudos_blueprint JSONB;
    v_conteudos_operacionais JSONB;
    v_result JSONB;
BEGIN
    -- 1. Dados do programa
    SELECT jsonb_build_object(
        'id', p.id, 'descricao', p.descricao,
        'id_area', p.id_area, 'id_curso', p.id_curso
    ) INTO v_programa
    FROM public.aca_programa p WHERE p.id = p_id_programa AND p.id_entidade = p_id_entidade;

    -- 2. Módulos do curso do programa
    SELECT jsonb_agg(jsonb_build_object(
        'id', m.id, 'nome', m.nome_modulo, 'escopo', 'modulo'
    ) ORDER BY cm.ordem) INTO v_modulos
    FROM public.aca_curso_modulo cm
    JOIN public.aca_modulo m ON m.id = cm.id_modulo
    WHERE cm.id_curso = (v_programa->>'id_curso')::uuid;

    -- 3. Ciclos do programa
    SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'nome', COALESCE(c.descricao, 'Ciclo'), 'escopo', 'ciclo',
        'data_ini', c.data_ini, 'data_fim', c.data_fim
    ) ORDER BY c.data_ini) INTO v_ciclos
    FROM public.aca_ciclo_programa cp
    JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
    WHERE cp.id_programa = p_id_programa;

    -- 4. Aulas (calendário) dos ciclos do programa
    SELECT jsonb_agg(jsonb_build_object(
        'id', cal.id, 'nome', 'Aula ' || to_char(cal.dt_hora_ini, 'DD/MM'),
        'escopo', 'calendario', 'id_ciclo', cal.id_ciclo,
        'dt_hora_ini', cal.dt_hora_ini, 'dt_hora_fim', cal.dt_hora_fim
    ) ORDER BY cal.dt_hora_ini) INTO v_aulas
    FROM public.aca_calendario cal
    JOIN public.aca_ciclo_programa cp ON cp.id_ciclo = cal.id_ciclo
    WHERE cp.id_programa = p_id_programa;

    -- 5. Conteúdos do Blueprint (distribuídos) com merge do operacional
    WITH blueprint AS (
        -- Conteúdos distribuídos para área/curso/módulo/componente do programa
        SELECT
            d.id_conteudo,
            d.id_area, d.id_curso, d.id_modulo, d.id_componente,
            c.titulo AS conteudo_titulo, c.tipo AS conteudo_tipo,
            c.id_arquivo, c.url,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('id', b.id, 'titulo', b.titulo))
                FROM public.lms_conteudo_bloco cb JOIN public.lms_bloco b ON b.id = cb.id_bloco
                WHERE cb.id_conteudo = c.id), '[]'::jsonb) AS blocos,
            -- Operacional override
            op.id AS op_id, op.data_disponivel, op.data_entrega_limite,
            op.duracao_minutos, op.tentativas_permitidas, op.pontuacao_maxima,
            COALESCE(op.ativo, true) AS ativo, COALESCE(op.destaque, false) AS destaque,
            CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado
        FROM public.lms_distribuicao d
        JOIN public.lms_conteudo c ON c.id = d.id_conteudo
        LEFT JOIN public.lms_conteudo_operacional op
            ON op.id_conteudo = d.id_conteudo
            AND op.id_programa = p_id_programa
            AND op.id_ciclo IS NULL
            AND op.id_calendario IS NULL
        WHERE (
            d.id_area = (v_programa->>'id_area')::uuid
            OR d.id_curso = (v_programa->>'id_curso')::uuid
            OR d.id_modulo IN (SELECT (jsonb_array_elements(v_modulos)->>'id')::uuid)
            OR d.id_componente IN (
                SELECT mc.id_componente FROM public.aca_modulo_componente mc
                WHERE mc.id_modulo IN (SELECT (jsonb_array_elements(v_modulos)->>'id')::uuid)
            )
        )
    )
    SELECT jsonb_agg(blueprint.* ORDER BY conteudo_titulo) INTO v_conteudos_blueprint
    FROM blueprint;

    -- 6. Conteúdos injetados direto no operacional (sem distribuição)
    SELECT jsonb_agg(jsonb_build_object(
        'id_conteudo', c.id, 'conteudo_titulo', c.titulo, 'conteudo_tipo', c.tipo,
        'id_arquivo', c.id_arquivo, 'url', c.url,
        'blocos', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', b.id, 'titulo', b.titulo))
            FROM public.lms_conteudo_bloco cb JOIN public.lms_bloco b ON b.id = cb.id_bloco
            WHERE cb.id_conteudo = c.id), '[]'::jsonb),
        'op_id', op.id, 'ativo', COALESCE(op.ativo, true),
        'destaque', COALESCE(op.destaque, false), 'herdado', false,
        'id_ciclo', op.id_ciclo, 'id_calendario', op.id_calendario,
        'data_disponivel', op.data_disponivel, 'data_entrega_limite', op.data_entrega_limite,
        'duracao_minutos', op.duracao_minutos, 'tentativas_permitidas', op.tentativas_permitidas,
        'pontuacao_maxima', op.pontuacao_maxima
    ) ORDER BY c.titulo) INTO v_conteudos_operacionais
    FROM public.lms_conteudo_operacional op
    JOIN public.lms_conteudo c ON c.id = op.id_conteudo
    WHERE op.id_programa = p_id_programa
      AND op.id_ciclo IS NOT NULL; -- injetados em ciclo ou aula

    -- Monta resultado
    SELECT jsonb_build_object(
        'programa', v_programa,
        'modulos', COALESCE(v_modulos, '[]'::jsonb),
        'ciclos', COALESCE(v_ciclos, '[]'::jsonb),
        'aulas', COALESCE(v_aulas, '[]'::jsonb),
        'blueprint', COALESCE(v_conteudos_blueprint, '[]'::jsonb),
        'operacional', COALESCE(v_conteudos_operacionais, '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 2. lms_upsert_operacional
-- Cria ou atualiza um registro no lms_conteudo_operacional.
-- Usado para toggle ativar/desativar herança, marcar destaque,
-- ou definir timing específico para o conteúdo.
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_upsert_operacional(
    p_id_entidade UUID,
    p_id_conteudo UUID,
    p_id_programa UUID DEFAULT NULL,
    p_id_ciclo UUID DEFAULT NULL,
    p_id_calendario UUID DEFAULT NULL,
    p_ativo BOOLEAN DEFAULT NULL,
    p_destaque BOOLEAN DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.lms_conteudo_operacional
        (id_entidade, id_conteudo, id_programa, id_ciclo, id_calendario, ativo, destaque, criado_por)
    VALUES
        (p_id_entidade, p_id_conteudo, p_id_programa, p_id_ciclo, p_id_calendario,
         COALESCE(p_ativo, true), COALESCE(p_destaque, false), p_usuario_id)
    ON CONFLICT (id_conteudo, id_programa, COALESCE(id_ciclo, '00000000-0000-0000-0000-000000000000'),
                COALESCE(id_calendario, '00000000-0000-0000-0000-000000000000')) DO UPDATE SET
        ativo     = COALESCE(p_ativo, lms_conteudo_operacional.ativo),
        destaque  = COALESCE(p_destaque, lms_conteudo_operacional.destaque),
        modificado_por = p_usuario_id,
        modificado_em  = NOW()
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
        -- Já existia, fez UPDATE
        SELECT id INTO v_id FROM public.lms_conteudo_operacional
        WHERE id_conteudo = p_id_conteudo AND id_programa = p_id_programa
          AND (id_ciclo IS NULL OR id_ciclo = p_id_ciclo)
          AND (id_calendario IS NULL OR id_calendario = p_id_calendario)
        LIMIT 1;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Operacional atualizado');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 3. lms_delete_operacional
-- Remove um registro operacional (volta ao estado herdado).
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_delete_operacional(
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
    DELETE FROM public.lms_conteudo_operacional
    WHERE id = p_id AND id_entidade = p_id_entidade
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Registro não encontrado');
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_deleted_id, 'message', 'Registro removido — conteúdo volta ao estado herdado');
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 4. lms_list_programas_para_curriculo
-- Lista programas para o dropdown rico da tela de currículo.
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_list_programas_para_curriculo(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'id', p.id,
        'descricao', p.descricao,
        'curso_nome', c.nome_curso,
        'area_nome', a.nome_area,
        'criado_em', p.criado_em,
        'qtd_ciclos', (SELECT COUNT(*) FROM public.aca_ciclo_programa WHERE id_programa = p.id)
    ) ORDER BY p.criado_em DESC) INTO v_result
    FROM public.aca_programa p
    JOIN public.aca_curso c ON c.id = p.id_curso
    LEFT JOIN public.aca_area a ON a.id = p.id_area
    WHERE p.id_entidade = p_id_entidade;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
