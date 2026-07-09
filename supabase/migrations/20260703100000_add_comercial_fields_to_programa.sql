-- ============================================================
-- Migration: add_comercial_fields_to_programa
-- Data: 2026-07-03
-- Descrição: Adiciona campos de natureza comercial ao aca_programa
--            (gratuito, exige_processo_seletivo) e atualiza RPCs.
-- ============================================================

-- ============================================================
-- 1. Adicionar colunas
-- ============================================================
ALTER TABLE public.aca_programa
  ADD COLUMN IF NOT EXISTS gratuito boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exige_processo_seletivo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.aca_programa.gratuito IS 'Se true, o programa é gratuito por natureza (pode ter ofertas pagas ou gratuitas)';
COMMENT ON COLUMN public.aca_programa.exige_processo_seletivo IS 'Se true, o aluno precisa passar por processo seletivo antes de ser matriculado';


-- ============================================================
-- 2. Atualizar RPC: aca_get_programas_paginado
--    Agora retorna os novos campos gratuito e exige_processo_seletivo
-- ============================================================
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
            a.nome_area,
            (SELECT COUNT(*) FROM public.aca_ciclo_programa WHERE id_programa = p.id) as qtd_ciclos,
            COUNT(*) OVER() AS total_registros
        FROM public.aca_programa p
        JOIN public.aca_curso c ON c.id = p.id_curso
        LEFT JOIN public.aca_area a ON a.id = p.id_area
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
                    'id_entidade', id_entidade,
                    'id_curso', id_curso,
                    'id_area', id_area,
                    'nome_curso', nome_curso,
                    'nome_area', nome_area,
                    'descricao', descricao,
                    'qtd_ciclos', qtd_ciclos,
                    'gratuito', gratuito,
                    'exige_processo_seletivo', exige_processo_seletivo,
                    'criado_em', criado_em,
                    'modificado_em', modificado_em
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;


