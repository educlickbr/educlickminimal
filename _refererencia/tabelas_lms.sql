-- public.lms_conteudo definition

-- Drop table

-- DROP TABLE public.lms_conteudo;

CREATE TABLE public.lms_conteudo (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_empresa uuid NOT NULL,
	id_ano_etapa uuid NULL,
	id_turma uuid NULL,
	id_componente uuid NULL,
	id_aluno uuid NULL,
	titulo text NOT NULL,
	descricao text NULL,
	liberar_por public."liberacao_conteudo_enum" DEFAULT 'Conteúdo'::liberacao_conteudo_enum NOT NULL,
	escopo text NOT NULL,
	visivel_para_alunos bool DEFAULT true NOT NULL,
	data_disponivel timestamptz NULL,
	criado_por uuid NOT NULL,
	criado_em timestamptz DEFAULT now() NULL,
	id_grupo uuid NULL,
	CONSTRAINT lms_conteudo_escopo_check CHECK (((escopo = 'Global'::text) OR ((escopo = 'AnoEtapa'::text) AND (id_ano_etapa IS NOT NULL)) OR ((escopo = 'Turma'::text) AND (id_turma IS NOT NULL)) OR ((escopo = 'Grupo'::text) AND (id_grupo IS NOT NULL)) OR ((escopo = 'Componente'::text) AND (id_componente IS NOT NULL)) OR ((escopo = 'Aluno'::text) AND (id_aluno IS NOT NULL)))) NOT VALID,
	CONSTRAINT lms_conteudo_escopo_enum_check CHECK ((escopo = ANY (ARRAY['Global'::text, 'AnoEtapa'::text, 'Turma'::text, 'Grupo'::text, 'Componente'::text, 'Aluno'::text]))),
	CONSTRAINT lms_conteudo_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_lms_conteudo_empresa_escopo_lookup ON public.lms_conteudo USING btree (id_empresa, escopo, id_ano_etapa, id_turma, id_grupo, id_aluno);
CREATE INDEX lms_conteudo_criado_por_idx ON public.lms_conteudo USING btree (criado_por);
CREATE INDEX lms_conteudo_escopo_idx ON public.lms_conteudo USING btree (escopo);
CREATE INDEX lms_conteudo_id_empresa_idx ON public.lms_conteudo USING btree (id_empresa);
CREATE INDEX lms_conteudo_ids_idx ON public.lms_conteudo USING btree (id_turma, id_aluno, id_grupo, id_componente, id_ano_etapa);
ALTER TABLE public.lms_conteudo ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY lms_conteudo_admin_all ON public.lms_conteudo
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)));
CREATE POLICY lms_conteudo_aluno_select_contexto ON public.lms_conteudo
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (visivel_para_alunos IS TRUE) AND ((data_disponivel IS NULL) OR (data_disponivel <= now())) AND ((escopo = 'Global'::text) OR ((escopo = 'AnoEtapa'::text) AND (id_ano_etapa IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (matriculas m
     JOIN user_expandido ue ON ((ue.id = m.id_aluno)))
  WHERE ((m.id_empresa = lms_conteudo.id_empresa) AND (m.id_ano_etapa = lms_conteudo.id_ano_etapa) AND (m.status = 'ativa'::text) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))) OR ((escopo = 'Turma'::text) AND (id_turma IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ((matricula_turma mt
     JOIN matriculas m ON ((m.id = mt.id_matricula)))
     JOIN user_expandido ue ON ((ue.id = m.id_aluno)))
  WHERE ((mt.id_empresa = lms_conteudo.id_empresa) AND (mt.id_turma = lms_conteudo.id_turma) AND (mt.status = 'ativa'::text) AND (m.id_empresa = lms_conteudo.id_empresa) AND (m.status = 'ativa'::text) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))) OR ((escopo = 'Grupo'::text) AND (id_grupo IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ((user_expandido ue
     JOIN grp_integrantes gi ON (((gi.id_user = ue.id) AND (gi.id_grupo = lms_conteudo.id_grupo) AND (gi.id_empresa = lms_conteudo.id_empresa) AND (gi.status = 'ATIVO'::status_grp))))
     JOIN grp_grupos gg ON (((gg.id = gi.id_grupo) AND (gg.id_empresa = gi.id_empresa) AND (gg.status = 'ATIVO'::status_grp) AND (COALESCE(gg.soft_delete, false) = false))))
  WHERE ((ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))) OR ((escopo = 'Aluno'::text) AND (id_aluno IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_conteudo.id_aluno) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))))));
