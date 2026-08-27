-- ═══════════════════════════════════════════════════════════
-- LMS Fase 2.4 — Fix: lms_get_entrega_detalhe (coluna alt.ordem)
-- Data: 2026-08-20
-- Erro em runtime: "column alt.ordem does not exist"
--   O jsonb_agg(alt ORDER BY alt.ordem) ordenava por uma coluna
--   que a derived table "alt" não selecionava. Adiciona rp.ordem.
-- ═══════════════════════════════════════════════════════════

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
            'eh_meu', (c.criado_por = p_id_usuario)
        )
        INTO v_result
        FROM public.lms_submissao_atividade sa
        JOIN public.lms_conteudo c ON c.id = sa.id_conteudo
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
        'eh_meu', (c.criado_por = p_id_usuario)
    )
    INTO v_entrega
    FROM public.lms_submissao_avaliacao sav
    JOIN public.lms_conteudo c ON c.id = sav.id_conteudo
    JOIN public.lms_avaliacao av ON av.id_conteudo = c.id
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
