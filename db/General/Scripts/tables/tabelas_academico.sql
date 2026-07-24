-- public.aca_area definition

-- Drop table

-- DROP TABLE public.aca_area;

CREATE TABLE public.aca_area (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	nome_area text NOT NULL,
	descricao text NULL,
	id_entidade uuid NOT NULL,
	criado_em timestamptz DEFAULT now() NULL,
	criado_por uuid NULL,
	CONSTRAINT aca_area_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_area ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Gestão de Áreas Educacionais (Entidade)" ON public.aca_area
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_area.id_entidade)))));


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
	status varchar(20) DEFAULT 'agendada'::character varying NULL,
	id_aula_origem uuid NULL,
	id_atribuicao_docente uuid NULL,
	CONSTRAINT aca_calendario_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_aca_calendario_atribuicao ON public.aca_calendario USING btree (id_atribuicao_docente);
ALTER TABLE public.aca_calendario ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_calendario: admin e membros podem ver" ON public.aca_calendario
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid IN ( SELECT c.id_entidade
           FROM aca_ciclo c
          WHERE (c.id = aca_calendario.id_ciclo)))))));
CREATE POLICY aca_policy_all_access_aca_calendario ON public.aca_calendario
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_calendario.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_calendario.id_entidade)))));


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
	ano_semestre varchar(10) NULL,
	turno public."tipo_turno" NULL,
	CONSTRAINT aca_ciclo_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_ciclo ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_ciclo: admin e membros podem ver" ON public.aca_ciclo
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid = aca_ciclo.id_entidade)))));
CREATE POLICY aca_policy_all_access_aca_ciclo ON public.aca_ciclo
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ciclo.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ciclo.id_entidade)))));


-- public.aca_ciclo_dia_extra definition

-- Drop table

-- DROP TABLE public.aca_ciclo_dia_extra;

CREATE TABLE public.aca_ciclo_dia_extra (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_ciclo uuid NOT NULL,
	"data" date NOT NULL,
	hora_ini time NOT NULL,
	hora_fim time NOT NULL,
	observacoes text NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_ciclo_dia_extra_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_ciclo_dia_extra ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_policy_all_access_aca_ciclo_dia_extra ON public.aca_ciclo_dia_extra
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ciclo_dia_extra.id_entidade)))));


-- public.aca_ciclo_dia_semana definition

-- Drop table

-- DROP TABLE public.aca_ciclo_dia_semana;

CREATE TABLE public.aca_ciclo_dia_semana (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_ciclo uuid NULL,
	n_dia_sem int4 NULL,
	dia_sem_txt text NULL,
	hora_ini time NULL,
	hora_fim time NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_ciclo_dia_semana_n_dia_sem_check CHECK (((n_dia_sem >= 0) AND (n_dia_sem <= 6))),
	CONSTRAINT aca_ciclo_dia_semana_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_ciclo_dia_semana ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_policy_all_access_aca_ciclo_dia_semana ON public.aca_ciclo_dia_semana
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ciclo_dia_semana.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ciclo_dia_semana.id_entidade)))));


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

-- Table Policies

CREATE POLICY "aca_ciclo_programa: admin e membros podem ver" ON public.aca_ciclo_programa
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid = aca_ciclo_programa.id_entidade)))));
CREATE POLICY aca_policy_all_access_aca_ciclo_programa ON public.aca_ciclo_programa
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ciclo_programa.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ciclo_programa.id_entidade)))));


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

-- Table Policies

CREATE POLICY "aca_componente: admin e membros podem ver" ON public.aca_componente
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid = aca_componente.id_entidade)))));
CREATE POLICY aca_policy_all_access_aca_componente ON public.aca_componente
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_componente.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_componente.id_entidade)))));


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
	projeto_pedagogico text NULL,
	vagas_sugeridas int4 DEFAULT 0 NULL,
	id_area uuid NULL,
	CONSTRAINT aca_curso_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_curso ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_policy_all_access_aca_curso ON public.aca_curso
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_curso.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_curso.id_entidade)))));


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
	CONSTRAINT aca_curso_modulo_pkey PRIMARY KEY (id),
	CONSTRAINT uq_aca_curso_modulo UNIQUE (id_curso, id_modulo)
);
ALTER TABLE public.aca_curso_modulo ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_policy_all_access_aca_curso_modulo ON public.aca_curso_modulo
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_curso_modulo.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_curso_modulo.id_entidade)))));


-- public.aca_docente definition

-- Drop table

-- DROP TABLE public.aca_docente;

CREATE TABLE public.aca_docente (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NOT NULL,
	id_user_expandido uuid NOT NULL,
	ativo bool DEFAULT true NOT NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz NULL,
	valor_hora_aula int4 NULL,
	CONSTRAINT aca_docente_id_entidade_id_user_expandido_key UNIQUE (id_entidade, id_user_expandido),
	CONSTRAINT aca_docente_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_aca_docente_ativo ON public.aca_docente USING btree (ativo);
CREATE INDEX idx_aca_docente_entidade ON public.aca_docente USING btree (id_entidade);
ALTER TABLE public.aca_docente ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_docente: admin e aca_ podem tudo na entidade" ON public.aca_docente
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_docente.id_entidade)))));


-- public.aca_docente_convite definition

-- Drop table

-- DROP TABLE public.aca_docente_convite;

