# Plano — Multientidade: Permissões, Identidade por Domínio e Multi-produto

**Status:** 🟢 Decisões fechadas (2026-08-21) — pronto para a **Fase A**. Precede a **Fase 2.5 (relatórios)**: relatórios são por cliente/entidade e quem pode vê-los será definido por permissão.

---

## 1. Contexto

O app é **multitenant** (`user_entidades` = "empresa"/cliente) e **multi-produto** (mesmo banco pode vender o produto financeiro e o educacional, separados ou juntos — e no futuro outras frentes como "palestras"). Hoje:

- Não existe controle de **permissões por entidade × papel** (menu e telas são iguais para todos que logam)
- A **primeira página** é sempre a mesma (`/`), independente do domínio/entidade
- O **branding** (cor primária, logo) já existe no banco (`user_entidades.cor_principal`, `logo_*`) mas **não é aplicado no front**
- As RLS e helpers atuais usam o **papel global do JWT** (`auth.jwt() ->> 'papel'`) — não por entidade

**Objetivo:** um sistema de permissões que controle a sessão — o que a empresa (entidade) pode ver e o que o papel do usuário naquela entidade pode ver. Ilhas, botões e telas aparecem conforme a permissão; rotas bloqueadas; primeira página e cores por domínio/entidade.

**Exemplos alvo:** `educlick.com.br` (atual, violeta), `ensi.com.br` (nova entidade, cor própria) — cada domínio resolve uma entidade, com sua rota inicial, suas permissões e seu branding.

---

## 2. Estado atual (mapa do código)

| Camada | O que existe hoje | Lacuna |
|---|---|---|
| **Entidade** | `user_entidades(id, nome_entidade, tipo, url UNIQUE, logo_aberto, logo_fechado, cor_principal, cor_principal_hover, cor_secundaria, cor_secundaria_hover, criado_por, modificado_por, modificado_em)` | Não tem domínios múltiplos nem `rota_inicial` |
| **Produtos** | `produto(id, nome, slug)` + `entidade_produto(id_entidade, id_produto, url_acesso UNIQUE, configuracoes jsonb, ativo)` | `configuracoes` existe mas é pouco usado |
| **Usuário × entidade** | `user_entidade_user(id_user_expandido, id_entidade)` | Ok |
| **Usuário × produto** | `user_produto(id_user_expandido, id_entidade_produto, papel_no_produto, ativo)` | **Candidata a remoção** (o vínculo real é `user_entidade_user` + `entidade_produto`) |
| **Papéis** | `user_papeis(id, nome)` + `user_papeis_auth(id_user → auth.users, id_papel)` | Papel é **global** (sem `id_entidade`) — não existe papel por entidade |
| **Sessão** | BFF `server/api/me.ts` → RPC `nxt_get_user_session_v1` (SECURITY INVOKER — convertida em `20260330100200`) → `{ usuario, entidades: [{ id, nome, tipo, url, branding, produtos: [{ id, slug, url_acesso, papel }] }] }` | Não retorna **permissões** nem **papel** (`store.role` fica `undefined` — `hasRole` quebra silencioso); `ROLES` hardcoded no store com UUIDs desatualizados |
| **Store** | `stores/app.ts` (`initSession` via `/api/me`) | Sem `permissoes`, sem `entidade_ativa`, sem aplicação de branding |
| **Menu** | `FullPageMenu.vue` com 4 ilhas hardcoded (Acadêmico, Comercial, Portal do Aluno, Portal Docente) | Ilhas/botões fixos — nada é filtrado |
| **Rotas** | Sem middleware global; login redireciona para `/` ou `?redirectTo` | Sem bloqueio por permissão; primeira página fixa |
| **Tema** | Variáveis CSS em `front_end/app/assets/css/style.css` (`:root { --color-primary: #8b5cf6; ... }`) usadas pelo Tailwind (`bg-primary`, `text-primary`, ...) | Cores fixas — branding da entidade não é aplicado |
| **JWT/RLS** | JWT carrega `papel` (nome) e `entidades` (array UUID) via trigger `jwt_custom_claims`; RLS usa `auth.jwt() -> 'claims'` (hoje em `noticias` e `leads`) | Papel global; RLS não enxerga papel por entidade |

---

## 3. Modelo de dados proposto

