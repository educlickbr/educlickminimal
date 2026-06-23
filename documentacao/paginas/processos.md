# Página Processos Seletivos (`/processos`)

## Visão Geral

Tela administrativa para gestão de processos seletivos e inscrições:

- **Abas dinâmicas por Área** — carregadas via RPC, com badge de processos ativos
- **Cards de inscritos** — foto (ou avatar), nome, email, programa, data, badges de status
- **Filtros** — ano/semestre (algarismos romanos), programa (client-side), busca por nome/email
- **Paginação** — 20 itens por página, scroll interno, paginação fixa no rodapé
- **Modal de Detalhes** — exibe o formulário preenchido com abas por bloco e arquivos/fotos
- **Modal de Avaliação** — 3 toggle buttons (Dados, Documentação, Candidatura) com cores semânticas
- **Reatividade** — badges nos cards atualizam instantaneamente após avaliação

**Rota:** `/processos?tab=area_id` | **Layout:** `base` | **Orquestrador:** `pages/processos/index.vue` (~70 linhas)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/processos/index.vue                          ← orquestrador (~70 linhas)
app/components/processos/
├── ProcessosTabInscritos.vue                             ← tabs + filtros + cards + paginação
├── ProcessosModalDetalhes.vue                            ← formulário preenchido em modo leitura
└── ProcessosModalAvaliar.vue                             ← 3 toggle buttons de avaliação
app/composables/processos/
├── useProcessosCore.ts                                   ← áreas, tabs, fallback de entidade
└── useProcessos.ts                                       ← fetch inscrições, filtros, paginação, fotos
server/api/processos/
├── index.get.ts                                          ← áreas (GET)
├── inscricoes.get.ts                                     ← inscrições paginadas (GET)
├── programas.get.ts                                      ← programas filtrados (GET — legado)
├── detalhes.get.ts                                       ← dados completos para modal (GET)
└── avaliar.post.ts                                       ← avaliação de status (POST)
supabase/migrations/                                      ← RPCs SECURITY INVOKER
```

### Estrutura de diretórios

```
front_end/app/
├── pages/processos/index.vue
├── components/processos/
│   ├── ProcessosTabInscritos.vue
│   ├── ProcessosModalDetalhes.vue
│   └── ProcessosModalAvaliar.vue
├── composables/processos/
│   ├── useProcessosCore.ts
│   └── useProcessos.ts
├── utils/
│   └── anoSemestre.ts              ← getAnoSemestreAtual(), getSemestresParaDrop()
│
server/api/processos/
├── index.get.ts                    ← GET áreas (aca_get_areas_para_processos)
├── inscricoes.get.ts               ← GET inscrições (aca_get_inscricoes_filtradas)
├── programas.get.ts                ← GET programas (aca_get_processos_filtrados)
├── detalhes.get.ts                 ← GET detalhes (config + respostas)
└── avaliar.post.ts                 ← POST avaliação (aca_avaliar_inscricao)

supabase/migrations/
├── 20260622180000_rpc_aca_get_areas_processos.sql
├── 20260622183000_fix_rpc_aca_get_areas_processos.sql   ← correção JOIN programa
├── 20260622190000_rpc_aca_get_processos_filtrados.sql
├── 20260622200000_rpc_aca_get_inscricoes_filtradas.sql
├── 20260622203000_rpc_inscricoes_add_foto.sql            ← adiciona id_foto
├── 20260622210000_rpc_inscricoes_paginacao.sql           ← paginação
├── 20260622220000_rpc_aca_avaliar_inscricao.sql
└── 20260622221500_fix_rpc_avaliar.sql                    ← correção EXISTS
```

---

## Fluxo de Dados

### Áreas (abas dinâmicas)
```
GET /api/processos?id_entidade=X
  → RPC aca_get_areas_para_processos(p_id_entidade)
    → aca_area LEFT JOIN aca_programa LEFT JOIN aca_processo_seletivo
    → retorna { id, nome_area, qtd_processos_ativos }
```

### Inscrições (cards + paginação)
```
GET /api/processos/inscricoes?id_entidade=X&pagina=1&limite=20&id_area=Y&ano_semestre=26Is&busca=Z
  → RPC aca_get_inscricoes_filtradas(p_id_entidade, p_id_area, p_ano_semestre, p_busca, p_pagina, p_limite)
    → aca_processo_seletivo_inscricoes
      JOIN user_expandido (nome, email)
      JOIN aca_processo_seletivo (nome_processo)
      JOIN aca_programa (descricao)
      LEFT JOIN aca_area (nome_area)
      LEFT JOIN aca_resposta_form (pergunta "sua_foto" → id_arquivo)
    → retorna { itens[], total, pagina, limite }
