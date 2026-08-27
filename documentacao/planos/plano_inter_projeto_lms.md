# Plano Inter-projeto — Recriação do LMS (EduClick)

> **Propósito:** permitir que um agente em **outro projeto** (Nuxt 3/4 + Supabase + BFF SSR) recrie o **LMS completo** deste sistema com **fidelidade funcional**, apenas consumindo este documento. O visual é adaptável ao design system do outro projeto; **contratos de API, modelo de dados, regras de negócio e segurança devem ser fiéis**.
>
> **Como usar:** siga as fases da seção [11. Passo a passo de recriação](#11-passo-a-passo-de-recriação) na ordem. As seções 4–10 são a especificação; a seção 12 mostra como estender com novas features (ex.: pré-requisitos de conteúdo).
>
> **Fonte:** implementação real em `supabase/migrations/`, `front_end/server/api/`, `front_end/app/` + docs `documentacao/paginas/{programacao_atividades,minhas_atividades,portal-docente}.md` e `documentacao/planos/arquitetura_lms.md`.

---

## 1. Visão geral do produto

LMS com **duas camadas** desacopladas + **consumo pelo aluno** + **correção pelo docente**:

```
Repositório (conteúdo solto) → Distribuição (Blueprint: Área/Curso/Módulo/Componente) → Currículo (Operacional: Programa/Ciclo/Aula)
  → Aluno (Minhas Atividades) → Docente (Portal Docente: correção de entregas)
```

- **Repositório:** o "drive" pedagógico — conteúdos criados soltos (material/atividade/avaliação), opcionalmente agrupados em **blocos** (organizadores N:N).
- **Distribuição (Blueprint):** mapeamento perene — **4 sub-abas** (Área/Curso/Módulo/Componente) independentes: escolhe a aba, lista os itens daquele escopo, escolhe um item e associa conteúdo/bloco diretamente a ele (toggle). **Não é navegação em cascata** — ver `padrao_subabas_distribuicao.md`.
- **Currículo (Operacional):** a oferta viva — seleciona um **Programa** (dropdown) e vê a **árvore de acordeons**: conteúdo de Área, pasta de Componentes, pasta de Módulos/Ciclos com Aulas. Conteúdos herdados da distribuição podem ser **desativados para aquele programa** (`ativo=false` no operacional); para injetar conteúdo, escolhe a pasta (**escopo alvo**) e usa o navegador com radio/toggle. **Não é navegação por abas** — ver `padrao_curriculo_admin.md`.
- **Aluno:** entra num programa (matrícula), navega a árvore (ou resumo), abre conteúdo (material marca como visto; atividade entrega com rascunho; avaliação com timer/tentativas), vê nota e comentário do professor.
- **Docente:** vê conteúdos com entregas (pendentes primeiro), clica → alunos, clica → correção (nota + comentário). **Corrige o que criou; somente leitura (🔒) no que leciona.**

---

## 2. Conceitos-chave

| Conceito | Explicação |
|---|---|
| **Blueprint** | Camada imutável (distribuição): o que a instituição oferece em qualquer turma. |
| **Operacional** | Camada viva (currículo): o que a turma (programa) realmente consome; pode desativar herança e injetar conteúdo. |
| **Escopo de distribuição** | `area` \| `curso` \| `modulo` \| `componente` (exatamente 1 por linha). |
| **Escopo operacional** | `programa` \| `ciclo` \| `calendario(aula)` (exatamente 1 por linha). |
| **Herança (herdado)** | Conteúdo que vem da distribuição (sem linha operacional específica); se existir linha operacional, ela **sobrescreve** (ex.: desativa para aquele programa). |
| **Timing** | `data_disponivel` (agendado) e `data_entrega_limite` (prazo). Fora do prazo = **bloqueado, não some**. |
| **Escopo de conteúdo do aluno** | `programa` (soltos), `componente`, `modulo`, `ciclo`, `calendario` — o aluno vê a árvore completa, mesmo escopos vazios (acordeon sempre visível). |

---

## 3. Estrutura acadêmica que o LMS consome (existente, reutilizar)

O LMS **não cria** a estrutura acadêmica — ela vem do módulo acadêmico:

- `aca_area(id, nome_area, id_entidade)`
- `aca_curso(id, nome_curso, id_entidade, id_area, tipo_modelo)`
- `aca_modulo(id, nome_modulo, id_entidade)`
- `aca_componente(id, nome_componente, id_entidade)`
- `aca_curso_modulo(id_curso, id_modulo, ordem)`
- `aca_modulo_componente(id_modulo, id_componente)` — vínculo componente→módulo (usado para "componente é de módulo")
- `aca_programa(id, id_entidade, id_curso, descricao)` — a "turma/oferta"
- `aca_ciclo(id, id_entidade, id_modulo, descricao, data_ini, data_fim)` — período letivo
- `aca_ciclo_programa(id_ciclo, id_programa)` — ciclo pertence ao programa
- `aca_calendario(id, id_entidade, id_ciclo, dt_hora_ini, dt_hora_fim, observacao)` — aula do cronograma
- `aca_matricula(id, id_entidade, id_programa, id_usuario, status)` — aluno matriculado (`id_usuario` → `user_expandido.id`)
- `aca_docente(id, id_entidade, id_user_expandido, ativo)` + `aca_docente_modulo_componente_ciclo(id_docente, id_ciclo, id_modulo_componente, tipo)` — vínculo docente→ciclo (→ programa via `aca_ciclo_programa`)
- `user_expandido(id, id_user, email, nome_completo)` — perfil (nome real é `nome_completo`)
- `user_entidades(id, nome_entidade, tipo, ...)` — tenant; tudo tem `id_entidade`

> O nome do tenant no EduClick é **`user_entidades`** (não `empresa`). Adaptar ao equivalente do outro projeto.
>
> **Dinâmica de sub-abas da Distribuição (essencial):** ver `documentacao/planos/padrao_subabas_distribuicao.md` — as abas são independentes e a associação é direta a qualquer item; não confundir com navegação em cascata.

---

## 4. Modelo de dados do LMS (schema real, pós-refactor)

### Enums

```sql
lms_tipo_item              -- 'material' | 'atividade' | 'avaliacao'
lms_tipo_submissao_atv     -- 'texto' | 'arquivo' | 'texto_arquivo' (da lms_atividade)
lms_tipo_pergunta          -- 'multipla_escolha' | 'dissertativa'
lms_status_submissao       -- 'em_andamento' | 'entregue' (avaliação: + 'finalizada'? — ver migration)
```

### Tabelas

| Tabela | Colunas (relevantes) | Notas |
|---|---|---|
| `lms_conteudo` | `id`, `id_entidade`, `tipo` (enum), `titulo`, `descricao`, `ordem`, `id_arquivo` (→`global_arquivos`), `url`, `data_disponivel`, `data_entrega_limite`, `duracao_minutos`, `tentativas_permitidas` (default 1), `pontuacao_maxima`, `ativo`, `criado_por` (→`user_expandido`), `criado_em`, `modificado_em` | O conteúdo central; vive solto. |
| `lms_conteudo_bloco` | `id`, `id_conteudo`, `id_bloco`, `UNIQUE(id_conteudo, id_bloco)` | N:N conteúdo↔bloco (0..N blocos). |
| `lms_bloco` | `id`, `id_entidade`, `titulo`, `descricao`, `ordem`, `criado_por`, timestamps | Organizador opcional. |
| `lms_atividade` | `id`, `id_conteudo` (UNIQUE), `id_arquivo_referencia`, `tipo_submissao` | 1:1 com conteúdo tipo 'atividade'. |
| `lms_avaliacao` | `id`, `id_conteudo` (UNIQUE), `nome`, `descricao`, `id_arquivo_referencia`, `ordem_perguntas` ('fixa'\|'aleatoria'), **`ambiente_seguro` bool**, **`autoavaliacao` bool** (adições da 2.3) | 1:1 com conteúdo tipo 'avaliacao'. |
| `lms_pergunta` | `id`, `id_avaliacao`, `tipo` (enum), `enunciado`, `pontuacao`, `obrigatoria`, `ordem`, `id_arquivo` | |
| `lms_resposta_possivel` | `id`, `id_pergunta`, `texto`, `correta`, `ordem`, `id_arquivo` | Alternativas (gabarito no banco — nunca vaza para o aluno). |
| `lms_distribuicao` | `id`, `id_entidade`, `id_bloco` XOR `id_conteudo` (check), `id_area`/`id_curso`/`id_modulo`/`id_componente` (exatamente 1, check), `ativo` | Blueprint. |
| `lms_conteudo_operacional` | `id`, `id_entidade`, `id_bloco` XOR `id_conteudo`, `id_programa`/`id_ciclo`/`id_calendario` (exatamente 1, check `lms_conteudo_operacional_um_escopo`), `id_distribuicao_origem`, `ativo`, `destaque` bool (default false), `data_disponivel`, `data_entrega_limite`, `duracao_minutos`, `tentativas_permitidas` | Currículo vivo. **UNIQUE funcional** (NULLs como '0000...') para não duplicar o mesmo conteúdo no mesmo escopo. |
| `lms_submissao_atividade` | `id`, `id_entidade`, `id_conteudo`, `id_matricula`, `texto_resposta`, `id_arquivo_envio`, `data_inicio`, `data_envio`, `tentativa`, `status`, `nota`, **`comentario`**, **`corrigido_por`**, **`corrigido_em`**, `criado_em`, `modificado_em`, `UNIQUE(id_conteudo, id_matricula, tentativa)` | |
| `lms_submissao_avaliacao` | `id`, `id_entidade`, `id_conteudo`, `id_matricula`, `tentativa`, `data_inicio`, `data_entrega`, `status`, `nota_total`, **`comentario`**, **`corrigido_por`**, **`corrigido_em`**, timestamps, `UNIQUE(...)` | |
| `lms_resposta_aluno` | `id`, `id_submissao_avaliacao`, `id_pergunta`, `id_resposta_possivel`, `texto_resposta`, `id_arquivo_envio`, `UNIQUE(id_submissao_avaliacao, id_pergunta)` | |
| `lms_progresso_aluno` | `id`, `id_entidade`, `id_conteudo`, `id_matricula`, `concluido`, `visto_em`, `UNIQUE(id_conteudo, id_matricula)` | Material visto / conclusão. |
| `global_arquivos` | `id`, `criado_por`, `empresa_id`, ... | Storage R2/Bunny (ver §10). |

### Regras de constraint importantes

- `lms_distribuicao_um_escopo` e `lms_conteudo_operacional_um_escopo` (exatamente 1 escopo).
- `lms_distribuicao_alvo_check` / `lms_operacional_alvo_check`: `id_bloco` XOR `id_conteudo`.
- Índice **único funcional** no operacional para tratar NULLs: `(COALESCE(id_conteudo::text,'0000'), COALESCE(id_programa::text,'0000'), ...)` — evita duplicar conteúdo no mesmo escopo.

---

## 5. Regras de negócio (obrigatórias)

1. **Visibilidade (timing)** — 3 estados calculados: `agendado` (`data_disponivel > now()`), `prazo_encerrado` (`data_entrega_limite < now()` para atividade/avaliação), `disponivel`. Fora do prazo = **bloqueado, não some**.
2. **Ativo/Destaque/Herdado** — conteúdo operacional com `ativo=false` é **oculto para o aluno**; `destaque` marca destaque; `herdado = (linha operacional não existe)` — quando não há linha, vale a distribuição (padrão "sim").
3. **Correção** — só o **criador do conteúdo** corrige (`lms_conteudo.criado_por`); quem leciona o programa **vê somente leitura** (🔒). Nota + comentário; auditoria `corrigido_por`/`corrigido_em`.
4. **Tentativas** — `tentativas_permitidas` no operacional; reenvio enquanto `tentativa < permitidas` (avaliação). Atividade: entrega única (reenvio configurável fica para depois).
5. **Autoavaliação** — avaliação com `autoavaliacao=true`: **sem dissertativas** (validar no admin e na RPC), nota calculada na hora ao finalizar (soma pontuações corretas → `nota_total`).
6. **Ambiente seguro (modo prova v1)** — `ambiente_seguro=true`: **fullscreen** + `visibilitychange` com aviso ao sair. Trava de navegação fica para depois.
7. **Ordem aleatória** — `ordem_perguntas='aleatoria'`: embaralha perguntas **e** alternativas na RPC do aluno (nunca no banco).
8. **Gabarito nunca vai ao aluno** — a RPC do aluno omite `correta`; a RPC do **docente** inclui `correta` + `escolhida` (gabarito lado a lado).
9. **Timer** — o servidor manda `data_entrega_limite`/`duracao_minutos`; o front faz contagem e **auto-envia ~3s antes** do fim (evita race com `PRAZO_EXPIRADO`).
10. **Erros de negócio → HTTP** — RPC retorna `{success:false, code, message}` → BFF converte: `PRAZO_EXPIRADO` → `409`, demais → `400`. RPCs sem permissão → `ACESSO_NEGADO`.
11. **Rascunho de atividade** — status `rascunho`; a RPC de conteúdos retorna o texto/arquivo da última tentativa (pré-carregar ao reabrir).
12. **Upload na dissertativa** — `lms_resposta_aluno.id_arquivo_envio` gravado ao finalizar.
13. **Escopos do aluno** — a árvore mostra TODOS os escopos (componentes, módulos, aulas) mesmo vazios; o conteúdo aparece onde foi associado.

---

## 6. RLS e segurança (acordo: **SECURITY INVOKER** — nunca DEFINER)

- Todas as RPCs do LMS: `SECURITY INVOKER` + validação interna de usuário.
- Helpers (funções SQL):
  - `lms_user_expandido_id()` → `SELECT id FROM user_expandido WHERE id_user = auth.uid()`.
  - `lms_usuario_eh_gestor()` → JWT `papel` = 'admin' OU `LIKE 'aca_%'` **exceto** `aca_estudante`/`aca_candidato`.
  - `lms_usuario_eh_estudante()` → JWT `papel` = 'aca_estudante'.
  - `lms_usuario_pertence_entidade(p_id_entidade)` → JWT `entidades` (array) contém o id.
- Policies (resumo):
  - **Conteúdo/operação (gestor):** `lms_usuario_eh_gestor() AND lms_usuario_pertence_entidade(id_entidade)` — ALL.
  - **Conteúdo (estudante):** SELECT amplo via JWT (barato, sem join pesado) — `lms_usuario_eh_estudante() AND lms_usuario_pertence_entidade(id_entidade)`.
  - **Submissão (estudante):** select/insert/update **own** (matrícula do `auth.uid()` via `aca_matricula`→`user_expandido`); gestor ALL.
  - **Resposta do aluno:** gestor ALL (via entidade da submissão) + estudante own + estudante **delete own** (para a RPC limpar).
  - **Progresso:** gestor ALL + estudante own (select/insert/update).
- Papéis reais: `admin`, `aca_coordenador`, `aca_admin_plataforma`, `aca_docente`, `aca_estudante`, `aca_candidato`, `user_fin`, `user_crm` (tabelas `user_papeis`/`user_papeis_auth`).

---

## 7. Catálogo de RPCs

### Admin — Repositório
- `lms_list_conteudos(p_id_entidade, p_busca, p_tipo, p_filtro_meus, p_pagina, p_limite)` → `{itens, qtd_total, pagina_atual}` com `criado_por_nome` (join `user_expandido.nome_completo`).
- `lms_upsert_conteudo(...)` — cria/edita conteúdo (material/atividade/avaliação + perguntas/alternativas via REPLACE).
- `lms_delete_conteudo(p_id_conteudo, p_id_entidade, p_usuario_id)`.
- `lms_associar_conteudo_bloco(p_id_bloco, p_id_conteudo, p_ordem)` — N:N.
- `lms_list_blocos(...)`, `lms_upsert_bloco(...)`, `lms_delete_bloco(...)`.

### Admin — Distribuição
- `lms_list_itens_escopo(p_id_entidade, p_tipo_escopo)` — itens de um escopo (área/curso/módulo/componente) para a sub-aba (cada aba lista **todos** os itens daquele escopo, sem hierarquia).
- `lms_list_associacoes_distribuicao(p_id_entidade, p_escopo, p_escopo_id)` → `{id, id_conteudo}` (para marcar `associado`).
- `lms_associar_distribuicao(...)` — cria linha em `lms_distribuicao` com **exatamente um** escopo preenchido (`id_area`/`id_curso`/`id_modulo`/`id_componente` dinâmico) + alvo `id_bloco` XOR `id_conteudo`. **Dinâmica de sub-abas detalhada em `padrao_subabas_distribuicao.md`.**

### Admin — Currículo
- `lms_list_programas_para_curriculo(p_id_entidade)` → programas com curso/área.
- `lms_list_curriculo(p_id_programa, p_id_entidade)` → `{programa, area, componentes[], modulos[{nome, conteudos[], ciclos[{nome, conteudos[], aulas[{nome, conteudos[]}]}]}]}` — árvore completa (escopos sempre presentes, vazios se preciso).
- `lms_upsert_curriculo(p_id_programa, p_id_entidade, p_escopo_tipo, p_escopo_id, p_id_conteudo, p_ativar, p_destaque, p_usuario_id)` — injeta/desativa/destaca conteúdo no programa (cria linha operacional).
- `lms_toggle_ativo_curriculo(...)`, `lms_toggle_destaque_curriculo(...)`.
- **Dinâmica de acordeons + escopo alvo detalhada em `padrao_curriculo_admin.md`** (o Currículo NÃO usa abas — usa dropdown de programa + pastas + navegador com radio/toggle).
- **Dropdown rico de seleção de programa detalhado em `padrao_selecao_programa_curriculo.md`** (botão customizado de 2 linhas + resets ao trocar + carregamento em paralelo).

### Aluno
- `lms_get_programas_do_aluno(p_id_entidade, p_id_usuario)` → matrículas ativas com curso/qtd ciclos.
- `lms_get_curriculo_estrutura(p_id_programa, p_id_entidade, p_id_usuario)` → árvore (componentes, módulos, ciclos, aulas) — **reuso do admin**.
- `lms_get_conteudos_do_aluno(p_id_programa, p_id_entidade, p_id_matricula, p_escopo_tipo, p_escopo_id)` → conteúdos de um escopo com status: `status_visibilidade`, `atividade_status/nota/tentativa/texto/arquivo/comentario/corrigido_em/corrigido_por_nome`, `avaliacao_*` idem, `concluido`. (6 branches: programa/area/componente/modulo/ciclo/calendario.)
- `lms_get_avaliacao_para_aluno(p_id_conteudo, p_id_entidade, p_id_matricula)` → **sem gabarito** + `ambiente_seguro`/`autoavaliacao` + ordem aleatória quando configurada.
- `lms_iniciar_submissao_avaliacao(...)` → valida prazo/tentativas, cria submissão, retorna `data_entrega_limite`.
- `lms_finalizar_submissao_avaliacao(...)` → grava respostas (alternativa/texto/arquivo), entrega, calcula nota se autoavaliação.
- `lms_upsert_submissao_atividade(...)` → rascunho/entrega de atividade (multi-tentativa por UNIQUE).
- Progresso: upsert direto via RLS em `lms_progresso_aluno` (marca material visto).
- **Fluxo completo do aluno (cards de curso → árvore → conteúdo) em `padrao_minhas_atividades_aluno.md`.**

### Docente (Portal Docente)
- `lms_programas_do_docente(p_id_usuario)` (helper) → programas via `aca_docente → aca_docente_modulo_componente_ciclo → aca_ciclo_programa`.
- `lms_list_conteudos_entregas_docente(p_id_entidade, p_id_usuario)` → conteúdos com entregas: `eh_meu` (= criado por), `qtd_total/pendentes/corrigidas`; corrigível = criado por; leitura = programa lecionado.
- `lms_list_entregas_conteudo(p_id_conteudo, p_id_entidade, p_id_usuario)` → entregas por aluno (UNION atividade+avaliação, `aluno_nome`, nota, comentário, tentativa, corrigido_em, corrigido_por_nome).
- `lms_get_entrega_detalhe(p_id_submissao, p_tipo, p_id_entidade, p_id_usuario)` → entrega + **gabarito** (correta + escolhida) p/ docente.
- `lms_salvar_correcao(p_tipo, p_id_submissao, p_nota, p_comentario, p_id_entidade, p_id_usuario)` → **só o criador**; grava `corrigido_por`/`corrigido_em`.

> **Assinatura exata importa** — em Postgres, parâmetro com DEFAULT seguido de parâmetros sem DEFAULT é erro; e `CREATE OR REPLACE` não troca assinatura. Ao refazer, decida a assinatura final de uma vez (a história deste projeto teve overloads órfãos por isso).

---

## 8. BFFs (server/api)

Padrão: `serverSupabaseClient(event)` + `getQuery(event)`/`readBody(event)` → `client.rpc('nome', {p_*})` → `throw createError({statusCode: 500|400|409, message})` → retorna o JSONB da RPC.

- `server/api/programacao_atividades/` — `conteudos.get.ts`, `conteudo.post.ts`, `conteudo_bloco.post.ts`, `blocos.get.ts`, `bloco.post.ts`, `distribuicao*`, `curriculo/{programas.get,index.get,index.post}.ts` (associação exige escopo alvo; valida `modificado_por` existente), `avaliacao.{get,post}.ts` (avaliação completa com perguntas para o admin).
- `server/api/minhas_atividades/` — `programas.get.ts`, `estrutura.get.ts`, `conteudos.get.ts`, `avaliacao.get.ts` (sem gabarito), `progresso.post.ts`, `atividade.post.ts`, `avaliacao/{iniciar,finalizar}.post.ts`.
- `server/api/docente/` — `conteudos.get.ts`, `entregas.get.ts`, `entrega.get.ts`, `correcao.post.ts`.
- `server/api/r2/` — `sign.get.ts` (URL assinada p/ abrir arquivo em outra aba), `upload.post.ts`, `delete.post.ts` (valida `criado_por`).

---

## 9. Front (padrão de arquitetura)

Pipeline: **Orquestrador (página) → Componente de página → Composable → BFF → RPC**.

- **Orquestrador:** `pages/<rota>/index.vue` instancia `useProgAtividadesCore()` + `useToast()` + o composable da feature e renderiza `<NuxtLayout name="base">` com `<template #sidebar>` (quadrante direito) e o componente de página. Sem fetch inline — tudo no composable.
- **Composable de feature** recebe deps: `{ getEntidadeAtivaId, garantirEntidade, toast }`. `garantirEntidade()` chama `store.initSession()` se necessário e retorna a entidade ativa (produto `academico`).
- **Convenções de template:** `ctx.ref.value` (props do composable são refs); `v-model="ctx.ref.value"`; interface de linha com tipo colorido + badges; estados: loading spinner, empty state, lista.
- **Padrões de UI reutilizáveis:** lista que **recolhe para `w-80`** ao selecionar (currículo/distribuição/aluno/docente); painel lateral com filtros clicáveis; botão voltar com SVG; **sem emoji em botões/títulos** (SVG na cor primária; emoji só em badge de estado como 🔒).
- **Layout `base.vue`:** header (pageTitle) + `<slot/>` + `<aside #sidebar>` (dashboard/painel da página). Mobile: drawers (overlay + painel slide da direita) para navegação/filtros. **Dashboards do quadrante direito — receitas completas:** `padrao_dashboard_curriculo.md` (admin — filtro por estado do currículo), `padrao_dashboard_aluno.md` (filtros por tipo/status/escopo) e `padrao_dashboard_docente.md` (resumo + progresso). Nota: nas tabs **Repositório/Distribuição** a sidebar é um card informativo simples ("Programação de Atividades" com instruções das 3 tabs) — sem dashboard interativa.
- **FullPageMenu:** overlay com **ilhas** (Acadêmico violeta, Comercial esmeralda, Portal do Aluno sky, Portal Docente âmbar) e botões que navegam.
- **Sessão:** store `useAppStore` (`initSession` → `/api/me`), `user_expandido_id`, `entidades`, `hash_base` (assinatura de storage). Helpers `lms_user_expandido_id()`/`eh_gestor` no banco.
- **Animação de navegação (refinamento opcional):** transições "painel desliza" (YAZI/Niri) entre níveis de lista→detalhe. **Receita completa ponto a ponto em `documentacao/planos/padrao_animacao_yazi_niri.md`** (código exato: computed de classes, CSS de transição, easing, gatilhos, mobile).

---

## 10. Infraestrutura (dependências)

- **Storage:** `global_arquivos` + R2/Bunny; `/api/r2/sign` devolve URL assinada; `hash_base` (assinatura Bunny) renovada via `/api/refresh-hash` (~5 min).
- **Upload:** `UploadMini` (componente de upload com prévia e id do arquivo) usado em atividade e resposta dissertativa.
- **useToast:** toasts de sucesso/erro (erros de RPC → `statusMessage`).
- **useProgAtividadesCore:** `getEntidadeAtivaId()`/`garantirEntidade()` — compartilhado por todas as features do LMS.
- **Supabase:** `@nuxtjs/supabase` — `serverSupabaseClient`/`serverSupabaseUser` no BFF; auth no front.

---

## 11. Passo a passo de recriação

> Ordem das migrations do projeto original (referência para sequência e divisão lógica; o outro projeto pode consolidar, mantendo a ordem de dependências):

| Fase | Entregas | Migrations de referência |
|---|---|---|
| **F0 — Base LMS** | Enums, `lms_conteudo`, `lms_bloco`/`lms_conteudo_bloco`, `lms_atividade`, `lms_avaliacao`, `lms_pergunta`, `lms_resposta_possivel`, `lms_distribuicao`, `lms_conteudo_operacional`, `lms_submissao_*`, `lms_resposta_aluno`, `lms_progresso_aluno`, índices, constraints, **RLS completa** + helpers | `20260727100000`, `...00002`, `20260806100005` |
| **F1 — Admin Repositório** | RPCs de conteúdo/bloco + BFFs + aba Repositório (lista/busca/upload/editor com perguntas) | `...00001`, `...00003`, `...00004`, `...00008..00011` |
| **F2 — Admin Distribuição** | RPCs + aba Distribuição (**4 sub-abas** independentes Área/Curso/Módulo/Componente; item → painel de associação com toggle) | `...00007` |
| **F3 — Admin Currículo** | RPCs + aba Currículo (**dropdown de programa + acordeons + escopo alvo + navegador com radio/toggle/timing**) | `...00012..00019`, `20260729100000` (lazy), `...00001` (escopo programa) |
| **F4 — Avaliação (admin)** | Editor completo de avaliação (perguntas/alternativas, flags ambiente_seguro/autoavaliacao) | `20260806100000..00002` |
| **F5 — Aluno** | Programas → estrutura → conteúdos → material/atividade/avaliação (timer, tentativas, autoavaliação, modo prova, upload dissertativa, ordem aleatória) | `20260806100005`, `20260819100000..00003` |
| **F6 — Docente** | Portal Docente (conteúdos com entregas → alunos → correção nota+comentário, auditoria, somente leitura) | `20260820100000..00002` |
| **F7 — Feedback ao aluno** | Aluno vê nota + comentário + quem/quando (card e listagem) | `20260820100003` |

### Sequência de implementação sugerida por frente

1. **Banco:** F0 (tabelas + RLS + helpers) → F1..F4 (RPCs admin) → F5 (RPCs aluno) → F6 (RPCs docente).
2. **BFFs:** um por RPC, no mesmo diretório da feature.
3. **Front:** core (store/sessão/`useProgAtividadesCore`/toast/layout/FullPageMenu) → Repositório → Distribuição → Currículo → Avaliação admin → Minhas Atividades → Portal Docente → feedback do aluno.
4. **Teste por fase:** push + restart; percorrer a tela; conferir erros HTTP esperados.

---

## 12. Extensibilidade — como adicionar features

O modelo foi desenhado para crescer sem quebrar. Padrão geral para uma feature nova:

1. **Banco:** nova coluna/tabela em migration nova (nunca editar migration subida); RPC respeita `SECURITY INVOKER` + validação de usuário.
2. **Regra de negócio:** calcular na RPC (fonte da verdade), exibir no front.
3. **Front:** nova condição de estado no card/linha existente.

### Exemplo A — Liberar conteúdo só depois de concluir outro (pré-requisitos)

- **Dados:** `lms_conteudo_operacional.pre_requisito_id UUID REFERENCES lms_conteudo(id)` (ou tabela N:N `lms_conteudo_pre_requisito(id_conteudo, id_requisito)` para múltiplos).
- **Regra:** na RPC `lms_get_conteudos_do_aluno`, para cada conteúdo com pré-requisito, calcular `requisito_concluido = EXISTS(lms_progresso_aluno WHERE id_conteudo = pre_requisito_id AND id_matricula = X AND concluido)` e expor `status_visibilidade = 'bloqueado_requisito'`.
- **Front:** linha/card com cadeado + "Conclua 'X' primeiro" (não some — bloqueado com aviso, como prazo encerrado).

### Exemplo B — Nota por questão (correção parcial docente)

- `lms_resposta_aluno` ganha `nota_questao NUMERIC(6,2)` + `comentario_questao TEXT`; `lms_salvar_correcao` aceita lista de notas por pergunta e recalcula `nota_total` (atividade: `lms_submissao_atividade.nota`). UI: input de nota por pergunta no gabarito.

### Outras features mapeadas (fila futura)

- Reenvio de atividade configurável (admin) — hoje entrega única.
- Modo prova completo (trava de navegação, não só aviso).
- Banco de questões reutilizável (hoje o editor de avaliação faz REPLACE e apaga tudo).
- Notificações in-app ("avaliação disponível", "prazo em 24h", "entrega corrigida").
- Relatórios por entidade (% conclusão via `lms_progresso_aluno`, notas via submissões) — **depende de permissões por entidade**.
- Permissões multientidade (menu/telas por entidade × papel) — ver `documentacao/planos/plano-multientidade-permissoes.md`.

---

## 13. Checklist antes de entregar a recriação

- [ ] Tabelas criadas com constraints de escopo (1 escopo por linha) e índices únicos funcionais.
- [ ] RLS habilitada em todas as tabelas `lms_*`; helpers (`lms_user_expandido_id`, `lms_usuario_eh_gestor/estudante`, `lms_usuario_pertence_entidade`) funcionando.
- [ ] RPCs: `SECURITY INVOKER`; assinaturas finais; `ACESSO_NEGADO` quando usuário não confere; erros de negócio retornam `{success:false, code}`.
- [ ] BFFs traduzem RPC → HTTP (409 prazo expirado, 400 negócio, 500 erro).
- [ ] Aluno: gabarito nunca vaza; fora do prazo bloqueia; autoavaliação sem dissertativa; ordem aleatória ok; rascunho pré-carregado.
- [ ] Docente: corrige só o que criou; 🔒 no que leciona; auditoria `corrigido_por/em`.
- [ ] Aluno vê nota + comentário + quem/quando.
- [ ] Upload R2 assinado abre arquivo em nova aba.
- [ ] `npx supabase db push` limpo em sequência; bateria de testes por frente (2.0–2.4).

---

## 14. Adaptações visuais (permitidas no outro projeto)

O comportamento, os contratos e as regras devem ser fiéis. O visual pode adaptar:

- Cores primárias, tipografia, raios, sombras → tokens do design system local.
- Ícones/emojis de status (🔒, ✓) → equivalentes locais.
- Layout do menu de ilhas e do quadrante direito (sidebar) → estrutura de navegação local.
- Animações de transição (YAZI/Niri) → opcionais.
- Nomenclatura de telas em português pode ser traduzida.

O que **não** muda: pipeline Blueprint→Operacional→Aluno→Docente, escopos, timing, tentativas, autoavaliação, ambiente seguro, correção com auditoria, RLS por tenant, e a regra de ouro **SECURITY INVOKER**.
