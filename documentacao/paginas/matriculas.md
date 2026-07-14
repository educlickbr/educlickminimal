# Página Matrículas (`/matriculas`)

## Visão Geral

Tela **administrativa** para gestão de matrículas de alunos nos programas acadêmicos:

- **Abas dinâmicas por Área** — carregadas via RPC, com filtro por área acadêmica
- **Cards de alunos matriculados** — foto (ou avatar), nome, email, programa, turma, badges de status
- **Filtros** — ano/semestre (algarismos romanos), turma (client-side), status (ativa/inativa/cancelada), busca por nome/email
- **Paginação** — 20 itens por página, scroll interno, paginação fixa no rodapé
- **Modal de Detalhes** — exibe as respostas do formulário de matrícula preenchido pelo aluno, com abas por bloco e arquivos/fotos
- **Modal de Inativação** — confirmação para inativar matrícula, com atualização reativa instantânea do badge no card

**Rota:** `/matriculas` | **Layout:** `base` | **Orquestrador:** `pages/matriculas/index.vue` (~150 linhas)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/matriculas/index.vue                           ← orquestrador (~150 linhas)
app/components/matriculas/
├── MatriculasList.vue                                     ← tabs + filtros + cards + paginação
└── MatriculasModalDetalhes.vue                            ← formulário preenchido em modo leitura
app/composables/matriculas/
├── useMatriculasCore.ts                                   ← áreas, tabs, fallback de entidade
└── useMatriculas.ts                                       ← fetch matrículas, filtros, paginação, fotos
server/api/matriculas/
├── index.get.ts                                           ← GET áreas (RPC aca_get_areas_para_processos)
├── lista.get.ts                                           ← GET matrículas paginadas
├── detalhes.get.ts                                        ← GET dados completos para modal
├── inativar.post.ts                                       ← POST inativar matrícula
└── turmas.get.ts                                          ← GET turmas para dropdown (opcional)
supabase/migrations/
├── 20260713000001_add_status_to_aca_matricula.sql         ← ADD COLUMN status
├── 20260713000002_rpc_aca_get_matriculas_filtradas.sql    ← RPC listagem paginada
├── 20260713000003_rpc_aca_inativar_matricula.sql          ← RPC de inativar
├── 20260713000004_rpc_aca_get_turmas_para_matriculas.sql  ← RPC turmas para dropdown
└── 20260713000005_fix_rpc_aca_get_matriculas_filtradas.sql ← fix ORDER BY
```

### Estrutura de diretórios

```
front_end/app/
├── pages/matriculas/index.vue
├── components/matriculas/
│   ├── MatriculasList.vue
│   └── MatriculasModalDetalhes.vue
├── composables/matriculas/
│   ├── useMatriculasCore.ts
│   └── useMatriculas.ts

server/api/matriculas/
├── index.get.ts
├── lista.get.ts
├── detalhes.get.ts
├── inativar.post.ts
└── turmas.get.ts

supabase/migrations/
├── 20260713000001_add_status_to_aca_matricula.sql
├── 20260713000002_rpc_aca_get_matriculas_filtradas.sql
├── 20260713000003_rpc_aca_inativar_matricula.sql
├── 20260713000004_rpc_aca_get_turmas_para_matriculas.sql
└── 20260713000005_fix_rpc_aca_get_matriculas_filtradas.sql
```

---

## Fluxo de Dados

### Áreas (abas dinâmicas)
```
GET /api/matriculas?id_entidade=X
  → RPC aca_get_areas_para_processos(p_id_entidade)
    → aca_area LEFT JOIN aca_programa LEFT JOIN aca_processo_seletivo
    → retorna { id, nome_area, qtd_processos_ativos }
```
> Reusa a mesma RPC da página de Processos Seletivos.

### Matrículas (cards + paginação)
```
GET /api/matriculas/lista?id_entidade=X&pagina=1&limite=20&id_area=Y&ano_semestre=26Is&status=ativa&busca=Z
  → RPC aca_get_matriculas_filtradas(p_id_entidade, p_id_area, p_ano_semestre, p_id_turma, p_busca, p_status, p_pagina, p_limite)
    → aca_matricula
      JOIN user_expandido (nome, email)
      JOIN aca_programa (descricao)
      LEFT JOIN aca_area (nome_area)
      LEFT JOIN com_pedido (valor_pago_centavos)
      LEFT JOIN aca_resposta_form (pergunta "sua_foto" → id_arquivo)
      LEFT JOIN aca_ciclo_programa + aca_ciclo (turma, ano_semestre)
    → retorna { itens[], total, pagina, limite }
