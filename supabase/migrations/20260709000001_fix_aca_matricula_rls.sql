-- ============================================================
-- Fix RLS: aca_matricula — adiciona policies de INSERT e UPDATE
-- ============================================================

-- O próprio aluno pode inserir sua matrícula (fluxo grátis)
CREATE POLICY aca_matricula_insert_own ON public.aca_matricula
    FOR INSERT
    WITH CHECK (
        id_usuario IN (
            SELECT id FROM public.user_expandido WHERE id_user = auth.uid()
        )
    );

-- Permitir UPDATE via RPC (webhook atualiza id_pedido)
CREATE POLICY aca_matricula_update_own ON public.aca_matricula
    FOR UPDATE
    USING (
        id_usuario IN (
            SELECT id FROM public.user_expandido WHERE id_user = auth.uid()
        )
    )
    WITH CHECK (
        id_usuario IN (
            SELECT id FROM public.user_expandido WHERE id_user = auth.uid()
        )
    );

-- Admin da entidade pode inserir/atualizar (futuro)
CREATE POLICY aca_matricula_insert_admin ON public.aca_matricula
    FOR INSERT
    WITH CHECK (
        id_entidade IN (
            SELECT id_entidade FROM public.user_entidade_user
            WHERE id_user = auth.uid()
        )
    );

CREATE POLICY aca_matricula_update_admin ON public.aca_matricula
    FOR UPDATE
    USING (
        id_entidade IN (
            SELECT id_entidade FROM public.user_entidade_user
            WHERE id_user = auth.uid()
        )
    );
