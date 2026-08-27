# Página Minhas Atividades (`/minhas_atividades`)

## Visão Geral

Tela do **aluno** que consome os conteúdos do LMS — última ponta do pipeline **Repositório → Distribuição → Currículo → Aluno**.

- **Entrada:** cards de programa (matrículas ativas) → clique → contexto do curso
- **Contexto do curso:** o centro mostra a **visão central** (alterna **Menu** = árvore por escopo | **Resumo** = lista de conteúdos); ao clicar num conteúdo, a visão **recolhe para a esquerda** (desktop) e o conteúdo abre no centro
- **Painel (direita):** quadrante reservado no layout `base.vue` — instruções, filtros por tipo/status/escopo com contadores
- **Mobile:** sem sidebar nem coluna esquerda fixa — visão central em tela cheia; com conteúdo aberto, botões "Menu" e "Filtros" abrem drawers da direita
- Visibilidade respeita timing do currículo: agendado / disponível / prazo encerrado (fora do prazo = **bloqueado**, não some)

**Rota:** `/minhas_atividades` | **Layout:** `base` (via `<NuxtLayout name="base">` explícito com `#sidebar`) | **Orquestrador:** `pages/minhas_atividades/index.vue`

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/minhas_atividades/index.vue                        ← orquestrador: instancia core/toast/ctx e renderiza <NuxtLayout name="base"> + #sidebar
app/components/minhas_atividades/
├── MinhasAtividadesPage.vue                                 ← contexto do curso: visão central (Menu/Resumo) ⇄ detalhe + drawers mobile
├── MinhasAtividadesSidebar.vue                              ← Painel (dashboard): Como funciona, Por tipo, Status, Por escopo (filtros clicáveis)
├── ConteudoArvore.vue                                       ← árvore por escopo (Programa → Componentes → Módulos/Ciclos → Aulas), slot #header-right
├── ConteudoLista.vue                                        ← resumo: seções agrupadas com badges de status (reusa ConteudoLinha)
├── ConteudoLinha.vue                                        ← linha com tipo + badges (✓ ⏰ ✕ R E nota)
├── VisaoToggle.vue                                          ← botões Menu | Resumo (header da visão central, grande e recolhida)
├── ConteudoMaterial.vue                                     ← material (R2/link) + marcar visto
├── ConteudoAtividade.vue                                    ← texto + UploadMini + rascunho/entregar
└── ConteudoAvaliacao.vue                                    ← timer + modo prova (fullscreen) + perguntas sem gabarito + autoavaliação
app/composables/programacao_atividades/
└── useMinhasAtividades.ts                                   ← programas, estrutura lazy, pré-carrega escopos, visão central, filtros, submissões, timer
server/api/minhas_atividades/
├── programas.get.ts                                         ← programas do aluno (matrículas ativas)
├── estrutura.get.ts                                         ← estrutura do programa (reusa RPC do admin)
├── conteudos.get.ts                                         ← conteúdos de um escopo + status + rascunho + submissões
├── avaliacao.get.ts                                         ← perguntas SEM gabarito + flags (ambiente_seguro/autoavaliacao)
├── progresso.post.ts                                        ← marca material como visto (upsert direto com RLS)
├── atividade.post.ts                                        ← rascunho/entrega de atividade
└── avaliacao/
    ├── iniciar.post.ts                                      ← inicia submissão (valida prazo/tentativas)
    └── finalizar.post.ts                                    ← grava respostas + entrega + nota (autoavaliação)
supabase/migrations/
├── 20260806100005_create_lms_rpc_aluno.sql                  ← helpers, RLS do estudante, enum 'rascunho', 6 RPCs
├── 20260819100000_fix_rls_lms_resposta_aluno.sql            ← policy de gestor faltante + delete own
├── 20260819100001_lms_fase2_dividas_rapidas.sql             ← rascunho na listagem, upload dissertativa, ordem aleatória
├── 20260819100002_lms_fase23_avaliacao_avancada.sql         ← flags ambiente_seguro/autoavaliacao + nota automática
├── 20260819100003_drop_lms_upsert_avaliacao_overload.sql    ← drop do overload órfão (7 params)
└── 20260820100003_lms_aluno_ve_comentario.sql               ← feedback da correção no aluno (comentário + quem/quando)
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

