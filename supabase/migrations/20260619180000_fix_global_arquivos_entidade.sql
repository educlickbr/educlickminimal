-- ======================================================
-- FIX: global_arquivos - substituir empresa_id por id_entidade
-- ======================================================
-- A coluna empresa_id referenciava a tabela empresa (depreciada).
-- Vamos substituir por id_entidade referenciando user_entidades,
-- seguindo o mesmo padrão das demais tabelas do sistema.

-- 1. Remove FK antiga
ALTER TABLE public.global_arquivos
  DROP CONSTRAINT IF EXISTS global_arquivos_empresa_id_fkey;

-- 2. Remove coluna antiga
ALTER TABLE public.global_arquivos
  DROP COLUMN IF EXISTS empresa_id;

-- 3. Adiciona nova coluna com FK para user_entidades
ALTER TABLE public.global_arquivos
  ADD COLUMN id_entidade UUID REFERENCES public.user_entidades(id) ON DELETE SET NULL;

-- 4. Atualiza as RLS policies para usar o novo campo
DROP POLICY IF EXISTS "Permitir select para usuários autenticados" ON public.global_arquivos;
DROP POLICY IF EXISTS "Permitir insert para usuários autenticados" ON public.global_arquivos;
DROP POLICY IF EXISTS "Permitir delete para o próprio criador" ON public.global_arquivos;

CREATE POLICY "Permitir select para usuários autenticados"
ON public.global_arquivos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir insert para usuários autenticados"
ON public.global_arquivos FOR INSERT
TO authenticated
WITH CHECK (true);

-- Delete policy: permite deletar se o criado_por (user_expandido.id)
-- pertencer ao usuário autenticado (auth.uid() via user_expandido.id_user)
CREATE POLICY "Permitir delete para o próprio criador"
ON public.global_arquivos FOR DELETE
TO authenticated
USING (
  -- Caso 1: criado_por é diretamente o auth.uid() (fallback para compatibilidade)
  criado_por = auth.uid()
  -- Caso 2: criado_por é um user_expandido.id cujo user_expandido.id_user = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_expandido ue
    WHERE ue.id = criado_por
      AND ue.id_user = auth.uid()
  )
  -- Caso 3: admin da entidade dona do arquivo
  OR EXISTS (
    SELECT 1 FROM public.user_entidades ent
    WHERE ent.id = global_arquivos.id_entidade
      AND ent.criado_por = auth.uid()
  )
);
