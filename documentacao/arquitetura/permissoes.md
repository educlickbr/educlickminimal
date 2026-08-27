# Arquitetura de Permissões — EduClick

> **Status:** design decidido (2026-08-21) — pronto para a Fase A do plano de multientidade
> **Fonte da decisão:** `documentacao/planos/plano-multientidade-permissoes.md`
> **Escopo:** permissões por **entidade × papel × produto** para controlar sessão, menu, telas, primeira página e branding por domínio.

---

## Sumário

- [1. Objetivo](#1-objetivo)
- [2. Modelo de dados](#2-modelo-de-dados)
  - [2.1 `app_permissoes` — nova](#21-app_permissoes--nova)
  - [2.2 Enriquecimento de entidades](#22-enriquecimento-de-entidades)
  - [2.3 Papel por entidade](#23-papel-por-entidade)
- [3. Catálogo de recursos (ilhas × botões × rotas)](#3-catálogo-de-recursos-ilhas--botões--rotas)
- [4. Regras de resolução (allow/deny)](#4-regras-de-resolução-allowdeny)
- [5. Fluxo de sessão](#5-fluxo-de-sessão)
- [6. RLS](#6-rls)
- [7. Decisões e dívidas](#7-decisões-e-dívidas)
- [8. Implementação em fases](#8-implementação-em-fases)
- [9. Histórico de Revisão](#9-histórico-de-revisão)

---

## 1. Objetivo

Hoje menu, telas e primeira página são iguais para qualquer usuário logado, independente da entidade e do papel. O objetivo deste modelo é **controlar a sessão**: o que a entidade pode ver e o que o papel do usuário naquela entidade pode ver.

- Ilhas, botões e telas aparecem conforme a permissão.
- Rotas bloqueadas (middleware global).
- Primeira página e cores (branding) por domínio/entidade.

**Papéis hoje, no banco** (referência por **nome**, único em `user_papeis`):

| Papel | Uso |
|---|---|
| `admin` | Plataforma (bypass: vê tudo) |
| `aca_admin_plataforma` | Admin do produto acadêmico |
| `aca_coordenador` | Coordenação pedagógica |
| `aca_docente` | Professor |
| `aca_estudante` | Aluno |
| `aca_candidato` | Candidato em processo seletivo |
| `user_fin` | Financeiro |
| `user_crm` | CRM / comercial |

---

## 2. Modelo de dados

### 2.1 `app_permissoes` — nova

Design **allow/deny** (corrige o modelo antigo baseado em `jsonb contains`): uma linha por regra, com possibilidade de **negar pontualmente** o que veio de uma regra mais ampla.

```sql
CREATE TABLE IF NOT EXISTS public.app_permissoes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade   UUID REFERENCES public.user_entidades(id) ON DELETE CASCADE, -- NULL = global
    id_papel      UUID REFERENCES public.user_papeis(id) ON DELETE CASCADE,    -- NULL = qualquer papel
    id_produto    UUID REFERENCES public.produto(id) ON DELETE CASCADE,        -- NULL = qualquer produto
    ilha          TEXT NOT NULL,           -- ex: 'academico' | 'comercial' | 'portal_aluno' | 'portal_docente'
    botao         TEXT,                    -- NULL = a ilha inteira; ex: 'atividades_entregas'
    escopo        TEXT NOT NULL,           -- 'ilha' | 'botao' | 'rota' | 'acao'
    rota          TEXT,                    -- rota protegida (ex: '/portal-docente/entregas')
    permitido     BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = negação explícita
    criado_em     TIMESTAMPTZ DEFAULT NOW(),
    modificado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota)
);
CREATE INDEX IF NOT EXISTS idx_app_permissoes_ilha ON public.app_permissoes(ilha);
CREATE INDEX IF NOT EXISTS idx_app_permissoes_entidade ON public.app_permissoes(id_entidade);
CREATE INDEX IF NOT EXISTS idx_app_permissoes_papel ON public.app_permissoes(id_papel);
```

**RLS (decisão 2026-08-21):** leitura para **todo autenticado** (o front precisa do catálogo para filtrar menu/telas); **sem policies de escrita** — gestão via Supabase dashboard/SQL (Fase D de tela suspensa).

```sql
ALTER TABLE public.app_permissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_permissoes_leitura_autenticados" ON public.app_permissoes
    FOR SELECT USING (auth.role() = 'authenticated');
```

### 2.2 Enriquecimento de entidades

Adiciona suporte a múltiplos domínios, rota inicial e flags não-estruturais:

```sql
ALTER TABLE public.user_entidades
    ADD COLUMN IF NOT EXISTS dominios JSONB DEFAULT '[]'::jsonb,      -- ["educlick.com.br", "app.educlick.com.br"]
    ADD COLUMN IF NOT EXISTS rota_inicial TEXT DEFAULT '/',           -- primeira página pós-login
    ADD COLUMN IF NOT EXISTS configuracoes JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_user_entidades_dominios ON public.user_entidades USING GIN (dominios);
```

> `url` (UNIQUE) continua como domínio canônico/fallback; `dominios` aceita www, subdomínio e aliases.

### 2.3 Papel por entidade

```sql
ALTER TABLE public.user_papeis_auth
    ADD COLUMN IF NOT EXISTS id_entidade UUID REFERENCES public.user_entidades(id) ON DELETE CASCADE; -- NULL = papel global
```

- `id_user` continua → `auth.users`.
- A **sessão** resolve papéis por entidade via `auth.uid()`: linhas com `id_entidade = X` **OU** `id_entidade IS NULL`.
- O JWT global (`jwt_custom_claims`) **não muda** por ora — vira fallback/legado; a evolução RLS para papel por entidade é a Fase E.

---

## 3. Catálogo de recursos (ilhas × botões × rotas)

Catálogo **constante no front + seed** (decisão 2026-08-21 — sem tabela `app_recursos`). Alimenta o seed do modo compat e a UI de filtro do menu/telas. Chave de permissão: `ilha` ou `ilha:botao` ou `rota`.

| Ilha | Botão (chave) | Rota |
|---|---|---|
| `academico` | `oferta_cursos` | `/academico_oferta` |
| `academico` | `formularios` | `/formularios` |
| `academico` | `processo_seletivo` | `/processos` |
| `academico` | `matriculas` | `/matriculas` |
| `academico` | `docentes` | `/docentes` |
| `academico` | `calendario_escolar` | `/academico_calendario` |
| `academico` | `calendario_salas` | `/calendario-salas` |
| `academico` | `atribuicao` | `/atribuicao` |
| `academico` | `programacao_atividades` | `/programacao_atividades` |
| `academico` | `avaliacoes` | `/avaliacoes` |
| `academico` | `diario_classe` | `/diario_classe` |
| `comercial` | `produtos` | `/produtos` |
| `comercial` | `gateway` | `/configuracoes/pagamento` |
| `comercial` | `vendas` | `/vendas` |
| `comercial` | `dashboard` | `/dashboard_vendas` |
| `portal_aluno` | `meus_processos` | `/meus-processos` |
| `portal_aluno` | `meus_cursos` | `/meus-cursos` |
| `portal_aluno` | `minhas_atividades` | `/minhas_atividades` |
| `portal_aluno` | `certificados` | `/certificados` |
| `portal_aluno` | `gestao_faltas` | `/gestao_faltas` |
| `portal_docente` | `atividades_entregas` | `/portal-docente/entregas` |
| `portal_docente` | `minha_conta` | `/portal-docente/conta` |

> **Recomendação:** as rotas adicionadas depois devem registrar sua chave aqui, para não abrir acesso sem permissão.

---

## 4. Regras de resolução (allow/deny)

**Default deny + precedência por especificidade + deny vence.**

1. O usuário recebe **nenhuma** permissão se não houver linha que case.
2. Casam linhas onde `(id_entidade = X OR id_entidade IS NULL)` **E** `(id_papel = P OR id_papel IS NULL)` **E** `(id_produto = PR OR id_produto IS NULL)`.
3. **Precedência por especificidade** (a mais específica vence):
   `(entidade+papel) > (entidade) > (papel) > (global)`.
4. Em empate de especificidade, **`permitido = false` vence** (deny revoga pontualmente o que veio de regra mais ampla).
5. **Bypass de plataforma:** papel `admin` (global) vê tudo — regra hardcoded na RPC (não depende de seed).
6. **Modo compat (fase inicial):** seed inicial replica o que cada papel deve ver (não é default-vê-tudo — **já nasce com perfil por papel**, ver abaixo); depois se afina revogando por entidade.

**Escopo de produto no seed (decisão 2026-08-21):** as regras usam `id_produto IS NULL` (= aplica a **qualquer produto**) porque hoje o menu/telas não diferenciam produto. O preenchimento por produto (`id_produto` específico) fica para a **Fase F** (multi-produto), quando o produto contratado passar a filtrar o que aparece.

**Seed por entidade (decisão 2026-08-21):** com poucos usuários hoje, as regras nascem **por entidade** (`id_entidade` das entidades que possuem o produto `academico`), não globais — controlar por entidade desde o início.

**Perfil por papel no seed (produto `academico`, 2026-08-21):**

| Papel | Acesso no produto acadêmico |
|---|---|
| `admin` | Tudo (bypass hardcoded na RPC — sem seed) |
| `aca_coordenador` | Ilha **Acadêmico** completa |
| `aca_admin_plataforma` | Ilha **Acadêmico** completa |
| `aca_docente` | **Acadêmico** { `programacao_atividades`, `avaliacoes`, `diario_classe` } + ilha **Portal Docente** completa |
| `aca_estudante` | Ilha **Portal do Aluno** completa |
| `aca_candidato` | **Portal do Aluno** { `meus_processos` } |
| `user_fin` | **Nenhum** (é outro produto — default deny) |
| `user_crm` | **Nenhum** (é outro produto — default deny) |

> Nota: ilha concedida (`escopo='ilha'`, `botao NULL`) libera a ilha inteira; botão concedido (`escopo='botao'`) libera só aquele item dentro da ilha.

---

## 4.1 Gate de acesso por produto (Fase F)

**O que é:** independente das ilhas/permissões internas, há uma *porta de entrada* por **produto/frente**. Produtos são frentes separadas (EduClick, Financeiro Família, ...) que **compartilham tabelas** — um produto pode ver dados do outro quando a pessoa tem acesso aos dois. A permissão de acesso a um produto é a **licença** da entidade.

**Modelo (decisão 2026-08-21):** o acesso é por **entidade × produto**, definido em `entidade_produto` (tabela já existente — **sem tabela nova de licença**):

> - `user_entidades.dominios` / `entidade_produto.url_acesso` → resolvem **qual produto** aquele domínio atende (**white label** por-cliente).
> - `entidade_produto` → guarda **a lista de produtos que a entidade contratou**.
> - A sessão valida **pertença do usuário à entidade** (`user_entidade_user` + `user_papeis_auth`).

**Fluxo de validação (porta):**

```
1. Resolve a entidade pelo host → app_resolver_entidade_por_dominio(p_dominio)
   → retorna entidade + produtos[] (de entidade_produto)
2. Valida que o usuário pertence à entidade → app_get_minha_sessao
3. Gate: entidade tem o produto que o domínio espera?
   - Sim  → segue (entidade_ativa + permissões)
   - Não  → /api/me retorna sem_acesso → front avisa e desloga
4. Caso URL-única multi-tenant (ex.: Financeiro Família, uma url só):
   o domínio não distingue a entidade → usuário escolhe a entidade
   (seletor de entidade) → valida permissão pelo par entidade×produto
```

**Cobre os 2 casos (decisão 2026-08-21):**
- **White label** (`ava-aic.com.br` → entidade AIC com EduClick): domínio resolve a entidade+produto.
- **URL única multi-tenant** (Financeiro Família): vários clientes no mesmo host → seletor de entidade resolve qual conta; o acesso ao produto vem da lista de `entidade_produto` da entidade escolhida.

**Destino do `user_produto`:** com o acesso por **entidade** (`entidade_produto`) + papel por entidade (`user_papeis_auth.id_entidade`), `user_produto` fica **redundante** → remover na Fase F (com backfill de `user_papeis_auth.id_entidade` onde faltar). O antigo `produtos[].papel` (papel por produto) é substituído pelo papel por entidade.

---

## 5. Fluxo de sessão

```
BFF /api/me (server/api/me.ts)
  → resolve entidade ativa pelo host → app_resolver_entidade_por_dominio(p_dominio)
  → app_get_minha_sessao(p_id_entidade)  [SECURITY INVOKER, usuário via auth.uid()]
      { entidade_ativa, papeis, permissoes, rota_inicial, branding }
  → gate: entidade tem o produto do domínio? senão sem_acesso (avisa+desloga)
```

- **Dev:** `localhost` → entidade de teste hardcoded no BFF (decisão 2026-08-21).
- **Staging:** sem domínio próprio hoje (Cloudflare Pages) — resolver quando surgir.
- **Avaliação sempre server-side** (RPC/BFF); o front **apenas renderiza o que o BFF autorizou** — nunca confiar em flag local. Middleware de rota protege a UX; a autorização real fica nas RPCs/RLS.

---

## 6. RLS

- `app_permissoes`: SELECT p/ autenticados; sem escrita.
- Hoje somente `noticias` e `leads` usam o papel global do JWT (`auth.jwt() -> 'claims'`) — escopo real da Fase E (evolução para papel por entidade) é pequeno.

---

## 7. Decisões e dívidas

**Decidido (2026-08-21):**
- Modo **compat** primeiro; afina por entidade depois.
- Papel por entidade na **sessão** agora, RLS depois (Fase E).
- `user_produto` removida na Fase F (com migração de dados).
- Gestão de permissões **suspensa** (via dashboard/SQL).
- Catálogo = **constante no front + seed**.
- Multi-entidade = **dívida** (entidade ativa por domínio; sem seletor no menu).
- Dev: `localhost` → entidade de teste.

**Dívidas:**
- Seletor de entidade no menu (multi-entidade na mesma sessão) — **em pauta na Fase F**, necessário p/ o caso de URL única multi-tenant (Financeiro Família).
- `ROLES` hardcoded no store — pago na Fase C (papel dinâmico por entidade ativa). ✅

---

## 8. Implementação em fases

| Fase | Escopo | Entrega |
|---|---|---|
| **A** | Migration única: `user_entidades` (+dominios/rota_inicial/configuracoes), `app_permissoes` + RLS + índices, `user_papeis_auth` +`id_entidade`, seed compat (por **nome** de papel) | Aplicável com `supabase db push`, sem quebrar nada |
| **B** | RPC `app_get_minha_sessao` (allow/deny + precedência + bypass admin), RPC `app_resolver_entidade_por_dominio`, BFF `/api/me` estendido | `/api/me` responde permissões/entidade_ativa/branding |
| **C** | Store (entidade_ativa, permissoes, temPermissao, branding, role dinâmico), FullPageMenu filtrado, middleware global, login→rota_inicial | Menu/cores/primeira página mudam por entidade |
| **D** | Tela de gestão de permissões — **suspensa** | — |
| **E** | RLS por papel/entidade (escopo pequeno: `noticias`, `leads`) | Segurança no banco alinhada às permissões |
| **F** | Multi-produto: **gate de acesso por produto** (entidade×produto via `entidade_produto`, parente no domínio e seletor p/ URL única), remover `user_produto`, `produtos[]` via `entidade_produto` | Quem não tem o produto é avisado+deslogado; produto contratado determina a frente |

---

## 9. Histórico de Revisão

| Data | Descrição |
|---|---|
| 2026-08-21 | Criado a partir das decisões do plano de multientidade; registra modelo de permissões, catálogo de recursos e fases |