CREATE TABLE public.aca_docente_convite (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NOT NULL,
	email text NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	usado bool DEFAULT false NOT NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	criado_por uuid NULL,
	convite_enviado bool DEFAULT false NOT NULL,
	CONSTRAINT aca_docente_convite_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_aca_docente_convite_token ON public.aca_docente_convite USING btree (token);
ALTER TABLE public.aca_docente_convite ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_docente_convite: admin e aca_ podem tudo na entidade" ON public.aca_docente_convite
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_docente_convite.id_entidade)))));


-- public.aca_docente_modulo_componente_ciclo definition

-- Drop table

-- DROP TABLE public.aca_docente_modulo_componente_ciclo;

CREATE TABLE public.aca_docente_modulo_componente_ciclo (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_ciclo uuid NOT NULL,
	id_modulo_componente uuid NOT NULL,
	id_docente uuid NOT NULL,
	tipo text DEFAULT 'titular'::text NOT NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz NULL,
	CONSTRAINT aca_docente_modulo_componente_ciclo_pkey PRIMARY KEY (id),
	CONSTRAINT aca_docente_modulo_componente_ciclo_tipo_check CHECK ((tipo = ANY (ARRAY['titular'::text, 'substituto'::text, 'auxiliar'::text]))),
	CONSTRAINT aca_docente_modulo_componente_id_ciclo_id_modulo_componente_key UNIQUE (id_ciclo, id_modulo_componente, id_docente)
);
CREATE INDEX idx_aca_docente_atribuicao_ciclo ON public.aca_docente_modulo_componente_ciclo USING btree (id_ciclo);
CREATE INDEX idx_aca_docente_atribuicao_docente ON public.aca_docente_modulo_componente_ciclo USING btree (id_docente);
CREATE INDEX idx_aca_docente_atribuicao_modcomp ON public.aca_docente_modulo_componente_ciclo USING btree (id_modulo_componente);
ALTER TABLE public.aca_docente_modulo_componente_ciclo ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_docente_atribuicao: delete para admin e membros da entidade" ON public.aca_docente_modulo_componente_ciclo
 AS PERMISSIVE
 FOR DELETE
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid IN ( SELECT c.id_entidade
           FROM aca_ciclo c
          WHERE (c.id = aca_docente_modulo_componente_ciclo.id_ciclo)))))));
CREATE POLICY "aca_docente_atribuicao: insert para admin e membros da entidade" ON public.aca_docente_modulo_componente_ciclo
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid IN ( SELECT c.id_entidade
           FROM aca_ciclo c
          WHERE (c.id = aca_docente_modulo_componente_ciclo.id_ciclo)))))));
CREATE POLICY "aca_docente_atribuicao: select para admin e membros da entidade" ON public.aca_docente_modulo_componente_ciclo
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid IN ( SELECT c.id_entidade
           FROM aca_ciclo c
          WHERE (c.id = aca_docente_modulo_componente_ciclo.id_ciclo)))))));
CREATE POLICY "aca_docente_atribuicao: update para admin e membros da entidade" ON public.aca_docente_modulo_componente_ciclo
 AS PERMISSIVE
 FOR UPDATE
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid IN ( SELECT c.id_entidade
           FROM aca_ciclo c
          WHERE (c.id = aca_docente_modulo_componente_ciclo.id_ciclo)))))));


-- public.aca_docente_proposta definition

-- Drop table

-- DROP TABLE public.aca_docente_proposta;

CREATE TABLE public.aca_docente_proposta (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NOT NULL,
	id_edital uuid NULL,
	nome text NOT NULL,
	telefone text NULL,
	email text NOT NULL,
	minibio text NULL,
	id_curriculo uuid NULL,
	visto bool DEFAULT false NOT NULL,
	considerado bool NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	modificado_em timestamptz NULL,
	CONSTRAINT aca_docente_proposta_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_aca_docente_proposta_entidade ON public.aca_docente_proposta USING btree (id_entidade);
CREATE INDEX idx_aca_docente_proposta_visto ON public.aca_docente_proposta USING btree (visto);
ALTER TABLE public.aca_docente_proposta ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_docente_proposta: admin e aca_ podem tudo na entidade" ON public.aca_docente_proposta
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_docente_proposta.id_entidade)))));


-- public.aca_docente_vinculo definition

-- Drop table

-- DROP TABLE public.aca_docente_vinculo;

CREATE TABLE public.aca_docente_vinculo (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_docente uuid NOT NULL,
	id_componente uuid NOT NULL,
	elegivel bool DEFAULT true NOT NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz NULL,
	CONSTRAINT aca_docente_vinculo_id_docente_id_componente_key UNIQUE (id_docente, id_componente),
	CONSTRAINT aca_docente_vinculo_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_aca_docente_vinculo_docente ON public.aca_docente_vinculo USING btree (id_docente);
ALTER TABLE public.aca_docente_vinculo ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_docente_vinculo: admin e aca_ podem tudo" ON public.aca_docente_vinculo
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM aca_docente d
  WHERE ((d.id = aca_docente_vinculo.id_docente) AND (EXISTS ( SELECT 1
           FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e_id(value)
          WHERE ((e_id.value)::uuid = d.id_entidade))))))));


-- public.aca_edital_docente definition

-- Drop table

-- DROP TABLE public.aca_edital_docente;

