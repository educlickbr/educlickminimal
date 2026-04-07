--
-- PostgreSQL database dump
--

\restrict fyJ5gjsPAXUNKASW6lPVOf2teFXsFCAugfzUeOwArrEdf7OwUHRAJKkn7SWZfXY

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.7 (Debian 17.7-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_table_access_method = heap;

--
-- Name: user_entidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_entidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome_entidade text NOT NULL,
    tipo text NOT NULL,
    criado_em timestamp with time zone DEFAULT now(),
    CONSTRAINT user_entidades_tipo_check CHECK ((tipo = ANY (ARRAY['familia'::text, 'empresa'::text])))
);


--
-- Name: user_entidades user_entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entidades
    ADD CONSTRAINT user_entidades_pkey PRIMARY KEY (id);


--
-- Name: user_entidades Admin ou membro da entidade pode ver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin ou membro da entidade pode ver" ON public.user_entidades FOR SELECT USING ((((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.user_entidade_user ueu
  WHERE ((ueu.id_entidade = user_entidades.id) AND (ueu.id_user IN ( SELECT user_expandido.id
           FROM public.user_expandido
          WHERE (user_expandido.id_user = ((auth.jwt() ->> 'sub'::text))::uuid))))))));


--
-- Name: user_entidades Somente admin pode atualizar user_entidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode atualizar user_entidades" ON public.user_entidades FOR UPDATE USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_entidades Somente admin pode deletar user_entidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode deletar user_entidades" ON public.user_entidades FOR DELETE USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_entidades Somente admin pode inserir user_entidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode inserir user_entidades" ON public.user_entidades FOR INSERT WITH CHECK (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_entidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_entidades ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict fyJ5gjsPAXUNKASW6lPVOf2teFXsFCAugfzUeOwArrEdf7OwUHRAJKkn7SWZfXY

