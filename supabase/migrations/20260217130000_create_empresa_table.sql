CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    url TEXT UNIQUE, -- Adicionado UNIQUE para identificar o tenant pela URL
    logo_aberto TEXT,
    logo_fechado TEXT,
    cor_principal TEXT,
    cor_principal_hover TEXT,
    cor_secundaria TEXT,
    cor_secundaria_hover TEXT,
    
    -- Campos de auditoria para manter o padrão do projeto
    criado_por UUID, 
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID,
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Lembre-se que Admins podem ler a própria empresa)
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas são visíveis por seus usuários autenticados" 
ON public.empresa FOR SELECT 
USING (id = (auth.jwt() ->> 'empresa_id')::uuid);