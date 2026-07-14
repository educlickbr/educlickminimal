# Página Minhas Inscrições (`/minhas-inscricoes`)

## Visão Geral

Tela do **aluno** para acompanhar suas inscrições em processos seletivos:

- **Cards de inscrição** — programa, oferta, data da inscrição, badges de avaliação
- **Badges de status** — 3 badges compactos (Dados, Documentação, Candidatura) com cores semânticas
- **Badge de situação geral** — ✅ Ativa / ❌ Encerrada / ⏳ Em análise
- **Filtros** — ano/semestre (algarismos romanos), programa (client-side), busca por nome do programa
- **Empty state** — mensagem + link "Ver processos seletivos disponíveis"
- **Grid responsivo** — 1 col (mobile) / 2 col (desktop)

**Rota:** `/minhas-inscricoes` | **Layout:** `base` | **Orquestrador:** `pages/minhas-inscricoes/index.vue`

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/minhas-inscricoes/index.vue                     ← orquestrador (~60 linhas)
app/components/minhas-inscricoes/
└── MinhasInscricoesList.vue                                ← cards + filtros + paginação
app/composables/minhas-inscricoes/
└── useMinhasInscricoes.ts                                  ← inscrições, filtros, paginação
server/api/minhas-inscricoes/
├── index.get.ts                                            ← GET inscrições do aluno logado
└── detalhes.get.ts                                         ← GET detalhes da inscrição (opcional)
```

### Estrutura de diretórios

```
front_end/app/
├── pages/minhas-inscricoes/index.vue
├── components/minhas-inscricoes/
│   └── MinhasInscricoesList.vue
├── composables/minhas-inscricoes/
│   └── useMinhasInscricoes.ts

server/api/minhas-inscricoes/
├── index.get.ts
└── detalhes.get.ts

supabase/migrations/
└── 20260713000000_rpc_aca_get_inscricoes_aluno.sql        ← RPC com filtro por usuário
```

---

## Fluxo de Dados

```
1. Aluno acessa /minhas-inscricoes
2. store.initSession() → resolve entidade + user_expandido_id
3. GET /api/minhas-inscricoes?id_entidade=X&ano_semestre=26Is&busca=Z&page=1&limit=20
   → BFF extrai id_usuario da sessão
   → RPC aca_get_inscricoes_aluno(p_id_entidade, p_id_usuario, p_ano_semestre, p_busca, p_pagina, p_limite)
     → aca_processo_seletivo_inscricoes
       JOIN user_expandido (dados do aluno)
       JOIN aca_processo_seletivo (nome_processo)
       JOIN aca_programa (descricao)
     → retorna { itens[], total, pagina, limite }
4. Cards renderizados com programa_descricao, nome_processo, data_inscricao, status_inscricao,
   status_dados, status_documentacao, status_candidatura
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/minhas-inscricoes` | → BFF → RPC `aca_get_inscricoes_aluno` |
| `GET` | `/api/minhas-inscricoes/detalhes` | → query + RPCs (opcional, para modal) |

### Parâmetros — `GET /api/minhas-inscricoes`

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id_entidade` | UUID | Obrigatório |
| `ano_semestre` | string | Filtro opcional (ex: `26Is`) |
| `busca` | string | Filtro opcional (nome do programa) |
| `page` | int | Padrão 1 |
| `limit` | int | Padrão 20 |

> O BFF extrai automaticamente o `id_usuario` da sessão do usuário logado. O aluno só vê suas próprias inscrições.

