--
-- PostgreSQL database dump
--

\restrict mEAzLqlpuV98Dw8QlMq4NW8fKyw3plEqnXQkvrew6cYnUrgKoG9shmw9tDAvGbd

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
-- Name: user_entidade_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_entidade_user (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade uuid,
    id_user uuid,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: user_entidade_user user_entidade_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entidade_user
    ADD CONSTRAINT user_entidade_user_pkey PRIMARY KEY (id);


--
-- Name: user_entidade_user user_entidade_user_id_entidade_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entidade_user
    ADD CONSTRAINT user_entidade_user_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;


--
-- Name: user_entidade_user user_entidade_user_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entidade_user
    ADD CONSTRAINT user_entidade_user_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.user_expandido(id) ON DELETE CASCADE;


--
-- Name: user_entidade_user Somente admin pode atualizar user_entidade_user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode atualizar user_entidade_user" ON public.user_entidade_user FOR UPDATE USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_entidade_user Somente admin pode deletar user_entidade_user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode deletar user_entidade_user" ON public.user_entidade_user FOR DELETE USING (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_entidade_user Somente admin pode inserir user_entidade_user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Somente admin pode inserir user_entidade_user" ON public.user_entidade_user FOR INSERT WITH CHECK (((auth.jwt() ->> 'papel'::text) = 'admin'::text));


--
-- Name: user_entidade_user Usuário vê apenas suas próprias entidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuário vê apenas suas próprias entidades" ON public.user_entidade_user FOR SELECT USING ((id_user IN ( SELECT user_expandido.id
   FROM public.user_expandido
  WHERE (user_expandido.id_user = ((auth.jwt() ->> 'sub'::text))::uuid))));


--
-- Name: user_entidade_user; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_entidade_user ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict mEAzLqlpuV98Dw8QlMq4NW8fKyw3plEqnXQkvrew6cYnUrgKoG9shmw9tDAvGbd

