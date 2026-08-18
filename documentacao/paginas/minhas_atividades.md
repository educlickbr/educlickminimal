# Página Minhas Atividades (`/minhas_atividades`)

## Visão Geral

Tela do **aluno** que consome os conteúdos do LMS — última ponta do pipeline **Repositório → Distribuição → Currículo → Aluno**.

- **Entrada:** cards de programa (matrículas ativas do aluno) → clique em um card → contexto do curso
- **Contexto do curso:** 2 colunas — árvore acordeon à esquerda (Programa → Componentes → Módulos/Ciclos → Aulas) e conteúdo à direita (material / atividade / avaliação)
- **Acesso:** `/meus-cursos` → card **✅ Ativo** → `/minhas_atividades`; botão "← Cursos" troca de contexto
- Visibilidade respeita timing do currículo: agendado / disponível / prazo encerrado (fora do prazo = **bloqueado**, não some)

**Rota:** `/minhas_atividades` | **Layout:** `base` (pageTitle "Minhas Atividades") | **Orquestrador:** `pages/minhas_atividades/index.vue` (~57 linhas)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/minhas_atividades/index.vue                        ← orquestrador (rende MinhasAtividadesPage)
app/components/minhas_atividades/
├── MinhasAtividadesPage.vue                                 ← cards de programa ⇄ contexto do curso (2 colunas)
├── ConteudoLinha.vue                                        ← linha da árvore com badges (✓, ⏰, ✕, R, E, nota)
├── ConteudoMaterial.vue                                     ← card de material (arquivo R2 / link) + marcar visto
├── ConteudoAtividade.vue                                    ← texto + UploadMini + rascunho/entregar
└── ConteudoAvaliacao.vue                                    ← timer + perguntas (sem gabarito) + iniciar/finalizar
app/composables/programacao_atividades/
└── useMinhasAtividades.ts                                   ← programas, estrutura lazy, conteúdos por escopo, submissões, timer
server/api/minhas_atividades/
├── programas.get.ts                                         ← programas do aluno (matrículas ativas)
├── estrutura.get.ts                                         ← estrutura do programa (reusa RPC do admin)
├── conteudos.get.ts                                         ← conteúdos de um escopo com status de visibilidade
├── avaliacao.get.ts                                         ← perguntas SEM gabarito
├── progresso.post.ts                                        ← marca material como visto (upsert direto com RLS)
├── atividade.post.ts                                        ← rascunho/entrega de atividade
└── avaliacao/
    ├── iniciar.post.ts                                      ← inicia submissão de avaliação (valida prazo/tentativas)
    └── finalizar.post.ts                                    ← grava respostas + entrega + progresso
supabase/migrations/
└── 20260806100005_create_lms_rpc_aluno.sql                  ← helpers, RLS do estudante, enum 'rascunho', 6 RPCs
```

---

## Fluxo de Dados

### Programas do aluno (cards de entrada)
```
GET /api/minhas_atividades/programas?id_entidade=X&id_usuario=Y
  → RPC lms_get_programas_do_aluno(p_id_entidade, p_id_usuario)
    → aca_matricula JOIN aca_programa JOIN aca_curso
    → valida p_id_usuario = auth.uid() (ACESSO_NEGADO se não)
    → retorna { itens[{ id_matricula, id_programa, descricao, nome_curso, qtd_ciclos }] }
```

### Estrutura do programa (árvore, lazy)
```
GET /api/minhas_atividades/estrutura?id_programa=X&id_entidade=Y
  → RPC lms_get_curriculo_estrutura (mesma do admin — não expõe dados sensíveis)
  → retorna { programa, area, componentes[], modulos[], ciclos[], aulas[] }
