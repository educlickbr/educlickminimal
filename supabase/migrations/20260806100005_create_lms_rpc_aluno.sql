-- ============================================================
-- Migration: create_lms_rpc_aluno (Módulo Minhas Atividades)
-- Data: 2026-08-06
-- Descrição: RLS + RPCs do lado do ALUNO (SECURITY INVOKER).
--
-- Estratégia de RLS (acordo do projeto: INVOKER sempre):
--   • Tabelas de CONTEÚDO (lms_conteudo, operacional, distribuição,
--     avaliação, perguntas, alternativas): estudante tem SELECT
--     amplo (somente da sua entidade via JWT) — RLS barato, sem
--     join de matrícula. O filtro fino (programa/matrícula/timing)
--     acontece na RPC.
--   • Tabelas de SUBMISSÃO (o que o aluno posta): RLS restrita à
--     própria matrícula (id_matricula → user_expandido → auth.uid()).
--
-- Correções incluídas:
--   • lms_usuario_eh_gestor() agora EXCLUI aca_estudante/aca_candidato
--     (antes qualquer aca_% era "gestor" — falha latente).
--   • Policies antigas de aluno usavam papel 'aluno' (não existe) —
--     recriadas com o helper lms_usuario_eh_estudante().
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 0. Helpers
-- ═══════════════════════════════════════════════════════════

-- Corrige gestor: admin + aca_* EXCETO estudante/candidato
CREATE OR REPLACE FUNCTION public.lms_usuario_eh_gestor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT (auth.jwt() ->> 'papel') = 'admin'
        OR (
            (auth.jwt() ->> 'papel') LIKE 'aca_%'
            AND (auth.jwt() ->> 'papel') NOT IN ('aca_estudante', 'aca_candidato')
        );
$$;

-- Novo helper: estudante
CREATE OR REPLACE FUNCTION public.lms_usuario_eh_estudante()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT (auth.jwt() ->> 'papel') = 'aca_estudante';
$$;

-- ═══════════════════════════════════════════════════════════
-- 0.1 Enum: rascunho
-- ═══════════════════════════════════════════════════════════
ALTER TYPE public.lms_status_submissao ADD VALUE IF NOT EXISTS 'rascunho';

-- ═══════════════════════════════════════════════════════════
-- 1. RLS — Tabelas de CONTEÚDO: estudante SELECT amplo (entidade)
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "lms_conteudo: estudante select" ON public.lms_conteudo
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_conteudo_operacional: estudante select" ON public.lms_conteudo_operacional
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_distribuicao: estudante select" ON public.lms_distribuicao
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND public.lms_usuario_pertence_entidade(id_entidade)
    );

CREATE POLICY "lms_avaliacao: estudante select" ON public.lms_avaliacao
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND EXISTS (
            SELECT 1 FROM public.lms_conteudo c
            WHERE c.id = lms_avaliacao.id_conteudo
              AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    );

CREATE POLICY "lms_pergunta: estudante select" ON public.lms_pergunta
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND EXISTS (
            SELECT 1 FROM public.lms_avaliacao av
            JOIN public.lms_conteudo c ON c.id = av.id_conteudo
            WHERE av.id = lms_pergunta.id_avaliacao
              AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    );

CREATE POLICY "lms_resposta_possivel: estudante select" ON public.lms_resposta_possivel
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND EXISTS (
            SELECT 1 FROM public.lms_pergunta p
            JOIN public.lms_avaliacao av ON av.id = p.id_avaliacao
            JOIN public.lms_conteudo c ON c.id = av.id_conteudo
            WHERE p.id = lms_resposta_possivel.id_pergunta
              AND public.lms_usuario_pertence_entidade(c.id_entidade)
        )
    );

-- ═══════════════════════════════════════════════════════════
-- 2. RLS — Tabelas de SUBMISSÃO: recria policies de aluno
--    (drop das antigas com papel 'aluno' inexistente)
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "lms_submissao_atividade: aluno select own" ON public.lms_submissao_atividade;
DROP POLICY IF EXISTS "lms_submissao_atividade: aluno insert own" ON public.lms_submissao_atividade;
DROP POLICY IF EXISTS "lms_submissao_atividade: aluno update own" ON public.lms_submissao_atividade;
DROP POLICY IF EXISTS "lms_submissao_avaliacao: aluno select own" ON public.lms_submissao_avaliacao;
DROP POLICY IF EXISTS "lms_submissao_avaliacao: aluno insert own" ON public.lms_submissao_avaliacao;
DROP POLICY IF EXISTS "lms_submissao_avaliacao: aluno update own" ON public.lms_submissao_avaliacao;
DROP POLICY IF EXISTS "lms_resposta_aluno: aluno insert own" ON public.lms_resposta_aluno;
DROP POLICY IF EXISTS "lms_progresso_aluno: aluno select own" ON public.lms_progresso_aluno;
DROP POLICY IF EXISTS "lms_progresso_aluno: aluno upsert" ON public.lms_progresso_aluno;

