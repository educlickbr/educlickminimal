# Plano — Módulo do Aluno: "Minhas Atividades" (`/minhas_atividades`)

## Visão Geral

Página do **aluno** para consumir os conteúdos do programa em que está matriculado. É o lado do consumo do pipeline **Repositório → Distribuição → Currículo → Aluno**.

> **Rota já existe no menu**: `FullPageMenu.vue` tem o item "Minhas Atividades" → `/minhas_atividades` (com underscore).

**Inspiração:** layout espelhado no `/programacao_atividades?tab=curriculo` (acordeons à esquerda, conteúdo à direita), com entrada vinda de `/meus-cursos`.

**Referência de achados:** `_refererencia/TRANSPORTE_ENTRE_PROJETOS.md` (módulo `conteudo_digital` de outro projeto — quiz, tasks com rascunho, timer, erro 409 prazo expirado).

---

## Fluxo de Navegação

```
/meus-cursos (cards dos cursos com matrícula ativa)
  └─ clica no card → ANIMAÇÃO → "entra" no curso
      └─ /minhas_atividades  (contexto do curso via query ?programa=ID ou state)
          ├─ TOPO: botão "← Cursos" (volta para trocar contexto)
          ├─ ESQUERDA: acordeons por escopo (lazy)
          │    ├─ 📋 Programa (conteúdos soltos ativos)
          │    ├─ 📁 Componentes → itens
          │    └─ 📁 Módulos/Ciclos → 📅 Aulas
          └─ DIREITA: conteúdo selecionado (material/atividade/avaliação)
```

### Interação com o card
- Clique no card de `/meus-cursos` → transição animada (o card "some" para o contexto)
- O contexto do curso tem um botão "← Cursos" no topo que abre a lista de cursos novamente
- Trocar de curso = voltar → clicar em outro card

---

## O que o Aluno Vê (regras de visibilidade)

| Regra | Detalhe |
|---|---|
| **Programa** | Só programas com **matrícula ativa** do usuário (`aca_matricula`) |
| **Ativo** | Conteúdo **herdado** (sem linha operacional) OU linha com `ativo = true` |
| **Timing** | `data_disponivel <= agora <= data_entrega_limite` |
| **Fora do prazo** | Conteúdo aparece **bloqueado** com badge ("Disponível a partir de X" / "Prazo encerrado em X") — não some |
| **Gabarito** | `lms_resposta_possivel.correta` **NUNCA** vai para o aluno (RPC omite) |
| **Escopo** | Área não aparece (fica só na distribuição) — mesmo padrão do Currículo |

---

## Ações por Tipo de Conteúdo (coluna direita)

### 📄 Material
- Card com título, descrição, arquivo (R2 assinado `/api/r2/sign`) e/ou URL externa
- Abrir arquivo em nova aba
- Marcar como concluído (opcional v1 → `lms_progresso_aluno`)

### ✍️ Atividade (com rascunho)
- Card: enunciado, arquivo de referência, prazo
- **Form de entrega**:
  - Campo texto (resposta dissertativa)
  - Upload de arquivo (`id_arquivo_envio`)
  - **Rascunho** (`mode: draft`) — salva sem entregar, pode voltar depois
  - Botão **"Entregar"** → envia definitivamente (status `entregue`)
- Guard de prazo: se `agora > data_entrega_limite` → erro **409 "prazo de envio expirado"**
- Tabela: `lms_submissao_atividade` (UNIQUE `id_conteudo, id_matricula, tentativa` já existe)

### 📝 Avaliação (questionário)
- Card: título, descrição, **timer** (`duracao_minutos` — countdown `LmsQuizTimer`), tentativas permitidas
- Ao iniciar → `lms_submissao_avaliacao` com `data_inicio` + `tentativa` (UNIQUE trava duplicidade)
- Perguntas carregadas **sem gabarito** (`lms_get_avaliacao_para_aluno`)
  - Dissertativa → textarea
  - Múltipla escolha → radio (sem revelar `correta`)
