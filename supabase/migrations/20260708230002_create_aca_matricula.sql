-- ============================================================
-- Migration: create aca_matricula table
-- Data: 2026-07-08
-- Descrição: Matrícula do aluno no programa acadêmico.
--            Pode vir de um pedido pago ou matrícula direta (grátis).
-- ============================================================

CREATE TABLE public.aca_matricula (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    id_entidade uuid NOT NULL,
    id_programa uuid NOT NULL,
    id_usuario uuid NOT NULL,
    id_pedido uuid NULL,

    declaracao_matricula boolean NOT NULL DEFAULT false,
    arquivo_declaracao_matricula uuid NULL,

    criado_por uuid NULL,
    criado_em timestamptz NULL DEFAULT now(),
    modificado_por uuid NULL,
    modificado_em timestamptz NULL DEFAULT now(),

    CONSTRAINT aca_matricula_pkey PRIMARY KEY (id),
    CONSTRAINT aca_matricula_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    CONSTRAINT aca_matricula_id_programa_fkey FOREIGN KEY (id_programa) REFERENCES public.aca_programa(id) ON DELETE CASCADE,
    CONSTRAINT aca_matricula_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.user_expandido(id) ON DELETE CASCADE,
    CONSTRAINT aca_matricula_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.com_pedido(id) ON DELETE SET NULL,
    CONSTRAINT aca_matricula_arquivo_fkey FOREIGN KEY (arquivo_declaracao_matricula) REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    CONSTRAINT aca_matricula_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id),
    CONSTRAINT aca_matricula_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id)
);

-- Um aluno só pode estar matriculado uma vez no mesmo programa
CREATE UNIQUE INDEX IF NOT EXISTS idx_aca_matricula_programa_usuario
    ON public.aca_matricula (id_programa, id_usuario);

-- Índice para buscar matrículas do usuário
CREATE INDEX IF NOT EXISTS idx_aca_matricula_usuario
    ON public.aca_matricula (id_usuario);

-- Índice para buscar matrículas do programa (admin)
CREATE INDEX IF NOT EXISTS idx_aca_matricula_programa
    ON public.aca_matricula (id_programa);

-- RLS
ALTER TABLE public.aca_matricula ENABLE ROW LEVEL SECURITY;

-- Aluno vê apenas suas próprias matrículas
CREATE POLICY aca_matricula_select_own ON public.aca_matricula
    FOR SELECT
    USING (
        id_usuario IN (
            SELECT id FROM public.user_expandido WHERE id_user = auth.uid()
        )
    );

-- Admin/entidade vê matrículas da entidade (futuro)
CREATE POLICY aca_matricula_select_admin ON public.aca_matricula
    FOR SELECT
    USING (
        id_entidade IN (
            SELECT id_entidade FROM public.user_entidade_user
            WHERE id_user = auth.uid()
        )
    );