```

### Conteúdos de um escopo (lazy por acordeon)
```
GET /api/minhas_atividades/conteudos?id_programa=X&id_entidade=Y&id_matricula=Z&escopo_tipo=programa|componente|modulo|ciclo|calendario&escopo_id=W
  → RPC lms_get_conteudos_do_aluno(...)
    → programa/ciclo/calendario: lms_conteudo_operacional
    → area/componente/modulo: lms_distribuicao + LEFT JOIN operacional
    → LEFT JOIN submissões (última tentativa) + lms_progresso_aluno (concluido)
    → status_visibilidade calculado: 'agendado' | 'disponivel' | 'prazo_encerrado'
    → retorna conteudos[{ id_conteudo, titulo, tipo, descricao, id_arquivo, url,
        status_visibilidade, data_disponivel, data_entrega_limite, duracao_minutos, tentativas_permitidas,
        atividade_status, atividade_nota, atividade_tentativa,
        avaliacao_status, avaliacao_nota, avaliacao_tentativa, concluido }]
```

### Material — abrir arquivo + marcar visto
```
GET /api/r2/sign?id_arquivo=X → { signedUrl } (abre em nova aba)

POST /api/minhas_atividades/progresso { id_conteudo, id_entidade, id_matricula }
  → upsert direto em lms_progresso_aluno (concluido=true, visto_em=NOW)
    → RLS "estudante insert/update own" garante que só toca a própria matrícula
  → sem RPC: single-row upsert sem lógica de negócio além da RLS
```

### Atividade — rascunho / entrega
```
POST /api/minhas_atividades/atividade { id_conteudo, id_entidade, id_matricula, texto_resposta?, id_arquivo_envio?, status: 'rascunho'|'entregue' }
  → RPC lms_upsert_submissao_atividade(...)
    → INSERT/UPDATE em lms_submissao_atividade (ON CONFLICT id_matricula+tentativa)
    → se 'entregue': valida prazo (PRAZO_EXPIRADO) e grava lms_progresso_aluno
  → PRAZO_EXPIRADO → HTTP 409 | demais erros de negócio → HTTP 400
```

### Avaliação — iniciar / perguntas / finalizar
```
POST /api/minhas_atividades/avaliacao/iniciar { id_conteudo, id_entidade, id_matricula }
  → RPC lms_iniciar_submissao_avaliacao(...)
    → valida matrícula, visibilidade, prazo, tentativas
    → INSERT em lms_submissao_avaliacao (status 'rascunho')
    → retorna { success, id, tentativa, duracao_minutos, data_entrega_limite }

GET /api/minhas_atividades/avaliacao?id_conteudo=X&id_entidade=Y&id_matricula=Z
  → RPC lms_get_avaliacao_para_aluno(...) — ⚠️ SEM campo correta (gabarito nunca vai ao aluno)
    → retorna { success, perguntas[{ id_pergunta, tipo, enunciado, pontuacao, obrigatoria, ordem, id_arquivo,
        alternativas[{ id_resposta_possivel, texto, ordem, id_arquivo }] }] }

