-- ============================================================
-- Fix: com_get_pedidos — adiciona filtro por id_usuario
-- e corrige nome_completo
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_get_pedidos(
    p_id_entidade UUID,
    p_id_usuario UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset INTEGER := (p_pagina - 1) * p_limite;
    v_result JSONB;
    v_total INTEGER;
BEGIN
    -- Total de registros (sem paginação)
    SELECT COUNT(*) INTO v_total
    FROM public.com_pedido pd
    WHERE pd.id_entidade = p_id_entidade
      AND (p_id_usuario IS NULL OR pd.id_usuario = p_id_usuario)
      AND (p_status IS NULL OR pd.status::text = p_status);

    -- Itens paginados
    WITH base AS (
        SELECT
            pd.id,
            pd.id_oferta,
            pd.id_usuario,
            pd.id_inscricao,
            pd.status,
            pd.valor_pago_centavos,
            pd.pago_em,
            pd.criado_em,

            of.slug,
            of.nome_curto,
            pr.nome_produto,
            pg.descricao AS programa_descricao,

            ue.nome_completo AS usuario_nome,
            ue.email AS usuario_email
        FROM public.com_pedido pd
        JOIN public.com_oferta of ON of.id = pd.id_oferta
        JOIN public.com_produto pr ON pr.id = of.id_produto
        JOIN public.aca_programa pg ON pg.id = pr.id_programa
        JOIN public.user_expandido ue ON ue.id = pd.id_usuario
        WHERE pd.id_entidade = p_id_entidade
          AND (p_id_usuario IS NULL OR pd.id_usuario = p_id_usuario)
          AND (p_status IS NULL OR pd.status::text = p_status)
        ORDER BY pd.criado_em DESC
        LIMIT p_limite OFFSET v_offset
    )
    SELECT jsonb_build_object(
        'pagina_atual', p_pagina,
        'qtd_total', v_total,
        'itens', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'id_oferta', id_oferta,
                    'id_usuario', id_usuario,
                    'id_inscricao', id_inscricao,
                    'status', status,
                    'valor_pago_centavos', valor_pago_centavos,
                    'pago_em', pago_em,
                    'criado_em', criado_em,
                    'slug', slug,
                    'nome_curto', nome_curto,
                    'nome_produto', nome_produto,
                    'programa_descricao', programa_descricao,
                    'usuario_nome', usuario_nome,
                    'usuario_email', usuario_email
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM base;

    RETURN v_result;
END;
$$;
