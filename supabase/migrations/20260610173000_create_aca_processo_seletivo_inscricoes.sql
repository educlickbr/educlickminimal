-- ============================================================
-- Migration: create_aca_processo_seletivo_inscricoes
-- Data: 2026-06-10
-- Descrição: Cria a tabela de inscrições por processo seletivo
--            com auditoria e RLS (linha do usuário + entidade).
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'tipo_processo'
    ) THEN
        CREATE TYPE public.tipo_processo AS ENUM ('matricula', 'seletivo');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'tipo_candidatura'
    ) THEN
        CREATE TYPE public.tipo_candidatura AS ENUM ('estudante', 'docente', 'externo');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.aca_processo_seletivo_inscricoes (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    id_usuario UUID NOT NULL,
    id_programa UUID NOT NULL,
    id_processo UUID NOT NULL,
    status_dados TEXT NOT NULL DEFAULT 'pendente',
    status_documentacao TEXT NOT NULL DEFAULT 'pendente',
    status_candidatura TEXT NOT NULL DEFAULT 'pendente',
    tipo_processo public.tipo_processo NOT NULL,
    tipo_candidatura public.tipo_candidatura NOT NULL,
    envio_email BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_por UUID NULL,
    modificado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID NULL,
    id_entidade UUID NOT NULL,
    CONSTRAINT aca_processo_seletivo_inscricoes_pkey PRIMARY KEY (id),
    CONSTRAINT aca_processo_seletivo_inscricoes_unq UNIQUE (
        id_usuario,
        id_processo,
        tipo_processo,
        tipo_candidatura
    )
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aca_processo_seletivo_inscricoes_id_usuario_fkey'
          AND conrelid = 'public.aca_processo_seletivo_inscricoes'::regclass
    ) THEN
        ALTER TABLE public.aca_processo_seletivo_inscricoes
            ADD CONSTRAINT aca_processo_seletivo_inscricoes_id_usuario_fkey
            FOREIGN KEY (id_usuario) REFERENCES public.user_expandido(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aca_processo_seletivo_inscricoes_id_programa_fkey'
          AND conrelid = 'public.aca_processo_seletivo_inscricoes'::regclass
    ) THEN
        ALTER TABLE public.aca_processo_seletivo_inscricoes
            ADD CONSTRAINT aca_processo_seletivo_inscricoes_id_programa_fkey
            FOREIGN KEY (id_programa) REFERENCES public.aca_programa(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aca_processo_seletivo_inscricoes_id_processo_fkey'
          AND conrelid = 'public.aca_processo_seletivo_inscricoes'::regclass
    ) THEN
        ALTER TABLE public.aca_processo_seletivo_inscricoes
            ADD CONSTRAINT aca_processo_seletivo_inscricoes_id_processo_fkey
            FOREIGN KEY (id_processo) REFERENCES public.aca_processo_seletivo(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aca_processo_seletivo_inscricoes_criado_por_fkey'
          AND conrelid = 'public.aca_processo_seletivo_inscricoes'::regclass
    ) THEN
        ALTER TABLE public.aca_processo_seletivo_inscricoes
            ADD CONSTRAINT aca_processo_seletivo_inscricoes_criado_por_fkey
            FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aca_processo_seletivo_inscricoes_modificado_por_fkey'
          AND conrelid = 'public.aca_processo_seletivo_inscricoes'::regclass
    ) THEN
        ALTER TABLE public.aca_processo_seletivo_inscricoes
            ADD CONSTRAINT aca_processo_seletivo_inscricoes_modificado_por_fkey
            FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aca_processo_seletivo_inscricoes_id_entidade_fkey'
          AND conrelid = 'public.aca_processo_seletivo_inscricoes'::regclass
    ) THEN
        ALTER TABLE public.aca_processo_seletivo_inscricoes
            ADD CONSTRAINT aca_processo_seletivo_inscricoes_id_entidade_fkey
            FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS aca_processo_seletivo_inscricoes_id_entidade_idx
    ON public.aca_processo_seletivo_inscricoes (id_entidade);

CREATE INDEX IF NOT EXISTS aca_processo_seletivo_inscricoes_id_processo_idx
    ON public.aca_processo_seletivo_inscricoes (id_processo);

CREATE INDEX IF NOT EXISTS aca_processo_seletivo_inscricoes_id_usuario_idx
    ON public.aca_processo_seletivo_inscricoes (id_usuario);

