-- ============================================================
-- Migration: create_lms_rpc_avaliacao
-- Data: 2026-08-06
-- Descrição: RPCs para o fluxo de Questionários (Avaliações):
--   1. lms_get_avaliacao_completa  → avaliação + perguntas + alternativas
--   2. lms_upsert_avaliacao_completa → salva avaliação + perguntas + alternativas
--      (estratégia REPLACE: apaga perguntas antigas e insere as novas)
--      Obs: quando submissões de alunos existirem, migrar para diff por id.
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. lms_get_avaliacao_completa
-- Retorna a avaliação de um conteúdo com perguntas e alternativas.
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.lms_get_avaliacao_completa(
    p_id_conteudo UUID,
    p_id_entidade UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_avaliacao RECORD;
    v_perguntas JSONB;
    v_result JSONB;
BEGIN
    -- Garante que o conteúdo pertence à entidade
    SELECT av.*
    INTO v_avaliacao
    FROM public.lms_avaliacao av
    JOIN public.lms_conteudo c ON c.id = av.id_conteudo
    WHERE av.id_conteudo = p_id_conteudo
      AND c.id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('avaliacao', 'null'::jsonb, 'perguntas', '[]'::jsonb);
    END IF;

    -- Perguntas com alternativas (padrão subquery com alias)
    SELECT COALESCE((
        SELECT jsonb_agg(sub ORDER BY sub.ordem, sub.criado_em) FROM (
            SELECT
                p.id, p.tipo, p.enunciado, p.pontuacao, p.obrigatoria, p.ordem, p.id_arquivo,
                COALESCE((
                    SELECT jsonb_agg(alt ORDER BY alt.ordem, alt.criado_em) FROM (
                        SELECT rp.id, rp.texto, rp.correta, rp.ordem, rp.id_arquivo
                        FROM public.lms_resposta_possivel rp
                        WHERE rp.id_pergunta = p.id
                    ) alt
                ), '[]'::jsonb) AS alternativas
            FROM public.lms_pergunta p
            WHERE p.id_avaliacao = v_avaliacao.id
        ) sub
    ), '[]'::jsonb)
    INTO v_perguntas;

    SELECT jsonb_build_object(
        'avaliacao', jsonb_build_object(
            'id', v_avaliacao.id,
            'nome', v_avaliacao.nome,
            'descricao', v_avaliacao.descricao,
            'id_arquivo_referencia', v_avaliacao.id_arquivo_referencia,
            'ordem_perguntas', v_avaliacao.ordem_perguntas
        ),
        'perguntas', v_perguntas
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 2. lms_upsert_avaliacao_completa
-- Salva (ou cria) a avaliação de um conteúdo com perguntas e
-- alternativas. Estratégia REPLACE: remove perguntas antigas e
-- insere as enviadas. Executado em transação.
-- ═══════════════════════════════════════════════════════════
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

    -- Insere as novas perguntas
    v_ordem := 0;
    FOR v_pergunta IN SELECT * FROM jsonb_array_elements(p_perguntas) AS p
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
            FOR v_alternativa IN SELECT * FROM jsonb_array_elements(
                COALESCE(v_pergunta.p->'alternativas', '[]'::jsonb)
            ) AS alt
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
