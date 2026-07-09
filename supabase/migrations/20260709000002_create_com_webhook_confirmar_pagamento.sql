-- ============================================================
-- RPC: com_webhook_confirmar_pagamento
-- Chamado pelo webhook Stripe (sem sessão de usuário).
-- SECURITY DEFINER para bypassar RLS.
-- Atualiza pedido para concluido e cria matrícula.
-- ============================================================
CREATE OR REPLACE FUNCTION public.com_webhook_confirmar_pagamento(
    p_pedido_id UUID,
    p_stripe_payment_intent_id TEXT,
    p_id_programa UUID DEFAULT NULL,
    p_id_entidade UUID DEFAULT NULL,
    p_id_usuario UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated INTEGER;
    v_matricula_id UUID;
BEGIN
    -- 1. Atualizar pedido
    UPDATE public.com_pedido
    SET
        status = 'concluido',
        stripe_payment_intent_id = p_stripe_payment_intent_id,
        pago_em = NOW(),
        modificado_em = NOW()
    WHERE id = p_pedido_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    -- 2. Criar matrícula (se tiver dados do programa)
    IF p_id_programa IS NOT NULL AND p_id_entidade IS NOT NULL AND p_id_usuario IS NOT NULL THEN
        -- Evita duplicata
        INSERT INTO public.aca_matricula (
            id_entidade, id_programa, id_usuario, id_pedido,
            criado_por, modificado_por, criado_em, modificado_em
        )
        VALUES (
            p_id_entidade, p_id_programa, p_id_usuario, p_pedido_id,
            p_id_usuario, p_id_usuario, NOW(), NOW()
        )
        ON CONFLICT (id_programa, id_usuario) DO UPDATE SET
            id_pedido = p_pedido_id,
            modificado_em = NOW()
        RETURNING id INTO v_matricula_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'pedido_atualizado', v_updated > 0,
        'matricula_id', v_matricula_id
    );
END;
$$;