```

### Fotos (signed URLs)
```
Para cada inscrito com id_foto:
  GET /api/r2/sign?id=ID_ARQUIVO
    → global_arquivos (path)
    → HMAC SHA-256 + worker_url → signedUrl
```

### Detalhes (modal)
```
GET /api/processos/detalhes?id_inscricao=X
  1. Query direta: inscrição + processo + programa + área
  2. RPC aca_get_form_config_completo (hierarquia programa→área)
  3. RPC aca_get_respostas_usuario (jsonb_object_agg)
  → retorna { inscricao, processo, blocos[], perguntas[], respostas{} }
```

### Avaliação (modal)
```
POST /api/processos/avaliar { id_inscricao, campo, valor }
  → RPC aca_avaliar_inscricao(p_id_inscricao, p_campo, p_valor)
    → SELECT EXISTS → EXECUTE format(UPDATE %I)
    → retorna { success, campo, valor }
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/processos` | → RPC `aca_get_areas_para_processos` |
| `GET` | `/api/processos/inscricoes` | → RPC `aca_get_inscricoes_filtradas` |
| `GET` | `/api/processos/programas` | → RPC `aca_get_processos_filtrados` (legado) |
| `GET` | `/api/processos/detalhes` | → query + `aca_get_form_config_completo` + `aca_get_respostas_usuario` |
| `POST` | `/api/processos/avaliar` | → RPC `aca_avaliar_inscricao` |

### APIs externas usadas
| Endpoint | Motivo |
|---|---|
| `/api/r2/sign` | Signed URLs para fotos de perfil e arquivos |

---

## Composables

| Composable | Responsabilidade |
|---|---|
| `useProcessosCore` | `fetchAreas()`, `areas`, `loadingAreas`, `activeTab`, `setActiveTab()`, `idEntidade` (fallback + query param) |
| `useProcessos` | `fetchInscricoes(idArea?)`, `inscricoes`, `filtroAnoSemestre`, `filtroPrograma`, `filtroBusca`, `opcoesAnoSemestre`, `opcoesProgramas`, `pagina`, `total`, `totalPaginas`, `irParaPagina()`, `fotos` (signed URLs), `fetchFotos()` |

---

## Componentes

| Componente | Props | Emits | Descrição |
|---|---|---|---|
| `ProcessosTabInscritos` | `areas`, `activeTab`, `setActiveTab`, `ctx` | `verDetalhes(id)`, `avaliar(id, dados)` | Tabs de áreas + barra de filtros + cards + paginação |
| `ProcessosModalDetalhes` | `modelValue`, `idInscricao` | `update:modelValue` | Exibe formulário preenchido com abas por bloco, thumbnails de foto e links para arquivos |
| `ProcessosModalAvaliar` | `modelValue`, `idInscricao`, `inscricaoData` | `update:modelValue`, `avaliado({campo, valor})` | 3 botões toggle (Dados, Documentação, Candidatura) com reatividade |

---

## Lógica de Negócio

### Ano/Semestre — convenção do banco
- Formato: `26Is` (ano 26, semestre I = 1º), `26IIs` (semestre II = 2º)
- Utils `anoSemestre.ts`: `getAnoSemestreAtual()` → `"26Is"`, `getSemestresParaDrop(3)` → últimos 3 + atual + próximo

### Hierarquia de formulário
```
aca_get_form_config_completo:
  1. Tenta config por programa_id + tipo_proc + tipo_cand
  2. Se não encontrar, herda da área do programa
```

### Foto de perfil
```
aca_resposta_form (pergunta global "sua_foto", nome_interno="sua_foto")
  → id_arquivo → global_arquivos.id
    → /api/r2/sign?id=X → signedUrl → <img>
```
Fallback: avatar com inicial do nome.

### Avaliação com reatividade
```
Modal Avaliar → POST /api/processos/avaliar → RPC UPDATE
  → emit("avaliado", { campo, valor })
    → orquestrador: ctx.inscricoes.find() → atualiza campo in-place
      → badges no card reagem instantaneamente
