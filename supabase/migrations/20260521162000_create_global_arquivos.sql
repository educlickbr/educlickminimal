-- Migration: Create global_arquivos
-- Description: Tabela centralizada para registro de arquivos e metadados (upload para R2)

CREATE TABLE public.global_arquivos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid NULL,
  path text NOT NULL,
  bucket text NULL DEFAULT 'r2'::text,
  tamanho_bytes bigint NULL,
  mimetype text NULL,
  nome_original text NULL,
  criado_por uuid NULL,
  criado_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  escopo text NULL,
  CONSTRAINT global_arquivos_pkey PRIMARY KEY (id),
  -- Ajustado para referenciar user_expandido conforme seu padrão:
  CONSTRAINT global_arquivos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido (id) ON DELETE SET NULL,
  CONSTRAINT global_arquivos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresa (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Ativar RLS
ALTER TABLE public.global_arquivos ENABLE ROW LEVEL SECURITY;

-- Exemplo de Políticas (RLS) - Você pode ajustar conforme as regras do projeto
CREATE POLICY "Permitir select para usuários autenticados" 
ON public.global_arquivos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir insert para usuários autenticados" 
ON public.global_arquivos FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir delete para o próprio criador" 
ON public.global_arquivos FOR DELETE 
TO authenticated 
USING (criado_por = auth.uid());
