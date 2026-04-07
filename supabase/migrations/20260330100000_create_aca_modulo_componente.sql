-- ============================================================
-- Cria a tabela aca_modulo_componente
-- Relação N:N formal entre módulos e componentes
-- Carga horária por componente dentro do módulo (em minutos)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.aca_modulo_componente (
    id             uuid DEFAULT gen_random_uuid() NOT NULL,
    id_modulo      uuid NOT NULL,
    id_componente  uuid NOT NULL,
    carga_horaria  integer DEFAULT NULL,
    ordem          integer DEFAULT 0 NULL,
    obrigatorio    boolean DEFAULT true NULL,
    criado_por     uuid NULL,
    criado_em      timestamptz DEFAULT now() NULL,
    modificado_por uuid NULL,
    modificado_em  timestamptz DEFAULT now() NULL,
    id_entidade    uuid NOT NULL,
    CONSTRAINT aca_modulo_componente_pkey PRIMARY KEY (id),
    CONSTRAINT aca_modulo_componente_unique UNIQUE (id_modulo, id_componente)
);

ALTER TABLE public.aca_modulo_componente ENABLE ROW LEVEL SECURITY;

-- Foreign Keys
ALTER TABLE public.aca_modulo_componente
    ADD CONSTRAINT aca_modulo_componente_id_modulo_fkey
    FOREIGN KEY (id_modulo) REFERENCES public.aca_modulo(id) ON DELETE CASCADE;

ALTER TABLE public.aca_modulo_componente
    ADD CONSTRAINT aca_modulo_componente_id_componente_fkey
    FOREIGN KEY (id_componente) REFERENCES public.aca_componente(id) ON DELETE CASCADE;

ALTER TABLE public.aca_modulo_componente
    ADD CONSTRAINT aca_modulo_componente_id_entidade_fkey
    FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;

ALTER TABLE public.aca_modulo_componente
    ADD CONSTRAINT aca_modulo_componente_criado_por_fkey
    FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);

ALTER TABLE public.aca_modulo_componente
    ADD CONSTRAINT aca_modulo_componente_modificado_por_fkey
    FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);

-- RLS Policies — mesmo padrão das tabelas fin_* do projeto
-- Segurança via JWT claims (entidades no token)

CREATE POLICY "aca_modulo_componente: select para admin e membros da entidade"
    ON public.aca_modulo_componente
    FOR SELECT
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE aca_modulo_componente.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "aca_modulo_componente: insert para admin e membros da entidade"
    ON public.aca_modulo_componente
    FOR INSERT
    WITH CHECK (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE aca_modulo_componente.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "aca_modulo_componente: update para admin e membros da entidade"
    ON public.aca_modulo_componente
    FOR UPDATE
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE aca_modulo_componente.id_entidade = e.ent::uuid
        ))
    );

CREATE POLICY "aca_modulo_componente: delete para admin e membros da entidade"
    ON public.aca_modulo_componente
    FOR DELETE
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE aca_modulo_componente.id_entidade = e.ent::uuid
        ))
    );
