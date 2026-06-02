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
    
    v_inicio_semana DATE := date_trunc('week', p_data_ref)::DATE;
    v_fim_semana DATE := (v_inicio_semana + interval '6 days')::DATE;
    
    v_inicio_semana_passada DATE := date_trunc('week', p_data_ref - interval '1 week')::DATE;
    v_fim_semana_passada DATE := (v_inicio_semana_passada + interval '6 days')::DATE;
    
    v_heatmap JSON;
    v_semana_atual_gasto NUMERIC(15,2);
    v_semana_passada_gasto NUMERIC(15,2);
    v_sazonalidade JSON;
    v_gasto_mes_atual NUMERIC(15,2);
BEGIN
    -- 1. Heatmap
    -- Fica estático em relação ao mês.
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

    -- 2. Comparativo Semanal
    -- Fixo pela semana inteira, independente do dia clicado dentro da semana
    SELECT COALESCE(SUM(valor), 0) INTO v_semana_atual_gasto
    FROM public.fin_lancamentos
    WHERE id_entidade = p_id_entidade
      AND tipo = 'despesa'
      AND data >= v_inicio_semana AND data <= v_fim_semana;

    SELECT COALESCE(SUM(valor), 0) INTO v_semana_passada_gasto
    FROM public.fin_lancamentos
    WHERE id_entidade = p_id_entidade
      AND tipo = 'despesa'
      AND data >= v_inicio_semana_passada AND data <= v_fim_semana_passada;

    -- 3. Sazonalidade Semanal
    -- A Média de cada dia da semana nos últimos 90 dias relativos ao FIM DO MÊS.
    -- Dessa forma não muda ao clicar em dias diferentes do mesmo mês.
    SELECT json_object_agg(
        dia_semana, COALESCE(media_gasto, 0)
    ) INTO v_sazonalidade
    FROM (
        SELECT 
            EXTRACT(ISODOW FROM d) AS dia_semana,
            ROUND(AVG(COALESCE(agg.gasto_diario, 0)), 2) AS media_gasto
        FROM generate_series((v_fim_mes - interval '89 days')::DATE, v_fim_mes::DATE, interval '1 day') d
        LEFT JOIN (
            SELECT data, SUM(valor) AS gasto_diario
            FROM public.fin_lancamentos
            WHERE id_entidade = p_id_entidade
              AND tipo = 'despesa'
              AND data >= (v_fim_mes - interval '89 days')::DATE
              AND data <= v_fim_mes
            GROUP BY data
        ) agg ON agg.data = d::DATE
        GROUP BY EXTRACT(ISODOW FROM d)
    ) final_agg;

    -- 4. Resumo do Mês para Projeção (Esse SIM é influenciado pelo dia clicado)
    SELECT COALESCE(SUM(valor), 0) INTO v_gasto_mes_atual
    FROM public.fin_lancamentos
    WHERE id_entidade = p_id_entidade
      AND tipo = 'despesa'
      AND data >= v_inicio_mes AND data <= p_data_ref;

    -- Montagem do Resultado
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
