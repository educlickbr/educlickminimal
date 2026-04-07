

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."fin_tipo_conta" AS ENUM (
    'Banco',
    'Carteira',
    'Cartão',
    'Investimento'
);


ALTER TYPE "public"."fin_tipo_conta" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_complete_schema"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
BEGIN
    -- Get all enums
    WITH enum_types AS (
        SELECT 
            t.typname as enum_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
    )
    SELECT jsonb_build_object(
        'enums',
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', enum_name,
                    'values', to_jsonb(enum_values)
                )
            ),
            '[]'::jsonb
        )
    )
    FROM enum_types
    INTO result;

    -- Get all tables with their details
    WITH RECURSIVE 
    columns_info AS (
        SELECT 
            c.oid as table_oid,
            c.relname as table_name,
            a.attname as column_name,
            format_type(a.atttypid, a.atttypmod) as column_type,
            a.attnotnull as notnull,
            pg_get_expr(d.adbin, d.adrelid) as column_default,
            CASE 
                WHEN a.attidentity != '' THEN true
                WHEN pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%' THEN true
                ELSE false
            END as is_identity,
            EXISTS (
                SELECT 1 FROM pg_constraint con 
                WHERE con.conrelid = c.oid 
                AND con.contype = 'p' 
                AND a.attnum = ANY(con.conkey)
            ) as is_pk
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_attribute a ON a.attrelid = c.oid
        LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
        WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
        AND a.attnum > 0 
        AND NOT a.attisdropped
    ),
    fk_info AS (
        SELECT 
            c.oid as table_oid,
            jsonb_agg(
                jsonb_build_object(
                    'name', con.conname,
                    'column', col.attname,
                    'foreign_schema', fs.nspname,
                    'foreign_table', ft.relname,
                    'foreign_column', fcol.attname,
                    'on_delete', CASE con.confdeltype
                        WHEN 'a' THEN 'NO ACTION'
                        WHEN 'c' THEN 'CASCADE'
                        WHEN 'r' THEN 'RESTRICT'
                        WHEN 'n' THEN 'SET NULL'
                        WHEN 'd' THEN 'SET DEFAULT'
                        ELSE NULL
                    END
                )
            ) as foreign_keys
        FROM pg_class c
        JOIN pg_constraint con ON con.conrelid = c.oid
        JOIN pg_attribute col ON col.attrelid = con.conrelid AND col.attnum = ANY(con.conkey)
        JOIN pg_class ft ON ft.oid = con.confrelid
        JOIN pg_namespace fs ON fs.oid = ft.relnamespace
        JOIN pg_attribute fcol ON fcol.attrelid = con.confrelid AND fcol.attnum = ANY(con.confkey)
        WHERE con.contype = 'f'
        GROUP BY c.oid
    ),
    index_info AS (
        SELECT 
            c.oid as table_oid,
            jsonb_agg(
                jsonb_build_object(
                    'name', i.relname,
                    'using', am.amname,
                    'columns', (
                        SELECT jsonb_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum))
                        FROM unnest(ix.indkey) WITH ORDINALITY as u(attnum, ord)
                        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = u.attnum
                    )
                )
            ) as indexes
        FROM pg_class c
        JOIN pg_index ix ON ix.indrelid = c.oid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_am am ON am.oid = i.relam
        WHERE NOT ix.indisprimary
        GROUP BY c.oid
    ),
    policy_info AS (
        SELECT 
            c.oid as table_oid,
            jsonb_agg(
                jsonb_build_object(
                    'name', pol.polname,
                    'command', CASE pol.polcmd
                        WHEN 'r' THEN 'SELECT'
                        WHEN 'a' THEN 'INSERT'
                        WHEN 'w' THEN 'UPDATE'
                        WHEN 'd' THEN 'DELETE'
                        WHEN '*' THEN 'ALL'
                    END,
                    'roles', (
                        SELECT string_agg(quote_ident(r.rolname), ', ')
                        FROM pg_roles r
                        WHERE r.oid = ANY(pol.polroles)
                    ),
                    'using', pg_get_expr(pol.polqual, pol.polrelid),
                    'check', pg_get_expr(pol.polwithcheck, pol.polrelid)
                )
            ) as policies
        FROM pg_class c
        JOIN pg_policy pol ON pol.polrelid = c.oid
        GROUP BY c.oid
    ),
    trigger_info AS (
        SELECT 
            c.oid as table_oid,
            jsonb_agg(
                jsonb_build_object(
                    'name', t.tgname,
                    'timing', CASE 
                        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
                        WHEN t.tgtype & 4 = 4 THEN 'AFTER'
                        WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
                    END,
                    'events', (
                        CASE WHEN t.tgtype & 1 = 1 THEN 'INSERT'
                             WHEN t.tgtype & 8 = 8 THEN 'DELETE'
                             WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
                             WHEN t.tgtype & 32 = 32 THEN 'TRUNCATE'
                        END
                    ),
                    'statement', pg_get_triggerdef(t.oid)
                )
            ) as triggers
        FROM pg_class c
        JOIN pg_trigger t ON t.tgrelid = c.oid
        WHERE NOT t.tgisinternal
        GROUP BY c.oid
    ),
    table_info AS (
        SELECT DISTINCT 
            c.table_oid,
            c.table_name,
            jsonb_agg(
                jsonb_build_object(
                    'name', c.column_name,
                    'type', c.column_type,
                    'notnull', c.notnull,
                    'default', c.column_default,
                    'identity', c.is_identity,
                    'is_pk', c.is_pk
                ) ORDER BY c.column_name
            ) as columns,
            COALESCE(fk.foreign_keys, '[]'::jsonb) as foreign_keys,
            COALESCE(i.indexes, '[]'::jsonb) as indexes,
            COALESCE(p.policies, '[]'::jsonb) as policies,
            COALESCE(t.triggers, '[]'::jsonb) as triggers
        FROM columns_info c
        LEFT JOIN fk_info fk ON fk.table_oid = c.table_oid
        LEFT JOIN index_info i ON i.table_oid = c.table_oid
        LEFT JOIN policy_info p ON p.table_oid = c.table_oid
        LEFT JOIN trigger_info t ON t.table_oid = c.table_oid
        GROUP BY c.table_oid, c.table_name, fk.foreign_keys, i.indexes, p.policies, t.triggers
    )
    SELECT result || jsonb_build_object(
        'tables',
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', table_name,
                    'columns', columns,
                    'foreign_keys', foreign_keys,
                    'indexes', indexes,
                    'policies', policies,
                    'triggers', triggers
                )
            ),
            '[]'::jsonb
        )
    )
    FROM table_info
    INTO result;

    -- Get all functions
    WITH function_info AS (
        SELECT 
            p.proname AS name,
            pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
    )
    SELECT result || jsonb_build_object(
        'functions',
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', name,
                    'definition', definition
                )
            ),
            '[]'::jsonb
        )
    )
    FROM function_info
    INTO result;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_complete_schema"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leads_entidade"("p_id_entidade" "uuid") RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "email" "text", "nome" "text", "empresa" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT l.id, l.created_at, l.email, l.nome, l.empresa
    FROM public.leads l
    WHERE l.id_entidade = p_id_entidade
    ORDER BY l.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_leads_entidade"("p_id_entidade" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mensagens_leads_entidade"("p_id_entidade" "uuid") RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "mensagem" "text", "id_lead" "uuid", "lead_email" "text", "lead_nome" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id, 
        m.created_at, 
        m.mensagem, 
        m.id_lead,
        l.email as lead_email,
        l.nome as lead_nome
    FROM public.mensagens m
    JOIN public.leads l ON m.id_lead = l.id
    WHERE l.id_entidade = p_id_entidade
    ORDER BY m.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_mensagens_leads_entidade"("p_id_entidade" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."noticias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "header" "text",
    "noticia" "text",
    "id_entidade" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "publicada" boolean DEFAULT false
);