### Estrutura do programa (árvore / visão Menu)
```
GET /api/minhas_atividades/estrutura?id_programa=X&id_entidade=Y
  → RPC lms_get_curriculo_estrutura (mesma do admin — não expõe dados sensíveis)
  → retorna { programa, area, componentes[], modulos[], ciclos[], aulas[] }
```

### Conteúdos de um escopo (pré-carregado ao entrar no curso)
```
GET /api/minhas_atividades/conteudos?id_programa=X&id_entidade=Y&id_matricula=Z&escopo_tipo=programa|componente|modulo|ciclo|calendario&escopo_id=W
  → RPC lms_get_conteudos_do_aluno(...)
    → programa/ciclo/calendario: lms_conteudo_operacional
    → area/componente/modulo: lms_distribuicao + LEFT JOIN operacional
    → LEFT JOIN submissões (última tentativa — inclui texto/arquivo do rascunho) + progresso
    → status_visibilidade: 'agendado' | 'disponivel' | 'prazo_encerrado'
    → retorna conteudos[{ id_conteudo, titulo, tipo, descricao, id_arquivo, url,
        status_visibilidade, data_disponivel, data_entrega_limite, duracao_minutos, tentativas_permitidas,
        atividade_status, atividade_nota, atividade_tentativa, atividade_texto, atividade_arquivo,
        avaliacao_status, avaliacao_nota, avaliacao_tentativa, concluido }]
```
⚠️ Todos os escopos são pré-carregados ao entrar no curso (`carregarTodosConteudos`) — volume pequeno por
matrícula; alimenta a visão Resumo, o dashboard e a árvore instantânea.

### Material — abrir + marcar visto
```
GET /api/r2/sign?id_arquivo=X → { signedUrl } (nova aba)

POST /api/minhas_atividades/progresso { id_conteudo, id_entidade, id_matricula }
  → upsert direto em lms_progresso_aluno (concluido=true, visto_em=NOW) — RLS "estudante insert/update own"
```

### Atividade — rascunho / entrega
```
POST /api/minhas_atividades/atividade { id_conteudo, id_entidade, id_matricula, texto_resposta?, id_arquivo_envio?, status }
  → RPC lms_upsert_submissao_atividade(...)
  → PRAZO_EXPIRADO → HTTP 409 | demais → HTTP 400
```

### Avaliação — iniciar / perguntas / finalizar
```
POST /api/minhas_atividades/avaliacao/iniciar { id_conteudo, id_entidade, id_matricula }
  → RPC lms_iniciar_submissao_avaliacao(...) — valida matrícula, visibilidade, prazo, tentativas
  → retorna { success, id, tentativa, duracao_minutos, data_entrega_limite }

GET /api/minhas_atividades/avaliacao?id_conteudo=X&id_entidade=Y&id_matricula=Z
  → RPC lms_get_avaliacao_para_aluno(...) — ⚠️ SEM campo correta
  → retorna { success, ordem_perguntas, ambiente_seguro, autoavaliacao,
        perguntas[{ id_pergunta, tipo, enunciado, pontuacao, obrigatoria, ordem, id_arquivo, alternativas[...] }] }

POST /api/minhas_atividades/avaliacao/finalizar { id_submissao, id_entidade, respostas[] }
  → RPC lms_finalizar_submissao_avaliacao(...)
    → grava lms_resposta_aluno (inclui id_arquivo_envio da dissertativa)
    → se autoavaliacao: calcula a nota (soma das pontuações corretas) e grava nota_total
  → retorna { success, qtd_respostas, nota_total }
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/minhas_atividades/programas` | → RPC `lms_get_programas_do_aluno` |
| `GET` | `/api/minhas_atividades/estrutura` | → RPC `lms_get_curriculo_estrutura` (reuso admin) |
| `GET` | `/api/minhas_atividades/conteudos` | → RPC `lms_get_conteudos_do_aluno` |
| `GET` | `/api/minhas_atividades/avaliacao` | → RPC `lms_get_avaliacao_para_aluno` (sem gabarito + flags) |
| `POST` | `/api/minhas_atividades/progresso` | → upsert direto `lms_progresso_aluno` (RLS) |
| `POST` | `/api/minhas_atividades/atividade` | → RPC `lms_upsert_submissao_atividade` |
| `POST` | `/api/minhas_atividades/avaliacao/iniciar` | → RPC `lms_iniciar_submissao_avaliacao` |
| `POST` | `/api/minhas_atividades/avaliacao/finalizar` | → RPC `lms_finalizar_submissao_avaliacao` |

