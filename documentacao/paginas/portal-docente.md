# Página Portal Docente — Atividades e Entregas (`/portal-docente/entregas`)

## Visão Geral

4ª ilha do `FullPageMenu` (**Portal Docente**, cor **âmbar/laranja**). O docente corrige as entregas das **atividades** e **avaliações** do LMS.

- **Escopo (decidido):** corrige (**nota + comentário**) apenas conteúdos que **criou**; conteúdos dos programas que **leciona** aparecem em **somente leitura** (🔒) — vê a entrega e o gabarito, mas não pode gravar nota
- **Fluxo em 3 níveis (padrão lista → direita, recolhimento dinâmico):**
  ```
  Conteúdos com entregas (pendentes primeiro)
    └─ clica → lista de alunos com entrega (pendentes primeiro)
        └─ clica no aluno → entrega + gabarito lado a lado → nota + comentário
  ```
- **Correção:** nota (numérica, 0–10 passo 0.5) + comentário (feedback para o aluno, gravado em `comentario`)
- **Painel (direita):** quadrante reservado no layout `base.vue` — "Como funciona" + **Resumo** (conteúdos / pendentes / corrigidas + barra de progresso)
- **Mobile:** sem coluna esquerda fixa — mostra apenas o nível atual com botão "← Conteúdos"/"← Alunos" no header

**Rota:** `/portal-docente/entregas` | **Layout:** `base` (via `<NuxtLayout name="base">` explícito com `#sidebar`) | **Orquestrador:** `pages/portal-docente/entregas.vue`

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/portal-docente/entregas.vue                       ← orquestrador: instancia core/toast/ctx e renderiza <NuxtLayout name="base"> + #sidebar
app/components/programacao_atividades/
├── DocenteEntregasPage.vue                                 ← 3 níveis com recolhimento (conteúdos → entregas → correção) + abrirArquivo (R2)
├── DocenteEntregasSidebar.vue                              ← Painel: Como funciona + Resumo (contadores + barra de progresso)
├── DocenteConteudosLista.vue                               ← conteúdos com entregas (busca, tipo, só pendentes, 🔒, X/Y)
├── DocenteEntregasLista.vue                                ← alunos com entrega (busca, pendentes/corrigidas, avatar, tentativa)
└── DocenteCorrecao.vue                                     ← resposta/gabarito + form nota+comentário (flag 🔒 somente leitura)
app/composables/programacao_atividades/
└── useDocenteEntregas.ts                                   ← conteúdos, entregas, detalhe, correção, resumo; re-liga seleção após refetch
server/api/docente/
├── conteudos.get.ts                                        ← conteúdos com entregas (corrigível = criado por; leitura = programa lecionado)
├── entregas.get.ts                                         ← entregas de um conteúdo (por aluno)
├── entrega.get.ts                                          ← detalhe da entrega + gabarito (docente vê correta)
└── correcao.post.ts                                        ← salva nota + comentário (só o criador)
supabase/migrations/
├── 20260820100000_create_lms_rpc_docente.sql         ← colunas comentario + helper programas do docente + 4 RPCs
├── 20260820100001_fix_lms_get_entrega_detalhe_ordem.sql ← fix alt.ordem (jsonb_agg de alternativas sem rp.ordem)
└── 20260820100002_lms_docente_auditoria_correcao.sql ← corrigido_por/corrigido_em + quem/quando na correção
```

---

## Fluxo de Dados

### 1. Conteúdos com entregas (nível 1)
```
GET /api/docente/conteudos?id_entidade=X&id_usuario=Y
  → RPC lms_list_conteudos_entregas_docente(p_id_entidade, p_id_usuario)
```
- Só `tipo IN ('atividade','avaliacao')` com **pelo menos 1 submissão `entregue`**
- `eh_meu = (criado_por = p_id_usuario)` — decide corrigível vs 🔒 somente leitura
- Leitura extra: conteúdos com `lms_conteudo_operacional.id_programa` ∈ programas do docente
  (helper `lms_programas_do_docente`: `aca_docente → aca_docente_modulo_componente_ciclo (id_ciclo) → aca_ciclo_programa`)
- Ordena por `qtd_pendentes DESC, titulo` — **pendentes primeiro**
- Contadores: `qtd_total` / `qtd_pendentes` (nota NULL) / `qtd_corrigidas` (nota preenchida)

### 2. Entregas de um conteúdo (nível 2)
```
GET /api/docente/entregas?id_conteudo=C&id_entidade=X&id_usuario=Y
  → RPC lms_list_entregas_conteudo(p_id_conteudo, p_id_entidade, p_id_usuario)