-- lms_submissao_atividade: estudante own
CREATE POLICY "lms_submissao_atividade: estudante select own" ON public.lms_submissao_atividade
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_submissao_atividade: estudante insert own" ON public.lms_submissao_atividade
    FOR INSERT TO authenticated
    WITH CHECK (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_submissao_atividade: estudante update own" ON public.lms_submissao_atividade
    FOR UPDATE TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

-- lms_submissao_avaliacao: estudante own
CREATE POLICY "lms_submissao_avaliacao: estudante select own" ON public.lms_submissao_avaliacao
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_submissao_avaliacao: estudante insert own" ON public.lms_submissao_avaliacao
    FOR INSERT TO authenticated
    WITH CHECK (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_submissao_avaliacao: estudante update own" ON public.lms_submissao_avaliacao
    FOR UPDATE TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

-- lms_resposta_aluno: estudante select/insert own
CREATE POLICY "lms_resposta_aluno: estudante select own" ON public.lms_resposta_aluno
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND EXISTS (
            SELECT 1 FROM public.lms_submissao_avaliacao sa
            JOIN public.aca_matricula m ON m.id = sa.id_matricula
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE sa.id = lms_resposta_aluno.id_submissao_avaliacao
              AND ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_resposta_aluno: estudante insert own" ON public.lms_resposta_aluno
    FOR INSERT TO authenticated
    WITH CHECK (
        public.lms_usuario_eh_estudante()
        AND EXISTS (
            SELECT 1 FROM public.lms_submissao_avaliacao sa
            JOIN public.aca_matricula m ON m.id = sa.id_matricula
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE sa.id = lms_resposta_aluno.id_submissao_avaliacao
              AND ue.id_user = auth.uid()
        )
    );

-- lms_progresso_aluno: estudante select/insert/update own
CREATE POLICY "lms_progresso_aluno: estudante select own" ON public.lms_progresso_aluno
    FOR SELECT TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_progresso_aluno: estudante insert own" ON public.lms_progresso_aluno
    FOR INSERT TO authenticated
    WITH CHECK (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

CREATE POLICY "lms_progresso_aluno: estudante update own" ON public.lms_progresso_aluno
    FOR UPDATE TO authenticated
    USING (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_estudante()
        AND id_matricula IN (
            SELECT m.id FROM public.aca_matricula m
            JOIN public.user_expandido ue ON ue.id = m.id_usuario
            WHERE ue.id_user = auth.uid()
        )
    );

-- ═══════════════════════════════════════════════════════════
-- 3. RPCs do aluno — SECURITY INVOKER
--    (RLS resolve o acesso; validações de negócio ficam na RPC)
-- ═══════════════════════════════════════════════════════════

-- 3.1 lms_get_programas_do_aluno
CREATE OR REPLACE FUNCTION public.lms_get_programas_do_aluno(
    p_id_entidade UUID,
    p_id_usuario UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_itens JSONB;
BEGIN
    IF p_id_usuario IS DISTINCT FROM public.lms_user_expandido_id() THEN
        RETURN jsonb_build_object('success', false, 'code', 'ACESSO_NEGADO', 'message', 'Acesso negado');
    END IF;

    SELECT COALESCE(jsonb_agg(sub ORDER BY sub.descricao), '[]'::jsonb) INTO v_itens FROM (
        SELECT
            m.id AS id_matricula,
            p.id AS id_programa,
            p.descricao,
            c.nome_curso,
            (SELECT COUNT(*) FROM public.aca_ciclo_programa cp WHERE cp.id_programa = p.id) AS qtd_ciclos
        FROM public.aca_matricula m
        JOIN public.aca_programa p ON p.id = m.id_programa
        JOIN public.aca_curso c ON c.id = p.id_curso
        WHERE m.id_entidade = p_id_entidade
          AND m.id_usuario = p_id_usuario
    ) sub;

    RETURN jsonb_build_object('itens', v_itens);
END;
$$;

-- 3.2 lms_get_conteudos_do_aluno
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
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa FROM public.lms_submissao_atividade
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
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa FROM public.lms_submissao_atividade
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
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa FROM public.lms_submissao_atividade
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
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_distribuicao d
            JOIN public.lms_conteudo c ON c.id = d.id_conteudo
            LEFT JOIN public.lms_conteudo_operacional op
                ON op.id_conteudo = d.id_conteudo AND op.id_programa = p_id_programa
                AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa FROM public.lms_submissao_atividade
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
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa FROM public.lms_submissao_atividade
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
                sub_av.status AS avaliacao_status, sub_av.nota_total AS avaliacao_nota, sub_av.tentativa AS avaliacao_tentativa,
                COALESCE(prog.concluido, false) AS concluido
            FROM public.lms_conteudo_operacional op
            JOIN public.lms_conteudo c ON c.id = op.id_conteudo
            LEFT JOIN LATERAL (
                SELECT status, nota, tentativa FROM public.lms_submissao_atividade
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

-- 3.3 lms_get_avaliacao_para_aluno (perguntas SEM correta)
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
        SELECT jsonb_agg(sub ORDER BY sub.ordem) FROM (
            SELECT
                p.id AS id_pergunta, p.tipo, p.enunciado, p.pontuacao, p.obrigatoria, p.ordem, p.id_arquivo,
                COALESCE((
                    SELECT jsonb_agg(alt ORDER BY alt.ordem) FROM (
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

-- 3.4 lms_iniciar_submissao_avaliacao
CREATE OR REPLACE FUNCTION public.lms_iniciar_submissao_avaliacao(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_id_matricula UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_op RECORD;
    v_tentativa INTEGER;
    v_sub_id UUID;
    v_qtd_submissoes INTEGER;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.aca_matricula
        WHERE id = p_id_matricula AND id_usuario = public.lms_user_expandido_id()
    ) THEN
        RETURN jsonb_build_object('success', false, 'code', 'MATRICULA_INVALIDA', 'message', 'Matrícula inválida');
    END IF;

    SELECT op.*, c.tipo
    INTO v_op
    FROM public.lms_conteudo_operacional op
    JOIN public.lms_conteudo c ON c.id = op.id_conteudo
    WHERE op.id_conteudo = p_id_conteudo
      AND op.id_entidade = p_id_entidade
      AND op.ativo = true
    LIMIT 1;

    IF NOT FOUND OR v_op.tipo <> 'avaliacao' THEN
        RETURN jsonb_build_object('success', false, 'code', 'NAO_DISPONIVEL', 'message', 'Conteúdo não disponível');
    END IF;

    IF v_op.data_disponivel IS NOT NULL AND v_op.data_disponivel > NOW() THEN
        RETURN jsonb_build_object('success', false, 'code', 'NAO_DISPONIVEL', 'message', 'Avaliação ainda não disponível');
    END IF;

    IF v_op.data_entrega_limite IS NOT NULL AND v_op.data_entrega_limite < NOW() THEN
        RETURN jsonb_build_object('success', false, 'code', 'PRAZO_EXPIRADO', 'message', 'prazo de envio expirado');
    END IF;

    SELECT COUNT(*) INTO v_qtd_submissoes
    FROM public.lms_submissao_avaliacao
    WHERE id_conteudo = p_id_conteudo AND id_matricula = p_id_matricula
      AND status <> 'rascunho';

    IF v_op.tentativas_permitidas IS NOT NULL AND v_qtd_submissoes >= v_op.tentativas_permitidas THEN
        RETURN jsonb_build_object('success', false, 'code', 'SEM_TENTATIVAS', 'message', 'Número máximo de tentativas atingido');
    END IF;

    SELECT COALESCE(MAX(tentativa), 0) + 1 INTO v_tentativa
    FROM public.lms_submissao_avaliacao
    WHERE id_conteudo = p_id_conteudo AND id_matricula = p_id_matricula;

    INSERT INTO public.lms_submissao_avaliacao
        (id_entidade, id_conteudo, id_matricula, tentativa, data_inicio, status)
    VALUES
        (p_id_entidade, p_id_conteudo, p_id_matricula, v_tentativa, NOW(), 'em_andamento')
    RETURNING id INTO v_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_sub_id,
        'tentativa', v_tentativa,
        'duracao_minutos', v_op.duracao_minutos,
        'data_entrega_limite', v_op.data_entrega_limite
    );
END;
$$;

-- 3.5 lms_upsert_submissao_atividade (rascunho/entrega)
CREATE OR REPLACE FUNCTION public.lms_upsert_submissao_atividade(
    p_id_conteudo UUID,
    p_id_entidade UUID,
    p_id_matricula UUID,
    p_texto_resposta TEXT DEFAULT NULL,
    p_id_arquivo_envio UUID DEFAULT NULL,
    p_status TEXT DEFAULT 'rascunho'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_op RECORD;
    v_sub_id UUID;
    v_tentativa INTEGER;
    v_status_enum lms_status_submissao;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.aca_matricula
        WHERE id = p_id_matricula AND id_usuario = public.lms_user_expandido_id()
    ) THEN
        RETURN jsonb_build_object('success', false, 'code', 'MATRICULA_INVALIDA', 'message', 'Matrícula inválida');
    END IF;

    SELECT op.*, c.tipo
    INTO v_op
    FROM public.lms_conteudo_operacional op
    JOIN public.lms_conteudo c ON c.id = op.id_conteudo
    WHERE op.id_conteudo = p_id_conteudo
      AND op.id_entidade = p_id_entidade
      AND op.ativo = true
    LIMIT 1;

    IF NOT FOUND OR v_op.tipo <> 'atividade' THEN
        RETURN jsonb_build_object('success', false, 'code', 'NAO_DISPONIVEL', 'message', 'Conteúdo não disponível');
    END IF;

    IF v_op.data_disponivel IS NOT NULL AND v_op.data_disponivel > NOW() THEN
        RETURN jsonb_build_object('success', false, 'code', 'NAO_DISPONIVEL', 'message', 'Atividade ainda não disponível');
    END IF;

    IF p_status = 'entregue' AND v_op.data_entrega_limite IS NOT NULL AND v_op.data_entrega_limite < NOW() THEN
        RETURN jsonb_build_object('success', false, 'code', 'PRAZO_EXPIRADO', 'message', 'prazo de envio expirado');
    END IF;

    IF p_status = 'entregue' AND EXISTS (
        SELECT 1 FROM public.lms_submissao_atividade
        WHERE id_conteudo = p_id_conteudo AND id_matricula = p_id_matricula AND status = 'entregue'
    ) THEN
        RETURN jsonb_build_object('success', false, 'code', 'JA_ENTREGUE', 'message', 'Atividade já entregue');
    END IF;

    IF p_status = 'entregue' THEN
        v_status_enum := 'entregue'::lms_status_submissao;
    ELSE
        v_status_enum := 'rascunho'::lms_status_submissao;
    END IF;

    SELECT id, tentativa INTO v_sub_id, v_tentativa
    FROM public.lms_submissao_atividade
    WHERE id_conteudo = p_id_conteudo AND id_matricula = p_id_matricula
    ORDER BY tentativa DESC LIMIT 1;

    IF v_sub_id IS NULL THEN
        v_tentativa := 1;
        INSERT INTO public.lms_submissao_atividade
            (id_entidade, id_conteudo, id_matricula, tentativa, data_inicio, status)
        VALUES
            (p_id_entidade, p_id_conteudo, p_id_matricula, v_tentativa, NOW(), v_status_enum)
        RETURNING id INTO v_sub_id;
    ELSE
        UPDATE public.lms_submissao_atividade
        SET texto_resposta = COALESCE(p_texto_resposta, texto_resposta),
            id_arquivo_envio = COALESCE(p_id_arquivo_envio, id_arquivo_envio),
            status = v_status_enum,
            data_envio = CASE WHEN v_status_enum = 'entregue' THEN NOW() ELSE data_envio END,
            modificado_em = NOW()
        WHERE id = v_sub_id;
    END IF;

    IF v_status_enum = 'entregue' THEN
        INSERT INTO public.lms_progresso_aluno (id_entidade, id_conteudo, id_matricula, concluido, visto_em)
        VALUES (p_id_entidade, p_id_conteudo, p_id_matricula, true, NOW())
        ON CONFLICT (id_conteudo, id_matricula) DO UPDATE
            SET concluido = true, modificado_em = NOW();
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_sub_id, 'tentativa', v_tentativa, 'status', v_status_enum::text);
END;
$$;

-- 3.6 lms_finalizar_submissao_avaliacao (respostas + entrega)
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

        IF v_id_pergunta IS NULL THEN CONTINUE; END IF;

        INSERT INTO public.lms_resposta_aluno
            (id_submissao_avaliacao, id_pergunta, id_resposta_possivel, texto_resposta)
        VALUES
            (p_id_submissao, v_id_pergunta, v_id_resp_possivel, v_texto);
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
