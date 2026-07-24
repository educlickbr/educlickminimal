-- ============================================================
-- Migration: 20260713100031 — Fix inscricao publica completa
-- ============================================================
-- Cria user_expandido com nome+email, respostas, entidade,
-- papel candidato e inscrição.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_inscrever_edital_publico(
    p_id_edital UUID,
    p_id_entidade UUID,
    p_nome TEXT,
    p_email TEXT,
    p_respostas JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_candidato_id UUID;
    v_inscricao_id UUID;
    v_papel_candidato_id UUID;
    v_pergunta_id UUID;
    v_resposta TEXT;
BEGIN
    -- 1. Cria ou busca user_expandido
    SELECT id INTO v_candidato_id
    FROM public.user_expandido
    WHERE email = p_email
    LIMIT 1;

    IF v_candidato_id IS NULL THEN
        INSERT INTO public.user_expandido (nome_completo, email)
        VALUES (p_nome, p_email)
        RETURNING id INTO v_candidato_id;
    ELSE
        UPDATE public.user_expandido
        SET nome_completo = p_nome
        WHERE id = v_candidato_id;
    END IF;

    -- 2. Vincula entidade
    INSERT INTO public.user_entidade_user (id_entidade, id_user)
    VALUES (p_id_entidade, v_candidato_id)
    ON CONFLICT DO NOTHING;

    -- 3. Salva respostas (exceto sys-*)
    FOR v_pergunta_id, v_resposta IN
        SELECT key::UUID, value::TEXT
        FROM jsonb_each_text(p_respostas)
        WHERE key NOT LIKE 'sys-%'
    LOOP
        INSERT INTO public.aca_resposta_form (
            id_entidade, id_user_expandido, id_pergunta,
            resposta, criado_em
        )
        VALUES (
            p_id_entidade, v_candidato_id, v_pergunta_id,
            v_resposta, NOW()
        );
    END LOOP;

    -- 4. Cria inscrição no edital
    INSERT INTO public.aca_edital_docente_inscricao
        (id_edital, id_candidato, status)
    VALUES
        (p_id_edital, v_candidato_id, 'aguardando')
    RETURNING id INTO v_inscricao_id;

    -- 5. Atribui papel candidato (se não tiver)
    SELECT id INTO v_papel_candidato_id
    FROM public.user_papeis
    WHERE nome = 'aca_candidato';

    -- Nota: papel só é vinculado quando tiver auth user (id_user)
    -- Por enquanto o user_expandido fica sem auth/papel

    RETURN jsonb_build_object(
        'success', true,
        'id_inscricao', v_inscricao_id,
        'id_user_expandido', v_candidato_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_inscrever_edital_publico(UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;
