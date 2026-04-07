-- ======================================================
-- 1. Refatoração Lean da tabela user_produto
-- ======================================================

-- Remover colunas redundantes
ALTER TABLE public.user_produto DROP COLUMN IF EXISTS id_entidade;
ALTER TABLE public.user_produto DROP COLUMN IF EXISTS id_produto;

-- Adicionar vínculo direto com o contrato da entidade (entidade_produto)
ALTER TABLE public.user_produto 
ADD COLUMN IF NOT EXISTS id_entidade_produto UUID REFERENCES public.entidade_produto(id) ON DELETE CASCADE;

-- Atualizar o índice único para o novo modelo
-- Primeiro removemos o antigo se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_entidade_produto') THEN
        ALTER TABLE public.user_produto DROP CONSTRAINT uq_user_entidade_produto;
    END IF;
END $$;

ALTER TABLE public.user_produto 
ADD CONSTRAINT uq_user_entidade_produto UNIQUE (id_user_expandido, id_entidade_produto);

-- ======================================================
-- 2. Atualização do RPC de Sessão (Lógica simplificada)
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

    -- 2. Buscar Entidades e seus respectivos Produtos (Vinculados via user_produto)
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
                FROM public.user_produto up
                JOIN public.entidade_produto ep ON ep.id = up.id_entidade_produto
                JOIN public.produto p ON p.id = ep.id_produto
                WHERE ep.id_entidade = e.id 
                  AND up.id_user_expandido = v_user_expandido_id
                  AND up.ativo = TRUE
                  AND ep.ativo = TRUE
            )
        )
    ) INTO v_entidades
    FROM public.user_entidade_user ueu
    JOIN public.user_entidades e ON e.id = ueu.id_entidade
    WHERE ueu.id_user = v_user_expandido_id;

    RETURN jsonb_build_object(
        'success', true,
        'usuario', v_user_data,
        'entidades', COALESCE(v_entidades, '[]'::jsonb)
    );
END;
$$;

-- ======================================================
-- 3. Setup Inicial / Data Migration
-- ======================================================
DO $$
DECLARE
    v_id_ent_prod UUID;
    v_user_id UUID := 'fd6dbef4-211f-42dc-aba3-3bcc57e3363e'; -- Martin
    v_ent_id UUID := '00ca60ea-6667-482d-8a96-09b877707b08'; -- educlick_modelo
    v_prod_id UUID;
BEGIN
    -- Obter o ID do produto acadêmico
    SELECT id INTO v_prod_id FROM public.produto WHERE slug = 'academico';

    IF v_prod_id IS NOT NULL THEN
        -- Garantir que a entidade tem o produto
        INSERT INTO public.entidade_produto (id_entidade, id_produto, ativo)
        VALUES (v_ent_id, v_prod_id, true)
        ON CONFLICT (id_entidade, id_produto) DO UPDATE SET ativo = true
        RETURNING id INTO v_id_ent_prod;

        -- Vincular o usuário a este contrato (user_produto agora usa id_entidade_produto)
        -- Primeiro removemos registros antigos que possam atrapalhar a migração manual
        DELETE FROM public.user_produto WHERE id_user_expandido = v_user_id;
        
        INSERT INTO public.user_produto (id_user_expandido, id_entidade_produto, papel_no_produto)
        VALUES (v_user_id, v_id_ent_prod, 'admin')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
