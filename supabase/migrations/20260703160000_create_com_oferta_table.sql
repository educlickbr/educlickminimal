-- ============================================================
-- Migration: create_com_oferta_table
-- Data: 2026-07-03
-- Descrição: Cria a tabela com_oferta, tipos enumerados e RLS
-- ============================================================

-- ============================================================
-- 1. Tipos enumerados
-- ============================================================
DO $$ BEGIN
    CREATE TYPE public.tipo_visibilidade AS ENUM ('publica', 'oculta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_pagamento_oferta AS ENUM ('unico', 'recorrente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. Tabela com_oferta
-- ============================================================
CREATE TABLE IF NOT EXISTS public.com_oferta (
    id                    uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade           uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_produto            uuid NOT NULL REFERENCES public.com_produto(id) ON DELETE CASCADE,
    slug                  text NOT NULL,
    nome_curto            text,

    -- Preço
    valor_centavos        int4 DEFAULT 0 NOT NULL,

    -- Config de pagamento
    tipo_pagamento        tipo_pagamento_oferta DEFAULT 'unico' NOT NULL,
    parcelamento_maximo   int2 DEFAULT 1 NOT NULL,
    recorrencia_periodo   text,
    recorrencia_intervalo int2 DEFAULT 1,

    -- Vigência
    disponivel_a_partir_de timestamptz,
    disponivel_ate         timestamptz,

    -- Controle de acesso
    visibilidade           tipo_visibilidade DEFAULT 'publica' NOT NULL,
    exige_elegibilidade    boolean DEFAULT false NOT NULL,
    is_ativa               boolean DEFAULT true NOT NULL,

    -- Auditoria
    criado_por       uuid REFERENCES public.user_expandido(id),
    modificado_por   uuid REFERENCES public.user_expandido(id),
    criado_em        timestamptz DEFAULT now(),
    modificado_em    timestamptz DEFAULT now(),

    CONSTRAINT com_oferta_pkey PRIMARY KEY (id),
    CONSTRAINT com_oferta_slug_entidade_key UNIQUE (id_entidade, slug)
);

COMMENT ON TABLE public.com_oferta IS 'Ofertas comerciais de produtos (precificação, vigência, visibilidade)';

-- ============================================================
-- 3. Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_com_oferta_produto ON public.com_oferta (id_produto);
CREATE INDEX IF NOT EXISTS idx_com_oferta_vitrine
ON public.com_oferta (id_entidade, is_ativa, visibilidade, disponivel_a_partir_de, disponivel_ate);

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE public.com_oferta ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "com_policy_all_access_oferta"
    ON public.com_oferta FOR ALL
    USING (
        (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
        AND EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
            WHERE e::uuid = com_oferta.id_entidade
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "com_policy_select_public_oferta"
    ON public.com_oferta FOR SELECT
    USING (
        visibilidade = 'publica'
        AND is_ativa = true
        AND (disponivel_a_partir_de IS NULL OR disponivel_a_partir_de <= now())
        AND (disponivel_ate IS NULL OR disponivel_ate >= now())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
