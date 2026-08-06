# Página Atribuição (`/atribuicao`)

## Visão Geral

Tela **administrativa** para atribuição de docentes a componentes curriculares dentro de ciclos acadêmicos:

- **Filtro por Ano/Semestre** — gerado pelo utils `anoSemestre.ts`, com base na data atual (ex: 24IIs, 25Is, 25IIs, 26Is, 26IIs, 27Is)
- **Seleção de Programa** — dropdown com programas que têm ciclos no ano/semestre selecionado
- **Ciclos do programa** — exibidos como cards expansíveis, cada um com seus componentes
- **Componentes** — cada um mostra docentes já atribuídos (com badge de papel) e botão "Atribuir"
- **Modal de Atribuição** — busca de docentes elegíveis, seleção visual com card, escolha do papel (titular/substituto/auxiliar)

**Rota:** `/atribuicao` | **Layout:** `base` | **Orquestrador:** `pages/atribuicao/index.vue` (~25 linhas)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/atribuicao/index.vue                            ← orquestrador (~25 linhas)
app/components/atribuicao/
├── AtribuicaoPage.vue                                     ← página completa (ciclos, componentes, atribuições)
└── ModalAtribuirDocente.vue                               ← modal de busca + seleção + papel
app/composables/atribuicao/
└── useAtribuicao.ts                                       ← programas, docentes, ciclos, vinculos, atribuir/remover
server/api/atribuicao/
├── index.ts                                                ← GET (programas+docentes) / POST (atribuir) / DELETE (remover)
└── programa.get.ts                                         ← GET estrutura completa de um programa
supabase/migrations/
├── 20260724000000_create_aca_docente_atribuicao.sql        ← tabela + coluna em aca_calendario + RLS
├── 20260724000001_rpc_aca_atribuicao.sql                   ← RPCs: listar, atribuir, remover, modulos_componentes, docentes
├── 20260724000002_fix_rpc_nome_componente.sql              ← fix coluna nome → nome_componente
├── 20260724000003_fix_rpc_vinculo_componente.sql           ← fix ORDER BY + carga_horaria
├── 20260724000004_rls_academic_tables.sql                  ← RLS para tabelas acadêmicas
├── 20260724000005_rpc_programas_com_ciclos.sql             ← RPC programas filtrados por ano_semestre
├── 20260724000006_fix_rpc_programas_com_ciclos.sql         ← fix DISTINCT + ORDER BY
├── 20260724000007_fix_rpc_docentes_entidade.sql            ← SECURITY DEFINER (acesso user_expandido)
├── 20260724000008_fix_rpc_docentes_entidade_v2.sql         ← SET search_path + GRANT EXECUTE
├── 20260724000009_fix_rpc_docentes_entidade_v3.sql         ← DROP + recria com subquery
├── 20260724000010_fix_rpc_docentes_double_drop.sql         ← drop ambas assinaturas (2 e 3 params)
├── 20260724000011_fix_rpc_atribuir_docente_ciclo.sql       ← resolve user_expandido internamente
└── 20260724000012_fix_rpc_atribuir_double_drop.sql         ← drop ambas assinaturas atribuir
```

### Estrutura de diretórios

```
front_end/app/
├── pages/atribuicao/index.vue
├── components/atribuicao/
│   ├── AtribuicaoPage.vue
│   └── ModalAtribuirDocente.vue
├── composables/atribuicao/
│   └── useAtribuicao.ts

server/api/atribuicao/
├── index.ts                    ← GET / POST / DELETE
└── programa.get.ts             ← GET estrutura do programa

