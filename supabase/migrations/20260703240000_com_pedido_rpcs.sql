-- ============================================================
-- Migration: com_pedido_rpcs
-- Data: 2026-07-03
-- Descrição: RPCs para criar e listar pedidos
-- ============================================================

-- ============================================================
-- 1. Criar pedido (checkout)
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_criar_pedido(
    p_id_entidade UUID,
    p_id_oferta UUID,
    p_id_usuario UUID,
    p_id_inscricao UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_oferta RECORD;
    v_pedido_id UUID;
    v_status tipo_status_pedido := 'pendente';
BEGIN
    IF p_id_entidade IS NULL OR p_id_oferta IS NULL OR p_id_usuario IS NULL THEN
        RAISE EXCEPTION 'Entidade, oferta e usuário são obrigatórios';
    END IF;

    SELECT of.valor_centavos, of.is_ativa, of.disponivel_a_partir_de, of.disponivel_ate
    INTO v_oferta
    FROM public.com_oferta of
    WHERE of.id = p_id_oferta AND of.id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oferta não encontrada';
    END IF;

    IF NOT v_oferta.is_ativa THEN
        RAISE EXCEPTION 'Oferta não está ativa';
    END IF;

    IF v_oferta.disponivel_a_partir_de IS NOT NULL AND v_oferta.disponivel_a_partir_de > NOW() THEN
        RAISE EXCEPTION 'Oferta ainda não disponível';
    END IF;

    IF v_oferta.disponivel_ate IS NOT NULL AND v_oferta.disponivel_ate < NOW() THEN
        RAISE EXCEPTION 'Oferta expirada';
    END IF;

    IF v_oferta.valor_centavos = 0 THEN
        v_status := 'concluido';
    END IF;

    INSERT INTO public.com_pedido (
        id_entidade, id_oferta, id_usuario, id_inscricao,
        status, valor_pago_centavos,
        criado_por, modificado_por, modificado_em
    )
    VALUES (
        p_id_entidade, p_id_oferta, p_id_usuario, p_id_inscricao,
        v_status, v_oferta.valor_centavos,
        COALESCE(p_usuario_id, p_id_usuario),
        COALESCE(p_usuario_id, p_id_usuario),
        NOW()
    )
    RETURNING id INTO v_pedido_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_pedido_id,
        'status', v_status,
        'valor_centavos', v_oferta.valor_centavos
    );
END;
$$;


-- ============================================================
-- 2. Listar pedidos (admin) — paginado com LIMIT no CTE
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_get_pedidos(
    p_id_entidade UUID,
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

            ue.nome || ' ' || ue.sobrenome AS usuario_nome,
            ue.email AS usuario_email
        FROM public.com_pedido pd
        JOIN public.com_oferta of ON of.id = pd.id_oferta
        JOIN public.com_produto pr ON pr.id = of.id_produto
        JOIN public.aca_programa pg ON pg.id = pr.id_programa
        JOIN public.user_expandido ue ON ue.id = pd.id_usuario
        WHERE pd.id_entidade = p_id_entidade
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


-- ============================================================
-- 3. Buscar pedido por ID
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_get_pedido(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'pedido', jsonb_build_object(
            'id', pd.id,
            'id_oferta', pd.id_oferta,
            'id_usuario', pd.id_usuario,
            'id_inscricao', pd.id_inscricao,
            'status', pd.status,
            'valor_pago_centavos', pd.valor_pago_centavos,
            'stripe_checkout_id', pd.stripe_checkout_id,
            'pago_em', pd.pago_em,
            'criado_em', pd.criado_em,

            'slug', of.slug,
            'nome_curto', of.nome_curto,
            'nome_produto', pr.nome_produto,
            'programa_descricao', pg.descricao,
            'usuario_nome', ue.nome || ' ' || ue.sobrenome,
            'usuario_email', ue.email
        )
    ) INTO v_result
    FROM public.com_pedido pd
    JOIN public.com_oferta of ON of.id = pd.id_oferta
    JOIN public.com_produto pr ON pr.id = of.id_produto
    JOIN public.aca_programa pg ON pg.id = pr.id_programa
    JOIN public.user_expandido ue ON ue.id = pd.id_usuario
    WHERE pd.id = p_id AND pd.id_entidade = p_id_entidade;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pedido não encontrado');
    END IF;

    RETURN v_result;
END;
$$;
