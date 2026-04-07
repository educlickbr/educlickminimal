-- ======================================================
-- RPC: Get User Session V1
-- Descrição: Retorna perfil do usuário, entidades vinculadas e produtos ativos por entidade.
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
BEGIN
    -- 1. Buscar Dados do Usuário Expandido
    SELECT jsonb_build_object(
        'id', ue.id,
        'id_user', ue.id_user,
        'email', ue.email,
        'nome_completo', ue.nome_completo,
        'criado_em', ue.criado_em
    ) INTO v_user_data
    FROM public.user_expandido ue
    WHERE ue.id_user = p_auth_id
    LIMIT 1;

    IF v_user_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário não encontrado em user_expandido');
    END IF;

    -- 2. Buscar Entidades e seus respectivos Produtos vinculados
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
                        'url_acesso', ep.url_acesso
                    )
                ), '[]'::jsonb)
                FROM public.entidade_produto ep
                JOIN public.produto p ON p.id = ep.id_produto
                WHERE ep.id_entidade = e.id AND ep.ativo = TRUE
            )
        )
    ) INTO v_entidades
    FROM public.user_entidade_user ueu
    JOIN public.user_entidades e ON e.id = ueu.id_entidade
    WHERE ueu.id_user = (v_user_data->>'id')::uuid;

    -- 3. Montar Objeto Final
    v_result := jsonb_build_object(
        'success', true,
        'usuario', v_user_data,
        'entidades', COALESCE(v_entidades, '[]'::jsonb)
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nxt_get_user_session_v1(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nxt_get_user_session_v1(UUID) TO service_role;
