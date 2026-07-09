-- ============================================================
-- Migration: create_com_produto_table
-- Data: 2026-07-03
-- Descrição: Cria a tabela com_produto e suas políticas de RLS
-- ============================================================

-- ============================================================
-- 1. Criar tabela com_produto
-- ============================================================
CREATE TABLE IF NOT EXISTS public.com_produto (
    id               uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade      uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_programa      uuid NOT NULL REFERENCES public.aca_programa(id) ON DELETE CASCADE,
    nome_produto     text NOT NULL,
    descricao        text,
    tipo_recorrencia text NOT NULL DEFAULT 'unico',
    is_ativo         boolean DEFAULT true NOT NULL,

    -- Auditoria
    criado_por       uuid REFERENCES public.user_expandido(id),
    modificado_por   uuid REFERENCES public.user_expandido(id),
    criado_em        timestamptz DEFAULT now(),
    modificado_em    timestamptz DEFAULT now(),

    CONSTRAINT com_produto_pkey PRIMARY KEY (id),
    CONSTRAINT com_produto_unique_nome UNIQUE (id_entidade, id_programa, nome_produto)
);

COMMENT ON TABLE public.com_produto IS 'Produtos comerciais vinculados a programas acadêmicos';
COMMENT ON COLUMN public.com_produto.tipo_recorrencia IS 'unico | recorrente';

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE public.com_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "com_policy_all_access_produto"
ON public.com_produto FOR ALL
USING (
    (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
        WHERE e::uuid = com_produto.id_entidade
    )
);
