-- ═══════════════════════════════════════════════════════════
-- LMS Fase 2.0 — Dívidas rápidas
-- Data: 2026-08-19
-- 1. lms_get_conteudos_do_aluno: retorna texto/arquivo do
--    rascunho de atividade (pré-carregar ao reabrir)
-- 2. lms_get_avaliacao_para_aluno: ordem aleatória de perguntas
--    e alternativas quando lms_avaliacao.ordem_perguntas = 'aleatoria'
-- 3. lms_finalizar_submissao_avaliacao: grava id_arquivo_envio
--    na resposta dissertativa (lms_resposta_aluno)
-- Todas SECURITY INVOKER (acordo do projeto — nunca DEFINER)
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- 1. lms_get_conteudos_do_aluno — rascunho pré-carregado
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lms_get_conteudos_do_aluno(
    p_id_programa UUID,
    p_id_entidade UUID,
    p_id_matricula UUID,
    p_escopo_tipo TEXT,
    p_escopo_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_conteudos JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.aca_matricula
        WHERE id = p_id_matricula
          AND id_programa = p_id_programa
          AND id_usuario = public.lms_user_expandido_id()
    ) THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Acesso negado');
    END IF;

    IF p_escopo_tipo = 'programa' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.descricao, c.id_arquivo, c.url,
                CASE
                    WHEN op.data_disponivel IS NOT NULL AND op.data_disponivel > NOW() THEN 'agendado'
                    WHEN c.tipo IN ('atividade','avaliacao') AND op.data_entrega_limite IS NOT NULL AND op.data_entrega_limite < NOW() THEN 'prazo_encerrado'
                    ELSE 'disponivel'
                END AS status_visibilidade,
                op.data_disponivel, op.data_entrega_limite, op.duracao_minutos, op.tentativas_permitidas,
                sub_atv.status AS atividade_status, sub_atv.nota AS atividade_nota, sub_atv.tentativa AS atividade_tentativa,
                sub_atv.texto_resposta AS atividade_texto, sub_atv.id_arquivo_envio AS atividade_arquivo,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio FROM public.lms_submissao_atividade
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa FROM public.lms_submissao_avaliacao
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_av ON true
            LEFT JOIN public.lms_progresso_aluno prog
                ON prog.id_conteudo = op.id_conteudo AND prog.id_matricula = p_id_matricula
            WHERE op.id_programa = p_id_programa
              AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
              AND op.ativo = true
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'area' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.descricao, c.id_arquivo, c.url,
                CASE
                    WHEN op.data_disponivel IS NOT NULL AND op.data_disponivel > NOW() THEN 'agendado'
                    WHEN c.tipo IN ('atividade','avaliacao') AND op.data_entrega_limite IS NOT NULL AND op.data_entrega_limite < NOW() THEN 'prazo_encerrado'
                    ELSE 'disponivel'
                END AS status_visibilidade,
                op.data_disponivel, op.data_entrega_limite, op.duracao_minutos, op.tentativas_permitidas,
                sub_atv.status AS atividade_status, sub_atv.nota AS atividade_nota, sub_atv.tentativa AS atividade_tentativa,
                sub_atv.texto_resposta AS atividade_texto, sub_atv.id_arquivo_envio AS atividade_arquivo,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio FROM public.lms_submissao_atividade
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa FROM public.lms_submissao_avaliacao
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_av ON true
            LEFT JOIN public.lms_progresso_aluno prog
                ON prog.id_conteudo = d.id_conteudo AND prog.id_matricula = p_id_matricula
            WHERE d.id_area = p_escopo_id
              AND COALESCE(op.ativo, true) = true
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'componente' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.descricao, c.id_arquivo, c.url,
                CASE
                    WHEN op.data_disponivel IS NOT NULL AND op.data_disponivel > NOW() THEN 'agendado'
                    WHEN c.tipo IN ('atividade','avaliacao') AND op.data_entrega_limite IS NOT NULL AND op.data_entrega_limite < NOW() THEN 'prazo_encerrado'
                    ELSE 'disponivel'
                END AS status_visibilidade,
                op.data_disponivel, op.data_entrega_limite, op.duracao_minutos, op.tentativas_permitidas,
                sub_atv.status AS atividade_status, sub_atv.nota AS atividade_nota, sub_atv.tentativa AS atividade_tentativa,
                sub_atv.texto_resposta AS atividade_texto, sub_atv.id_arquivo_envio AS atividade_arquivo,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio FROM public.lms_submissao_atividade
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa FROM public.lms_submissao_avaliacao
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_av ON true
            LEFT JOIN public.lms_progresso_aluno prog
                ON prog.id_conteudo = d.id_conteudo AND prog.id_matricula = p_id_matricula
            WHERE d.id_componente = p_escopo_id AND d.id_modulo IS NULL
              AND COALESCE(op.ativo, true) = true
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'modulo' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (d.id_conteudo)
                d.id_conteudo, c.titulo, c.tipo, c.descricao, c.id_arquivo, c.url,
                CASE
                    WHEN op.data_disponivel IS NOT NULL AND op.data_disponivel > NOW() THEN 'agendado'
                    WHEN c.tipo IN ('atividade','avaliacao') AND op.data_entrega_limite IS NOT NULL AND op.data_entrega_limite < NOW() THEN 'prazo_encerrado'
                    ELSE 'disponivel'
                END AS status_visibilidade,
                op.data_disponivel, op.data_entrega_limite, op.duracao_minutos, op.tentativas_permitidas,
                sub_atv.status AS atividade_status, sub_atv.nota AS atividade_nota, sub_atv.tentativa AS atividade_tentativa,
                sub_atv.texto_resposta AS atividade_texto, sub_atv.id_arquivo_envio AS atividade_arquivo,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio FROM public.lms_submissao_atividade
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa FROM public.lms_submissao_avaliacao
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_av ON true
            LEFT JOIN public.lms_progresso_aluno prog
                ON prog.id_conteudo = d.id_conteudo AND prog.id_matricula = p_id_matricula
            WHERE d.id_modulo = p_escopo_id
              AND COALESCE(op.ativo, true) = true
            ORDER BY d.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'ciclo' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.descricao, c.id_arquivo, c.url,
                CASE
                    WHEN op.data_disponivel IS NOT NULL AND op.data_disponivel > NOW() THEN 'agendado'
                    WHEN c.tipo IN ('atividade','avaliacao') AND op.data_entrega_limite IS NOT NULL AND op.data_entrega_limite < NOW() THEN 'prazo_encerrado'
                    ELSE 'disponivel'
                END AS status_visibilidade,
                op.data_disponivel, op.data_entrega_limite, op.duracao_minutos, op.tentativas_permitidas,
                sub_atv.status AS atividade_status, sub_atv.nota AS atividade_nota, sub_atv.tentativa AS atividade_tentativa,
                sub_atv.texto_resposta AS atividade_texto, sub_atv.id_arquivo_envio AS atividade_arquivo,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio FROM public.lms_submissao_atividade
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa FROM public.lms_submissao_avaliacao
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_av ON true
            LEFT JOIN public.lms_progresso_aluno prog
                ON prog.id_conteudo = op.id_conteudo AND prog.id_matricula = p_id_matricula
            WHERE op.id_programa = p_id_programa
              AND op.id_ciclo = p_escopo_id AND op.id_calendario IS NULL
              AND op.ativo = true
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSIF p_escopo_tipo = 'calendario' THEN
        SELECT jsonb_agg(sub ORDER BY sub.titulo) INTO v_conteudos FROM (
            SELECT DISTINCT ON (op.id_conteudo)
                op.id_conteudo, c.titulo, c.tipo, c.descricao, c.id_arquivo, c.url,
                CASE
                    WHEN op.data_disponivel IS NOT NULL AND op.data_disponivel > NOW() THEN 'agendado'
                    WHEN c.tipo IN ('atividade','avaliacao') AND op.data_entrega_limite IS NOT NULL AND op.data_entrega_limite < NOW() THEN 'prazo_encerrado'
                    ELSE 'disponivel'
                END AS status_visibilidade,
                op.data_disponivel, op.data_entrega_limite, op.duracao_minutos, op.tentativas_permitidas,
                sub_atv.status AS atividade_status, sub_atv.nota AS atividade_nota, sub_atv.tentativa AS atividade_tentativa,
                sub_atv.texto_resposta AS atividade_texto, sub_atv.id_arquivo_envio AS atividade_arquivo,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio FROM public.lms_submissao_atividade
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa FROM public.lms_submissao_avaliacao
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_av ON true
            LEFT JOIN public.lms_progresso_aluno prog
                ON prog.id_conteudo = op.id_conteudo AND prog.id_matricula = p_id_matricula
            WHERE op.id_programa = p_id_programa
              AND op.id_calendario = p_escopo_id
              AND op.ativo = true
            ORDER BY op.id_conteudo, op.id DESC
        ) sub;

    ELSE
        v_conteudos := '[]'::jsonb;
    END IF;

    RETURN jsonb_build_object('conteudos', COALESCE(v_conteudos, '[]'::jsonb));
END;
$$;

-- ───────────────────────────────────────────────────────────
-- 2. lms_get_avaliacao_para_aluno — ordem aleatória
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

    SELECT av.id, av.ordem_perguntas
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
        'perguntas', v_perguntas
    );
END;
$$;

-- ───────────────────────────────────────────────────────────
-- 3. lms_finalizar_submissao_avaliacao — upload dissertativa
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

    UPDATE public.lms_submissao_avaliacao
    SET data_entrega = NOW(),
        status = 'entregue',
        modificado_em = NOW()
    WHERE id = p_id_submissao;

    INSERT INTO public.lms_progresso_aluno (id_entidade, id_conteudo, id_matricula, concluido, visto_em)
    VALUES (v_sub.id_entidade, v_sub.id_conteudo, v_sub.id_matricula, true, NOW())
    ON CONFLICT (id_conteudo, id_matricula) DO UPDATE
        SET concluido = true, modificado_em = NOW();

    RETURN jsonb_build_object('success', true, 'id', p_id_submissao, 'qtd_respostas', jsonb_array_length(p_respostas));
END;
$$;