CREATE TABLE public.aca_edital_docente (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NOT NULL,
	nome text NOT NULL,
	descricao text NULL,
	data_ini date NOT NULL,
	data_fim date NOT NULL,
	status text DEFAULT 'ativo'::text NOT NULL,
	id_form_config uuid NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz NULL,
	CONSTRAINT aca_edital_docente_pkey PRIMARY KEY (id),
	CONSTRAINT aca_edital_docente_status_check CHECK ((status = ANY (ARRAY['ativo'::text, 'inativo'::text])))
);
CREATE INDEX idx_aca_edital_docente_entidade ON public.aca_edital_docente USING btree (id_entidade);
CREATE INDEX idx_aca_edital_docente_status ON public.aca_edital_docente USING btree (status);
ALTER TABLE public.aca_edital_docente ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_edital_docente: admin e aca_ podem tudo na entidade" ON public.aca_edital_docente
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_edital_docente.id_entidade)))));


-- public.aca_edital_docente_inscricao definition

-- Drop table

-- DROP TABLE public.aca_edital_docente_inscricao;

CREATE TABLE public.aca_edital_docente_inscricao (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_edital uuid NOT NULL,
	id_candidato uuid NOT NULL,
	status text DEFAULT 'aguardando'::text NOT NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz NULL,
	CONSTRAINT aca_edital_docente_inscricao_id_edital_id_candidato_key UNIQUE (id_edital, id_candidato),
	CONSTRAINT aca_edital_docente_inscricao_pkey PRIMARY KEY (id),
	CONSTRAINT aca_edital_docente_inscricao_status_check CHECK ((status = ANY (ARRAY['aguardando'::text, 'aprovado'::text, 'recusado'::text, 'suplente'::text])))
);
CREATE INDEX idx_aca_edital_inscricao_edital ON public.aca_edital_docente_inscricao USING btree (id_edital);
ALTER TABLE public.aca_edital_docente_inscricao ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_edital_docente_inscricao: admin e aca_ podem tudo" ON public.aca_edital_docente_inscricao
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM aca_edital_docente e
  WHERE ((e.id = aca_edital_docente_inscricao.id_edital) AND (EXISTS ( SELECT 1
           FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e_id(value)
          WHERE ((e_id.value)::uuid = e.id_entidade))))))));


-- public.aca_evento definition

-- Drop table

-- DROP TABLE public.aca_evento;

CREATE TABLE public.aca_evento (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NOT NULL,
	data_inicio date NOT NULL,
	data_fim date NOT NULL,
	nome_evento text NOT NULL,
	descricao text NULL,
	sobrescrever_calendario bool DEFAULT false NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	CONSTRAINT aca_evento_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_evento ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_policy_evento ON public.aca_evento
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_evento.id_entidade)))));


-- public.aca_feriado definition

-- Drop table

-- DROP TABLE public.aca_feriado;

CREATE TABLE public.aca_feriado (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NULL,
	"data" date NOT NULL,
	nome text NOT NULL,
	recorrente_anual bool DEFAULT false NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	is_global bool DEFAULT false NULL,
	CONSTRAINT aca_feriado_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_feriado ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_policy_feriado ON public.aca_feriado
 AS PERMISSIVE
 FOR ALL
 USING (((id_entidade IS NULL) OR (is_global = true) OR ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_feriado.id_entidade))))));


-- public.aca_form_config definition

-- Drop table

-- DROP TABLE public.aca_form_config;

CREATE TABLE public.aca_form_config (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NULL,
	area_id uuid NULL,
	programa_id uuid NULL,
	tipo_proc public."tipo_processo" DEFAULT 'matricula'::tipo_processo NOT NULL,
	tipo_cand public."tipo_candidatura" DEFAULT 'estudante'::tipo_candidatura NOT NULL,
	pergunta_id uuid NOT NULL,
	bloco_nome text DEFAULT 'Dados Gerais'::text NOT NULL,
	bloco_ordem int4 DEFAULT 1 NULL,
	pergunta_ordem int4 DEFAULT 1 NULL,
	largura public."tipo_largura" DEFAULT '2'::tipo_largura NULL,
	altura int4 DEFAULT 36 NULL,
	obrigatorio bool DEFAULT false NULL,
	depende_de_pergunta_id uuid NULL,
	resposta_esperada text NULL,
	escopo text NOT NULL,
	CONSTRAINT aca_form_config_pkey PRIMARY KEY (id),
	CONSTRAINT check_entidade CHECK ((((escopo = 'area'::text) AND (area_id IS NOT NULL) AND (programa_id IS NULL)) OR ((escopo = 'programa'::text) AND (area_id IS NULL) AND (programa_id IS NOT NULL)) OR ((escopo = 'global'::text) AND (area_id IS NULL) AND (programa_id IS NULL)))),
	CONSTRAINT chk_aca_form_config_escopo CHECK ((escopo = ANY (ARRAY['area'::text, 'programa'::text, 'global'::text])))
);
ALTER TABLE public.aca_form_config ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_form_config: delete para membros da entidade" ON public.aca_form_config
 AS PERMISSIVE
 FOR DELETE
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (aca_form_config.id_entidade = (e.ent)::uuid)))));
CREATE POLICY "aca_form_config: insert para membros da entidade" ON public.aca_form_config
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (aca_form_config.id_entidade = (e.ent)::uuid)))));
CREATE POLICY "aca_form_config: select para membros da entidade" ON public.aca_form_config
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (aca_form_config.id_entidade = (e.ent)::uuid)))));
CREATE POLICY "aca_form_config: update para membros da entidade" ON public.aca_form_config
 AS PERMISSIVE
 FOR UPDATE
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (aca_form_config.id_entidade = (e.ent)::uuid)))));