### 3.1 `user_entidades` — enriquecimento

```sql
ALTER TABLE public.user_entidades
    ADD COLUMN IF NOT EXISTS dominios JSONB DEFAULT '[]'::jsonb,      -- ["educlick.com.br", "www.educlick.com.br", "app.educlick.com.br"]
    ADD COLUMN IF NOT EXISTS rota_inicial TEXT DEFAULT '/',           -- primeira página pós-login desta entidade
    ADD COLUMN IF NOT EXISTS configuracoes JSONB DEFAULT '{}'::jsonb; -- flags futuras (sem schema change)

-- índice GIN p/ resolver domínio rápido (ou lookup em memória cacheado)
CREATE INDEX IF NOT EXISTS idx_user_entidades_dominios ON public.user_entidades USING GIN (dominios);
```

> Nota: `url` (UNIQUE) continua como domínio canônico/fallback; `dominios` aceita múltiplos (www, subdomínio, aliases).

### 3.2 `app_permissoes` — nova (design allow/deny, corrige a falha do modelo antigo)

A tabela do outro projeto usava `empresas jsonb` + `papeis jsonb` (contains) — falha: uma linha de papel acabava valendo para todas as empresas e não dava para **negar** pontualmente. Proposta:

```sql
CREATE TABLE IF NOT EXISTS public.app_permissoes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade  UUID REFERENCES public.user_entidades(id) ON DELETE CASCADE, -- NULL = regra global
    id_papel     UUID REFERENCES public.user_papeis(id) ON DELETE CASCADE,    -- NULL = qualquer papel
    id_produto   UUID REFERENCES public.produto(id) ON DELETE CASCADE,        -- NULL = qualquer produto
    ilha         TEXT NOT NULL,           -- ex: 'academico' | 'comercial' | 'portal_aluno' | 'portal_docente'
    botao        TEXT,                    -- NULL = a ilha inteira; ex: 'atividades_entregas'
    escopo       TEXT NOT NULL,           -- 'ilha' | 'botao' | 'rota' | 'acao'
    rota         TEXT,                    -- rota protegida (ex: '/portal-docente/entregas')
    permitido    BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = negação explícita
    criado_em    TIMESTAMPTZ DEFAULT NOW(),
    modificado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_entidade, id_papel, id_produto, ilha, botao, escopo, rota)
);
CREATE INDEX IF NOT EXISTS idx_app_permissoes_ilha ON public.app_permissoes(ilha);
CREATE INDEX IF NOT EXISTS idx_app_permissoes_entidade ON public.app_permissoes(id_entidade);
CREATE INDEX IF NOT EXISTS idx_app_permissoes_papel ON public.app_permissoes(id_papel);
```

**RLS (decisão 2026-08-21):** leitura liberada para **todo autenticado** (o front precisa do catálogo de permissões para filtrar menu/telas); **sem policies de escrita** — regras geridas via Supabase dashboard/SQL (service_role) por enquanto, a tela de gestão (Fase D) fica suspensa.

```sql
ALTER TABLE public.app_permissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_permissoes_leitura_autenticados" ON public.app_permissoes
    FOR SELECT USING (auth.role() = 'authenticated');
```

**Regras de resolução (default deny + precedência + deny vence):**

1. O usuário recebe **nenhuma** permissão se não houver linha que case.
2. Casam linhas onde `(id_entidade = X OR id_entidade IS NULL)` **E** `(id_papel = P OR id_papel IS NULL)` **E** `(id_produto = PR OR id_produto IS NULL)`.
3. **Precedência por especificidade** (a mais específica vence):
   `(entidade+papel) > (entidade) > (papel) > (global)`.
4. Em empate de especificidade, **`permitido = false` vence** (deny tem prioridade — serve para revogar pontualmente o que veio de uma regra mais ampla).
5. **Bypass de plataforma:** papel `admin` (global) vê tudo — regra hardcoded na RPC (não depende de seed).
6. **Modo compat (fase inicial):** enquanto o seed não é refinado, os papéis atuais (`admin`, `aca_coordenador`, `aca_admin_plataforma`, `aca_docente`, `aca_estudante`, `user_fin`, `user_crm`, `aca_candidato`) recebem seed inicial que replica o comportamento atual; depois se afina revogando.

### 3.3 `user_papeis_auth` — papel por entidade

