-- ============================================================
-- Saneamento — re-escopa associações operacionais nível-programa
-- Data: 2026-10-05
-- ============================================================
-- Contexto:
--   Antes da migration 20261005100000, o Currículo gravava TODA
--   associação como nível de programa (id_programa), mesmo quando o
--   gestor clicava em "Adicionar" num componente/módulo/área — o
--   front colapsava o escopo para id_programa. Depois daquela
--   migration as RPCs passaram a filtrar pelo escopo específico, então
--   essas linhas antigas deixaram de aparecer (nem no check do
--   navegador) ao abrir o subescopo.
--
-- Heurística deste saneamento:
--   Para cada linha operacional de nível-programa, infere o subescopo a
--   partir de lms_distribuicao do MESMO conteúdo + entidade (o Blueprint
--   diz onde o conteúdo vive), priorizando componente > módulo > área.
--   Só aplica quando o subescopo inferido é ÚNICO e ainda não existe
--   linha para ele (respeita o índice lms_conteudo_operacional_unique).
--
--   Linhas cujo conteúdo não é distribuído (ou é distribuído só a curso,
--   que o operacional não representa) permanecem no nível do programa.
--
-- Idempotente: rodar de novo não encontra mais linhas de nível-programa
-- para tratar (as já tratadas passam a ter subescopo).
--
-- Reversão: não há rollback automático. Para desfazer, voltar
--   id_componente/id_modulo/id_area a NULL nas linhas afetadas.
-- ============================================================

-- (Opcional) Pré-visualização — cole e rode isolado para conferir o efeito:
-- WITH prog_only AS (
--     SELECT op.id, op.id_conteudo, op.id_entidade, op.id_programa
--     FROM public.lms_conteudo_operacional op
--     WHERE op.id_programa IS NOT NULL
--       AND op.id_area IS NULL AND op.id_componente IS NULL AND op.id_modulo IS NULL
--       AND op.id_ciclo IS NULL AND op.id_calendario IS NULL
--       AND op.id_conteudo IS NOT NULL
-- )
-- SELECT p.id AS op_id, p.id_conteudo, p.id_programa,
--        count(DISTINCT d.id_componente) AS n_componente,
--        count(DISTINCT d.id_modulo)     AS n_modulo,
--        count(DISTINCT d.id_area)       AS n_area
-- FROM prog_only p
-- LEFT JOIN public.lms_distribuicao d
--        ON d.id_conteudo = p.id_conteudo AND d.id_entidade = p.id_entidade
-- GROUP BY p.id, p.id_conteudo, p.id_programa
-- ORDER BY p.id_conteudo;

WITH prog_only AS (
    SELECT op.id, op.id_conteudo, op.id_entidade, op.id_programa
    FROM public.lms_conteudo_operacional op
    WHERE op.id_programa IS NOT NULL
      AND op.id_area IS NULL
      AND op.id_componente IS NULL
      AND op.id_modulo IS NULL
      AND op.id_ciclo IS NULL
      AND op.id_calendario IS NULL
      AND op.id_conteudo IS NOT NULL
),
inferido AS (
    SELECT
        p.id                       AS op_id,
        p.id_conteudo,
        p.id_programa,
        array_length(array_agg(DISTINCT d.id_componente) FILTER (WHERE d.id_componente IS NOT NULL), 1) AS n_componente,
        (array_agg(DISTINCT d.id_componente) FILTER (WHERE d.id_componente IS NOT NULL))[1]            AS id_componente,
        array_length(array_agg(DISTINCT d.id_modulo)     FILTER (WHERE d.id_modulo IS NOT NULL), 1)     AS n_modulo,
        (array_agg(DISTINCT d.id_modulo)     FILTER (WHERE d.id_modulo IS NOT NULL))[1]                 AS id_modulo,
        array_length(array_agg(DISTINCT d.id_area)       FILTER (WHERE d.id_area IS NOT NULL), 1)       AS n_area,
        (array_agg(DISTINCT d.id_area)       FILTER (WHERE d.id_area IS NOT NULL))[1]                   AS id_area
    FROM prog_only p
    JOIN public.lms_distribuicao d
      ON d.id_conteudo = p.id_conteudo
     AND d.id_entidade = p.id_entidade
    GROUP BY p.id, p.id_conteudo, p.id_programa
),
alvo AS (
    SELECT
        i.op_id,
        i.id_conteudo,
        i.id_programa,
        CASE WHEN i.n_componente = 1 THEN i.id_componente END AS id_componente,
        CASE WHEN COALESCE(i.n_componente, 0) = 0
              AND i.n_modulo = 1 THEN i.id_modulo END        AS id_modulo,
        CASE WHEN COALESCE(i.n_componente, 0) = 0
              AND COALESCE(i.n_modulo, 0) = 0
              AND i.n_area = 1 THEN i.id_area END            AS id_area
    FROM inferido i
)
UPDATE public.lms_conteudo_operacional op
SET
    id_componente = a.id_componente,
    id_modulo     = a.id_modulo,
    id_area       = a.id_area,
    modificado_em = NOW()
FROM alvo a
WHERE op.id = a.op_id
  AND (a.id_componente IS NOT NULL OR a.id_modulo IS NOT NULL OR a.id_area IS NOT NULL)
  -- Não colidir com o índice único: já existe linha nesse subescopo?
  AND NOT EXISTS (
      SELECT 1
      FROM public.lms_conteudo_operacional x
      WHERE x.id IS DISTINCT FROM a.op_id
        AND x.id_conteudo = a.id_conteudo
        AND x.id_programa = a.id_programa
        AND x.id_componente IS NOT DISTINCT FROM a.id_componente
        AND x.id_modulo     IS NOT DISTINCT FROM a.id_modulo
        AND x.id_area       IS NOT DISTINCT FROM a.id_area
  );

-- ============================================================
-- Conferência (opcional):
--   select count(*) filter (where id_componente is not null) as com_componente,
--          count(*) filter (where id_modulo is not null)     as com_modulo,
--          count(*) filter (where id_area is not null)       as com_area,
--          count(*) filter (
--              where id_area is null and id_componente is null and id_modulo is null
--                and id_ciclo is null and id_calendario is null
--          )                                                  as ainda_nivel_programa
--   from public.lms_conteudo_operacional
--   where id_programa is not null and id_conteudo is not null;
-- ============================================================
