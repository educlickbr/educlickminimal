-- ======================================================
-- user_entidades: leitura pública
--
-- A resolução de entidade por domínio (white label) precisa que
-- visitantes consigam ler o catálogo de entidades (domínios, url,
-- branding, tema). Além disso, outras RPCs SECURITY INVOKER podem
-- ler user_entidades e dependem de leitura ampla.
-- Por isso o SELECT de user_entidades é público. INSERT/UPDATE/DELETE
-- continuam restritos a admin.
-- ======================================================

DROP POLICY IF EXISTS "Admin ou membro da entidade pode ver"
    ON public.user_entidades;

CREATE POLICY "Qualquer um pode ler user_entidades"
    ON public.user_entidades
    FOR SELECT
    TO authenticated, anon
    USING (true);
