-- ============================================================
-- Migration: com_oferta_rpcs
-- Data: 2026-07-03
-- Descrição: RPCs para CRUD da tabela com_oferta
-- ============================================================

-- ============================================================
-- 1. Listar ofertas por produto
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_get_ofertas(
    p_id_entidade UUID,
    p_id_produto UUID DEFAULT NULL,
    p_pagina INTEGER DEFAULT 1,
    p_limite INTEGER DEFAULT 50
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
            o.*,
            pr.nome_produto,
            COUNT(*) OVER() AS total_registros
        FROM public.com_oferta o
        JOIN public.com_produto pr ON pr.id = o.id_produto
        WHERE o.id_entidade = p_id_entidade
          AND (p_id_produto IS NULL OR o.id_produto = p_id_produto)
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
                    'id_entidade', id_entidade,
                    'id_produto', id_produto,
                    'slug', slug,
                    'nome_curto', nome_curto,
                    'valor_centavos', valor_centavos,
                    'tipo_pagamento', tipo_pagamento,
                    'parcelamento_maximo', parcelamento_maximo,
                    'recorrencia_periodo', recorrencia_periodo,
                    'recorrencia_intervalo', recorrencia_intervalo,
                    'disponivel_a_partir_de', disponivel_a_partir_de,
                    'disponivel_ate', disponivel_ate,
                    'visibilidade', visibilidade,
                    'exige_elegibilidade', exige_elegibilidade,
                    'is_ativa', is_ativa,
                    'criado_em', criado_em,
                    'modificado_em', modificado_em,
                    'nome_produto', nome_produto
                )
            ),
            '[]'::jsonb
        )
    ) INTO v_result
    FROM ordenado;

    RETURN v_result;
END;
$$;


-- ============================================================
-- 2. Upsert oferta
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_upsert_oferta(
    p_id UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_produto UUID DEFAULT NULL,
    p_slug TEXT DEFAULT NULL,
    p_nome_curto TEXT DEFAULT NULL,
    p_valor_centavos INT4 DEFAULT 0,
    p_tipo_pagamento TEXT DEFAULT 'unico',
    p_parcelamento_maximo INT2 DEFAULT 1,
    p_recorrencia_periodo TEXT DEFAULT NULL,
    p_recorrencia_intervalo INT2 DEFAULT 1,
    p_disponivel_a_partir_de TIMESTAMPTZ DEFAULT NULL,
    p_disponivel_ate TIMESTAMPTZ DEFAULT NULL,
    p_visibilidade TEXT DEFAULT 'publica',
    p_exige_elegibilidade BOOLEAN DEFAULT false,
    p_is_ativa BOOLEAN DEFAULT true,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id UUID;
    v_slug TEXT;
BEGIN
    IF p_id_entidade IS NULL OR p_id_produto IS NULL THEN
        RAISE EXCEPTION 'Entidade e produto são obrigatórios';
    END IF;

    -- Gerar slug se não informado
    v_slug := COALESCE(NULLIF(trim(p_slug), ''), lower(regexp_replace(COALESCE(p_nome_curto, 'oferta'), '[^a-z0-9]+', '-', 'gi')));

    IF v_slug IS NULL OR v_slug = '' THEN
        RAISE EXCEPTION 'Slug é obrigatório (informe um ou preencha o nome curto)';
    END IF;

    -- Verificar slug único
    IF EXISTS (
        SELECT 1 FROM public.com_oferta
        WHERE id_entidade = p_id_entidade AND slug = v_slug
          AND (p_id IS NULL OR id <> p_id)
    ) THEN
        RAISE EXCEPTION 'Já existe uma oferta com este slug';
    END IF;

    -- Validar tipo_pagamento
    IF p_tipo_pagamento NOT IN ('unico', 'recorrente') THEN
        RAISE EXCEPTION 'Tipo de pagamento inválido';
    END IF;

    -- Validar visibilidade
    IF p_visibilidade NOT IN ('publica', 'oculta') THEN
        RAISE EXCEPTION 'Visibilidade inválida';
    END IF;

    INSERT INTO public.com_oferta (
        id, id_entidade, id_produto, slug, nome_curto,
        valor_centavos, tipo_pagamento, parcelamento_maximo,
        recorrencia_periodo, recorrencia_intervalo,
        disponivel_a_partir_de, disponivel_ate,
        visibilidade, exige_elegibilidade, is_ativa,
        criado_por, modificado_por, modificado_em
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_id_entidade, p_id_produto, v_slug, p_nome_curto,
        p_valor_centavos, p_tipo_pagamento::tipo_pagamento_oferta, p_parcelamento_maximo,
        p_recorrencia_periodo, p_recorrencia_intervalo,
        p_disponivel_a_partir_de, p_disponivel_ate,
        p_visibilidade::tipo_visibilidade, COALESCE(p_exige_elegibilidade, false), COALESCE(p_is_ativa, true),
        p_usuario_id, p_usuario_id, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        id_produto            = COALESCE(p_id_produto, com_oferta.id_produto),
        slug                  = v_slug,
        nome_curto            = COALESCE(p_nome_curto, com_oferta.nome_curto),
        valor_centavos        = COALESCE(p_valor_centavos, com_oferta.valor_centavos),
        tipo_pagamento        = COALESCE(p_tipo_pagamento::tipo_pagamento_oferta, com_oferta.tipo_pagamento),
        parcelamento_maximo   = COALESCE(p_parcelamento_maximo, com_oferta.parcelamento_maximo),
        recorrencia_periodo   = COALESCE(p_recorrencia_periodo, com_oferta.recorrencia_periodo),
        recorrencia_intervalo = COALESCE(p_recorrencia_intervalo, com_oferta.recorrencia_intervalo),
        disponivel_a_partir_de = p_disponivel_a_partir_de,
        disponivel_ate        = p_disponivel_ate,
        visibilidade          = COALESCE(p_visibilidade::tipo_visibilidade, com_oferta.visibilidade),
        exige_elegibilidade   = COALESCE(p_exige_elegibilidade, com_oferta.exige_elegibilidade),
        is_ativa              = COALESCE(p_is_ativa, com_oferta.is_ativa),
        modificado_por        = p_usuario_id,
        modificado_em         = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Já existe uma oferta com este slug';
    WHEN OTHERS THEN
        RAISE;
END;
$$;


-- ============================================================
-- 3. Deletar oferta
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_delete_oferta(
    p_id UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_pedidos_count INTEGER;
BEGIN
    IF p_id IS NULL OR p_id_entidade IS NULL THEN
        RAISE EXCEPTION 'ID da oferta e entidade são obrigatórios';
    END IF;

    SELECT COUNT(*) INTO v_pedidos_count
    FROM public.com_pedido
    WHERE id_oferta = p_id AND id_entidade = p_id_entidade;

    IF v_pedidos_count > 0 THEN
        RAISE EXCEPTION 'Não é possível excluir: existem % pedido(s) vinculados a esta oferta', v_pedidos_count;
    END IF;

    DELETE FROM public.com_oferta
    WHERE id = p_id AND id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oferta não encontrada';
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Oferta excluída com sucesso');
END;
$$;