ALTER TABLE "public"."noticias" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_noticia_completa"("p_id" "uuid") RETURNS SETOF "public"."noticias"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.noticias n
    WHERE n.id = p_id;
END;
$$;


ALTER FUNCTION "public"."get_noticia_completa"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_noticias_entidade"("p_id_entidade" "uuid") RETURNS SETOF "public"."noticias"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.noticias n
    WHERE n.id_entidade = p_id_entidade
    ORDER BY n.criado_em DESC;
END;
$$;


ALTER FUNCTION "public"."get_noticias_entidade"("p_id_entidade" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_noticias_entidade_home"("p_id_entidade" "uuid") RETURNS SETOF "public"."noticias"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.noticias n
    WHERE n.id_entidade = p_id_entidade
      AND n.publicada = true
    ORDER BY n.criado_em DESC
    LIMIT 3; -- Limitando a 3 para a home, como no design original
END;
$$;


ALTER FUNCTION "public"."get_noticias_entidade_home"("p_id_entidade" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_custom_claims"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  claims jsonb;
  v_role_nome text;
  v_entidades jsonb;
begin
  -- 1️⃣ Busca o papel do usuário
  select p.nome
  into v_role_nome
  from public.user_papeis_auth pa
  join public.user_papeis p on pa.id_papel = p.id
  where pa.id_user = (event->>'user_id')::uuid
  limit 1;

  -- 2️⃣ Busca as entidades (pode ter mais de uma)
  select jsonb_agg(ueu.id_entidade)
  into v_entidades
  from public.user_entidade_user ueu
  join public.user_expandido ue on ue.id = ueu.id_user
  where ue.id_user = (event->>'user_id')::uuid;

  -- 3️⃣ Inicializa claims existentes (caso já haja algo)
  claims := coalesce(event->'claims', '{}'::jsonb);

  -- 4️⃣ Adiciona o papel
  if v_role_nome is not null then
    claims := jsonb_set(claims, '{papel}', to_jsonb(v_role_nome));
  end if;

  -- 5️⃣ Adiciona as entidades
  if v_entidades is not null then
    claims := jsonb_set(claims, '{entidades}', v_entidades);
  end if;

  -- 6️⃣ Retorna o evento atualizado
  return jsonb_set(event, '{claims}', claims);
end;
$$;


ALTER FUNCTION "public"."jwt_custom_claims"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_lead_mensagem"("p_nome" "text", "p_email" "text", "p_empresa" "text", "p_mensagem" "text", "p_id_entidade" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_lead_id uuid;
  v_msg_id  uuid;
begin
  -- Validação mínima
  if coalesce(trim(p_email), '') = '' then
    raise exception 'email é obrigatório';
  end if;

  -- Procura lead por e-mail (case-insensitive)
  select l.id
  into v_lead_id
  from public.leads l
  where lower(l.email) = lower(trim(p_email))
  limit 1;

  -- Se não existir, cria
  if v_lead_id is null then
    insert into public.leads (email, nome, empresa, id_entidade)
    values (
      trim(p_email),
      nullif(trim(p_nome), ''),
      nullif(trim(p_empresa), ''),
      p_id_entidade
    )
    returning id into v_lead_id;
  else
    -- Se já existir, atualiza nome/empresa/entidade apenas se vierem preenchidos/diferentes
    update public.leads
       set nome    = coalesce(nullif(trim(p_nome), ''), nome),
           empresa = coalesce(nullif(trim(p_empresa), ''), empresa),
           id_entidade = coalesce(p_id_entidade, id_entidade) -- Atualiza entidade se fornecida
     where id = v_lead_id;
  end if;

  -- Cria a mensagem vinculada ao lead
  insert into public.mensagens (mensagem, id_lead)
  values (nullif(trim(p_mensagem), ''), v_lead_id)
  returning id into v_msg_id;

  return jsonb_build_object('success', true);
exception
  when others then
    -- Retorna erro em JSON (útil para log/depuração do front)
    return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;


ALTER FUNCTION "public"."salvar_lead_mensagem"("p_nome" "text", "p_email" "text", "p_empresa" "text", "p_mensagem" "text", "p_id_entidade" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_noticia"("p_id" "uuid", "p_header" "text", "p_noticia" "text", "p_publicada" boolean, "p_id_entidade" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_id uuid;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO public.noticias (header, noticia, publicada, id_entidade)
        VALUES (p_header, p_noticia, p_publicada, p_id_entidade)
        RETURNING id INTO v_id;
    ELSE
        UPDATE public.noticias
        SET header = p_header,
            noticia = p_noticia,
            publicada = p_publicada
        WHERE id = p_id AND id_entidade = p_id_entidade
        RETURNING id INTO v_id;
    END IF;

    RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."upsert_noticia"("p_id" "uuid", "p_header" "text", "p_noticia" "text", "p_publicada" boolean, "p_id_entidade" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_status_noticia"("p_id" "uuid", "p_publicada" boolean, "p_id_entidade" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.noticias
    SET publicada = p_publicada
    WHERE id = p_id AND id_entidade = p_id_entidade;

    IF FOUND THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;


ALTER FUNCTION "public"."upsert_status_noticia"("p_id" "uuid", "p_publicada" boolean, "p_id_entidade" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_entidade" "uuid",
    "nome" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "fin_categorias_tipo_check" CHECK (("tipo" = ANY (ARRAY['receita'::"text", 'despesa'::"text"])))
);


ALTER TABLE "public"."fin_categorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_contas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_entidade" "uuid",
    "nome" "text" NOT NULL,
    "tipo" "public"."fin_tipo_conta" DEFAULT 'Banco'::"public"."fin_tipo_conta",
    "saldo_inicial" numeric(12,2) DEFAULT 0,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fin_contas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_lancamentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_entidade" "uuid",
    "id_conta" "uuid",
    "id_categoria" "uuid",
    "id_subcategoria" "uuid",
    "descricao" "text",
    "valor" numeric(12,2) NOT NULL,
    "tipo" "text" NOT NULL,
    "data" "date" DEFAULT CURRENT_DATE NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "fin_lancamentos_tipo_check" CHECK (("tipo" = ANY (ARRAY['receita'::"text", 'despesa'::"text"])))
);


ALTER TABLE "public"."fin_lancamentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fin_subcategorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_categoria" "uuid",
    "nome" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "id_entidade" "uuid"
);


ALTER TABLE "public"."fin_subcategorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    "nome" "text",
    "empresa" "text",
    "id_entidade" "uuid"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mensagens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mensagem" "text",
    "id_lead" "uuid"
);


ALTER TABLE "public"."mensagens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_entidade_user" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_entidade" "uuid",
    "id_user" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_entidade_user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_entidades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome_entidade" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_entidades_tipo_check" CHECK (("tipo" = ANY (ARRAY['familia'::"text", 'empresa'::"text"])))
);


