--
-- PostgreSQL database dump
--

\restrict 5PKneVqmyhlDjWo1l3CTwHacQgJ8b8pGBWMZ1F4ghDJJ5BMo2zrPtnkB3rrq2Ly

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
-- Name: user_papeis_auth; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_papeis_auth (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_user uuid,
    id_papel uuid
);


--
-- Name: user_papeis_auth user_papeis_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_papeis_auth
    ADD CONSTRAINT user_papeis_auth_pkey PRIMARY KEY (id);


--
-- Name: user_papeis_auth user_papeis_auth_id_papel_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_papeis_auth
    ADD CONSTRAINT user_papeis_auth_id_papel_fkey FOREIGN KEY (id_papel) REFERENCES public.user_papeis(id) ON DELETE CASCADE;


--
-- Name: user_papeis_auth user_papeis_auth_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_papeis_auth
    ADD CONSTRAINT user_papeis_auth_id_user_fkey FOREIGN KEY (id_user) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_papeis_auth Somente admin pode atualizar user_papeis_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode atualizar user_papeis_auth" ON public.user_papeis_auth FOR UPDATE USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_papeis_auth Somente admin pode deletar user_papeis_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode deletar user_papeis_auth" ON public.user_papeis_auth FOR DELETE USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_papeis_auth Somente admin pode inserir user_papeis_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode inserir user_papeis_auth" ON public.user_papeis_auth FOR INSERT WITH CHECK (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_papeis_auth Usuário vê apenas seu próprio papel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário vê apenas seu próprio papel" ON public.user_papeis_auth FOR SELECT USING ((id_user = ((auth.jwt() ->> 'sub'::text))::uuid));


--
-- Name: user_papeis_auth; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_papeis_auth ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 5PKneVqmyhlDjWo1l3CTwHacQgJ8b8pGBWMZ1F4ghDJJ5BMo2zrPtnkB3rrq2Ly