```
- UNION de `lms_submissao_atividade` (status `entregue`) + `lms_submissao_avaliacao` (status `entregue`)
- `aluno_nome` via `aca_matricula → user_expandido` (`nome_completo` ou `email`)
- `nota`: atividade → `nota`; avaliação → `nota_total`; `status_corrigido = nota IS NOT NULL`
- Ordena por `status_corrigido, data_envio DESC` — **pendentes primeiro**
- Segurança: verifica se o docente pode ver o conteúdo (criador OU programa lecionado)

### 3. Detalhe da entrega (nível 3)
```
GET /api/docente/entrega?id_submissao=S&tipo=atividade|avaliacao&id_entidade=X&id_usuario=Y
  → RPC lms_get_entrega_detalhe(p_id_submissao, p_tipo, p_id_entidade, p_id_usuario)
```
- **Atividade:** `texto_resposta`, `id_arquivo_envio` (abre via R2 assinado)
- **Avaliação:** entrega (`nota`, `comentario`, `nome` da avaliação) + `perguntas[]` com
  `alternativas[]` incluindo **`correta` (gabarito)** e **`escolhida` (resposta do aluno)**
- `eh_meu` → flag que libera/bloqueia o form de correção no front

### 4. Salvar correção
```
POST /api/docente/correcao
  body: { tipo, id_submissao, nota, comentario, id_entidade, id_usuario }
  → RPC lms_salvar_correcao(p_tipo, p_id_submissao, p_nota, p_comentario, p_id_entidade, p_id_usuario)
```
- **Só o criador** (`lms_conteudo.criado_por = p_id_usuario`) — caso contrário `SEM_PERMISSAO` (400)
- Atualiza `nota`/`nota_total` + `comentario` + `modificado_em`
- No front: após salvar, recarrega entregas e conteúdos e **re-liga a seleção** aos objetos novos (contadores frescos)

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/docente/conteudos` | → RPC `lms_list_conteudos_entregas_docente` |
| `GET` | `/api/docente/entregas` | → RPC `lms_list_entregas_conteudo` |
| `GET` | `/api/docente/entrega` | → RPC `lms_get_entrega_detalhe` |
| `POST` | `/api/docente/correcao` | → RPC `lms_salvar_correcao` |
| `GET` | `/api/r2/sign` (reuso) | abre arquivo de resposta/anexo em outra aba |

---

## Composables

| Composable | Responsabilidade |
|---|---|
| `useDocenteEntregas` | `conteudos` + filtros (busca/tipo/só pendentes), `entregas` + filtros (busca aluno/só pendentes), `detalhe` + correção (nota/comentário/saving), `resumo` (sidebar), navegação (`selecionarConteudo`/`selecionarEntrega`/`voltarParaConteudos`/`voltarParaEntregas`); re-liga seleção após refetch |

---

## Componentes

| Componente | Props | Emits | Descrição |
|---|---|---|---|
| `DocenteEntregasPage` | `ctx` | — | 3 níveis com recolhimento (`w-80`): conteúdos → entregas → correção; `abrirArquivo` (R2 sign) |
| `DocenteEntregasSidebar` | `ctx` | — | Painel: Portal Docente (intro), Como funciona, Resumo com barra de progresso |
| `DocenteConteudosLista` | `ctx` | — | Busca + pills tipo + "Só pendentes"; linha com tipo (Atv/Ava), título, 🔒, `pendentes/total` |
| `DocenteEntregasLista` | `ctx` | — | Busca aluno + pills "Todas/Pendentes"; linha com avatar (inicial), nome, tentativa, nota ou "Pendente" |
| `DocenteCorrecao` | `detalhe`, `nota`, `comentario`, `saving`, `corrigivel`, `abrirArquivo` | `update:nota`, `update:comentario`, `salvar` | Resposta + gabarito lado a lado (✓ correta / ✕ escolhida) + form nota/comentário; 🔒 desabilita form |

---

## Lógica de Negócio

### Decisões de arquitetura