-- public.aca_matricula definition

-- Drop table

-- DROP TABLE public.aca_matricula;

CREATE TABLE public.aca_matricula (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NOT NULL,
	id_programa uuid NOT NULL,
	id_usuario uuid NOT NULL,
	id_pedido uuid NULL,
	declaracao_matricula bool DEFAULT false NOT NULL,
	arquivo_declaracao_matricula uuid NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	status text DEFAULT 'ativa'::text NOT NULL,
	CONSTRAINT aca_matricula_pkey PRIMARY KEY (id),
	CONSTRAINT chk_aca_matricula_status CHECK ((status = ANY (ARRAY['ativa'::text, 'inativa'::text, 'cancelada'::text])))
);
CREATE INDEX idx_aca_matricula_programa ON public.aca_matricula USING btree (id_programa);
CREATE UNIQUE INDEX idx_aca_matricula_programa_usuario ON public.aca_matricula USING btree (id_programa, id_usuario);
CREATE INDEX idx_aca_matricula_status ON public.aca_matricula USING btree (status);
CREATE INDEX idx_aca_matricula_usuario ON public.aca_matricula USING btree (id_usuario);
ALTER TABLE public.aca_matricula ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_matricula_insert_admin ON public.aca_matricula
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((id_entidade IN ( SELECT user_entidade_user.id_entidade
   FROM user_entidade_user
  WHERE (user_entidade_user.id_user = auth.uid()))));
CREATE POLICY aca_matricula_insert_own ON public.aca_matricula
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((id_usuario IN ( SELECT user_expandido.id
   FROM user_expandido
  WHERE (user_expandido.id_user = auth.uid()))));
CREATE POLICY aca_matricula_select_admin ON public.aca_matricula
 AS PERMISSIVE
 FOR SELECT
 USING ((id_entidade IN ( SELECT user_entidade_user.id_entidade
   FROM user_entidade_user
  WHERE (user_entidade_user.id_user = auth.uid()))));
CREATE POLICY aca_matricula_select_own ON public.aca_matricula
 AS PERMISSIVE
 FOR SELECT
 USING ((id_usuario IN ( SELECT user_expandido.id
   FROM user_expandido
  WHERE (user_expandido.id_user = auth.uid()))));
CREATE POLICY aca_matricula_update_admin ON public.aca_matricula
 AS PERMISSIVE
 FOR UPDATE
 USING ((id_entidade IN ( SELECT user_entidade_user.id_entidade
   FROM user_entidade_user
  WHERE (user_entidade_user.id_user = auth.uid()))));
CREATE POLICY aca_matricula_update_own ON public.aca_matricula
 AS PERMISSIVE
 FOR UPDATE
 USING ((id_usuario IN ( SELECT user_expandido.id
   FROM user_expandido
  WHERE (user_expandido.id_user = auth.uid()))))
 WITH CHECK ((id_usuario IN ( SELECT user_expandido.id
   FROM user_expandido
  WHERE (user_expandido.id_user = auth.uid()))));


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

-- Table Policies

CREATE POLICY "aca_modulo: admin e membros podem ver" ON public.aca_modulo
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid = aca_modulo.id_entidade)))));
CREATE POLICY aca_policy_all_access_aca_modulo ON public.aca_modulo
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_modulo.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_modulo.id_entidade)))));


-- public.aca_modulo_componente definition

-- Drop table

-- DROP TABLE public.aca_modulo_componente;

CREATE TABLE public.aca_modulo_componente (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_modulo uuid NOT NULL,
	id_componente uuid NOT NULL,
	carga_horaria int4 NULL,
	ordem int4 DEFAULT 0 NULL,
	obrigatorio bool DEFAULT true NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_modulo_componente_pkey PRIMARY KEY (id),
	CONSTRAINT aca_modulo_componente_unique UNIQUE (id_modulo, id_componente)
);
ALTER TABLE public.aca_modulo_componente ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_modulo_componente: admin e membros podem ver" ON public.aca_modulo_componente
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid = aca_modulo_componente.id_entidade)))));
CREATE POLICY aca_policy_all_access_aca_modulo_componente ON public.aca_modulo_componente
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_modulo_componente.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_modulo_componente.id_entidade)))));


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

-- Table Policies

CREATE POLICY aca_policy_all_access_aca_plano_de_aula ON public.aca_plano_de_aula
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_plano_de_aula.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_plano_de_aula.id_entidade)))));


-- public.aca_processo_seletivo definition

-- Drop table

-- DROP TABLE public.aca_processo_seletivo;