---

## Composables

| Composable | Responsabilidade |
|---|---|
| `useMinhasAtividades` | Programas, estrutura, pré-carrega escopos, **visão central** (`visaoCentral: 'menu' \| 'resumo'`, default `menu`), `secoesLista` (agrupada, dedupe, pendências primeiro), filtros do Painel aplicados à árvore E à lista, rascunho pré-carregado, material visto, atividade (rascunho/entrega), avaliação (iniciar/carregar/marcar incl. arquivo/finalizar/nota), `podeIniciarAvaliacao` com reenvio por tentativas, timer (deadline do servidor, auto-envio ~3s antes) |

---

## Componentes

| Componente | Props | Emits | Descrição |
|---|---|---|---|
| `MinhasAtividadesPage` | `ctx`, `getEntidadeId` | — | Visão central grande (Menu/Resumo) ⇄ recolhida + detalhe; drawers mobile (visão + filtros) |
| `MinhasAtividadesSidebar` | `ctx` | — | Painel: Como funciona, Por tipo, Status, Por escopo — cliques filtram/navegam (mesmo componente no aside e no drawer) |
| `ConteudoArvore` | `ctx` | — | Árvore por escopo; slot `#header-right` (toggle Menu\|Resumo) |
| `ConteudoLista` | `secoes`, `ativoId` | `abrir` | Seções agrupadas + `ConteudoLinha`; empty state |
| `ConteudoLinha` | `item`, `ativo` | `select` | Tipo colorido + badges (✓ ⏰ ✕ R E nota) |
| `VisaoToggle` | `ctx` | — | Botões Menu \| Resumo (SVG) |
| `ConteudoMaterial` | `item`, `abrirArquivo` | `aberto` | Arquivo/link; `aberto` → marca visto |
| `ConteudoAtividade` | `item`, `texto`, `arquivo`, `saving`, `podeEntregar`, `abrirArquivo` | `update:texto`, `update:arquivo`, `rascunho`, `entregar` | Texto + UploadMini + rascunho/entregar |
| `ConteudoAvaliacao` | `item`, `submissao`, `perguntas`, `respostas`, `loading`, `saving`, `podeIniciar`, `tempoRestante`, `tempoRestanteSeg`, `timerAtivo`, `abrirArquivo`, `getEntidadeId`, `flagsAvaliacao` | `iniciar`, `finalizar`, `saida`, `marcar-alternativa`, `marcar-texto`, `marcar-arquivo` | Timer, **modo prova** (fullscreen + aviso de saída), perguntas sem gabarito, nota na hora (autoavaliação), reenvio |

---

## Lógica de Negócio

### Decisões de arquitetura

1. **SECURITY INVOKER em todas as RPCs + RLS** — nunca DEFINER (acordo do projeto)
2. **RLS de conteúdo = SELECT amplo do estudante via JWT** (`lms_usuario_eh_estudante()` + `lms_usuario_pertence_entidade`)
3. **RLS de submissão = própria matrícula**; papel real `aca_estudante` (políticas antigas `'aluno'` dropadas)
4. **Gabarito nunca vai ao aluno** (`lms_get_avaliacao_para_aluno` omite `correta`)
5. **Fora do prazo = bloqueado, não some** (`status_visibilidade` na RPC + card bloqueado)
6. **Timer local sem trava** — prioriza `data_entrega_limite` do servidor; auto-envio ~3s antes do fim (evita race com `PRAZO_EXPIRADO`)
7. **Conclusão automática** — material ao abrir (`progresso.post.ts`), atividade ao entregar, avaliação ao finalizar
8. **Ambiente seguro (modo prova v1)** — fullscreen + `visibilitychange` com aviso ao sair; trava de navegação fica para depois
9. **Autoavaliação** — sem dissertativas (valida no banco e no admin); `lms_finalizar_submissao_avaliacao` soma as pontuações corretas e grava `nota_total` na hora
10. **Reenvio** — `tentativas_permitidas` do operacional; nova tentativa enquanto `tentativa < permitidas`
11. **Visão central Menu | Resumo** — default **Menu** (árvore); toggle no header da visão (grande e recolhida); ao abrir conteúdo, a visão recolhe para a esquerda
12. **Rascunho de atividade pré-carregado** — a RPC de conteúdos retorna `atividade_texto`/`atividade_arquivo` da última tentativa
13. **Upload na dissertativa** — `lms_resposta_aluno.id_arquivo_envio` gravado pela RPC finalizar
14. **Ordem aleatória** — `ordem_perguntas = 'aleatoria'` embaralha perguntas E alternativas na RPC do aluno
15. **Erros de negócio → HTTP** — `PRAZO_EXPIRADO` → 409; demais → 400

