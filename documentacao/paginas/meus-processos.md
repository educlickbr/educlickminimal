# Página Meus Processos (`/meus-processos`)

## Visão Geral

Tela do **aluno** para acompanhar suas inscrições em processos seletivos:

- **Cards de inscrição** — nome do curso, área, ano/semestre, turno, data de inscrição
- **Badges de status** — Dados, Documentação, Candidatura (pendente/aprovado/reprovado)
- **Modal de Detalhes** — reaproveitado do módulo `processos`, exibe o formulário preenchido
- **Botão Matricular** — placeholder (desabilitado, implementação futura)
- **Paginação** — 20 itens por página, scroll interno, paginação fixa no rodapé
- **Sem abas/filtros** — visão pessoal, apenas as inscrições do próprio aluno

**Rota:** `/meus-processos` | **Layout:** `base` | **Orquestrador:** `pages/meus-processos/index.vue` (~45 linhas)

**Diferencial vs `/processos` (admin):** Sem avatar/foto, sem nome, sem abas por área, sem filtros — o aluno só vê os próprios dados.

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Composable → BFF → RPC → Banco**

```
app/pages/meus-processos/index.vue                          ← orquestrador (~45 linhas)
app/composables/meus-processos/
└── useMeusProcessos.ts                                     ← fetch inscrições, paginação, formatadores
server/api/meus-processos/
└── index.get.ts                                            ← GET → RPC aca_get_minhas_inscricoes
supabase/migrations/
└── 20260623010000_rpc_aca_get_minhas_inscricoes.sql        ← RPC SECURITY INVOKER

(REAPROVEITADO)
app/components/processos/ProcessosModalDetalhes.vue         ← modal de detalhes
server/api/processos/detalhes.get.ts                        ← BFF do modal
```

### Estrutura de diretórios

```
front_end/app/
├── pages/meus-processos/index.vue
├── composables/meus-processos/
│   └── useMeusProcessos.ts
│
server/api/meus-processos/
└── index.get.ts                     ← GET inscrições (aca_get_minhas_inscricoes)

supabase/migrations/
└── 20260623010000_rpc_aca_get_minhas_inscricoes.sql
```

---

## Fluxo de Dados

### Inscrições do aluno (cards + paginação)
```
GET /api/meus-processos?pagina=1&limite=20
  → RPC aca_get_minhas_inscricoes(p_pagina, p_limite)
    → auth.uid() → user_expandido.id
    → aca_processo_seletivo_inscricoes
      JOIN aca_processo_seletivo (nome_processo)
      JOIN aca_programa (nome_curso)
      LEFT JOIN aca_area (nome_area)
      LEFT JOIN aca_ciclo_programa → aca_ciclo (ano_semestre, turno)
    → retorna { itens[], total, pagina, limite }
```

### Detalhes (modal reaproveitado)
```
GET /api/processos/detalhes?id_inscricao=X
  → mesmo fluxo do módulo processos
  → exibe formulário preenchido com abas por bloco
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/meus-processos` | → RPC `aca_get_minhas_inscricoes` |
| `GET` | `/api/processos/detalhes` | → **reaproveitado** do módulo processos |

---

## Composable

| Composable | Responsabilidade |
|---|---|
| `useMeusProcessos` | `fetchInscricoes(p?)`, `inscricoes`, `isLoading`, `pagina`, `total`, `totalPaginas`, `irParaPagina()`, `formatarAnoSemestre()`, `formatarData()` |

---

## Componentes

| Componente | Props | Emits | Origem |
|---|---|---|---|
| `ProcessosModalDetalhes` | `modelValue`, `idInscricao` | `update:modelValue` | **Reaproveitado** de `components/processos/` |

---

## Lógica de Negócio

### Auto-identificação do aluno
A RPC `aca_get_minhas_inscricoes` é `SECURITY INVOKER` — resolve o `user_expandido.id` a partir do `auth.uid()` da sessão. O aluno **não pode** ver inscrições de outros usuários.

