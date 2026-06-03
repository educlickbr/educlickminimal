-- ============================================================
-- Migration: aca_public_programs_rpc
-- Data: 2026-05-07
-- Descrição: Cria RPCs com Security Definer para acesso público
--            aos programas em processo seletivo aberto.
-- ============================================================

-- 1. Buscar Programas Públicos (Processo Seletivo Aberto)
CREATE OR REPLACE FUNCTION public.aca_get_programas_publicos(p_id_entidade UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Necessário para acesso de usuários não autenticados
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
            SUM(COALESCE(m.carga_horaria, 0)) as carga_horaria_total_minutos
        FROM public.aca_programa p
        LEFT JOIN public.aca_curso c ON c.id = p.id_curso
        LEFT JOIN public.aca_area a ON a.id = p.id_area
        LEFT JOIN public.aca_ciclo_programa cp ON cp.id_programa = p.id
        LEFT JOIN public.aca_ciclo ci ON ci.id = cp.id_ciclo
        LEFT JOIN public.aca_modulo m ON m.id = ci.id_modulo
        WHERE p.id_entidade = p_id_entidade
          AND p.processo_seletivo_fim >= NOW() -- Apenas processos abertos
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

-- 2. Buscar Áreas Públicas (para filtro)
CREATE OR REPLACE FUNCTION public.aca_get_areas_publicas(p_id_entidade UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'nome_area', nome_area
        )
    ) INTO v_result
    FROM public.aca_area
    WHERE id_entidade = p_id_entidade
    ORDER BY nome_area ASC;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Revogar acesso público direto e conceder apenas execução
REVOKE ALL ON FUNCTION public.aca_get_programas_publicos(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_programas_publicos(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.aca_get_areas_publicas(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aca_get_areas_publicas(UUID) TO authenticated;