### Tabelas do aluno

```sql
lms_submissao_atividade     -- envio (texto + arquivo), por tentativa
lms_submissao_avaliacao     -- início/término; nota_total (autoavaliação/correção)
lms_resposta_aluno          -- resposta por pergunta (id_resposta_possivel | texto | id_arquivo_envio)
lms_progresso_aluno         -- concluido/visto_em; UNIQUE (id_conteudo, id_matricula)
lms_avaliacao               -- + ambiente_seguro, autoavaliacao (flags da 2.3)
```

### RLS (resumo)

- **Conteúdo**: estudante SELECT amplo via JWT (barato, sem join pesado)
- **Submissão**: select/insert/update own (matrícula do `auth.uid()`); `lms_resposta_aluno` ganhou **gestor all** (faltava — erro 500) e **estudante delete own** (DELETE da RPC)
- **Progresso**: select/insert/update own

---

## Estados da UI

| Estado | Renderização |
|---|---|
| Cards de programa | Grid com avatar, título, curso, ciclos, seta |
| Sem programa | Placeholder no Painel ("Minhas Atividades — entre em um curso") |
| Visão central = **Menu** (default) | Árvore grande no centro (header "Conteúdos" + toggle) |
| Visão central = **Resumo** | Lista grande agrupada (header "Resumo" + toggle + Filtros mobile) |
| Conteúdo selecionado (desktop) | Visão recolhe `w-80` à esquerda + conteúdo no centro + "← Todos os conteúdos" |
| Conteúdo selecionado (mobile) | Conteúdo em tela cheia + botões "Menu" e "Filtros" (drawers da direita) |
| "← Todos os conteúdos" | **Limpa a seleção** e volta à visão central grande (como o currículo) |
| Drawer de filtros (mobile) | Overlay + painel lateral com o `MinhasAtividadesSidebar` (mesmo componente) |
| Drawer de visão (mobile) | Overlay + painel lateral com a árvore ou a lista conforme a visão |
| Avaliação com ambiente seguro | Fullscreen; troca de aba → toast de aviso (respostas continuam salvas) |
| Autoavaliação entregue | Card "Avaliação entregue!" + "🎉 Sua nota: X" |
| Entregue com tentativas restantes | Botão "Tentar novamente" no entregue-card |
| Timer ativo | Timer-bar no topo (alerta < 5min; escondida sem duração/prazo) |

---

## Contrato Visual Aplicado

(mesmo design system do admin — dark `#0a0a0c`, acentos violeta `#7c3aed → #8b5cf6`, chips de tipo)

- **Ícones**: todos SVG na cor principal (`#a78bfa`, `#c4b5fd` quando ativo/hover) — **sem emojis**
- **Visão central grande/recolhida**: `bg rgba(255,255,255,0.015) border rgba(255,255,255,0.05) rounded-2xl`; recolhida `w-80` com `transition-all`
- **Toggle Menu|Resumo** (`VisaoToggle`): chips com SVG list/grid; ativo violeta
- **Painel (sidebar)**: cards `dash-card` com título SVG violeta (lâmpada, caixa, activity, pasta); botões de status com SVG (check, relógio, despertador, lápis)
- **Badges de status** (`ConteudoLinha`): ✓ verde, ⏰ âmbar, ✕ vermelho, R cinza, E azul, nota violeta
- **Drawers mobile**: overlay `rgba(0,0,0,0.7)` + painel `#13131a` slide da direita (340px / 85vw)
- **Botões**: gradiente `#7c3aed → #8b5cf6` com glow (Abrir/Iniciar/Finalizar/Entregar)

