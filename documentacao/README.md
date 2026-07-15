# 📚 EduClick — Documentação

> Porta de entrada para toda a documentação do projeto.
> Stack: **Nuxt 3** → **Supabase** → **Cloudflare Pages + R2 + Workers** → **Edge Functions**

---

## 🧭 O que é o EduClick

Plataforma de gestão educacional multi-entidade e multi-produto.
Módulo acadêmico (cursos, matrículas, calendário, processos seletivos) com pipeline de matrícula e pagamentos.

---

## 🏗️ Stack

| Camada | Tecnologia | Localização |
|---|---|---|
| **Front-end** | Nuxt 3 + Tailwind CSS + Pinia + Phosphor Icons | `front_end/app/` |
| **BFFs (APIs)** | Nuxt Server Engine (`/server/api`) | `front_end/server/api/` |
| **Banco de dados** | PostgreSQL (via Supabase) | `supabase/migrations/` |
| **Autenticação** | Supabase Auth + JWT custom claims | Supabase config |
| **File storage** | Cloudflare R2 | `workers/` |
| **Proxy / signed URLs** | Cloudflare Workers | `workers/src/` |
| **Webhooks / bg tasks** | Supabase Edge Functions | `supabase/functions/` |
| **Deploy** | Cloudflare Pages | `front_end/` + `wrangler.toml` |

---

## 📂 Estrutura do Monorepo

```
educlickminimal/
├── front_end/                  ← Aplicação Nuxt 3
│   ├── app/
│   │   ├── pages/<dominio>/    ← Orquestradores (~40-150 linhas)
│   │   ├── components/<dominio>/ ← Componentes de UI
│   │   ├── composables/<dominio>/ ← Toda lógica de negócio
│   │   ├── layouts/            ← base.vue (sidebar), wide.vue
│   │   ├── utils/              ← Funções puras (cpf, date, anoSemestre)
│   │   └── assets/css/         ← CSS global, variáveis
│   └── server/api/<dominio>/   ← BFFs
│
├── supabase/
│   ├── migrations/             ← SQL versionado (RPCs SECURITY INVOKER)
│   └── functions/              ← Edge Functions (stripe-webhook)
│
├── workers/                    ← Cloudflare Workers (proxy R2)
│
├── _refererencia/              ← Assets externos, PDFs, exemplos
├── _agents/                    ← Workflows para IA
├── .zed/                       ← Configuração do Zed
│
└── documentacao/               ← ← VOCÊ ESTÁ AQUI
    ├── paginas/                ← Documentação página a página
    ├── guias/                  ← Padrões arquiteturais
    ├── design-system/          ← Contrato visual
    ├── planos/                 ← Planos de implementação
    ├── UX_DESIGN/              ← Diretrizes de UX
    └── prompts/                ← Prompts para IA
```

---

## 🧩 O Padrão Desacoplado (Regra de Ouro)

> **Páginas orquestram. Componentes renderizam. Composables contêm lógica. BFFs medeiam. RPCs executam.**

### Pipeline

```
Página (orquestrador)
  → Componente (UI)
    → Composable (lógica + estado)
      → BFF (server/api/<dominio>/)
        → RPC Supabase (SECURITY INVOKER)
          → Banco PostgreSQL
```

### Regras por camada

| Camada | O que faz | O que NÃO faz |
|---|---|---|
| `pages/<dominio>/index.vue` | Inicializa sessão, chama composables, monta template | Lógica de negócio, `$fetch` direto |
| `components/<dominio>/` | Renderiza UI, props, emits, `v-model` | `$fetch`, manipular rota |
| `composables/<dominio>/` | Fetch, filtros, paginação, estado reativo | Importar Vue Router |
| `server/api/<dominio>/` | Valida entrada, chama RPC, retorna JSON | Lógica complexa de negócio |
| `supabase/migrations/` | RPCs `SECURITY INVOKER`, RLS | Nunca mexer pelo dashboard |

### Organização por domínio

```
pages/matriculas/index.vue
components/matriculas/MatriculasList.vue
components/matriculas/MatriculasModalDetalhes.vue
composables/matriculas/useMatriculasCore.ts    ← dados fixos (áreas, tabs)
composables/matriculas/useMatriculas.ts        ← dados dinâmicos (lista, filtros)
server/api/matriculas/index.get.ts
server/api/matriculas/lista.get.ts
server/api/matriculas/detalhes.get.ts
server/api/matriculas/inativar.post.ts
```

Cada domínio tem **2 composables mínimos**:
- `use<Nome>Core.ts` — dados "fixos" (áreas, tabs, fallbacks)
- `use<Nome>.ts` — dados dinâmicos (listas, filtros, paginação)

### Utils (raiz de `app/utils/`)
Funções **puras e testáveis**, sem estado:
- `cpf.ts` — validação de CPF
- `date.ts` — formatação de datas
- `anoSemestre.ts` — lógica de ano/semestre acadêmico
- `viacep.ts` — consulta de CEP

