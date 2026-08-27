-- ═══════════════════════════════════════════════════════════
-- LMS — Aluno vê o feedback da correção (comentário do professor)
-- Data: 2026-08-20
-- lms_get_conteudos_do_aluno agora retorna, para atividade e
-- avaliação, a última submissão com:
--   atividade_comentario / avaliacao_comentario  (feedback do docente)
--   atividade_corrigido_em / avaliacao_corrigido_em
--   atividade_corrigido_por_nome / avaliacao_corrigido_por_nome
-- SECURITY INVOKER (acordo do projeto — nunca DEFINER)
-- ═══════════════════════════════════════════════════════════

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
                sub_atv.comentario AS atividade_comentario,
                sub_atv.corrigido_em AS atividade_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_atv.corrigido_por) AS atividade_corrigido_por_nome,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                sub_av.comentario AS avaliacao_comentario,
                sub_av.corrigido_em AS avaliacao_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_av.corrigido_por) AS avaliacao_corrigido_por_nome,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_atividade
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_avaliacao
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
                sub_atv.comentario AS atividade_comentario,
                sub_atv.corrigido_em AS atividade_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_atv.corrigido_por) AS atividade_corrigido_por_nome,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                sub_av.comentario AS avaliacao_comentario,
                sub_av.corrigido_em AS avaliacao_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_av.corrigido_por) AS avaliacao_corrigido_por_nome,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_atividade
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_avaliacao
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
                sub_atv.comentario AS atividade_comentario,
                sub_atv.corrigido_em AS atividade_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_atv.corrigido_por) AS atividade_corrigido_por_nome,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                sub_av.comentario AS avaliacao_comentario,
                sub_av.corrigido_em AS avaliacao_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_av.corrigido_por) AS avaliacao_corrigido_por_nome,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_atividade
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_avaliacao
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
                sub_atv.comentario AS atividade_comentario,
                sub_atv.corrigido_em AS atividade_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_atv.corrigido_por) AS atividade_corrigido_por_nome,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                sub_av.comentario AS avaliacao_comentario,
                sub_av.corrigido_em AS avaliacao_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_av.corrigido_por) AS avaliacao_corrigido_por_nome,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_atividade
                WHERE id_conteudo = d.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_avaliacao
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
                sub_atv.comentario AS atividade_comentario,
                sub_atv.corrigido_em AS atividade_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_atv.corrigido_por) AS atividade_corrigido_por_nome,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                sub_av.comentario AS avaliacao_comentario,
                sub_av.corrigido_em AS avaliacao_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_av.corrigido_por) AS avaliacao_corrigido_por_nome,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_atividade
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_avaliacao
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
                sub_atv.comentario AS atividade_comentario,
                sub_atv.corrigido_em AS atividade_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_atv.corrigido_por) AS atividade_corrigido_por_nome,
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                sub_av.comentario AS avaliacao_comentario,
                sub_av.corrigido_em AS avaliacao_corrigido_em,
                (SELECT nome_completo FROM public.user_expandido WHERE id = sub_av.corrigido_por) AS avaliacao_corrigido_por_nome,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa, texto_resposta, id_arquivo_envio, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_atividade
                WHERE id_conteudo = op.id_conteudo AND id_matricula = p_id_matricula
                ORDER BY tentativa DESC LIMIT 1
            ) sub_atv ON true
            LEFT JOIN LATERAL (
                SELECT status, nota_total, tentativa, comentario, corrigido_por, corrigido_em FROM public.lms_submissao_avaliacao
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