CREATE TABLE public.aca_processo_seletivo (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_programa uuid NOT NULL,
	nome_processo text NOT NULL,
	data_inicio timestamptz NOT NULL,
	data_fim timestamptz NOT NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_entidade uuid NOT NULL,
	matricula_inicio timestamptz NULL,
	matricula_fim timestamptz NULL,
	CONSTRAINT aca_processo_seletivo_matricula_periodo_check CHECK (((matricula_inicio IS NULL) OR (matricula_fim IS NULL) OR (matricula_fim >= matricula_inicio))),
	CONSTRAINT aca_processo_seletivo_periodo_check CHECK ((data_fim >= data_inicio)),
	CONSTRAINT aca_processo_seletivo_pkey PRIMARY KEY (id),
	CONSTRAINT aca_processo_seletivo_sem_overlap EXCLUDE USING gist (id_programa WITH =, tstzrange(data_inicio, data_fim, '[)'::text) WITH &&)
);
CREATE INDEX aca_processo_seletivo_sem_overlap ON public.aca_processo_seletivo USING gist (id_programa, tstzrange(data_inicio, data_fim, '[)'::text));
ALTER TABLE public.aca_processo_seletivo ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_policy_all_access_aca_processo_seletivo ON public.aca_processo_seletivo
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_processo_seletivo.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_processo_seletivo.id_entidade)))));


-- public.aca_processo_seletivo_inscricoes definition

-- Drop table

-- DROP TABLE public.aca_processo_seletivo_inscricoes;

CREATE TABLE public.aca_processo_seletivo_inscricoes (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_usuario uuid NOT NULL,
	id_programa uuid NOT NULL,
	id_processo uuid NOT NULL,
	status_dados text DEFAULT 'pendente'::text NOT NULL,
	status_documentacao text DEFAULT 'pendente'::text NOT NULL,
	status_candidatura text DEFAULT 'pendente'::text NOT NULL,
	"tipo_processo" public."tipo_processo" NOT NULL,
	"tipo_candidatura" public."tipo_candidatura" NOT NULL,
	envio_email bool DEFAULT false NOT NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	criado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NOT NULL,
	modificado_por uuid NULL,
	id_entidade uuid NOT NULL,
	CONSTRAINT aca_processo_seletivo_inscricoes_pkey PRIMARY KEY (id),
	CONSTRAINT aca_processo_seletivo_inscricoes_unq UNIQUE (id_usuario, id_processo, tipo_processo, tipo_candidatura)
);
CREATE INDEX aca_processo_seletivo_inscricoes_id_entidade_idx ON public.aca_processo_seletivo_inscricoes USING btree (id_entidade);
CREATE INDEX aca_processo_seletivo_inscricoes_id_processo_idx ON public.aca_processo_seletivo_inscricoes USING btree (id_processo);
CREATE INDEX aca_processo_seletivo_inscricoes_id_usuario_idx ON public.aca_processo_seletivo_inscricoes USING btree (id_usuario);

-- Table Triggers

create trigger trg_aca_processo_seletivo_inscricao_context before
insert
    or
update
    on
    public.aca_processo_seletivo_inscricoes for each row execute function aca_sync_processo_seletivo_inscricao_context();
ALTER TABLE public.aca_processo_seletivo_inscricoes ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_processo_seletivo_inscricoes: admin da entidade" ON public.aca_processo_seletivo_inscricoes
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_processo_seletivo_inscricoes.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_processo_seletivo_inscricoes.id_entidade)))));
CREATE POLICY "aca_processo_seletivo_inscricoes: usuario delete propria linha" ON public.aca_processo_seletivo_inscricoes
 AS PERMISSIVE
 FOR DELETE
 USING ((id_usuario IN ( SELECT ue.id
   FROM user_expandido ue
  WHERE (ue.id_user = auth.uid()))));
CREATE POLICY "aca_processo_seletivo_inscricoes: usuario insert propria linha" ON public.aca_processo_seletivo_inscricoes
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((id_usuario IN ( SELECT ue.id
   FROM user_expandido ue
  WHERE (ue.id_user = auth.uid()))));
CREATE POLICY "aca_processo_seletivo_inscricoes: usuario select propria linha" ON public.aca_processo_seletivo_inscricoes
 AS PERMISSIVE
 FOR SELECT
 USING ((id_usuario IN ( SELECT ue.id
   FROM user_expandido ue
  WHERE (ue.id_user = auth.uid()))));
CREATE POLICY "aca_processo_seletivo_inscricoes: usuario update propria linha" ON public.aca_processo_seletivo_inscricoes
 AS PERMISSIVE
 FOR UPDATE
 USING ((id_usuario IN ( SELECT ue.id
   FROM user_expandido ue
  WHERE (ue.id_user = auth.uid()))))
 WITH CHECK ((id_usuario IN ( SELECT ue.id
   FROM user_expandido ue
  WHERE (ue.id_user = auth.uid()))));


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
	id_area uuid NULL,
	processo_seletivo_inicio timestamptz NULL,
	processo_seletivo_fim timestamptz NULL,
	matricula_inicio timestamptz NULL,
	matricula_fim timestamptz NULL,
	gratuito bool DEFAULT true NOT NULL,
	exige_processo_seletivo bool DEFAULT false NOT NULL,
	CONSTRAINT aca_programa_pkey PRIMARY KEY (id)
);
ALTER TABLE public.aca_programa ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY aca_policy_all_access_aca_programa ON public.aca_programa
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_programa.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_programa.id_entidade)))));
CREATE POLICY "aca_programa: admin e membros podem ver" ON public.aca_programa
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE ((e.ent)::uuid = aca_programa.id_entidade)))));


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

-- Table Policies

CREATE POLICY aca_policy_all_access_aca_ref_plano_de_aula ON public.aca_ref_plano_de_aula
 AS PERMISSIVE
 FOR ALL
 USING (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ref_plano_de_aula.id_entidade)))))
 WITH CHECK (((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) AND (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
  WHERE ((e.ent_id)::uuid = aca_ref_plano_de_aula.id_entidade)))));


