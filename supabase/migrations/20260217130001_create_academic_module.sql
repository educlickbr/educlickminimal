-- Extensão para UUID (Garante que existe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Componentes (Matérias/Disciplinas)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_componente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    nome_componente TEXT NOT NULL,
    descricao TEXT,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. Módulos
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_modulo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    nome_modulo TEXT NOT NULL,
    descricao TEXT,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. Carga Horária (Vínculo Módulo x Componente)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_carga_horaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_modulo UUID REFERENCES public.aca_modulo(id) ON DELETE CASCADE,
    id_componente UUID REFERENCES public.aca_componente(id),
    carga_horaria INTEGER NOT NULL, -- em horas
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. Cursos
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_curso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    nome_curso TEXT NOT NULL,
    descricao TEXT,
    tipo_modelo TEXT DEFAULT 'simples', -- 'simples' ou 'complexo'
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. Grade do Curso (Vínculo Curso x Módulo)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_curso_modulo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_curso UUID REFERENCES public.aca_curso(id) ON DELETE CASCADE,
    id_modulo UUID REFERENCES public.aca_modulo(id),
    ordem INTEGER DEFAULT 0,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. Plano de Aula
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_plano_de_aula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_modulo UUID REFERENCES public.aca_modulo(id),
    id_componente UUID REFERENCES public.aca_componente(id),
    titulo_plano TEXT NOT NULL,
    ementa TEXT,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. Referências do Plano (Links/Arquivos)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_ref_plano_de_aula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_plano_aula UUID REFERENCES public.aca_plano_de_aula(id) ON DELETE CASCADE,
    titulo TEXT,
    descricao TEXT,
    link TEXT,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. Programa (A Turma Master)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_programa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_curso UUID REFERENCES public.aca_curso(id),
    descricao TEXT,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 9. Ciclo (Instância do Módulo)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_ciclo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_modulo UUID REFERENCES public.aca_modulo(id),
    descricao TEXT,
    data_ini DATE,
    data_fim DATE,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 10. Vínculo Programa x Ciclo
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_ciclo_programa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_ciclo UUID REFERENCES public.aca_ciclo(id) ON DELETE CASCADE,
    id_programa UUID REFERENCES public.aca_programa(id) ON DELETE CASCADE,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 11. Horários do Ciclo
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_ciclo_dia_semana (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_ciclo UUID REFERENCES public.aca_ciclo(id) ON DELETE CASCADE,
    n_dia_sem INTEGER CHECK (n_dia_sem BETWEEN 0 AND 6),
    dia_sem_txt TEXT,
    hora_ini TEXT, -- ALTERADO PARA TEXT
    hora_fim TEXT, -- ALTERADO PARA TEXT
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZNE DEFAULT NOW()
);

-- ==========================================
-- 12. Calendário Real (Aulas dia a dia)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aca_calendario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL REFERENCES public.empresa(id),
    id_ciclo UUID REFERENCES public.aca_ciclo(id),
    observacao TEXT,
    dt_hora_ini TIMESTAMP WITH TIME ZONE,
    dt_hora_fim TIMESTAMP WITH TIME ZONE,
    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all (Optional, good practice)
ALTER TABLE public.aca_componente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_carga_horaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_curso_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_plano_de_aula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_ref_plano_de_aula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_programa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_ciclo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_ciclo_programa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_ciclo_dia_semana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aca_calendario ENABLE ROW LEVEL SECURITY;
