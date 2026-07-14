-- ============================================================
-- Migration: 20260713100000 — Create aca_docente module tables
-- ============================================================
-- 5 novas tabelas para o módulo de Gestão de Docentes:
--   aca_docente                  — Cadastro de docentes
--   aca_docente_vinculo          — Vínculo docente × componente
--   aca_edital_docente           — Editais de seleção docente
--   aca_edital_docente_inscricao — Inscrições nos editais
--   aca_docente_proposta         — Currículos / propostas espontâneas
-- ============================================================

-- -------------------------------------------------------
-- 1. aca_docente
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aca_docente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_user_expandido UUID NOT NULL REFERENCES public.user_expandido(id),
    ativo BOOLEAN NOT NULL DEFAULT true,

    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ,

    UNIQUE(id_entidade, id_user_expandido)
);

-- -------------------------------------------------------
-- 2. aca_docente_vinculo
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aca_docente_vinculo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_docente UUID NOT NULL REFERENCES public.aca_docente(id) ON DELETE CASCADE,
    id_componente UUID NOT NULL REFERENCES public.aca_componente(id),
    elegivel BOOLEAN NOT NULL DEFAULT true,

    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ,

    UNIQUE(id_docente, id_componente)
);

-- -------------------------------------------------------
-- 3. aca_edital_docente
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aca_edital_docente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    data_ini DATE NOT NULL,
    data_fim DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    id_form_config UUID REFERENCES public.aca_form_config(id) ON DELETE SET NULL,

    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ
);

-- -------------------------------------------------------
-- 4. aca_edital_docente_inscricao
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aca_edital_docente_inscricao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_edital UUID NOT NULL REFERENCES public.aca_edital_docente(id) ON DELETE CASCADE,
    id_candidato UUID NOT NULL REFERENCES public.user_expandido(id),
    status TEXT NOT NULL DEFAULT 'aguardando'
        CHECK (status IN ('aguardando', 'aprovado', 'recusado', 'suplente')),

    criado_por UUID REFERENCES public.user_expandido(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID REFERENCES public.user_expandido(id),
    modificado_em TIMESTAMPTZ,

    UNIQUE(id_edital, id_candidato)
);

-- -------------------------------------------------------
-- 5. aca_docente_proposta
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aca_docente_proposta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_edital UUID REFERENCES public.aca_edital_docente(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT NOT NULL,
    minibio TEXT,
    id_curriculo UUID REFERENCES public.global_arquivos(id) ON DELETE SET NULL,
    visto BOOLEAN NOT NULL DEFAULT false,
    considerado BOOLEAN,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_em TIMESTAMPTZ
);

-- -------------------------------------------------------
-- Índices auxiliares
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_aca_docente_entidade ON public.aca_docente (id_entidade);
CREATE INDEX IF NOT EXISTS idx_aca_docente_ativo ON public.aca_docente (ativo);
CREATE INDEX IF NOT EXISTS idx_aca_docente_vinculo_docente ON public.aca_docente_vinculo (id_docente);
CREATE INDEX IF NOT EXISTS idx_aca_edital_docente_entidade ON public.aca_edital_docente (id_entidade);
CREATE INDEX IF NOT EXISTS idx_aca_edital_docente_status ON public.aca_edital_docente (status);
CREATE INDEX IF NOT EXISTS idx_aca_edital_inscricao_edital ON public.aca_edital_docente_inscricao (id_edital);
CREATE INDEX IF NOT EXISTS idx_aca_docente_proposta_entidade ON public.aca_docente_proposta (id_entidade);
CREATE INDEX IF NOT EXISTS idx_aca_docente_proposta_visto ON public.aca_docente_proposta (visto);