CREATE OR REPLACE FUNCTION public.aca_sync_processo_seletivo_inscricao_context()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_id_programa UUID;
    v_id_entidade UUID;
BEGIN
    SELECT
        ps.id_programa,
        ps.id_entidade
    INTO
        v_id_programa,
        v_id_entidade
    FROM public.aca_processo_seletivo ps
    WHERE ps.id = NEW.id_processo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Processo seletivo % não encontrado', NEW.id_processo;
    END IF;

    NEW.id_programa := v_id_programa;
    NEW.id_entidade := v_id_entidade;

    IF TG_OP = 'INSERT' THEN
        NEW.criado_em := COALESCE(NEW.criado_em, NOW());
        NEW.modificado_em := COALESCE(NEW.modificado_em, NEW.criado_em, NOW());
    ELSE
        NEW.criado_em := OLD.criado_em;
        NEW.modificado_em := NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aca_processo_seletivo_inscricao_context
ON public.aca_processo_seletivo_inscricoes;

CREATE TRIGGER trg_aca_processo_seletivo_inscricao_context
BEFORE INSERT OR UPDATE
ON public.aca_processo_seletivo_inscricoes
FOR EACH ROW
EXECUTE FUNCTION public.aca_sync_processo_seletivo_inscricao_context();

ALTER TABLE public.aca_processo_seletivo_inscricoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aca_processo_seletivo_inscricoes: admin da entidade"
ON public.aca_processo_seletivo_inscricoes;

CREATE POLICY "aca_processo_seletivo_inscricoes: admin da entidade"
ON public.aca_processo_seletivo_inscricoes
FOR ALL
USING (
    (
        (auth.jwt() ->> 'papel'::text) = 'admin'::text
        OR (auth.jwt() ->> 'papel'::text) LIKE 'aca_%'
    )
    AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(auth.jwt() -> 'entidades'::text) e(ent_id)
        WHERE (e.ent_id)::uuid = aca_processo_seletivo_inscricoes.id_entidade
    )
)
WITH CHECK (
    (
        (auth.jwt() ->> 'papel'::text) = 'admin'::text
        OR (auth.jwt() ->> 'papel'::text) LIKE 'aca_%'
    )
    AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(auth.jwt() -> 'entidades'::text) e(ent_id)
        WHERE (e.ent_id)::uuid = aca_processo_seletivo_inscricoes.id_entidade
    )
);

DROP POLICY IF EXISTS "aca_processo_seletivo_inscricoes: usuario select propria linha"
ON public.aca_processo_seletivo_inscricoes;

CREATE POLICY "aca_processo_seletivo_inscricoes: usuario select propria linha"
ON public.aca_processo_seletivo_inscricoes
FOR SELECT
USING (
    id_usuario IN (
        SELECT ue.id
        FROM public.user_expandido ue
        WHERE ue.id_user = auth.uid()
    )
);

DROP POLICY IF EXISTS "aca_processo_seletivo_inscricoes: usuario insert propria linha"
ON public.aca_processo_seletivo_inscricoes;

CREATE POLICY "aca_processo_seletivo_inscricoes: usuario insert propria linha"
ON public.aca_processo_seletivo_inscricoes
FOR INSERT
WITH CHECK (
    id_usuario IN (
        SELECT ue.id
        FROM public.user_expandido ue
        WHERE ue.id_user = auth.uid()
    )
);

DROP POLICY IF EXISTS "aca_processo_seletivo_inscricoes: usuario update propria linha"
ON public.aca_processo_seletivo_inscricoes;

CREATE POLICY "aca_processo_seletivo_inscricoes: usuario update propria linha"
ON public.aca_processo_seletivo_inscricoes
FOR UPDATE
USING (
    id_usuario IN (
        SELECT ue.id
        FROM public.user_expandido ue
        WHERE ue.id_user = auth.uid()
    )
)
WITH CHECK (
    id_usuario IN (
        SELECT ue.id
        FROM public.user_expandido ue
        WHERE ue.id_user = auth.uid()
    )
);

DROP POLICY IF EXISTS "aca_processo_seletivo_inscricoes: usuario delete propria linha"
ON public.aca_processo_seletivo_inscricoes;

CREATE POLICY "aca_processo_seletivo_inscricoes: usuario delete propria linha"
ON public.aca_processo_seletivo_inscricoes
FOR DELETE
USING (
    id_usuario IN (
        SELECT ue.id
        FROM public.user_expandido ue
        WHERE ue.id_user = auth.uid()
    )
);