ALTER TABLE "public"."user_entidades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_expandido" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_user" "uuid",
    "email" "text",
    "nome_completo" "text",
    "criado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_expandido" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_papeis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL
);


ALTER TABLE "public"."user_papeis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_papeis_auth" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_user" "uuid",
    "id_papel" "uuid"
);


ALTER TABLE "public"."user_papeis_auth" OWNER TO "postgres";


ALTER TABLE ONLY "public"."fin_categorias"
    ADD CONSTRAINT "fin_categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fin_contas"
    ADD CONSTRAINT "fin_contas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fin_lancamentos"
    ADD CONSTRAINT "fin_lancamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fin_subcategorias"
    ADD CONSTRAINT "fin_subcategorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mensagens"
    ADD CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."noticias"
    ADD CONSTRAINT "noticias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_entidade_user"
    ADD CONSTRAINT "user_entidade_user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_entidades"
    ADD CONSTRAINT "user_entidades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_expandido"
    ADD CONSTRAINT "user_expandido_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_papeis_auth"
    ADD CONSTRAINT "user_papeis_auth_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_papeis"
    ADD CONSTRAINT "user_papeis_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."user_papeis"
    ADD CONSTRAINT "user_papeis_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "leads_email_unique_ci" ON "public"."leads" USING "btree" ("lower"("email"));



