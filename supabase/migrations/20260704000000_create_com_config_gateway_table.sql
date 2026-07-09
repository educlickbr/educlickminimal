-- ============================================================
-- Migration: create_com_config_gateway_table
-- Data: 2026-07-03
-- Descrição: Tabela de configuração de gateway (Stripe Connect)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.com_config_gateway (
    id                      uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade             uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    gateway_name            text DEFAULT 'stripe' NOT NULL,
    is_sandbox              boolean DEFAULT true NOT NULL,
    stripe_account_id       text,

    criado_por       uuid REFERENCES public.user_expandido(id),
    modificado_por   uuid REFERENCES public.user_expandido(id),
    criado_em        timestamptz DEFAULT now(),
    modificado_em    timestamptz DEFAULT now(),

    CONSTRAINT com_config_gateway_pkey PRIMARY KEY (id),
    CONSTRAINT com_config_gateway_id_entidade_key UNIQUE (id_entidade)
);

ALTER TABLE public.com_config_gateway ENABLE ROW LEVEL SECURITY;

CREATE POLICY "com_policy_all_access_config_gateway"
ON public.com_config_gateway FOR ALL
USING (
    (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
        WHERE e::uuid = com_config_gateway.id_entidade
    )
);