CREATE POLICY lms_conteudo_prof_delete_own ON public.lms_conteudo
 AS PERMISSIVE
 FOR DELETE
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_conteudo_prof_insert_own ON public.lms_conteudo
 AS PERMISSIVE
 FOR INSERT
 TO authenticated
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_conteudo_prof_select_own ON public.lms_conteudo
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_conteudo_prof_update_own ON public.lms_conteudo
 AS PERMISSIVE
 FOR UPDATE
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));


-- public.lms_item_conteudo definition

-- Drop table

-- DROP TABLE public.lms_item_conteudo;

CREATE TABLE public.lms_item_conteudo (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_lms_conteudo uuid NOT NULL,
	tipo public."lms_tipo_item" DEFAULT 'Material'::lms_tipo_item NULL,
	titulo text NOT NULL,
	caminho_arquivo text NULL,
	url_externa text NULL,
	rich_text text NULL,
	data_disponivel timestamptz NULL,
	data_entrega_limite timestamptz NULL,
	ordem int4 DEFAULT 0 NULL,
	criado_por uuid NOT NULL,
	criado_em timestamptz DEFAULT now() NULL,
	id_empresa uuid NULL,
	pontuacao_maxima numeric(5, 2) NULL,
	video_link text NULL,
	id_bbtk_edicao uuid NULL,
	tempo_questionario int4 NULL,
	duracao_minutos int4 NULL,
	tentativas_permitidas int4 DEFAULT 1 NULL,
	ativo bool DEFAULT true NULL,
	tipo_avaliacao text DEFAULT 'extracurricular'::text NOT NULL,
	id_avaliacao_grupo uuid NULL,
	id_avaliacao_item uuid NULL,
	id_avaliacao_modelo uuid NULL,
	complementar_escopo text NULL,
	complementar_valor_maximo numeric(4, 2) NULL,
	ambiente_seguro bool DEFAULT false NOT NULL,
	auto_avaliacao bool DEFAULT false NOT NULL,
	id_arquivo uuid NULL,
	CONSTRAINT chk_lms_item_complementar_escopo CHECK (((complementar_escopo IS NULL) OR (complementar_escopo = ANY (ARRAY['grupo'::text, 'modelo'::text])))),
	CONSTRAINT chk_lms_item_complementar_valor CHECK (((complementar_valor_maximo IS NULL) OR (complementar_valor_maximo = ANY (ARRAY[0.5, 1.0])))),
	CONSTRAINT chk_tipo_avaliacao CHECK ((tipo_avaliacao = ANY (ARRAY['extracurricular'::text, 'curricular'::text, 'complementar'::text]))),
	CONSTRAINT lms_item_conteudo_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_lms_item_conteudo_empresa_criado_por ON public.lms_item_conteudo USING btree (id_empresa, criado_por);
CREATE INDEX idx_lms_item_conteudo_empresa_lms_ativo_data ON public.lms_item_conteudo USING btree (id_empresa, id_lms_conteudo, ativo, data_disponivel);
CREATE INDEX idx_lms_item_conteudo_id_arquivo ON public.lms_item_conteudo USING btree (id_arquivo);
CREATE INDEX lms_item_conteudo_id_conteudo_idx ON public.lms_item_conteudo USING btree (id_lms_conteudo);
CREATE INDEX lms_item_conteudo_id_empresa_idx ON public.lms_item_conteudo USING btree (id_empresa);
CREATE INDEX lms_item_conteudo_id_lms_conteudo_idx ON public.lms_item_conteudo USING btree (id_lms_conteudo);
ALTER TABLE public.lms_item_conteudo ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY lms_item_conteudo_admin_all ON public.lms_item_conteudo
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)));
CREATE POLICY lms_item_conteudo_aluno_select_empresa ON public.lms_item_conteudo
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (COALESCE(ativo, true) = true) AND ((data_disponivel IS NULL) OR (data_disponivel <= now()))));
CREATE POLICY lms_item_conteudo_prof_delete_own ON public.lms_item_conteudo
 AS PERMISSIVE
 FOR DELETE
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_item_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_item_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_item_conteudo_prof_insert_own ON public.lms_item_conteudo
 AS PERMISSIVE
 FOR INSERT
 TO authenticated
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_item_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_item_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_item_conteudo_prof_select_own ON public.lms_item_conteudo
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_item_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_item_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_item_conteudo_prof_update_own ON public.lms_item_conteudo
 AS PERMISSIVE
 FOR UPDATE
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_item_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_item_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_item_conteudo.criado_por) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_item_conteudo.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));


