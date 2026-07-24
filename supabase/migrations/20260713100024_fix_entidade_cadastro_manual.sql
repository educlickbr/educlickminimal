-- ============================================================
-- Migration: 20260713100024 — Fix entidade no cadastro manual
-- ============================================================
-- Corrige aca_criar_docente_completo para inserir em
-- user_entidade_user também.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_criar_docente_completo(
    p_id_entidade UUID,
    p_nome TEXT,
    p_email TEXT,
    p_respostas JSONB DEFAULT '{}',
    p_valor_hora_aula INTEGER DEFAULT NULL,
    p_criado_por UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_expandido_id UUID;
    v_docente_id UUID;
    v_pergunta_id UUID;
    v_resposta TEXT;
    v_papel_docente_id UUID;
    v_auth_user_id UUID;
BEGIN
    SELECT id, id_user INTO v_user_expandido_id, v_auth_user_id
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    IF v_user_expandido_id IS NULL THEN
        INSERT INTO public.user_expandido (nome_completo, email)
        VALUES (p_nome, p_email)
        RETURNING id INTO v_user_expandido_id;
    ELSE
        UPDATE public.user_expandido
        SET nome_completo = p_nome
        WHERE id = v_user_expandido_id;
    END IF;

    -- Respostas
    FOR v_pergunta_id, v_resposta IN
        SELECT key::UUID, value::TEXT
        FROM jsonb_each_text(p_respostas)
    LOOP
        INSERT INTO public.aca_resposta_form (
            id_entidade, id_user_expandido, id_pergunta,
            resposta, criado_por, modificado_por, modificado_em
        )
        VALUES (
            p_id_entidade, v_user_expandido_id, v_pergunta_id,
            v_resposta, p_criado_por, p_criado_por, NOW()
        )
        ON CONFLICT (id_user_expandido, id_pergunta) DO UPDATE SET
            resposta = EXCLUDED.resposta,
            modificado_por = p_criado_por,
            modificado_em = NOW();
    END LOOP;

    -- Vincula docente
    INSERT INTO public.aca_docente (id_entidade, id_user_expandido, ativo, valor_hora_aula, criado_por)
    VALUES (p_id_entidade, v_user_expandido_id, true, p_valor_hora_aula, p_criado_por)
    ON CONFLICT (id_entidade, id_user_expandido) DO UPDATE SET
        ativo = true,
        valor_hora_aula = COALESCE(p_valor_hora_aula, aca_docente.valor_hora_aula),
        modificado_por = p_criado_por,
        modificado_em = NOW()
    RETURNING id INTO v_docente_id;

    -- Vincula entidade
    INSERT INTO public.user_entidade_user (id_entidade, id_user)
    VALUES (p_id_entidade, v_user_expandido_id)
    ON CONFLICT DO NOTHING;

    -- Papel (se já tem auth)
    IF v_auth_user_id IS NOT NULL THEN
        SELECT id INTO v_papel_docente_id
        FROM public.user_papeis
        WHERE nome = 'aca_docente';

        IF v_papel_docente_id IS NOT NULL THEN
            INSERT INTO public.user_papeis_auth (id_user, id_papel)
            VALUES (v_auth_user_id, v_papel_docente_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id_user_expandido', v_user_expandido_id,
        'id_docente', v_docente_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_criar_docente_completo(UUID, TEXT, TEXT, JSONB, INTEGER, UUID) TO authenticated;
