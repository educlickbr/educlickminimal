-- ======================================================
-- FASE F — Multi-produto: gate de acesso por produto
-- Fonte: documentacao/planos/plano-multientidade-permissoes.md
--        documentacao/arquitetura/permissoes.md (§4.1)
--
-- Decisão 2026-08-21:
--   - Acesso a um produto = licença da ENTIDADE em entidade_produto
--   - Gate no /api/me: entidade tem o produto do domínio? senão sem_acesso
--   - user_produto vira redundante (papel agora é por entidade) -> DROP
--   - nxt_get_user_session_v1 passa a montar produtos[] via entidade_produto
-- ======================================================

-- ======================================================
-- 1. app_resolver_entidade_por_dominio (recria) — agora traz produtos[]
--    Resolve host -> entidade + lista de produtos contratados (entidade_produto).
-- ======================================================
CREATE OR REPLACE FUNCTION public.app_resolver_entidade_por_dominio(p_dominio TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', e.id,
        'nome', e.nome_entidade,
        'tipo', e.tipo,
        'url', e.url,
        'dominios', COALESCE(e.dominios, '[]'::jsonb),
        'rota_inicial', COALESCE(e.rota_inicial, '/'),
        'branding', jsonb_build_object(
            'logo_aberto', e.logo_aberto,
            'logo_fechado', e.logo_fechado,
            'cor_principal', e.cor_principal,
            'cor_principal_hover', e.cor_principal_hover,
            'cor_secundaria', e.cor_secundaria,
            'cor_secundaria_hover', e.cor_secundaria_hover
        ),
        'produtos', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', pr.id,
                'nome', pr.nome,
                'slug', pr.slug,
                'url_acesso', ep.url_acesso,
                'configuracoes', ep.configuracoes,
                'ativo', ep.ativo
            ))
            FROM public.entidade_produto ep
            JOIN public.produto pr ON pr.id = ep.id_produto
            WHERE ep.id_entidade = e.id
        ), '[]'::jsonb)
    ) INTO v_result
    FROM public.user_entidades e
    WHERE p_dominio IS NOT NULL
      AND (
          e.dominios @> to_jsonb(p_dominio)
          OR e.url = p_dominio
      )
    LIMIT 1;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Entidade não encontrada para o domínio');
    END IF;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.app_resolver_entidade_por_dominio(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.app_resolver_entidade_por_dominio(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_resolver_entidade_por_dominio(TEXT) TO service_role;

-- ======================================================
-- 2. nxt_get_user_session_v1 (recria) — produtos[] via entidade_produto
--    Substitui o uso de user_produto por entidade_produto direto.
--    Mantém o contrato de retorno (usuario + entidades.produtos[])
--    para não quebrar o BFF / front.
-- ======================================================
CREATE OR REPLACE FUNCTION public.nxt_get_user_session_v1(p_auth_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
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

    -- 2. Entidades e produtos (via entidade_produto — sem user_produto)
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
                        'ativo', ep.ativo
                    )
                ), '[]'::jsonb)
                FROM public.entidade_produto ep
                JOIN public.produto p ON p.id = ep.id_produto
                WHERE ep.id_entidade = e.id
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

GRANT EXECUTE ON FUNCTION public.nxt_get_user_session_v1(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nxt_get_user_session_v1(UUID) TO service_role;

-- ======================================================
-- 3. Backfill: user_papeis_auth.id_entidade onde não preenchido
--    Para os usuários com papel global corrigido, marca a entidade
--    quando há ambiguidade NÃO preenchemos (não existe entidade única);
--    deixamos NULL (global) — a sessão resolve (id_entidade = X OR NULL).
--    (Aqui apenas garantimos o registro do racional; o papel global
--     já funciona nas Fases A/B via (id_entidade = X OR NULL).)
-- ======================================================

-- ======================================================
-- 4. Drop de user_produto (agora redundante)
--    CASCADE remove policies e FKs associadas.
-- ======================================================
DROP TABLE IF EXISTS public.user_produto;
