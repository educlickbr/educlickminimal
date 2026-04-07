-- ============================================================
-- MIGRATION: aca_modulo_componente
-- Data: 2026-03-30
-- Descrição: Cria a tabela de junção formal entre módulos e
--            componentes, permitindo que um módulo seja composto
--            por múltiplos componentes com carga horária individual.
-- ============================================================

-- public.aca_modulo_componente definition

-- DROP TABLE public.aca_modulo_componente;

CREATE TABLE public.aca_modulo_componente (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_modulo uuid NOT NULL,
	id_componente uuid NOT NULL,
	carga_horaria int4 NULL,              -- minutos
	ordem int4 DEFAULT 0 NULL,            -- ordem de exibição do componente no módulo
	obrigatorio bool DEFAULT true NULL,   -- componente obrigatório ou eletivo no módulo
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
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


-- RLS Policies

CREATE POLICY "aca_modulo_componente: entidade pode ver os próprios"
	ON public.aca_modulo_componente
	FOR ALL
	USING (id_entidade = (
		SELECT ue.id FROM public.user_entidades ue
		INNER JOIN public.user_expandido uex ON uex.id_entidade = ue.id
		WHERE uex.id = auth.uid()
		LIMIT 1
	));
