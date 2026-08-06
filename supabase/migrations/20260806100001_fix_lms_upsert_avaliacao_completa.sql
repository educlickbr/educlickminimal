-- ============================================================
-- Migration: fix_lms_upsert_avaliacao_completa
-- Data: 2026-08-06
-- Descrição: Corrige a RPC lms_upsert_avaliacao_completa.
--   O alias de jsonb_array_elements(...) AS p cria o campo
--   "value" e não "p" — o acesso v_pergunta.p falhava com
--   "record has no field p". Fix: SELECT value AS p / AS alt.
-- ============================================================

DROP FUNCTION IF EXISTS public.lms_upsert_avaliacao_completa(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_nome TEXT,
    p_descricao TEXT,
    p_perguntas JSONB,
    p_usuario_id UUID
);

CREATE OR REPLACE FUNCTION public.lms_upsert_avaliacao_completa(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_nome TEXT,
    p_descricao TEXT DEFAULT NULL,
    p_perguntas JSONB DEFAULT '[]'::jsonb,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_avaliacao_id UUID;
    v_pergunta RECORD;
    v_alternativa RECORD;
    v_nome TEXT;
    v_descricao TEXT;
    v_tipo TEXT;
    v_enunciado TEXT;
    v_pontuacao NUMERIC;
    v_obrigatoria BOOLEAN;
    v_ordem INTEGER;
    v_id_arquivo UUID;
    v_pergunta_id UUID;
    v_alt_ordem INTEGER;
BEGIN
    -- Garante que o conteúdo pertence à entidade
    IF NOT EXISTS (
        SELECT 1 FROM public.lms_conteudo
        WHERE id = p_id_conteudo AND id_entidade = p_id_entidade
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Conteúdo não encontrado');
    END IF;

    -- Nome/descrição: usa os valores enviados ou os do conteúdo
    SELECT COALESCE(p_nome, titulo), COALESCE(p_descricao, descricao)
    INTO v_nome, v_descricao
    FROM public.lms_conteudo
    WHERE id = p_id_conteudo;

    -- Upsert da avaliação (1:1 com conteúdo)
    INSERT INTO public.lms_avaliacao (id_conteudo, nome, descricao)
    VALUES (p_id_conteudo, v_nome, v_descricao)
    ON CONFLICT (id_conteudo) DO UPDATE
        SET nome = EXCLUDED.nome,
            descricao = EXCLUDED.descricao,
            modificado_em = NOW()
    RETURNING id INTO v_avaliacao_id;

    -- REPLACE: remove perguntas antigas (CASCADE apaga alternativas)
    DELETE FROM public.lms_pergunta WHERE id_avaliacao = v_avaliacao_id;

    -- Insere as novas perguntas (value AS p: alias correto do jsonb_array_elements)
    v_ordem := 0;
    FOR v_pergunta IN SELECT value AS p FROM jsonb_array_elements(p_perguntas)
    LOOP
        v_tipo := v_pergunta.p->>'tipo';
        v_enunciado := v_pergunta.p->>'enunciado';
        v_pontuacao := COALESCE((v_pergunta.p->>'pontuacao')::NUMERIC, 0);
        v_obrigatoria := COALESCE((v_pergunta.p->>'obrigatoria')::BOOLEAN, true);
        v_id_arquivo := NULLIF(v_pergunta.p->>'id_arquivo', '')::UUID;

        INSERT INTO public.lms_pergunta (
            id_avaliacao, tipo, enunciado, pontuacao, obrigatoria, ordem, id_arquivo
        )
        VALUES (
            v_avaliacao_id,
            COALESCE(v_tipo, 'dissertativa')::lms_tipo_pergunta,
            COALESCE(v_enunciado, ''),
            v_pontuacao,
            v_obrigatoria,
            v_ordem,
            v_id_arquivo
        )
        RETURNING id INTO v_pergunta_id;

        -- Alternativas (se múltipla escolha)
        IF v_tipo = 'multipla_escolha' THEN
            v_alt_ordem := 0;
            FOR v_alternativa IN SELECT value AS alt FROM jsonb_array_elements(
                COALESCE(v_pergunta.p->'alternativas', '[]'::jsonb)
            )
            LOOP
                INSERT INTO public.lms_resposta_possivel (
                    id_pergunta, texto, correta, ordem
                )
                VALUES (
                    v_pergunta_id,
                    COALESCE(v_alternativa.alt->>'texto', ''),
                    COALESCE((v_alternativa.alt->>'correta')::BOOLEAN, false),
                    v_alt_ordem
                );
                v_alt_ordem := v_alt_ordem + 1;
            END LOOP;
        END IF;

        v_ordem := v_ordem + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'id', v_avaliacao_id, 'qtd_perguntas', jsonb_array_length(p_perguntas));
END;
$$;
