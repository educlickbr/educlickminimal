# Página Acadêmico Oferta (`/academico_oferta`)

## Visão Geral

Tela administrativa do módulo acadêmico para gestão de estrutura e oferta:

- **Áreas** — categorização da oferta
- **Componentes** — disciplinas/matérias
- **Módulos** — agrupamento de componentes + planos
- **Cursos** — grade curricular
- **Ciclos** — manifestação temporal de módulo
- **Programas** — ofertas agrupando ciclos + processos seletivos

**Rota:** `/academico_oferta` | **Layout:** `base` | **Orquestrador:** `pages/academico_oferta/index.vue` (~40 linhas)

---

## Arquitetura (padrão desacoplado)

Cada aba segue o pipeline: **Orquestrador → Componente de tab → Composable → BFF → RPC → Banco**

```
app/pages/academico_oferta/index.vue               ← orquestrador (~40 linhas)
app/components/academico_oferta/OfertaTab*.vue      ← 6 componentes de tab (auto-contidos)
app/components/academico_oferta/Modal*.vue          ← 6 modais
app/composables/academico_oferta/useOferta*.ts      ← 7 composables (Core + 1 por aba)
server/api/academico_oferta/*.ts                    ← 27 BFFs
server/api/academico_oferta/ciclos/*.ts             ← BFFs de ciclo (cronograma, gerar)
supabase/migrations/*.sql                           ← RPCs SECURITY INVOKER
```

### Estrutura de diretórios

```
front_end/app/
├── pages/academico_oferta/index.vue                ← orquestrador
├── components/academico_oferta/
│   ├── OfertaTabAreas.vue
│   ├── OfertaTabComponentes.vue
│   ├── OfertaTabModulos.vue
│   ├── OfertaTabCursos.vue
│   ├── OfertaTabCiclos.vue
│   ├── OfertaTabProgramas.vue
│   ├── ModalArea.vue
│   ├── ModalComponente.vue
│   ├── ModalModulo.vue       (abas: Geral, Componentes, Planos)
│   ├── ModalCurso.vue        (abas: Áreas, Geral, Grade)
│   ├── ModalCiclo.vue        (calendário + cronograma)
│   └── ModalPrograma.vue     (wizard: Origem → Ciclos → Processos → Conclusão)
├── composables/academico_oferta/
│   ├── useOfertaCore.ts
│   ├── useOfertaAreas.ts
│   ├── useOfertaComponentes.ts
│   ├── useOfertaModulos.ts
│   ├── useOfertaCursos.ts
│   ├── useOfertaCiclos.ts
│   └── useOfertaProgramas.ts
│
server/api/academico_oferta/
├── areas.{get,post,delete}.ts
├── componentes.{get,post,delete}.ts
├── modulos.{get,post,delete}.ts
├── modulo_componente.{get,post,delete}.ts
├── cursos.{get,post,delete}.ts
├── curso_modulo.{get,post,delete}.ts
├── ciclos.{get,post}.ts
├── plano_aula.{get,post,delete}.ts
├── processos.get.ts
└── ciclos/
    ├── index.delete.ts
    ├── calcular_cronograma.post.ts
    └── gerar.post.ts
```

### Status da migração

| Aba | Componente | Composable | BFF | RPC |
|---|---|---|---|---|
| `areas` | `OfertaTabAreas.vue` | `useOfertaAreas.ts` | `areas.*.ts` | `aca_list_areas`, `nxt_upsert_area`, `aca_delete_area` |
| `componentes` | `OfertaTabComponentes.vue` | `useOfertaComponentes.ts` | `componentes.*.ts` | `aca_get_componentes_paginado`, `aca_upsert_componente`, `aca_delete_componente` |
| `modulos` | `OfertaTabModulos.vue` | `useOfertaModulos.ts` | `modulos.*.ts` | `aca_get_modulos_paginado`, `aca_upsert_modulo`, `aca_delete_modulo` |
| `cursos` | `OfertaTabCursos.vue` | `useOfertaCursos.ts` | `cursos.*.ts` | `aca_get_cursos_paginado`, `aca_upsert_curso`, `aca_delete_curso` |
| `ciclos` | `OfertaTabCiclos.vue` | `useOfertaCiclos.ts` | `ciclos.*.ts` | `aca_get_ciclos_do_programa`, `aca_upsert_ciclo_v1`, `aca_delete_ciclo` |
| `programas` | `OfertaTabProgramas.vue` | `useOfertaProgramas.ts` | global¹ | — |

¹ GET via `/api/programas` (global). POST/DELETE via `ModalPrograma.vue` wizard.

---

## Orquestrador (`index.vue`)

```ts
// 6 imports explícitos dos componentes de tab
// tabs[] + initialTab (SSR-safe via route.query.tab) + setActiveTab()
// Zero lógica de negócio, zero estado, zero fetch
```

Template: 6 `<OfertaTabXxx v-if="activeTab==='xxx'" />` com `v-if` individual.

**Deep link**: `initialTab` computado no `setup()` (não no `onMounted`), garantindo SSR correto e sem hydration mismatch.

### Padrão de cada tab component

Cada `OfertaTabXxx.vue` é **auto-contido**:

```
<script setup>
  useOfertaCore()     → getEntidadeAtivaId(), garantirEntidade()
  useOfertaXxx(deps)  → estado + fetch + open/close/delete handlers
  onMounted           → fetch()
</script>
<template>
  header (contador + botão "Novo")
  loading spinner | grid de cards | empty state
  ModalXxx (v-model + props + @saved)
  GlobalModalConfirmacao (v-model + @confirm)
</template>
```

