-- ============================================================
-- Migration: create_aca_processo_seletivo
-- Data: 2026-06-03
-- Descrição: Cria a tabela de processos seletivos por programa
--            com auditoria e a mesma política RLS do módulo acadêmico.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.aca_processo_seletivo (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    id_programa UUID NOT NULL,
    nome_processo TEXT NOT NULL,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    criado_por UUID NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NULL,
    modificado_por UUID NULL,
    modificado_em TIMESTAMPTZ DEFAULT NOW() NULL,
    id_entidade UUID NOT NULL,
    CONSTRAINT aca_processo_seletivo_pkey PRIMARY KEY (id)
);

ALTER TABLE public.aca_processo_seletivo
    ADD CONSTRAINT aca_processo_seletivo_id_programa_fkey
    FOREIGN KEY (id_programa) REFERENCES public.aca_programa(id) ON DELETE CASCADE;

ALTER TABLE public.aca_processo_seletivo
    ADD CONSTRAINT aca_processo_seletivo_criado_por_fkey
    FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);

ALTER TABLE public.aca_processo_seletivo
    ADD CONSTRAINT aca_processo_seletivo_modificado_por_fkey
    FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);

ALTER TABLE public.aca_processo_seletivo
    ADD CONSTRAINT aca_processo_seletivo_id_entidade_fkey
    FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;

ALTER TABLE public.aca_processo_seletivo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aca_policy_all_access_aca_processo_seletivo" ON public.aca_processo_seletivo;

CREATE POLICY "aca_policy_all_access_aca_processo_seletivo"
ON public.aca_processo_seletivo
FOR ALL
USING (
    (
        (auth.jwt() ->> 'papel'::text) = 'admin'::text
        OR (auth.jwt() ->> 'papel'::text) LIKE 'aca_%'
    )
    AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(auth.jwt() -> 'entidades'::text) e(ent_id)
        WHERE (e.ent_id)::uuid = aca_processo_seletivo.id_entidade
    )
)
WITH CHECK (
    (
        (auth.jwt() ->> 'papel'::text) = 'admin'::text
        OR (auth.jwt() ->> 'papel'::text) LIKE 'aca_%'
    )
    AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(auth.jwt() -> 'entidades'::text) e(ent_id)
        WHERE (e.ent_id)::uuid = aca_processo_seletivo.id_entidade
    )
);