supabase/migrations/
├── 20260724000000_create_aca_docente_atribuicao.sql
├── 20260724000001_rpc_aca_atribuicao.sql
├── 20260724000002_fix_rpc_nome_componente.sql
├── 20260724000003_fix_rpc_vinculo_componente.sql
├── 20260724000004_rls_academic_tables.sql
├── 20260724000005_rpc_programas_com_ciclos.sql
├── 20260724000006_fix_rpc_programas_com_ciclos.sql
├── 20260724000007_fix_rpc_docentes_entidade.sql
├── 20260724000008_fix_rpc_docentes_entidade_v2.sql
├── 20260724000009_fix_rpc_docentes_entidade_v3.sql
├── 20260724000010_fix_rpc_docentes_double_drop.sql
├── 20260724000011_fix_rpc_atribuir_docente_ciclo.sql
└── 20260724000012_fix_rpc_atribuir_double_drop.sql
```

---

## Fluxo de Dados

### Inicialização (programas + docentes + anos/semestres)
```
GET /api/atribuicao?id_entidade=X&ano_semestre=26Is
  → RPC aca_get_programas_com_ciclos(p_id_entidade, p_ano_semestre)
    → aca_programa
      JOIN aca_ciclo_programa (id_ciclo)
      JOIN aca_ciclo (ano_semestre, data_ini, data_fim)
    → retorna { programas[{ id, descricao }], ano_semestres[] }
  → (paralelo) RPC aca_get_docentes_por_entidade(p_id_entidade, p_busca)
    → aca_docente JOIN user_expandido
    → SECURITY DEFINER (necessário para acessar user_expandido de outros usuários)
    → retorna { itens[{ id, id_user_expandido, nome, email }] }
```

### Estrutura do programa (ciclos + componentes + atribuições atuais)
```
GET /api/atribuicao/programa?id_programa=X&id_entidade=Y
  → RPC aca_get_modulos_componentes_por_programa(p_id_programa, p_id_entidade)
    → aca_ciclo (do programa via aca_ciclo_programa)
      → aca_modulo (nome_modulo)
      → aca_modulo_componente (componentes do módulo)
        → aca_componente (nome_componente)
        → LEFT JOIN aca_docente_modulo_componente_ciclo (atribuições atuais)
          → LEFT JOIN aca_docente + user_expandido
    → retorna { itens[{ id_ciclo, modulo_nome, ciclo_descricao, data_ini, data_fim, componentes[{ id_modulo_componente, id_componente, componente_nome, carga_horaria, obrigatorio, docentes[{ id_atribuicao, id_docente, docente_nome, docente_email, tipo }] }] }] }
  → (paralelo) Query direta em aca_docente_vinculo (para filtrar docentes elegíveis no dropdown)
    → retorna { vinculos[{ id, id_docente, id_componente, elegivel }] }
```

### Atribuir docente
```
POST /api/atribuicao { id_ciclo, id_modulo_componente, id_docente, tipo }
  → RPC aca_atribuir_docente_ciclo(p_id_ciclo, p_id_modulo_componente, p_id_docente, p_tipo)
    → Resolve user_expandido internamente via auth.uid()
    → UPSERT: UPDATE se já existe atribuição (mesmo docente, mesmo ciclo+componente), INSERT se não
    → retorna { success, id, message }
```

### Remover atribuição
```
DELETE /api/atribuicao?id=ID_ATRIBUICAO
  → RPC aca_remover_atribuicao_docente(p_id)
    → DELETE FROM aca_docente_modulo_componente_ciclo WHERE id = p_id
    → retorna { success, message }
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/atribuicao` | → RPC `aca_get_programas_com_ciclos` + `aca_get_docentes_por_entidade` |
| `GET` | `/api/atribuicao/programa` | → RPC `aca_get_modulos_componentes_por_programa` + query `aca_docente_vinculo` |
| `POST` | `/api/atribuicao` | → RPC `aca_atribuir_docente_ciclo` |
| `DELETE` | `/api/atribuicao` | → RPC `aca_remover_atribuicao_docente` |

---

## Composables

| Composable | Responsabilidade |
|---|---|
| `useAtribuicao` | `fetchDadosIniciais(ano_semestre?)`, `fetchCiclos()` (ao selecionar programa), `atribuirDocente()`, `removerAtribuicao()`, `getDocentesElegiveis(componenteId)`. Estado: `programas`, `programaSelecionado`, `ciclos`, `docentes`, `vinculos`, `anoSemestreSelecionado`, `anoSemestres` |

---

## Componentes

| Componente | Props | Emits | Descrição |
|---|---|---|---|
| `AtribuicaoPage` | `ctx: UseAtribuicaoReturn`, `idEntidade: string` | — | Filtro ano/semestre + dropdown programa + lista de ciclos com componentes + docentes atribuídos |
| `ModalAtribuirDocente` | `modelValue`, `cicloId`, `idModuloComponente`, `idComponente`, `componenteNome`, `docentesElegiveis[]`, `docentesAtuais[]`, `jaTemTitular`, `saving` | `update:modelValue`, `save(idDocente, tipo)` | Busca de docente, seleção visual com card, escolha de papel (titular/substituto/auxiliar) |

---

## Lógica de Negócio

### Tabela central: `aca_docente_modulo_componente_ciclo`

```sql
aca_docente_modulo_componente_ciclo
  id                    UUID PRIMARY KEY
  id_ciclo              UUID FK → aca_ciclo (iteração do módulo)
  id_modulo_componente  UUID FK → aca_modulo_componente (componente dentro do módulo)
  id_docente            UUID FK → aca_docente
  tipo                  TEXT ('titular', 'substituto', 'auxiliar')
  criado_por            UUID FK → user_expandido
  criado_em             TIMESTAMPTZ
  modificado_por        UUID FK → user_expandido
  modificado_em         TIMESTAMPTZ
