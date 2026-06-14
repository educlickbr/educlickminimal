-- ============================================================
-- Migration: programa_processos_multiplos
-- Data: 2026-06-10
-- Descrição: Suporta múltiplos processos seletivos por programa
--            e impede sobreposição de períodos.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aca_processo_seletivo_sem_overlap'
          AND conrelid = 'public.aca_processo_seletivo'::regclass
    ) THEN
        ALTER TABLE public.aca_processo_seletivo
        ADD CONSTRAINT aca_processo_seletivo_sem_overlap
        EXCLUDE USING gist (
            id_programa WITH =,
            tstzrange(data_inicio, data_fim, '[)') WITH &&
        );
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.aca_sync_processos_programa(
    p_id_programa UUID,
    p_id_entidade UUID,
    p_usuario_id UUID,
    p_processos JSONB DEFAULT NULL,
    p_default_nome_processo TEXT DEFAULT NULL,
    p_legacy_processo_inicio TIMESTAMPTZ DEFAULT NULL,
    p_legacy_processo_fim TIMESTAMPTZ DEFAULT NULL,
    p_legacy_matricula_inicio TIMESTAMPTZ DEFAULT NULL,
    p_legacy_matricula_fim TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_primeiro_processo_id UUID;
BEGIN
    IF p_id_programa IS NULL OR p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'Programa e entidade são obrigatórios para sincronizar processos';
    END IF;

    IF p_processos IS NOT NULL THEN
        IF jsonb_typeof(p_processos) <> 'array' THEN
            RAISE EXCEPTION 'Processos deve ser um array JSON';
        END IF;

        IF jsonb_array_length(p_processos) = 0 THEN
            RAISE EXCEPTION 'Informe ao menos um processo seletivo';
        END IF;

        IF EXISTS (
            WITH payload AS (
                SELECT
                    NULLIF(TRIM(x.id), '') AS id_text
                FROM jsonb_to_recordset(p_processos) AS x(
                    id TEXT,
                    nome_processo TEXT,
                    data_inicio TIMESTAMPTZ,
                    data_fim TIMESTAMPTZ,
                    matricula_inicio TIMESTAMPTZ,
                    matricula_fim TIMESTAMPTZ
                )
            )
            SELECT 1
            FROM payload
            WHERE id_text IS NOT NULL
              AND id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        ) THEN
            RAISE EXCEPTION 'ID de processo inválido no payload';
        END IF;

        IF EXISTS (
            WITH payload AS (
                SELECT NULLIF(TRIM(x.id), '')::uuid AS id
                FROM jsonb_to_recordset(p_processos) AS x(
                    id TEXT,
                    nome_processo TEXT,
                    data_inicio TIMESTAMPTZ,
                    data_fim TIMESTAMPTZ,
                    matricula_inicio TIMESTAMPTZ,
                    matricula_fim TIMESTAMPTZ
                )
                WHERE NULLIF(TRIM(x.id), '') IS NOT NULL
            )
            SELECT 1
            FROM payload
            GROUP BY id
            HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Payload de processos contém IDs duplicados';
        END IF;

        IF EXISTS (
            WITH payload AS (
                SELECT NULLIF(TRIM(x.id), '')::uuid AS id
                FROM jsonb_to_recordset(p_processos) AS x(
                    id TEXT,
                    nome_processo TEXT,
                    data_inicio TIMESTAMPTZ,
                    data_fim TIMESTAMPTZ,
                    matricula_inicio TIMESTAMPTZ,
                    matricula_fim TIMESTAMPTZ
                )
                WHERE NULLIF(TRIM(x.id), '') IS NOT NULL
            )
            SELECT 1
            FROM payload p
            JOIN public.aca_processo_seletivo ps ON ps.id = p.id
            WHERE ps.id_programa <> p_id_programa
               OR ps.id_entidade <> p_id_entidade
        ) THEN
            RAISE EXCEPTION 'Um ou mais IDs de processo não pertencem a este programa';
        END IF;

        IF EXISTS (
            WITH payload AS (
                SELECT
                    NULLIF(TRIM(x.nome_processo), '') AS nome_processo,
                    x.data_inicio,
                    x.data_fim
                FROM jsonb_to_recordset(p_processos) AS x(
                    id TEXT,
                    nome_processo TEXT,
                    data_inicio TIMESTAMPTZ,
                    data_fim TIMESTAMPTZ,
                    matricula_inicio TIMESTAMPTZ,
                    matricula_fim TIMESTAMPTZ
                )
            )
            SELECT 1
            FROM payload
            WHERE nome_processo IS NULL
               OR data_inicio IS NULL
               OR data_fim IS NULL
        ) THEN
            RAISE EXCEPTION 'Cada processo deve ter nome, data de início e data de fim';
        END IF;

        IF EXISTS (
            WITH payload AS (
                SELECT
                    x.data_inicio,
                    x.data_fim,
                    x.matricula_inicio,
                    x.matricula_fim
                FROM jsonb_to_recordset(p_processos) AS x(
                    id TEXT,
                    nome_processo TEXT,
                    data_inicio TIMESTAMPTZ,
                    data_fim TIMESTAMPTZ,
                    matricula_inicio TIMESTAMPTZ,
                    matricula_fim TIMESTAMPTZ
                )
            )
            SELECT 1
            FROM payload
            WHERE data_fim < data_inicio
               OR (
                    matricula_inicio IS NOT NULL
                    AND matricula_fim IS NOT NULL
                    AND matricula_fim < matricula_inicio
               )
        ) THEN
            RAISE EXCEPTION 'Períodos de processo ou matrícula inválidos';
        END IF;

        IF EXISTS (
            WITH payload AS (
                SELECT
                    ROW_NUMBER() OVER () AS ord,
                    x.data_inicio,
                    x.data_fim
                FROM jsonb_to_recordset(p_processos) AS x(
                    id TEXT,
                    nome_processo TEXT,
                    data_inicio TIMESTAMPTZ,
                    data_fim TIMESTAMPTZ,
                    matricula_inicio TIMESTAMPTZ,
                    matricula_fim TIMESTAMPTZ
                )
            )
            SELECT 1
            FROM payload a
            JOIN payload b ON a.ord < b.ord
            WHERE tstzrange(a.data_inicio, a.data_fim, '[)') && tstzrange(b.data_inicio, b.data_fim, '[)')
        ) THEN
            RAISE EXCEPTION 'Processos seletivos não podem ter períodos sobrepostos';
        END IF;

        DELETE FROM public.aca_processo_seletivo
        WHERE id_programa = p_id_programa
          AND id_entidade = p_id_entidade;

        INSERT INTO public.aca_processo_seletivo (
            id,
            id_programa,
            nome_processo,
            data_inicio,
            data_fim,
            matricula_inicio,
            matricula_fim,
            criado_por,
            modificado_por,
            modificado_em,
            id_entidade
        )
        SELECT
            COALESCE(NULLIF(TRIM(x.id), '')::uuid, gen_random_uuid()),
            p_id_programa,
            TRIM(x.nome_processo),
            x.data_inicio,
            x.data_fim,
            x.matricula_inicio,
            x.matricula_fim,
            p_usuario_id,
            p_usuario_id,
            NOW(),
            p_id_entidade
        FROM jsonb_to_recordset(p_processos) AS x(
            id TEXT,
            nome_processo TEXT,
            data_inicio TIMESTAMPTZ,
            data_fim TIMESTAMPTZ,
            matricula_inicio TIMESTAMPTZ,
            matricula_fim TIMESTAMPTZ
        )
        ORDER BY x.data_inicio;

        RETURN;
    END IF;

    IF p_legacy_processo_inicio IS NULL OR p_legacy_processo_fim IS NULL THEN
        RETURN;
    END IF;

    IF p_legacy_processo_fim < p_legacy_processo_inicio THEN
        RAISE EXCEPTION 'Data final do processo seletivo não pode ser menor que a inicial';
    END IF;

    IF p_legacy_matricula_inicio IS NOT NULL
       AND p_legacy_matricula_fim IS NOT NULL
       AND p_legacy_matricula_fim < p_legacy_matricula_inicio THEN
        RAISE EXCEPTION 'Data final da matrícula não pode ser menor que a inicial';
    END IF;

    SELECT ps.id
    INTO v_primeiro_processo_id
    FROM public.aca_processo_seletivo ps
    WHERE ps.id_programa = p_id_programa
      AND ps.id_entidade = p_id_entidade
    ORDER BY ps.data_inicio, ps.criado_em
    LIMIT 1;

    IF v_primeiro_processo_id IS NULL THEN
        INSERT INTO public.aca_processo_seletivo (
            id_programa,
            nome_processo,
            data_inicio,
            data_fim,
            matricula_inicio,
            matricula_fim,
            criado_por,
            modificado_por,
            modificado_em,
            id_entidade
        )
        VALUES (
            p_id_programa,
            COALESCE(NULLIF(TRIM(p_default_nome_processo), ''), 'Processo Seletivo'),
            p_legacy_processo_inicio,
            p_legacy_processo_fim,
            p_legacy_matricula_inicio,
            p_legacy_matricula_fim,
            p_usuario_id,
            p_usuario_id,
            NOW(),
            p_id_entidade
        );
    ELSE
        UPDATE public.aca_processo_seletivo
        SET
            nome_processo = COALESCE(NULLIF(TRIM(p_default_nome_processo), ''), nome_processo),
            data_inicio = p_legacy_processo_inicio,
            data_fim = p_legacy_processo_fim,
            matricula_inicio = p_legacy_matricula_inicio,
            matricula_fim = p_legacy_matricula_fim,
            modificado_por = p_usuario_id,
            modificado_em = NOW()
        WHERE id = v_primeiro_processo_id;
    END IF;
END;
$$;

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
    p_processos JSONB DEFAULT NULL
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
            matricula_fim
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
            p_matricula_fim
        )
        RETURNING id INTO v_id;
    ELSE
        UPDATE public.aca_programa
        SET
            id_curso = p_id_curso,
            descricao = p_descricao,
            modificado_por = p_usuario_id,
            modificado_em = NOW(),
            id_area = v_id_area,
            processo_seletivo_inicio = p_processo_seletivo_inicio,
            processo_seletivo_fim = p_processo_seletivo_fim,
            matricula_inicio = p_matricula_inicio,
            matricula_fim = p_matricula_fim
        WHERE id = p_id
          AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;

        IF v_id IS NULL THEN
            RAISE EXCEPTION 'Programa não encontrado ou sem permissão de edição';
        END IF;
    END IF;

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
    p_processos JSONB DEFAULT NULL
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
BEGIN
    IF array_length(p_ciclos, 1) IS NULL THEN
        RAISE EXCEPTION 'Nenhum ciclo selecionado para compor o programa.';
    END IF;

    IF p_id_curso IS NOT NULL THEN
        SELECT id_area INTO v_id_area FROM public.aca_curso WHERE id = p_id_curso;
    ELSE
        v_id_area := p_id_area;
    END IF;

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
            matricula_fim
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
            p_matricula_fim
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
                matricula_fim
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
                p_matricula_fim
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
