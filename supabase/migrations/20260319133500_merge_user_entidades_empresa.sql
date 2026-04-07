-- ======================================================
-- MERGE: Adicionando colunas de Empresa para User_Entidades
-- ======================================================

ALTER TABLE public.user_entidades 
ADD COLUMN IF NOT EXISTS url TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS logo_aberto TEXT,
ADD COLUMN IF NOT EXISTS logo_fechado TEXT,
ADD COLUMN IF NOT EXISTS cor_principal TEXT,
ADD COLUMN IF NOT EXISTS cor_principal_hover TEXT,
ADD COLUMN IF NOT EXISTS cor_secundaria TEXT,
ADD COLUMN IF NOT EXISTS cor_secundaria_hover TEXT,
ADD COLUMN IF NOT EXISTS criado_por UUID,
ADD COLUMN IF NOT EXISTS modificado_por UUID,
ADD COLUMN IF NOT EXISTS modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Comentários técnicos para auditoria
COMMENT ON TABLE public.user_entidades IS 'Tabela unificada para entidades (Empresas e Famílias), contendo metadados de branding e auditoria migrados da antiga tabela Empresa.';