ALTER TABLE ONLY "public"."fin_categorias"
    ADD CONSTRAINT "fin_categorias_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."user_expandido"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fin_categorias"
    ADD CONSTRAINT "fin_categorias_id_entidade_fkey" FOREIGN KEY ("id_entidade") REFERENCES "public"."user_entidades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_contas"
    ADD CONSTRAINT "fin_contas_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."user_expandido"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fin_contas"
    ADD CONSTRAINT "fin_contas_id_entidade_fkey" FOREIGN KEY ("id_entidade") REFERENCES "public"."user_entidades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_lancamentos"
    ADD CONSTRAINT "fin_lancamentos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."user_expandido"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fin_lancamentos"
    ADD CONSTRAINT "fin_lancamentos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."fin_categorias"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fin_lancamentos"
    ADD CONSTRAINT "fin_lancamentos_id_conta_fkey" FOREIGN KEY ("id_conta") REFERENCES "public"."fin_contas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_lancamentos"
    ADD CONSTRAINT "fin_lancamentos_id_entidade_fkey" FOREIGN KEY ("id_entidade") REFERENCES "public"."user_entidades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_lancamentos"
    ADD CONSTRAINT "fin_lancamentos_id_subcategoria_fkey" FOREIGN KEY ("id_subcategoria") REFERENCES "public"."fin_subcategorias"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fin_subcategorias"
    ADD CONSTRAINT "fin_subcategorias_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."fin_categorias"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fin_subcategorias"
    ADD CONSTRAINT "fin_subcategorias_id_entidade_fkey" FOREIGN KEY ("id_entidade") REFERENCES "public"."user_entidades"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_id_entidade_fkey" FOREIGN KEY ("id_entidade") REFERENCES "public"."user_entidades"("id");



