-- Nova migration para corrigir a RPC fin_get_dashboard_categorias sem a coluna 'cor' que não existe.
CREATE OR REPLACE FUNCTION public.fin_get_dashboard_categorias(
    p_id_entidade UUID,
    p_data_ref DATE,
    p_id_categoria UUID DEFAULT NULL
)
RETURNS JSON
SECURITY INVOKER
LANGUAGE plpgsql
AS $$
DECLARE
    v_inicio_mes DATE := date_trunc('month', p_data_ref)::DATE;
    v_fim_mes DATE := (date_trunc('month', p_data_ref) + interval '1 month' - interval '1 day')::DATE;
    v_inicio_6m DATE := (date_trunc('month', p_data_ref) - interval '5 months')::DATE;

    v_top3 JSON;
    v_pareto JSON;
    v_matriz JSON;
BEGIN
    -- 1. TOP 3 (ou filtro único) vs Média Histórica de Despesas
    WITH categorias_mes AS (
        SELECT id_categoria, SUM(valor) as total_mes
        FROM public.fin_lancamentos
        WHERE id_entidade = p_id_entidade
          AND tipo = 'despesa'
          AND data >= v_inicio_mes AND data <= v_fim_mes
          AND (p_id_categoria IS NULL OR id_categoria = p_id_categoria)
        GROUP BY id_categoria
        ORDER BY total_mes DESC
        LIMIT 3
    ),
    historico AS (
        SELECT l.id_categoria, DATE_TRUNC('month', l.data) as mes, SUM(l.valor) as total
        FROM public.fin_lancamentos l
        JOIN categorias_mes c ON c.id_categoria = l.id_categoria
        WHERE l.id_entidade = p_id_entidade
          AND l.data >= v_inicio_6m AND l.data < v_inicio_mes
          AND l.tipo = 'despesa'
        GROUP BY l.id_categoria, DATE_TRUNC('month', l.data)
    ),
    medias AS (
        SELECT id_categoria, AVG(total) as media_6m
        FROM historico
        GROUP BY id_categoria
    )
    SELECT COALESCE(json_agg(
        json_build_object(
            'id_categoria', cm.id_categoria,
            'nome', cat.nome,
            'icone', cat.icone,
            'total_mes', cm.total_mes,
            'media_6m', ROUND(COALESCE(md.media_6m, 0), 2),
            'variacao_pct', CASE 
                WHEN COALESCE(md.media_6m, 0) > 0 THEN ROUND(((cm.total_mes / md.media_6m) - 1) * 100, 2)
                WHEN cm.total_mes > 0 THEN 100.00
                ELSE 0 
            END
        )
    ), '[]'::json) INTO v_top3
    FROM categorias_mes cm
    JOIN public.fin_categorias cat ON cat.id = cm.id_categoria
    LEFT JOIN medias md ON md.id_categoria = cm.id_categoria;

    -- 2. Pareto (Listagem de Gastos ordenados com representatividade no mês total)
    WITH totais AS (
        SELECT id_categoria, SUM(valor) as gasto
        FROM public.fin_lancamentos
        WHERE id_entidade = p_id_entidade
          AND tipo = 'despesa'
          AND data >= v_inicio_mes AND data <= v_fim_mes
        GROUP BY id_categoria
    ),
    total_geral AS (
        SELECT SUM(gasto) as tg FROM totais
    )
    SELECT COALESCE(json_agg(
        json_build_object(
            'id_categoria', t.id_categoria,
            'nome', cat.nome,
            'gasto', t.gasto,
            'percentual', ROUND((t.gasto / NULLIF(tg.tg, 0)) * 100, 2)
        ) ORDER BY t.gasto DESC
    ), '[]'::json) INTO v_pareto
    FROM totais t
    JOIN public.fin_categorias cat ON cat.id = t.id_categoria
    CROSS JOIN total_geral tg;

    -- 3. Matriz Gasto Formiga (Frequência vs Valor)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id_categoria', t.id_categoria,
            'nome', cat.nome,
            'gasto_total', t.gasto_total,
            'quantidade', t.quantidade,
            'ticket_medio', ROUND(t.gasto_total / t.quantidade, 2)
        ) ORDER BY t.quantidade DESC
    ), '[]'::json) INTO v_matriz
    FROM (
        SELECT id_categoria, SUM(valor) as gasto_total, COUNT(id) as quantidade
        FROM public.fin_lancamentos
        WHERE id_entidade = p_id_entidade
          AND tipo = 'despesa'
          AND data >= v_inicio_mes AND data <= v_fim_mes
        GROUP BY id_categoria
    ) t
    JOIN public.fin_categorias cat ON cat.id = t.id_categoria;

    -- Retorno Master JSON
    RETURN json_build_object(
        'top3', v_top3,
        'pareto', v_pareto,
        'matriz', v_matriz
    );
END;
$$;
