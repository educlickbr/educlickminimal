-- ============================================================
-- RPCs: LMS — Currículo (v2 com árvore completa)
-- Data: 2026-07-27
-- Descrição: Retorna a estrutura completa do currículo de um
--            programa, organizada por Área → Componente →
--            Módulo → Ciclo → Aula, com todos os conteúdos
--            associados (blueprint + operacional).
-- ============================================================

DROP FUNCTION IF EXISTS public.lms_list_curriculo(p_id_programa UUID, p_id_entidade UUID);

-- ═══════════════════════════════════════════════════════════
-- 1. lms_list_curriculo
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
    v_programa RECORD;
    v_result JSONB;
    v_area JSONB;
    v_componentes JSONB;
    v_modulos JSONB;
BEGIN
    -- Dados do programa
    SELECT p.*, c.nome_curso, a.nome_area
    INTO v_programa
    FROM public.aca_programa p
    JOIN public.aca_curso c ON c.id = p.id_curso
    LEFT JOIN public.aca_area a ON a.id = p.id_area
    WHERE p.id = p_id_programa AND p.id_entidade = p_id_entidade;

    -- ── 1. Conteúdos de Área ──────────────────────────────
    SELECT jsonb_build_object(
        'id_area', v_programa.id_area,
        'nome', v_programa.nome_area,
        'conteudos', COALESCE((
            SELECT jsonb_agg(sub ORDER BY sub.conteudo_titulo) FROM (
                SELECT DISTINCT ON (d.id_conteudo)
                    d.id_conteudo, c.titulo AS conteudo_titulo, c.tipo AS conteudo_tipo,
                    c.id_arquivo, c.url,
                    COALESCE(op.ativo, true) AS ativo,
                    COALESCE(op.destaque, false) AS destaque,
                    CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                    op.id AS op_id, op.data_disponivel
                FROM public.lms_distribuicao d
                JOIN public.lms_conteudo c ON c.id = d.id_conteudo
                LEFT JOIN public.lms_conteudo_operacional op
                    ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                    AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
                WHERE d.id_area = v_programa.id_area
                ORDER BY d.id_conteudo, op.id DESC
            ) sub
        ), '[]'::jsonb)
    ) INTO v_area;

    -- ── 2. Conteúdos por Componente ───────────────────────
    SELECT jsonb_agg(jsonb_build_object(
        'id', comp.id, 'nome', comp.nome_componente,
        'conteudos', COALESCE((
            SELECT jsonb_agg(sub ORDER BY sub.conteudo_titulo) FROM (
                SELECT DISTINCT ON (d.id_conteudo)
                    d.id_conteudo, c.titulo, c.tipo,
                    c.id_arquivo, c.url,
                    COALESCE(op.ativo, true) AS ativo,
                    COALESCE(op.destaque, false) AS destaque,
                    CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                    op.id AS op_id
                FROM public.lms_distribuicao d
                JOIN public.lms_conteudo c ON c.id = d.id_conteudo
                LEFT JOIN public.lms_conteudo_operacional op
                    ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                    AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
                WHERE d.id_componente = comp.id AND d.id_modulo IS NULL
                  AND NOT EXISTS (SELECT 1 FROM public.aca_modulo_componente mc
                    WHERE mc.id_componente = comp.id)
                ORDER BY d.id_conteudo, op.id DESC
            ) sub
        ), '[]'::jsonb)
    ) ORDER BY comp.nome_componente) INTO v_componentes
    FROM public.aca_componente comp
    WHERE comp.id_entidade = p_id_entidade;

    -- ── 3. Módulos (com ciclos e aulas) ──────────────────
    WITH modulos AS (
        SELECT m.id, m.nome_modulo, m.id_entidade
        FROM public.aca_curso_modulo cm
        JOIN public.aca_modulo m ON m.id = cm.id_modulo
        WHERE cm.id_curso = v_programa.id_curso
        ORDER BY cm.ordem
    ),
    modulos_json AS (
        SELECT jsonb_agg(jsonb_build_object(
            'id', m.id, 'nome', m.nome_modulo,
            'conteudos', COALESCE((
                SELECT jsonb_agg(sub ORDER BY sub.conteudo_titulo) FROM (
                    SELECT DISTINCT ON (d.id_conteudo)
                        d.id_conteudo, c.titulo, c.tipo,
                        c.id_arquivo, c.url,
                        COALESCE(op.ativo, true) AS ativo,
                        COALESCE(op.destaque, false) AS destaque,
                        CASE WHEN op.id IS NULL THEN true ELSE false END AS herdado,
                        op.id AS op_id
                    FROM public.lms_distribuicao d
                    JOIN public.lms_conteudo c ON c.id = d.id_conteudo
                    LEFT JOIN public.lms_conteudo_operacional op
                        ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                        AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
                    WHERE d.id_modulo = m.id
                    ORDER BY d.id_conteudo, op.id DESC
                ) sub
            ), '[]'::jsonb),
            'ciclos', COALESCE((
                SELECT jsonb_agg(ciclo_json ORDER BY c_cycle.data_ini) FROM (
                    SELECT
                        c_cycle.id, COALESCE(c_cycle.descricao, m.nome_modulo) AS nome,
                        COALESCE((
                            SELECT jsonb_agg(sub2 ORDER BY sub2.titulo) FROM (
                                SELECT DISTINCT ON (op2.id_conteudo)
                                    op2.id_conteudo, c2.titulo, c2.tipo,
                                    c2.id_arquivo, c2.url,
                                    COALESCE(op2.ativo, true) AS ativo,
                                    COALESCE(op2.destaque, false) AS destaque,
                                    false AS herdado, op2.id AS op_id
                                FROM public.lms_conteudo_operacional op2
                                JOIN public.lms_conteudo c2 ON c2.id = op2.id_conteudo
                                WHERE op2.id_programa = p_id_programa
                                  AND op2.id_ciclo = c_cycle.id
                                  AND op2.id_calendario IS NULL
                                ORDER BY op2.id_conteudo, op2.id DESC
                            ) sub2
                        ), '[]'::jsonb) AS conteudos,
                        COALESCE((
                            SELECT jsonb_agg(aula_json ORDER BY cal.dt_hora_ini) FROM (
                                SELECT
                                    cal.id, 'Aula ' || to_char(cal.dt_hora_ini, 'DD/MM') AS nome,
                                    cal.dt_hora_ini,
                                    COALESCE((
                                        SELECT jsonb_agg(sub3 ORDER BY sub3.titulo) FROM (
                                            SELECT DISTINCT ON (op3.id_conteudo)
                                                op3.id_conteudo, c3.titulo, c3.tipo,
                                                c3.id_arquivo, c3.url,
                                                COALESCE(op3.ativo, true) AS ativo,
                                                COALESCE(op3.destaque, false) AS destaque,
                                                false AS herdado, op3.id AS op_id
                                            FROM public.lms_conteudo_operacional op3
                                            JOIN public.lms_conteudo c3 ON c3.id = op3.id_conteudo
                                            WHERE op3.id_programa = p_id_programa
                                              AND op3.id_calendario = cal.id
                                            ORDER BY op3.id_conteudo, op3.id DESC
                                        ) sub3
                                    ), '[]'::jsonb) AS conteudos
                                FROM public.aca_calendario cal
                                WHERE cal.id_ciclo = c_cycle.id
                                ORDER BY cal.dt_hora_ini
                            ) aula_json
                        ), '[]'::jsonb) AS aulas
                    FROM public.aca_ciclo c_cycle
                    JOIN public.aca_ciclo_programa cp ON cp.id_ciclo = c_cycle.id
                    WHERE cp.id_programa = p_id_programa
                ) ciclo_json
            ), '[]'::jsonb)
        ) ORDER BY m.nome_modulo) AS tree
        FROM modulos m
    )
    SELECT tree INTO v_modulos FROM modulos_json;

    -- Monta resultado final
    SELECT jsonb_build_object(
        'programa', jsonb_build_object(
            'id', v_programa.id, 'descricao', v_programa.descricao,
            'curso_nome', v_programa.nome_curso, 'area_nome', v_programa.nome_area
        ),
        'area', v_area,
        'componentes', COALESCE(v_componentes, '[]'::jsonb),
        'modulos', COALESCE(v_modulos, '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 2. lms_list_programas_para_curriculo (mantida)
-- ═══════════════════════════════════════════════════════════
-- (já existe, mantida da migration anterior)

-- ═══════════════════════════════════════════════════════════
-- 3. lms_upsert_operacional (mantida)
-- ═══════════════════════════════════════════════════════════
-- (já existe, mantida da migration anterior)

-- ═══════════════════════════════════════════════════════════
-- 4. lms_delete_operacional (mantida)
-- ═══════════════════════════════════════════════════════════
-- (já existe, mantida da migration anterior)
