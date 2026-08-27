-- ======================================================
-- FASE A — Multientidade: permissões por entidade × papel × produto
-- Fonte: documentacao/planos/plano-multientidade-permissoes.md
--        documentacao/arquitetura/permissoes.md
-- ======================================================

-- 1. Enriquecimento de user_entidades
--    - dominios: múltiplos domínios/aliases (["educlick.com.br", "app.educlick.com.br"])
--    - rota_inicial: primeira página pós-login da entidade
--    - configuracoes: flags futuras sem schema change
ALTER TABLE public.user_entidades
    ADD COLUMN IF NOT EXISTS dominios JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS rota_inicial TEXT DEFAULT '/',
    ADD COLUMN IF NOT EXISTS configuracoes JSONB DEFAULT '{}'::jsonb;

-- Índice GIN para resolução rápida de domínio (contains)
CREATE INDEX IF NOT EXISTS idx_user_entidades_dominios
    ON public.user_entidades USING GIN (dominios);

-- ======================================================
-- 2. Tabela nova: app_permissoes
--    Design allow/deny + precedência (ver §3.2 do plano)
--    id_produto NULL = qualquer produto (modo compat);
--    preenchido por produto na Fase F (multi-produto)
-- ======================================================
CREATE TABLE IF NOT EXISTS public.app_permissoes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade    UUID REFERENCES public.user_entidades(id) ON DELETE CASCADE, -- NULL = regra global
    id_papel       UUID REFERENCES public.user_papeis(id) ON DELETE CASCADE,    -- NULL = qualquer papel
    id_produto     UUID REFERENCES public.produto(id) ON DELETE CASCADE,        -- NULL = qualquer produto
    ilha           TEXT NOT NULL,           -- ex: 'academico' | 'comercial' | 'portal_aluno' | 'portal_docente'
    botao          TEXT,                    -- NULL = a ilha inteira; ex: 'atividades_entregas'
    escopo         TEXT NOT NULL,           -- 'ilha' | 'botao' | 'rota' | 'acao'
    rota           TEXT,                    -- rota protegida (ex: '/portal-docente/entregas')
    permitido      BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = negação explícita
    criado_em      TIMESTAMPTZ DEFAULT NOW(),
    modificado_em  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota)
);

CREATE INDEX IF NOT EXISTS idx_app_permissoes_ilha ON public.app_permissoes(ilha);
CREATE INDEX IF NOT EXISTS idx_app_permissoes_entidade ON public.app_permissoes(id_entidade);
CREATE INDEX IF NOT EXISTS idx_app_permissoes_papel ON public.app_permissoes(id_papel);

-- RLS (decisão 2026-08-21): leitura para todo autenticado;
-- sem policies de escrita — gestão via dashboard/SQL (Fase D suspensa)
ALTER TABLE public.app_permissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_permissoes_leitura_autenticados"
    ON public.app_permissoes
    FOR SELECT USING (auth.role() = 'authenticated');

-- ======================================================
-- 3. Papel por entidade
--    id_user continua → auth.users; NULL = papel global.
--    A sessão resolve por auth.uid() + id_entidade.
-- ======================================================
ALTER TABLE public.user_papeis_auth
    ADD COLUMN IF NOT EXISTS id_entidade UUID
        REFERENCES public.user_entidades(id) ON DELETE CASCADE;

-- ======================================================
-- 4. Seed de permissões por papel (modo compat ajustado)
--
--    Decisões 2026-08-21 (perfis definidos pelo produto):
--    - admin                                -> bypass hardcoded na RPC (sem seed); vê tudo.
--    - aca_coordenador      / aca_admin_plataforma -> ilha ACADEMICO completa.
--    - aca_docente          -> ACADEMICO { programacao_atividades, avaliacoes, diario_classe } + PORTAL_DOCENTE completa.
--    - aca_estudante        -> ilha PORTAL_ALUNO completa.
--    - aca_candidato        -> PORTAL_ALUNO { meus_processos }.
--    - user_fin / user_crm  -> NENHUM acesso neste produto (são outro produto; default deny cobre).
--    - Regras por ENTIDADE (não globais): entidades que possuem o produto 'academico'.
--    - id_produto IS NULL (= qualquer produto); por produto específico na Fase F.
--    - Papéis referenciados por NOME (único em user_papeis), não por UUID hardcoded.
--
--    Conceder uma ILHA (botao NULL, escopo 'ilha') libera a ilha inteira.
--    Conceder um BOTÃO da ilha (escopo 'botao', rota NULL) libera só aquele item.
-- ======================================================