```sql
ALTER TABLE public.user_papeis_auth
    ADD COLUMN IF NOT EXISTS id_entidade UUID REFERENCES public.user_entidades(id) ON DELETE CASCADE; -- NULL = papel global
```

- O JWT continua com o papel global (para não quebrar RLS atual).
- A **sessão** resolve os papéis **por entidade** via `auth.uid()`: `user_papeis_auth` com `id_user = auth.uid()` e `id_entidade = X` OU `id_entidade IS NULL`.
- Decisão (2026-08-21): a resolução continua por `id_user` (→ `auth.users`), **não** por `user_expandido` — troca de conta = a conta nova ganha novos papéis (design aceito).
- Fase futura (evolução RLS): RLS passa a receber `p_id_entidade` e avalia papel por entidade. Escopo real é pequeno: hoje só `noticias` e `leads` usam o papel global do JWT.

### 3.4 `user_produto` — candidata a remoção (deliberar)

O vínculo real já é coberto por `user_entidade_user` (usuário→entidade) + `entidade_produto` (entidade→produto). O que `user_produto` adiciona é `papel_no_produto` — que será substituído pelo **papel por entidade** (3.3). Proposta: **migrar dados e dropar `user_produto`** na fase final, atualizando `nxt_get_user_session_v1` para montar `produtos[]` via `entidade_produto` direto.

> **Decisão (2026-08-21):** o acesso a um produto é a **licença da entidade**, definida em `entidade_produto` (sem tabela nova). O gate por produto entra na **Fase F**: entidade × produto → se não tem, `/api/me` retorna `sem_acesso` e o front avisa+desloga. `user_produto` vira redundante e é removido (com backfill de `user_papeis_auth.id_entidade`).

---

## 4. Decisões de design

> **2026-08-21:** decisões tomadas em §11 (modo compat, papel por entidade via sessão, gestão de permissões suspensa, multi-entidade adiada). As recomendações abaixo seguem como fundamento técnico.

1. **Default deny vs. compat:** começar em modo compat (todos os papéis atuais veem o que viam) e ir afinando por entidade — ou já nascer com default deny + seed cirúrgico? **Recomendação:** compat primeiro (não quebra o app), afina depois.
2. **Papel por entidade:** necessário para o mesmo usuário ser `admin` numa escola e `estudante` em outra. Impacta JWT/RLS no futuro. **Recomendação:** sessão resolve por entidade agora; RLS evolui por fase.
3. **Domínio → entidade:** resolver por `dominios jsonb` (contains) com fallback em `url`; em dev (`localhost`) usar entidade de teste hardcoded (padrão já usado no projeto referência).
4. **Primeira página:** `user_entidades.rota_inicial` (pós-login), com fallback `/`. `entidade_produto.url_acesso` continua sendo o link público de acesso ao produto.
5. **Branding:** BFF retorna `branding` da entidade ativa → store aplica as variáveis CSS (`--color-primary`, `--color-primary-hover`, `--color-secondary*`, logo) via `document.documentElement.style.setProperty` — o Tailwind já consome `var(--color-*)`, então a troca é instantânea e sem recompilar.
6. **Onde o papel é avaliado:** sempre **server-side** (RPC `app_get_sessao_permitida` ou extensão do `nxt_get_user_session_v1`) — o front apenas renderiza o que o BFF autorizou; nunca confiar em flag local.

---

## 5. Fluxo de sessão (backend)

### RPC de sessão estendida (proposta)

Nova RPC (SECURITY INVOKER — nunca DEFINER, acordo do projeto), chamada pelo BFF `/api/me`:

```
app_get_minha_sessao(p_id_entidade UUID)  -- SECURITY INVOKER; usuário via auth.uid(); entidade ativa resolvida pelo domínio no BFF
RETORNA {
  entidade_ativa: { id, nome, tipo, url, rota_inicial, dominios, branding: {logo_aberto, logo_fechado, cor_principal, cor_principal_hover, cor_secundaria, cor_secundaria_hover} },
  papeis: [{ id, nome, escopo: 'entidade'|'global' }],
  permissoes: [
    { ilha, botao, escopo, rota }
  ],  -- já resolvido (allow/deny + precedência) para (entidade, papel, produto)
}
```

### BFF `server/api/me.ts` (estendido)

