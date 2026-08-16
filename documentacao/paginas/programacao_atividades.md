# Página Programação de Atividades (`/programacao_atividades`)

## Visão Geral

Tela **administrativa** para gestão de conteúdo educacional (LMS) com pipeline de três etapas:

- **Repositório** — cadastro de conteúdos (material / atividade / avaliação) e blocos organizadores
- **Distribuição** — blueprint: associa conteúdos a Áreas, Cursos, Módulos e Componentes (sem datas, sem execução)
- **Currículo** — execução: seleciona um programa e ativa/desativa/destaca conteúdos por escopo (programa, componente, módulo/ciclo, aula)

**Rota:** `/programacao_atividades` | **Layout:** `base` | **Orquestrador:** `pages/programacao_atividades/index.vue` (~57 linhas)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/programacao_atividades/index.vue                ← orquestrador (tabs: repositório/distribuição/currículo)
app/components/programacao_atividades/
├── ProgAtividadesTabRepositorio.vue                      ← aba 1: CRUD de conteúdos + blocos
├── ProgAtividadesTabDistribuicao.vue                     ← aba 2: blueprint (área/curso/módulo/componente)
├── ProgAtividadesTabCurriculo.vue                        ← aba 3: execução por programa (árvore + painel)
├── ModalProgAtividadesConteudo.vue                       ← modal de conteúdo (3 passos: geral/perguntas/blocos)
├── ModalProgAtividadesBloco.vue                          ← modal de bloco organizador
├── ConteudoRow.vue                                       ← linha de conteúdo (toggle + destaque + abrir arquivo)
└── UploadArquivo.vue                                     ← upload R2 reutilizável
app/composables/programacao_atividades/
├── useProgAtividadesCore.ts                              ← entidade ativa + toast + init
├── useProgAtividadesRepositorio.ts                       ← CRUD conteúdos/blocos + busca/filtros + salvar avaliação
├── useProgAtividadesDistribuicao.ts                      ← escopos + associação toggle inline
└── useProgAtividadesCurriculo.ts                         ← programa + estrutura lazy + escopo alvo + radio/toggle
server/api/programacao_atividades/
├── conteudos.get.ts / .post.ts / .delete.ts              ← CRUD de conteúdos
├── blocos.get.ts / .post.ts / .delete.ts                 ← CRUD de blocos
├── bloco_itens.get.ts                                    ← itens do bloco
├── conteudo_bloco.post.ts / .delete.ts                   ← associação N:N conteúdo↔bloco
├── avaliacao.get.ts                                      ← GET avaliação completa (perguntas + alternativas)
├── avaliacao.post.ts                                     ← POST salva avaliação + perguntas
├── distribuicao/
│   ├── escopos.get.ts                                    ← lista itens do escopo (área/curso/módulo/componente)
│   └── index.get.ts / .post.ts / .delete.ts              ← listar/associar/desassociar distribuição
└── curriculo/
    ├── programas.get.ts                                  ← programas para o dropdown
    ├── index.get.ts                                      ← estrutura do currículo (lazy)
    ├── conteudos.get.ts                                  ← conteúdos de um escopo (lazy)
    ├── ativos.get.ts                                     ← linhas operacionais do programa (id_ciclo/calendario NULL)
    ├── index.post.ts                                     ← upsert operacional (associar/ativo/destaque)
    └── index.delete.ts                                   ← remover operacional
