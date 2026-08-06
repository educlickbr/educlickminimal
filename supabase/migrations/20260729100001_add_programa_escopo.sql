-- ============================================================
-- Migration: add_programa_escopo_to_lms_get_curriculo_conteudos
-- Data: 2026-07-29
-- Descrição: Adiciona o escopo 'programa' na RPC
--            lms_get_curriculo_conteudos para listar
--            conteúdos ativados diretamente no programa
--            (sem vínculo com ciclo ou aula).
-- ============================================================

CREATE OR REPLACE FUNCTION public.lms_get_curriculo_conteudos(
    p_id_programa UUID,
    p_id_entidade UUID,
    p_escopo_tipo TEXT,
    p_escopo_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteudos JSONB;
BEGIN
    IF p_escopo_tipo = 'programa' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.id_arquivo, c.url,
                op.ativo, COALESCE(op.destaque, false) AS destaque,
                false AS herdado, op.id AS op_id
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            WHERE op.id_programa = p_id_programa
              AND op.id_ciclo IS NULL
              AND op.id_calendario IS NULL
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'area' THEN
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