```

### Fotos (signed URLs)
```
Para cada matrícula com id_foto:
  GET /api/r2/sign?id=ID_ARQUIVO
    → global_arquivos (path)
    → HMAC SHA-256 + worker_url → signedUrl
```

### Detalhes (modal)
```
GET /api/matriculas/detalhes?id_matricula=X
  1. Query direta na aca_matricula: matrícula + user_expandido + programa + área
  2. Query na aca_ciclo_programa + aca_ciclo (turma primária)
  3. RPC aca_get_form_config_completo (hierarquia programa→área, tipo_proc='matricula')
  4. RPC aca_get_respostas_usuario (jsonb_object_agg)
  → retorna { matricula, programa, blocos[], perguntas[], respostas{} }
```

### Inativação
```
POST /api/matriculas/inativar { id, status }
  → RPC aca_inativar_matricula(p_id, p_status)
    → Valida status permitido
    → Verifica se matrícula existe
    → UPDATE aca_matricula SET status = p_status
    → retorna { success, id, status }
  → Orquestrador: ctx.atualizarStatusInPlace(id, status)
    → badge no card reage instantaneamente
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/matriculas` | → RPC `aca_get_areas_para_processos` (reusada de Processos) |
| `GET` | `/api/matriculas/lista` | → RPC `aca_get_matriculas_filtradas` |
| `GET` | `/api/matriculas/detalhes` | → query + `aca_get_form_config_completo` + `aca_get_respostas_usuario` |
| `POST` | `/api/matriculas/inativar` | → RPC `aca_inativar_matricula` |
| `GET` | `/api/matriculas/turmas` | → RPC `aca_get_turmas_para_matriculas` (uso opcional) |

### APIs externas usadas
| Endpoint | Motivo |
|---|---|
| `/api/r2/sign` | Signed URLs para fotos de perfil e arquivos |

---

## Composables

| Composable | Responsabilidade |
|---|---|
| `useMatriculasCore` | `fetchAreas()`, `areas`, `loadingAreas`, `activeTab`, `setActiveTab()`, `idEntidade` (fallback + query param) |
| `useMatriculas` | `fetchMatriculas(idArea?)`, `matriculas`, `matriculasVisiveis` (filtro client-side de turma), `filtroAnoSemestre`, `filtroTurma`, `filtroBusca`, `filtroStatus`, `opcoesAnoSemestre`, `opcoesTurmas`, `pagina`, `total`, `totalPaginas`, `irParaPagina()`, `fotos` (signed URLs), `fetchFotos()`, `atualizarStatusInPlace()` |

---

## Componentes

| Componente | Props | Emits | Descrição |
|---|---|---|---|
| `MatriculasList` | `areas`, `activeTab`, `setActiveTab`, `ctx` | `verDetalhes(id)`, `inativar(id, dados)` | Tabs de áreas + barra de filtros + cards + paginação. Versão adaptada de `ProcessosTabInscritos` |
| `MatriculasModalDetalhes` | `modelValue`, `idMatricula` | `update:modelValue` | Exibe formulário de matrícula preenchido com abas por bloco, thumbnails de foto e links para arquivos |

---

## Lógica de Negócio

### Tabela principal: `aca_matricula`
```sql
aca_matricula
  id                    UUID PRIMARY KEY
  id_entidade           UUID FK → user_entidades
  id_programa           UUID FK → aca_programa
  id_usuario            UUID FK → user_expandido (aluno)
  id_pedido             UUID FK → com_pedido (opcional)
  status                TEXT ('ativa', 'inativa', 'cancelada') ← NOVO
  declaracao_matricula  BOOLEAN
  arquivo_declaracao_matricula UUID FK → global_arquivos
  criado_por            UUID
  criado_em             TIMESTAMPTZ
  modificado_por        UUID
  modificado_em         TIMESTAMPTZ
