-- ============================================================
-- Migration: refactor_lms_curriculo_lazy
-- Data: 2026-07-29
-- Descrição: Substitui lms_list_curriculo (que trazia tudo
--            de uma vez) por duas RPCs leves:
--   1. lms_get_curriculo_estrutura  → casca da árvore
--   2. lms_get_curriculo_conteudos  → conteúdos de um escopo
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. DROP lms_list_curriculo (pesada, trazia tudo)
-- ═══════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.lms_list_curriculo(p_id_programa UUID, p_id_entidade UUID);

-- ═══════════════════════════════════════════════════════════
-- 2. lms_get_curriculo_estrutura
-- Retorna a estrutura do programa para montar a árvore:
-- programa, area, componentes, modulos, ciclos, aulas
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_get_curriculo_estrutura(
    p_id_programa UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_programa RECORD;
    v_area JSONB;
    v_componentes JSONB;
    v_modulos JSONB;
    v_ciclos JSONB;
    v_aulas JSONB;
    v_result JSONB;
BEGIN
    -- Dados do programa
    SELECT p.*, c.nome_curso, a.nome_area
    INTO v_programa
    FROM public.aca_programa p
    JOIN public.aca_curso c ON c.id = p.id_curso
    LEFT JOIN public.aca_area a ON a.id = p.id_area
    WHERE p.id = p_id_programa AND p.id_entidade = p_id_entidade;

    -- Área (se houver)
    IF v_programa.id_area IS NOT NULL THEN
        v_area := jsonb_build_object('id', v_programa.id_area, 'nome', v_programa.nome_area);
    ELSE
        v_area := 'null'::jsonb;
    END IF;

    -- Componentes do curso do programa
    SELECT jsonb_agg(jsonb_build_object('id', comp.id, 'nome', comp.nome_componente)
        ORDER BY comp.nome_componente)
    INTO v_componentes
    FROM public.aca_componente comp
    WHERE comp.id_entidade = p_id_entidade
      AND EXISTS (
          SELECT 1 FROM public.aca_modulo_componente mc
          JOIN public.aca_curso_modulo cm ON cm.id_modulo = mc.id_modulo
          WHERE mc.id_componente = comp.id
            AND cm.id_curso = v_programa.id_curso
      );

    -- Módulos do curso
    SELECT jsonb_agg(jsonb_build_object('id', m.id, 'nome', m.nome_modulo)
        ORDER BY cm.ordem)
    INTO v_modulos
    FROM public.aca_curso_modulo cm
    JOIN public.aca_modulo m ON m.id = cm.id_modulo
    WHERE cm.id_curso = v_programa.id_curso;

    -- Ciclos do programa
    SELECT jsonb_agg(jsonb_build_object(
            'id', c_cycle.id,
            'nome', COALESCE(c_cycle.descricao, 'Ciclo'),
            'id_modulo', c_cycle.id_modulo,
            'data_ini', c_cycle.data_ini
        ) ORDER BY c_cycle.data_ini)
    INTO v_ciclos
    FROM public.aca_ciclo c_cycle
    JOIN public.aca_ciclo_programa cp ON cp.id_ciclo = c_cycle.id
    WHERE cp.id_programa = p_id_programa;

    -- Aulas do programa (via ciclos)
    SELECT jsonb_agg(jsonb_build_object(
            'id', cal.id,
            'nome', 'Aula ' || to_char(cal.dt_hora_ini, 'DD/MM/YYYY'),
            'dt_hora_ini', cal.dt_hora_ini,
            'id_ciclo', cal.id_ciclo
        ) ORDER BY cal.dt_hora_ini)
    INTO v_aulas
    FROM public.aca_calendario cal
    WHERE EXISTS (
        SELECT 1 FROM public.aca_ciclo_programa cp
        WHERE cp.id_ciclo = cal.id_ciclo AND cp.id_programa = p_id_programa
    );

    -- Monta resultado
    SELECT jsonb_build_object(
        'programa', jsonb_build_object(
            'id', v_programa.id, 'descricao', v_programa.descricao,
            'curso_nome', v_programa.nome_curso
        ),
        'area', v_area,
        'componentes', COALESCE(v_componentes, '[]'::jsonb),
        'modulos', COALESCE(v_modulos, '[]'::jsonb),
        'ciclos', COALESCE(v_ciclos, '[]'::jsonb),
        'aulas', COALESCE(v_aulas, '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 3. lms_get_curriculo_conteudos
-- Retorna conteúdos operacionais + distribuição para um escopo
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_get_curriculo_conteudos(
    p_id_programa UUID,
    p_id_entidade UUID,
    p_escopo_tipo TEXT,   -- 'area', 'componente', 'modulo', 'ciclo', 'calendario'
    p_escopo_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteudos JSONB;
BEGIN
    IF p_escopo_tipo = 'area' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                COALESCE(op.ativo, true) AS ativo,
                COALESCE(op.destaque, false) AS destaque,
                CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                op.id AS op_id
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            WHERE d.id_area = p_escopo_id
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'componente' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                COALESCE(op.ativo, true) AS ativo,
                COALESCE(op.destaque, false) AS destaque,
                CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                op.id AS op_id
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            WHERE d.id_componente = p_escopo_id AND d.id_modulo IS NULL
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'modulo' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                COALESCE(op.ativo, true) AS ativo,
                COALESCE(op.destaque, false) AS destaque,
                CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                op.id AS op_id
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            WHERE d.id_modulo = p_escopo_id
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'ciclo' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                op.ativo, COALESCE(op.destaque, false) AS destaque,
                false AS herdado, op.id AS op_id
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            WHERE op.id_programa = p_id_programa
              AND op.id_ciclo = p_escopo_id
              AND op.id_calendario IS NULL
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'calendario' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                op.ativo, COALESCE(op.destaque, false) AS destaque,
                false AS herdado, op.id AS op_id
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            WHERE op.id_programa = p_id_programa
              AND op.id_calendario = p_escopo_id
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSE
        v_conteudos := '[]'::jsonb;
    END IF;

    RETURN jsonb_build_object('conteudos', COALESCE(v_conteudos, '[]'::jsonb));
END;
$$;