supabase/migrations/
├── 20260727100000_create_lms_tables.sql                  ← 12 tabelas + RLS
├── 20260727100001_create_lms_rpc_blocos.sql              ← RPCs de blocos
├── 20260727100002_refactor_lms_conteudo.sql              ← conteúdo solto + lms_conteudo_bloco N:N
├── 20260727100003_create_lms_rpc_conteudos.sql           ← RPCs de conteúdos
├── 20260727100004_fix_lms_conteudo_sem_timing.sql        ← timing movido p/ operacional
├── 20260727100005_drop_and_recreate_lms_rpcs.sql         ← assinaturas novas
├── 20260727100006_remove_id_bloco_from_distribuicao.sql ← remove id_bloco da distribuição
├── 20260727100007_create_lms_rpc_distribuicao.sql        ← RPCs de distribuição
├── 20260727100008_fix_lms_list_conteudos_filtros.sql     ← filtros (busca/tipo/só meus)
├── 20260727100009_fix_lms_list_conteudos_criador.sql     ← filtro criador
├── 20260727100010_drop_and_recreate_all_lms_rpcs_v2.sql  ← refactor geral
├── 20260727100011_fix_lms_list_conteudos_nome_completo.sql
├── 20260727100012_add_destaque_to_operacional.sql        ← coluna destaque no operacional
├── 20260727100014_fix_unique_operacional.sql             ← índice único funcional (NULLs)
├── 20260727100015_create_lms_rpc_curriculo.sql           ← RPCs de currículo (upsert/delete operacional)
├── 20260727100016_refactor_lms_curriculo_v2.sql
├── 20260727100017_fix_lms_list_curriculo_order_by.sql    ← ORDER BY sub.titulo
├── 20260727100018_fix_lms_list_curriculo_outer_refs.sql  ← aliases externos (ciclo_json/aula_json)
├── 20260727100019_fix_lms_list_curriculo_componentes_filter.sql ← componentes do curso do programa
├── 20260729100000_refactor_lms_curriculo_lazy.sql        ← lazy: estrutura + conteudos por escopo
├── 20260729100001_add_programa_escopo.sql                ← escopo 'programa' na RPC de conteúdos
├── 20260806100000_create_lms_rpc_avaliacao.sql           ← RPCs de avaliação completa (GET + UPSERT)
├── 20260806100001_fix_lms_upsert_avaliacao_completa.sql  ← fix alias value AS p (jsonb_array_elements)
├── 20260806100002_fix_lms_get_avaliacao_completa.sql     ← fix criado_em no ORDER BY das subqueries
└── 20260806100003_add_audit_cols_operacional.sql         ← modificado_por/modificado_em no operacional
```

---

## Fluxo de Dados

### Aba Repositório — listar conteúdos
```
GET /api/programacao_atividades/conteudos?id_entidade=X&page=1&limit=200&busca=&tipo=&criado_por=
  → RPC lms_list_conteudos(p_id_entidade, p_page, p_limit, p_busca, p_tipo, p_criado_por)
    → lms_conteudo
      LEFT JOIN global_arquivos (id_arquivo)
      LEFT JOIN user_expandido (criado_por_nome)
      LEFT JOIN lms_conteudo_bloco + lms_bloco (blocos[])
    → retorna { itens[{ id, titulo, tipo, descricao, id_arquivo, url, criado_por_nome, criado_em, blocos[] }], qtd_total, pagina_atual }
```

### Aba Repositório — criar/editar conteúdo
```
POST /api/programacao_atividades/conteudos { id?, id_entidade, tipo, titulo, descricao, id_arquivo?, url?, usuario_id }
  → RPC lms_upsert_conteudo(...)
    → UPSERT em lms_conteudo
    → retorna { success, id }
```

### Aba Repositório — salvar questionário (avaliação + perguntas)
```
POST /api/programacao_atividades/avaliacao { id_conteudo, id_entidade, nome, descricao, perguntas[], usuario_id }
  → RPC lms_upsert_avaliacao_completa(...)
    → UPSERT lms_avaliacao (1:1 com conteúdo, ON CONFLICT id_conteudo)
    → REPLACE: DELETE lms_pergunta (CASCADE apaga alternativas) + INSERT novas
    → retorna { success, id, qtd_perguntas }

GET /api/programacao_atividades/avaliacao?id_conteudo=X&id_entidade=Y
  → RPC lms_get_avaliacao_completa(...)
    → lms_avaliacao JOIN lms_conteudo (valida entidade)
    → lms_pergunta + subquery lms_resposta_possivel (alternativas[])
    → retorna { avaliacao{ id, nome, descricao, ordem_perguntas }, perguntas[{ id, tipo, enunciado, pontuacao, obrigatoria, ordem, alternativas[{ id, texto, correta }] }] }
```

### Aba Distribuição — escopos
```
GET /api/programacao_atividades/distribuicao/escopos?tipo_escopo=area|curso|modulo|componente&id_entidade=X
  → RPC lms_list_escopos(p_tipo_escopo, p_id_entidade)
    → aca_area / aca_curso / aca_modulo / aca_componente
    → retorna { itens[{ id, nome, descricao }] }
