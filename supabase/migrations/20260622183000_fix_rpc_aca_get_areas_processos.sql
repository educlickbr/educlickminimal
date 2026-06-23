-- ============================================================
-- RPC: aca_get_areas_para_processos (CORREÇÃO)
-- Data: 2026-06-22
-- Descrição: Corrige a RPC anterior — processo_seletivo_fim
--            estava referenciando a tabela errada.
--            O campo está em aca_programa, não em aca_processo_seletivo.
--
-- Relacionamento:
--   aca_area ← aca_programa.id_area ← aca_processo_seletivo.id_programa
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_areas_para_processos(
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    SELECT jsonb_agg(sub ORDER BY sub.nome_area)
    INTO v_itens
    FROM (
        SELECT
            a.id,
            a.nome_area,
            a.descricao,
            COUNT(ps.id) FILTER (
                WHERE prog.processo_seletivo_fim IS NULL
                   OR prog.processo_seletivo_fim >= CURRENT_DATE
            ) AS qtd_processos_ativos
        FROM public.aca_area a
        LEFT JOIN public.aca_programa prog
            ON prog.id_area = a.id
            AND prog.id_entidade = p_id_entidade
        LEFT JOIN public.aca_processo_seletivo ps
            ON ps.id_programa = prog.id
            AND ps.id_entidade = p_id_entidade
        WHERE a.id_entidade = p_id_entidade
        GROUP BY a.id, a.nome_area, a.descricao
    ) sub;

    RETURN jsonb_build_object(
        'success', true,
        'itens', COALESCE(v_itens, '[]'::jsonb)
    );
END;
$$;
