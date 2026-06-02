-- ============================================================
-- RPC: aca_get_modulos_paginado  (FIX carga_horaria calculada)
-- Data: 2026-04-22
-- Descrição: A carga_horaria do módulo é agora CALCULADA como
--   a soma das cargas dos componentes em aca_modulo_componente.
--   A coluna aca_modulo.carga_horaria não é mais a fonte verdade.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_modulos_paginado(
    p_id_entidade uuid,
    p_pagina      integer DEFAULT 1,
    p_limite      integer DEFAULT 20,
    p_busca       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset integer := (p_pagina - 1) * p_limite;
    v_result jsonb;
BEGIN
    WITH base AS (
        SELECT
            m.id,
            m.nome_modulo,
            m.descricao,
            m.criado_em,
            m.id_entidade,
            -- carga calculada dinamicamente via componentes
            COALESCE((
                SELECT SUM(mc.carga_horaria)
                FROM public.aca_modulo_componente mc
                WHERE mc.id_modulo = m.id
            ), 0) AS carga_horaria,
            (SELECT COUNT(*) FROM public.aca_plano_de_aula   WHERE id_modulo = m.id) AS qtd_planos,
            (SELECT COUNT(*) FROM public.aca_modulo_componente WHERE id_modulo = m.id) AS qtd_componentes,
            COUNT(*) OVER() AS total_registros
        FROM public.aca_modulo m
        WHERE m.id_entidade = p_id_entidade
          AND (
              p_busca IS NULL
              OR unaccent(m.nome_modulo) ILIKE unaccent('%' || p_busca || '%')
              OR unaccent(m.descricao)   ILIKE unaccent('%' || p_busca || '%')
          )
    ),
    ordenado AS (
        SELECT * FROM base
        ORDER BY nome_modulo ASC
        LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'pagina_atual', p_pagina,
        'qtd_total',    COALESCE(MAX(total_registros), 0),
        'itens',        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id',               id,
                    'nome_modulo',      nome_modulo,
                    'descricao',        descricao,
                    'carga_horaria',    carga_horaria,
                    'qtd_componentes',  qtd_componentes,
                    'qtd_planos',       qtd_planos,
                    'criado_em',        criado_em
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