1. Resolve a entidade ativa pelo **host** da requisição (`getRequestHeader(event, 'host')`) → busca em `user_entidades.dominios`/`url` (RPC pública ou query com RLS). Dev: hardcode entidade de teste.
2. Chama `app_get_minha_sessao(p_id_entidade)` (autenticado).
3. Retorna: sessão atual **+** `entidade_ativa`, `papeis`, `permissoes`, `rota_inicial`, `branding`.

---

## 6. Front (store, menu, rotas, tema)

### 6.1 Store (`stores/app.ts`)

- Novo estado: `entidade_ativa`, `papeis`, `permissoes` (Set de chaves `ilha`/`ilha:botao`/`rota`), `rota_inicial`, `branding`.
- Novo helper: `temPermissao(ilha, botao?, escopo?)` → checa allow/deny; `temPermissaoRota(rota)`.
- `initSession` aplica branding: seta variáveis CSS das cores/logo.
- Corrigir bug latente: `this.role` hoje recebe `data.role` que o BFF não retorna (fica `undefined` e `hasRole` quebra) — preencher com o **papel por entidade ativa** vindo da sessão.
- **Dívida a pagar nesta fase:** remover os `ROLES` hardcoded do store (UUIDs desatualizados, não batem com os do banco) — papel passa a ser dinâmico, resolvido na sessão.

### 6.2 Menu (`FullPageMenu.vue`)

- Recebe as permissões e filtra **ilhas** e **botões** (`v-if="store.temPermissao('portal_docente')"` etc.).
- Estrutura atual: 4 ilhas com N botões cada — mapear cada ilha/botão para uma chave de permissão (catálogo abaixo, base do seed compat).

**Catálogo atual (4 ilhas / 22 botões) — chaves de permissão:**

| Ilha | Botões (`chave` → rota) |
|---|---|
| `academico` | `oferta_cursos` → `/academico_oferta` · `formularios` → `/formularios` · `processo_seletivo` → `/processos` · `matriculas` → `/matriculas` · `docentes` → `/docentes` · `calendario_escolar` → `/academico_calendario` · `calendario_salas` → `/calendario-salas` · `atribuicao` → `/atribuicao` · `programacao_atividades` → `/programacao_atividades` · `avaliacoes` → `/avaliacoes` · `diario_classe` → `/diario_classe` |
| `comercial` | `produtos` → `/produtos` · `gateway` → `/configuracoes/pagamento` · `vendas` → `/vendas` · `dashboard` → `/dashboard_vendas` |
| `portal_aluno` | `meus_processos` → `/meus-processos` · `meus_cursos` → `/meus-cursos` · `minhas_atividades` → `/minhas_atividades` · `certificados` → `/certificados` · `gestao_faltas` → `/gestao_faltas` |
| `portal_docente` | `atividades_entregas` → `/portal-docente/entregas` · `minha_conta` → `/portal-docente/conta` |

### 6.3 Rotas (middleware global Nuxt)

- `app/middleware/auth.global.ts` (ou `sessao.ts`): antes de cada navegação autenticada, valida:
  1. Usuário logado → senão redireciona para `/auth/login?redirectTo=...`
  2. **Permissão de rota** → senão redireciona para a primeira página permitida (ou `/`)
- Rotas com `definePageMeta({ perm: 'ilha:botao' })` opcional; default: qualquer rota do app exige apenas login (compat) — a proteção fina entra por fase.

> ⚠️ **Integração:** hoje o login é controlado pelos `redirectOptions` do `@nuxtjs/supabase` (exclude list no `nuxt.config.ts`). O middleware global precisa coexistir **sem quebrar o fluxo de callback (`/confirm`) e o SSR**.

### 6.4 Botões em telas

- `v-if="store.temPermissao('academico', 'programacao_atividades')"` nos botões de acesso (ex.: ilha Portal Docente → "Atividades e Entregas").

### 6.5 Primeira página pós-login

- Login (`auth/login.vue`) e logout redirecionam para `store.rota_inicial` (fallback `/`) em vez de `/` fixo.
- `/` (index) continua a landing pública para não-logado; logado redireciona para `rota_inicial` da entidade ativa.

### 6.6 Branding dinâmico