-- public.aca_resposta_form definition

-- Drop table

-- DROP TABLE public.aca_resposta_form;

CREATE TABLE public.aca_resposta_form (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NOT NULL,
	id_user_expandido uuid NOT NULL,
	id_pergunta uuid NOT NULL,
	resposta text NULL,
	id_arquivo uuid NULL,
	criado_por uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	CONSTRAINT aca_resposta_form_pkey PRIMARY KEY (id),
	CONSTRAINT aca_resposta_form_user_pergunta_unique UNIQUE (id_user_expandido, id_pergunta)
);
ALTER TABLE public.aca_resposta_form ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "aca_resposta_form: insert/update para todos" ON public.aca_resposta_form
 AS PERMISSIVE
 FOR ALL
 USING (true)
 WITH CHECK (true);
CREATE POLICY "aca_resposta_form: select para admin e membros da entidade" ON public.aca_resposta_form
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (aca_resposta_form.id_entidade = (e.ent)::uuid))) OR (id_user_expandido IN ( SELECT user_expandido.id
   FROM user_expandido
  WHERE (user_expandido.id_user = auth.uid())))));


-- public.cmct_pergunta_form definition

-- Drop table

-- DROP TABLE public.cmct_pergunta_form;

CREATE TABLE public.cmct_pergunta_form (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	nome_interno text NOT NULL,
	"label" text NOT NULL,
	placeholder text NULL,
	tipo_pergunta text NOT NULL,
	opcoes jsonb NULL,
	id_entidade uuid NULL,
	"global" bool DEFAULT false NOT NULL,
	CONSTRAINT cmct_pergunta_form_entidade_nome_key UNIQUE (id_entidade, nome_interno),
	CONSTRAINT cmct_pergunta_form_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_pergunta_form_global_nome ON public.cmct_pergunta_form USING btree (nome_interno) WHERE (global = true);
ALTER TABLE public.cmct_pergunta_form ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "cmct_pergunta_form: delete para membros da entidade" ON public.cmct_pergunta_form
 AS PERMISSIVE
 FOR DELETE
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (cmct_pergunta_form.id_entidade = (e.ent)::uuid)))));
CREATE POLICY "cmct_pergunta_form: insert para membros da entidade" ON public.cmct_pergunta_form
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (cmct_pergunta_form.id_entidade = (e.ent)::uuid)))));
CREATE POLICY "cmct_pergunta_form: select para membros da entidade" ON public.cmct_pergunta_form
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (cmct_pergunta_form.id_entidade = (e.ent)::uuid)))));
CREATE POLICY "cmct_pergunta_form: update para membros da entidade" ON public.cmct_pergunta_form
 AS PERMISSIVE
 FOR UPDATE
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
  WHERE (cmct_pergunta_form.id_entidade = (e.ent)::uuid)))));


-- public.aca_area foreign keys

ALTER TABLE public.aca_area ADD CONSTRAINT aca_area_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_area ADD CONSTRAINT aca_area_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;


-- public.aca_calendario foreign keys

ALTER TABLE public.aca_calendario ADD CONSTRAINT aca_calendario_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_calendario ADD CONSTRAINT aca_calendario_id_atribuicao_docente_fkey FOREIGN KEY (id_atribuicao_docente) REFERENCES public.aca_docente_modulo_componente_ciclo(id) ON DELETE SET NULL;
ALTER TABLE public.aca_calendario ADD CONSTRAINT aca_calendario_id_aula_origem_fkey FOREIGN KEY (id_aula_origem) REFERENCES public.aca_calendario(id) ON DELETE SET NULL;
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


-- public.aca_ciclo_dia_extra foreign keys

