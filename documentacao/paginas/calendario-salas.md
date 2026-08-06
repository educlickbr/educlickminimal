# Página Calendário de Salas (`/calendario-salas`)

## Visão Geral

Tela **administrativa** para gestão da ocupação de salas, com grid semanal interativo:

- **Grid semanal** — salas × horários × dias da semana (segunda a domingo)
- **Reservas** — criar, editar e excluir reservas de sala
- **Tipos de reserva** — Evento (vinculado a `aca_evento`) ou Aula (vinculada a `aca_calendario`)
- **Escopo de criação** — 1 horário, período inteiro (turno), ou dia inteiro
- **Escopo de exclusão** — inteligente: só habilita período/dia se a reserva cobre todo o turno/dia
- **Badge de compatibilidade** — ao vincular aula, mostra ✅ Encaixa / ⚠️ Janela maior / ❌ Horário diferente
- **Slots de intervalo** — horários marcados como `is_intervalo` não geram células clicáveis e são ignorados no escopo período/dia
- **Tooltip hover** — detalhes da reserva ao passar o mouse

**Inspiração direta no projeto SPED** (`calendario-salas`) — mesma mecânica de grid semanal, adaptada ao domínio acadêmico do EduClick.

**Rota:** `/calendario-salas` | **Layout:** `base` | **Orquestrador:** `pages/calendario-salas/index.vue`

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/calendario-salas/index.vue                         ← orquestrador (~90 linhas)
app/components/calendario-salas/
├── CalendarioGrid.vue                                        ← grid semanal + tooltip hover
├── CalendarioSalasTabSalas.vue                                ← CRUD de salas
├── CalendarioSalasTabHorarios.vue                             ← CRUD de horários globais
└── ModalReservaSala.vue                                       ← criar/editar/excluir reserva
app/composables/calendario-salas/
└── useCalendarioSalas.ts                                      ← fetch horarios, reservas, helpers

server/api/calendario-salas/
├── horarios.get.ts                                            ← GET grade (CROSS JOIN salas × horários)
├── horarios-lista.get.ts                                      ← GET lista plana de horários
├── horarios.post.ts                                           ← POST upsert horário
├── horarios.delete.ts                                         ← DELETE horário
├── salas.get.ts                                               ← GET lista de salas
├── salas.post.ts                                              ← POST upsert sala
├── salas.delete.ts                                            ← DELETE sala
├── reservas.get.ts                                            ← GET reservas por range de data
├── reservas.post.ts                                           ← POST upsert batch de reservas
├── reservas.delete.ts                                         ← DELETE reserva
├── aulas.get.ts                                               ← GET aulas sem reserva (para vincular)
├── eventos.get.ts                                             ← GET eventos por range
└── eventos.post.ts                                            ← POST criar evento em aca_evento

supabase/migrations/
├── 20260726000000_create_acd_salas_tables.sql                 ← v1: tabelas iniciais
├── 20260726100000_refactor_acd_horarios_globais.sql           ← v2: horários globais
├── 20260726200000_fix_acd_rls_policies.sql                    ← v3: correção RLS
├── 20260727000000_add_id_evento_programa.sql                  ← v4: FK evento + programa
├── 20260727000100_add_is_intervalo.sql                        ← v5: flag is_intervalo
├── 20260727000200_drop_evento_nome.sql                        ← v6: remove evento_nome
└── 20260727000300_add_reserva_grupo.sql                       ← v7: grupo + escopo
```

---

## Estrutura de Diretórios

```
front_end/app/
├── pages/calendario-salas/index.vue
├── components/calendario-salas/
│   ├── CalendarioGrid.vue
│   ├── CalendarioSalasTabSalas.vue
│   ├── CalendarioSalasTabHorarios.vue
│   └── ModalReservaSala.vue
├── composables/calendario-salas/
│   └── useCalendarioSalas.ts
├── components/global/
│   └── BaseSelect.vue                              ← select padronizado (criado para o módulo)