```

### Aba Distribuição — associar conteúdo a um escopo
```
POST /api/programacao_atividades/distribuicao { id_entidade, id_conteudo, id_area | id_curso | id_modulo | id_componente, usuario_id }
  → RPC lms_upsert_distribuicao(...)
    → INSERT em lms_distribuicao (CHECK garante exatamente um escopo)
    → retorna { success, id }
```

### Aba Currículo — estrutura do programa (lazy)
```
GET /api/programacao_atividades/curriculo?id_programa=X&id_entidade=Y
  → RPC lms_get_curriculo_estrutura(p_id_programa, p_id_entidade)
    → aca_programa JOIN aca_curso (programa)
    → aca_area (área, se houver)
    → aca_componente via aca_modulo_componente + aca_curso_modulo (componentes do curso)
    → aca_curso_modulo JOIN aca_modulo (módulos)
    → aca_ciclo via aca_ciclo_programa (ciclos do programa)
    → aca_calendario via ciclos (aulas)
    → retorna { programa, area, componentes[], modulos[], ciclos[], aulas[] }
```

### Aba Currículo — conteúdos de um escopo (lazy)
```
GET /api/programacao_atividades/curriculo/conteudos?id_programa=X&id_entidade=Y&escopo_tipo=programa|area|componente|modulo|ciclo|calendario&escopo_id=Z
  → RPC lms_get_curriculo_conteudos(...)
    → programa: lms_conteudo_operacional (sem ciclo/calendario)
    → area/componente/modulo: lms_distribuicao + LEFT JOIN operacional (herança)
    → ciclo/calendario: lms_conteudo_operacional (com vínculo)
    → retorna { conteudos[{ id_conteudo, titulo, tipo, id_arquivo, url, ativo, destaque, herdado, op_id }] }
```

### Aba Currículo — associar / ativar / destacar (painel direito)
```
RADIO (associação):
  POST /api/programacao_atividades/curriculo { id_entidade, id_conteudo, id_programa | id_ciclo | id_calendario, ativo:true, usuario_id }
    → RPC lms_upsert_operacional(...) — cria linha (override)
  DELETE /api/programacao_atividades/curriculo { id: op_id, id_entidade }
    → RPC lms_delete_operacional(...) — remove linha (volta à herança = ativo)

TOGGLE (visibilidade):
  POST /api/programacao_atividades/curriculo { id_entidade, id_conteudo, id_programa | id_ciclo | id_calendario, ativo: !atual, usuario_id }
    → RPC lms_upsert_operacional(...) — ON CONFLICT atualiza a linha existente

