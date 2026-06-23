# Página Formulários (`/formularios`)

## Visão Geral

Tela administrativa para gestão de formulários de inscrição:

- **Banco de Perguntas** — CRUD de perguntas reutilizáveis (text, file, foto, etc.)
- **Formulários** — configuração de formulários com drag-and-drop, blocos e campo obrigatório

**Rota:** `/formularios?tab=perguntas|configuracoes` | **Layout:** `wide`

---

## Arquitetura

Pipeline: **Orquestrador → Componente de tab → Composable → BFF → RPC → Banco**

```
app/pages/formularios/index.vue                     ← orquestrador (~50 linhas)
app/components/formularios/
├── FormulariosTabPerguntas.vue                     ← CRUD de perguntas
├── FormulariosTabConfiguracoes.vue                 ← lista + builder (drag-and-drop)
└── ModalPergunta.vue                               ← modal de criação/edição
app/composables/formularios/
├── useFormulariosCore.ts                           ← getEntidadeAtivaId / garantirEntidade / mapTipoPergunta
├── useFormulariosPerguntas.ts                      ← CRUD perguntas + handleSave
├── useFormulariosLista.ts                          ← lista formulários salvos + fetchContexts
└── useFormulariosBuilder.ts                        ← form builder (DnD, blocos, obrigatorio, save/load)
server/api/formularios/
├── index.get.ts                                    ← GET  /api/formularios
├── perguntas.get.ts                                ← GET  /api/formularios/perguntas → frm_get_perguntas
├── perguntas.post.ts                               ← POST /api/formularios/perguntas → frm_upsert_pergunta
├── perguntas.delete.ts                             ← DEL  /api/formularios/perguntas → frm_delete_pergunta
├── form_config.get.ts                              ← GET  /api/formularios/form_config → frm_get_form_config
└── form_config.post.ts                             ← POST /api/formularios/form_config → frm_upsert_form_config
```

### Orquestrador (`index.vue`)

```ts
const core = useFormulariosCore()
const perguntasCtx = useFormulariosPerguntas({ garantirEntidade, toast })

onMounted → perguntasCtx.fetchPerguntas()
watch(activeTab) → perguntasCtx.fetchPerguntas(); tabConfigRef?.init()
```

### Fluxo de dados

```
perguntasCtx (compartilhado) → FormulariosTabPerguntas (props)
                             → FormulariosTabConfiguracoes (props)
ModalPergunta                ← onSave = perguntasCtx.handleSave (prop)
```

---

## Tab Configurações — Builder

### Funcionalidades

- **Lista** de formulários salvos (cards com escopo, tipo, candidato)
- **Builder** com:
  - Drag-and-drop do banco de perguntas para o canvas
  - Blocos (tabs) gerenciáveis
  - Toggle de largura (1 ou 2 colunas)
  - **Toggle de obrigatório** (`*` âmbar — salvo no `aca_form_config.obrigatorio`)
  - Seleção de área/programa, tipo de processo e tipo de candidato
  - "Salvar Layout" persiste no banco via RPC

### Campos salvos no `itemsToSave`

| Campo | Origem |
|---|---|
| `pergunta_id` | builderItems |
| `bloco_nome` | builderItems |
| `bloco_ordem` | builderBlocos index |
| `pergunta_ordem` | índice no array |
| `largura` | builderItems (`"1"` ou `"2"`) |
| `obrigatorio` | builderItems (toggle `*`) |

### Inicialização da tab

O `init` exposto chama:
```ts
listaCtx.fetchContexts()        // carrega áreas + programas
listaCtx.fetchFormulariosSalvos() // carrega lista de forms salvos
```

---

## APIs

| Endpoint | Pipeline |
|---|---|
| `GET /api/formularios` | → query |
| `GET /api/formularios/perguntas` | → RPC `frm_get_perguntas` |
| `POST /api/formularios/perguntas` | → RPC `frm_upsert_pergunta` |
| `DELETE /api/formularios/perguntas` | → RPC `frm_delete_pergunta` |
| `GET /api/formularios/form_config` | → RPC `frm_get_form_config` |
| `POST /api/formularios/form_config` | → RPC `frm_upsert_form_config` |

### APIs globais usadas

| Endpoint | Motivo |
|---|---|
| `/api/areas` | Contexto dos formulários |
| `/api/programas` | Contexto dos formulários |

---

## Histórico de mudanças

### 2026-06-22 — Campo obrigatório
- `BuilderItem` inclui `obrigatorio: boolean`
- `saveFormConfig`: envia `obrigatorio` nos items
- `fetchFormConfig`: restaura `obrigatorio` ao carregar
- `toggleObrigatorio()`: nova função para alternar via botão `*` no canvas
- Template: badge `*` âmbar no label + botão toggle nas ações
- Correção: `listaCtx.fetchContexts()` adicionado ao `init` (estava faltando)

### 2026-06-18 — Auditoria e correções
- APIs movidas para `server/api/formularios/`
- `$fetch` do `ofetch` removido
- `handleSave` extraído para `useFormulariosPerguntas`
- ModalPergunta recebe `onSave` como prop
