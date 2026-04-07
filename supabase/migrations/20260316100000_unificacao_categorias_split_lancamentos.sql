-- MIGRATION: Unificação de Categorias/Subcategorias e Split de Lançamentos
-- Data: 2026-03-16
-- Autor: Automático (Copilot)

-- 1. Adicionar colunas recursivas (caso não estejam aplicadas)
ALTER TABLE public.fin_categorias ADD COLUMN IF NOT EXISTS id_pai uuid NULL;
ALTER TABLE public.fin_categorias ADD COLUMN IF NOT EXISTS nivel integer NULL;
ALTER TABLE public.fin_categorias ADD COLUMN IF NOT EXISTS ordem integer NULL;
ALTER TABLE public.fin_contas ADD COLUMN IF NOT EXISTS id_pai uuid NULL;
ALTER TABLE public.fin_lancamentos ADD COLUMN IF NOT EXISTS id_lancamento_pai uuid NULL;

-- 2. Migrar subcategorias para categorias (nível 2)
INSERT INTO public.fin_categorias (
    id, id_entidade, nome, tipo, id_pai, nivel, ordem, criado_por, criado_em
)
SELECT
    s.id,
    s.id_entidade,
    s.nome,
    c.tipo, -- herda tipo da categoria pai
    s.id_categoria AS id_pai,
    2 AS nivel,
    NULL AS ordem,
    NULL AS criado_por,
    s.criado_em
FROM public.fin_subcategorias s
JOIN public.fin_categorias c ON c.id = s.id_categoria;

-- 3. Atualizar lançamentos para apontar para a nova categoria (subcategoria migrada)
UPDATE public.fin_lancamentos l
SET id_categoria = l.id_subcategoria
WHERE l.id_subcategoria IS NOT NULL;

-- 4. Remover coluna id_subcategoria e constraint
ALTER TABLE public.fin_lancamentos DROP CONSTRAINT IF EXISTS fin_lancamentos_id_subcategoria_fkey;
ALTER TABLE public.fin_lancamentos DROP COLUMN IF EXISTS id_subcategoria;

-- 5. Dropar tabela de subcategorias
DROP TABLE IF EXISTS public.fin_subcategorias CASCADE;

-- 6. Atualizar níveis das categorias raiz
UPDATE public.fin_categorias SET nivel = 1 WHERE id_pai IS NULL;

-- 7. Ajustar RLS e constraints conforme necessário (manual)
-- (Revisar políticas de acesso para considerar hierarquia se necessário)

-- Fim da migration
