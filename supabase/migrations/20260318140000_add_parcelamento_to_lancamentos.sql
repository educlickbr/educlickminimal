-- Migration: Adiciona suporte a lançamentos parcelados em fin_lancamentos
-- Campos adicionados:
--   parcelado     → boolean, indica se o lançamento faz parte de um parcelamento
--   qtd_parcelas  → integer, total de parcelas do parcelamento
--   parcela_n     → integer, número desta parcela (ex: 2 de 6)
--
-- Regra de negócio:
--   - Quando parcelado = true, qtd_parcelas e parcela_n devem ser preenchidos
--   - A constraint garante que os campos são consistentes
--   - Se parcelado = false (ou null), os campos de parcela são opcionais/null

ALTER TABLE public.fin_lancamentos
  ADD COLUMN IF NOT EXISTS parcelado     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qtd_parcelas  integer NULL,
  ADD COLUMN IF NOT EXISTS parcela_n     integer NULL;

-- Constraint: se parcelado = true, qtd_parcelas e parcela_n não podem ser null
ALTER TABLE public.fin_lancamentos
  ADD CONSTRAINT fin_lancamentos_parcelado_check CHECK (
    (parcelado = false)
    OR (parcelado = true AND qtd_parcelas IS NOT NULL AND parcela_n IS NOT NULL)
  );

-- Constraint: parcela_n deve ser entre 1 e qtd_parcelas
ALTER TABLE public.fin_lancamentos
  ADD CONSTRAINT fin_lancamentos_parcela_n_check CHECK (
    parcela_n IS NULL
    OR (parcela_n >= 1 AND qtd_parcelas IS NOT NULL AND parcela_n <= qtd_parcelas)
  );

-- Constraint: qtd_parcelas mínimo de 2 quando preenchido (parcelamento de 1x não faz sentido)
ALTER TABLE public.fin_lancamentos
  ADD CONSTRAINT fin_lancamentos_qtd_parcelas_check CHECK (
    qtd_parcelas IS NULL OR qtd_parcelas >= 2
  );
