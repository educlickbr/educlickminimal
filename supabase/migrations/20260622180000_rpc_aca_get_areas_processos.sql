-- ============================================================
-- RPC: aca_get_areas_para_processos
-- Data: 2026-06-22
-- Descrição: Retorna todas as áreas de uma entidade com a
--            contagem de processos seletivos ativos em cada uma.
--            Usada para montar as abas dinâmicas da página
--            /processos.
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
                WHERE ps.data_fim IS NULL
                   OR ps.data_fim >= CURRENT_DATE
            ) AS qtd_processos_ativos
        FROM public.aca_area a
        LEFT JOIN public.aca_processo_seletivo ps
            ON ps.id_area = a.id
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