1. **SECURITY INVOKER em todas as RPCs + RLS** — nunca DEFINER (acordo do projeto)
2. **Segurança por `lms_user_expandido_id()`** — toda RPC valida `p_id_usuario = auth.uid()` (`ACESSO_NEGADO`)
3. **Correção só do criador** — `lms_salvar_correcao` valida `lms_conteudo.criado_por = p_id_usuario` no banco (não confia no front)
4. **Leitura do programa lecionado** — vínculo via `aca_docente → aca_docente_modulo_componente_ciclo → aca_ciclo_programa` (não há vínculo direto docente→programa)
5. **Gabarito visível ao docente** — `lms_get_entrega_detalhe` inclui `correta` + `escolhida` (o aluno NUNCA recebe `correta`)
6. **Contadores calculados na RPC** — `qtd_pendentes`/`qtd_corrigidas` derivam de `nota IS NULL`; lista ordena pendentes primeiro
7. **Nota por entrega, comentário por entrega** — colunas novas `comentario` em `lms_submissao_atividade` e `lms_submissao_avaliacao` (nota por questão fica para v2)
8. **Re-ligação pós-salvamento** — após gravar, refetch + re-vincula `conteudoSelecionado`/`entregaSelecionada` aos objetos novos (evita contadores stale no header)

### Vínculo docente → programa

```sql
aca_docente (id_user_expandido = usuário)
  → aca_docente_modulo_componente_ciclo (id_docente = d.id)
    → aca_ciclo_programa (id_ciclo = admcc.id_ciclo) → id_programa
```

### Escopo de correção

| Situação | `eh_meu` | Pode corrigir? |
|---|---|---|
| Docente criou o conteúdo | `true` | ✅ nota + comentário |
| Conteúdo do programa que leciona | `false` | 🔒 somente leitura (vê entrega + gabarito) |

---

## Estados da UI

| Estado | Renderização |
|---|---|
| Nível 1 (nada selecionado) | Lista de conteúdos em largura total (coluna `w-full`) |
| Nível 2 (conteúdo selecionado) | Coluna de conteúdos **recolhe** para `w-80` (animação de largura) + painel de alunos entra da direita; header "← Conteúdos" + título + `X pendente(s) de Y` + 🔒 quando somente leitura |
| "← Conteúdos" (nível 2 → 1) | Coluna de conteúdos **só cresce** (`w-80` → `w-full`, sem movimento horizontal); painel de alunos **viaja para a direita** (`translateX(100%)` + fade) e some |
| Nível 3 (entrega selecionada) | Coluna de conteúdos **desliza para fora à esquerda** (YAZI: sai do fluxo + `translateX(-105%)` + fade) + alunos `w-80` (borda à direita) + `DocenteCorrecao` no centro (entra da direita, Niri); botão **Voltar** no topo esquerdo do quadro devolve o par conteúdo\|alunos (conteúdos voltam da esquerda, correção some à direita) |
| Carregando | Spinner central ("Carregando..."/"Carregando entrega...") |
| Sem entregas | Empty state com ícone + dica de filtros |
| 🔒 Somente leitura | Pill âmbar no detalhe + form de correção esmaecido com aviso "Apenas o criador do conteúdo pode corrigir" |
| Mobile | Apenas o nível atual em tela cheia + botão de voltar no header |

---

## Contrato Visual Aplicado

(mesmo design system do admin — dark `#13131a`, acentos violeta `#7c3aed → #8b5cf6`; **ilha do menu em âmbar `#f59e0b`**)

- **Ilha Portal Docente** (`FullPageMenu`): dot e ícones âmbar (`bg-amber-500/10 text-amber-500`, hover `group-hover:text-amber-500`); botões "Atividades e Entregas" (ativo) e "Minha Conta" (placeholder desabilitado)
- **Listas**: linhas `doc-row` com tipo colorido (Atv âmbar / Ava violeta), badge `pendentes/total` (âmbar >0, verde 0), 🔒 p/ somente leitura; avatar com inicial do aluno
- **Correção** (`DocenteCorrecao`): alternativas com ✓ verde (correta) / ✕ vermelho (escolhida errada) + badge "resposta do aluno"; form de correção com borda violeta
- **Painel (sidebar)**: cards `dash-card` com títulos SVG violeta; Resumo com dots (conteúdo violeta, pendente âmbar, corrigida verde) + barra de progresso gradiente
- **Botões**: voltar (borda sutil, hover violeta), salvar (gradiente `#7c3aed → #8b5cf6` com glow, disabled enquanto salva ou sem nota)
- **Badges de status**: nota verde `#6ee7b7`, "Pendente" âmbar `#fbbf24`, tentativa cinza

---

## Dependências com outras partes do sistema

