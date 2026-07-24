-- ============================================================
-- Migration: 20260713100016 — RLS para tabelas de docentes
-- ============================================================
-- Aplica RLS policies seguindo o padrão existente no sistema:
--   admin → tudo
--   aca_* → tudo (dentro da entidade)
--   futuro: revisar para granularidade fina
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- Helper: verifica se o usuário pertence à entidade
-- ═══════════════════════════════════════════════════════════
-- Reutilizado em todas as policies abaixo.
-- O JWT contém: { papel: "admin", entidades: ["uuid1", "uuid2"] }

-- ═══════════════════════════════════════════════════════════
-- 1. aca_docente
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.aca_docente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aca_docente: admin e aca_ podem tudo na entidade"
ON public.aca_docente FOR ALL
USING (
    (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (auth.jwt() ->> 'papel' LIKE 'aca_%')
    )
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
        WHERE e.ent_id::uuid = aca_docente.id_entidade
    )
);

-- ═══════════════════════════════════════════════════════════
-- 2. aca_docente_vinculo
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.aca_docente_vinculo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aca_docente_vinculo: admin e aca_ podem tudo"
ON public.aca_docente_vinculo FOR ALL
USING (
    (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (auth.jwt() ->> 'papel' LIKE 'aca_%')
    )
    AND EXISTS (
        SELECT 1 FROM public.aca_docente d
        WHERE d.id = aca_docente_vinculo.id_docente
          AND EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e_id
              WHERE e_id::uuid = d.id_entidade
          )
    )
);

-- ═══════════════════════════════════════════════════════════
-- 3. aca_edital_docente
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.aca_edital_docente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aca_edital_docente: admin e aca_ podem tudo na entidade"
ON public.aca_edital_docente FOR ALL
USING (
    (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (auth.jwt() ->> 'papel' LIKE 'aca_%')
    )
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
        WHERE e.ent_id::uuid = aca_edital_docente.id_entidade
    )
);

-- ═══════════════════════════════════════════════════════════
-- 4. aca_edital_docente_inscricao
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.aca_edital_docente_inscricao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aca_edital_docente_inscricao: admin e aca_ podem tudo"
ON public.aca_edital_docente_inscricao FOR ALL
USING (
    (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (auth.jwt() ->> 'papel' LIKE 'aca_%')
    )
    AND EXISTS (
        SELECT 1 FROM public.aca_edital_docente e
        WHERE e.id = aca_edital_docente_inscricao.id_edital
          AND EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e_id
              WHERE e_id::uuid = e.id_entidade
          )
    )
);

-- ═══════════════════════════════════════════════════════════
-- 5. aca_docente_proposta
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.aca_docente_proposta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aca_docente_proposta: admin e aca_ podem tudo na entidade"
ON public.aca_docente_proposta FOR ALL
USING (
    (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (auth.jwt() ->> 'papel' LIKE 'aca_%')
    )
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
        WHERE e.ent_id::uuid = aca_docente_proposta.id_entidade
    )
);

-- ═══════════════════════════════════════════════════════════
-- 6. aca_docente_convite
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.aca_docente_convite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aca_docente_convite: admin e aca_ podem tudo na entidade"
ON public.aca_docente_convite FOR ALL
USING (
    (
        (auth.jwt() ->> 'papel' = 'admin')
        OR (auth.jwt() ->> 'papel' LIKE 'aca_%')
    )
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent_id)
        WHERE e.ent_id::uuid = aca_docente_convite.id_entidade
    )
);
