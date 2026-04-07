-- public.aca_calendario definition

-- Drop table

-- DROP TABLE public.aca_calendario;

CREATE TABLE public.aca_calendario (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_ciclo uuid NULL,
	observacao text NULL,
	dt_hora_ini timestamptz NULL,
	dt_hora_fim timestamptz NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_calendario_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_calendario ENABLE ROW LEVEL SECURITY;


-- public.aca_carga_horaria definition

-- Drop table

-- DROP TABLE public.aca_carga_horaria;

CREATE TABLE public.aca_carga_horaria (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_modulo uuid NULL,
	id_componente uuid NULL,
	carga_horaria int4 NOT NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_carga_horaria_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_carga_horaria ENABLE ROW LEVEL SECURITY;


-- public.aca_ciclo definition

-- Drop table

-- DROP TABLE public.aca_ciclo;

CREATE TABLE public.aca_ciclo (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_modulo uuid NULL,
	descricao text NULL,
	data_ini date NULL,
	data_fim date NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_ciclo_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_ciclo ENABLE ROW LEVEL SECURITY;


-- public.aca_ciclo_dia_semana definition

-- Drop table

-- DROP TABLE public.aca_ciclo_dia_semana;

CREATE TABLE public.aca_ciclo_dia_semana (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_ciclo uuid NULL,
	n_dia_sem int4 NULL,
	dia_sem_txt text NULL,
	hora_ini text NULL,
	hora_fim text NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_ciclo_dia_semana_n_dia_sem_check CHECK (((n_dia_sem >= 0) AND (n_dia_sem <= 6))),
	CONSTRAINT aca_ciclo_dia_semana_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_ciclo_dia_semana ENABLE ROW LEVEL SECURITY;


-- public.aca_ciclo_programa definition

-- Drop table

-- DROP TABLE public.aca_ciclo_programa;

CREATE TABLE public.aca_ciclo_programa (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_ciclo uuid NULL,
	id_programa uuid NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_ciclo_programa_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_ciclo_programa ENABLE ROW LEVEL SECURITY;


-- public.aca_componente definition

-- Drop table

-- DROP TABLE public.aca_componente;

CREATE TABLE public.aca_componente (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	nome_componente text NOT NULL,
	descricao text NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_componente_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_componente ENABLE ROW LEVEL SECURITY;


-- public.aca_curso definition

-- Drop table

-- DROP TABLE public.aca_curso;

CREATE TABLE public.aca_curso (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	nome_curso text NOT NULL,
	descricao text NULL,
	tipo_modelo text DEFAULT 'simples'::text NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_curso_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_curso ENABLE ROW LEVEL SECURITY;


-- public.aca_curso_modulo definition

-- Drop table

-- DROP TABLE public.aca_curso_modulo;

CREATE TABLE public.aca_curso_modulo (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_curso uuid NULL,
	id_modulo uuid NULL,
	ordem int4 DEFAULT 0 NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_curso_modulo_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_curso_modulo ENABLE ROW LEVEL SECURITY;


-- public.aca_modulo definition

-- Drop table

-- DROP TABLE public.aca_modulo;

CREATE TABLE public.aca_modulo (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	nome_modulo text NOT NULL,
	descricao text NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	carga_horaria int4 NULL,
	CONSTRAINT aca_modulo_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_modulo ENABLE ROW LEVEL SECURITY;


-- public.aca_plano_de_aula definition

-- Drop table

-- DROP TABLE public.aca_plano_de_aula;

CREATE TABLE public.aca_plano_de_aula (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_modulo uuid NULL,
	id_componente uuid NULL,
	titulo_plano text NOT NULL,
	ementa text NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_plano_de_aula_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_plano_de_aula ENABLE ROW LEVEL SECURITY;


-- public.aca_programa definition

-- Drop table

-- DROP TABLE public.aca_programa;

CREATE TABLE public.aca_programa (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_curso uuid NULL,
	descricao text NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_programa_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_programa ENABLE ROW LEVEL SECURITY;


-- public.aca_ref_plano_de_aula definition

-- Drop table

-- DROP TABLE public.aca_ref_plano_de_aula;

CREATE TABLE public.aca_ref_plano_de_aula (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_plano_aula uuid NULL,
	titulo text NULL,
	descricao text NULL,
	link text NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_ref_plano_de_aula_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_ref_plano_de_aula ENABLE ROW LEVEL SECURITY;


-- public.aca_calendario foreign keys

ALTER TABLE public.aca_calendario ADD CONSTRAINT aca_calendario_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_calendario ADD CONSTRAINT aca_calendario_id_ciclo_fkey FOREIGN KEY (id_ciclo) REFERENCES public.aca_ciclo(id);
ALTER TABLE public.aca_calendario ADD CONSTRAINT aca_calendario_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_calendario ADD CONSTRAINT aca_calendario_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_carga_horaria foreign keys

ALTER TABLE public.aca_carga_horaria ADD CONSTRAINT aca_carga_horaria_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_carga_horaria ADD CONSTRAINT aca_carga_horaria_id_componente_fkey FOREIGN KEY (id_componente) REFERENCES public.aca_componente(id);
ALTER TABLE public.aca_carga_horaria ADD CONSTRAINT aca_carga_horaria_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_carga_horaria ADD CONSTRAINT aca_carga_horaria_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.aca_modulo(id) ON DELETE CASCADE;
ALTER TABLE public.aca_carga_horaria ADD CONSTRAINT aca_carga_horaria_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_ciclo foreign keys

ALTER TABLE public.aca_ciclo ADD CONSTRAINT aca_ciclo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_ciclo ADD CONSTRAINT aca_ciclo_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ciclo ADD CONSTRAINT aca_ciclo_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.aca_modulo(id);
ALTER TABLE public.aca_ciclo ADD CONSTRAINT aca_ciclo_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_ciclo_dia_semana foreign keys

ALTER TABLE public.aca_ciclo_dia_semana ADD CONSTRAINT aca_ciclo_dia_semana_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_ciclo_dia_semana ADD CONSTRAINT aca_ciclo_dia_semana_id_ciclo_fkey FOREIGN KEY (id_ciclo) REFERENCES public.aca_ciclo(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ciclo_dia_semana ADD CONSTRAINT aca_ciclo_dia_semana_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ciclo_dia_semana ADD CONSTRAINT aca_ciclo_dia_semana_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_ciclo_programa foreign keys

ALTER TABLE public.aca_ciclo_programa ADD CONSTRAINT aca_ciclo_programa_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_ciclo_programa ADD CONSTRAINT aca_ciclo_programa_id_ciclo_fkey FOREIGN KEY (id_ciclo) REFERENCES public.aca_ciclo(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ciclo_programa ADD CONSTRAINT aca_ciclo_programa_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ciclo_programa ADD CONSTRAINT aca_ciclo_programa_id_programa_fkey FOREIGN KEY (id_programa) REFERENCES public.aca_programa(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ciclo_programa ADD CONSTRAINT aca_ciclo_programa_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_componente foreign keys

ALTER TABLE public.aca_componente ADD CONSTRAINT aca_componente_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_componente ADD CONSTRAINT aca_componente_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_componente ADD CONSTRAINT aca_componente_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_curso foreign keys

ALTER TABLE public.aca_curso ADD CONSTRAINT aca_curso_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_curso ADD CONSTRAINT aca_curso_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_curso ADD CONSTRAINT aca_curso_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_curso_modulo foreign keys

ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.aca_curso(id) ON DELETE CASCADE;
ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.aca_modulo(id);
ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_modulo foreign keys

ALTER TABLE public.aca_modulo ADD CONSTRAINT aca_modulo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_modulo ADD CONSTRAINT aca_modulo_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_modulo ADD CONSTRAINT aca_modulo_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_plano_de_aula foreign keys

ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_id_componente_fkey FOREIGN KEY (id_componente) REFERENCES public.aca_componente(id);
ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.aca_modulo(id);
ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_programa foreign keys

ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.aca_curso(id);
ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_ref_plano_de_aula foreign keys

ALTER TABLE public.aca_ref_plano_de_aula ADD CONSTRAINT aca_ref_plano_de_aula_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_ref_plano_de_aula ADD CONSTRAINT aca_ref_plano_de_aula_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ref_plano_de_aula ADD CONSTRAINT aca_ref_plano_de_aula_id_plano_aula_fkey FOREIGN KEY (id_plano_aula) REFERENCES public.aca_plano_de_aula(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ref_plano_de_aula ADD CONSTRAINT aca_ref_plano_de_aula_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);