### Parâmetros — `GET /api/minhas-inscricoes/detalhes`

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id_inscricao` | UUID | Obrigatório |

---

## Lógica de Negócio

### Filtro por usuário
O BFF obtém o `user_expandido.id` a partir da sessão (`auth.getSession()`) e passa como `p_id_usuario` para a RPC. O aluno só vê inscrições que ele mesmo fez.

### Badges de avaliação (3 status herdados de Processos)
- **Dados**: pendente (âmbar) / aprovado (verde) / reprovado (vermelho)
- **Documentação**: pendente (âmbar) / aprovado (verde) / reprovado (vermelho)
- **Candidatura**: pendente (âmbar) / aprovado (verde) / reprovado (vermelho)

### Badge de situação geral da inscrição
- **Ativa** (status_inscricao = 'inscrito' ou 'em_analise') → badge verde "Ativa"
- **Encerrada** (status_inscricao = 'aprovado' ou 'reprovado') → badge vermelho "Encerrada"
- **Pendente** (status_inscricao = 'pendente') → badge âmbar "Pendente"

> Os status de avaliação (Dados, Documentação, Candidatura) são **somente leitura** para o aluno — exibidos para consulta, diferente da tela administrativa de Processos que permite avaliação.

### Ano/Semestre (mesma convenção de Processos)
- Formato: `26Is` (ano 26, semestre I = 1º), `26IIs` (semestre II = 2º)
- Utils `anoSemestre.ts` já existente: `getAnoSemestreAtual()`, `getSemestresParaDrop(3)`

### Paginação
- 20 itens por página
- Scroll interno na área de cards
- Paginação fixa no rodapé
- Reset para página 1 ao mudar filtros

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `loading` | Spinner centralizado (mesmo padrão de Meus Cursos) |
| `inscricoes.length === 0` | Empty state com ícone + "Nenhuma inscrição encontrada" + link `/processos-seletivos` |
| `total > 0` | Paginação visível no rodapé |
| Normal | Grid de cards com badges de avaliação |

---

## Contrato Visual

- **Layout**: `base` com sidebar (mesmo das outras páginas)
- **Cards**: `bg-[#0f0f17] border border-white/5 rounded-xl` com hover `border-primary/30` ← herdado de ambas
- **Accent bar**: `h-1 bg-gradient-to-r from-primary to-purple-500` ← herdado de Meus Cursos
- **Badges de avaliação**: `text-[8px]` com cores semânticas (âmbar/verde/vermelho) ← herdado de Processos
- **Badge situação geral**: formato mais visível (texto maior) para status consolidado
- **Grid**: `grid-cols-1 md:grid-cols-2 gap-4` ← herdado de Meus Cursos
- **Select**: customizado com seta violeta (SVG inline) ← herdado de Processos

---

## Componentes

| Componente | Props | Emits | Descrição |
|---|---|---|---|
| `MinhasInscricoesList` | `ctx` (composable) | — | Cards + filtros + paginação. Versão simplificada de `ProcessosTabInscritos`, sem abas de área e sem botões de ação administrativa |

---

## Dependências

### Reutiliza de Processos
- Utils `anoSemestre.ts` → `getAnoSemestreAtual()`, `getSemestresParaDrop(3)`
- Mesma convenção de badges de status (Dados, Documentação, Candidatura)
- Mesmo padrão de cores semânticas para badges

### Reutiliza de Meus Cursos
- Mesmo padrão de grid responsivo
- Mesmo contrato visual de cards (bg, border, hover, accent bar)
- Mesma lógica de extração de `id_usuario` da sessão no BFF

### Nova RPC necessária
- `aca_get_inscricoes_aluno` — similar a `aca_get_inscricoes_filtradas`, mas filtra por `p_id_usuario` (aluno logado) em vez de `p_id_area`, e retorna campos de status de avaliação

---

## Histórico de Mudanças

### 2026-07-13 — Criação da página

- **Página:** `pages/minhas-inscricoes/index.vue` — layout base, fetch de inscrições do aluno logado
- **Componente:** `MinhasInscricoesList.vue` — cards com badges de avaliação + filtros + paginação
- **Composable:** `useMinhasInscricoes.ts` — estado e lógica de busca, filtros, paginação
- **BFF:** `index.get.ts` — extrai `id_usuario` da sessão e filtra por ele
- **RPC:** `aca_get_inscricoes_aluno` — inscrições do aluno com paginação e filtros