-- public.lms_nota_complementar definition

-- Drop table

-- DROP TABLE public.lms_nota_complementar;

CREATE TABLE public.lms_nota_complementar (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_empresa uuid NOT NULL,
	id_item_lms uuid NOT NULL,
	id_avaliacao_grupo uuid NULL,
	id_aluno uuid NOT NULL,
	id_turma uuid NULL,
	nota numeric(5, 2) NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	id_avaliacao_modelo uuid NULL,
	escopo_aplicacao text DEFAULT 'grupo'::text NOT NULL,
	valor_maximo numeric(4, 2) NULL,
	CONSTRAINT chk_lms_nota_complementar_escopo CHECK ((escopo_aplicacao = ANY (ARRAY['grupo'::text, 'modelo'::text]))),
	CONSTRAINT lms_nota_complementar_pkey PRIMARY KEY (id),
	CONSTRAINT lms_nota_complementar_unique UNIQUE (id_item_lms, id_aluno)
);
CREATE INDEX idx_lms_nota_complementar_escopo ON public.lms_nota_complementar USING btree (id_empresa, id_turma, escopo_aplicacao);
CREATE INDEX idx_lms_nota_complementar_grupo ON public.lms_nota_complementar USING btree (id_empresa, id_avaliacao_grupo, id_turma);
ALTER TABLE public.lms_nota_complementar ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY lms_nota_complementar_empresa_policy ON public.lms_nota_complementar
 AS PERMISSIVE
 FOR ALL
 USING ((id_empresa IN ( SELECT ue.id_empresa
   FROM user_expandido ue
  WHERE (ue.user_id = auth.uid()))));


-- public.lms_pergunta definition

-- Drop table

-- DROP TABLE public.lms_pergunta;