server/api/calendario-salas/
├── horarios.get.ts
├── horarios-lista.get.ts
├── horarios.post.ts
├── horarios.delete.ts
├── salas.get.ts
├── salas.post.ts
├── salas.delete.ts
├── reservas.get.ts
├── reservas.post.ts
├── reservas.delete.ts
├── aulas.get.ts
├── eventos.get.ts
└── eventos.post.ts
```

---

## Abas da Página

A página é dividida em 3 abas, navegáveis pelo componente `tabs-nav` (padrão do design system):

| Aba | Componente | Função |
|---|---|---|
| **Salas** | `CalendarioSalasTabSalas.vue` | CRUD de salas (nome + cor) |
| **Horários** | `CalendarioSalasTabHorarios.vue` | CRUD de horários globais (turno, hora_ini, hora_fim, is_intervalo) |
| **Calendário** | `CalendarioGrid.vue` + filtros | Grid semanal com reservas |

### Aba Salas

- Lista de salas em cards `person-card` com accent bar lateral
- Botões de ação (editar/excluir) aparecem no hover
- Modal de criação/edição: nome da sala + seletor de cor
- Empty state quando não há salas cadastradas

### Aba Horários

- Lista de horários globais (valem para **todas** as salas)
- Cada card mostra: turno, índice, hora início/fim, badge `Intervalo` (se marcado)
- Modal de criação/edição: índice, turno, hora início, hora fim, checkbox "É intervalo"
- O grid do calendário faz um **CROSS JOIN** entre `acd_sala` × `acd_horario`

### Aba Calendário

- Filtro por sala (BaseSelect) + date picker + navegação semanal (anterior/hoje/próxima)
- Grid semanal com:
  - **Coluna fixa à esquerda**: sala + horário (sticky)
  - **7 colunas de dias**: seg a dom
  - **Células clicáveis**: vazias mostram `+` no hover
  - **Células com reserva**: badge de tipo (Aula/Evento) + nome
  - **Células de intervalo**: acinzentadas, não clicáveis, mostram "Intervalo"
- **Tooltip hover**: tipo, nome, professor (se aula), observações

---

## Fluxo de Dados

### 1. Carregamento inicial

```
onMounted → fetchHorarios(idEntidade) → GET /api/calendario-salas/horarios
                                       → acd_get_salas_horarios (CROSS JOIN)
                                       → horarios[] (slots do grid)

onMounted → fetchReservas(idEntidade, start, end) → GET /api/calendario-salas/reservas
                                                   → acd_get_reservas_range
                                                   → reservas[]
```

### 2. Criação de reserva

```
Clique no "+" de uma célula
  → ModalReservaSala abre
    ├── Tipo: Evento
    │     ├── Evento existente → GET /api/calendario-salas/eventos → lista de aca_evento
    │     └── Criar rápido → POST /api/calendario-salas/eventos → cria em aca_evento
    └── Tipo: Aula
          └── GET /api/calendario-salas/aulas → lista aulas da data sem reserva
    └── Escopo: horário / período / dia
    └── Salvar → POST /api/calendario-salas/reservas → acd_upsert_reserva_batch
```

### 3. Edição de reserva

```
Clique em célula ocupada
  → ModalReservaSala abre em modo edição
  → Altera nome do evento / observações
  → Salvar → POST /api/calendario-salas/reservas → upsert (atualiza todos slots do grupo)
```

### 4. Exclusão de reserva

```
Clique em "Excluir" no modal de edição
  → Painel de exclusão mostra escopos inteligentes
  ├── 1 horário: sempre disponível
  ├── Período: só se o grupo cobre todo o turno
  └── Dia inteiro: só se o grupo cobre todos os slots do dia
  → Confirmar → DELETE /api/calendario-salas/reservas (para cada ID)