### Reusa
- `global_arquivos` + R2 (`/api/r2/sign` — abre arquivos em outra aba)
- `useProgAtividadesCore` (`getEntidadeAtivaId`/`garantirEntidade`), `useToast`
- `user_expandido` (`nome_completo`), `aca_matricula`, `lms_submissao_atividade`, `lms_submissao_avaliacao`, `lms_conteudo`, `lms_conteudo_operacional`
- `lms_user_expandido_id()` (helper de segurança do módulo do aluno)

### Nova infraestrutura criada
- 4 BFFs em `server/api/docente/`
- 1 composable (`useDocenteEntregas`) + 5 componentes (`DocenteEntregasPage`, `DocenteEntregasSidebar`, `DocenteConteudosLista`, `DocenteEntregasLista`, `DocenteCorrecao`)
- 1 página (`pages/portal-docente/entregas.vue`) + 4ª ilha no `FullPageMenu` + `pageTitle` no `base.vue`
- Migration `20260820100000_create_lms_rpc_docente.sql` (colunas `comentario` + helper `lms_programas_do_docente` + 4 RPCs)
- Migration `20260820100001` (fix `alt.ordem` do gabarito) + `20260820100002` (auditoria `corrigido_por`/`corrigido_em` + `corrigido_por_nome` no detalhe/lista)

---

## Histórico de Mudanças

### 2026-08-20 — Fase 2.4: Portal Docente (correção de entregas)

- Banco: colunas `comentario`; helper `lms_programas_do_docente`; RPCs `lms_list_conteudos_entregas_docente`, `lms_list_entregas_conteudo`, `lms_get_entrega_detalhe` (com gabarito), `lms_salvar_correcao` (só criador)
- BFFs `/api/docente/*`; composable `useDocenteEntregas`; página com 3 níveis recolhidos + sidebar de resumo
- 4ª ilha no `FullPageMenu` (**Portal Docente**, âmbar) com "Atividades e Entregas" e "Minha Conta" (placeholder)
- Escopo decidido: corrige o que criou; 🔒 somente leitura nos programas que leciona

### 2026-08-20 (pós) — Auditoria da correção + regra de UI

- Colunas `corrigido_por`/`corrigido_em` nas submissões (migration `20260820100002`); `lms_salvar_correcao` grava quem/quando; detalhe e lista retornam `corrigido_por_nome`
- Tela de correção: pill verde "Corrigido por X · DD/MM/AAAA às HH:MM" + botão "Salvar correção" vira "Editar correção" quando já corrigido
- Lista de alunos: tooltip no badge de nota com quem/quando corrigiu
- Regra de UI registrada no `design_system.md`: botões sem emoji/ícone decorativo (rótulo em texto puro)

### 2026-08-20 (pós 2) — Nível 3 no padrão YAZI/Niri

- Ao abrir a correção: coluna de conteúdos **desliza para fora à esquerda** (fade + translateX) e a correção **entra deslizando da direita** — foco total no que está sendo corrigido
- Botão **Voltar** no topo esquerdo do quadro de correção: devolve o par conteúdo\|alunos (conteúdos surgem da esquerda, correção some à direita)
- Header global no nível 3 ficou só com o contexto (aluno + tentativa/status); navegação de volta mora no quadro da correção
- Ajuste fino: a coluna de conteúdos virou **um único elemento** que cresce/encolhe por largura (`transition-all`); "← Conteúdos" faz ela **só crescer** (`w-80` → `w-full`) enquanto o painel de alunos **viaja para a direita** — o slide horizontal ficou restrito ao nível 2⇄3
- Equalização de pace: a lista de **alunos** também virou um único elemento que cresce/encolhe (`w-full` ⇄ `w-80`, mesmo easing/duração da coluna de conteúdos) — voltar da correção agora anima os dois painéis juntos
- Títulos das listas sem emoji: 👥/📋 substituídos por **SVG na cor primária** (`#a78bfa`) — regra do `design_system.md`

---

## Próximos passos

- **Nota por questão** (correção parcial) — hoje a nota é única por entrega
- **Dash de pendentes por prazo** (vencidas / próximas) no Painel
- **"Minha Conta"** do docente (placeholder no menu)
- **Permissões** (futuro): o docente verá apenas "Programação Atividades" no Acadêmico e terá sua própria ilha
- **Relatórios** (Fase 2.5): % conclusão, notas médias, CSV — puxa dados de `lms_submissao_*`