-- ============================================================
-- 3. Atualizar RPC: aca_upsert_programa
--    Agora aceita e persiste gratuito e exige_processo_seletivo
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_upsert_programa(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_curso UUID DEFAULT NULL,
    p_descricao TEXT DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL,
    p_ciclos UUID[] DEFAULT NULL,
    p_id_area UUID DEFAULT NULL,
    p_processo_seletivo_inicio TIMESTAMPTZ DEFAULT NULL,
    p_processo_seletivo_fim TIMESTAMPTZ DEFAULT NULL,
    p_matricula_inicio TIMESTAMPTZ DEFAULT NULL,
    p_matricula_fim TIMESTAMPTZ DEFAULT NULL,
    p_processos JSONB DEFAULT NULL,
    p_gratuito BOOLEAN DEFAULT NULL,
    p_exige_processo_seletivo BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
    v_ciclo_id UUID;
    v_id_area UUID;
BEGIN
    IF p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'ID da entidade é obrigatório';
    END IF;

    IF p_id_curso IS NOT NULL THEN
        SELECT id_area INTO v_id_area FROM public.aca_curso WHERE id = p_id_curso;
    ELSE
        v_id_area := p_id_area;
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO public.aca_programa (
            id,
            id_entidade,
            id_curso,
            descricao,
            criado_por,
            modificado_por,
            modificado_em,
            id_area,
            processo_seletivo_inicio,
            processo_seletivo_fim,
            matricula_inicio,
            matricula_fim,
            gratuito,
            exige_processo_seletivo
        )
        VALUES (
            gen_random_uuid(),
            p_id_entidade,
            p_id_curso,
            p_descricao,
            p_usuario_id,
            p_usuario_id,
            NOW(),
            v_id_area,
            p_processo_seletivo_inicio,
            p_processo_seletivo_fim,
            p_matricula_inicio,
            p_matricula_fim,
            COALESCE(p_gratuito, true),
            COALESCE(p_exige_processo_seletivo, false)
        )
        RETURNING id INTO v_id;
    ELSE
        UPDATE public.aca_programa
        SET
            id_curso = COALESCE(p_id_curso, id_curso),
            descricao = COALESCE(p_descricao, descricao),
            modificado_por = p_usuario_id,
            modificado_em = NOW(),
            id_area = COALESCE(v_id_area, id_area),
            processo_seletivo_inicio = p_processo_seletivo_inicio,
            processo_seletivo_fim = p_processo_seletivo_fim,
            matricula_inicio = p_matricula_inicio,
            matricula_fim = p_matricula_fim,
            gratuito = COALESCE(p_gratuito, gratuito),
            exige_processo_seletivo = COALESCE(p_exige_processo_seletivo, exige_processo_seletivo)
        WHERE id = p_id
          AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;

        IF v_id IS NULL THEN
            RAISE EXCEPTION 'Programa não encontrado ou sem permissão de edição';
        END IF;
    END IF;

    -- Sincroniza ciclos se enviado
    IF p_ciclos IS NOT NULL THEN
        DELETE FROM public.aca_ciclo_programa
        WHERE id_programa = v_id
          AND id_entidade = p_id_entidade;

        FOREACH v_ciclo_id IN ARRAY p_ciclos
        LOOP
            INSERT INTO public.aca_ciclo_programa (
                id_entidade,
                id_ciclo,
                id_programa,
                criado_por
            )
            VALUES (
                p_id_entidade,
                v_ciclo_id,
                v_id,
                p_usuario_id
            );
        END LOOP;
    END IF;

    -- Sincroniza processos seletivos se enviado
    PERFORM public.aca_sync_processos_programa(
        p_id_programa => v_id,
        p_id_entidade => p_id_entidade,
        p_usuario_id => p_usuario_id,
        p_processos => p_processos,
        p_default_nome_processo => COALESCE(p_descricao, 'Processo Seletivo'),
        p_legacy_processo_inicio => p_processo_seletivo_inicio,
        p_legacy_processo_fim => p_processo_seletivo_fim,
        p_legacy_matricula_inicio => p_matricula_inicio,
        p_legacy_matricula_fim => p_matricula_fim
    );

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;


-- ============================================================
-- 4. Atualizar RPC: aca_create_programas_lote
--    Agora aceita gratuito e exige_processo_seletivo
-- ============================================================
CREATE OR REPLACE FUNCTION public.aca_create_programas_lote(
    p_id_entidade UUID,
    p_id_curso UUID,
    p_descricao TEXT,
    p_ciclos UUID[],
    p_estrategia TEXT,
    p_usuario_id UUID,
    p_descricoes JSONB DEFAULT NULL,
    p_id_area UUID DEFAULT NULL,
    p_processo_seletivo_inicio TIMESTAMPTZ DEFAULT NULL,
    p_processo_seletivo_fim TIMESTAMPTZ DEFAULT NULL,
    p_matricula_inicio TIMESTAMPTZ DEFAULT NULL,
    p_matricula_fim TIMESTAMPTZ DEFAULT NULL,
    p_processos JSONB DEFAULT NULL,
    p_gratuito BOOLEAN DEFAULT NULL,
    p_exige_processo_seletivo BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_programa_id UUID;
    v_ciclo_id UUID;
    v_nome_modulo TEXT;
    v_nome_personalizado TEXT;
    v_descricao_final TEXT;
    v_id_area UUID;
    v_gratuito BOOLEAN;
    v_exige_processo_seletivo BOOLEAN;
BEGIN
    IF array_length(p_ciclos, 1) IS NULL THEN
        RAISE EXCEPTION 'Nenhum ciclo selecionado para compor o programa.';
    END IF;

    IF p_id_curso IS NOT NULL THEN
        SELECT id_area INTO v_id_area FROM public.aca_curso WHERE id = p_id_curso;
    ELSE
        v_id_area := p_id_area;
    END IF;

    v_gratuito := COALESCE(p_gratuito, true);
    v_exige_processo_seletivo := COALESCE(p_exige_processo_seletivo, false);

    IF p_estrategia = 'unica' THEN
        INSERT INTO public.aca_programa (
            id_entidade,
            id_curso,
            descricao,
            criado_por,
            id_area,
            processo_seletivo_inicio,
            processo_seletivo_fim,
            matricula_inicio,
            matricula_fim,
            gratuito,
            exige_processo_seletivo
        )
        VALUES (
            p_id_entidade,
            p_id_curso,
            p_descricao,
            p_usuario_id,
            v_id_area,
            p_processo_seletivo_inicio,
            p_processo_seletivo_fim,
            p_matricula_inicio,
            p_matricula_fim,
            v_gratuito,
            v_exige_processo_seletivo
        )
        RETURNING id INTO v_programa_id;

        FOREACH v_ciclo_id IN ARRAY p_ciclos
        LOOP
            INSERT INTO public.aca_ciclo_programa (
                id_entidade,
                id_ciclo,
                id_programa,
                criado_por
            )
            VALUES (
                p_id_entidade,
                v_ciclo_id,
                v_programa_id,
                p_usuario_id
            );
        END LOOP;

        PERFORM public.aca_sync_processos_programa(
            p_id_programa => v_programa_id,
            p_id_entidade => p_id_entidade,
            p_usuario_id => p_usuario_id,
            p_processos => p_processos,
            p_default_nome_processo => COALESCE(p_descricao, 'Processo Seletivo'),
            p_legacy_processo_inicio => p_processo_seletivo_inicio,
            p_legacy_processo_fim => p_processo_seletivo_fim,
            p_legacy_matricula_inicio => p_matricula_inicio,
            p_legacy_matricula_fim => p_matricula_fim
        );

    ELSIF p_estrategia = 'separada' THEN
        FOREACH v_ciclo_id IN ARRAY p_ciclos
        LOOP
            IF p_descricoes IS NOT NULL AND p_descricoes ? v_ciclo_id::text THEN
                v_nome_personalizado := p_descricoes->>v_ciclo_id::text;
            ELSE
                v_nome_personalizado := NULL;
            END IF;

            IF v_nome_personalizado IS NOT NULL AND TRIM(v_nome_personalizado) <> '' THEN
                v_descricao_final := v_nome_personalizado;
            ELSE
                SELECT m.nome_modulo
                INTO v_nome_modulo
                FROM public.aca_ciclo c
                JOIN public.aca_modulo m ON c.id_modulo = m.id
                WHERE c.id = v_ciclo_id;

                v_descricao_final := CASE
                    WHEN array_length(p_ciclos, 1) > 1 AND v_nome_modulo IS NOT NULL THEN p_descricao || ' - ' || v_nome_modulo
                    ELSE p_descricao
                END;
            END IF;

            INSERT INTO public.aca_programa (
                id_entidade,
                id_curso,
                descricao,
                criado_por,
                id_area,
                processo_seletivo_inicio,
                processo_seletivo_fim,
                matricula_inicio,
                matricula_fim,
                gratuito,
                exige_processo_seletivo
            )
            VALUES (
                p_id_entidade,
                p_id_curso,
                v_descricao_final,
                p_usuario_id,
                v_id_area,
                p_processo_seletivo_inicio,
                p_processo_seletivo_fim,
                p_matricula_inicio,
                p_matricula_fim,
                v_gratuito,
                v_exige_processo_seletivo
            )
            RETURNING id INTO v_programa_id;

            INSERT INTO public.aca_ciclo_programa (
                id_entidade,
                id_ciclo,
                id_programa,
                criado_por
            )
            VALUES (
                p_id_entidade,
                v_ciclo_id,
                v_programa_id,
                p_usuario_id
            );

            PERFORM public.aca_sync_processos_programa(
                p_id_programa => v_programa_id,
                p_id_entidade => p_id_entidade,
                p_usuario_id => p_usuario_id,
                p_processos => p_processos,
                p_default_nome_processo => COALESCE(v_descricao_final, p_descricao, 'Processo Seletivo'),
                p_legacy_processo_inicio => p_processo_seletivo_inicio,
                p_legacy_processo_fim => p_processo_seletivo_fim,
                p_legacy_matricula_inicio => p_matricula_inicio,
                p_legacy_matricula_fim => p_matricula_fim
            );
        END LOOP;
    ELSE
        RAISE EXCEPTION 'Estratégia de agrupamento inválida: %', p_estrategia;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Programa(s) e processos seletivos salvos com sucesso'
    );
END;
$$;
