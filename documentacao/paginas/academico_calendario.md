# Página Acadêmico Calendário (`/academico_calendario`)

## Visão Geral

Tela de gestão do calendário acadêmico com 3 abas:

- **Feriados** — cadastro de feriados e recessos com timeline visual
- **Eventos** — eventos acadêmicos multi-day com timeline visual
- **Calendário** — visualização mensal/semanal com drag-and-drop de aulas

**Rota:** `/academico_calendario` | **Layout:** `base` | **Orquestrador:** `pages/academico_calendario/index.vue`

---

## Arquitetura

Padrão **compartilhado** (ctx no orquestrador, injetado via props):

```
pages/academico_calendario/index.vue          ← orquestrador
components/calendario/
├── CalendarioTabFeriados.vue                 ← timeline vertical + CRUD
├── CalendarioTabEventos.vue                  ← timeline vertical + CRUD
├── CalendarioTabCalendario.vue               ← grid mensal/semanal + DnD
├── ModalFeriado.vue
└── ModalEvento.vue
composables/calendario/
├── useCalendarioCore.ts                      ← getEntidadeAtivaId
├── useCalendarioFeriados.ts                  ← CRUD + timelineMonths
├── useCalendarioEventos.ts                   ← CRUD + timelineMonths
└── useCalendarioCalendario.ts                ← programas + grid + DnD
server/api/calendario/
├── feriados.{get,post,delete}.ts
└── eventos.{get,post,delete}.ts
```

### APIs

| Endpoint | Origem |
|---|---|
| `GET/POST/DELETE /api/calendario/feriados` | Exclusivo |
| `GET/POST/DELETE /api/calendario/eventos` | Exclusivo |
| `GET /api/programas` | Global |
| `GET /api/programas/calendario` | Global |
| `PATCH /api/programas/aula` | Global |

### Layout das timelines (Feriados + Eventos)

Restaurado do commit `43eabb3`. Características:

- Linha vertical central com gradiente (`from-transparent via-primary/30 to-transparent`)
- Meses alternando esquerda/direita (`md:mr-auto` / `md:ml-auto`)
- Nós clicáveis na timeline (círculos com `+` para adicionar)
- Conexões visuais: linhas horizontais dos cards até a linha central
- Cards com date badge (dia da semana + número), acento roxo no hover
- Multi-day para eventos (expansão por dia com badge "Continuação")

### Layout do Calendário

Restaurado do commit `43eabb3`. Características:

- Selector de programa com dropdown customizado e ícone
- Toggle Mensal/Semanal em pills com "Hoje"
- Grid mensal: 7 colunas com headers, bordas entre células, arraste com highlight
- Grid semanal: 7 colunas com altura mínima, colunas com data no topo
- Aulas: drag-and-drop, badge de horário, botão Cancelar, badge REP. (reposição)
- Feriados: 🛑 com fundo vermelho
- Eventos: 📅 com fundo âmbar
- Estados visuais: cancelada (riscado, pontilhado), reagendada (verde)
- Modal de confirmação para cancelamento de aula

---

## Status do desacoplamento

| Check | Status |
|---|---|
| `ofetch` removido dos composables | ✅ |
| APIs movidas para `server/api/calendario/` | ✅ |
| `initialTab` SSR-safe | ✅ |
| Layout Feriados (timeline) | ✅ Restaurado |
| Layout Eventos (timeline) | ✅ Restaurado |
| Layout Calendário (grid rico) | ✅ Restaurado |
| Modais com `onSave` no composable | ⚠️ Pendente |

---

## Correções (2026-06-18)

- `$fetch` do `ofetch` removido de 3 composables
- APIs `feriados` + `eventos` movidas para `server/api/calendario/` (6 arquivos)
- Layout em árvore original restaurado do git para Feriados, Eventos e Calendário
- `timelineMonths` adicionado aos composables de Feriados e Eventos
- Meses sempre visíveis mesmo sem dados (permite adicionar inline)