---

## Dependências com outras partes do sistema

### Reusa
- `global_arquivos` + R2 (`/api/r2/upload`, `/api/r2/sign`)
- `lms_get_curriculo_estrutura` (admin) e `lms_conteudo_operacional`/`lms_distribuicao` (via RPC)
- `aca_matricula`, `aca_programa`, `aca_curso`, `aca_ciclo_programa`
- `useProgAtividadesCore`, `useToast`, `user_entidades`, `user_expandido`

### Nova infraestrutura criada
- 8 BFFs em `server/api/minhas_atividades/`
- 1 composable + 9 componentes em `components/minhas_atividades/`
- Migrations `00005` (aluno) + `19100000` (RLS) + `19100001` (2.0) + `19100002` (2.3) + `19100003` (drop overload) + `20260820100003` (aluno vê comentário)

---

## Histórico de Mudanças

### 2026-08-20 — Aluno vê o feedback da correção (comentário do professor)

- Migration `20260820100003`: `lms_get_conteudos_do_aluno` retorna `atividade_comentario`/`avaliacao_comentario` + `*_corrigido_em` + `*_corrigido_por_nome` (nas 6 branches de escopo)
- Card de atividade/avaliação: bloco "Feedback do professor" (comentário + "Corrigido por X · DD/MM às HH:MM"); card de entrega vira "Corrigida pelo professor" quando tem nota
- Listagem (`ConteudoLinha`): tooltip na nota com comentário + quem/quando
- Interface `ConteudoAluno` enriquecida

### 2026-08-19 — Fase 2.0, 2.1, 2.3 + visão central Menu|Resumo

- **2.0**: rascunho de atividade pré-carregado (RPC retorna texto/arquivo); upload na resposta dissertativa; ordem aleatória de perguntas e alternativas
- **2.1**: dashboard no `#sidebar` do layout (Painel) com filtros por tipo/status/escopo; pré-carregamento de todos os escopos
- **2.3**: flags `ambiente_seguro` (modo prova: fullscreen + aviso de saída) e `autoavaliacao` (nota na hora, sem dissertativas); reenvio por `tentativas_permitidas`; `p_ordem_perguntas` corrigido (bug latente no upsert)
- **Layout**: visão central **Menu | Resumo** (default Menu) com toggle nos headers; ao abrir conteúdo, visão recolhe para a esquerda; "← Todos os conteúdos" limpa e volta; drawers mobile (visão + filtros); botão Filtros mobile-only (fix `lg:!hidden` — CSS scoped vencia o Tailwind)
- **Estética**: todos os emojis da página trocados por SVGs violeta

### 2026-08-17 — Fechamento v1 do módulo do aluno

- Timer corrigido (`iniciarAvaliacao` → `iniciarTimer`; prioriza `data_entrega_limite`; auto-envio ~3s antes)
- Material marca visto (`progresso.post.ts`); timer-bar escondida sem duração/prazo

### 2026-08-06/07 — Implementação do módulo (passos 1–6)

- Banco (`00005`): SECURITY INVOKER + RLS do estudante, enum `rascunho`, 6 RPCs
- BFFs, composable, frontend (cards → contexto, material/atividade/avaliação), `/meus-cursos` clicável, `base.vue` pageTitle

---

## Próximos passos

- **Fase 2.4 — Ilha de docentes** ✅ feita — ver `portal-docente.md`
- **Aluno vê o comentário do professor** ✅ feito (migration `20260820100003`) — card de atividade/avaliação + tooltip na listagem
- **Fase 2.5 — Relatórios** do coordenador (% conclusão, notas médias) + CSV
- **Modo prova completo** — trava de navegação (não só aviso); envio automático com mais margem
- **Reenvio de atividade** — configurável no admin (hoje a entrega de atividade é única)
- **Rascunho de atividade**: pré-carregado, mas só da última tentativa — múltiplos rascunhos ficam para depois