ALTER TABLE ONLY "public"."mensagens"
    ADD CONSTRAINT "mensagens_id_lead_fkey" FOREIGN KEY ("id_lead") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."noticias"
    ADD CONSTRAINT "noticias_id_entidade_fkey" FOREIGN KEY ("id_entidade") REFERENCES "public"."user_entidades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_entidade_user"
    ADD CONSTRAINT "user_entidade_user_id_entidade_fkey" FOREIGN KEY ("id_entidade") REFERENCES "public"."user_entidades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_entidade_user"
    ADD CONSTRAINT "user_entidade_user_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."user_expandido"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_expandido"
    ADD CONSTRAINT "user_expandido_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_papeis_auth"
    ADD CONSTRAINT "user_papeis_auth_id_papel_fkey" FOREIGN KEY ("id_papel") REFERENCES "public"."user_papeis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_papeis_auth"
    ADD CONSTRAINT "user_papeis_auth_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin gerencia noticias da própria entidade" ON "public"."noticias" TO "authenticated" USING ((((("auth"."jwt"() -> 'claims'::"text") ->> 'papel'::"text") = 'admin'::"text") AND ((("auth"."jwt"() -> 'claims'::"text") -> 'entidades'::"text") @> "to_jsonb"("id_entidade")))) WITH CHECK ((((("auth"."jwt"() -> 'claims'::"text") ->> 'papel'::"text") = 'admin'::"text") AND ((("auth"."jwt"() -> 'claims'::"text") -> 'entidades'::"text") @> "to_jsonb"("id_entidade"))));



CREATE POLICY "Admin ou membro da entidade pode ver" ON "public"."user_entidades" FOR SELECT USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."user_entidade_user" "ueu"
  WHERE (("ueu"."id_entidade" = "user_entidades"."id") AND ("ueu"."id_user" IN ( SELECT "user_expandido"."id"
           FROM "public"."user_expandido"
          WHERE ("user_expandido"."id_user" = (("auth"."jwt"() ->> 'sub'::"text"))::"uuid"))))))));



CREATE POLICY "Admin vê leads da própria entidade" ON "public"."leads" TO "authenticated" USING ((((("auth"."jwt"() -> 'claims'::"text") ->> 'papel'::"text") = 'admin'::"text") AND ((("auth"."jwt"() -> 'claims'::"text") -> 'entidades'::"text") @> "to_jsonb"("id_entidade"))));



CREATE POLICY "Admin vê mensagens dos seus leads" ON "public"."mensagens" TO "authenticated" USING (("id_lead" IN ( SELECT "leads"."id"
   FROM "public"."leads")));