-- 4a. Ilha ACADEMICO completa -> aca_coordenador, aca_admin_plataforma
INSERT INTO public.app_permissoes (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota, permitido)
SELECT ep.id_entidade, p.id, NULL, 'academico', NULL, 'ilha', NULL, TRUE
FROM public.user_papeis p
CROSS JOIN (
    SELECT DISTINCT ep.id_entidade
    FROM public.entidade_produto ep
    JOIN public.produto pr ON pr.id = ep.id_produto
    WHERE pr.slug = 'academico' AND ep.ativo = TRUE
) ep
WHERE p.nome IN ('aca_coordenador', 'aca_admin_plataforma')
ON CONFLICT (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota) DO NOTHING;

-- 4b. ACADEMICO { programacao_atividades, avaliacoes, diario_classe } -> aca_docente
INSERT INTO public.app_permissoes (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota, permitido)
SELECT ep.id_entidade, p.id, NULL, 'academico', b.botao, 'botao', NULL, TRUE
FROM public.user_papeis p
CROSS JOIN (VALUES
    ('programacao_atividades'),
    ('avaliacoes'),
    ('diario_classe')
) AS b(botao)
CROSS JOIN (
    SELECT DISTINCT ep.id_entidade
    FROM public.entidade_produto ep
    JOIN public.produto pr ON pr.id = ep.id_produto
    WHERE pr.slug = 'academico' AND ep.ativo = TRUE
) ep
WHERE p.nome = 'aca_docente'
ON CONFLICT (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota) DO NOTHING;

-- 4c. PORTAL_DOCENTE completa -> aca_docente
INSERT INTO public.app_permissoes (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota, permitido)
SELECT ep.id_entidade, p.id, NULL, 'portal_docente', NULL, 'ilha', NULL, TRUE
FROM public.user_papeis p
CROSS JOIN (
    SELECT DISTINCT ep.id_entidade
    FROM public.entidade_produto ep
    JOIN public.produto pr ON pr.id = ep.id_produto
    WHERE pr.slug = 'academico' AND ep.ativo = TRUE
) ep
WHERE p.nome = 'aca_docente'
ON CONFLICT (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota) DO NOTHING;

-- 4d. PORTAL_ALUNO completa -> aca_estudante
INSERT INTO public.app_permissoes (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota, permitido)
SELECT ep.id_entidade, p.id, NULL, 'portal_aluno', NULL, 'ilha', NULL, TRUE
FROM public.user_papeis p
CROSS JOIN (
    SELECT DISTINCT ep.id_entidade
    FROM public.entidade_produto ep
    JOIN public.produto pr ON pr.id = ep.id_produto
    WHERE pr.slug = 'academico' AND ep.ativo = TRUE
) ep
WHERE p.nome = 'aca_estudante'
ON CONFLICT (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota) DO NOTHING;

-- 4e. PORTAL_ALUNO { meus_processos } -> aca_candidato
INSERT INTO public.app_permissoes (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota, permitido)
SELECT ep.id_entidade, p.id, NULL, 'portal_aluno', 'meus_processos', 'botao', NULL, TRUE
FROM public.user_papeis p
CROSS JOIN (
    SELECT DISTINCT ep.id_entidade
    FROM public.entidade_produto ep
    JOIN public.produto pr ON pr.id = ep.id_produto
    WHERE pr.slug = 'academico' AND ep.ativo = TRUE
) ep
WHERE p.nome = 'aca_candidato'
ON CONFLICT (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota) DO NOTHING;

-- 4f. user_fin / user_crm -> SEM regra (default deny) = nenhum acesso a este produto.
--     (Não inserimos regras; o default deny do modelo já os bloqueia.)

-- ======================================================
-- 5. Seed de domínios / rota_inicial da entidade existente
--    url segue null (sem domínio canônico definido ainda);
--    dominios/rota_inicial entram com valor default por enquanto.
--    (Ajustar por entidade quando os domínios reais forem definidos.)
-- ======================================================
-- (Opcional — valor default já cobre: rota_inicial '/' e dominios '[]')
