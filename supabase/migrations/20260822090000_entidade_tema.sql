-- ======================================================
-- Tema claro/escuro por entidade (item 2 das dívidas)
-- user_entidades.tema: 'dark' (default) | 'light'
-- A entidade define o tema padrão; o usuário ainda pode
-- alternar manualmente com o toggle no header.
-- ======================================================

ALTER TABLE public.user_entidades
    ADD COLUMN IF NOT EXISTS tema TEXT DEFAULT 'dark'::text;

-- Valores válidos (seguro p/ dados futuros)
UPDATE public.user_entidades
SET tema = 'dark'
WHERE tema IS NULL OR tema NOT IN ('dark', 'light');

-- A ENSI nasce "total claro" (definition no produto)
UPDATE public.user_entidades
SET tema = 'light'
WHERE nome_entidade = 'ensi';

COMMENT ON COLUMN public.user_entidades.tema IS
    'Tema padrão da entidade: "dark" (default) ou "light". O usuário pode alternar manualmente no header.';