CREATE TABLE public.lms_pergunta (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	tipo public."lms_tipo_pergunta" DEFAULT 'Dissertativa'::lms_tipo_pergunta NOT NULL,
	enunciado text NOT NULL,
	obrigatoria bool DEFAULT true NOT NULL,
	ordem int4 DEFAULT 0 NULL,
	id_empresa uuid NOT NULL,
	id_item_conteudo uuid NOT NULL,
	caminho_imagem text NULL,
	pontuacao numeric(6, 2) DEFAULT 0 NOT NULL,
	id_arquivo uuid NULL,
	CONSTRAINT chk_lms_pergunta_pontuacao_nonnegative CHECK ((pontuacao >= (0)::numeric)),
	CONSTRAINT lms_pergunta_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_lms_pergunta_id_arquivo ON public.lms_pergunta USING btree (id_arquivo);
CREATE INDEX idx_lms_pergunta_item_empresa ON public.lms_pergunta USING btree (id_item_conteudo, id_empresa);
CREATE INDEX lms_pergunta_id_empresa_idx ON public.lms_pergunta USING btree (id_empresa);
CREATE INDEX lms_pergunta_id_item_conteudo_idx ON public.lms_pergunta USING btree (id_item_conteudo);
ALTER TABLE public.lms_pergunta ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY lms_pergunta_admin_all ON public.lms_pergunta
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)));
CREATE POLICY lms_pergunta_aluno_select_empresa ON public.lms_pergunta
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)));
CREATE POLICY lms_pergunta_prof_all_own ON public.lms_pergunta
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM (lms_item_conteudo i
     JOIN user_expandido ue ON ((ue.id = i.criado_por)))
  WHERE ((i.id = lms_pergunta.id_item_conteudo) AND (i.id_empresa = lms_pergunta.id_empresa) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_pergunta.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM (lms_item_conteudo i
     JOIN user_expandido ue ON ((ue.id = i.criado_por)))
  WHERE ((i.id = lms_pergunta.id_item_conteudo) AND (i.id_empresa = lms_pergunta.id_empresa) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_pergunta.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));


-- public.lms_resposta definition

-- Drop table

-- DROP TABLE public.lms_resposta;

CREATE TABLE public.lms_resposta (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_user uuid NOT NULL,
	id_pergunta uuid NOT NULL,
	tipo_pergunta public."lms_tipo_pergunta" NOT NULL,
	resposta text NULL,
	id_resposta_possivel uuid NULL,
	criado_em timestamptz DEFAULT now() NOT NULL,
	criado_por uuid NULL,
	modificado_em timestamptz NULL,
	modificado_por uuid NULL,
	CONSTRAINT lms_resposta_pkey PRIMARY KEY (id),
	CONSTRAINT lms_resposta_unique_user_pergunta UNIQUE (id_user, id_pergunta)
);
CREATE INDEX lms_resposta_id_pergunta_idx ON public.lms_resposta USING btree (id_pergunta);
CREATE INDEX lms_resposta_id_resposta_possivel_idx ON public.lms_resposta USING btree (id_resposta_possivel);
CREATE INDEX lms_resposta_id_user_idx ON public.lms_resposta USING btree (id_user);
ALTER TABLE public.lms_resposta ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY lms_resposta_admin_all ON public.lms_resposta
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (EXISTS ( SELECT 1
   FROM ((lms_pergunta p
     JOIN lms_item_conteudo i ON ((i.id = p.id_item_conteudo)))
     JOIN lms_conteudo c ON ((c.id = i.id_lms_conteudo)))
  WHERE ((p.id = lms_resposta.id_pergunta) AND (c.id_empresa = ((auth.jwt() ->> 'empresa_id'::text))::uuid))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (EXISTS ( SELECT 1
   FROM ((lms_pergunta p
     JOIN lms_item_conteudo i ON ((i.id = p.id_item_conteudo)))
     JOIN lms_conteudo c ON ((c.id = i.id_lms_conteudo)))
  WHERE ((p.id = lms_resposta.id_pergunta) AND (c.id_empresa = ((auth.jwt() ->> 'empresa_id'::text))::uuid))))));
CREATE POLICY lms_resposta_aluno_delete_own ON public.lms_resposta
 AS PERMISSIVE
 FOR DELETE
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_resposta.id_user) AND (ue.user_id = auth.uid()) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_resposta_aluno_insert_own ON public.lms_resposta
 AS PERMISSIVE
 FOR INSERT
 TO authenticated
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_resposta.id_user) AND (ue.user_id = auth.uid()) AND (COALESCE(ue.soft_delete, false) = false)))) AND (EXISTS ( SELECT 1
   FROM ((lms_pergunta p
     JOIN lms_item_conteudo i ON ((i.id = p.id_item_conteudo)))
     JOIN lms_conteudo c ON ((c.id = i.id_lms_conteudo)))
  WHERE ((p.id = lms_resposta.id_pergunta) AND (c.id_empresa = ((auth.jwt() ->> 'empresa_id'::text))::uuid) AND (c.visivel_para_alunos IS TRUE) AND ((c.data_disponivel IS NULL) OR (c.data_disponivel <= now())) AND (COALESCE(i.ativo, true) = true) AND ((i.data_disponivel IS NULL) OR (i.data_disponivel <= now())))))));