ALTER TABLE public.aca_ciclo_dia_extra ADD CONSTRAINT aca_ciclo_dia_extra_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_ciclo_dia_extra ADD CONSTRAINT aca_ciclo_dia_extra_id_ciclo_fkey FOREIGN KEY (id_ciclo) REFERENCES public.aca_ciclo(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ciclo_dia_extra ADD CONSTRAINT aca_ciclo_dia_extra_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;


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
ALTER TABLE public.aca_curso ADD CONSTRAINT aca_curso_id_area_fkey FOREIGN KEY (id_area) REFERENCES public.aca_area(id) ON DELETE SET NULL;
ALTER TABLE public.aca_curso ADD CONSTRAINT aca_curso_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_curso ADD CONSTRAINT aca_curso_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_curso_modulo foreign keys

ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.aca_curso(id) ON DELETE CASCADE;
ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.aca_modulo(id);
ALTER TABLE public.aca_curso_modulo ADD CONSTRAINT aca_curso_modulo_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_docente foreign keys

ALTER TABLE public.aca_docente ADD CONSTRAINT aca_docente_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_docente ADD CONSTRAINT aca_docente_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_docente ADD CONSTRAINT aca_docente_id_user_expandido_fkey FOREIGN KEY (id_user_expandido) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_docente ADD CONSTRAINT aca_docente_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_docente_convite foreign keys

ALTER TABLE public.aca_docente_convite ADD CONSTRAINT aca_docente_convite_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_docente_convite ADD CONSTRAINT aca_docente_convite_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;


-- public.aca_docente_modulo_componente_ciclo foreign keys

ALTER TABLE public.aca_docente_modulo_componente_ciclo ADD CONSTRAINT aca_docente_modulo_componente_ciclo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_docente_modulo_componente_ciclo ADD CONSTRAINT aca_docente_modulo_componente_ciclo_id_ciclo_fkey FOREIGN KEY (id_ciclo) REFERENCES public.aca_ciclo(id) ON DELETE CASCADE;
ALTER TABLE public.aca_docente_modulo_componente_ciclo ADD CONSTRAINT aca_docente_modulo_componente_ciclo_id_docente_fkey FOREIGN KEY (id_docente) REFERENCES public.aca_docente(id) ON DELETE CASCADE;
ALTER TABLE public.aca_docente_modulo_componente_ciclo ADD CONSTRAINT aca_docente_modulo_componente_ciclo_id_modulo_componente_fkey FOREIGN KEY (id_modulo_componente) REFERENCES public.aca_modulo_componente(id) ON DELETE CASCADE;
ALTER TABLE public.aca_docente_modulo_componente_ciclo ADD CONSTRAINT aca_docente_modulo_componente_ciclo_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_docente_proposta foreign keys

ALTER TABLE public.aca_docente_proposta ADD CONSTRAINT aca_docente_proposta_id_curriculo_fkey FOREIGN KEY (id_curriculo) REFERENCES public.global_arquivos(id) ON DELETE SET NULL;
ALTER TABLE public.aca_docente_proposta ADD CONSTRAINT aca_docente_proposta_id_edital_fkey FOREIGN KEY (id_edital) REFERENCES public.aca_edital_docente(id) ON DELETE SET NULL;
ALTER TABLE public.aca_docente_proposta ADD CONSTRAINT aca_docente_proposta_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;


-- public.aca_docente_vinculo foreign keys

ALTER TABLE public.aca_docente_vinculo ADD CONSTRAINT aca_docente_vinculo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_docente_vinculo ADD CONSTRAINT aca_docente_vinculo_id_componente_fkey FOREIGN KEY (id_componente) REFERENCES public.aca_componente(id);
ALTER TABLE public.aca_docente_vinculo ADD CONSTRAINT aca_docente_vinculo_id_docente_fkey FOREIGN KEY (id_docente) REFERENCES public.aca_docente(id) ON DELETE CASCADE;
ALTER TABLE public.aca_docente_vinculo ADD CONSTRAINT aca_docente_vinculo_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_edital_docente foreign keys

ALTER TABLE public.aca_edital_docente ADD CONSTRAINT aca_edital_docente_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_edital_docente ADD CONSTRAINT aca_edital_docente_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_edital_docente ADD CONSTRAINT aca_edital_docente_id_form_config_fkey FOREIGN KEY (id_form_config) REFERENCES public.aca_form_config(id) ON DELETE SET NULL;
ALTER TABLE public.aca_edital_docente ADD CONSTRAINT aca_edital_docente_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_edital_docente_inscricao foreign keys

ALTER TABLE public.aca_edital_docente_inscricao ADD CONSTRAINT aca_edital_docente_inscricao_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_edital_docente_inscricao ADD CONSTRAINT aca_edital_docente_inscricao_id_candidato_fkey FOREIGN KEY (id_candidato) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_edital_docente_inscricao ADD CONSTRAINT aca_edital_docente_inscricao_id_edital_fkey FOREIGN KEY (id_edital) REFERENCES public.aca_edital_docente(id) ON DELETE CASCADE;
ALTER TABLE public.aca_edital_docente_inscricao ADD CONSTRAINT aca_edital_docente_inscricao_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_evento foreign keys

ALTER TABLE public.aca_evento ADD CONSTRAINT aca_evento_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_evento ADD CONSTRAINT aca_evento_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;


-- public.aca_feriado foreign keys

ALTER TABLE public.aca_feriado ADD CONSTRAINT aca_feriado_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_feriado ADD CONSTRAINT aca_feriado_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;


-- public.aca_form_config foreign keys

ALTER TABLE public.aca_form_config ADD CONSTRAINT aca_form_config_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.aca_area(id) ON DELETE CASCADE;
ALTER TABLE public.aca_form_config ADD CONSTRAINT aca_form_config_depende_de_pergunta_id_fkey FOREIGN KEY (depende_de_pergunta_id) REFERENCES public.cmct_pergunta_form(id) ON DELETE SET NULL;
ALTER TABLE public.aca_form_config ADD CONSTRAINT aca_form_config_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_form_config ADD CONSTRAINT aca_form_config_pergunta_id_fkey FOREIGN KEY (pergunta_id) REFERENCES public.cmct_pergunta_form(id) ON DELETE CASCADE;
ALTER TABLE public.aca_form_config ADD CONSTRAINT aca_form_config_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.aca_programa(id) ON DELETE CASCADE;


-- public.aca_matricula foreign keys

ALTER TABLE public.aca_matricula ADD CONSTRAINT aca_matricula_arquivo_fkey FOREIGN KEY (arquivo_declaracao_matricula) REFERENCES public.global_arquivos(id) ON DELETE SET NULL;
ALTER TABLE public.aca_matricula ADD CONSTRAINT aca_matricula_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_matricula ADD CONSTRAINT aca_matricula_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_matricula ADD CONSTRAINT aca_matricula_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.com_pedido(id) ON DELETE SET NULL;
ALTER TABLE public.aca_matricula ADD CONSTRAINT aca_matricula_id_programa_fkey FOREIGN KEY (id_programa) REFERENCES public.aca_programa(id) ON DELETE CASCADE;
ALTER TABLE public.aca_matricula ADD CONSTRAINT aca_matricula_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.user_expandido(id) ON DELETE CASCADE;
ALTER TABLE public.aca_matricula ADD CONSTRAINT aca_matricula_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_modulo foreign keys

ALTER TABLE public.aca_modulo ADD CONSTRAINT aca_modulo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_modulo ADD CONSTRAINT aca_modulo_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_modulo ADD CONSTRAINT aca_modulo_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_modulo_componente foreign keys

ALTER TABLE public.aca_modulo_componente ADD CONSTRAINT aca_modulo_componente_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_modulo_componente ADD CONSTRAINT aca_modulo_componente_id_componente_fkey FOREIGN KEY (id_componente) REFERENCES public.aca_componente(id) ON DELETE CASCADE;
ALTER TABLE public.aca_modulo_componente ADD CONSTRAINT aca_modulo_componente_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_modulo_componente ADD CONSTRAINT aca_modulo_componente_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.aca_modulo(id) ON DELETE CASCADE;
ALTER TABLE public.aca_modulo_componente ADD CONSTRAINT aca_modulo_componente_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_plano_de_aula foreign keys

ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_id_componente_fkey FOREIGN KEY (id_componente) REFERENCES public.aca_componente(id);
ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.aca_modulo(id);
ALTER TABLE public.aca_plano_de_aula ADD CONSTRAINT aca_plano_de_aula_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_processo_seletivo foreign keys

ALTER TABLE public.aca_processo_seletivo ADD CONSTRAINT aca_processo_seletivo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_processo_seletivo ADD CONSTRAINT aca_processo_seletivo_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_processo_seletivo ADD CONSTRAINT aca_processo_seletivo_id_programa_fkey FOREIGN KEY (id_programa) REFERENCES public.aca_programa(id) ON DELETE CASCADE;
ALTER TABLE public.aca_processo_seletivo ADD CONSTRAINT aca_processo_seletivo_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_processo_seletivo_inscricoes foreign keys

ALTER TABLE public.aca_processo_seletivo_inscricoes ADD CONSTRAINT aca_processo_seletivo_inscricoes_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_processo_seletivo_inscricoes ADD CONSTRAINT aca_processo_seletivo_inscricoes_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_processo_seletivo_inscricoes ADD CONSTRAINT aca_processo_seletivo_inscricoes_id_processo_fkey FOREIGN KEY (id_processo) REFERENCES public.aca_processo_seletivo(id) ON DELETE CASCADE;
ALTER TABLE public.aca_processo_seletivo_inscricoes ADD CONSTRAINT aca_processo_seletivo_inscricoes_id_programa_fkey FOREIGN KEY (id_programa) REFERENCES public.aca_programa(id) ON DELETE CASCADE;
ALTER TABLE public.aca_processo_seletivo_inscricoes ADD CONSTRAINT aca_processo_seletivo_inscricoes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.user_expandido(id) ON DELETE CASCADE;
ALTER TABLE public.aca_processo_seletivo_inscricoes ADD CONSTRAINT aca_processo_seletivo_inscricoes_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_programa foreign keys

ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_id_area_fkey FOREIGN KEY (id_area) REFERENCES public.aca_area(id) ON DELETE SET NULL;
ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES public.aca_curso(id);
ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_programa ADD CONSTRAINT aca_programa_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_ref_plano_de_aula foreign keys

ALTER TABLE public.aca_ref_plano_de_aula ADD CONSTRAINT aca_ref_plano_de_aula_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_ref_plano_de_aula ADD CONSTRAINT aca_ref_plano_de_aula_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ref_plano_de_aula ADD CONSTRAINT aca_ref_plano_de_aula_id_plano_aula_fkey FOREIGN KEY (id_plano_aula) REFERENCES public.aca_plano_de_aula(id) ON DELETE CASCADE;
ALTER TABLE public.aca_ref_plano_de_aula ADD CONSTRAINT aca_ref_plano_de_aula_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.aca_resposta_form foreign keys

ALTER TABLE public.aca_resposta_form ADD CONSTRAINT aca_resposta_form_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.aca_resposta_form ADD CONSTRAINT aca_resposta_form_id_arquivo_fkey FOREIGN KEY (id_arquivo) REFERENCES public.global_arquivos(id) ON DELETE SET NULL;
ALTER TABLE public.aca_resposta_form ADD CONSTRAINT aca_resposta_form_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.aca_resposta_form ADD CONSTRAINT aca_resposta_form_id_pergunta_fkey FOREIGN KEY (id_pergunta) REFERENCES public.cmct_pergunta_form(id) ON DELETE CASCADE;
ALTER TABLE public.aca_resposta_form ADD CONSTRAINT aca_resposta_form_id_user_expandido_fkey FOREIGN KEY (id_user_expandido) REFERENCES public.user_expandido(id) ON DELETE CASCADE;
ALTER TABLE public.aca_resposta_form ADD CONSTRAINT aca_resposta_form_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);


-- public.cmct_pergunta_form foreign keys

ALTER TABLE public.cmct_pergunta_form ADD CONSTRAINT cmct_pergunta_form_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;