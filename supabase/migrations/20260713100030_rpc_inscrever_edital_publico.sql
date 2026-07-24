-- ============================================================
-- Migration: 20260713100030 — RPC inscrição pública em edital
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_inscrever_edital_publico(
    p_id_edital UUID,
    p_id_entidade UUID,
    p_respostas JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_candidato_id UUID;
    v_edital RECORD;
    v_inscricao_id UUID;
    v_pergunta_id UUID;
    v_resposta TEXT;
BEGIN
    -- Verifica edital
    SELECT * INTO v_edital
    FROM public.aca_edital_docente
    WHERE id = p_id_edital AND status = 'ativo';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Edital não encontrado.');
    END IF;

    -- Cria um user_expandido temporário (sem auth)
    INSERT INTO public.user_expandido (nome_completo)
    VALUES ('Candidato Edital')
    RETURNING id INTO v_candidato_id;

    -- Cria inscrição
    INSERT INTO public.aca_edital_docente_inscricao
        (id_edital, id_candidato, status)
    VALUES
        (p_id_edital, v_candidato_id, 'aguardando')
    RETURNING id INTO v_inscricao_id;

    -- Salva respostas (se houver perguntas)
    FOR v_pergunta_id, v_resposta IN
        SELECT key::UUID, value::TEXT
        FROM jsonb_each_text(p_respostas)
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

    RETURN jsonb_build_object(
        'success', true,
        'id_inscricao', v_inscricao_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aca_inscrever_edital_publico(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aca_inscrever_edital_publico(UUID, UUID, JSONB) TO anon;