```

### Paginação
- 20 itens por página (limite fixo no composable)
- Scroll interno na área de cards (`flex-1 overflow-y-auto`)
- Paginação fixa no rodapé (`shrink-0`)
- Range de páginas: primeiras 5 + "..." + últimas 2
- Reset para página 1 ao mudar aba, ano/semestre ou busca

### Filtros
- **Área** → RPC (recarrega)
- **Ano/Semestre** → RPC (recarrega)
- **Programa** → client-side (filtro instantâneo sobre dados já carregados)
- **Busca** → RPC (recarrega, busca por nome_completo ILIKE ou email ILIKE)

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `loadingAreas` | Spinner centralizado |
| `areas.length === 0` | Empty state com ícone e mensagem |
| `loading` (inscrições) | 5 skeleton cards |
| `inscricoes.length === 0` | Empty state "Nenhum inscrito encontrado" |
| `total > 0` | Paginação visível no rodapé |
| Normal | Cards com avatar/foto, nome, email, programa, badges, data, botões |

---

## Contrato Visual Aplicado

- **Layout**: `base` com sidebar
- **Tabs**: `tabs-nav` com `tab-btn` / `tab-btn--active` + `tab-badge`
- **Cards**: `bg-[#0f0f17] border border-white/5 rounded-xl` com hover `border-primary/30`
- **Modais**: overlay `rgba(0,0,0,0.85)`, painel `#13131a`, accent bar gradient, header com ícone, footer com botão outline
- **Badges de status**: `text-[8px]`, cores semânticas (âmbar/verde/vermelho) com borda
- **Botões**: primário (preenchido violeta), outline (borda white/10), toggle colorido
- **Scrollbar**: 4px fina e discreta
- **Select**: customizado com seta violeta (SVG inline)

---

## Histórico de mudanças

### 2026-06-22 — Página completa de Processos Seletivos

**Abas dinâmicas:**
- RPC `aca_get_areas_para_processos` — retorna áreas com `qtd_processos_ativos` (JOIN via `aca_programa`)
- Correção do JOIN: `processo_seletivo_fim` está em `aca_programa`, não em `aca_processo_seletivo`

**Filtros e ano/semestre:**
- RPC `aca_get_processos_filtrados` — filtros por área, ano_semestre, busca textual
- Utils `anoSemestre.ts` — convenção do banco com algarismos romanos (`26Is`, `26IIs`)
- Dropdown com semestre atual + 3 anteriores + 1 à frente
- Filtro de programa client-side (instantâneo)

**Cards de inscritos (substituiu cards de programas):**
- RPC `aca_get_inscricoes_filtradas` — JOIN com `user_expandido`, `aca_processo_seletivo`, `aca_programa`, `aca_area`
- Adição de `id_foto` via `aca_resposta_form` (pergunta global `sua_foto`) → `global_arquivos` → `/api/r2/sign`
- Avatar fallback com inicial do nome

**Paginação:**
- RPC com `p_pagina`/`p_limite` + retorno de `total`
- 20 itens por página, scroll interno, paginação fixa no rodapé
- Reset automático para página 1 ao mudar filtros

**Modal de Detalhes:**
- BFF `detalhes.get.ts` — busca inscrição, processo, programa, config do form (hierarquia), respostas
- Exibição com abas por bloco (igual ao formulário original)
- Thumbnails para fotos, links "Visualizar" para arquivos

**Modal de Avaliação:**
- RPC `aca_avaliar_inscricao` — atualização dinâmica via `EXECUTE format(%I)`
- Correção: `EXECUTE` não seta `FOUND` — usar `SELECT EXISTS` antes
- 3 toggle buttons (Dados, Documentação, Candidatura) com cores semânticas
- Reatividade instantânea nos cards

**Badges de status nos cards:**
- 3 badges compactos (`text-[8px]`): Dados, Docs, Candidatura
- Cores: âmbar (pendente), verde (aprovado), vermelho (reprovado)
- Ícones: ○ pendente, ✓ aprovado, ✕ reprovado

**Desacoplamento:**
- Orquestrador `index.vue` (~70 linhas) — zero lógica de negócio
- Componente `ProcessosTabInscritos.vue` — tabs, filtros, cards, paginação
- 2 modais independentes com props/emits (zero `$fetch` inline no modal — toda lógica está no watch do modelValue)
- 2 composables: `useProcessosCore` (áreas/tabs) + `useProcessos` (inscrições/filtros/paginação/fotos)
- 5 BFFs isolados em `server/api/processos/`
- 8 migrations com RPCs `SECURITY INVOKER`