- Respostas salvas em `lms_resposta_aluno` (`id_resposta_possivel` OU `texto_resposta`)
- Ao enviar → `data_entrega` + status `entregue`
- Ao expirar o timer → envio automático do que foi respondido

### Badges de status (esquerda e direita)
- Tipo (Material/Atividade/Avaliação — cores já padronizadas)
- Prazo: "Prazo: 20/08" / "Disponível a partir de 20/08"
- Entrega: "Entregue" / "Rascunho salvo" / "Corrigido — Nota: 8,5"
- Tentativas: "Tentativa 1/3"

---

## Banco — RPCs novas

| RPC | Assinatura (proposta) | Comportamento |
|---|---|---|
| `lms_get_programas_do_aluno` | `(p_id_entidade, p_id_usuario)` | Programas com matrícula ativa + qtd de conteúdos |
| `lms_get_conteudos_do_aluno` | `(p_id_programa, p_id_entidade, p_id_matricula)` | Conteúdos visíveis por escopo (Programa/Componentes/Módulo/Ciclo/Aula) com status: disponível, agendado, prazo, entregue, nota, tentativas |
| `lms_get_avaliacao_para_aluno` | `(p_id_conteudo, p_id_entidade, p_id_matricula)` | Perguntas + alternativas **SEM `correta`** |
| `lms_iniciar_submissao_avaliacao` | `(p_id_conteudo, p_id_entidade, p_id_matricula, p_usuario_id)` | INSERT com `data_inicio` + próxima tentativa (UNIQUE trava) |
| `lms_upsert_submissao_atividade` | `(p_id_conteudo, p_id_entidade, p_id_matricula, p_texto, p_id_arquivo, p_status, p_usuario_id)` | Rascunho (status `rascunho`) ou entrega (`entregue`); 409 se prazo vencido no envio final |
| `lms_finalizar_submissao_avaliacao` | `(p_id_submissao, p_id_entidade, p_respostas JSONB, p_usuario_id)` | Grava `lms_resposta_aluno` + `data_entrega` + status `entregue`; valida prazo |

> **Padrão**: todas SECURITY INVOKER com políticas RLS de aluno (matrícula do próprio usuário).

---

## RLS

- `lms_submissao_atividade` / `lms_submissao_avaliacao` / `lms_resposta_aluno` / `lms_progresso_aluno`:
  - Aluno: SELECT/INSERT/UPDATE **somente da própria matrícula** (`id_matricula` → `aca_matricula.id_aluno` → `user_expandido.id` = `auth.uid()`)
  - Gestor: acesso total via `lms_usuario_pertence_entidade`
- **Conteúdos**: aluno enxerga via matrícula + `ativo=true` + timing (a RPC `lms_get_conteudos_do_aluno` centraliza a regra)
- **Perguntas**: aluno pode ler, mas `correta` é omitida na RPC (nunca via query direta)

---

## Arquitetura (padrão desacoplado)

```
app/pages/meu-curso/[id].vue                             ← orquestrador (contexto do curso)
app/pages/minhas_atividades/index.vue                    ← orquestrador (contexto do curso)
app/pages/meus-cursos/index.vue                          ← ajuste: card clicável + animação
app/components/meu-curso/
├── MeuCursoPage.vue                                     ← 2 colunas (acordeons + conteúdo)
├── MeuCursoConteudoMaterial.vue                         ← card material
├── MeuCursoConteudoAtividade.vue                        ← card atividade + entrega (rascunho)
├── MeuCursoConteudoAvaliacao.vue                        ← card avaliação + timer + perguntas
├── MeuCursoRow.vue                                      ← linha da árvore (tipo, título, badges)
└── LmsQuizTimer.vue                                     ← countdown (inspirado no referencial)
app/composables/meu-curso/
└── useMeuCurso.ts                                       ← programas, estrutura, conteúdos, submissões
server/api/meu-curso/
├── programas.get.ts
├── estrutura.get.ts                                     ← lazy por escopo
├── conteudo.get.ts                                      ← detalhe + submissão atual
├── atividade.post.ts                                    ← rascunho/entrega
├── avaliacao.iniciar.post.ts
└── avaliacao.finalizar.post.ts
supabase/migrations/
└── <nova>_create_lms_rpc_aluno.sql                      ← RPCs do aluno + ajustes RLS
```