CREATE POLICY lms_resposta_aluno_select_own ON public.lms_resposta
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_resposta.id_user) AND (ue.user_id = auth.uid()) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_resposta_aluno_update_own ON public.lms_resposta
 AS PERMISSIVE
 FOR UPDATE
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_resposta.id_user) AND (ue.user_id = auth.uid()) AND (COALESCE(ue.soft_delete, false) = false))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_resposta.id_user) AND (ue.user_id = auth.uid()) AND (COALESCE(ue.soft_delete, false) = false)))) AND (EXISTS ( SELECT 1
   FROM ((lms_pergunta p
     JOIN lms_item_conteudo i ON ((i.id = p.id_item_conteudo)))
     JOIN lms_conteudo c ON ((c.id = i.id_lms_conteudo)))
  WHERE ((p.id = lms_resposta.id_pergunta) AND (c.id_empresa = ((auth.jwt() ->> 'empresa_id'::text))::uuid) AND (c.visivel_para_alunos IS TRUE) AND ((c.data_disponivel IS NULL) OR (c.data_disponivel <= now())) AND (COALESCE(i.ativo, true) = true) AND ((i.data_disponivel IS NULL) OR (i.data_disponivel <= now())))))));
CREATE POLICY lms_resposta_prof_all_own ON public.lms_resposta
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (EXISTS ( SELECT 1
   FROM ((lms_pergunta p
     JOIN lms_item_conteudo i ON ((i.id = p.id_item_conteudo)))
     JOIN user_expandido ue ON ((ue.id = i.criado_por)))
  WHERE ((p.id = lms_resposta.id_pergunta) AND (i.id_empresa = ((auth.jwt() ->> 'empresa_id'::text))::uuid) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = i.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (EXISTS ( SELECT 1
   FROM ((lms_pergunta p
     JOIN lms_item_conteudo i ON ((i.id = p.id_item_conteudo)))
     JOIN user_expandido ue ON ((ue.id = i.criado_por)))
  WHERE ((p.id = lms_resposta.id_pergunta) AND (i.id_empresa = ((auth.jwt() ->> 'empresa_id'::text))::uuid) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = i.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));


-- public.lms_resposta_possivel definition

-- Drop table

-- DROP TABLE public.lms_resposta_possivel;

CREATE TABLE public.lms_resposta_possivel (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_pergunta uuid NOT NULL,
	texto text NOT NULL,
	correta bool DEFAULT false NOT NULL,
	ordem int4 DEFAULT 0 NULL,
	id_empresa uuid NOT NULL,
	id_arquivo uuid NULL,
	CONSTRAINT lms_resposta_possivel_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_lms_resposta_possivel_id_arquivo ON public.lms_resposta_possivel USING btree (id_arquivo);
CREATE INDEX idx_lms_resposta_possivel_pergunta_empresa ON public.lms_resposta_possivel USING btree (id_pergunta, id_empresa);
CREATE INDEX lms_resposta_possivel_id_empresa_idx ON public.lms_resposta_possivel USING btree (id_empresa);
CREATE INDEX lms_resposta_possivel_id_pergunta_idx ON public.lms_resposta_possivel USING btree (id_pergunta);
ALTER TABLE public.lms_resposta_possivel ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY lms_resposta_possivel_admin_all ON public.lms_resposta_possivel
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)));
CREATE POLICY lms_resposta_possivel_aluno_select_empresa ON public.lms_resposta_possivel
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)));
CREATE POLICY lms_resposta_possivel_prof_all_own ON public.lms_resposta_possivel
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM ((lms_pergunta p
     JOIN lms_item_conteudo i ON ((i.id = p.id_item_conteudo)))
     JOIN user_expandido ue ON ((ue.id = i.criado_por)))
  WHERE ((p.id = lms_resposta_possivel.id_pergunta) AND (p.id_empresa = lms_resposta_possivel.id_empresa) AND (i.id_empresa = lms_resposta_possivel.id_empresa) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_resposta_possivel.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM ((lms_pergunta p
     JOIN lms_item_conteudo i ON ((i.id = p.id_item_conteudo)))
     JOIN user_expandido ue ON ((ue.id = i.criado_por)))
  WHERE ((p.id = lms_resposta_possivel.id_pergunta) AND (p.id_empresa = lms_resposta_possivel.id_empresa) AND (i.id_empresa = lms_resposta_possivel.id_empresa) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_resposta_possivel.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));


