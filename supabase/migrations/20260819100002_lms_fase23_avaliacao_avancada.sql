-- ═══════════════════════════════════════════════════════════
-- LMS Fase 2.3 — Avaliação avançada
-- Data: 2026-08-19
-- 1. Colunas lms_avaliacao: ambiente_seguro + autoavaliacao
-- 2. lms_upsert_avaliacao_completa: aceita p_ordem_perguntas
--    (o BFF já enviava — bug latente), p_ambiente_seguro e
--    p_autoavaliacao; valida que autoavaliação não tem dissertativa
-- 3. lms_get_avaliacao_completa: retorna as flags
-- 4. lms_get_avaliacao_para_aluno: retorna as flags
-- 5. lms_finalizar_submissao_avaliacao: na autoavaliação calcula a
--    nota na hora (soma das pontuações corretas) e grava nota_total
-- Todas SECURITY INVOKER (acordo do projeto — nunca DEFINER)
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- 1. Colunas em lms_avaliacao
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.lms_avaliacao
    ADD COLUMN IF NOT EXISTS ambiente_seguro BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.lms_avaliacao
    ADD COLUMN IF NOT EXISTS autoavaliacao BOOLEAN NOT NULL DEFAULT FALSE;

-- ───────────────────────────────────────────────────────────
-- 2. lms_upsert_avaliacao_completa (assinatura nova → DROP + CREATE)
-- ───────────────────────────────────────────────────────────
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
    p_usuario_id UUID DEFAULT NULL,
    p_ordem_perguntas TEXT DEFAULT 'fixa',
    p_ambiente_seguro BOOLEAN DEFAULT FALSE,
    p_autoavaliacao BOOLEAN DEFAULT FALSE
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

    -- Autoavaliação não permite perguntas dissertativas
    IF p_autoavaliacao AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_perguntas) AS q
        WHERE q->>'tipo' = 'dissertativa'
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Autoavaliação não permite perguntas dissertativas');
    END IF;

    -- Nome/descrição: usa os valores enviados ou os do conteúdo
    SELECT COALESCE(p_nome, titulo), COALESCE(p_descricao, descricao)
    INTO v_nome, v_descricao
    FROM public.lms_conteudo
    WHERE id = p_id_conteudo;

    -- Upsert da avaliação (1:1 com conteúdo)
    INSERT INTO public.lms_avaliacao (id_conteudo, nome, descricao, ordem_perguntas, ambiente_seguro, autoavaliacao)
    VALUES (p_id_conteudo, v_nome, v_descricao,
            CASE WHEN p_ordem_perguntas = 'aleatoria' THEN 'aleatoria' ELSE 'fixa' END,
            p_ambiente_seguro, p_autoavaliacao)
    ON CONFLICT (id_conteudo) DO UPDATE
        SET nome = EXCLUDED.nome,
            descricao = EXCLUDED.descricao,
            ordem_perguntas = EXCLUDED.ordem_perguntas,
            ambiente_seguro = EXCLUDED.ambiente_seguro,
            autoavaliacao = EXCLUDED.autoavaliacao,
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

-- ───────────────────────────────────────────────────────────
-- 3. lms_get_avaliacao_completa — retorna as flags
-- ───────────────────────────────────────────────────────────
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
    SELECT av.*
    INTO v_avaliacao
    FROM public.lms_avaliacao av
    JOIN public.lms_conteudo c ON c.id = av.id_conteudo
    WHERE av.id_conteudo = p_id_conteudo
      AND c.id_entidade = p_id_entidade;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('avaliacao', 'null'::jsonb, 'perguntas', '[]'::jsonb);
    END IF;

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
            'ordem_perguntas', v_avaliacao.ordem_perguntas,
            'ambiente_seguro', COALESCE(v_avaliacao.ambiente_seguro, false),
            'autoavaliacao', COALESCE(v_avaliacao.autoavaliacao, false)
        ),
        'perguntas', v_perguntas
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ───────────────────────────────────────────────────────────
-- 4. lms_get_avaliacao_para_aluno — retorna as flags
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lms_get_avaliacao_para_aluno(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_id_matricula UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_avaliacao RECORD;
    v_perguntas JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.aca_matricula
        WHERE id = p_id_matricula AND id_usuario = public.lms_user_expandido_id()
    ) THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Acesso negado');
    END IF;

    SELECT av.id, av.ordem_perguntas, av.ambiente_seguro, av.autoavaliacao
    INTO v_avaliacao
    FROM public.lms_avaliacao av
    JOIN public.lms_conteudo c ON c.id = av.id_conteudo
    WHERE av.id_conteudo = p_id_conteudo
      AND c.id_entidade = p_id_entidade
      AND EXISTS (
          SELECT 1 FROM public.lms_conteudo_operacional op
          JOIN public.aca_matricula m ON m.id = p_id_matricula
          WHERE op.id_conteudo = p_id_conteudo
            AND op.ativo = true
            AND (
                op.id_programa = m.id_programa
                OR op.id_ciclo IN (SELECT cp.id_ciclo FROM public.aca_ciclo_programa cp WHERE cp.id_programa = m.id_programa)
                OR op.id_calendario IN (
                    SELECT cal.id FROM public.aca_calendario cal
                    JOIN public.aca_ciclo_programa cp ON cp.id_ciclo = cal.id_ciclo
                    WHERE cp.id_programa = m.id_programa
                )
            )
      );

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'NAO_DISPONIVEL', 'message', 'Avaliação não encontrada');
    END IF;

    SELECT COALESCE((
        SELECT jsonb_agg(sub ORDER BY (
            CASE WHEN v_avaliacao.ordem_perguntas = 'aleatoria'
                 THEN random() ELSE sub.ordem::double precision END
        )) FROM (
            SELECT
                p.id AS id_pergunta, p.tipo, p.enunciado, p.pontuacao, p.obrigatoria, p.ordem, p.id_arquivo,
                COALESCE((
                    SELECT jsonb_agg(alt ORDER BY (
                        CASE WHEN v_avaliacao.ordem_perguntas = 'aleatoria'
                             THEN random() ELSE alt.ordem::double precision END
                    )) FROM (
                        SELECT rp.id AS id_resposta_possivel, rp.texto, rp.ordem, rp.id_arquivo
                        FROM public.lms_resposta_possivel rp
                        WHERE rp.id_pergunta = p.id
                    ) alt
                ), '[]'::jsonb) AS alternativas
            FROM public.lms_pergunta p
            WHERE p.id_avaliacao = v_avaliacao.id
        ) sub
    ), '[]'::jsonb)
    INTO v_perguntas;

    RETURN jsonb_build_object(
        'success', true,
        'id_avaliacao', v_avaliacao.id,
        'ordem_perguntas', v_avaliacao.ordem_perguntas,
        'ambiente_seguro', COALESCE(v_avaliacao.ambiente_seguro, false),
        'autoavaliacao', COALESCE(v_avaliacao.autoavaliacao, false),
        'perguntas', v_perguntas
    );
