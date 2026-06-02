-- public.produto definition

-- Drop table

-- DROP TABLE public.produto;

CREATE TABLE public.produto (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	nome text NOT NULL,
	slug text NOT NULL,
	descricao text NULL,
	criado_em timestamptz DEFAULT now() NULL,
	CONSTRAINT produto_pkey PRIMARY KEY (id),
	CONSTRAINT produto_slug_key UNIQUE (slug)
);
ALTER TABLE public.produto ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Produtos são visíveis para todos os autenticados" ON public.produto
 AS PERMISSIVE
 FOR SELECT
 USING ((auth.role() = 'authenticated'::text));


-- public.user_entidades definition

-- Drop table

-- DROP TABLE public.user_entidades;

CREATE TABLE public.user_entidades (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	nome_entidade text NOT NULL,
	tipo text NOT NULL,
	criado_em timestamptz DEFAULT now() NULL,
	url text NULL,
	logo_aberto text NULL,
	logo_fechado text NULL,
	cor_principal text NULL,
	cor_principal_hover text NULL,
	cor_secundaria text NULL,
	cor_secundaria_hover text NULL,
	criado_por uuid NULL,
	modificado_por uuid NULL,
	modificado_em timestamptz DEFAULT now() NULL,
	CONSTRAINT user_entidades_pkey PRIMARY KEY (id),
	CONSTRAINT user_entidades_tipo_check CHECK ((tipo = ANY (ARRAY['familia'::text, 'empresa'::text]))),
	CONSTRAINT user_entidades_url_key UNIQUE (url)
);
ALTER TABLE public.user_entidades ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Admin ou membro da entidade pode ver" ON public.user_entidades
 AS PERMISSIVE
 FOR SELECT
 USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM user_entidade_user ueu
  WHERE ((ueu.id_entidade = user_entidades.id) AND (ueu.id_user IN ( SELECT user_expandido.id
           FROM user_expandido
          WHERE (user_expandido.id_user = ((auth.jwt() ->> 'sub'::text))::uuid))))))));
CREATE POLICY "Somente admin pode atualizar user_entidades" ON public.user_entidades
 AS PERMISSIVE
 FOR UPDATE
 USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Somente admin pode deletar user_entidades" ON public.user_entidades
 AS PERMISSIVE
 FOR DELETE
 USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Somente admin pode inserir user_entidades" ON public.user_entidades
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


-- public.user_papeis definition

-- Drop table

-- DROP TABLE public.user_papeis;

CREATE TABLE public.user_papeis (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	nome text NOT NULL,
	CONSTRAINT user_papeis_nome_key UNIQUE (nome),
	CONSTRAINT user_papeis_pkey PRIMARY KEY (id)
);
ALTER TABLE public.user_papeis ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "todos veem papeis" ON public.user_papeis
 AS PERMISSIVE
 FOR SELECT
 TO authenticated
 USING (true);


-- public.user_entidade_user definition

-- Drop table

-- DROP TABLE public.user_entidade_user;

CREATE TABLE public.user_entidade_user (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_entidade uuid NULL,
	id_user uuid NULL,
	criado_em timestamptz DEFAULT now() NULL,
	CONSTRAINT user_entidade_user_pkey PRIMARY KEY (id)
);
ALTER TABLE public.user_entidade_user ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Somente admin pode atualizar user_entidade_user" ON public.user_entidade_user
 AS PERMISSIVE
 FOR UPDATE
 USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Somente admin pode deletar user_entidade_user" ON public.user_entidade_user
 AS PERMISSIVE
 FOR DELETE
 USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Somente admin pode inserir user_entidade_user" ON public.user_entidade_user
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Usuário vê apenas suas próprias entidades" ON public.user_entidade_user
 AS PERMISSIVE
 FOR SELECT
 USING ((id_user IN ( SELECT user_expandido.id
   FROM user_expandido
  WHERE (user_expandido.id_user = ((auth.jwt() ->> 'sub'::text))::uuid))));


-- public.user_expandido definition

-- Drop table

-- DROP TABLE public.user_expandido;