POST /api/minhas_atividades/avaliacao/finalizar { id_submissao, id_entidade, respostas[] }
  → RPC lms_finalizar_submissao_avaliacao(...)
    → valida submissão pertence ao aluno, não entregue, prazo (PRAZO_EXPIRADO)
    → DELETE + INSERT em lms_resposta_aluno; status 'entregue'; lms_progresso_aluno concluido
  → PRAZO_EXPIRADO → HTTP 409 | demais → HTTP 400
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/minhas_atividades/programas` | → RPC `lms_get_programas_do_aluno` |
| `GET` | `/api/minhas_atividades/estrutura` | → RPC `lms_get_curriculo_estrutura` (reuso admin) |
| `GET` | `/api/minhas_atividades/conteudos` | → RPC `lms_get_conteudos_do_aluno` |
| `GET` | `/api/minhas_atividades/avaliacao` | → RPC `lms_get_avaliacao_para_aluno` (sem gabarito) |
| `POST` | `/api/minhas_atividades/progresso` | → upsert direto `lms_progresso_aluno` (RLS) |
| `POST` | `/api/minhas_atividades/atividade` | → RPC `lms_upsert_submissao_atividade` |
| `POST` | `/api/minhas_atividades/avaliacao/iniciar` | → RPC `lms_iniciar_submissao_avaliacao` |
| `POST` | `/api/minhas_atividades/avaliacao/finalizar` | → RPC `lms_finalizar_submissao_avaliacao` |

---

## Composables

| Composable | Responsabilidade |
|---|---|
| `useMinhasAtividades` | Programas (cards), estrutura lazy, conteúdos por escopo (`conteudosMap`), seleção de conteúdo, `abrirArquivo` (R2), `marcarMaterialVisto`, salvar atividade (rascunho/entrega), avaliação (iniciar/carregar/marcar/finalizar), **timer** (countdown local), `podeEntregar`/`podeIniciarAvaliacao` |

---

## Componentes

| Componente | Props | Emits | Descrição |
|---|---|---|---|
| `MinhasAtividadesPage` | `ctx: UseMinhasAtividadesReturn` | — | 2 estados: cards de programa (entrada) ⇄ contexto do curso (árvore esquerda `w-80` + conteúdo direita), botão "← Cursos", transição `card-enter` |
| `ConteudoLinha` | `item`, `abrirArquivo` | — | Linha da árvore: tipo, título, badges de status (✓ concluído, ⏰ agendado, ✕ prazo, R rascunho, E entregue, nota) |
| `ConteudoMaterial` | `item`, `abrirArquivo` | `aberto` | Card com arquivo (R2) ou link externo; `aberto` dispara `marcarMaterialVisto`; badge "✓ Concluído" |
| `ConteudoAtividade` | `item`, `texto`, `arquivo`, `saving`, `podeEntregar`, `abrirArquivo` | `update:texto`, `update:arquivo`, `rascunho`, `entregar` | Texto + UploadMini + botões Salvar rascunho / Entregar; bloqueado se agendado/prazo encerrado |
| `ConteudoAvaliacao` | `item`, `submissao`, `perguntas`, `respostas`, `loading`, `saving`, `podeIniciar`, `tempoRestante`, `tempoRestanteSeg`, `timerAtivo`, `abrirArquivo` | `iniciar`, `finalizar`, `marcar-alternativa`, `marcar-texto` | Antes de iniciar: status + card Iniciar (ou Entregue/Bloqueado). Depois: **timer-bar** (alerta < 5min), perguntas (dissertativa/múltipla escolha, sem gabarito), botão Finalizar |

---

## Lógica de Negócio

### Decisões de arquitetura

1. **SECURITY INVOKER em todas as RPCs + RLS** — acordo do projeto, nunca DEFINER. RLS resolve o acesso; validações de negócio ficam na RPC
2. **RLS de conteúdo = SELECT amplo do estudante via JWT** — `lms_usuario_eh_estudante()` + `lms_usuario_pertence_entidade(id_entidade)`. Barato: sem join pesado de matrícula em cada consulta
3. **RLS de submissão = própria matrícula** — policies select/insert/update com `id_matricula IN (matrículas do auth.uid())`
4. **Papel real do estudante é `aca_estudante`** — `lms_usuario_eh_gestor()` agora **exclui** `aca_estudante`/`aca_candidato`; helper novo `lms_usuario_eh_estudante()`. Policies antigas com papel `'aluno'` (inexistente) foram dropadas e recriadas
5. **Gabarito nunca vai ao aluno** — `lms_get_avaliacao_para_aluno` omite `correta` das alternativas
6. **Fora do prazo = bloqueado, não some** — `status_visibilidade: 'agendado' | 'disponivel' | 'prazo_encerrado'` calculado na RPC; card bloqueado com badge
7. **Timer local sem trava (v1)** — countdown cliente; prioriza `data_entrega_limite` do servidor, fallback `duracao_minutos`; **auto-envio ~3s antes do fim** para não esbarrar no `PRAZO_EXPIRADO` (servidor compara `data_entrega_limite < NOW()`)
8. **Conclusão automática** — material ao abrir (`progresso.post.ts`), atividade ao entregar e avaliação ao finalizar (RPCs gravam `lms_progresso_aluno`)
9. **Erros de negócio → HTTP** — `PRAZO_EXPIRADO` → 409; `MATRICULA_INVALIDA`, `NAO_DISPONIVEL`, `SEM_TENTATIVAS`, `JA_ENTREGUE`, `ACESSO_NEGADO` → 400
10. **`lms_progresso_aluno` refatorado** — tabela recriada com `id_conteudo` (não `id_bloco_item`), `UNIQUE (id_conteudo, id_matricula)`

### Tabelas do aluno

```sql
lms_submissao_atividade     -- envio do aluno (texto + arquivo), por tentativa
  id, id_entidade, id_conteudo, id_matricula, texto_resposta, id_arquivo_envio,
  data_inicio, data_envio, tentativa, status ('rascunho'|'em_andamento'|'entregue'|...),
  nota, criado_em, modificado_em
  UNIQUE (id_conteudo, id_matricula, tentativa)