```

### Status da matrícula
- **`ativa`** → Badge `● Ativa` (verde) — matrícula vigente
- **`inativa`** → Badge `○ Inativa` (cinza) — matrícula desativada pelo admin
- **`cancelada`** → Badge `✕ Cancelada` (vermelho) — matrícula cancelada

### Ano/Semestre — convenção do banco (reusada de Processos)
- Formato: `26Is` (ano 26, semestre I = 1º), `26IIs` (semestre II = 2º)
- Utils `anoSemestre.ts`: `getAnoSemestreAtual()` → `"26Is"`, `getSemestresParaDrop(3)` → últimos 3 + atual + próximo

### Turma
- Matrícula é vinculada ao **programa**, não à turma diretamente
- A turma exibida no card é a **primeira turma** do programa (via `aca_ciclo_programa` ORDER BY `data_ini ASC LIMIT 1`)
- O filtro de turma é **client-side** (filtra sobre dados já carregados), igual ao filtro de programa em Processos

### Hierarquia de formulário (reusada de Processos)
```
aca_get_form_config_completo:
  1. Tenta config por programa_id + tipo_proc='matricula' + tipo_cand='estudante'
  2. Se não encontrar, herda da área do programa
```

### Foto de perfil (reusada de Processos)
```
aca_resposta_form (pergunta global "sua_foto", nome_interno="sua_foto")
  → id_arquivo → global_arquivos.id
    → /api/r2/sign?id=X → signedUrl → <img>
```
Fallback: avatar com inicial do nome.

### Inativação com reatividade
```
Modal Inativar → POST /api/matriculas/inativar → RPC UPDATE
  → orquestrador: ctx.atualizarStatusInPlace(id, 'inativa')
    → badge no card reage instantaneamente