### Badges de status (idêntico ao Processos admin)
- `status_dados`, `status_documentacao`, `status_candidatura`
- Valores: `pendente` (âmbar ○), `aprovado` (verde ✓), `reprovado` (vermelho ✕)
- `text-[8px]`, cores semânticas com borda

### Ano/Semestre formatado
- Banco: `26Is` → Tela: `2026 · 1º Semestre`
- Utilitário `formatarAnoSemestre()` no composable

### Turno
- Coluna `turno` na tabela `aca_ciclo` (enum: Matutino, Vespertino, Noturno, etc.)
- Exibido como badge verde (`bg-emerald-500/10`) quando disponível
- **Migration prévia necessária:** `20260623000000_add_turno_to_ciclo.sql`

### Paginação
- 20 itens por página (limite fixo no composable)
- Scroll interno na área de cards (`flex-1 overflow-y-auto`)
- Paginação fixa no rodapé (`shrink-0`)
- Range de páginas: primeiras 3 + "..." + entorno + últimas 2

### Botão Matricular
- Placeholder desabilitado (`opacity-40 cursor-not-allowed`)
- Implementação futura

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `isLoading` | Spinner centralizado |
| `inscricoes.length === 0` | Empty state com ícone, mensagem e link "Ver cursos disponíveis" |
| `total > 20` | Paginação visível no rodapé |
| Normal | Cards com badges, botões Detalhes e Matricular |

---

## Contrato Visual Aplicado

- **Layout**: `base` com sidebar
- **Cards**: `bg-[#0f0f17] border border-white/5 rounded-xl` com hover `border-primary/30`
- **Badges de status**: `text-[8px]`, cores semânticas (âmbar/verde/vermelho) com borda
- **Badge de área**: `bg-primary/10 border-primary/20 text-primary`
- **Badge de turno**: `bg-emerald-500/10 border-emerald-500/20 text-emerald-400`
- **Botão Detalhes**: outline (`border-white/10`)
- **Botão Matricular**: primário desabilitado (placeholder)
- **Scrollbar**: 4px fina e discreta
- **Paginação**: botões `w-8 h-8 rounded-lg`, ativo `bg-primary text-white`

---

## Pré-requisitos

### Migration de Turno (deve ser aplicada antes)
```
20260623000000_add_turno_to_ciclo.sql
  → Cria tipo enum tipo_turno
  → Adiciona coluna turno em aca_ciclo
  → Atualiza RPC aca_upsert_ciclo_v1
```

### Arquivos alterados para suporte a turno
| Arquivo | Alteração |
|---|---|
| `server/api/academico_oferta/ciclos.post.ts` | Adiciona `turno` no body |
| `composables/academico_oferta/useOfertaCiclos.ts` | Passa `turno` no `handleSaveCiclo` |
| `components/academico_oferta/ModalCiclo.vue` | Select de turno no form + restore no edit |
| `components/academico_oferta/OfertaTabCiclos.vue` | Badge de turno no card |

---

## Histórico de mudanças

### 2026-06-23 — Página completa de Meus Processos

**Pré-requisito: Turno no Ciclo:**
- Migration `20260623000000_add_turno_to_ciclo.sql` — enum `tipo_turno` + coluna + RPC atualizada
- ModalCiclo, OfertaTabCiclos, useOfertaCiclos e BFF atualizados

**RPC:**
- `aca_get_minhas_inscricoes` — SECURITY INVOKER, resolve `auth.uid()` → `user_expandido.id`
- JOIN com `aca_ciclo_programa` → `aca_ciclo` para `ano_semestre` e `turno`

**BFF:**
- `server/api/meus-processos/index.get.ts` — repassa `pagina`/`limite` para a RPC

**Composable:**
- `useMeusProcessos.ts` — `fetchInscricoes`, paginação, `formatarAnoSemestre`, `formatarData`

**Página:**
- Orquestrador `index.vue` (~45 linhas de script)
- Cards com badges de área, ano/semestre, turno e 3 status
- Paginação com range inteligente
- Modal de detalhes reaproveitado do módulo `processos`
- Botão Matricular placeholder
- Empty state com link para `/oferta`