lms_submissao_avaliacao     -- início/término por tentativa
  id, id_entidade, id_conteudo, id_matricula, tentativa,
  data_inicio, data_entrega, status, nota_total, criado_em, modificado_em
  UNIQUE (id_conteudo, id_matricula, tentativa)

lms_resposta_aluno          -- resposta por pergunta
  id, id_submissao_avaliacao CASCADE, id_pergunta, id_resposta_possivel | texto_resposta, id_arquivo_envio
  UNIQUE (id_submissao_avaliacao, id_pergunta)

lms_progresso_aluno         -- progresso por conteúdo/aluno
  id, id_entidade, id_conteudo, id_matricula, concluido, visto_em, criado_em, modificado_em
  UNIQUE (id_conteudo, id_matricula)
```

### RLS (resumo da migration 00005)

- **Conteúdo** (`lms_conteudo`, `lms_conteudo_operacional`, `lms_distribuicao`, `lms_avaliacao`, `lms_pergunta`, `lms_resposta_possivel`): estudante SELECT amplo via `lms_usuario_pertence_entidade`
- **Submissão** (`lms_submissao_atividade`, `lms_submissao_avaliacao`, `lms_resposta_aluno`, `lms_progresso_aluno`): estudante select/insert/update **own** (matrícula do `auth.uid()`)
- Gestor: policies existentes via `lms_usuario_eh_gestor()` + `lms_usuario_pertence_entidade()`

---

## Estados da UI

| Estado | Renderização |
|---|---|
| Cards de programa | Grid com avatar de curso, título, sub, ciclos; seta "Abrir" |
| Sem programas | Empty state "Nenhum programa disponível" |
| `!programaSelecionado` (contexto) | Cards de programa (volta via botão "← Cursos") |
| `loadingEstrutura` / `loadingConteudos` | Spinner na coluna esquerda / dentro do acordeon |
| Acordeon fechado | Trigger com contador de itens |
| Sem conteúdo selecionado | Empty state "Selecione um conteúdo" |
| Material | Card com arquivo/link; badge ✓ Concluído após abrir |
| Atividade | Textarea + upload; botões "Salvar rascunho" / "Entregar"; bloqueado com badge se agendado/prazo encerrado |
| Avaliação antes de iniciar | Pills de status (agendado/prazo/duração/tentativas/entregue/nota) + card "Iniciar" (ou "Entregue" / "Bloqueado") |
| Avaliação em andamento | **Timer-bar** no topo (alerta âmbar < 5min, escondida se não há duração/prazo) + cards de pergunta + "Finalizar" |
| Timer expira | Auto-envio ~3s antes; se servidor responde 409 → toast "Prazo de envio expirado" + conteúdo vira `prazo_encerrado` |
| Toast (sucesso/erro) | Notificação inferior direita por 3s |

---

## Contrato Visual Aplicado

(mesmo design system do admin — dark `#0a0a0c`, acentos violeta `#7c3aed → #8b5cf6`, chips de tipo)

- **Cards de curso**: `bg #0f0f17 border rgba(255,255,255,0.05) rounded-14px`, accent bar violeta no hover, avatar com ícone de curso
- **2 colunas**: esquerda `w-80` (árvore acordeon `bg rgba(255,255,255,0.015) rounded-2xl`), direita `flex-1` (conteúdo)
- **Acordeon**: trigger com seta SVG rotativa; ícones de pasta violeta (`text-violet-400`); sub-níveis `font-size 11px` com indentação
- **Chips de tipo**: Material azul (`#93c5fd`), Atividade verde (`#6ee7b7`), Avaliação laranja (`#fdba74`)
- **Status pills**: agendado âmbar (`#fbbf24`), prazo vermelho (`#f87171`), ok verde (`#6ee7b7`), nota violeta
- **Botão principal** ("Abrir" / "Iniciar" / "Finalizar" / "Entregar"): gradiente `#7c3aed → #8b5cf6` com glow
- **Timer-bar**: fundo escuro com borda; `--alert` âmbar quando restam ≤ 5min
- **Transição** de troca de contexto: `card-enter` (fade + translateY)