CREATE POLICY "Delete permitido para admin e user_fin (entidades próprias)" ON "public"."fin_categorias" FOR DELETE USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_categorias"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Delete permitido para admin e user_fin (entidades próprias)" ON "public"."fin_contas" FOR DELETE USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_contas"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Delete permitido para admin e user_fin (entidades próprias)" ON "public"."fin_lancamentos" FOR DELETE USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_lancamentos"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Delete permitido para admin e user_fin (entidades próprias)" ON "public"."fin_subcategorias" FOR DELETE USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_subcategorias"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Insert permitido para admin e user_fin (entidades próprias)" ON "public"."fin_categorias" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_categorias"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Insert permitido para admin e user_fin (entidades próprias)" ON "public"."fin_contas" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_contas"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Insert permitido para admin e user_fin (entidades próprias)" ON "public"."fin_lancamentos" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_lancamentos"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Insert permitido para admin e user_fin (entidades próprias)" ON "public"."fin_subcategorias" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_subcategorias"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Público vê todas as noticias" ON "public"."noticias" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Select permitido para admin e user_fin (entidades próprias)" ON "public"."fin_categorias" FOR SELECT USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_categorias"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Select permitido para admin e user_fin (entidades próprias)" ON "public"."fin_contas" FOR SELECT USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_contas"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Select permitido para admin e user_fin (entidades próprias)" ON "public"."fin_lancamentos" FOR SELECT USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_lancamentos"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Select permitido para admin e user_fin (entidades próprias)" ON "public"."fin_subcategorias" FOR SELECT USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_subcategorias"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Somente admin pode atualizar user_entidade_user" ON "public"."user_entidade_user" FOR UPDATE USING ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode atualizar user_entidades" ON "public"."user_entidades" FOR UPDATE USING ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode atualizar user_expandido" ON "public"."user_expandido" FOR UPDATE USING ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode atualizar user_papeis_auth" ON "public"."user_papeis_auth" FOR UPDATE USING ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode deletar user_entidade_user" ON "public"."user_entidade_user" FOR DELETE USING ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode deletar user_entidades" ON "public"."user_entidades" FOR DELETE USING ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode deletar user_expandido" ON "public"."user_expandido" FOR DELETE USING ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode deletar user_papeis_auth" ON "public"."user_papeis_auth" FOR DELETE USING ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode inserir user_entidade_user" ON "public"."user_entidade_user" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode inserir user_entidades" ON "public"."user_entidades" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode inserir user_expandido" ON "public"."user_expandido" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Somente admin pode inserir user_papeis_auth" ON "public"."user_papeis_auth" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text"));



CREATE POLICY "Update permitido para admin e user_fin (entidades próprias)" ON "public"."fin_categorias" FOR UPDATE USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_categorias"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Update permitido para admin e user_fin (entidades próprias)" ON "public"."fin_contas" FOR UPDATE USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_contas"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Update permitido para admin e user_fin (entidades próprias)" ON "public"."fin_lancamentos" FOR UPDATE USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_lancamentos"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Update permitido para admin e user_fin (entidades próprias)" ON "public"."fin_subcategorias" FOR UPDATE USING (((("auth"."jwt"() ->> 'papel'::"text") = 'admin'::"text") OR ((("auth"."jwt"() ->> 'papel'::"text") = 'user_fin'::"text") AND (EXISTS ( SELECT 1
   FROM "jsonb_array_elements_text"(("auth"."jwt"() -> 'entidades'::"text")) "e"("ent")
  WHERE ("fin_subcategorias"."id_entidade" = ("e"."ent")::"uuid"))))));



CREATE POLICY "Usuário vê apenas seu próprio papel" ON "public"."user_papeis_auth" FOR SELECT USING (("id_user" = (("auth"."jwt"() ->> 'sub'::"text"))::"uuid"));



CREATE POLICY "Usuário vê apenas seu próprio user_expandido" ON "public"."user_expandido" FOR SELECT USING (("id_user" = (("auth"."jwt"() ->> 'sub'::"text"))::"uuid"));



CREATE POLICY "Usuário vê apenas suas próprias entidades" ON "public"."user_entidade_user" FOR SELECT USING (("id_user" IN ( SELECT "user_expandido"."id"
   FROM "public"."user_expandido"
  WHERE ("user_expandido"."id_user" = (("auth"."jwt"() ->> 'sub'::"text"))::"uuid"))));



ALTER TABLE "public"."fin_categorias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fin_contas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fin_lancamentos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fin_subcategorias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mensagens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."noticias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "todos veem papeis" ON "public"."user_papeis" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."user_entidade_user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_entidades" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_expandido" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_papeis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_papeis_auth" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."mensagens";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";














































































































































