---

## Estados de UI

| Estado | Renderização |
|---|---|
| `!cursoSelecionado` | Cards de `/meus-cursos` com animação de entrada |
| `loadingEstrutura` | Spinner na coluna esquerda |
| Conteúdo não selecionado | Empty state "Selecione um conteúdo" |
| Material | Card com arquivo/URL assinada |
| Atividade não entregue | Form com texto + upload + [Salvar rascunho] [Entregar] |
| Atividade em rascunho | Badge "Rascunho salvo" + formulário preenchido |
| Atividade entregue | Tela "Entregue" (sem edição) |
| Prazo vencido | Bloqueio + badge "Prazo encerrado" (toast 409 no envio) |
| Avaliação iniciada | Perguntas + timer visível |
| Timer zerado | Envio automático + tela de sucesso |
| Avaliação corrigida | Nota + comentário do professor (fase 2) |
| Toast sucesso/erro | Inferior direita 3s |

---

## Achados aproveitados do `TRANSPORTE_ENTRE_PROJETOS.md`

1. **`answers: [{ id_pergunta, id_resposta_possivel, texto_resposta }]`** → valida nosso `lms_resposta_aluno` (sem mudança de modelo)
2. **`mode: "draft"` em task** → rascunho de atividade na v1
3. **Erro 409 prazo expirado** → padrão de erro no envio
4. **`LmsQuizTimer`** → component de timer usando `duracao_minutos` (já no timing do Currículo)
5. **`lmsSecureFocusMode`** (modo prova fullscreen + overlay violação) → **fora da v1**, possível campo futuro `ambiente_seguro` em `lms_avaliacao`
6. **Aba "Envios" com stats + gabarito lado a lado** → fase 2 (correção do professor)
7. **Template de documentação 6 camadas** → usar em `documentacao/paginas/meu-curso.md` quando implementar

---

## Fases

### V1 — Consumo (este plano)
- Entrada animada via `/meus-cursos`
- Árvore lazy por escopo com badges
- Material (abrir arquivo/URL → marca concluído)
- Atividade com **rascunho + entrega única** (texto + upload, 409 prazo → marca concluído)
- Avaliação com **timer local + perguntas sem gabarito + envio** (→ marca concluído)
- **Progresso básico** via `lms_progresso_aluno` (concluído/não concluído por conteúdo)

### Fase 2 — Correção (professor)
- Lista de submissões por conteúdo (3 stats: entregues/pendentes/corrigidas)
- Nota + comentário (`nota`, `comentario_professor` já existem)
- Gabarito lado a lado com resposta do aluno
- Devolução ao aluno (badge "Corrigido — Nota: X")

### Fase 3 — Avançado
- Modo prova seguro (fullscreen + overlay violação)
- Autoavaliação
- Relatórios de desempenho

---

## Pendências / Decisões (ATUALIZADO — 2026-08-06)

### ✅ Decididas
- **Rota**: `/minhas_atividades` (já existe no FullPageMenu) — contexto do curso via query/state, não rota dinâmica
- **Reenvio de atividade**: ❌ FORA da v1 — uma entrega por tentativa. ⏳ **Anotado**: futuramente configurável no admin (tentativas permitidas já existe no timing do operacional — `tentativas_permitidas`)
- **Timer**: v1 = countdown **local sem trava** (pode trocar de aba). Travar tela (modo prova) fica para depois
- **Conclusão**: automática ao concluir — atividade ao **entregar**, avaliação ao **enviar**, material ao **abrir/visualizar** (marca em `lms_progresso_aluno`)
- **Progresso**: ✅ básico via `lms_progresso_aluno` na v1
  - ⏳ **Anotado (sofisticação futura)**: percentual por escopo (módulo/componente), barra de progresso do curso, indicadores no card de `/meus-cursos`, relatórios de desempenho, tempos de estudo, sequência recomendada de conteúdos
