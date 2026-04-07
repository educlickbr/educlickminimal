-- ======================================================
-- 1. Tabela de Produtos (Global Catalog)
-- ======================================================
CREATE TABLE IF NOT EXISTS public.produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================
-- 2. Tabela de Ligação Entidade x Produto (Multi-tenant context)
-- ======================================================
CREATE TABLE IF NOT EXISTS public.entidade_produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_produto UUID NOT NULL REFERENCES public.produto(id) ON DELETE CASCADE,
    url_acesso TEXT UNIQUE, -- A URL decide o contexto (Entidade + Produto)
    configuracoes JSONB DEFAULT '{}'::jsonb,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garante que uma entidade não tenha o mesmo produto duplicado
    CONSTRAINT uq_entidade_produto UNIQUE (id_entidade, id_produto)
);

-- Indices para performance de busca por URL
CREATE INDEX IF NOT EXISTS idx_entidade_produto_url ON public.entidade_produto(url_acesso);

-- ======================================================
-- 3. Inserção de Produtos Iniciais
-- ======================================================
INSERT INTO public.produto (nome, slug, descricao) 
VALUES 
    ('Educlick Acadêmico', 'academico', 'Sistema de gestão acadêmica, diários e notas.'),
    ('Controle Financeiro', 'financeiro', 'Gestão de contas, lançamentos e fluxo de caixa.')
ON CONFLICT (slug) DO NOTHING;

-- ======================================================
-- 4. Habilitar RLS
-- ======================================================
ALTER TABLE public.produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidade_produto ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Pode ser ajustado conforme a necessidade)
CREATE POLICY "Produtos são visíveis para todos os autenticados" 
ON public.produto FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Entidade_Produto é visível para membros da entidade" 
ON public.entidade_produto FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_entidade_user ueu 
        WHERE ueu.id_entidade = public.entidade_produto.id_entidade 
        AND ueu.id_user = (SELECT id FROM public.user_expandido WHERE id_user = auth.uid())
    )
);

-- ======================================================
-- 5. RPC: Buscar Contexto por URL
-- ======================================================
CREATE OR REPLACE FUNCTION public.aca_get_contexto_por_url(p_url TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id_entidade', ep.id_entidade,
        'id_produto', ep.id_produto,
        'slug_produto', p.slug,
        'nome_produto', p.nome,
        'nome_entidade', e.nome_entidade,
        'configuracoes', ep.configuracoes,
        'branding', jsonb_build_object(
            'logo_aberto', e.logo_aberto,
            'logo_fechado', e.logo_fechado,
            'cor_principal', e.cor_principal,
            'cor_principal_hover', e.cor_principal_hover,
            'cor_secundaria', e.cor_secundaria,
            'cor_secundaria_hover', e.cor_secundaria_hover
        )
    ) INTO v_result
    FROM public.entidade_produto ep
    JOIN public.produto p ON p.id = ep.id_produto
    JOIN public.user_entidades e ON e.id = ep.id_entidade
    WHERE ep.url_acesso = p_url OR e.url = p_url
    LIMIT 1;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Contexto não encontrado para esta URL');
    END IF;

    RETURN v_result;
END;
$$;