-- public.lms_submissao definition

-- Drop table

-- DROP TABLE public.lms_submissao;

CREATE TABLE public.lms_submissao (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_item_conteudo uuid NOT NULL,
	id_aluno uuid NOT NULL,
	texto_resposta text NULL,
	data_envio timestamptz DEFAULT now() NULL,
	nota numeric(5, 2) NULL,
	comentario_professor text NULL,
	criado_em timestamptz DEFAULT now() NULL,
	modificado_em timestamptz NULL,
	data_inicio timestamptz NULL,
	status text DEFAULT 'em_andamento'::text NULL,
	id_empresa uuid NULL,
	id_arquivo uuid NULL,
	CONSTRAINT lms_submissao_pkey PRIMARY KEY (id),
	CONSTRAINT lms_submissao_unq UNIQUE (id_item_conteudo, id_aluno)
);
CREATE INDEX idx_lms_submissao_id_arquivo ON public.lms_submissao USING btree (id_arquivo);
CREATE INDEX idx_lms_submissao_item_aluno ON public.lms_submissao USING btree (id_item_conteudo, id_aluno);
CREATE INDEX idx_lms_submissao_item_aluno_arquivo ON public.lms_submissao USING btree (id_item_conteudo, id_aluno, id_arquivo);
ALTER TABLE public.lms_submissao ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY lms_submissao_admin_all ON public.lms_submissao
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'admin'::text) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa)));
CREATE POLICY lms_submissao_aluno_delete_own ON public.lms_submissao
 AS PERMISSIVE
 FOR DELETE
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_submissao.id_aluno) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_submissao.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_submissao_aluno_insert_own ON public.lms_submissao
 AS PERMISSIVE
 FOR INSERT
 TO authenticated
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_submissao.id_aluno) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_submissao.id_empresa) AND (COALESCE(ue.soft_delete, false) = false)))) AND (EXISTS ( SELECT 1
   FROM (lms_item_conteudo i
     JOIN lms_conteudo c ON ((c.id = i.id_lms_conteudo)))
  WHERE ((i.id = lms_submissao.id_item_conteudo) AND (i.id_empresa = lms_submissao.id_empresa) AND (c.id_empresa = lms_submissao.id_empresa) AND (c.visivel_para_alunos IS TRUE) AND ((c.data_disponivel IS NULL) OR (c.data_disponivel <= now())) AND (COALESCE(i.ativo, true) = true) AND ((i.data_disponivel IS NULL) OR (i.data_disponivel <= now())))))));
CREATE POLICY lms_submissao_aluno_select_own ON public.lms_submissao
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_submissao.id_aluno) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_submissao.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_submissao_aluno_update_own ON public.lms_submissao
 AS PERMISSIVE
 FOR UPDATE
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_submissao.id_aluno) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_submissao.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = 'aluno'::text) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM user_expandido ue
  WHERE ((ue.id = lms_submissao.id_aluno) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_submissao.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));