END;
$$;

-- ───────────────────────────────────────────────────────────
-- 5. lms_finalizar_submissao_avaliacao — nota na autoavaliação
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lms_finalizar_submissao_avaliacao(
    p_id_submissao UUID,
    p_id_entidade UUID,
    p_respostas JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_sub RECORD;
    v_resposta RECORD;
    v_id_pergunta UUID;
    v_id_resp_possivel UUID;
    v_texto TEXT;
    v_id_arquivo_envio UUID;
    v_autoavaliacao BOOLEAN;
    v_nota NUMERIC;
BEGIN
    SELECT sa.*
    INTO v_sub
    FROM public.lms_submissao_avaliacao sa
    JOIN public.aca_matricula m ON m.id = sa.id_matricula
    WHERE sa.id = p_id_submissao
      AND m.id_usuario = public.lms_user_expandido_id();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'SUBMISSAO_INVALIDA', 'message', 'Submissão inválida');
    END IF;

    IF v_sub.status = 'entregue' THEN
        RETURN jsonb_build_object('success', false, 'code', 'JA_ENTREGUE', 'message', 'Avaliação já entregue');
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.lms_conteudo_operacional op
        WHERE op.id_conteudo = v_sub.id_conteudo
          AND op.data_entrega_limite IS NOT NULL
          AND op.data_entrega_limite < NOW()
    ) THEN
        RETURN jsonb_build_object('success', false, 'code', 'PRAZO_EXPIRADO', 'message', 'prazo de envio expirado');
    END IF;

    -- Autoavaliação? (para calcular a nota na hora)
    SELECT COALESCE(av.autoavaliacao, false)
    INTO v_autoavaliacao
    FROM public.lms_avaliacao av
    WHERE av.id_conteudo = v_sub.id_conteudo;

    DELETE FROM public.lms_resposta_aluno WHERE id_submissao_avaliacao = p_id_submissao;

    FOR v_resposta IN SELECT value AS r FROM jsonb_array_elements(p_respostas)
    LOOP
        v_id_pergunta := NULLIF(v_resposta.r->>'id_pergunta', '')::UUID;
        v_id_resp_possivel := NULLIF(v_resposta.r->>'id_resposta_possivel', '')::UUID;
        v_texto := NULLIF(v_resposta.r->>'texto_resposta', '');
        v_id_arquivo_envio := NULLIF(v_resposta.r->>'id_arquivo_envio', '')::UUID;

        IF v_id_pergunta IS NULL THEN CONTINUE; END IF;

        INSERT INTO public.lms_resposta_aluno
            (id_submissao_avaliacao, id_pergunta, id_resposta_possivel, texto_resposta, id_arquivo_envio)
        VALUES
            (p_id_submissao, v_id_pergunta, v_id_resp_possivel, v_texto, v_id_arquivo_envio);
    END LOOP;

    -- Autoavaliação: soma as pontuações das respostas corretas
    IF v_autoavaliacao THEN
        SELECT COALESCE(SUM(p.pontuacao), 0)
        INTO v_nota
        FROM public.lms_resposta_aluno ra
        JOIN public.lms_pergunta p ON p.id = ra.id_pergunta
        JOIN public.lms_resposta_possivel rp ON rp.id = ra.id_resposta_possivel
        WHERE ra.id_submissao_avaliacao = p_id_submissao
          AND rp.correta = true;
    END IF;

    UPDATE public.lms_submissao_avaliacao
    SET data_entrega = NOW(),
        status = 'entregue',
        nota_total = v_nota,
        modificado_em = NOW()
    WHERE id = p_id_submissao;

    INSERT INTO public.lms_progresso_aluno (id_entidade, id_conteudo, id_matricula, concluido, visto_em)
    VALUES (v_sub.id_entidade, v_sub.id_conteudo, v_sub.id_matricula, true, NOW())
    ON CONFLICT (id_conteudo, id_matricula) DO UPDATE
        SET concluido = true, modificado_em = NOW();

    RETURN jsonb_build_object('success', true, 'id', p_id_submissao, 'qtd_respostas', jsonb_array_length(p_respostas), 'nota_total', v_nota);
END;
$$;
