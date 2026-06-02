-- Create Custom Types
CREATE TYPE tipo_processo AS ENUM ('matricula', 'seletivo');
CREATE TYPE tipo_candidatura AS ENUM ('estudante', 'docente', 'externo');
CREATE TYPE tipo_largura AS ENUM ('1', '2'); -- 1: Meia, 2: Inteira

-- Create cmct_pergunta_form Table
CREATE TABLE public.cmct_pergunta_form (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    nome_interno text NOT NULL UNIQUE, -- Ex: 'laudo_pcd'
    label text NOT NULL,
    placeholder text,
    tipo_pergunta text NOT NULL,       -- 'text', 'select', 'file', etc.
    opcoes jsonb                       -- Se for select/radio: [{"l": "Sim", "v": "s"}]
);

-- Assign Table Owner
ALTER TABLE public.cmct_pergunta_form OWNER TO "postgres";

-- Create aca_form_config Table
CREATE TABLE public.aca_form_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    id_entidade uuid REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    
    -- Hierarquia e Contexto
    area_id uuid REFERENCES public.aca_area(id) ON DELETE CASCADE, 
    programa_id uuid REFERENCES public.aca_programa(id) ON DELETE CASCADE,
    tipo_proc tipo_processo NOT NULL DEFAULT 'matricula',
    tipo_cand tipo_candidatura NOT NULL DEFAULT 'estudante',

    -- A Pergunta em si
    pergunta_id uuid REFERENCES public.cmct_pergunta_form(id) ON DELETE CASCADE NOT NULL,
    
    -- Layout e UI
    bloco_nome text NOT NULL DEFAULT 'Dados Gerais',
    bloco_ordem int DEFAULT 1,
    pergunta_ordem int DEFAULT 1,
    largura tipo_largura DEFAULT '2',
    altura int DEFAULT 36, -- Altura em px ou unidades de grid
    
    -- Lógica Condicional e Regras (Migradas para cá)
    obrigatorio boolean DEFAULT false,
    depende_de_pergunta_id uuid REFERENCES public.cmct_pergunta_form(id) ON DELETE SET NULL,
    resposta_esperada text, -- Valor que libera esta pergunta

    CONSTRAINT check_entidade CHECK (
        (area_id IS NOT NULL AND programa_id IS NULL) OR 
        (area_id IS NULL AND programa_id IS NOT NULL)
    )
);

-- Assign Table Owner
ALTER TABLE public.aca_form_config OWNER TO "postgres";
