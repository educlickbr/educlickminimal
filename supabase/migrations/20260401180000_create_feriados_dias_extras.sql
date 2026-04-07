-- ============================================================
-- Tabelas Feriado, Dias Extras e Correção de Dia da Semana
-- ============================================================

-- 1. TABELA DE FERIADOS
CREATE TABLE IF NOT EXISTS public.aca_feriado (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade uuid NULL, -- NULL significa feriado global
    data date NOT NULL,
    nome text NOT NULL,
    recorrente_anual boolean DEFAULT false,
    criado_por uuid NULL,
    criado_em timestamptz DEFAULT now() NULL,
    modificado_por uuid NULL,
    modificado_em timestamptz DEFAULT now() NULL,
    CONSTRAINT aca_feriado_pkey PRIMARY KEY (id),
    CONSTRAINT aca_feriado_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    CONSTRAINT aca_feriado_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id)
);

ALTER TABLE public.aca_feriado ENABLE ROW LEVEL SECURITY;

-- Política de RLS para aca_feriado
-- Permite leitura de feriados globais (id_entidade nulo) E feriados da própria entidade.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'aca_feriado' AND policyname = 'aca_policy_feriado'
    ) THEN
        CREATE POLICY "aca_policy_feriado" ON public.aca_feriado
        FOR ALL USING (
            id_entidade IS NULL OR 
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
    END IF;
END
$$;


-- 2. TABELA DE DIAS EXTRAS DO CICLO
CREATE TABLE IF NOT EXISTS public.aca_ciclo_dia_extra (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_ciclo uuid NOT NULL,
    data date NOT NULL,
    hora_ini time without time zone NOT NULL,
    hora_fim time without time zone NOT NULL,
    observacoes text NULL,
    criado_por uuid NULL,
    criado_em timestamptz DEFAULT now() NULL,
    modificado_por uuid NULL,
    modificado_em timestamptz DEFAULT now() NULL,
    id_entidade uuid NOT NULL,
    CONSTRAINT aca_ciclo_dia_extra_pkey PRIMARY KEY (id),
    CONSTRAINT aca_ciclo_dia_extra_id_ciclo_fkey FOREIGN KEY (id_ciclo) REFERENCES public.aca_ciclo(id) ON DELETE CASCADE,
    CONSTRAINT aca_ciclo_dia_extra_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    CONSTRAINT aca_ciclo_dia_extra_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id)
);

ALTER TABLE public.aca_ciclo_dia_extra ENABLE ROW LEVEL SECURITY;

-- Política de RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'aca_ciclo_dia_extra' AND policyname = 'aca_policy_all_access_aca_ciclo_dia_extra'
    ) THEN
        CREATE POLICY "aca_policy_all_access_aca_ciclo_dia_extra" ON public.aca_ciclo_dia_extra 
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
                WHERE ((e.ent_id)::uuid = aca_ciclo_dia_extra.id_entidade)
            ))
        );
    END IF;
END
$$;

-- 3. AJUSTE DE TIPO NO DIA DA SEMANA
-- Apaga registros para não quebrar o cast caso tenha lixo, já que a base está em dev
DELETE FROM public.aca_ciclo_dia_semana;

ALTER TABLE public.aca_ciclo_dia_semana 
  ALTER COLUMN hora_ini TYPE time without time zone USING hora_ini::time without time zone,
  ALTER COLUMN hora_fim TYPE time without time zone USING hora_fim::time without time zone;
