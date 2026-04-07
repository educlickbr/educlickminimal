--
-- PostgreSQL database dump
--

\restrict R2sescqy6dhKTWLRNB7vqPejLLbDSdXIwlDehU4KEfEMTWIh5a6AoIhaPQw4Y7j

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
-- Name: user_expandido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_expandido (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    email text,
    nome_completo text,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: user_expandido user_expandido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_expandido
    ADD CONSTRAINT user_expandido_pkey PRIMARY KEY (id);


--
-- Name: user_expandido user_expandido_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_expandido
    ADD CONSTRAINT user_expandido_id_user_fkey FOREIGN KEY (id_user) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_expandido Somente admin pode atualizar user_expandido; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode atualizar user_expandido" ON public.user_expandido FOR UPDATE USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_expandido Somente admin pode deletar user_expandido; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode deletar user_expandido" ON public.user_expandido FOR DELETE USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_expandido Somente admin pode inserir user_expandido; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode inserir user_expandido" ON public.user_expandido FOR INSERT WITH CHECK (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_expandido Usuário vê apenas seu próprio user_expandido; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário vê apenas seu próprio user_expandido" ON public.user_expandido FOR SELECT USING ((id_user = ((auth.jwt() ->> 'sub'::text))::uuid));


--
-- Name: user_expandido; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_expandido ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict R2sescqy6dhKTWLRNB7vqPejLLbDSdXIwlDehU4KEfEMTWIh5a6AoIhaPQw4Y7j

