# Página Formulários (`/formularios`)

## Visão Geral

Tela administrativa para gestão de formulários de inscrição:

- **Banco de Perguntas** — CRUD de perguntas reutilizáveis
- **Formulários** — configuração de formulários com drag-and-drop

**Rota:** `/formularios` | **Layout:** `wide` | **Orquestrador:** `pages/formularios/index.vue` (~50 linhas)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente de tab → Composable → BFF → RPC → Banco**

```
app/pages/formularios/index.vue                      ← orquestrador (~50 linhas)
app/components/formularios/FormulariosTab*.vue        ← 2 componentes de tab (recebem ctx)
app/components/formularios/ModalPergunta.vue          ← modal (recebe onSave como prop)
app/composables/formularios/useFormularios*.ts        ← 4 composables
server/api/formularios/*.ts                           ← 6 BFFs
supabase/migrations/*.sql                             ← RPCs
```

> **Diferença do `academico_oferta`:** Aqui o composable de perguntas (`perguntasCtx`) é compartilhado entre as 2 abas via orquestrador, porque ambas precisam dos mesmos dados. No `academico_oferta` cada aba é independente e cria seu próprio composable.

### Estrutura de diretórios

```
front_end/app/
├── pages/formularios/index.vue
├── components/formularios/
│   ├── FormulariosTabPerguntas.vue
│   ├── FormulariosTabConfiguracoes.vue
│   └── ModalPergunta.vue
├── composables/formularios/
│   ├── useFormulariosCore.ts          ← getEntidadeAtivaId / garantirEntidade
│   ├── useFormulariosPerguntas.ts     ← CRUD perguntas + handleSave
│   ├── useFormulariosLista.ts         ← lista de formulários salvos
│   └── useFormulariosBuilder.ts       ← form builder (drag-and-drop)
│
server/api/formularios/
├── index.get.ts                       ← GET  /api/formularios
├── perguntas.get.ts                   ← GET  /api/formularios/perguntas → RPC frm_get_perguntas
├── perguntas.post.ts                  ← POST /api/formularios/perguntas → RPC frm_upsert_pergunta
├── perguntas.delete.ts                ← DEL  /api/formularios/perguntas → RPC frm_delete_pergunta
├── form_config.get.ts                 ← GET  /api/formularios/form_config
└── form_config.post.ts                ← POST /api/formularios/form_config
```

### Orquestrador (`index.vue`)

```ts
// Composables instanciados UMA vez aqui
const core = useFormulariosCore()
const perguntasCtx = useFormulariosPerguntas({ garantirEntidade: core.garantirEntidade, toast })

// Lifecycle gerenciado pelo orquestrador
onMounted → perguntasCtx.fetchPerguntas()
watch(activeTab) → perguntasCtx.fetchPerguntas()
```

### Fluxo de dados

```
FormulariosTabPerguntas  ← recebe perguntasCtx + idEntidade como props
FormulariosTabConfiguracoes ← recebe perguntasCtx + idEntidade como props
ModalPergunta            ← recebe onSave(perguntasCtx.handleSave) como prop
                             (zero $fetch inline)
```

### APIs

| Endpoint | Pipeline |
|---|---|
| `GET /api/formularios` | → query |
| `GET /api/formularios/perguntas` | → RPC `frm_get_perguntas` |
| `POST /api/formularios/perguntas` | → RPC `frm_upsert_pergunta` |
| `DELETE /api/formularios/perguntas` | → RPC `frm_delete_pergunta` |

### APIs globais usadas

| Endpoint | Motivo |
|---|---|
| `/api/areas` | Contexto dos formulários (global) |
| `/api/programas` | Contexto dos formulários (global) |

---

## Checklist de desacoplamento

Esta página foi auditada e corrigida em 2026-06-18. Itens verificados:

- [x] APIs próprias movidas para `server/api/formularios/`
- [x] APIs globais (`areas`, `programas`) mantidas na raiz
- [x] `$fetch` do `ofetch` removido — usa global do Nuxt
- [x] Zero `$fetch` inline nos componentes — tudo nos composables
- [x] Modal recebe `onSave` como prop (sem chamada direta)
- [x] Orquestrador gerencia lifecycle (`onMounted` + `watch`)
- [x] `initialTab` no setup (SSR-safe)

---

## Mudanças recentes

### Auditoria e correções (2026-06-18)
- APIs movidas: `perguntas`, `formularios`, `form_config` → `server/api/formularios/`
- `$fetch` removido do `ofetch` em 3 composables
- `handleSave` adicionado ao `useFormulariosPerguntas` (antes estava inline no ModalPergunta)
- ModalPergunta atualizado para receber `onSave` como prop
- `FormulariosTabPerguntas` atualizado para passar `:onSave="perguntasCtx.handleSave"`
