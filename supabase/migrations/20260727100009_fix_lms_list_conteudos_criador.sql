-- ============================================================
-- RPC: lms_list_conteudos com nome do criador
-- Data: 2026-07-27
-- ============================================================

DROP FUNCTION IF EXISTS public.lms_list_conteudos(p_id_entidade uuid, p_pagina integer, p_limite integer, p_busca text, p_tipo text, p_criado_por uuid);

CREATE OR REPLACE FUNCTION public.lms_list_conteudos(
    p_id_entidade UUID,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20,
    p_busca TEXT DEFAULT NULL,
    p_tipo TEXT DEFAULT NULL,
    p_criado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset INTEGER := (p_pagina - 1) * p_limite;
    v_result JSONB;
BEGIN
    WITH base AS (
        SELECT
            c.*,
            ux.nome || ' ' || ux.sobrenome AS criado_por_nome,
            COUNT(*) OVER() AS total_registros,
            COALESCE(
                (
                    SELECT jsonb_agg(jsonb_build_object('id', b.id, 'titulo', b.titulo))
                    FROM public.lms_conteudo_bloco cb
                    JOIN public.lms_bloco b ON b.id = cb.id_bloco
                    WHERE cb.id_conteudo = c.id
                ),
                '[]'::jsonb
            ) AS blocos
        FROM public.lms_conteudo c
        LEFT JOIN public.user_expandido ux ON ux.id = c.criado_por
        WHERE c.id_entidade = p_id_entidade
          AND (p_busca IS NULL OR unaccent(c.titulo) ILIKE unaccent('%' || p_busca || '%'))
          AND (p_tipo IS NULL OR c.tipo::text = p_tipo)
          AND (p_criado_por IS NULL OR c.criado_por = p_criado_por)
    ),
    ordenado AS (
        SELECT * FROM base
        ORDER BY criado_em DESC
        LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'pagina_atual', p_pagina,
        'qtd_total', COALESCE(MAX(total_registros), 0),
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'tipo', tipo,
                    'titulo', titulo,
                    'descricao', descricao,
                    'ordem', ordem,
                    'id_arquivo', id_arquivo,
                    'url', url,
                    'ativo', ativo,
                    'blocos', blocos,
                    'criado_por', criado_por,
                    'criado_por_nome', criado_por_nome,
                    'criado_em', criado_em
                ) ORDER BY criado_em DESC
            ), '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;