```

---

## Banco de Dados

### `acd_sala` — Salas físicas

```sql
CREATE TABLE public.acd_sala (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    capacidade INTEGER,
    cor TEXT NOT NULL DEFAULT '#8b5cf6',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_por UUID,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID,
    modificado_em TIMESTAMPTZ,
    CONSTRAINT uq_acd_sala_entidade_nome UNIQUE (id_entidade, nome)
);
```

### `acd_horario` — Horários globais

```sql
CREATE TABLE public.acd_horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    indice INTEGER NOT NULL,
    nome_turno TEXT NOT NULL,
    hora_ini TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    is_intervalo BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_acd_horario_indice UNIQUE (id_entidade, indice)
);
```

### `acd_reserva_sala` — Reservas

```sql
CREATE TABLE public.acd_reserva_sala (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entidade UUID NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_sala UUID NOT NULL REFERENCES public.acd_sala(id),
    id_horario UUID NOT NULL REFERENCES public.acd_horario(id),
    data DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('aula', 'evento')),
    status TEXT NOT NULL DEFAULT 'reservado' CHECK (status IN ('reservado', 'cancelado')),
    id_aula UUID REFERENCES public.aca_calendario(id) ON DELETE SET NULL,
    id_programa UUID REFERENCES public.aca_programa(id) ON DELETE SET NULL,
    id_evento UUID REFERENCES public.aca_evento(id) ON DELETE SET NULL,
    observacoes TEXT,
    reserva_grupo_id UUID,     -- todas reservas do mesmo lote compartilham
    reserva_escopo TEXT CHECK (reserva_escopo IN ('horario', 'periodo', 'dia')),
    criado_por UUID,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por UUID,
    modificado_em TIMESTAMPTZ,
    CONSTRAINT uq_acd_reserva_slot UNIQUE (id_sala, id_horario, data)
);
```

---

## RPCs

| RPC | Descrição |
|---|---|
| `acd_get_salas_horarios` | CROSS JOIN salas × horários para o grid |
| `acd_get_salas_simples` | Lista plana de salas (selects/dropdowns) |
| `acd_get_horarios` | Lista plana de horários |
| `acd_get_reservas_range` | Reservas em range de data |
| `acd_upsert_reserva_batch` | Criar/atualizar lote (gera grupo_id automaticamente) |
| `acd_delete_reserva_sala` | Excluir reserva por ID |
| `acd_get_aulas_sem_reserva` | Aulas do dia sem reserva de sala |
| `acd_get_eventos_range` | Eventos do período |
| `acd_upsert_sala` | Criar/atualizar sala |
| `acd_delete_sala` | Excluir sala |
| `acd_upsert_horario` | Criar/atualizar horário |
| `acd_delete_horario` | Excluir horário |

---

## APIs (BFFs)

| Método | Endpoint | Pipeline | Descrição |
|---|---|---|---|
| `GET` | `/api/calendario-salas/horarios` | → RPC `acd_get_salas_horarios` | Grid: cross join salas × horários |
| `GET` | `/api/calendario-salas/horarios-lista` | → RPC `acd_get_horarios` | Lista plana de horários |
| `POST` | `/api/calendario-salas/horarios` | → RPC `acd_upsert_horario` | Criar/editar horário |
| `DELETE` | `/api/calendario-salas/horarios` | → RPC `acd_delete_horario` | Excluir horário |
| `GET` | `/api/calendario-salas/salas` | → RPC `acd_get_salas_simples` | Lista de salas |
| `POST` | `/api/calendario-salas/salas` | → RPC `acd_upsert_sala` | Criar/editar sala |
| `DELETE` | `/api/calendario-salas/salas` | → RPC `acd_delete_sala` | Excluir sala |
| `GET` | `/api/calendario-salas/reservas` | → RPC `acd_get_reservas_range` | Reservas por range |
| `POST` | `/api/calendario-salas/reservas` | → RPC `acd_upsert_reserva_batch` | Criar/editar lote |
| `DELETE` | `/api/calendario-salas/reservas` | → RPC `acd_delete_reserva_sala` | Excluir reserva |
| `GET` | `/api/calendario-salas/aulas` | → RPC `acd_get_aulas_sem_reserva` | Aulas sem reserva |
| `GET` | `/api/calendario-salas/eventos` | → RPC `acd_get_eventos_range` | Eventos do período |
| `POST` | `/api/calendario-salas/eventos` | → Query direta `aca_evento` | Criar evento |

---

## Composables

### `useCalendarioSalas.ts`

**Local:** `composables/calendario-salas/`

| Exporta | Tipo | Descrição |
|---|---|---|
| `horarios` | `Ref<any[]>` | Slots do grid (cross join sala × horário) |
| `reservas` | `Ref<any[]>` | Reservas do período |
| `isLoadingHorarios` | `Ref<boolean>` | Loading dos horários |
| `isLoadingReservas` | `Ref<boolean>` | Loading das reservas |
| `availableSalas` | `ComputedRef<string[]>` | Nomes únicos de salas para o filtro |
| `fetchHorarios(idEntidade)` | `function` | Carrega grade de salas+horários |
| `fetchReservas(idEntidade, start, end)` | `function` | Carrega reservas do range |
| `getReservaForSlot(slotKey, day)` | `function` | Busca reserva por slot_key + data |

**Padrão:** usa `$fetch` nativo do Nuxt (sem `ofetch`).

---

## Componentes

### CalendarioGrid.vue

**Props:**
- `horarios: any[]` — slots do grid (CROSS JOIN)
- `weekDays: Date[]` — 7 dias da semana
- `reservas: any[]` — reservas do período
- `isLoading: boolean` — estado de loading

**Emits:**
- `cell-click(slot, day)` — clique em célula do grid

**Lógica:**
- Intervalo: células com `slot.is_intervalo` ficam acinzentadas, não clicáveis, mostram "Intervalo"
- Tooltip hover via Teleport para `body`

### ModalReservaSala.vue

**Props:** `modelValue`, `slotData`, `day`, `existingReserva?`, `allHorarios`, `allReservas`, `idEntidade`, `userId`

**Emits:** `update:modelValue`, `refresh`

**Fluxo:**
- **Criação:** Tipo (Evento/Aula) → Conteúdo → Observações → Escopo (só na criação) → Salvar
- **Edição:** Tipo (bloqueado?) → Conteúdo → Observações → Salvar ou Excluir
- **Exclusão:** Painel separado com escopo inteligente (1 horário / Período / Dia inteiro)

### CalendarioSalasTabSalas.vue

CRUD de salas com modal de criação/edição (nome + cor).

### CalendarioSalasTabHorarios.vue

CRUD de horários com modal de criação/edição (índice, turno, hora_ini, hora_fim, is_intervalo).

---

## Contrato Visual Aplicado

- **Layout:** `base` com sidebar (admin autenticado)
- **Tabs:** `tabs-nav` + `tab-btn` / `tab-btn--active` (padrão design system)
- **Cards (Salas/Horários):** `person-card` com `person-accent-bar` lateral (3px, aparece no hover)
- **Avatar:** `person-avatar` (40×40, `rgba(139,92,246,0.10)`)
- **Ações hover:** `person-actions` (opacity 0 → 1 no hover)
- **Botões primários:** `rounded-lg bg-primary/12 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest`
- **Modais:** `#13131a` bg, `border-primary/18`, `modal-accent-bar` gradient violet (3px), `modal-header`/`modal-body`/`modal-footer`
- **Grid:** `#16161E` bg, `#0f0f15` para select trigger, bordas `white/5`
- **Células reserva:** border-left 4px colorido, badge tipo no topo
- **Células intervalo:** 40% opacity, âmbar, "Intervalo"
- **Tooltip:** `#1A1B26` bg, `white/10` border
- **Spinner:** `w-8 h-8 border-2 border-secondary/20 border-t-primary rounded-full animate-spin`
- **Empty state:** `bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl` com ícone SVG

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `isLoadingHorarios` (ab Salas) | Spinner centralizado |
| `isLoading` (ab Salas) | Spinner |
| `salas.length === 0` | Empty state "Nenhuma sala cadastrada" |
| `horarios.length === 0` (ab Horários) | Empty state "Nenhum horário cadastrado" |
| `isLoadingHorarios` (ab Calendário) | Loading fallback "Carregando salas..." |
| `isLoadingReservas` | Spinner no grid |
| `horarios.length === 0` (ab Calendário) | Grid vazio (só headers + linha sem slots) |
| `showReservationModal` | Modal de criação/edição |
| `showConfirmDelete` | Painel de exclusão com escopo |
| Normal | Grid com headers + linhas + tooltips |

---

## Histórico de Mudanças

| Data | Descrição |
|---|---|
| 2026-07-13 | Criação do plano — inspirado no SPED `calendario-salas` |
| 2026-07-26 | Implementação inicial com `acd_sala_horario` (por sala) |
| 2026-07-26 | Refatoração para `acd_horario` global + `id_sala` + `id_horario` separados |
| 2026-07-26 | Fix RLS policies (padrão `aca_%` + entidade via JWT) |
| 2026-07-26 | Adicionado `id_evento` (FK `aca_evento`) e `id_programa` (FK `aca_programa`) |
| 2026-07-26 | Adicionado `is_intervalo` em `acd_horario` |
| 2026-07-26 | Removido `evento_nome` de `acd_reserva_sala` (evento centralizado em `aca_evento`) |
| 2026-07-26 | Adicionado `reserva_grupo_id` + `reserva_escopo` para operações em lote |
| 2026-07-27 | Documentação final da página |
