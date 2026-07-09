-- ============================================================
-- Migration: fix_ofertas_publicas_again
-- Data: 2026-07-03
-- Descrição: Drop e recria com_get_ofertas_publicas com alias correto
-- ============================================================

DROP FUNCTION IF EXISTS public.com_get_ofertas_publicas;

CREATE OR REPLACE FUNCTION public.com_get_ofertas_publicas(
    p_id_entidade UUID,
    p_id_area UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH ofertas_base AS (
        SELECT
            of.id AS oferta_id,
            of.slug,
            of.nome_curto,
            of.valor_centavos,
            of.tipo_pagamento,
            of.parcelamento_maximo,
            of.recorrencia_periodo,
            of.recorrencia_intervalo,
            of.visibilidade,
            of.exige_elegibilidade,
            of.disponivel_a_partir_de,
            of.disponivel_ate,

            pr.id AS produto_id,
            pr.nome_produto,

            pg.id AS programa_id,
            pg.descricao AS programa_descricao,
            pg.gratuito,
            pg.exige_processo_seletivo,

            c.nome_curso,
            a.id AS area_id,
            a.nome_area,

            (SELECT jsonb_build_object(
                'id', ps.id,
                'nome_processo', ps.nome_processo,
                'data_inicio', ps.data_inicio,
                'data_fim', ps.data_fim
             )
             FROM public.aca_processo_seletivo ps
             WHERE ps.id_programa = pg.id
               AND ps.data_fim >= NOW()
             ORDER BY ps.data_inicio
             LIMIT 1
            ) AS processo_seletivo

        FROM public.com_oferta of
        JOIN public.com_produto pr ON pr.id = of.id_produto
        JOIN public.aca_programa pg ON pg.id = pr.id_programa
        LEFT JOIN public.aca_curso c ON c.id = pg.id_curso
        LEFT JOIN public.aca_area a ON a.id = pg.id_area
        WHERE of.id_entidade = p_id_entidade
          AND of.is_ativa = true
          AND of.visibilidade = 'publica'
          AND (of.disponivel_a_partir_de IS NULL OR of.disponivel_a_partir_de <= NOW())
          AND (of.disponivel_ate IS NULL OR of.disponivel_ate >= NOW())
          AND (p_id_area IS NULL OR pg.id_area = p_id_area)
    )
    SELECT jsonb_build_object(
        'success', true,
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', oferta_id,
                    'slug', slug,
                    'nome_curto', nome_curto,
                    'valor_centavos', valor_centavos,
                    'tipo_pagamento', tipo_pagamento,
                    'parcelamento_maximo', parcelamento_maximo,
                    'recorrencia_periodo', recorrencia_periodo,
                    'recorrencia_intervalo', recorrencia_intervalo,
                    'disponivel_ate', disponivel_ate,

                    'produto_id', produto_id,
                    'nome_produto', nome_produto,

                    'programa_id', programa_id,
                    'programa_descricao', programa_descricao,
                    'gratuito', gratuito,
                    'exige_processo_seletivo', exige_processo_seletivo,
                    'nome_curso', nome_curso,
                    'area_id', area_id,
                    'nome_area', nome_area,
                    'processo_seletivo', processo_seletivo
                )
                ORDER BY nome_curso, programa_descricao
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ofertas_base;

    RETURN v_result;
END;
$$;