CREATE POLICY lms_submissao_prof_all_own ON public.lms_submissao
 AS PERMISSIVE
 FOR ALL
 TO authenticated
 USING ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM (lms_item_conteudo i
     JOIN user_expandido ue ON ((ue.id = i.criado_por)))
  WHERE ((i.id = lms_submissao.id_item_conteudo) AND (i.id_empresa = lms_submissao.id_empresa) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_submissao.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))))
 WITH CHECK ((((auth.jwt() ->> 'papeis_user'::text) = ANY (ARRAY['professor'::text, 'professor_funcao_extra'::text])) AND (id_empresa IS NOT NULL) AND (((auth.jwt() ->> 'empresa_id'::text))::uuid = id_empresa) AND (EXISTS ( SELECT 1
   FROM (lms_item_conteudo i
     JOIN user_expandido ue ON ((ue.id = i.criado_por)))
  WHERE ((i.id = lms_submissao.id_item_conteudo) AND (i.id_empresa = lms_submissao.id_empresa) AND (ue.user_id = auth.uid()) AND (ue.id_empresa = lms_submissao.id_empresa) AND (COALESCE(ue.soft_delete, false) = false))))));


-- public.lms_conteudo foreign keys

ALTER TABLE public.lms_conteudo ADD CONSTRAINT lms_conteudo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.lms_conteudo ADD CONSTRAINT lms_conteudo_id_aluno_fkey FOREIGN KEY (id_aluno) REFERENCES public.user_expandido(id) ON DELETE CASCADE;
ALTER TABLE public.lms_conteudo ADD CONSTRAINT lms_conteudo_id_ano_etapa_fkey FOREIGN KEY (id_ano_etapa) REFERENCES public.ano_etapa(id);
ALTER TABLE public.lms_conteudo ADD CONSTRAINT lms_conteudo_id_componente_fkey FOREIGN KEY (id_componente) REFERENCES public.componente("uuid") ON DELETE CASCADE;
ALTER TABLE public.lms_conteudo ADD CONSTRAINT lms_conteudo_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id);
ALTER TABLE public.lms_conteudo ADD CONSTRAINT lms_conteudo_id_grupo_fkey FOREIGN KEY (id_grupo) REFERENCES public.grp_grupos(id) ON DELETE CASCADE;
ALTER TABLE public.lms_conteudo ADD CONSTRAINT lms_conteudo_id_turma_fkey FOREIGN KEY (id_turma) REFERENCES public.turmas(id) ON DELETE CASCADE;


-- public.lms_item_conteudo foreign keys

ALTER TABLE public.lms_item_conteudo ADD CONSTRAINT lms_item_conteudo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
ALTER TABLE public.lms_item_conteudo ADD CONSTRAINT lms_item_conteudo_id_arquivo_fkey FOREIGN KEY (id_arquivo) REFERENCES public.global_arquivos(id) ON DELETE SET NULL;
ALTER TABLE public.lms_item_conteudo ADD CONSTRAINT lms_item_conteudo_id_avaliacao_grupo_fkey FOREIGN KEY (id_avaliacao_grupo) REFERENCES public.avaliacao_grupo(id) ON DELETE SET NULL;
ALTER TABLE public.lms_item_conteudo ADD CONSTRAINT lms_item_conteudo_id_avaliacao_item_fkey FOREIGN KEY (id_avaliacao_item) REFERENCES public.itens_avaliacao(id) ON DELETE SET NULL;
ALTER TABLE public.lms_item_conteudo ADD CONSTRAINT lms_item_conteudo_id_avaliacao_modelo_fkey FOREIGN KEY (id_avaliacao_modelo) REFERENCES public.avaliacao_modelo(id) ON DELETE SET NULL;
ALTER TABLE public.lms_item_conteudo ADD CONSTRAINT lms_item_id_bbtk_edicao_fkey FOREIGN KEY (id_bbtk_edicao) REFERENCES public.bbtk_edicao("uuid") ON DELETE SET NULL;