---

## Dependências com outras partes do sistema

### Reusa
- `global_arquivos` + R2 (Bunny/Worker) — upload (`/api/r2/upload`) e URL assinada (`/api/r2/sign`)
- `lms_get_curriculo_estrutura` — estrutura do programa (mesma do admin)
- `aca_matricula`, `aca_programa`, `aca_curso`, `aca_ciclo_programa` — matrículas e programas
- `useProgAtividadesCore` — entidade ativa + toast
- `user_entidades`, `user_expandido` — tenant e usuário

### Nova infraestrutura criada (migration 20260806100005_create_lms_rpc_aluno.sql — JÁ SUBIU ✅)
- Helpers: `lms_usuario_eh_gestor()` corrigido (exclui estudante/candidato), `lms_usuario_eh_estudante()` novo
- Enum `lms_status_submissao` + `'rascunho'`
- Policies RLS recriadas com papel correto (`aca_estudante`)
- 6 RPCs: `lms_get_programas_do_aluno`, `lms_get_conteudos_do_aluno`, `lms_get_avaliacao_para_aluno`, `lms_iniciar_submissao_avaliacao`, `lms_upsert_submissao_atividade`, `lms_finalizar_submissao_avaliacao`
- 8 BFFs em `server/api/minhas_atividades/`
- 1 composable (`useMinhasAtividades`), 5 componentes, 1 página

---

## Histórico de Mudanças

### 2026-08-17 — Fechamento v1 do módulo do aluno

- **Timer corrigido**: `iniciarAvaliacao()` agora dispara `iniciarTimer()`; countdown prioriza `data_entrega_limite` do servidor (fallback `duracao_minutos`); auto-envio ~3s antes do fim (evita race com `PRAZO_EXPIRADO`); se o servidor rejeita com 409 no envio, conteúdo vira `prazo_encerrado` e a submissão é limpa
- **Timer-bar escondida** quando a avaliação não tem duração nem prazo (`v-if="timerAtivo"`)
- **Material marca como visto**: novo BFF `progresso.post.ts` (upsert direto em `lms_progresso_aluno` com RLS — sem migration nova); `ConteudoMaterial` emite `aberto` ao abrir arquivo ou link; árvore atualiza badge "✓ Concluído"

### 2026-08-06/07 — Implementação do módulo (passos 1–6)

- **Banco** (`00005_create_lms_rpc_aluno.sql`): SECURITY INVOKER + RLS completo do estudante, enum `rascunho`, 6 RPCs do aluno, helpers corrigidos
- **BFFs**: 8 endpoints em `server/api/minhas_atividades/` com mapeamento de erros (409 prazo / 400 demais)
- **Composable** `useMinhasAtividades`: programas, estrutura lazy, conteúdos por escopo, submissões, timer
- **Frontend**: página + 5 componentes (cards → contexto do curso, material, atividade, avaliação)
- **`/meus-cursos`**: cards viram `<button>` — clicável só se `status === 'concluido'` (navega para `/minhas_atividades`), bloqueado com `opacity 0.65`; seta "Abrir"
- **`base.vue`**: `pageTitle` "Minhas Atividades" para a rota

---

## Próximos passos (Fase 2 — futuro)

- **Correção do professor**: lista de submissões, nota, comentário, gabarito lado a lado
- **Reenvio de atividade/avaliação**: configurável no admin via `tentativas_permitidas` (hoje a entrega é única)
- **Modo prova**: trava de tela no timer (troca de aba cancela/encerra) — v1 é countdown livre
- **Progresso sofisticado**: percentual por escopo, barra de progresso, relatórios
- **Rascunho de atividade**: hoje o rascunho salva mas o texto não é pré-carregado ao reabrir (v1: o aluno reabre e continua digitando)