⚠️ CONSTRAINT EXCLUSIVA: exatamente UM de (id_programa, id_ciclo, id_calendario) preenchido.
   Ciclo/aula substituem o programa no body (helper montarBodyOperacional).
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/programacao_atividades/conteudos` | → RPC `lms_list_conteudos` |
| `POST` | `/api/programacao_atividades/conteudos` | → RPC `lms_upsert_conteudo` |
| `DELETE` | `/api/programacao_atividades/conteudos` | → RPC `lms_delete_conteudo` |
| `GET` | `/api/programacao_atividades/blocos` | → RPC `lms_list_blocos` |
| `POST` | `/api/programacao_atividades/blocos` | → RPC `lms_upsert_bloco` |
| `DELETE` | `/api/programacao_atividades/blocos` | → RPC `lms_delete_bloco` |
| `GET` | `/api/programacao_atividades/bloco_itens` | → RPC `lms_list_bloco_itens` |
| `POST` | `/api/programacao_atividades/conteudo_bloco` | → RPC `lms_associar_conteudo_bloco` (2 params) |
| `DELETE` | `/api/programacao_atividades/conteudo_bloco` | → RPC `lms_desassociar_conteudo_bloco` |
| `GET` | `/api/programacao_atividades/avaliacao` | → RPC `lms_get_avaliacao_completa` |
| `POST` | `/api/programacao_atividades/avaliacao` | → RPC `lms_upsert_avaliacao_completa` |
| `GET` | `/api/programacao_atividades/distribuicao/escopos` | → RPC `lms_list_escopos` |
| `GET` | `/api/programacao_atividades/distribuicao` | → RPC `lms_list_distribuicoes` |
| `POST` | `/api/programacao_atividades/distribuicao` | → RPC `lms_upsert_distribuicao` |
| `DELETE` | `/api/programacao_atividades/distribuicao` | → RPC `lms_delete_distribuicao` |
| `GET` | `/api/programacao_atividades/curriculo/programas` | → RPC `lms_list_programas_para_curriculo` |
| `GET` | `/api/programacao_atividades/curriculo` | → RPC `lms_get_curriculo_estrutura` |
| `GET` | `/api/programacao_atividades/curriculo/conteudos` | → RPC `lms_get_curriculo_conteudos` |
| `GET` | `/api/programacao_atividades/curriculo/ativos` | → query direta `lms_conteudo_operacional` (programa) |
| `POST` | `/api/programacao_atividades/curriculo` | → RPC `lms_upsert_operacional` |
| `DELETE` | `/api/programacao_atividades/curriculo` | → RPC `lms_delete_operacional` |

---

## Composables

| Composable | Responsabilidade |
|---|---|
| `useProgAtividadesCore` | Entidade ativa (`getEntidadeAtivaId`, `garantirEntidade`) + instância do toast |
| `useProgAtividadesRepositorio` | CRUD de conteúdos e blocos, busca, filtro por tipo, "só meus", paginação, modal de conteúdo (3 passos), salvar avaliação+perguntas após conteúdo |
| `useProgAtividadesDistribuicao` | Sub-abas de escopo (área/curso/módulo/componente), lista de itens do escopo, conteúdos com status de associação, filtros (tipo/só meus/associados/disponíveis), toggle inline |
| `useProgAtividadesCurriculo` | Programas, estrutura lazy (árvore), conteúdos por escopo sob demanda (`conteudosMap`), escopo alvo para adicionar, **radio (associação) + toggle (ativo)** no painel, helper `montarBodyOperacional` (constraint exclusiva) |

---

## Componentes

| Componente | Props | Emits | Descrição |
|---|---|---|---|
| `ProgAtividadesTabRepositorio` | `ctx: UseRepositorioReturn` | — | Lista de conteúdos com filtros, cards com criador/data, modais de conteúdo e bloco |
| `ProgAtividadesTabDistribuicao` | `ctx: UseDistribuicaoReturn` | — | 2 colunas: escopos à esquerda, conteúdos com toggle de associação à direita |
| `ProgAtividadesTabCurriculo` | `ctx: UseCurriculoReturn` | — | 2 colunas: árvore acordeon (programa → componentes → módulos/ciclos → aulas) + navegador de conteúdos com **radio de associação** + **toggle de visibilidade** |
| `ModalProgAtividadesConteudo` | `modelValue`, `isEdit`, `initialData`, `onSave`, `blocosDisponiveis`, `blocosSelecionados`, `abaAtiva`, `getEntidadeId` | `update:modelValue`, `saved`, `update:blocosSelecionados`, `update:abaAtiva` | Modal 3 passos: geral → perguntas (só avaliação, carrega/salva via `/avaliacao`) → blocos |
| `ModalProgAtividadesBloco` | `modelValue`, `isEdit`, `initialData`, `onSave` | `update:modelValue`, `saved` | Criação/edição de bloco organizador |
| `ConteudoRow` | `item: ConteudoItem` | `toggle`, `destaque` | Linha de conteúdo na árvore: toggle ativo, tipo, título, abrir arquivo (R2 assinado), destaque ⭐, badge Blueprint |
| `UploadArquivo` | `fileId`, `onUploaded`, `onRemoved` | `update:fileId` | Upload R2 reutilizável com nome original e abrir arquivo |

---

## Lógica de Negócio

### Decisões de arquitetura

1. **Conteúdo solto** — `lms_conteudo` não precisa estar dentro de bloco. Bloco é organizador opcional via `lms_conteudo_bloco` (N:N)
2. **Sem timing no Repositório** — conteúdo é perene. Datas/prazos pertencem ao `lms_conteudo_operacional` (Currículo)
3. **Distribuição sem datas** — blueprint puro: mapa conteúdo → escopo. Sem data de entrega (não é executivo)
4. **Herança no Currículo** — sem linha em `lms_conteudo_operacional` = herdado = ativo. Com linha = override (ativo/destaque)
5. **Toggle inline na Distribuição** — sem modal: checkbox violeta direto na linha
6. **Acordeon no Currículo** — Programa → Componentes → Módulos/Ciclos → Aulas, com lazy loading por nível
7. **Escopo alvo** — botão "Adicionar" em cada seção define o escopo; associação no painel respeita a constraint exclusiva
8. **Radio + Toggle no painel do Currículo** — radio = associação (cria/remove linha), toggle = visibilidade (aluno vê ou não); sem linha = herdado = visível
9. **Questionário REPLACE** — salvar avaliação apaga e reinsere perguntas (aceitável enquanto não há submissões; migrar para diff quando existirem)

### Tabelas principais

```sql
lms_conteudo                -- conteúdo perene (material/atividade/avaliação)
  id, id_entidade, tipo, titulo, descricao, ordem,
  id_arquivo → global_arquivos, url,
  ativo, criado_por, criado_em

