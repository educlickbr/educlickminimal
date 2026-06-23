-- ======================================================
-- FIX: Corrige RLS delete policy do global_arquivos
-- A policy anterior comparava criado_por = auth.uid(),
-- mas criado_por armazena user_expandido.id (não auth.users.id).
-- O delete era silenciosamente bloqueado pelo RLS.
-- ======================================================

-- Remove a policy antiga
DROP POLICY IF EXISTS "Permitir delete para o próprio criador" ON public.global_arquivos;

-- Recria com a verificação correta via user_expandido
CREATE POLICY "Permitir delete para o próprio criador"
ON public.global_arquivos FOR DELETE
TO authenticated
USING (
  -- criado_por é user_expandido.id → verifica user_expandido.id_user = auth.uid()
  EXISTS (
    SELECT 1 FROM public.user_expandido ue
    WHERE ue.id = criado_por
      AND ue.id_user = auth.uid()
  )
);