```
Botão "Inativar" fica desabilitado se matrícula já estiver inativa ou cancelada.

### Paginação
- 20 itens por página (limite fixo no composable)
- Scroll interno na área de cards (`flex-1 overflow-y-auto`)
- Paginação fixa no rodapé (`shrink-0`)
- Range de páginas: primeiras 5 + "..." + últimas 2
- Reset para página 1 ao mudar aba, ano/semestre, busca ou status

### Filtros
- **Área** → RPC (recarrega)
- **Ano/Semestre** → RPC (recarrega)
- **Turma** → client-side (filtro instantâneo sobre dados já carregados)
- **Status** → RPC (recarrega)
- **Busca** → RPC (recarrega, busca por nome_completo ILIKE ou email ILIKE)

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `loadingAreas` | Spinner centralizado |
| `areas.length === 0` | Empty state com ícone e mensagem |
| `loading` (matrículas) | 5 skeleton cards |
| `matriculas.length === 0` | Empty state "Nenhuma matrícula encontrada" |
| `total > 0` | Paginação visível no rodapé |
| Normal | Cards com avatar/foto, nome, email, programa, turma, badge de status, data, botões |

---

## Contrato Visual Aplicado

(mesmo design system das páginas Processos Seletivos e Meus Cursos)

- **Layout**: `base` com sidebar
- **Tabs**: `tabs-nav` com `tab-btn` / `tab-btn--active`
- **Filtros**: `bg-[#0f0f17] border border-white/5 rounded-xl p-3`, selects com seta violeta (SVG inline)
- **Cards**: `bg-[#0f0f17] border border-white/5 rounded-xl` com hover `border-primary/30`
- **Badge de status**: `text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border`
  - Ativa: `bg-emerald-500/10 border-emerald-500/20 text-emerald-400`
  - Inativa: `bg-white/[0.04] border-white/10 text-white/40`
  - Cancelada: `bg-red-500/10 border-red-500/20 text-red-400`
- **Avatar**: 48×48 `rounded-xl border border-primary/20`, fallback com inicial
- **Botões**: outline (`border border-white/10 text-secondary`) e primary (`bg-primary/10 border-primary/20 text-primary`)
- **Modal detalhes**: overlay `rgba(0,0,0,0.85)`, painel `#13131a`, accent bar gradient, header com ícone, footer com botão outline
- **Modal inativar**: mesmo padrão do modal de detalhes, com box warning em âmbar e botão de confirmação vermelho
- **Scrollbar**: 4px fina e discreta
- **Select**: customizado com seta violeta (SVG inline)

---

## Paralelo com a página de Processos Seletivos

| Elemento | `/processos` | `/matriculas` |
|---|---|---|
| Tabela principal | `aca_processo_seletivo_inscricoes` | `aca_matricula` |
| Orquestrador | `pages/processos/index.vue` | `pages/matriculas/index.vue` |
| Componente principal | `ProcessosTabInscritos.vue` | `MatriculasList.vue` |
| Modal detalhes | `ProcessosModalDetalhes.vue` | `MatriculasModalDetalhes.vue` |
| Modal ação | `ProcessosModalAvaliar.vue` (3 toggles) | Modal de confirmação inline (inativar) |
| Core composable | `useProcessosCore.ts` | `useMatriculasCore.ts` |
| Data composable | `useProcessos.ts` | `useMatriculas.ts` |
| BFF áreas | `index.get.ts` | `index.get.ts` (mesma RPC) |
| BFF dados | `inscricoes.get.ts` | `lista.get.ts` |
| BFF detalhes | `detalhes.get.ts` | `detalhes.get.ts` |
| BFF ação | `avaliar.post.ts` | `inativar.post.ts` |
| Badges | 3 (Dados, Docs, Candidatura) | 1 (Ativa/Inativa/Cancelada) |
| Filtro extra | — | Filtro de Turma + Filtro de Status |

---

## Dependências com outras partes do sistema

### Reusa de Processos Seletivos
- RPC `aca_get_areas_para_processos` (mesma, sem alterações)
- RPC `aca_get_form_config_completo` (com `tipo_proc => 'matricula'`)
- RPC `aca_get_respostas_usuario`
- Utils `anoSemestre.ts`
- Lógica de signed URLs via `/api/r2/sign`
- Mesmo contrato visual (cards, badges, tabs, modais)

### Nova infraestrutura criada
- Coluna `status` em `aca_matricula` (migration 00001)
- RPC `aca_get_matriculas_filtradas` (migration 00002, corrigida em 00005)
- RPC `aca_inativar_matricula` (migration 00003)
- RPC `aca_get_turmas_para_matriculas` (migration 00004, uso opcional)
- 5 BFFs em `server/api/matriculas/`
- 2 composables em `composables/matriculas/`
- 2 componentes em `components/matriculas/`
- Página orquestradora em `pages/matriculas/index.vue`

---

## Histórico de Mudanças

### 2026-07-13 — Criação da página

**Banco de dados:**
- Migration `00001`: Adiciona coluna `status` (ativa/inativa/cancelada) em `aca_matricula`, com índice e CHECK constraint. Atualiza RPC `aca_criar_matricula` para explicitar status.
- Migration `00002`: Cria RPC `aca_get_matriculas_filtradas` — listagem paginada com JOINs (aluno, programa, área, turma, foto), filtros por área, ano/semestre, turma, status e busca textual.
- Migration `00003`: Cria RPC `aca_inativar_matricula` — valida status, verifica existência, UPDATE com modificado_em.
- Migration `00004`: Cria RPC `aca_get_turmas_para_matriculas` — lista turmas com matrículas para dropdown.
- Migration `00005`: Corrige ORDER BY no `jsonb_agg` (referenciava `m.criado_em` em escopo onde `m` não era visível).

**BFFs (server/api/matriculas/):**
- `index.get.ts` — GET áreas (reusa RPC de processos)
- `lista.get.ts` — GET matrículas paginadas com todos os filtros
- `detalhes.get.ts` — GET dados completos para modal: matrícula + programa + turma + form config + respostas
- `inativar.post.ts` — POST para inativar/reativar matrícula
- `turmas.get.ts` — GET turmas para dropdown (opcional)

**Composables:**
- `useMatriculasCore.ts` — áreas, tabs, idEntidade com fallback
- `useMatriculas.ts` — fetch, filtros (ano, turma, busca, status), paginação, fotos, reatividade in-place

**Componentes:**
- `MatriculasList.vue` — tabs de áreas, barra de filtros (4 inputs), cards de matrícula com avatar/nome/email/programa/turma/badge/data, botões Detalhes + Inativar, paginação
- `MatriculasModalDetalhes.vue` — exibe formulário de matrícula com abas por bloco, fotos em thumbnail, links para arquivos

**Página:**
- `pages/matriculas/index.vue` — orquestrador com initSession, fetchAreas, rota com query param `tab`, modais de detalhes e inativação com confirmação
- `layouts/base.vue` — adicionado pageTitle para rota `/matriculas`

**Design:**
- Removido título do conteúdo da página (já existe no header do layout)
- Padding superior reduzido para aproximar o header do layout dos filtros
