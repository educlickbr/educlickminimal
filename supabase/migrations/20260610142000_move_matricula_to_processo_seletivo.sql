-- ============================================================
-- Migration: move_matricula_to_processo_seletivo
-- Data: 2026-06-10
-- Descrição: Move as datas de matrícula para o escopo do processo
--            seletivo, com backfill dos dados existentes.
-- ============================================================

ALTER TABLE public.aca_processo_seletivo
ADD COLUMN IF NOT EXISTS matricula_inicio TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS matricula_fim TIMESTAMPTZ NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aca_processo_seletivo_matricula_periodo_check'
          AND conrelid = 'public.aca_processo_seletivo'::regclass
    ) THEN
        ALTER TABLE public.aca_processo_seletivo
        ADD CONSTRAINT aca_processo_seletivo_matricula_periodo_check
        CHECK (
            matricula_inicio IS NULL
            OR matricula_fim IS NULL
            OR matricula_fim >= matricula_inicio
        );
    END IF;
END
$$;

UPDATE public.aca_processo_seletivo ps
SET
    matricula_inicio = COALESCE(ps.matricula_inicio, p.matricula_inicio),
    matricula_fim = COALESCE(ps.matricula_fim, p.matricula_fim),
    modificado_em = NOW()
FROM public.aca_programa p
WHERE p.id = ps.id_programa
  AND p.id_entidade = ps.id_entidade
  AND (
      (ps.matricula_inicio IS NULL AND p.matricula_inicio IS NOT NULL)
      OR (ps.matricula_fim IS NULL AND p.matricula_fim IS NOT NULL)
  );

CREATE OR REPLACE FUNCTION public.aca_get_programas_publicos(p_id_entidade UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH processos_stats AS (
        SELECT
            p.id AS id_programa,
            ps.id AS id_processo_seletivo,
            p.id_curso,
            p.id_area,
            p.descricao AS programa_descricao,
            ps.nome_processo,
            ps.data_inicio AS processo_seletivo_inicio,
            ps.data_fim AS processo_seletivo_fim,
            ps.matricula_inicio,
            ps.matricula_fim,
            c.nome_curso,
            a.nome_area,
            MIN(ci.data_ini) AS data_inicio_aula,
            MAX(ci.data_fim) AS data_fim_aula,
            SUM(
                COALESCE((
                    SELECT SUM(mc.carga_horaria)
                    FROM public.aca_modulo_componente mc
                    WHERE mc.id_modulo = ci.id_modulo
                ), 0)
            ) AS carga_horaria_total_minutos
        FROM public.aca_programa p
        INNER JOIN public.aca_processo_seletivo ps
            ON ps.id_programa = p.id
           AND ps.id_entidade = p_id_entidade
        LEFT JOIN public.aca_curso c ON c.id = p.id_curso
        LEFT JOIN public.aca_area a ON a.id = p.id_area
        LEFT JOIN public.aca_ciclo_programa cp ON cp.id_programa = p.id
        LEFT JOIN public.aca_ciclo ci ON ci.id = cp.id_ciclo
        WHERE p.id_entidade = p_id_entidade
          AND ps.data_fim >= NOW()
        GROUP BY
            p.id,
            ps.id,
            p.id_curso,
            p.id_area,
            p.descricao,
            ps.nome_processo,
            ps.data_inicio,
            ps.data_fim,
            ps.matricula_inicio,
            ps.matricula_fim,
            c.nome_curso,
            a.nome_area
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id_programa,
            'id_processo_seletivo', id_processo_seletivo,
            'id_curso', id_curso,
            'id_area', id_area,
            'nome_area', nome_area,
            'nome_processo', nome_processo,
            'nome_display', COALESCE(nome_curso, programa_descricao),
            'descricao', programa_descricao,
            'processo_seletivo_inicio', processo_seletivo_inicio,
            'processo_seletivo_fim', processo_seletivo_fim,
            'matricula_inicio', matricula_inicio,
            'matricula_fim', matricula_fim,
            'data_inicio_aula', data_inicio_aula,
            'data_fim_aula', data_fim_aula,
            'carga_horaria_total_horas', ROUND(COALESCE(carga_horaria_total_minutos, 0) / 60.0, 1)
        )
        ORDER BY
            COALESCE(nome_area, ''),
            COALESCE(nome_curso, programa_descricao, ''),
            processo_seletivo_fim,
            nome_processo
    ) INTO v_result
    FROM processos_stats;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.aca_get_programas_publicos(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_programas_publicos(UUID) TO authenticated;
