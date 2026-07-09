-- ============================================================
-- Migration: create_com_pedido_table
-- Data: 2026-07-03
-- Descrição: Cria tabela de pedidos (transações comerciais)
-- ============================================================

-- ============================================================
-- 1. Tipo enum para status do pedido
-- ============================================================
DO $$ BEGIN
    CREATE TYPE public.tipo_status_pedido AS ENUM ('pendente', 'concluido', 'cancelado', 'reembolsado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. Tabela com_pedido
-- ============================================================
CREATE TABLE IF NOT EXISTS public.com_pedido (
    id                       uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade              uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_oferta                uuid NOT NULL REFERENCES public.com_oferta(id) ON DELETE CASCADE,
    id_usuario               uuid NOT NULL REFERENCES public.user_expandido(id),
    id_inscricao             uuid REFERENCES public.aca_processo_seletivo_inscricoes(id),

    status                   tipo_status_pedido DEFAULT 'pendente' NOT NULL,
    valor_pago_centavos      int4 NOT NULL DEFAULT 0,

    stripe_checkout_id       text,
    stripe_payment_intent_id text,

    pago_em                  timestamptz,
    cancelado_em             timestamptz,

    criado_por       uuid REFERENCES public.user_expandido(id),
    modificado_por   uuid REFERENCES public.user_expandido(id),
    criado_em        timestamptz DEFAULT now(),
    modificado_em    timestamptz DEFAULT now(),

    CONSTRAINT com_pedido_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.com_pedido IS 'Pedidos/transacoes comerciais. So existe quando ha pagamento envolvido.';

-- ============================================================
-- 3. Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_com_pedido_usuario ON public.com_pedido (id_usuario);
CREATE INDEX IF NOT EXISTS idx_com_pedido_oferta  ON public.com_pedido (id_oferta);
CREATE INDEX IF NOT EXISTS idx_com_pedido_status   ON public.com_pedido (status);

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE public.com_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "com_policy_all_access_pedido"
ON public.com_pedido FOR ALL
USING (
    (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
        WHERE e::uuid = com_pedido.id_entidade
    )
);

CREATE POLICY "com_policy_select_self_pedido"
ON public.com_pedido FOR SELECT
USING (
    id_usuario = (SELECT id FROM public.user_expandido WHERE id_user = auth.uid())
);
