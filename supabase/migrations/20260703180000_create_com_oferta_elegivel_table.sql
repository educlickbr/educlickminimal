-- ============================================================
-- Migration: create_com_oferta_elegivel_table
-- Data: 2026-07-03
-- Descrição: Cria tabela de elegíveis para ofertas ocultas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.com_oferta_elegivel (
    id            uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade   uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_oferta     uuid NOT NULL REFERENCES public.com_oferta(id) ON DELETE CASCADE,
    email         text NOT NULL,
    cpf           text,
    utilizado_em  timestamptz,
    expirado_em   timestamptz,

    criado_por    uuid REFERENCES public.user_expandido(id),
    criado_em     timestamptz DEFAULT now(),

    CONSTRAINT com_oferta_elegivel_pkey PRIMARY KEY (id),
    CONSTRAINT com_oferta_elegivel_oferta_email_key UNIQUE (id_oferta, email)
);

ALTER TABLE public.com_oferta_elegivel ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_com_oferta_elegivel_oferta ON public.com_oferta_elegivel (id_oferta);

-- RLS admin
CREATE POLICY "com_policy_all_access_oferta_elegivel"
ON public.com_oferta_elegivel FOR ALL
USING (
    (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
        WHERE e::uuid = com_oferta_elegivel.id_entidade
    )
);

-- RLS: usuário logado vê apenas seus próprios registros (para verificar elegibilidade)
CREATE POLICY "com_policy_select_self_elegivel"
ON public.com_oferta_elegivel FOR SELECT
USING (email = auth.jwt() ->> 'email');
