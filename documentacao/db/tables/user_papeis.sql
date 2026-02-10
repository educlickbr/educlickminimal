--
-- PostgreSQL database dump
--

\restrict NQsLj3jiibjJQSBFNGLEsZyEfNVa5eTBI5a5FWbaMPBpPy2NeQTCH5SRklY3ql7

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
-- Name: user_papeis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_papeis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL
);


--
-- Name: user_papeis user_papeis_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_papeis
    ADD CONSTRAINT user_papeis_nome_key UNIQUE (nome);


--
-- Name: user_papeis user_papeis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_papeis
    ADD CONSTRAINT user_papeis_pkey PRIMARY KEY (id);


--
-- Name: user_papeis todos veem papeis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "todos veem papeis" ON public.user_papeis FOR SELECT TO authenticated USING (true);


--
-- Name: user_papeis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_papeis ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict NQsLj3jiibjJQSBFNGLEsZyEfNVa5eTBI5a5FWbaMPBpPy2NeQTCH5SRklY3ql7

