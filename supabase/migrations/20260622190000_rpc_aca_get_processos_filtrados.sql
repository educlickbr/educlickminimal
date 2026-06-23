-- ============================================================
-- RPC: aca_get_processos_filtrados
-- Data: 2026-06-22
-- Descrição: Retorna programas com processos seletivos,
--            filtráveis por área, ano/semestre e busca textual.
--
-- Relacionamento:
--   aca_area ← aca_programa.id_area ← aca_processo_seletivo.id_programa
--   aca_programa ← aca_ciclo_programa ← aca_ciclo (ano_semestre)
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_processos_filtrados(
    p_id_entidade UUID,
    p_id_area UUID DEFAULT NULL,
    p_ano_semestre TEXT DEFAULT NULL,
    p_busca TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT jsonb_agg(sub ORDER BY sub.nome_area, sub.nome_display)
    INTO v_itens
    FROM (
        SELECT
            prog.id,
            prog.descricao,
            a.id AS id_area,
            a.nome_area,
            prog.processo_seletivo_inicio,
            prog.processo_seletivo_fim,
            prog.matricula_inicio,
            prog.matricula_fim,
            ps.id AS id_processo_seletivo,
            ps.nome_processo,
            -- Ano/semestre do primeiro ciclo do programa
            (
                SELECT c.ano_semestre
                FROM public.aca_ciclo_programa cp
                JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                WHERE cp.id_programa = prog.id
                ORDER BY c.data_ini ASC
                LIMIT 1
            ) AS ano_semestre,
            -- Carga horária total (soma dos módulos dos ciclos)
            (
                SELECT ROUND(SUM(COALESCE(m.carga_horaria, 0)) / 60.0, 1)
                FROM public.aca_ciclo_programa cp
                JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                JOIN public.aca_modulo m ON m.id = c.id_modulo
                WHERE cp.id_programa = prog.id
            ) AS carga_horaria_total_horas,
            -- Nome de exibição
            COALESCE(cur.nome_curso, prog.descricao) AS nome_display,
            -- Total de inscritos
            (
                SELECT COUNT(*)
                FROM public.aca_processo_seletivo_inscricoes ins
                WHERE ins.id_processo = ps.id
            ) AS total_inscritos
        FROM public.aca_programa prog
        JOIN public.aca_processo_seletivo ps
            ON ps.id_programa = prog.id
            AND ps.id_entidade = p_id_entidade
        LEFT JOIN public.aca_area a
            ON a.id = prog.id_area
        LEFT JOIN public.aca_curso cur
            ON cur.id = prog.id_curso
        WHERE prog.id_entidade = p_id_entidade
          -- Filtro: área
          AND (p_id_area IS NULL OR prog.id_area = p_id_area)
          -- Filtro: ano_semestre (primeiro ciclo do programa)
          AND (
              p_ano_semestre IS NULL
              OR EXISTS (
                  SELECT 1
                  FROM public.aca_ciclo_programa cp
                  JOIN public.aca_ciclo c ON c.id = cp.id_ciclo
                  WHERE cp.id_programa = prog.id
                    AND c.ano_semestre = p_ano_semestre
                  ORDER BY c.data_ini ASC
                  LIMIT 1
              )
          )
          -- Filtro: busca (nome do programa, área, ou processo)
          AND (
              p_busca IS NULL
              OR prog.descricao ILIKE '%' || p_busca || '%'
              OR ps.nome_processo ILIKE '%' || p_busca || '%'
              OR a.nome_area ILIKE '%' || p_busca || '%'
          )
    ) sub;

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb)
    );
END;
$$;