GRANT ALL ON FUNCTION "public"."get_complete_schema"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_complete_schema"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_complete_schema"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leads_entidade"("p_id_entidade" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_leads_entidade"("p_id_entidade" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leads_entidade"("p_id_entidade" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mensagens_leads_entidade"("p_id_entidade" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mensagens_leads_entidade"("p_id_entidade" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mensagens_leads_entidade"("p_id_entidade" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."noticias" TO "anon";
GRANT ALL ON TABLE "public"."noticias" TO "authenticated";
GRANT ALL ON TABLE "public"."noticias" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_noticia_completa"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_noticia_completa"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_noticia_completa"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_noticias_entidade"("p_id_entidade" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_noticias_entidade"("p_id_entidade" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_noticias_entidade"("p_id_entidade" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_noticias_entidade_home"("p_id_entidade" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_noticias_entidade_home"("p_id_entidade" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_noticias_entidade_home"("p_id_entidade" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."jwt_custom_claims"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."jwt_custom_claims"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."jwt_custom_claims"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."salvar_lead_mensagem"("p_nome" "text", "p_email" "text", "p_empresa" "text", "p_mensagem" "text", "p_id_entidade" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."salvar_lead_mensagem"("p_nome" "text", "p_email" "text", "p_empresa" "text", "p_mensagem" "text", "p_id_entidade" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."salvar_lead_mensagem"("p_nome" "text", "p_email" "text", "p_empresa" "text", "p_mensagem" "text", "p_id_entidade" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_noticia"("p_id" "uuid", "p_header" "text", "p_noticia" "text", "p_publicada" boolean, "p_id_entidade" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_noticia"("p_id" "uuid", "p_header" "text", "p_noticia" "text", "p_publicada" boolean, "p_id_entidade" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_noticia"("p_id" "uuid", "p_header" "text", "p_noticia" "text", "p_publicada" boolean, "p_id_entidade" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_status_noticia"("p_id" "uuid", "p_publicada" boolean, "p_id_entidade" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_status_noticia"("p_id" "uuid", "p_publicada" boolean, "p_id_entidade" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_status_noticia"("p_id" "uuid", "p_publicada" boolean, "p_id_entidade" "uuid") TO "service_role";
























GRANT ALL ON TABLE "public"."fin_categorias" TO "anon";
GRANT ALL ON TABLE "public"."fin_categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_categorias" TO "service_role";



GRANT ALL ON TABLE "public"."fin_contas" TO "anon";
GRANT ALL ON TABLE "public"."fin_contas" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_contas" TO "service_role";



GRANT ALL ON TABLE "public"."fin_lancamentos" TO "anon";
GRANT ALL ON TABLE "public"."fin_lancamentos" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_lancamentos" TO "service_role";



GRANT ALL ON TABLE "public"."fin_subcategorias" TO "anon";
GRANT ALL ON TABLE "public"."fin_subcategorias" TO "authenticated";
GRANT ALL ON TABLE "public"."fin_subcategorias" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."mensagens" TO "anon";
GRANT ALL ON TABLE "public"."mensagens" TO "authenticated";
GRANT ALL ON TABLE "public"."mensagens" TO "service_role";



GRANT ALL ON TABLE "public"."user_entidade_user" TO "anon";
GRANT ALL ON TABLE "public"."user_entidade_user" TO "authenticated";
GRANT ALL ON TABLE "public"."user_entidade_user" TO "service_role";



GRANT ALL ON TABLE "public"."user_entidades" TO "anon";
GRANT ALL ON TABLE "public"."user_entidades" TO "authenticated";
GRANT ALL ON TABLE "public"."user_entidades" TO "service_role";



GRANT ALL ON TABLE "public"."user_expandido" TO "anon";
GRANT ALL ON TABLE "public"."user_expandido" TO "authenticated";
GRANT ALL ON TABLE "public"."user_expandido" TO "service_role";



GRANT ALL ON TABLE "public"."user_papeis" TO "anon";
GRANT ALL ON TABLE "public"."user_papeis" TO "authenticated";
GRANT ALL ON TABLE "public"."user_papeis" TO "service_role";



GRANT ALL ON TABLE "public"."user_papeis_auth" TO "anon";
GRANT ALL ON TABLE "public"."user_papeis_auth" TO "authenticated";
GRANT ALL ON TABLE "public"."user_papeis_auth" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























drop extension if exists "pg_net";

drop policy "Público vê todas as noticias" on "public"."noticias";


  create policy "Público vê todas as noticias"
  on "public"."noticias"
  as permissive
  for select
  to anon, authenticated
using (true);


CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