---

## 🔗 Mapa da Documentação

### Por página

| Rota | Documentação |
|---|---|
| `/` (landing page) | [`paginas/landing_page/`](paginas/landing_page/) |
| `/academico_oferta` | [`paginas/academico_oferta.md`](paginas/academico_oferta.md) |
| `/academico_calendario` | [`paginas/academico_calendario.md`](paginas/academico_calendario.md) |
| `/matriculas` | [`paginas/matriculas.md`](paginas/matriculas.md) |
| `/processos` | [`paginas/processos.md`](paginas/processos.md) |
| `/formularios` | [`paginas/formularios.md`](paginas/formularios.md) |
| `/form/*` (público) | [`paginas/form.md`](paginas/form.md) |
| `/meus-cursos` | [`paginas/meus-cursos.md`](paginas/meus-cursos.md) |
| `/meus-processos` | [`paginas/meus-processos.md`](paginas/meus-processos.md) |
| `/produtos` | [`paginas/produtos.md`](paginas/produtos.md) |
| `/oferta` (público) | [`paginas/oferta.md`](paginas/oferta.md) |
| `/minhas-inscricoes` | [`paginas/minhas-inscricoes.md`](paginas/minhas-inscricoes.md) |
| Integração Stripe | [`paginas/integracao_stripe.md`](paginas/integracao_stripe.md) |

### Guias e padrões

| Documento | Conteúdo |
|---|---|
| [`rotas.md`](rotas.md) | **Mapa completo de rotas** com layout, auth, orquestradores e docs |
| [`guias/guia_refatoracao_desacoplamento.md`](guias/guia_refatoracao_desacoplamento.md) | Padrão completo de desacoplamento |
| [`design-system/contrato-visual.md`](design-system/contrato-visual.md) | Paleta, tipografia, botões, cards, modais |
| [`UX_DESIGN/UX_DESIGN.md`](UX_DESIGN/UX_DESIGN.md) | Diretrizes de UX |
| [`arquitetura_sistema.md`](arquitetura_sistema.md) | Arquitetura multi-entidade e sessão |
| [`modelos_dados_atualizados.md`](modelos_dados_atualizados.md) | Modelos de dados pós-refactoring |
| [`tipos.md`](tipos.md) | Inventário de tipos TypeScript e recomendações |

### Planos em andamento

| Documento | Escopo |
|---|---|
| [`planos/plano-calendario-salas.md`](planos/plano-calendario-salas.md) | Calendário com salas |
| [`planos/plano-camada-comercial.md`](planos/plano-camada-comercial.md) | Camada comercial |
| [`planos/plano-gestao-docentes.md`](planos/plano-gestao-docentes.md) | Gestão de docentes |
| [`planos/plano-pagina-matriculas.md`](planos/plano-pagina-matriculas.md) | Evolução de matrículas |
| [`planos/modo_subscription_o_que_falta.md`](planos/modo_subscription_o_que_falta.md) | Subscription |

### Operacional

| Documento | Conteúdo |
|---|---|
| [`NUXT_SETUP_COMMANDS.md`](NUXT_SETUP_COMMANDS.md) | Setup do zero de um projeto Nuxt |
| [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) | Login, link e pull do Supabase |
| [`SUPABASE_WORKFLOW.md`](SUPABASE_WORKFLOW.md) | Fluxo de migrations pelo CLI |

---

## 🚀 Fluxo de Desenvolvimento (novo domínio)

```
1. Banco  → npx supabase migration new descricao
            (se precisar de novas RPCs/tabelas)

2. BFF   → server/api/<dominio>/<nome>.<method>.ts
            (valida entrada, chama RPC, retorna JSON)

3. Composable → app/composables/<dominio>/use<Nome>.ts
                 (toda lógica de estado e fetch)

4. Componente → app/components/<dominio>/<Nome>.vue
                 (renderiza UI, props/ctx, emits)

5. Página → app/pages/<dominio>/index.vue
             (orquestrador fino, ~40-150 linhas)
```

---

## 📐 Convenções Rápidas

### Visual
- Tema escuro: fundo `#0a0a0c`, surface `#0f0f17`
- Cor primária: `#8b5cf6` (violeta), Primary hover: `#7c3aed`
- Ícones: Phosphor via `<Icon name="ph:*">`
- Modal overlay: `rgba(0,0,0,0.85)`, **sem** `backdrop-blur`
- Container completo em [`design-system/contrato-visual.md`](design-system/contrato-visual.md)

### Banco de dados
- **Toda** RPC: `SECURITY INVOKER` (exceção: hooks de auth)
- Segurança via **RLS** nas tabelas, não na função
- Migrations com timestamp: `YYYYMMDDHHMMSS_descricao.sql`
- Padrão completo em [`_agents/workflows/padrao_rpc_supabase.md`](/_agents/workflows/padrao_rpc_supabase.md)

---

_Atualizado em: 2026-07-15_
