-- ═══════════════════════════════════════════════════════════
-- Fix RLS: lms_resposta_aluno
-- Data: 2026-08-19
-- Problema: a migration 20260727100002 (refactor com DROP CASCADE)
-- recriou as policies de gestor das tabelas de submissão, mas
-- ESQUECEU lms_resposta_aluno. A 20260806100005 recriou apenas as
-- de estudante. Resultado: gestor (admin/docente) logado não
-- consegue INSERT em lms_resposta_aluno — a RPC
-- lms_finalizar_submissao_avaliacao falhava com:
--   "new row violates row-level security policy for table lms_resposta_aluno"
-- ═══════════════════════════════════════════════════════════

-- 1. Gestor all (mesmo formato da migration original 00000)
DROP POLICY IF EXISTS "lms_resposta_aluno: gestor all" ON public.lms_resposta_aluno;

CREATE POLICY "lms_resposta_aluno: gestor all" ON public.lms_resposta_aluno
    FOR ALL TO authenticated
    USING (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_submissao_avaliacao sa
            WHERE sa.id = lms_resposta_aluno.id_submissao_avaliacao
            AND public.lms_usuario_pertence_entidade(sa.id_entidade)
        )
    )
    WITH CHECK (
        public.lms_usuario_eh_gestor()
        AND EXISTS (
            SELECT 1 FROM public.lms_submissao_avaliacao sa
            WHERE sa.id = lms_resposta_aluno.id_submissao_avaliacao
            AND public.lms_usuario_pertence_entidade(sa.id_entidade)
        )
    );

-- 2. Estudante delete own — a RPC lms_finalizar_submissao_avaliacao
--    faz DELETE + INSERT das respostas; sem policy de DELETE o
--    DELETE era bloqueado silenciosamente pela RLS (relevante no
--    reenvio de avaliação).
DROP POLICY IF EXISTS "lms_resposta_aluno: estudante delete own" ON public.lms_resposta_aluno;

CREATE POLICY "lms_resposta_aluno: estudante delete own" ON public.lms_resposta_aluno
    FOR DELETE TO authenticated
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
