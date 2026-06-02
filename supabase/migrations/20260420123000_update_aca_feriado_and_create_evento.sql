-- ============================================================
-- Atualização: aca_feriado e Criação: aca_evento
-- Data: 2026-04-20
-- ============================================================

-- 1. Atualizar aca_feriado com coluna is_global
ALTER TABLE public.aca_feriado ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- 2. Criar tabela aca_evento
CREATE TABLE IF NOT EXISTS public.aca_evento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade uuid NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    nome_evento text NOT NULL,
    descricao text NULL,
    sobrescrever_calendario boolean DEFAULT false,
    criado_por uuid NULL,
    criado_em timestamptz DEFAULT now() NULL,
    modificado_por uuid NULL,
    modificado_em timestamptz DEFAULT now() NULL,
    CONSTRAINT aca_evento_pkey PRIMARY KEY (id),
    CONSTRAINT aca_evento_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    CONSTRAINT aca_evento_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id)
);

-- Habilitar RLS
ALTER TABLE public.aca_evento ENABLE ROW LEVEL SECURITY;

-- Política de RLS para aca_evento
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'aca_evento' AND policyname = 'aca_policy_evento'
    ) THEN
        CREATE POLICY "aca_policy_evento" ON public.aca_evento
        FOR ALL USING (
            (
                ((auth.jwt() ->> 'papel'::text) = 'admin'::text) 
                OR 
                ((auth.jwt() ->> 'papel'::text) LIKE 'aca_%')
            ) 
            AND 
            (EXISTS ( 
                SELECT 1
                FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
                WHERE ((e.ent_id)::uuid = id_entidade)
            ))
        );
    END IF;
END
$$;

-- Atualizar política de aca_feriado para considerar is_global
-- (Opcional, mas garante que se is_global for true, todos veem)
DROP POLICY IF EXISTS "aca_policy_feriado" ON public.aca_feriado;
CREATE POLICY "aca_policy_feriado" ON public.aca_feriado
FOR ALL USING (
    id_entidade IS NULL OR 
    is_global = true OR
    (
        (
            ((auth.jwt() ->> 'papel'::text) = 'admin'::text) 
            OR 
            ((auth.jwt() ->> 'papel'::text) LIKE 'aca_%')
        ) 
        AND 
        (EXISTS ( 
            SELECT 1
            FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
            WHERE ((e.ent_id)::uuid = id_entidade)
        ))
    )
);