```

UNIQUE em `(id_ciclo, id_modulo_componente, id_docente)` — um docente só pode ter um papel por (ciclo, componente).

### Coluna em `aca_calendario`
```sql
aca_calendario.id_atribuicao_docente  UUID FK → aca_docente_modulo_componente_ciclo(id) ON DELETE SET NULL
```
— permite que cada aula herde o docente da atribuição, com possibilidade de override.

### Papéis do docente
- **`titular`** → Badge verde — responsável principal (apenas um por componente+ ciclo)
- **`substituto`** → Badge âmbar — cobre ausências do titular
- **`auxiliar`** → Badge azul — suporte ao titular

### Fluxo de vínculo vs atribuição
1. **Vínculo** (`aca_docente_vinculo`) — diz quais componentes um docente pode lecionar (elegibilidade geral)
2. **Atribuição** (`aca_docente_modulo_componente_ciclo`) — diz qual docente leciona qual componente em qual ciclo, com papel específico

O dropdown de docentes no modal é filtrado pelos **vínculos elegíveis** do componente. Se não houver vínculos definidos, mostra todos os docentes (fallback).

### Ano/Semestre — reusa utils `anoSemestre.ts`
- Formato: `26Is` (ano 26, semestre I = 1º), `26IIs` (semestre II = 2º)
- O filtro é populado com `getAnoSemestreList(4)` → 2 anos anteriores + atual + 1 seguinte
- Ao selecionar, recarrega a lista de programas

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `loading` (inicial) | Spinner centralizado |
| `!programaSelecionado` | Empty state "Selecione um programa" com ícone |
| `loadingCiclos` | Spinner centralizado |
| `ciclos.length === 0` | Empty state "Nenhum ciclo encontrado" |
| Normal | Cards de ciclo com border, header (módulo + datas), lista de componentes com docentes atribuídos + botão "Atribuir" |
| Modal aberto | Overlay escuro + painel central com busca, lista de docentes, footer com ações |
| **jaTemTitular** | Aviso âmbar no modal + opção "Titular" desabilitada no dropdown |
| Saving | Botão "Atribuir Docente" desabilitado com spinner |
| Toast (sucesso) | Notificação inferior direita verde por 3s |
| Toast (erro) | Notificação inferior direita vermelha por 3s |

---

## Contrato Visual Aplicado

(mesmo design system premium das demais páginas admin — padrão conquistado em `/academico_oferta`, `/produtos`, `/meus-processos`)

### AtribuicaoPage — Cards de Ciclo

- **Filtros**: selects com `border rgba(255,255,255,0.07)` + caret SVG violet inline, label `9px/900/uppercase`
- **Cards de ciclo**: `bg rgba(255,255,255,0.025) border rgba(255,255,255,0.06) border-radius 14px`
  - Hover: `border-color rgba(139,92,246,0.22)` + `box-shadow 0 4px 24px rgba(0,0,0,0.25)`
  - **Accent bar violet no topo**: `h-2px gradient(90deg, #7c3aed, #a78bfa, transparent)`, `opacity 0 → 1` no hover
  - Header com ícone avatar 34×34 `bg-primary/8 border-primary/16 rounded-9px`
- **Rows de componente**: dentro do card de ciclo, cada componente tem:
  - Padding esquerdo `22px` com **accent bar índigo lateral** (`#6366f1 → #818cf8`, `w-2px`, `opacity 0 → 1` no hover do row)
  - Background `rgba(255,255,255,0.015)` sutil no hover
- **Badge de docente atribuído**: pill com **dot colorido** (5×5px, `border-radius 50%`) + nome + separador · + tipo
  - Titular: dot `#34d399`, pill `bg rgba(52,211,153,0.08) border rgba(52,211,153,0.18)`
  - Substituto: dot `#fbbf24`, pill `bg rgba(251,191,36,0.08) border rgba(251,191,36,0.18)`
  - Auxiliar: dot `#38bdf8`, pill `bg rgba(56,189,248,0.08) border rgba(56,189,248,0.18)`
  - Botão ✕ de remoção: `opacity 0.4`, hover `color #f87171`
- **Botão "Atribuir"**: **oculto em repouso** (`opacity 0`), aparece no hover do row — `bg rgba(139,92,246,0.08) border rgba(139,92,246,0.18) color #a78bfa`, ícone SVG `+`

### ModalAtribuirDocente

- **Overlay**: `rgba(0,0,0,0.82)` + `backdrop-filter blur(4px)`
- **Painel**: `bg #13131a border rgba(139,92,246,0.2) border-radius 18px shadow 0 32px 80px rgba(0,0,0,0.6)` + `animation slideUp 0.2s`
- **Accent bar**: `h-2px gradient(90deg, #7c3aed, #a78bfa, transparent)` — topo do painel
- **Header**: ícone 40×40 `bg-primary/10 border-primary/20 rounded-11px` + título 14px/900 + subtítulo 11px/600
- **Aviso jaTemTitular**: `bg rgba(251,191,36,0.07) border rgba(251,191,36,0.18) color #fbbf24`
- **Campo de busca**: `bg rgba(0,0,0,0.3)` com ícone lupa SVG posicionado
- **Card de docente**:
  - Repouso: `bg rgba(255,255,255,0.02) border rgba(255,255,255,0.05) border-radius 12px`
  - Hover: `border rgba(255,255,255,0.10) bg rgba(255,255,255,0.04)`
  - **Selecionado**: `border rgba(139,92,246,0.4) bg rgba(139,92,246,0.06) translateY(-1px) shadow 0 4px 16px rgba(139,92,246,0.15)` + **accent bar violet lateral** (`w-3px, opacity 1`)
  - Avatar: 38×38 `bg-primary/10 border-primary/20 rounded-10px`
  - Badge "já atribuído": pill com dot colorido por tipo
- **Seletor de papel**: `bg rgba(139,92,246,0.07) border rgba(139,92,246,0.2) color #c4b5fd text-transform uppercase` — identidade violet
- **Checkbox**: repouso `border-2 rgba(255,255,255,0.10) rounded-7px`; ativo: `gradient(135deg, #7c3aed, #8b5cf6) + box-shadow 0 2px 8px rgba(139,92,246,0.4)`
- **Botão Cancelar**: `border rgba(255,255,255,0.08) bg transparent color rgba(255,255,255,0.35)`
- **Botão Confirmar**: `gradient(135deg, #7c3aed, #8b5cf6) shadow 0 4px 14px rgba(139,92,246,0.35)`, hover `translateY(-1px) shadow maior`; desabilitado: `bg rgba(255,255,255,0.06) color rgba(255,255,255,0.2)`

---

## Paralelo com a página de Docentes

| Elemento | `/docentes` | `/atribuicao` |
|---|---|---|
| Tabela principal | `aca_docente` | `aca_docente_modulo_componente_ciclo` |
| Orquestrador | `pages/docentes/index.vue` | `pages/atribuicao/index.vue` |
| Componente principal | 4 tabs (Editais, Seleção, Docentes, Currículos) | `AtribuicaoPage.vue` (página única) |
| Modal principal | `ModalVinculosDocente.vue` (vincular docente a componente) | `ModalAtribuirDocente.vue` (atribuir docente a ciclo+componente) |
| Propósito | Quem pode dar aula de quê | Quem dá aula de quê em qual ciclo |
| Escopo | Geral (componente) | Específico (ciclo + componente) |
| Papel | Apenas elegível (booleano) | Titular / Substituto / Auxiliar |

---

## Dependências com outras partes do sistema

### Reusa
- `anoSemestre.ts` (utils) — geração da lista de anos/semestres
- `aca_docente` — cadastro de docentes (tabela existente)
- `aca_docente_vinculo` — vínculos docente × componente (tabela existente)
- `aca_modulo_componente` — componentes de cada módulo (tabela existente)
- `aca_ciclo`, `aca_ciclo_programa`, `aca_programa` — estrutura acadêmica (tabelas existentes)
- `user_expandido` — nomes e emails dos docentes
- Contrato visual (bg, cards, badges, modais) — mesmo das páginas admin

### Nova infraestrutura criada
- Tabela `aca_docente_modulo_componente_ciclo` (migration 00000)
- Coluna `id_atribuicao_docente` em `aca_calendario` (migration 00000)
- 7 RPCs de atribuição (migrations 00001 a 00012)
- RLS policies para tabelas acadêmicas (migration 00004)
- 4 BFFs em `server/api/atribuicao/`
- 1 composable em `composables/atribuicao/`
- 2 componentes em `components/atribuicao/`
- Página orquestradora em `pages/atribuicao/index.vue`

---

## Histórico de Mudanças

### 2026-07-24 — Redesign Visual (facelift premium)

**`AtribuicaoPage.vue`** — Cards e componentes:
- Card de ciclo convertido ao padrão premium: `bg rgba(255,255,255,0.025)`, `border-radius 14px`, accent bar violet no topo (`opacity 0 → 1` no hover)
- Filtros refinados com selects estilizados, caret SVG inline e labels `9px/900/uppercase`
- Rows de componente com **accent bar índigo lateral** (`#6366f1 → #818cf8`), visível no hover do row
- Badges de docente atribuído convertidos para **pill com dot colorido** por tipo (titular verde, substituto âmbar, auxiliar azul)
- Botão "Atribuir" **oculto em repouso**, aparece no hover do row — sem poluição visual
- Empty states com ícone centralizado e sub-label uppercase

**`ModalAtribuirDocente.vue`** — Modal de seleção:
- Overlay com `backdrop-filter blur(4px)` e painel com `box-shadow 0 32px 80px rgba(0,0,0,0.6)`
- Card de docente selecionado: accent bar violet lateral + `translateY(-1px)` + sombra glow
- Checkbox premium: gradiente violet `#7c3aed → #8b5cf6` com `box-shadow glow` quando ativo
- Seletor de papel em pill violet com `text-transform uppercase`
- Badge "já atribuído" convertido para pill com dot colorido
- Botão Confirmar com gradiente `#7c3aed → #8b5cf6`, hover `translateY(-1px)` e sombra expandida

---

### 2026-07-24 — Criação da página

**Banco de dados:**
- Migration `00000`: Cria `aca_docente_modulo_componente_ciclo` (id_ciclo, id_modulo_componente, id_docente, tipo) com RLS + coluna `id_atribuicao_docente` em `aca_calendario`
- Migration `00001`: RPCs `aca_listar_atribuicoes`, `aca_atribuir_docente_ciclo`, `aca_remover_atribuicao_docente`, `aca_get_modulos_componentes_por_programa`, `aca_get_docentes_por_entidade`
- Migration `00004`: RLS para tabelas acadêmicas sem políticas
- Migration `00005`: RPC `aca_get_programas_com_ciclos` com filtro por ano_semestre

**BFFs (server/api/atribuicao/):**
- `index.ts` — GET (programas + docentes), POST (atribuir), DELETE (remover)
- `programa.get.ts` — GET estrutura completa de um programa

**Composable:**
- `useAtribuicao.ts` — fetch de dados, fetch de ciclos, atribuir/remover docente, filtro por vinculos

**Componentes:**
- `AtribuicaoPage.vue` — página completa: filtro ano/semestre, dropdown programa, cards de ciclo com componentes e docentes atribuídos, botões de ação
- `ModalAtribuirDocente.vue` — modal de busca + seleção visual + escolha de papel

**Página:**
- `pages/atribuicao/index.vue` — orquestrador com initSession, fetchDadosIniciais
- `layouts/base.vue` — adicionado pageTitle para rota `/atribuicao`

**Correções (migrations 00002 a 00012):**
- `00002`: Fix `nome` → `nome_componente` nas RPCs de vínculo
- `00003`: Fix `ORDER BY comp.nome_componente` → `ORDER BY sub.componente_nome` + remove `carga_horaria` de `aca_componente`
- `00006`: Fix `DISTINCT + ORDER BY` na RPC de programas
- `00007-00010`: Fix `aca_get_docentes_por_entidade` — SECURITY DEFINER + SET search_path + GRANT EXECUTE + DROP de assinatura duplicada
- `00011-00012`: Fix `aca_atribuir_docente_ciclo` — resolve user_expandido por auth.uid(), DROP de assinatura com p_usuario_id
