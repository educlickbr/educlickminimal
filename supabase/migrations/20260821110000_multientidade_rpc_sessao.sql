-- ======================================================
-- FASE B — Backend de sessão (permissões + entidade ativa)
-- Fonte: documentacao/planos/plano-multientidade-permissoes.md
--        documentacao/arquitetura/permissoes.md
--
-- RPCs (acordo do projeto: SECURITY INVOKER):
--   - app_resolver_entidade_por_dominio(p_dominio) -> entidade pelo host
--   - app_get_minha_sessao(p_id_entidade)          -> sessão + permissões do usuário
-- ======================================================

-- ======================================================
-- 1. app_resolver_entidade_por_dominio
--    Resolve o domínio (host) -> entidade.
--    Busca em dominios JSONB (contains) com fallback em url.
--    Uso: BFF /api/me resolve a entidade ativa pelo host da requisição.
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
        )
    ) INTO v_result
    FROM public.user_entidades e
    WHERE p_dominio IS NOT NULL
      AND (
          e.dominios @> to_jsonb(p_dominio)          -- alias/domínio múltiplo
          OR e.url = p_dominio                        -- domínio canônico/enriquecido
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
-- 2. app_get_minha_sessao(p_id_entidade)
--    Retorna a sessão do usuário para a entidade ativa:
--      { success, is_admin, entidade_ativa, papeis, permissoes, rota_inicial }
--
--    Regras de resolução de permissões (allow/deny + precedência + deny vence):
--      - default deny: sem regra = negado
--      - casa: (entidade = X OR NULL) E (papel ∈ papeis do usuário OR NULL)
--              E (produto IS NULL OR produto da entidade)
--      - precedência por especificidade: entidade+papel > entidade > papel > global
--      - empate -> permitido = FALSE vence (deny revoga regra mais ampla)
--      - bypass: papel admin (global) => vê tudo (is_admin)
--    Usuário: via auth.uid() (NUNCA aceita id por parâmetro).
-- ======================================================
CREATE OR REPLACE FUNCTION public.app_get_minha_sessao(p_id_entidade UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_auth_id     UUID := auth.uid();
    v_pertence    BOOLEAN;
    v_is_admin    BOOLEAN;
    v_entidade    JSONB;
    v_entidades_user JSONB;
    v_papeis      JSONB;
    v_permissoes  JSONB;
BEGIN
    IF v_auth_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Não autenticado');
    END IF;

    --------------------------------------------------------------------
    -- a. Pertença à entidade (via user_expandido.id_user = auth.uid())
    --------------------------------------------------------------------
    SELECT EXISTS (
        SELECT 1
        FROM public.user_entidade_user ueu
        JOIN public.user_expandido ue ON ue.id = ueu.id_user
        WHERE ue.id_user = v_auth_id
          AND ueu.id_entidade = p_id_entidade
    ) INTO v_pertence;

    IF NOT v_pertence OR p_id_entidade IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário não pertence à entidade');
    END IF;

    --------------------------------------------------------------------
    -- b. Bypass admin (papel 'admin' global ou da entidade)
    --------------------------------------------------------------------
    SELECT EXISTS (
        SELECT 1
        FROM public.user_papeis_auth pa
        JOIN public.user_papeis p ON p.id = pa.id_papel
        WHERE pa.id_user = v_auth_id
          AND p.nome = 'admin'
          AND (pa.id_entidade = p_id_entidade OR pa.id_entidade IS NULL)
    ) INTO v_is_admin;

    --------------------------------------------------------------------
    -- c. Entidade ativa (bloco de entidades do usuário para a sessão)
    --------------------------------------------------------------------
    SELECT
        jsonb_agg(jsonb_build_object(
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
            )
        ) ORDER BY e.nome_entidade)
    INTO v_entidades_user
    FROM public.user_entidade_user ueu
    JOIN public.user_entidades e ON e.id = ueu.id_entidade
    JOIN public.user_expandido ue ON ue.id = ueu.id_user
    WHERE ue.id_user = v_auth_id;

    -- entidade ativa destacada
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
        )
    ) INTO v_entidade
    FROM public.user_entidades e
    WHERE e.id = p_id_entidade;

    --------------------------------------------------------------------
    -- d. Papéis do usuário na entidade (global + por entidade)
    --------------------------------------------------------------------
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'nome', p.nome,
        'escopo', CASE WHEN pa.id_entidade IS NULL THEN 'global' ELSE 'entidade' END
    )), '[]'::jsonb)
    INTO v_papeis
    FROM public.user_papeis_auth pa
    JOIN public.user_papeis p ON p.id = pa.id_papel
    WHERE pa.id_user = v_auth_id
      AND (pa.id_entidade = p_id_entidade OR pa.id_entidade IS NULL);

    --------------------------------------------------------------------
    -- e. Permissões efetivas (apenas se NÃO for admin — admin vê tudo)
    --------------------------------------------------------------------
    IF NOT v_is_admin THEN
        SELECT COALESCE(jsonb_agg(perm), '[]'::jsonb)
        INTO v_permissoes
        FROM (
            SELECT DISTINCT ON (ap.ilha, ap.botao, ap.escopo, ap.rota)
                jsonb_build_object(
                    'ilha', ap.ilha,
                    'botao', ap.botao,
                    'escopo', ap.escopo,
                    'rota', ap.rota
                ) AS perm,
                ap.permitido
            FROM public.app_permissoes ap
            WHERE (ap.id_entidade = p_id_entidade OR ap.id_entidade IS NULL)
              AND (
                    ap.id_papel IS NULL
                    OR ap.id_papel IN (
                        SELECT pa.id_papel
                        FROM public.user_papeis_auth pa
                        WHERE pa.id_user = v_auth_id
                          AND (pa.id_entidade = p_id_entidade OR pa.id_entidade IS NULL)
                    )
              )
              AND (
                    ap.id_produto IS NULL
                    OR ap.id_produto IN (
                        SELECT ep.id_produto
                        FROM public.entidade_produto ep
                        WHERE ep.id_entidade = p_id_entidade AND ep.ativo = TRUE
                    )
              )
            ORDER BY ap.ilha, ap.botao, ap.escopo, ap.rota,
                (CASE
                    WHEN ap.id_entidade IS NOT NULL AND ap.id_papel IS NOT NULL THEN 3
                    WHEN ap.id_entidade IS NOT NULL THEN 2
                    WHEN ap.id_papel IS NOT NULL THEN 1
                    ELSE 0
                 END) DESC,
                ap.permitido ASC
        ) t
        WHERE t.permitido = TRUE;
    ELSE
        v_permissoes := '[]'::jsonb;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'is_admin', v_is_admin,
        'entidade_ativa', v_entidade,
        'entidades', COALESCE(v_entidades_user, '[]'::jsonb),
        'papeis', COALESCE(v_papeis, '[]'::jsonb),
        'permissoes', COALESCE(v_permissoes, '[]'::jsonb),
        'rota_inicial', COALESCE(v_entidade->>'rota_inicial', '/')
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.app_get_minha_sessao(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.app_get_minha_sessao(UUID) TO service_role;
