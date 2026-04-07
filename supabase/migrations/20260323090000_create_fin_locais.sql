CREATE TABLE public.fin_locais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade uuid NULL,
    nome text NOT NULL,
    cep text NULL,
    estado text NULL,
    cidade text NULL,
    endereco text NULL,
    numero text NULL,
    complemento text NULL,
    likert integer NULL CHECK (likert >= 1 AND likert <= 10),
    criado_por uuid NULL,
    criado_em timestamptz DEFAULT now() NULL,
    modificado_por uuid NULL,
    modificado_em timestamptz DEFAULT now() NULL,
    CONSTRAINT fin_locais_pkey PRIMARY KEY (id),
    CONSTRAINT fin_locais_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido(id) ON DELETE SET NULL,
    CONSTRAINT fin_locais_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    CONSTRAINT fin_locais_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.user_expandido(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.fin_locais ENABLE ROW LEVEL SECURITY;

-- Common Policies for finance tables
CREATE POLICY "Select permitido para admin e user_fin (entidades próprias)" ON public.fin_locais
 FOR SELECT USING (
    (auth.jwt() ->> 'papel'::text = 'admin'::text) OR 
    ((auth.jwt() ->> 'papel'::text = 'user_fin'::text) AND (EXISTS ( 
        SELECT 1 FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
        WHERE (fin_locais.id_entidade = (e.ent)::uuid)
    )))
);

CREATE POLICY "Insert permitido para admin e user_fin (entidades próprias)" ON public.fin_locais
 FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'papel'::text = 'admin'::text) OR 
    ((auth.jwt() ->> 'papel'::text = 'user_fin'::text) AND (EXISTS ( 
        SELECT 1 FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
        WHERE (fin_locais.id_entidade = (e.ent)::uuid)
    )))
);

CREATE POLICY "Update permitido para admin e user_fin (entidades próprias)" ON public.fin_locais
 FOR UPDATE USING (
    (auth.jwt() ->> 'papel'::text = 'admin'::text) OR 
    ((auth.jwt() ->> 'papel'::text = 'user_fin'::text) AND (EXISTS ( 
        SELECT 1 FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
        WHERE (fin_locais.id_entidade = (e.ent)::uuid)
    )))
);

CREATE POLICY "Delete permitido para admin e user_fin (entidades próprias)" ON public.fin_locais
 FOR DELETE USING (
    (auth.jwt() ->> 'papel'::text = 'admin'::text) OR 
    ((auth.jwt() ->> 'papel'::text = 'user_fin'::text) AND (EXISTS ( 
        SELECT 1 FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent)
        WHERE (fin_locais.id_entidade = (e.ent)::uuid)
    )))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fin_locais_id_entidade ON public.fin_locais(id_entidade);
