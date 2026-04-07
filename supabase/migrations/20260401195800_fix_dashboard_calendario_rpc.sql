CREATE OR REPLACE FUNCTION public.fin_get_dashboard_calendario(
    p_id_entidade UUID,
    p_data_ref DATE
)
RETURNS JSON
SECURITY INVOKER
LANGUAGE plpgsql
AS $$
DECLARE
    v_inicio_mes DATE := date_trunc('month', p_data_ref)::DATE;
    v_fim_mes DATE := (date_trunc('month', p_data_ref) + interval '1 month' - interval '1 day')::DATE;
    
    v_inicio_semana DATE := date_trunc('week', CURRENT_DATE)::DATE;
    v_inicio_semana_passada DATE := date_trunc('week', CURRENT_DATE - interval '1 week')::DATE;
    
    v_heatmap JSON;
    v_semana_atual_gasto NUMERIC(15,2);
    v_semana_passada_gasto NUMERIC(15,2);
    v_sazonalidade JSON;
    v_gasto_mes_atual NUMERIC(15,2);
BEGIN
    -- 1. Heatmap (Agrupado por Dia no mês de p_data_ref preenchendo 100% dos dias)
    SELECT json_agg(
        json_build_object(
            'dia', to_char(d, 'YYYY-MM-DD'),
            'receita', COALESCE(agg.receita, 0),
            'despesa', COALESCE(agg.despesa, 0)
        )
    ) INTO v_heatmap
    FROM generate_series(v_inicio_mes, v_fim_mes, interval '1 day') d
    LEFT JOIN (
        SELECT 
            data,
            SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) AS receita,
            SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) AS despesa
        FROM public.fin_lancamentos
        WHERE id_entidade = p_id_entidade
          AND data >= v_inicio_mes AND data <= v_fim_mes
        GROUP BY data
    ) agg ON agg.data = d::DATE;

    -- 2. Comparativo Semanal (Usando o CURRENT_DATE como ancoragem natural)
    SELECT COALESCE(SUM(valor), 0) INTO v_semana_atual_gasto
    FROM public.fin_lancamentos
    WHERE id_entidade = p_id_entidade
      AND tipo = 'despesa'
      AND data >= v_inicio_semana AND data <= CURRENT_DATE;

    SELECT COALESCE(SUM(valor), 0) INTO v_semana_passada_gasto
    FROM public.fin_lancamentos
    WHERE id_entidade = p_id_entidade
      AND tipo = 'despesa'
      AND data >= v_inicio_semana_passada AND data <= (CURRENT_DATE - interval '1 week')::DATE;

    -- 3. Sazonalidade Semanal (A Média de cada dia da semana nos últimos 90 dias)
    -- ISODOW: 1 = Segunda, 7 = Domingo
    SELECT json_object_agg(
        dia_semana, COALESCE(media_gasto, 0)
    ) INTO v_sazonalidade
    FROM (
        SELECT 
            EXTRACT(ISODOW FROM data) AS dia_semana,
            ROUND(AVG(gasto_diario), 2) AS media_gasto
        FROM (
            SELECT data, COALESCE(SUM(valor), 0) AS gasto_diario
            FROM public.fin_lancamentos
            WHERE id_entidade = p_id_entidade
              AND tipo = 'despesa'
              AND data >= (CURRENT_DATE - interval '90 days')::DATE
              AND data <= CURRENT_DATE
            GROUP BY data
        ) sub
        GROUP BY EXTRACT(ISODOW FROM data)
    ) final_agg;

    -- 4. Resumo do Mês
    SELECT COALESCE(SUM(valor), 0) INTO v_gasto_mes_atual
    FROM public.fin_lancamentos
    WHERE id_entidade = p_id_entidade
      AND tipo = 'despesa'
      AND data >= date_trunc('month', CURRENT_DATE)::DATE AND data <= CURRENT_DATE;

    -- Montagem Segura e Estruturada do Resultado
    RETURN json_build_object(
        'heatmap', COALESCE(v_heatmap, '[]'::json),
        'comparativo_semanal', json_build_object(
            'semana_atual', COALESCE(v_semana_atual_gasto, 0),
            'semana_passada', COALESCE(v_semana_passada_gasto, 0)
        ),
        'sazonalidade', COALESCE(v_sazonalidade, '{}'::json),
        'resumo_mes', json_build_object(
            'gasto_mes_atual', COALESCE(v_gasto_mes_atual, 0)
        )
    );
END;
$$;
