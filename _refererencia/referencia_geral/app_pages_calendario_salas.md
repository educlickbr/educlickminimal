# `app/pages/calendario-salas/index.vue`

## Visão geral

Página de calendário de salas do módulo de Produção. Permite visualizar e gerenciar a ocupação das salas por horário, com reservas de turmas e eventos.

A página exibe um grid semanal com slots de horário por sala, destacando reservas existentes e permitindo criar, editar e excluir reservas.

---

## Objetivo da página

Permitir que a equipe administrativa:

1. **Visualize** a ocupação das salas em grade semanal (segunda a domingo)
2. **Filtre** por sala específica
3. **Navegue** entre semanas (anterior, próxima, hoje)
4. **Crie** reservas de evento ou turma em um slot
5. **Edite** reservas existentes (alterar escopo, tipo, observações)
6. **Exclua** reservas
7. **Visualize** detalhes da reserva via tooltip hover

---

## Arquitetura (pós-reestruturação)

A página foi dividida seguindo o padrão **componentes para template + composables para lógica**,
conforme documentado em `documentacao/paginas/revisao_paginas_desacoplamento.md`.

```
calendario-salas/index.vue  (~175 linhas — era ~324)
├── <script setup>  (~70 linhas)
│   ├── useCalendarioSalas()       → horarios, reservas, isLoading, availableSalas, fetchHorarios, fetchReservas, getReservaForSlot
│   ├── refs de UI                 → currentDate, selectedSala, weekDays, filteredHorarios
│   ├── refs de modal              → showReservationModal, selectedSlot, selectedDay, selectedExistingReserva
│   ├── handlers                   → navigateWeek, handleCellClick
│   └── onMounted + watch(currentDate)
│
├── <template>
│   ├── Header                     (inline — ~52 linhas: título + filtro + date picker + navegação)
│   ├── <CalendarioGrid />         (extraído — ~100 linhas removidas)
│   └── <ModalReservaSala />       (componente movido)
```

---

## Fluxo principal da página

### 1. Carregamento inicial

Ao montar a página (`onMounted`):

- `fetchHorarios()` chama `/api/producao/calendario/horarios` para carregar a grade de salas e horários
- `fetchReservas(start, end)` chama `/api/producao/calendario/reservas` com o range da semana atual
- `currentDate` padrão = hoje
- `selectedSala` padrão = `"all"` (todas as salas)

### 2. Navegação entre semanas

Os botões "Anterior" / "Hoje" / "Próxima" alteram `currentDate`:

- `navigateWeek('prev')` → `subWeeks(currentDate, 1)`
- `navigateWeek('today')` → `currentDate = new Date()`
- `navigateWeek('next')` → `addWeeks(currentDate, 1)`

O `watch(currentDate)` dispara `fetchReservas()` com o novo range.

### 3. Filtro por sala

O `<BaseSelect>` filtra `horarios` → `filteredHorarios` (computed).
Opção "Todas as Salas" (`id: 'all'`) mostra todas.

### 4. Criação / edição de reserva

1. Clique em uma célula do grid → `handleCellClick(slot, day)`
2. Busca reserva existente em `getReservaForSlot(slot.id, day)`
3. Abre `<ModalReservaSala>` com os dados do slot, dia e reserva existente (se houver)
4. Modal permite criar ou editar reserva, com escopo (horário/período/dia), tipo (evento/turma) e observações

### 5. Exclusão de reserva

No modal de edição, botão "Excluir" → confirmação → `DELETE /api/producao/calendario/reservas`

---

## Componentes

| Componente | Local | Uso |
|---|---|---|
| `CalendarioGrid.vue` | `components/calendario-salas/` | Grid semanal completo: date headers, loading, células, tooltip hover |
| `ModalReservaSala.vue` | `components/calendario-salas/` | Modal de criação/edição/exclusão de reserva |

### Interface do CalendarioGrid

```vue
<CalendarioGrid
  :horarios="filteredHorarios"
  :week-days="weekDays"
  :reservas="reservas"
  :is-loading="isLoading"
  @cell-click="handleCellClick"
/>
```

| Props | Tipo |
|---|---|
| `horarios` | `any[]` |
| `weekDays` | `Date[]` |
| `reservas` | `any[]` |
| `isLoading` | `boolean` |

| Emits | Payload |
|---|---|
| `cell-click` | `(slot: any, day: Date)` |