- `initSession` → `document.documentElement.style.setProperty('--color-primary', branding.cor_principal)` (+ hover, secundária, logos). Reset no logout.
- Guardar `id_entidade` ativa para as RPCs que já usam `id_entidade` (o `useProgAtividadesCore.getEntidadeAtivaId()` passa a usar `entidade_ativa.id` em vez de "primeira entidade com produto acadêmico").

---

## 7. Admin de permissões (tela de gestão)

**⏸️ Suspensa (decisão 2026-08-21)** — as regras são geridas direto no Supabase dashboard/SQL por enquanto (a RLS da tabela já libera leitura para autenticados, que o front usa para filtrar menu/telas). Quando a tela entrar (local a definir):

- Listar regras por (entidade, papel, produto) com filtro por ilha
- Criar/editar/negar regras (`permitido` true/false), visual de matriz (ilha × botão × papel)
- Catálogo de ilhas/botões/rotas do app (tabela de apoio `app_recursos` opcional OU constante no front + seed)

---

## 8. Fases de implementação

### Fase A — Modelo de dados (migration única)
- `user_entidades`: + `dominios`, `rota_inicial`, `configuracoes`
- `app_permissoes` (nova) + índices
- `user_papeis_auth`: + `id_entidade`
- Seed inicial de permissões — **já com perfil por papel** (não é default-vê-tudo): `admin` bypass; `aca_coordenador`/`aca_admin_plataforma` Acadêmico; `aca_docente` Acadêmico{programacao_atividades,avaliacoes,diario_classe}+Portal Docente; `aca_estudante` Portal do Aluno; `aca_candidato` Portal do Aluno{meus_processos}; `user_fin`/`user_crm` **nenhum** (outro produto) — **referenciar `user_papeis` por nome** (único), entidade via `entidade_produto` (produto `academico`), sem UUID hardcoded
- **Escopo de produto no seed compat:** `id_produto IS NULL` (= qualquer produto); preencher por produto na **Fase F**
- **Seed por entidade:** regras compat nascem por **entidade** (`id_entidade`), não globais — poucos usuários hoje (decisão 2026-08-21)
- **Entrega:** tudo aplicável com `supabase db push`, sem quebrar nada

### Fase B — Backend de sessão
- RPC `app_get_minha_sessao(p_id_entidade)` — SECURITY INVOKER, usuário via `auth.uid()` (resolução allow/deny + precedência; bypass admin)
- RPC pública `app_resolver_entidade_por_dominio(p_dominio)` (para o BFF, também usada em telas públicas)
- BFF `/api/me` estendido (host → entidade → sessão + permissões + branding + rota_inicial)
- **Entrega:** `/api/me` responde permissões/entidade_ativa/branding; testável via curl

### Fase C — Front de sessão
- Store: `entidade_ativa`, `papeis`, `permissoes`, `temPermissao`, `temPermissaoRota`, `rota_inicial`, aplicação de branding; correção do `role` (dinâmico, por entidade ativa) + remoção dos `ROLES` hardcoded
- `FullPageMenu` filtrado por permissões (ilhas e botões)
- Middleware global de rota (login + permissão de rota)
- Login/logout → `rota_inicial`
- **Entrega:** ao logar em domínios diferentes, menu/cores/primeira página mudam conforme a entidade; telas sem permissão redirecionam

### Fase D — Gestão de permissões (admin) — ⏸️ suspensa
- **Suspensa até segunda ordem (decisão 2026-08-21):** regras geridas via Supabase dashboard/SQL; a RLS já permite leitura para autenticados
- Quando retomar: tela de regras (CRUD) + catálogo de recursos
- **Entrega:** gestor da entidade concede/revoga sem SQL

### Fase E — Evolução RLS (papel por entidade) — gradual
- RLS passa a receber `p_id_entidade` e a checar `user_papeis_auth` por entidade; JWT global vira fallback
- **Entrega:** segurança no banco alinhada às permissões (ex.: docente só gerencia dados da entidade onde tem papel)
- ✅ **Escopo reduzido:** hoje só `noticias` e `leads` usam papel global (`auth.jwt() -> 'claims'`) — refactor pequeno, mas fazer por módulo, com testes

