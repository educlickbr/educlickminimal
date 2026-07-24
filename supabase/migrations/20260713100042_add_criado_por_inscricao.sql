-- ============================================================
-- Migration: 20260713100042 — criado_por na inscrição pública
-- ============================================================
-- Adiciona p_criado_por à RPC aca_inscrever_edital_publico
-- e preenche o campo na tabela de inscrição.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_inscrever_edital_publico(
    p_id_edital UUID,
    p_id_entidade UUID,
    p_nome TEXT,
    p_email TEXT,
    p_respostas JSONB DEFAULT '{}',
    p_criado_por UUID DEFAULT NULL
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
    v_cpf_pergunta_id UUID;
    v_cpf_value TEXT;
    v_cpf_existente UUID;
BEGIN
    -- 0. Verifica CPF duplicado
    SELECT id INTO v_cpf_pergunta_id
    FROM public.cmct_pergunta_form
    WHERE nome_interno = 'cpf'
    LIMIT 1;

    IF v_cpf_pergunta_id IS NOT NULL THEN
        v_cpf_value := p_respostas ->> v_cpf_pergunta_id::TEXT;

        IF v_cpf_value IS NOT NULL AND length(trim(v_cpf_value)) > 0 THEN
            SELECT id_user_expandido INTO v_cpf_existente
            FROM public.aca_resposta_form
            WHERE id_pergunta = v_cpf_pergunta_id
              AND resposta = v_cpf_value
            LIMIT 1;

            IF v_cpf_existente IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'message', 'Este CPF já foi cadastrado em uma inscrição anterior.'
                );
            END IF;
        END IF;
    END IF;

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

    -- 4. Cria inscrição no edital (com criado_por)
    INSERT INTO public.aca_edital_docente_inscricao
        (id_edital, id_candidato, status, criado_por)
    VALUES
        (p_id_edital, v_candidato_id, 'aguardando', p_criado_por)
    RETURNING id INTO v_inscricao_id;

    RETURN jsonb_build_object(
        'success', true,
        'id_inscricao', v_inscricao_id,
        'id_user_expandido', v_candidato_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_inscrever_edital_publico(UUID, UUID, TEXT, TEXT, JSONB, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.aca_inscrever_edital_publico(UUID, UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
