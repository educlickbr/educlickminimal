-- ======================================================
-- Resolução de entidade via BFF com SECURITY DEFINER
--
-- Acordo (servidor_ssr_bff.md): nada é exposto ao client. A
-- resolução de domínio/entidade acontece no BFF (server/api/*)
-- usando a service role. Por isso:
--  1. app_resolver_entidade_por_dominio vira SECURITY DEFINER e
--     deixa de ter GRANT para anon/authenticated (só service_role).
--  2. Nova app_resolver_entidade_por_id (SECURITY DEFINER) para
--     o fallback/bypass de dev no /api/me — substitui a query
--     direta em user_entidades.
--  NOTA: a policy de leitura de user_entidades NÃO é alterada aqui —
--  permanece como estiver (hoje: leitura pública, pois outras RPCs
--  SECURITY INVOKER podem ler user_entidades e dependem de leitura
--  ampla p/ funcionar). Só as RPCs DEFINER de resolução não dependem
--  mais disso, mas mantemos a policy para não quebrar o resto.
-- ======================================================

-- 1. app_resolver_entidade_por_dominio — DEFINER, sem anon
CREATE OR REPLACE FUNCTION public.app_resolver_entidade_por_dominio(p_dominio TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', e.id,
        'nome', e.nome_entidade,
        'nome_entidade', e.nome_entidade,
        'tipo', e.tipo,
        'url', e.url,
        'dominios', COALESCE(e.dominios, '[]'::jsonb),
        'rota_inicial', COALESCE(e.rota_inicial, '/'),
        'tema', COALESCE(e.tema, 'dark'),
        'branding', jsonb_build_object(
            'logo_aberto', e.logo_aberto,
            'logo_fechado', e.logo_fechado,
            'cor_principal', e.cor_principal,
            'cor_principal_hover', e.cor_principal_hover,
            'cor_secundaria', e.cor_secundaria,
            'cor_secundaria_hover', e.cor_secundaria_hover
        ),
        'produtos', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', p.id,
                'nome', p.nome,
                'slug', p.slug,
                'url_acesso', ep.url_acesso,
                'ativo', ep.ativo
            )), '[]'::jsonb)
            FROM public.entidade_produto ep
            JOIN public.produto p ON p.id = ep.id_produto
            WHERE ep.id_entidade = e.id AND ep.ativo = TRUE
        )
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

-- remove acesso público/anônimo; só o BFF (service role) resolve
REVOKE EXECUTE ON FUNCTION public.app_resolver_entidade_por_dominio(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.app_resolver_entidade_por_dominio(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.app_resolver_entidade_por_dominio(TEXT) TO service_role;


-- 2. app_resolver_entidade_por_id — DEFINER (fallback/desenv no BFF)
CREATE OR REPLACE FUNCTION public.app_resolver_entidade_por_id(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', e.id,
        'nome', e.nome_entidade,
        'nome_entidade', e.nome_entidade,
        'tipo', e.tipo,
        'url', e.url,
        'dominios', COALESCE(e.dominios, '[]'::jsonb),
        'rota_inicial', COALESCE(e.rota_inicial, '/'),
        'tema', COALESCE(e.tema, 'dark'),
        'branding', jsonb_build_object(
            'logo_aberto', e.logo_aberto,
            'logo_fechado', e.logo_fechado,
            'cor_principal', e.cor_principal,
            'cor_principal_hover', e.cor_principal_hover,
            'cor_secundaria', e.cor_secundaria,
            'cor_secundaria_hover', e.cor_secundaria_hover
        ),
        'produtos', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', p.id,
                'nome', p.nome,
                'slug', p.slug,
                'url_acesso', ep.url_acesso,
                'ativo', ep.ativo
            )), '[]'::jsonb)
            FROM public.entidade_produto ep
            JOIN public.produto p ON p.id = ep.id_produto
            WHERE ep.id_entidade = e.id AND ep.ativo = TRUE
        )
    ) INTO v_result
    FROM public.user_entidades e
    WHERE e.id = p_id
    LIMIT 1;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Entidade não encontrada');
    END IF;

    RETURN v_result;
END;
$$;

-- só o BFF (service role) — não exposto a anon/authenticated
GRANT EXECUTE ON FUNCTION public.app_resolver_entidade_por_id(UUID) TO service_role;