lms_bloco                   -- organizador opcional
  id, id_entidade, titulo, descricao, cor_ident, criado_por, criado_em

lms_conteudo_bloco          -- N:N conteúdo ↔ bloco
  id, id_conteudo, id_bloco
  UNIQUE (id_conteudo, id_bloco)

lms_avaliacao               -- 1:1 com lms_conteudo (tipo = 'avaliacao')
  id, id_conteudo UNIQUE, nome, descricao,
  id_arquivo_referencia, ordem_perguntas ('fixa'|'aleatoria'),
  criado_em, modificado_em

lms_pergunta                -- perguntas do questionário
  id, id_avaliacao CASCADE, tipo ('dissertativa'|'multipla_escolha'),
  enunciado, pontuacao, obrigatoria, ordem, id_arquivo,
  criado_em, modificado_em

lms_resposta_possivel       -- alternativas da múltipla escolha
  id, id_pergunta CASCADE, texto, correta, ordem, id_arquivo, criado_em

lms_distribuicao            -- blueprint: conteúdo → escopo
  id, id_entidade, id_conteudo,
  id_area | id_curso | id_modulo | id_componente,   -- CHECK: exatamente 1
  ativo, criado_por, criado_em
  UNIQUE funcional (id_conteudo + escopo)

lms_conteudo_operacional    -- execução: override por programa
  id, id_entidade, id_conteudo,
  id_programa | id_ciclo | id_calendario,           -- CHECK: exatamente 1
  id_distribuicao_origem, ativo, destaque,
  criado_por, criado_em, modificado_por, modificado_em   -- (auditoria)
  UNIQUE funcional (id_conteudo, id_programa, id_ciclo, id_calendario)
```

### Tabelas complementares (submissões — criadas, uso futuro)

```sql
lms_submissao_atividade     -- envio do aluno (arquivo/texto), tentativa, status, datas
lms_submissao_avaliacao     -- início/término por tentativa; UNIQUE (id_bloco_item, id_matricula, tentativa)
lms_resposta_aluno          -- resposta por pergunta (id_resposta_possivel ou texto)
lms_progresso_aluno         -- progresso por conteúdo/aluno
```

### RLS (tenant + aluno)

- **Gestor** (membro da entidade): acesso via helper `lms_usuario_pertence_entidade(id_entidade)`
- **Aluno** (com matrícula): acesso somente ao próprio conteúdo via `lms_usuario_eh_gestor` / matrícula vinculada
- `lms_avaliacao`/`lms_pergunta`/`lms_resposta_possivel`: gestor all via EXISTS em `lms_conteudo.id_entidade`

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `!programaSelecionado` (Currículo) | Empty state "Selecione um programa" |
| `loadingEstrutura` | Spinner centralizado na coluna esquerda |
| `loadingConteudos` (escopo) | Spinner pequeno dentro do acordeon |
| Acordeon fechado | Apenas trigger com contador de itens |
| Acordeon aberto sem conteúdos | Botão "Adicionar" com ícone `+` |
| Escopo alvo ativo | Barra "Escopo alvo" violeta com botão Cancelar (X) |
| Conteúdo com arquivo | Ícone de arquivo → abre URL assinada do R2 em nova aba |
| Conteúdo herdado (sem linha) | Radio desmarcado + toggle "Visível" ligado |
| Conteúdo associado e ativo | Radio marcado + toggle "Visível" ligado + accent bar violet |
| Conteúdo associado e oculto | Radio marcado + toggle "Oculto" + título riscado/esmaecido |
| Conteúdo destacado | Estrela ★ âmbar + fundo âmbar sutil |
| Toast (sucesso/erro) | Notificação inferior direita por 3s |

---

## Contrato Visual Aplicado

(mesmo design system das demais páginas admin — padrão conquistado em `/academico_oferta`, `/atribuicao`, `/meus-processos`)

### Layout 2 colunas (Distribuição e Currículo)

- **Coluna esquerda** (`w-80`): lista de escopos / árvore acordeon — `bg rgba(255,255,255,0.015) border rgba(255,255,255,0.05) rounded-2xl`
- **Coluna direita** (`flex-1`): navegador de conteúdos com barra de busca e filtros
- **Acordeon**: trigger `bg rgba(255,255,255,0.02)` hover `bg rgba(139,92,246,0.05)`; sub-níveis com `font-size 11px` e indentação com `border-left rgba(255,255,255,0.05)`
- **Ícones de pasta** em SVG violet (`text-violet-400`) — substituem emojis
- **Chips de tipo**: Material azul (`#93c5fd`), Atividade verde (`#6ee7b7`), Avaliação laranja (`#fdba74`)
- **Botão "Adicionar"**: `border 1px dashed rgba(255,255,255,0.06)` com ícone `+`; ativo (escopo alvo) → borda violeta + "Cancelar" com `X`
- **Barra de busca**: `bg rgba(255,255,255,0.015)` com lupa SVG posicionada
- **Assoc row (painel direito)**: radio à esquerda (checkbox violeta `#8b5cf6` quando marcado), toggle switch à direita com label "Visível"/"Oculto"; título riscado (`line-through` + `opacity 0.4`) quando oculto
- **Escopo alvo**: badge violeta com label "Escopo alvo" + botão Cancelar vermelho suave