-- public.lms_nota_complementar foreign keys

ALTER TABLE public.lms_nota_complementar ADD CONSTRAINT lms_nota_complementar_id_avaliacao_grupo_fkey FOREIGN KEY (id_avaliacao_grupo) REFERENCES public.avaliacao_grupo(id) ON DELETE CASCADE;
ALTER TABLE public.lms_nota_complementar ADD CONSTRAINT lms_nota_complementar_id_avaliacao_modelo_fkey FOREIGN KEY (id_avaliacao_modelo) REFERENCES public.avaliacao_modelo(id) ON DELETE SET NULL;
ALTER TABLE public.lms_nota_complementar ADD CONSTRAINT lms_nota_complementar_id_item_lms_fkey FOREIGN KEY (id_item_lms) REFERENCES public.lms_item_conteudo(id) ON DELETE CASCADE;


-- public.lms_pergunta foreign keys

ALTER TABLE public.lms_pergunta ADD CONSTRAINT lms_pergunta_id_arquivo_fkey FOREIGN KEY (id_arquivo) REFERENCES public.global_arquivos(id) ON DELETE SET NULL;
ALTER TABLE public.lms_pergunta ADD CONSTRAINT lms_pergunta_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id);
ALTER TABLE public.lms_pergunta ADD CONSTRAINT lms_pergunta_id_item_conteudo_fkey FOREIGN KEY (id_item_conteudo) REFERENCES public.lms_item_conteudo(id) ON DELETE CASCADE;


-- public.lms_resposta foreign keys

ALTER TABLE public.lms_resposta ADD CONSTRAINT lms_resposta_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id) ON DELETE SET NULL;
ALTER TABLE public.lms_resposta ADD CONSTRAINT lms_resposta_id_pergunta_fkey FOREIGN KEY (id_pergunta) REFERENCES public.lms_pergunta(id) ON DELETE CASCADE;
ALTER TABLE public.lms_resposta ADD CONSTRAINT lms_resposta_id_resposta_possivel_fkey FOREIGN KEY (id_resposta_possivel) REFERENCES public.lms_resposta_possivel(id) ON DELETE SET NULL;
ALTER TABLE public.lms_resposta ADD CONSTRAINT lms_resposta_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.user_expandido(id) ON DELETE CASCADE;
ALTER TABLE public.lms_resposta ADD CONSTRAINT lms_resposta_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id) ON DELETE SET NULL;


-- public.lms_resposta_possivel foreign keys

ALTER TABLE public.lms_resposta_possivel ADD CONSTRAINT lms_resposta_possivel_id_arquivo_fkey FOREIGN KEY (id_arquivo) REFERENCES public.global_arquivos(id) ON DELETE SET NULL;
ALTER TABLE public.lms_resposta_possivel ADD CONSTRAINT lms_resposta_possivel_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id);
ALTER TABLE public.lms_resposta_possivel ADD CONSTRAINT lms_resposta_possivel_id_pergunta_fkey FOREIGN KEY (id_pergunta) REFERENCES public.lms_pergunta(id) ON DELETE CASCADE;


-- public.lms_submissao foreign keys

ALTER TABLE public.lms_submissao ADD CONSTRAINT lms_submissao_id_aluno_fkey FOREIGN KEY (id_aluno) REFERENCES public.user_expandido(id) ON DELETE CASCADE;
ALTER TABLE public.lms_submissao ADD CONSTRAINT lms_submissao_id_arquivo_fkey FOREIGN KEY (id_arquivo) REFERENCES public.global_arquivos(id) ON DELETE SET NULL;
ALTER TABLE public.lms_submissao ADD CONSTRAINT lms_submissao_id_item_fkey FOREIGN KEY (id_item_conteudo) REFERENCES public.lms_item_conteudo(id) ON DELETE CASCADE;