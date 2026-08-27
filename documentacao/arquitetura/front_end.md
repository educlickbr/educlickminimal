# Arquitetura do Front-End — EduClick

> Stack: **Nuxt 3** + **Tailwind CSS** + **Pinia** + **Phosphor Icons** + **@nuxt/icon**
> Localização: `front_end/`

---

## Sumário

- [1. Stack e Visão Geral](#1-stack-e-visão-geral)
- [2. Estrutura de Diretórios](#2-estrutura-de-diretórios)
- [3. Mapa de Rotas](#3-mapa-de-rotas)
  - [3.1 Páginas Públicas](#31-páginas-públicas)
  - [3.2 Páginas Administrativas (Requer Login)](#32-páginas-administrativas-requer-login)
- [4. Padrão Desacoplado (Pipeline)](#4-padrão-desacoplado-pipeline)
  - [4.1 Regras por Camada](#41-regras-por-camada)
  - [4.2 Organização por Domínio](#42-organização-por-domínio)
- [5. Composables por Domínio](#5-composables-por-domínio)
- [6. Componentes por Domínio](#6-componentes-por-domínio)
- [7. Design System — Contrato Visual](#7-design-system--contrato-visual)
  - [7.1 Paleta de Cores](#71-paleta-de-cores)
  - [7.2 Tipografia](#72-tipografia)
  - [7.3 Botões](#73-botões)
  - [7.4 Cards](#74-cards)
  - [7.5 Layouts](#75-layouts)
  - [7.6 Componentes Reutilizáveis](#76-componentes-reutilizáveis)
  - [7.7 Ícones](#77-ícones)
  - [7.8 Animações](#78-animações)
  - [7.9 Responsividade](#79-responsividade)
  - [7.10 Estrutura de Páginas](#710-estrutura-de-páginas)
  - [7.11 Tabela de Decisões Rápidas](#711-tabela-de-decisões-rápidas)
- [8. Diretrizes de UX](#8-diretrizes-de-ux)
  - [8.1 Campos de Seleção (Dropdowns / Selects)](#81-campos-de-seleção-dropdowns--selects)
  - [8.2 Estrutura e Arredondamento (Border Radius)](#82-estrutura-e-arredondamento-border-radius)
  - [8.3 Cores de Moldura (Borders)](#83-cores-de-moldura-borders)
  - [8.4 Rodapé (Footer)](#84-rodapé-footer)
- [9. Tipos Compartilhados (TypeScript)](#9-tipos-compartilhados-typescript)
  - [9.1 Situação Atual](#91-situação-atual)
  - [9.2 Inventário de Tipos Existentes](#92-inventário-de-tipos-existentes)
  - [9.3 Padrões Identificados](#93-padrões-identificados)
  - [9.4 Recomendação de Centralização](#94-recomendação-de-centralização)
- [10. Histórico de Revisão](#10-histórico-de-revisão)

> **Permissões/controle de sessão:** ver `documentacao/arquitetura/permissoes.md` (modelo de permissões por entidade × papel × produto, catálogo de ilhas/botões, fluxo de sessão por domínio).

---

## 1. Stack e Visão Geral

| Camada | Tecnologia | Localização |
|---|---|---|
| **Framework** | Nuxt 3 | `front_end/` |
| **Estilização** | Tailwind CSS | `app/assets/css/` |
| **Estado** | Pinia (stores) | `app/stores/` |
| **Ícones** | Phosphor Icons via `@nuxt/icon` | — |
| **Autenticação** | Supabase Auth + `@nuxtjs/supabase` | `nuxt.config.ts` |
| **Deploy** | Cloudflare Pages | `front_end/` + `wrangler.toml` |

### Configuração de Autenticação (Supabase)

O módulo `@nuxtjs/supabase` está registrado no `nuxt.config.ts` com:

- **Login**: `/auth/login` (redirecionamento para não autenticados)
- **Callback**: `/confirm` (processa retorno de autenticação)
- **Público**: `/` (página inicial liberada)

### Variáveis de Ambiente (`.env`)

```
SUPABASE_URL=<url_do_projeto>
SUPABASE_KEY=<chave_anon>
```

---

## 2. Estrutura de Diretórios

```
front_end/
├── app/
│   ├── pages/<dominio>/        ← Orquestradores (~40-150 linhas)
│   ├── components/<dominio>/   ← Componentes de UI
│   ├── composables/<dominio>/  ← Toda lógica de negócio
│   ├── layouts/                ← base.vue (sidebar), wide.vue
│   ├── utils/                  ← Funções puras (cpf, date, anoSemestre)
│   ├── stores/                 ← Stores Pinia (app, session)
│   └── assets/css/             ← CSS global, variáveis
│
└── server/api/<dominio>/       ← BFFs *(detalhado no documento servidor_ssr_bff)*
```

---

## 3. Mapa de Rotas

Legenda:

| Ícone | Significado |
|---|---|
| 🔓 | Pública (sem login) |
| 🔒 | Requer autenticação |
| 👑 | Requer admin |
| `base` | Layout com sidebar |
| `wide` | Layout sem sidebar |
| `false` | Sem layout (página standalone) |

### 3.1 Páginas Públicas

| Rota | Layout | Auth | Orquestrador |
|---|---|---|---|
| `/` | `false` | 🔓 | `pages/index.vue` |
| `/oferta` | `false` | 🔓 | `pages/oferta.vue` |
| `/form/:tipo_proc/:tipo_cand/:area_id/:programa_id` | `false` | 🔓 | `pages/form/[tipo_proc]/[tipo_cand].vue` |
| `/form/sucesso` | `false` | 🔓 | `pages/form/sucesso.vue` |
| `/checkout/:slug` | `false` | 🔓 | `pages/checkout/[slug].vue` |
| `/checkout/sucesso` | `false` | 🔓 | `pages/checkout/sucesso.vue` |
| `/cadastro-docente/:token` | `false` | 🔓 | `pages/cadastro-docente/[token].vue` |
| `/trabalhe-conosco` | `false` | 🔓 | `pages/trabalhe-conosco.vue` |
| `/mensagem` | `false` | 🔓 | `pages/mensagem.vue` |
| `/auth/login` | — | 🔓 | `pages/auth/login.vue` |
| `/auth/cadastro` | — | 🔓 | `pages/auth/cadastro.vue` |
| `/auth/recuperar_senha` | — | 🔓 | `pages/auth/recuperar_senha.vue` |
| `/auth/trocar_senha` | — | 🔓 | `pages/auth/trocar_senha.vue` |
| `/teste-layout` | `base` | 🔓 | `pages/teste-layout.vue` |

### 3.2 Páginas Administrativas (Requer Login)

| Rota | Layout | Auth | Orquestrador |
|---|---|---|---|
| `/academico_oferta` | `base` | 🔒 | `pages/academico_oferta/index.vue` |
| `/academico_calendario` | `base` | 🔒 | `pages/academico_calendario/index.vue` |
| `/matriculas` | `base` | 🔒 | `pages/matriculas/index.vue` |
| `/processos` | `base` | 🔒 | `pages/processos/index.vue` |
| `/formularios` | `wide` | 🔒 | `pages/formularios/index.vue` |
| `/meus-cursos` | `base` | 🔒 | `pages/meus-cursos/index.vue` |
| `/meus-processos` | `base` | 🔒 | `pages/meus-processos/index.vue` |
| `/produtos` | `base` | 🔒 | `pages/produtos/index.vue` |
| `/docentes` | `base` | 🔒 | `pages/docentes/index.vue` |
| `/configuracoes/pagamento` | `base` | 🔒 | `pages/configuracoes/pagamento.vue` |
| `/minhas-inscricoes` | — | 🔒 | _(a confirmar)_ |

> **Nota:** O controle de autenticação é feito pelo middleware do Supabase (`@nuxtjs/supabase`), configurado em `nuxt.config.ts` com as rotas de exclusão.

---

## 4. Padrão Desacoplado (Pipeline)

> **Páginas orquestram. Componentes renderizam. Composables contêm lógica. BFFs medeiam. RPCs executam.**

```
Página (orquestrador)
  → Componente (UI)
    → Composable (lógica + estado)
      → BFF (server/api/<dominio>/)
        → RPC Supabase (SECURITY INVOKER)
          → Banco PostgreSQL
```

### 4.1 Regras por Camada

| Camada | O que faz | O que NÃO faz |
|---|---|---|
| `pages/<dominio>/index.vue` | Inicializa sessão, chama composables, monta template | Lógica de negócio, `$fetch` direto |
| `components/<dominio>/` | Renderiza UI, props, emits, `v-model` | `$fetch`, manipular rota |
| `composables/<dominio>/` | Fetch, filtros, paginação, estado reativo | Importar Vue Router |
| `server/api/<dominio>/` | Valida entrada, chama RPC, retorna JSON | Lógica complexa de negócio |
| `supabase/migrations/` | RPCs `SECURITY INVOKER`, RLS | Nunca mexer pelo dashboard |

### 4.2 Organização por Domínio

Cada domínio segue uma estrutura consistente:

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

| Arquivo | Função |
|---|---|
| `cpf.ts` | Validação de CPF |
| `date.ts` | Formatação de datas |
| `anoSemestre.ts` | Lógica de ano/semestre acadêmico |
| `viacep.ts` | Consulta de CEP |
| `EnderecoViaCEP` | Interface de retorno do ViaCEP |

---

## 5. Composables por Domínio

| Domínio | Composables |
|---|---|
| `academico_oferta/` | `useOfertaCore`, `useOfertaAreas`, `useOfertaComponentes`, `useOfertaModulos`, `useOfertaCursos`, `useOfertaCiclos`, `useOfertaProgramas`, `useProgramaForm` |
| `matriculas/` | `useMatriculasCore`, `useMatriculas` |
| `processos/` | `useProcessosCore`, `useProcessos` |
| `formularios/` | `useFormulariosCore`, `useFormulariosPerguntas` |
| `calendario/` | `useCalendarioCore`, `useCalendarioFeriados`, `useCalendarioEventos`, `useCalendarioCalendario` |
| `meus-processos/` | `useMeusProcessos` |
| `docentes/` | *(em desenvolvimento)* |
| `checkout/` | `useCheckout` |
| `produtos/` | `useProdutosCore`, `useProdutosActions` |
| `auth/` | _(via Supabase)_ |
| `configuracao-gateway/` | `useConfigGateway` |
| **Raiz** | `useCargaHoraria`, `useFavicon`, `useLandingTenant`, `useToast` |

---

## 6. Componentes por Domínio

| Domínio | Componentes |
|---|---|
| `academico_oferta/` | `OfertaTabAreas`, `OfertaTabComponentes`, `OfertaTabModulos`, `OfertaTabCursos`, `OfertaTabCiclos`, `OfertaTabProgramas`, `ModalArea`, `ModalComponente`, `ModalModulo`, `ModalCurso`, `ModalCiclo`, `ModalPrograma`, `programa/ProgramaStep*` |
| `matriculas/` | `MatriculasList`, `MatriculasModalDetalhes` |
| `processos/` | `ProcessosTabInscritos`, `ProcessosModalDetalhes`, `ProcessosModalAvaliar` |
| `form/` | _(form steps)_ |
| `formularios/` | *(em desenvolvimento)* |
| `calendario/` | *(em desenvolvimento)* |
| `docentes/` | `ModalAvaliarCandidato` |
| `checkout/` | `CheckoutResumo` |
| `produtos/` | `ProdutosTabLista`, `ModalProduto`, `ModalOferta` |
| `auth/` | _(form-based)_ |
| `configuracoes/` | `ConfigGatewayStatus` |
| `global/` | Componentes reutilizáveis (UI atoms) |
| `landing/` | Componentes da landing page |

---

## 7. Design System — Contrato Visual

> **Este documento contém os tokens fundacionais (cores, tipografia, campos).  
> O contrato visual completo e atualizado — incluindo cards premium, accent bars, hierarquia de aninhamento, badges e modais — está em:**  
> **`documentacao/arquitetura/design_system.md`**

### 7.1 Paleta de Cores

| Cor | Variável CSS | Valor | Uso |
|---|---|---|---|
| **Background** | `--color-background` | `#0a0a0c` | Fundo principal das páginas |
| **Surface** | (inline) | `#0f0f17` | Cards, headers, containers |
| **Surface 2** | `--color-secondary-surface` | `rgba(140,135,141,0.09)` | Cards secundários |
| **Surface Hover** | `--color-secondary-surface-hover` | `rgba(140,135,141,0.18)` | Hover de cards |
| **Primary** | `--color-primary` | `#8b5cf6` | Ações principais, links ativos, badges |
| **Primary Hover** | `--color-primary-hover` | `#7c3aed` | Hover de botões primários |
| **Primary RGB** | `--color-primary-rgb` | `139, 92, 246` | Para usar com opacity (`rgba()`) |
| **Secondary** | `--color-secondary` | `#8c878d` | Texto secundário, labels inativos |
| **Secondary Hover** | `--color-secondary-hover` | `#585458` | Hover de elementos secundários |
| **Danger** | `--color-danger` | `#E7333F` | Erros, deleção, ações destrutivas |
| **Success** | `--color-success` | `#95C11E` | Confirmação, sucesso |
| **Warning** | `--color-warning` | `#FFD753` | Avisos, "já inscrito", atenção |
| **Texto** | `--color-text` | `#e8e6e8` | Cor do texto principal |
| **Texto opaco** | — | `rgba(255,255,255,0.4 a 0.6)` | Subtítulo, metadados |

#### Field Tokens (inputs, selects, textareas)

| Token | Valor | Descrição |
|---|---|---|
| `--field-bg` | `rgba(255,255,255,0.04)` | Fundo do campo |
| `--field-bg-select` | `#16161e` | Fundo opaco para `<select>` |
| `--field-bg-hover` | `rgba(139,92,246,0.08)` | Hover do campo |
| `--field-border` | `rgba(255,255,255,0.07)` | Borda padrão |
| `--field-border-focus` | `rgba(139,92,246,0.45)` | Borda em foco |
| `--field-text` | `rgba(232,230,240,0.9)` | Texto do campo |
| `--field-placeholder` | `rgba(255,255,255,0.22)` | Placeholder |
| `--field-shadow-focus` | `0 0 0 3px rgba(139,92,246,0.10)` | Glow de foco |

### 7.2 Tipografia

#### Fontes
- **Sans-serif (Tailwind)**: `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif`
- **Sans-serif (CSS)**: `Roboto, system-ui, Avenir, Helvetica, Arial, sans-serif`

#### Escala de Tamanhos

| Classe | px | Uso típico |
|---|---|---|
| `text-[8px]` | 8px | Micro labels, badges |
| `text-[9px]` | 9px | Labels de campos, badges |
| `text-[10px]` | 10px | Labels, metadados, tabs inativas |
| `text-[11px]` | 11px | Nomes de arquivo, textos auxiliares |
| `text-xs` | 12px | Corpo pequeno, botões, cards info |
| `text-sm` | 14px | Corpo de texto, parágrafos |
| `text-lg` | 18px | Subtítulos |
| `text-xl` | 20px | Títulos |
| `text-2xl` | 24px | Títulos de seção |
| `text-4xl` | 36px | Hero (páginas públicas) |

#### Pesos
- `font-bold` (700) — a maioria dos textos
- `font-black` (900) — títulos, labels, botões, badges
- `font-medium` (500) — texto de corpo alternativo
- `font-semibold` (600) — labels do builder

#### Estilo Padrão de Labels

```css
font-size: 10px;  /* ou 9px */
font-weight: 900; /* black */
text-transform: uppercase;
letter-spacing: 0.05em a 0.2em;
color: rgba(140,135,141, 0.4 a 0.6); /* secondary */
```

### 7.3 Botões

#### 7.3.1 Botão Primário

```html
class="px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
```

- Uso: "Acessar", "Salvar", próximo passo
- Alternativa com gradiente: `bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6]`

#### 7.3.2 Botão Secundário (Outline)

```html
class="px-8 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
```

- Uso: "Voltar", "Anterior", "Cancelar"

#### 7.3.3 Botão de Sucesso

```html
class="px-8 py-3 rounded-xl bg-green-500 text-white text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
```

- Uso: "Finalizar Inscrição", "Confirmar"

#### 7.3.4 Botão de Perigo

```html
class="px-2 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white transition-colors"
```

- Uso: Remover arquivo, excluir (ações destrutivas)

#### 7.3.5 Botão "Já Inscrito" (Disabled)

```html
class="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-default"
```

#### 7.3.6 Botão de Tab (Ativo / Inativo)

```html
<!-- Ativo -->
class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30"

<!-- Inativo -->
class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/[0.02] text-secondary/40 border border-white/5 hover:text-white hover:border-white/10"
```

#### 7.3.7 Botão de Filtro (Ativo / Inativo)

```html
<!-- Ativo -->
class="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20"

<!-- Inativo -->
class="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-secondary hover:text-white"
```

#### 7.3.8 Botão "Navegação" (Tab horizontal)

```html
class="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
```

### 7.4 Cards

#### 7.4.1 Card de Programa (Oferta pública)

```html
class="group relative bg-[#0f0f17] border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:translate-y-[-4px] shadow-xl hover:shadow-primary/5 flex flex-col"
```

- **Accent bar**: `h-1 bg-gradient-to-r from-primary to-purple-500 opacity-30 group-hover:opacity-100`
- **Padding**: `p-8` (corpo), `p-6 bg-white/[0.02] border-t border-white/5` (footer)
- **Badge de área**: `px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest`
- **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`

#### 7.4.2 Card Interno (Admin)

```html
class="bg-white/[0.025] border border-white/5 p-3 rounded-xl hover:border-primary/30 hover:translate-x-[2px]"
```

- Accent lateral: 3px solid primary, opacity 0 → 1 on hover

#### 7.4.3 Card de Seção (Layout base)

```html
class="bg-[var(--color-secondary-surface)] rounded-xl p-6 border border-white/5"
```

### 7.5 Layouts

#### Layout Público (`layout: false`)

```html
<div class="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-primary/30">
  <header class="sticky top-0 z-50 bg-[#0f0f17]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
    <!-- Logo: Icon ph:graduation-cap-fill + "EduClick" + subtitle -->
  </header>
  <!-- Hero com glows decorativos -->
  <main>
    <!-- max-w-7xl mx-auto px-6 pb-20 -->
  </main>
  <footer class="border-t border-white/5">
    <!-- text-[9px] uppercase tracking-widest text-white/20 -->
  </footer>
</div>
```

#### Layout Base (Admin autenticado)

```html
<div class="h-screen bg-background flex flex-col md:flex-row gap-4 p-2 md:p-5 overflow-hidden">
  <!-- Sidebar (opcional): w-full md:w-[320px] lg:w-[380px] bg-div-15 rounded-xl border border-white/5 p-5 -->
  <main class="flex-1 flex flex-col gap-4 h-full overflow-hidden relative">
    <header class="bg-transparent md:bg-div-15 px-2 py-1 md:px-4 md:py-3 rounded-xl border-0 md:border border-white/5"></header>
    <div class="flex-1 overflow-y-auto rounded-xl custom-scrollbar"></div>
    <footer class="text-[9px] uppercase tracking-widest text-white/20 border-t border-white/5"></footer>
  </main>
</div>
```

#### Layout Wide (Admin sem sidebar)

Igual ao base mas sem `<aside>`.

### 7.6 Componentes Reutilizáveis

#### Modal

- **Overlay**: `fixed inset-0 z-50 bg-[rgba(0,0,0,0.85)]` com `fadeIn 0.15s`
- **Panel**: `#13131a` bg, `rounded-2xl`, `border-primary/18`, box-shadow elevado, `slideUp 0.2s`
- **Accent bar**: 3-4px gradient ou cor sólida (danger/warning/info)
- **Header**: ícone (40x40, bg primary/12, rounded-xl) + título uppercase tracking-widest + close btn
- **Body**: padding 24-32px
- **Footer**: `flex justify-end gap-2.5 p-4` com `border-t white/6`

#### Empty State

```html
class="text-center py-20 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl"
```

- Ícone: 64px+, cor `text-secondary/20`
- Texto: `text-secondary font-bold`

#### Loading Skeleton

```html
class="bg-white/5 animate-pulse rounded-xl border border-white/5"
```

#### Spinner

```html
class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
```

#### Toast (useToast composable)

- Posição: `fixed top-20px right-20px`
- Cores: error `#ef4444`, success `#10b981`, info `#111827`
- Transição: fadeIn + slideDown 180ms

#### LoadingOverlay (Global)

- Full screen com bg `var(--color-background)`
- Spinner animado com múltiplos rings + pulse core
- Brand text + bouncing dots

### 7.7 Ícones

Todos os ícones usam **Phosphor Icons** via `@nuxt/icon`:

```html
<Icon name="ph:nome-do-icone" class="w-* h-*" />
```

| Ícone | Uso |
|---|---|
| `ph:graduation-cap-fill` | Logo EduClick |
| `ph:form-bold` | Formulário |
| `ph:clock-bold` | Carga horária |
| `ph:user-plus-bold` | Matrículas |
| `ph:seal-check-bold` | Já inscrito / Confirmado |
| `ph:file-light` | Upload de arquivo |
| `ph:camera-light` | Upload de foto |
| `ph:trash-light` | Remover arquivo |
| `ph:arrow-square-out-bold` | Visualizar arquivo |
| `ph:sign-out-bold` | Logout |
| `ph:folder-open-light` | Empty state |
| `ph:seal-warning-light` | Erro / vazio |
| `ph:question-bold` | Pergunta |
| `ph:x-bold` ou `×` | Fechar modal |

### 7.8 Animações

| Animação | Onde usar |
|---|---|
| `hover:translate-y-[-4px]` | Card hover (elevação) |
| `hover:translate-x-[2px]` | Card item hover (deslize) |
| `hover:opacity-100` | Accent bar hover |
| `animate-spin` | Spinner loading |
| `animate-pulse` | Skeleton loading |
| `animate-bounce` | Badge "Inscrições Abertas" |
| `animate-bounce-in` | Check de sucesso |
| `animate-draw-check` | SVG check path |

### 7.9 Responsividade

| Breakpoint | Comportamento |
|---|---|
| `md:` (768px) | Grid 2 colunas, header com borda, sidebar aparece |
| `lg:` (1024px) | Grid 3 colunas, sidebar larga (380px) |
| Padrão (mobile) | 1 coluna, header sem borda, sem sidebar |

### 7.10 Estrutura de Páginas

#### Página Pública (`layout: false`)

```
min-h-screen bg-[#0a0a0c]
  └── header (sticky, backdrop-blur)
  └── hero (opcional: glows + título)
  └── main (max-w-7xl mx-auto px-6 pb-20)
  └── footer (border-t white/5)
```

#### Página Admin (`layout: "base"` ou `"wide"`)

```
page-wrap (p-4 md:p-5)
  └── page-top-row (flex justify-between mb-8)
  │     └── tabs-nav (bg-white/2 rounded-xl p-1)
  │     └── add-btn (opcional)
  └── conteúdo
```

#### Página Admin com Tabs Dinâmicas (`layout: "base"`)

```
page-wrap
  └── page-top-row (título + metadados)
  └── tabs-bar (overflow-x-auto) → tabs-nav com botões via v-for
  │     └── tab-btn com tab-badge (contagem por área)
  └── conteúdo (placeholder enquanto parcial)
```

### 7.11 Tabela de Decisões Rápidas

| Situação | Classe / Padrão |
|---|---|
| Fundo da página | `bg-[#0a0a0c]` |
| Container de conteúdo | `max-w-5xl mx-auto px-6` |
| Card container | `bg-[#0f0f17] rounded-xl border border-white/5` |
| Título de seção | `text-2xl font-black mb-8 tracking-tight` |
| Label de campo | `text-[10px] font-black uppercase tracking-widest text-secondary/60` |
| Placeholder de upload | `rounded-xl border border-white/10 bg-white/[0.03] p-3 cursor-pointer hover:border-primary/30 hover:bg-white/[0.06]` |
| Ícone decorativo | `Icon name="ph:*" class="w-* h-* text-*"` |
| Avatar/ícone container | `w-* h-* rounded-* bg-primary/10 text-primary flex items-center justify-center` |
| Divisor | `border-t border-white/5` |
| Badge informacional | `px-* py-* rounded-lg bg-*/10 border border-*/20 text-[9px] font-black uppercase tracking-widest` |
| Gradiente de texto | `text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400` |
| Glow decorativo | `absolute bg-primary/10 blur-[120px] rounded-full` |

---

## 8. Diretrizes de UX

### 8.1 Campos de Seleção (Dropdowns / Selects)

É estritamente proibido o uso de `<select>` com o visual nativo do sistema operacional.

#### O Problema

Por padrão, ao usar estilização via CSS em `<select>`, o navegador (especialmente no Windows/Chrome) injeta uma seta padrão no canto direito do input. Além disso, se a propriedade for definida como `background: var(--cor)`, o navegador sobrescreve a seta injetada pelo Tailwind Forms.

#### O Padrão (Solução)

1. **Appearance anulado**: `appearance: none` + equivalentes `-webkit` e `-moz`.
2. **Uso de `background-color` ao invés de `background`**: Garantir que `background-image` sobreviva.
3. **Seta Customizada**: Injetar o ícone chevron via SVG/CSS, na cor tema `#8b5cf6`, posicionado a `1rem` da margem direita.
4. **Respiro do Texto**: `padding-right: 2.5rem` para evitar texto esmagado atrás da seta.

#### Implementação CSS Obrigatória

```css
select {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-color: var(--field-bg) !important;
  border-color: var(--field-border) !important;
  color: var(--field-text) !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
  background-position: right 1rem center !important;
  background-repeat: no-repeat !important;
  background-size: 1.2em 1.2em !important;
  padding-right: 2.5rem !important;
}

select:hover {
  background-color: var(--field-bg-hover) !important;
}

select:focus {
  border-color: var(--field-border-focus) !important;
  box-shadow: var(--field-shadow-focus) !important;
  outline: none !important;
}

select option {
  background: var(--field-bg-option) !important;
  color: var(--field-text) !important;
}
```

### 8.2 Estrutura e Arredondamento (Border Radius)

Para manter a fluidez visual e o aspecto *premium*:

- **Layout Principal (Header, Content, Sidebar)**: `rounded-xl` (12px)
- **Abas de Navegação (Pills)**: Container externo 12px, botões internos 9-10px (encaixe concêntrico)
- **Cards de Repetidores (Listagens)**: `border-radius: 12px`
- **Modais**: `rounded-2xl` (16px) para destaque de sobreposição

> [!TIP]
> Use sempre o valor de `12px` (`rounded-xl` no Tailwind) como base para os elementos estruturais.

> [!IMPORTANT]
> Nunca misture `rounded-lg` (8px) com `rounded-xl` (12px) no mesmo plano visual de containers grandes.

### 8.3 Cores de Moldura (Borders)

Evitar visual pesado usando tons de branco/cinza com baixa opacidade:

- **Padrão**: `rgba(255, 255, 255, 0.05)` a `rgba(255, 255, 255, 0.07)`
- **Tailwind Alias**: `border-white/5` (containers grandes), `border-white/10` (hover/foco)

### 8.4 Rodapé (Footer)

- **Linha Divisora**: `border-t border-white/5`
- **Texto (Copyright/Versão)**: `text-white/20`, negrito, `text-[9px]`, `uppercase`, `tracking-widest`

---

## 9. Tipos Compartilhados (TypeScript)

### 9.1 Situação Atual

O projeto **não tem** uma pasta `types/` dedicada. Os tipos estão espalhados pelos composables, cada um definindo suas próprias interfaces localmente.

```
composables/ → cada um com seus exports de interface
stores/      → sem tipos exportados
utils/       → EnderecoViaCEP
```

### 9.2 Inventário de Tipos Existentes

#### `app/utils/viacep.ts`

```typescript
export interface EnderecoViaCEP {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  cep: string
  erro?: boolean
}
```

#### `app/composables/academico_oferta/useOfertaAreas.ts`

```typescript
export interface Area {
  id: string
  nome_area: string
  descricao?: string | null
  id_entidade: string
  criado_em: string
}
```

#### `app/composables/academico_oferta/useOfertaComponentes.ts`

```typescript
export interface Componente {
  id: string
  id_entidade: string
  nome_componente: string
  descricao?: string | null
  criado_por?: string
  criado_em: string
  modificado_em: string
}
```

#### `app/composables/form/useFormInscricao.ts`

```typescript
export interface InscricaoData {
  id: string
  id_usuario: string
  id_programa: string
  id_processo: string
  status_dados: string
  status_documentacao: string
  status_candidatura: string
  tipo_processo: string
  tipo_candidatura: string
  criado_em: string
}
```

#### `app/composables/form/useFormMatricula.ts`

```typescript
export interface MatriculaData {
  id: string
  id_programa: string
  id_usuario: string
  id_pedido: string | null
  criado_em: string
}
```

#### `app/composables/formularios/useFormulariosPerguntas.ts`

```typescript
export interface Pergunta {
  id: string
  id_entidade: string | null
  nome_interno: string
  label: string
  placeholder: string
  tipo_pergunta: string
  opcoes: any
  global: boolean
  created_at: string
}
```

#### Docentes — tipo retornado por composable

```typescript
export type UseDocentesListaReturn = ReturnType<typeof useDocentesLista>;
export type UseDocentesEditaisReturn = ReturnType<typeof useDocentesEditais>;
export type UseDocentesCurriculosReturn = ReturnType<typeof useDocentesCurriculos>;
export type UseDocentesSelecaoReturn = ReturnType<typeof useDocentesSelecao>;
```

### 9.3 Padrões Identificados

| Padrão | Descrição | Prós | Contras |
|---|---|---|---|
| **Interface inline no composable** | Tipo exportado dentro do próprio composable | Coeso, perto de quem usa | Duplicado se mais de um domínio usa a mesma entidade |
| **ReturnType (docentes)** | Tipo inferido do retorno do composable | Sem declaração manual | Apenas para uso local |

### 9.4 Recomendação de Centralização

#### Criar `front_end/types/` para tipos compartilhados entre domínios

```
front_end/types/
├── aca.d.ts          ← Tipos do módulo acadêmico (Area, Componente, Modulo, Curso, Ciclo, Programa)
├── user.d.ts         ← Tipos de usuário (UserExpandido, Entidade, Produto)
├── form.d.ts         ← Tipos de formulário (Pergunta, Resposta, InscricaoData)
├── com.d.ts          ← Tipos comerciais (Pedido, Produto, Assinatura)
└── api.d.ts          ← Tipos de resposta de API (PaginatedResponse<T>, ApiResponse<T>)
```

#### Tipos genéricos de API (úteis em todo BFF)

```typescript
// types/api.d.ts
export interface PaginatedResponse<T> {
  itens: T[]
  total: number
  pagina: number
  limite: number
}

export interface ApiResponse<T = null> {
  success: boolean
  message?: string
  data?: T
}
```

#### Tipos que já poderiam ser compartilhados

| Tipo | Usado em | Candidato a |
|---|---|---|
| `Area` | `academico_oferta`, `processos`, `matriculas` | `types/aca.d.ts` |
| `Pergunta` | `formularios`, `form` | `types/form.d.ts` |

> `Area` é o caso mais claro: a mesma interface aparece em múltiplos domínios (oferta, processos, matrículas) e hoje é redeclarada em cada composable.

#### Quando manter inline

- Tipos **exclusivos** de um único composable (ex: `InscricaoData` só existe em `useFormInscricao`)
- Tipos inferidos via `ReturnType`

#### Exemplo de como ficaria

```typescript
// types/aca.d.ts — Tipos acadêmicos compartilhados
export interface Area {
  id: string
  nome_area: string
  descricao?: string | null
  id_entidade: string
  criado_em: string
}

export interface Componente {
  id: string
  id_entidade: string
  nome_componente: string
  descricao?: string | null
}

export interface Modulo {
  id: string
  id_entidade: string
  nome_modulo: string
  // ...
}
```

```typescript
// composables/academico_oferta/useOfertaAreas.ts — agora importa o tipo
import type { Area } from "~/types/aca";

// ... usar Area diretamente, sem redeclarar
```

#### Próximos passos

1. Garantir que o `tsconfig.json` inclua `~/types/*` (já deve estar configurado pelo Nuxt)
2. Migrar tipos que já são usados em mais de um lugar (`Area` é o candidato #1)
3. Adotar `PaginatedResponse<T>` e `ApiResponse<T>` como padrão nos BFFs

---

## 10. Histórico de Revisão

| Data | Descrição |
|---|---|
| 2026-08-21 | Criado `documentacao/arquitetura/permissoes.md` (permissões por entidade × papel, catálogo de recursos, fluxo de sessão) e feito o plano de multientidade para a Fase A |
| 2026-07-24 | Criado `documentacao/arquitetura/design_system.md` como referência canônica do Design System premium (cards, accent bars, pills, filtros, modais, hierarquia de aninhamento) |
| 2026-07-23 | Consolidação dos documentos: `UX_DESIGN.md`, `contrato-visual.md`, `rotas.md`, `tipos.md` em documento único de arquitetura front-end |

---

_Consolidado a partir de: `UX_DESIGN/UX_DESIGN.md`, `design-system/contrato-visual.md`, `rotas.md`, `tipos.md`_