### Interface do ModalReservaSala

```vue
<ModalReservaSala
  :isOpen="showReservationModal"
  :slotData="selectedSlot"
  :day="selectedDay"
  :existingReserva="selectedExistingReserva"
  :allHorarios="horarios"
  :allReservas="reservas"
  @close="showReservationModal = false"
  @refresh="fetchReservasWrapper"
/>
```

### O que permaneceu inline

- **Header** (~52 linhas) — título + filtro de sala + date picker + navegação, com múltiplos v-models acoplados ao estado local

---

## Composable

### `useCalendarioSalas.ts`

Local: `composables/calendario-salas/`

| Exporta | Tipo |
|---|---|
| `horarios` | `Ref<any[]>` |
| `reservas` | `Ref<any[]>` |
| `isLoading` | `Ref<boolean>` |
| `availableSalas` | `ComputedRef<string[]>` |
| `fetchHorarios()` | `async () => void` |
| `fetchReservas(start, end)` | `async (string, string) => void` |
| `getReservaForSlot(slotId, day)` | `(string, Date) => any \| null` |

**Padrão:** usa `ofetch`, funções lançam exceção (toast tratado na página), sem acesso a refs globais.

---

### O que ficou na página

| Item | Motivo |
|---|---|
| `currentDate`, `selectedSala`, `weekDays`, `filteredHorarios` | Estado de UI |
| `showReservationModal`, `selectedSlot`, `selectedDay`, `selectedExistingReserva` | Estado de UI do modal |
| `navigateWeek`, `handleCellClick` | Handlers que manipulam estado de UI |
| `onMounted`, `watch(currentDate)` | Lifecycle / orquestração |
| `fetchReservasWrapper` | Wrapper que injeta `weekDays` no composable + catch para toast |

---

## Rotas da API

| Rota | Método | Uso |
|---|---|---|
| `/api/producao/calendario/horarios` | GET | `useCalendarioSalas.fetchHorarios()` |
| `/api/producao/calendario/reservas` | GET | `useCalendarioSalas.fetchReservas(start, end)` |
| `/api/producao/calendario/reservas` | POST | `ModalReservaSala.save()` |
| `/api/producao/calendario/reservas` | DELETE | `ModalReservaSala.confirmRemove()` |
| `/api/producao/calendario/turmas` | GET | `ModalReservaSala.fetchTurmas()` — BFF criado no desacoplamento |

### BFF criado

`server/api/producao/calendario/turmas.get.ts` — encapsula a RPC `nxt_get_turmas_seletivo`.
Antes o modal chamava `client.rpc('nxt_get_turmas_seletivo', ...)` diretamente do Supabase.

---

## Observações

1. **`ofetch` em vez de `$fetch`**: todos os composables e o modal usam `ofetch` importado, seguindo o padrão do projeto para evitar "Type instantiation is excessively deep" das rotas tipadas do Nitro.

2. **BFF de turmas**: o `ModalReservaSala` chamava `nxt_get_turmas_seletivo` diretamente via `client.rpc`. Foi criado o BFF `/api/producao/calendario/turmas` para normalizar, seguindo o padrão documentado em `normalizacao_rpc.md`.

3. **Carregamento client-side**: a página carrega dados via `onMounted`, sem SSR. O `isLoading` é gerenciado pelo composable.

4. **URL da página**: movida de `/producao/calendario-salas` para `/calendario-salas`, seguindo o padrão de pastas próprias nos 3 eixos (pages, components, composables).

---

## Arquivos relacionados

### Página
- `front_end/app/pages/calendario-salas/index.vue`

### Componentes
- `front_end/app/components/calendario-salas/CalendarioGrid.vue`
- `front_end/app/components/calendario-salas/ModalReservaSala.vue`

### Composable
- `front_end/app/composables/calendario-salas/useCalendarioSalas.ts`

### BFFs
- `front_end/server/api/producao/calendario/horarios.get.ts`
- `front_end/server/api/producao/calendario/reservas.get.ts`
- `front_end/server/api/producao/calendario/reservas.post.ts`
- `front_end/server/api/producao/calendario/reservas.delete.ts`
- `front_end/server/api/producao/calendario/turmas.get.ts` (criado no desacoplamento)

### Documentação
- `documentacao/paginas/revisao_paginas_desacoplamento.md`