CREATE TABLE public.user_expandido (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_user uuid NULL,
	email text NULL,
	nome_completo text NULL,
	criado_em timestamptz DEFAULT now() NULL,
	CONSTRAINT user_expandido_pkey PRIMARY KEY (id)
);
ALTER TABLE public.user_expandido ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Somente admin pode atualizar user_expandido" ON public.user_expandido
 AS PERMISSIVE
 FOR UPDATE
 USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Somente admin pode deletar user_expandido" ON public.user_expandido
 AS PERMISSIVE
 FOR DELETE
 USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Somente admin pode inserir user_expandido" ON public.user_expandido
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Usuário vê apenas seu próprio user_expandido" ON public.user_expandido
 AS PERMISSIVE
 FOR SELECT
 USING ((id_user = ((auth.jwt() ->> 'sub'::text))::uuid));


-- public.user_papeis_auth definition

-- Drop table

-- DROP TABLE public.user_papeis_auth;

CREATE TABLE public.user_papeis_auth (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_user uuid NULL,
	id_papel uuid NULL,
	CONSTRAINT user_papeis_auth_pkey PRIMARY KEY (id)
);
ALTER TABLE public.user_papeis_auth ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Somente admin pode atualizar user_papeis_auth" ON public.user_papeis_auth
 AS PERMISSIVE
 FOR UPDATE
 USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Somente admin pode deletar user_papeis_auth" ON public.user_papeis_auth
 AS PERMISSIVE
 FOR DELETE
 USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Somente admin pode inserir user_papeis_auth" ON public.user_papeis_auth
 AS PERMISSIVE
 FOR INSERT
 WITH CHECK (((auth.jwt() ->> 'papel'::text) = 'admin'::text));
CREATE POLICY "Usuário vê apenas seu próprio papel" ON public.user_papeis_auth
 AS PERMISSIVE
 FOR SELECT
 USING ((id_user = ((auth.jwt() ->> 'sub'::text))::uuid));


-- public.user_produto definition

-- Drop table

-- DROP TABLE public.user_produto;

CREATE TABLE public.user_produto (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	id_user_expandido uuid NOT NULL,
	papel_no_produto text NULL,
	ativo bool DEFAULT true NULL,
	criado_em timestamptz DEFAULT now() NULL,
	id_entidade_produto uuid NULL,
	CONSTRAINT uq_user_entidade_produto UNIQUE (id_user_expandido, id_entidade_produto),
	CONSTRAINT user_produto_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_user_produto_user ON public.user_produto USING btree (id_user_expandido);
ALTER TABLE public.user_produto ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY "Usuário vê suas próprias permissões de produto" ON public.user_produto
 AS PERMISSIVE
 FOR SELECT
 USING ((id_user_expandido = ( SELECT user_expandido.id
   FROM user_expandido
  WHERE (user_expandido.id_user = auth.uid()))));


-- public.user_entidade_user foreign keys

ALTER TABLE public.user_entidade_user ADD CONSTRAINT user_entidade_user_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
ALTER TABLE public.user_entidade_user ADD CONSTRAINT user_entidade_user_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.user_expandido(id) ON DELETE CASCADE;


-- public.user_expandido foreign keys

ALTER TABLE public.user_expandido ADD CONSTRAINT user_expandido_id_user_fkey FOREIGN KEY (id_user) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.user_papeis_auth foreign keys

ALTER TABLE public.user_papeis_auth ADD CONSTRAINT user_papeis_auth_id_papel_fkey FOREIGN KEY (id_papel) REFERENCES public.user_papeis(id) ON DELETE CASCADE;
ALTER TABLE public.user_papeis_auth ADD CONSTRAINT user_papeis_auth_id_user_fkey FOREIGN KEY (id_user) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.user_produto foreign keys

ALTER TABLE public.user_produto ADD CONSTRAINT user_produto_id_entidade_produto_fkey FOREIGN KEY (id_entidade_produto) REFERENCES public.entidade_produto(id) ON DELETE CASCADE;
ALTER TABLE public.user_produto ADD CONSTRAINT user_produto_id_user_expandido_fkey FOREIGN KEY (id_user_expandido) REFERENCES public.user_expandido(id) ON DELETE CASCADE;