### Fase F — Multi-produto
- **Gate de acesso por produto (decisão 2026-08-21):** acesso = licença da **entidade** em `entidade_produto`. Resolve pelo domínio (white label) e, p/ URL única multi-tenant, por **seletor de entidade**.
- `/api/me` valida: entidade tem o produto que o domínio espera → senão `sem_acesso` (front avisa + desloga).
- Migrar `user_produto.papel_no_produto` → papel por entidade; **dropar `user_produto`** (com backfill de `user_papeis_auth.id_entidade`).
- `nxt_get_user_session_v1` monta `produtos[]` via `entidade_produto` direto.
- Fluxo "trazer usuários de um produto para outro" — vínculo em `entidade_produto` + `user_entidade_user`.
- **Entrega:** quem não tem o produto é avisado+deslogado; produto contratado determina a frente; um usuário pode ter produtos diferentes por entidade (seletor).

---

## 9. Testes

- **Unit (RPC):** matriz de casos da resolução de permissão (global × entidade × papel, deny sobrepondo allow, admin bypass, sem regra = negado)
- **BFF:** `/api/me` por host (domínio X → entidade X, permissões certas, branding certo); localhost → entidade de teste
- **Front:** menu filtra, rota bloqueada redireciona, cor muda, primeira página certa
- **Regressão:** fluxos atuais (programação atividades, aluno, docente) intactos no modo compat

---

## 10. Relação com outras frentes

- **Fase 2.5 (relatórios):** a tela de relatórios entra com `temPermissao` e o escopo de dados é por `entidade_ativa` — por isso este plano vem antes.
- **Permissões de relatório:** regras `escopo = 'rota'`/`'botao'` para `/relatorios` e por módulo.
- **LMS (2.0–2.4):** o modo compat garante que nada quebra; a Fase E (RLS) pode absorver a "separação por entidade" que o LMS já assume via `id_entidade`.

---

## 11. Decisões fechadas (2026-08-21)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Modo compat vs. default deny | **Seed já perfila por papel** (não é default-vê-tudo): ver perfil em §3.2/§4 do `permissoes.md`. Referencia `user_papeis` por **nome** (único), não por UUID hardcoded — 8 papéis existentes: `admin`, `aca_admin_plataforma`, `aca_coordenador`, `aca_docente`, `aca_estudante`, `aca_candidato`, `user_fin`, `user_crm` |
| 2 | Papel por entidade | **Sessão agora, RLS depois.** Sessão resolve via `auth.uid()` em `user_papeis_auth` (novo `id_entidade`); `id_user` continua → `auth.users` (troca de conta = novos papéis, design aceito). `jwt_custom_claims` não muda por ora |
| 3 | `user_produto` | Confirmada a remoção com migração de dados na **Fase F**; `nxt_get_user_session_v1` passa a montar `produtos[]` via `entidade_produto` |
| 4 | Gestão de permissões | **Suspensa** — regras via Supabase dashboard/SQL; RLS da tabela: SELECT p/ autenticados, sem policies de escrita |
| 5 | Catálogo de recursos | **Constante no front + seed** (sem tabela `app_recursos`) — catálogo de 4 ilhas / 22 botões documentado em `documentacao/arquitetura/permissoes.md` |
| 6 | Multi-entidade na sessão | **Dívida técnica** — entidade ativa resolvida pelo domínio (host); **seletor de entidade entra na Fase F** para o caso de URL única multi-tenant |
| 7 | Domínios em dev/staging | **Dev:** `localhost` → entidade de teste hardcoded no BFF. **Staging:** não há domínio próprio hoje (Cloudflare Pages sem branch dedicada) — resolver quando surgir |
| 8 | Escopo de produto no seed | No modo compat as regras usam `id_produto IS NULL` (= qualquer produto); preencher `id_produto` específico na **Fase F** (multi-produto) |
| 9 | Seed por entidade vs. global | **Por entidade** já no compat (poucos usuários hoje) — `id_entidade` da entidade ativa, não global; afinar por entidade continua depois |
| 10 | Gate de acesso por produto | Acesso a um produto = **licença da entidade** em `entidade_produto` (sem tabela nova). Valida no `/api/me`: entidade tem o produto do domínio? senão `sem_acesso` (avisa+desloga). Cobre white label (domínio→entidade→produto) e URL única multi-tenant (seletor de entidade). **Fase F**; `user_produto` vira redundante (drop) |

**Dívidas registradas:** seletor de entidade no menu (§11.6) e `ROLES` hardcoded no store (paga na Fase C).
