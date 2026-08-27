-- ═══════════════════════════════════════════════════════════
-- LMS Fase 2.4 — Auditoria da correção (quem + quando)
-- Data: 2026-08-20
-- 1. Colunas corrigido_por / corrigido_em nas submissões
-- 2. lms_salvar_correcao grava quem/quando
-- 3. lms_get_entrega_detalhe e lms_list_entregas_conteudo
--    retornam corrigido_por/corrigido_em/corrigido_por_nome
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- 1. Colunas de auditoria
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.lms_submissao_atividade
    ADD COLUMN IF NOT EXISTS corrigido_por UUID REFERENCES public.user_expandido(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS corrigido_em TIMESTAMPTZ;

ALTER TABLE public.lms_submissao_avaliacao
    ADD COLUMN IF NOT EXISTS corrigido_por UUID REFERENCES public.user_expandido(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS corrigido_em TIMESTAMPTZ;

-- ───────────────────────────────────────────────────────────
-- 2. lms_salvar_correcao — grava quem/quando
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lms_salvar_correcao(
    p_tipo TEXT,
    p_id_submissao UUID,
    p_nota NUMERIC,
    p_comentario TEXT,
    p_id_entidade UUID,
    p_id_usuario UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteudo_id UUID;
BEGIN
    IF p_id_usuario IS DISTINCT FROM public.lms_user_expandido_id() THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Acesso negado');
    END IF;

    IF p_tipo = 'atividade' THEN
        SELECT id_conteudo INTO v_conteudo_id FROM public.lms_submissao_atividade WHERE id = p_id_submissao;
    ELSE
        SELECT id_conteudo INTO v_conteudo_id FROM public.lms_submissao_avaliacao WHERE id = p_id_submissao;
    END IF;

    IF v_conteudo_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'SUBMISSAO_INVALIDA', 'message', 'Submissão inválida');
    END IF;

    -- Só o criador do conteúdo corrige
    IF NOT EXISTS (
        SELECT 1 FROM public.lms_conteudo
        WHERE id = v_conteudo_id AND id_entidade = p_id_entidade AND criado_por = p_id_usuario
    ) THEN
        RETURN jsonb_build_object('success', false, 'code', 'SEM_PERMISSAO', 'message', 'Apenas o criador do conteúdo pode corrigir');
    END IF;

    IF p_tipo = 'atividade' THEN
        UPDATE public.lms_submissao_atividade
        SET nota = p_nota,
            comentario = p_comentario,
            corrigido_por = p_id_usuario,
            corrigido_em = NOW(),
            modificado_em = NOW()
        WHERE id = p_id_submissao;
    ELSE
        UPDATE public.lms_submissao_avaliacao
        SET nota_total = p_nota,
            comentario = p_comentario,
            corrigido_por = p_id_usuario,
            corrigido_em = NOW(),
            modificado_em = NOW()
        WHERE id = p_id_submissao;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', p_id_submissao);
END;
$$;

-- ───────────────────────────────────────────────────────────
-- 3. lms_get_entrega_detalhe — retorna auditoria da correção
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lms_get_entrega_detalhe(
    p_id_submissao UUID,
    p_tipo TEXT,
    p_id_entidade UUID,
    p_id_usuario UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteudo_id UUID;
    v_pode_ver BOOLEAN;
    v_entrega JSONB;
    v_perguntas JSONB;
    v_result JSONB;
BEGIN
    IF p_id_usuario IS DISTINCT FROM public.lms_user_expandido_id() THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Acesso negado');
    END IF;

    IF p_tipo = 'atividade' THEN
        SELECT id_conteudo INTO v_conteudo_id FROM public.lms_submissao_atividade WHERE id = p_id_submissao;
    ELSE
        SELECT id_conteudo INTO v_conteudo_id FROM public.lms_submissao_avaliacao WHERE id = p_id_submissao;
    END IF;

    IF v_conteudo_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'SUBMISSAO_INVALIDA', 'message', 'Submissão inválida');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.lms_conteudo c
        WHERE c.id = v_conteudo_id AND c.id_entidade = p_id_entidade
          AND (
              c.criado_por = p_id_usuario
              OR EXISTS (
                  SELECT 1 FROM public.lms_conteudo_operacional op
                  WHERE op.id_conteudo = c.id
                    AND op.id_programa IN (SELECT * FROM public.lms_programas_do_docente(p_id_usuario))
              )
          )
    ) INTO v_pode_ver;

    IF NOT v_pode_ver THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Sem acesso a este conteúdo');
    END IF;

    IF p_tipo = 'atividade' THEN
        SELECT jsonb_build_object(
            'tipo', 'atividade',
            'id_submissao', sa.id,
            'titulo', c.titulo,
            'texto_resposta', sa.texto_resposta,
            'id_arquivo_envio', sa.id_arquivo_envio,
            'nota', sa.nota,
            'comentario', sa.comentario,
            'tentativa', sa.tentativa,
            'corrigido_por', sa.corrigido_por,
            'corrigido_em', sa.corrigido_em,
            'corrigido_por_nome', uec.nome_completo,
            'eh_meu', (c.criado_por = p_id_usuario)
        )
        INTO v_result
        FROM public.lms_submissao_atividade sa
        JOIN public.lms_conteudo c ON c.id = sa.id_conteudo
        LEFT JOIN public.user_expandido uec ON uec.id = sa.corrigido_por
        WHERE sa.id = p_id_submissao;

        RETURN v_result;
    END IF;

    -- Avaliação: entrega + perguntas com resposta do aluno + gabarito
    SELECT jsonb_build_object(
        'tipo', 'avaliacao',
        'id_submissao', sav.id,
        'titulo', c.titulo,
        'nome', av.nome,
        'nota', sav.nota_total,
        'comentario', sav.comentario,
        'tentativa', sav.tentativa,
        'corrigido_por', sav.corrigido_por,
        'corrigido_em', sav.corrigido_em,
        'corrigido_por_nome', uec.nome_completo,
        'eh_meu', (c.criado_por = p_id_usuario)
    )
    INTO v_entrega
    FROM public.lms_submissao_avaliacao sav
    JOIN public.lms_conteudo c ON c.id = sav.id_conteudo
    JOIN public.lms_avaliacao av ON av.id_conteudo = c.id
    LEFT JOIN public.user_expandido uec ON uec.id = sav.corrigido_por
    WHERE sav.id = p_id_submissao;

    SELECT COALESCE(jsonb_agg(sub ORDER BY sub.ordem), '[]'::jsonb)
    INTO v_perguntas
    FROM (
        SELECT
            p.id AS id_pergunta,
            p.enunciado,
            p.tipo,
            p.pontuacao,
            p.ordem,
            ra.texto_resposta AS resposta_texto,
            ra.id_resposta_possivel AS resposta_escolhida_id,
            COALESCE((
                SELECT jsonb_agg(alt ORDER BY alt.ordem) FROM (
                    SELECT
                        rp.id AS id_resposta_possivel,
                        rp.texto,
                        rp.correta,
                        rp.ordem,
                        (rp.id = ra.id_resposta_possivel) AS escolhida
                    FROM public.lms_resposta_possivel rp
                    WHERE rp.id_pergunta = p.id
                ) alt
            ), '[]'::jsonb) AS alternativas
        FROM public.lms_pergunta p
        LEFT JOIN public.lms_resposta_aluno ra
            ON ra.id_pergunta = p.id AND ra.id_submissao_avaliacao = p_id_submissao
        WHERE p.id_avaliacao = (SELECT id FROM public.lms_avaliacao WHERE id_conteudo = v_conteudo_id)
        ORDER BY p.ordem
    ) sub;

    RETURN v_entrega || jsonb_build_object('perguntas', v_perguntas);
END;
$$;

-- ───────────────────────────────────────────────────────────
-- 4. lms_list_entregas_conteudo — retorna auditoria da correção
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lms_list_entregas_conteudo(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_id_usuario UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_pode_ver BOOLEAN;
    v_itens JSONB;
BEGIN
    IF p_id_usuario IS DISTINCT FROM public.lms_user_expandido_id() THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Acesso negado');
    END IF;

    -- Só vê se for o criador OU conteúdo de programa que leciona
    SELECT EXISTS (
        SELECT 1 FROM public.lms_conteudo c
        WHERE c.id = p_id_conteudo AND c.id_entidade = p_id_entidade
          AND (
              c.criado_por = p_id_usuario
              OR EXISTS (
                  SELECT 1 FROM public.lms_conteudo_operacional op
                  WHERE op.id_conteudo = c.id
                    AND op.id_programa IN (SELECT * FROM public.lms_programas_do_docente(p_id_usuario))
              )
          )
    ) INTO v_pode_ver;

    IF NOT v_pode_ver THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Sem acesso a este conteúdo');
    END IF;

    SELECT COALESCE(jsonb_agg(sub ORDER BY sub.status_corrigido, sub.data_envio DESC), '[]'::jsonb)
    INTO v_itens
    FROM (
        SELECT
            sa.id AS id_submissao,
            'atividade' AS tipo_submissao,
            sa.id_matricula,
            COALESCE(ue.nome_completo, ue.email) AS aluno_nome,
            sa.status,
            sa.nota,
            sa.comentario,
            sa.data_envio,
            sa.tentativa,
            sa.corrigido_por,
            sa.corrigido_em,
            uec.nome_completo AS corrigido_por_nome,
            (sa.nota IS NOT NULL) AS status_corrigido
        FROM public.lms_submissao_atividade sa
        JOIN public.aca_matricula m ON m.id = sa.id_matricula
        JOIN public.user_expandido ue ON ue.id = m.id_usuario
        LEFT JOIN public.user_expandido uec ON uec.id = sa.corrigido_por
        WHERE sa.id_conteudo = p_id_conteudo AND sa.status = 'entregue'

        UNION ALL

        SELECT
            sav.id AS id_submissao,
            'avaliacao' AS tipo_submissao,
            sav.id_matricula,
            COALESCE(ue.nome_completo, ue.email) AS aluno_nome,
            sav.status,
            sav.nota_total AS nota,
            sav.comentario,
            sav.data_entrega AS data_envio,
            sav.tentativa,
            sav.corrigido_por,
            sav.corrigido_em,
            uec.nome_completo AS corrigido_por_nome,
            (sav.nota_total IS NOT NULL) AS status_corrigido
        FROM public.lms_submissao_avaliacao sav
        JOIN public.aca_matricula m ON m.id = sav.id_matricula
        JOIN public.user_expandido ue ON ue.id = m.id_usuario
        LEFT JOIN public.user_expandido uec ON uec.id = sav.corrigido_por
        WHERE sav.id_conteudo = p_id_conteudo AND sav.status = 'entregue'
    ) sub;

    RETURN jsonb_build_object('itens', v_itens);
END;
$$;