### Modal de Conteúdo (3 passos)

- **Steps numerados** com bolhas (`step--done` com check, `step--future` cinza); aba "Perguntas" só aparece para tipo `avaliacao`
- Overlay `rgba(0,0,0,0.82)` + painel `bg #13131a border rgba(139,92,246,0.2) rounded-18px`
- Upload de arquivo com componente `UploadArquivo` (R2 + `global_arquivos`)
- **Perguntas**: card por pergunta, tipo (dissertativa/múltipla escolha), pontuação, obrigatória; alternativas com radio "Correta" (`:checked` + `@change` — v-model em radio booleano não funciona)
- Botão Confirmar gradiente `#7c3aed → #8b5cf6` com glow

---

## Dependências com outras partes do sistema

### Reusa
- `global_arquivos` + R2 (Bunny/Worker) — upload e URL assinada via `/api/r2/sign`
- `aca_area`, `aca_curso`, `aca_modulo`, `aca_componente`, `aca_curso_modulo`, `aca_modulo_componente` — escopos de distribuição
- `aca_programa`, `aca_ciclo`, `aca_ciclo_programa`, `aca_calendario` — estrutura de execução
- `user_entidades`, `user_expandido` — tenant e criador
- `useToast` — notificações

### Nova infraestrutura criada
- 12 tabelas `lms_*` (migration 00000) com RLS completo
- ~17 RPCs de repositório, blocos, avaliação, distribuição e currículo (migrations 00001 a 00030 + 06/08)
- 3 RLS helpers: `lms_usuario_pertence_entidade`, `lms_usuario_eh_gestor`, `lms_user_expandido_id`
- 20 BFFs em `server/api/programacao_atividades/`
- 4 composables em `composables/programacao_atividades/`
- 7 componentes em `components/programacao_atividades/`
- Página orquestradora em `pages/programacao_atividades/index.vue`

---

## Histórico de Mudanças

### 2026-08-06 — Questionários completos + radio/toggle no Currículo + fixes

**Banco:**
- Migration `00000` (06/08): RPCs `lms_get_avaliacao_completa` e `lms_upsert_avaliacao_completa` (REPLACE de perguntas)
- Migration `00001` (06/08): fix `lms_upsert_avaliacao_completa` — `SELECT value AS p FROM jsonb_array_elements(...)` (alias correto; `AS p` direto criava campo `value`)
- Migration `00002` (06/08): fix `lms_get_avaliacao_completa` — `criado_em` adicionado aos SELECTs das subqueries (ORDER BY referenciava campo inexistente)
- Migration `00003` (06/08): `modificado_por`/`modificado_em` na `lms_conteudo_operacional` — RPC já gravava, colunas não existiam (erro 500 ao associar)

