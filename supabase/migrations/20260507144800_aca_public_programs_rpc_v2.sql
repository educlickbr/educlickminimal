-- ============================================================
-- Migration: aca_public_programs_rpc_v2
-- Data: 2026-05-07
-- Descrição: Corrige o cálculo da carga horária para somar dos 
--            componentes do módulo (novo padrão).
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_programas_publicos(p_id_entidade UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH programas_stats AS (
        SELECT 
            p.id,
            p.id_curso,
            p.id_area,
            p.descricao as programa_descricao,
            p.processo_seletivo_inicio,
            p.processo_seletivo_fim,
            p.matricula_inicio,
            p.matricula_fim,
            c.nome_curso,
            a.nome_area,
            -- Agregados dos Ciclos
            MIN(ci.data_ini) as data_inicio_aula,
            MAX(ci.data_fim) as data_fim_aula,
            -- Cálculo da Carga Horária via Componentes (Subquery para evitar duplicidade no JOIN)
            SUM(
                COALESCE((
                    SELECT SUM(mc.carga_horaria)
                    FROM public.aca_modulo_componente mc
                    WHERE mc.id_modulo = ci.id_modulo
                ), 0)
            ) as carga_horaria_total_minutos
        FROM public.aca_programa p
        LEFT JOIN public.aca_curso c ON c.id = p.id_curso
        LEFT JOIN public.aca_area a ON a.id = p.id_area
        LEFT JOIN public.aca_ciclo_programa cp ON cp.id_programa = p.id
        LEFT JOIN public.aca_ciclo ci ON ci.id = cp.id_ciclo
        WHERE p.id_entidade = p_id_entidade
          AND p.processo_seletivo_fim >= NOW()
        GROUP BY p.id, c.nome_curso, a.nome_area
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'id_curso', id_curso,
            'id_area', id_area,
            'nome_area', nome_area,
            'nome_display', COALESCE(nome_curso, programa_descricao),
            'descricao', programa_descricao,
            'processo_seletivo_inicio', processo_seletivo_inicio,
            'processo_seletivo_fim', processo_seletivo_fim,
            'matricula_inicio', matricula_inicio,
            'matricula_fim', matricula_fim,
            'data_inicio_aula', data_inicio_aula,
            'data_fim_aula', data_fim_aula,
            'carga_horaria_total_horas', ROUND(carga_horaria_total_minutos / 60.0, 1)
        )
    ) INTO v_result
    FROM programas_stats;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.aca_get_programas_publicos(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_programas_publicos(UUID) TO anon, authenticated;