---

## Composables

### `useOfertaCore`
Compartilhado entre todas as tabs:
- `getEntidadeAtivaId()` — identifica entidade (empresa com produto acadêmico)
- `garantirEntidade()` — com fallback de `initSession()`

### `useOfertaAreas`
CRUD de áreas via BFF + RPC.

### `useOfertaComponentes`
CRUD de componentes via BFF + RPC. Inclui `handleSave(data)`.

### `useOfertaModulos`
CRUD de módulos via BFF + RPC. Expõe `componentesDisponiveis` para o modal.

### `useOfertaCursos`
CRUD de cursos via BFF + RPC. Expõe `modulosDisponiveis` para o modal.

### `useOfertaCiclos`
CRUD de ciclos via BFF + RPC. Expõe `modulosDisponiveis` para o modal.

### `useOfertaProgramas`
Listagem de programas (GET via API global). CRUD delegado ao `ModalPrograma.vue`.

---

## APIs

### BFFs da página (`server/api/academico_oferta/`)

| Endpoint | Arquivo | Pipeline |
|---|---|---|
| `GET/POST/DELETE /api/academico_oferta/areas` | `areas.*.ts` | → RPCs |
| `GET/POST/DELETE /api/academico_oferta/componentes` | `componentes.*.ts` | → RPCs |
| `GET/POST/DELETE /api/academico_oferta/modulos` | `modulos.*.ts` | → RPCs |
| `GET/POST/DELETE /api/academico_oferta/cursos` | `cursos.*.ts` | → RPCs |
| `GET/POST /api/academico_oferta/ciclos` | `ciclos.*.ts` | → RPCs |
| `DELETE /api/academico_oferta/ciclos` | `ciclos/index.delete.ts` | → RPC |
| `POST /api/academico_oferta/ciclos/calcular_cronograma` | `ciclos/calcular_cronograma.post.ts` | → RPC |
| `POST /api/academico_oferta/ciclos/gerar` | `ciclos/gerar.post.ts` | → RPC |
| `GET /api/academico_oferta/processos` | `processos.get.ts` | → query `aca_processo_seletivo` |
| `GET/POST/DELETE /api/academico_oferta/modulo_componente` | `modulo_componente.*.ts` | → query |
| `GET/POST/DELETE /api/academico_oferta/curso_modulo` | `curso_modulo.*.ts` | → query |
| `GET/POST/DELETE /api/academico_oferta/plano_aula` | `plano_aula.*.ts` | → query |

### APIs globais (`server/api/`)

| Endpoint | Usado por |
|---|---|
| `/api/areas` | `formularios` |
| `/api/programas` + subpaths | `calendario`, `formularios`, `academico_oferta` |

---

## RPCs (Supabase)

| Migration | RPC |
|---|---|
| `20260319110500_aca_componente_rpcs.sql` | `aca_get_componentes_paginado`, `aca_upsert_componente` |
| `20260325165731_fix_componente_rpc_nome_completo.sql` | `aca_get_componentes_paginado` (fix) |
| `20260327190000_aca_modulo_carga_horaria.sql` | `aca_upsert_modulo` |
| `20260401100000_aca_curso_rpcs.sql` | `aca_get_modulos_paginado`, `aca_upsert_modulo`, `aca_get_cursos_paginado`, `aca_upsert_curso` |
| `20260407164700_aca_area_management.sql` | `nxt_upsert_area` |
| `20260408075000_fix_rpc_get_modulos_return_type.sql` | `aca_get_modulos_paginado` (fix) |
| `20260416120000_create_aca_delete_area_rpc.sql` | `aca_delete_area` |
| `20260416122400_intercept_delete_componente_fk.sql` | `aca_delete_componente` |
| `20260416140800_create_aca_delete_modulo_rpc.sql` | `aca_delete_modulo` |
| `20260610142000_move_matricula_to_processo_seletivo.sql` | — (estrutural) |
| `20260610154000_programa_processos_multiplos.sql` | `aca_sync_processos_programa` |
| `20260610173000_create_aca_processo_seletivo_inscricoes.sql` | — (estrutural) |
| `20260617100000_rpc_aca_list_areas.sql` | `aca_list_areas` |

---

## Próximos passos

1. **Programas**: BFF próprio em `academico_oferta/` (substituir API global)
2. **APIs auxiliares**: trocar `modulo_componente`, `curso_modulo`, `plano_aula` de query direta por RPCs

---

## Histórico de mudanças

### Refatoração de desacoplamento (2026-06-18)
- Orquestrador extraído (~40 linhas, zero lógica)
- 6 componentes de tab auto-contidos com composable próprio
- 7 composables: `useOfertaCore` + 1 por aba
- `initialTab` no setup (SSR-safe)
- 27 APIs movidas de `server/api/` para `server/api/academico_oferta/`
- APIs globais (`areas`, `programas`) mantidas na raiz
- `processos.get.ts` restaurado do git (estava ausente)

### Processos no Programa (anterior)
- ModalPrograma com wizard 4 passos (Processos Seletivos)
- Múltiplos processos por programa com validação de não-sobreposição
- Migrations: `programa_processos_multiplos.sql`, `move_matricula_to_processo_seletivo.sql`