**Frontend:**
- `ModalProgAtividadesConteudo`: **carrega perguntas** ao editar avaliação (via GET `/avaliacao`) e **envia perguntas** no save (via POST `/avaliacao` após salvar conteúdo)
- Radio "Correta" das alternativas: `v-model` booleano em `<input type="radio">` não funciona — trocado por `:checked` + `@change` + função `marcarCorreta` (garante só uma correta)
- `conteudo_bloco.post.ts`: removido `p_ordem` — função no banco tem 2 params (causava "function not found")
- **Painel do Currículo**: separadas associação e visibilidade — **radio** à esquerda (cria/remove linha) + **toggle switch** "Visível/Oculto" (aluno vê ou não); sem linha = herdado = visível; título riscado quando oculto
- `montarBodyOperacional`: constraint exclusiva respeitada — ciclo/aula **substituem** id_programa no body (soma = 1)
- Limpeza: removidos `ModalProgAtividadesDistribuicao.vue` (não usado) e `.bak`/`.bak2`; `config.toml` `project_id` corrigido (`oto_nuxt` → `educlickminimal`)

### 2026-07-29 — Currículo lazy + escopo alvo + abrir arquivo

**Banco:**
- Migration `00030` (`20260729100000_refactor_lms_curriculo_lazy.sql`): DROP `lms_list_curriculo` (pesada); novas RPCs `lms_get_curriculo_estrutura` e `lms_get_curriculo_conteudos` (escopo `programa` adicionado em migration complementar)
- Migration `20260729100001_add_programa_escopo.sql`: escopo `'programa'` na RPC de conteúdos

**Frontend:**
- `useProgAtividadesCurriculo`: lazy loading por nível (conteudosMap), helpers `aulasDoModulo`/`aulasDoCiclo`/`ciclosDoModulo`, escopo alvo (`selectedScopeKey`/`definirEscopoAlvo`), `toggleAtivoPainel` com escopo (id_ciclo/id_calendario)
- `ProgAtividadesTabCurriculo`: estrutura final (Programa → Componentes → Módulos/Ciclos → Aulas), botões "Adicionar" por seção com escopo alvo, ícones SVG, barra "Escopo alvo" no painel direito
- `ConteudoRow` + painel direito: botão de arquivo para abrir via `/api/r2/sign` em nova aba
- Removidos: seção "Por Área" e pasta "Aulas" solta (aulas agora dentro de cada módulo)

### 2026-07-28 — Distribuição + Currículo v1

**Banco:**
- Migrations `00007` a `00019`: RPCs de distribuição, filtros de conteúdos, RPCs de currículo com fixes (ORDER BY, aliases externos, componentes do curso)

**Frontend:**
- `ProgAtividadesTabDistribuicao`: 2 colunas com sub-abas de escopo e toggle inline
- `ProgAtividadesTabCurriculo` v1: dropdown de programa + árvore com herança (toggle ativo/destaque, badge Blueprint)

### 2026-07-27 — Repositório + tabelas base

**Banco:**
- Migration `00000`: 12 tabelas `lms_*` com RLS (gestor por entidade + aluno próprio)
- Migrations `00001` a `00006`: RPCs de blocos, refactor de conteúdo (solto, sem bloco obrigatório), remoção de timing do repositório

**Frontend:**
- `ProgAtividadesTabRepositorio`: CRUD de conteúdos (material/atividade/avaliação) + blocos, busca, filtros, paginação
- `ModalProgAtividadesConteudo` 3 passos, `ModalProgAtividadesBloco`, `UploadArquivo`, `ConteudoRow`

---

## Próximos passos (planejado)

- **Aba "Minhas Atividades"** (aluno) — consumir conteúdos, responder atividades/avaliações, upload de arquivos
- **Submissões** — usar `lms_submissao_atividade`/`lms_submissao_avaliacao` (UNIQUE por tentativa já previsto)
- **Questionário com diff** — quando submissões existirem, migrar o REPLACE para diff por id (evita apagar respostas em cascata)
- **Índices adicionais** — monitorar performance das RPCs de currículo
