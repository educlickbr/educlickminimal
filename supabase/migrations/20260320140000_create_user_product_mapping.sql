-- ======================================================
-- 1. Tabela: user_produto (Vínculo Usuário x Produto Context)
-- ======================================================
CREATE TABLE IF NOT EXISTS public.user_produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user_expandido UUID NOT NULL REFERENCES public.user_expandido(id) ON DELETE CASCADE,
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_produto UUID NOT NULL REFERENCES public.produto(id) ON DELETE CASCADE,
    papel_no_produto TEXT, -- ex: 'admin', 'editor', 'leitura'
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garante que o usuário não seja vinculado ao mesmo produto na mesma entidade duas vezes
    CONSTRAINT uq_user_entidade_produto UNIQUE (id_user_expandido, id_entidade, id_produto)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_user_produto_user ON public.user_produto(id_user_expandido);
CREATE INDEX IF NOT EXISTS idx_user_produto_entidade ON public.user_produto(id_entidade);

-- ======================================================
-- 2. Habilitar RLS
-- ======================================================
ALTER TABLE public.user_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê suas próprias permissões de produto" 
ON public.user_produto FOR SELECT 
USING (
    id_user_expandido = (SELECT id FROM public.user_expandido WHERE id_user = auth.uid())
);

-- ======================================================
-- 3. Atualizar RPC de Sessão (Aplicando o filtro de produtos vinculados)
-- ======================================================
CREATE OR REPLACE FUNCTION public.nxt_get_user_session_v1(p_auth_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_data JSONB;
    v_entidades JSONB;
    v_result JSONB;
    v_user_expandido_id UUID;
BEGIN
    -- 1. Buscar Dados do Usuário Expandido
    SELECT jsonb_build_object(
        'id', ue.id,
        'id_user', ue.id_user,
        'email', ue.email,
        'nome_completo', ue.nome_completo,
        'criado_em', ue.criado_em
    ), ue.id INTO v_user_data, v_user_expandido_id
    FROM public.user_expandido ue
    WHERE ue.id_user = p_auth_id
    LIMIT 1;

    IF v_user_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário não encontrado');
    END IF;

    -- 2. Buscar Entidades e seus respectivos Produtos (Filtrando por user_produto)
    -- Lógica: Retorna apenas os produtos onde o usuário tem vínculo explícito em public.user_produto
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', e.id,
            'nome_entidade', e.nome_entidade,
            'tipo', e.tipo,
            'url', e.url,
            'branding', jsonb_build_object(
                'logo_aberto', e.logo_aberto,
                'logo_fechado', e.logo_fechado,
                'cor_principal', e.cor_principal,
                'cor_secundaria', e.cor_secundaria
            ),
            'produtos', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', p.id,
                        'nome', p.nome,
                        'slug', p.slug,
                        'url_acesso', ep.url_acesso,
                        'papel', up.papel_no_produto
                    )
                ), '[]'::jsonb)
                FROM public.entidade_produto ep
                JOIN public.produto p ON p.id = ep.id_produto
                JOIN public.user_produto up ON up.id_produto = p.id AND up.id_entidade = e.id
                WHERE ep.id_entidade = e.id 
                  AND ep.ativo = TRUE 
                  AND up.id_user_expandido = v_user_expandido_id
                  AND up.ativo = TRUE
            )
        )
    ) INTO v_entidades
    FROM public.user_entidade_user ueu
    JOIN public.user_entidades e ON e.id = ueu.id_entidade
    WHERE ueu.id_user = v_user_expandido_id;

    -- 3. Montar Objeto Final
    v_result := jsonb_build_object(
        'success', true,
        'usuario', v_user_data,
        'entidades', COALESCE(v_entidades, '[]'::jsonb)
    );

    RETURN v_result;
END;
$$;
