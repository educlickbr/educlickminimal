# Padrão do Portal Docente — Avaliação de Atividades/Entregas — Recriação (`/portal-docente/entregas`)

> **Propósito:** documentar **exatamente** a página onde o **docente corrige as entregas** das atividades e avaliações. Para o agente do outro lado recriar fiel, **sem precisar ampliar**.
>
> **Escopo:** só conteúdos que o docente **criou** (pode corrigir) ou que ele **leciona** (somente leitura 🔒). O vínculo docente→programa é via `aca_docente → aca_docente_modulo_componente_ciclo → aca_ciclo_programa`.

---

## 1. Visão geral do fluxo

```
NÍVEL 1 — Conteúdos com entregas (pendentes primeiro)
  └─ clica num conteúdo → NÍVEL 2 — Alunos com entrega (pendentes primeiro)
      └─ clica num aluno → NÍVEL 3 — Correção (resposta + gabarito → nota + comentário)
```

### Arquitetura (componentes)

```
pages/portal-docente/entregas.vue                       ← orquestrador (core + toast + ctx; <NuxtLayout name="base"> + #sidebar)
components/programacao_atividades/
├── DocenteEntregasPage.vue                             ← os 3 níveis com recolhimento + animações (YAZI/Niri)
├── DocenteConteudosLista.vue                           ← NÍVEL 1: conteúdos com entregas (filtros)
├── DocenteEntregasLista.vue                            ← NÍVEL 2: alunos com entrega (filtros)
├── DocenteCorrecao.vue                                 ← NÍVEL 3: resposta/gabarito + form nota/comentário
├── DocenteEntregasSidebar.vue                          ← dashboard (intro + Como funciona + Resumo/progresso) — ver padrao_dashboard_docente.md
composables/programacao_atividades/useDocenteEntregas.ts
server/api/docente/                                     ← conteudos.get, entregas.get, entrega.get, correcao.post
```

---

## 2. Escopo de correção (regra de ouro)

| Situação | `eh_meu` | Pode corrigir? |
|---|---|---|
| Docente criou o conteúdo (`lms_conteudo.criado_por = p_id_usuario`) | `true` | ✅ nota + comentário |
| Conteúdo do programa que leciona | `false` | 🔒 somente leitura (vê resposta + gabarito, mas o form fica desabilitado/oculto) |

- **Vínculo de programa:** `aca_docente(id_user_expandido)` → `aca_docente_modulo_componente_ciclo(id_docente, id_ciclo)` → `aca_ciclo_programa(id_ciclo, id_programa)`.
- **No banco:** a RPC de correção (`lms_salvar_correcao`) **valida de novo** que o usuário é o criador — não confia no front.

---

## 3. Os 3 níveis + recolhimento (layout)

```
NÍVEL 1 — nada selecionado
[ Coluna de conteúdos (w-full) ]

NÍVEL 2 — conteúdo selecionado
[ Conteúdos (w-80) ] | [ Alunos (flex-1) ]

NÍVEL 3 — aluno selecionado
[ Conteúdos SOME p/ esquerda ] | [ Alunos (w-80) ] | [ Correção (flex-1) + botão Voltar ]
```

- **Coluna de conteúdos** e **coluna de alunos** são **um único elemento cada** que muda de largura com `transition-all` (`w-full` ⇄ `w-80`) — nunca `flex-1` (não anima bem).
- **Transições (YAZI/Niri):** conteúdos deslizam para fora à esquerda ao abrir a correção (nível 2→3) e voltam da esquerda ao voltar; correção entra/sai da direita; o grupo alunos+correção viaja para a direita ao voltar ao nível 1.
- **Receita completa da animação em `padrao_animacao_yazi_niri.md` §4.**

---

## 4. NÍVEL 1 — Lista de conteúdos (`DocenteConteudosLista`)

### Filtros (topo)

```html
<input v-model="ctx.busca.value" ... />                        <!-- busca por título -->
<button class="pill" :class="{ 'pill--on': !ctx.filtroTipo.value }" @click="ctx.filtroTipo.value = null">Todos</button>
<button ... @click="ctx.filtroTipo.value = ctx.filtroTipo.value === 'atividade' ? null : 'atividade'">Atividades</button>
<button ... >Avaliações</button>                                <!-- mesmo padrão -->
<label class="check-label ml-auto"><input v-model="ctx.soPendentes.value" type="checkbox" /> Só pendentes</label>
```

### Linha de conteúdo

- `tipo` (Atv âmbar / Ava violeta) · título · 🔒 (se `!eh_meu` — somente leitura) · badge `pendentes/total` (âmbar > 0, verde 0).
- `@click="ctx.selecionarConteudo(c)"`; ativa (`doc-row--ativa`) quando `conteudoSelecionado.id_conteudo === c.id_conteudo`.
- **Ordenação (RPC):** `qtd_pendentes DESC, titulo` — pendentes primeiro.
- Empty state e loading (spinner).

### Payload

```
GET /api/docente/conteudos?id_entidade=X&id_usuario=<user_expandido_id>
→ 200 { itens: [ {
    id_conteudo, titulo, tipo, criado_por,
    eh_meu,                       // = (criado_por === id_usuario) → corrigível
    qtd_total, qtd_pendentes, qtd_corrigidas   // base: status='entregue'; pendente = nota NULL
  } ] }
```

---

## 5. NÍVEL 2 — Lista de alunos (`DocenteEntregasLista`)

### Filtros

- Busca por nome do aluno (`ctx.buscaAluno`).
- Status: "Todas" / "Pendentes" (`ctx.soPendentesEntregas`).

### Linha de aluno

- Avatar com inicial (`inicial(nome)`) · nome · badge `T{n}` se `tentativa > 1` · badge **nota verde** (com tooltip "Corrigido por X em DD/MM às HH:MM") ou **"Pendente"** âmbar.
- `@click="ctx.selecionarEntrega(e)"`.
- **Ordenação (RPC):** `status_corrigido ASC, data_envio DESC` — pendentes primeiro.

### Payload

```
GET /api/docente/entregas?id_conteudo=C&id_entidade=X&id_usuario=U
→ 200 { itens: [ {
    id_submissao, tipo_submissao ('atividade'|'avaliacao'), id_matricula,
    aluno_nome, status, nota, comentario, data_envio, tentativa,
    corrigido_por, corrigido_em, corrigido_por_nome,
    status_corrigido            // = nota IS NOT NULL
  } ] }
```

---

## 6. NÍVEL 3 — Correção (`DocenteCorrecao`)

### Props / Emits

```ts
props:  { detalhe: any, nota: string, comentario: string, saving: boolean,
          corrigivel: boolean, abrirArquivo: (id: string) => void }
emits:  { 'update:nota', 'update:comentario', salvar }
```

### Header (pills de auditoria)

- `"{Avaliação|Atividade} · tentativa {n}"`.
- 🔒 "Somente leitura" (`!corrigivel`).
- **"Corrigido"** verde + `por {corrigido_por_nome}` + ` · {DD/MM/AAAA às HH:MM}` (`jaCorrigido` = nota preenchida; data de `corrigido_em` com fallback `modificado_em`).
- "Nota: {x}" violeta.
- Título + `detalhe.nome` (nome da avaliação, só avaliação).

### Atividade

- Card "Resposta do aluno": texto (pre-wrap) OU "Sem texto"; botão "Abrir arquivo enviado" se `id_arquivo_envio` → `abrirArquivo` (R2 sign).

### Avaliação (gabarito lado a lado)

- Para cada pergunta: enunciado + pontuação + alternativas:
  - `alt-row--correta` (borda/verde) quando `alt.correta`; marca ✓.
  - `alt-row--escolhida:not(.correta)` (vermelho) quando `alt.escolhida`; marca ✕.
  - badge "resposta do aluno" quando `alt.escolhida`.
- Dissertativa (sem alternativas): "Resposta do aluno" + `p.resposta_texto`.

### Form de correção

- **Nota** (`input type=number min=0 step=0.5`) + **Comentário** (textarea).
- Botão: **"Salvar correção"** ou **"Editar correção"** se `jaCorrigido`; desabilitado se `saving || !nota`.
- `!corrigivel` → form esmaecido (`correcao-form--leitura`) + texto "Apenas o criador do conteúdo pode corrigir".
- ⚠️ **`v-model` em `input type="number"` entrega `number`** — o setter do computed coage para string (`String(v)`) para o `trim()` não quebrar (bug corrigido).

### Payload do detalhe

```
GET /api/docente/entrega?id_submissao=S&tipo=atividade|avaliacao&id_entidade=X&id_usuario=U
→ 200 {
  tipo, id_submissao, titulo, nota, comentario, tentativa,
  corrigido_por, corrigido_em, corrigido_por_nome, eh_meu,
  // atividade:
  texto_resposta, id_arquivo_envio,
  // avaliação: + nome e perguntas (com GABARITO — só o docente vê correta):
  nome,
  perguntas: [ {
    id_pergunta, enunciado, tipo, pontuacao, ordem,
    resposta_texto, resposta_escolhida_id,
    alternativas: [ { id_resposta_possivel, texto, correta, escolhida, ordem } ]
  } ]
}
```

---

## 7. Salvar correção

```
POST /api/docente/correcao
body: { tipo, id_submissao, nota, comentario, id_entidade, id_usuario }
→ 200 { success: true, id }   (ou 400 { statusMessage: 'Apenas o criador...' })
```

- **RPC `lms_salvar_correcao`:** só o criador; grava `nota`/`nota_total` + `comentario` + **`corrigido_por`/`corrigido_em`** + `modificado_em`.
- **Front (`salvarCorrecao`):**
  1. `String(notaCorrecao.value).trim()` — se vazio, toast "Informe a nota".
  2. POST com `Number(notaStr.replace(',', '.'))`.
  3. Sucesso → atualiza `detalhe` localmente (nota, comentário, `corrigido_em=now`, `corrigido_por_nome` do store).
  4. **Re-liga a seleção:** refaz `fetchEntregas` e `fetchConteudos` e re-vincula `entregaSelecionada`/`conteudoSelecionado` ao objeto novo (contadores frescos no header).

---

## 8. Composable — estado e funções

```ts
// Estado
conteudos, conteudoSelecionado, loadingConteudos
entregas, entregaSelecionada, loadingEntregas
detalhe, loadingDetalhe, savingCorrecao, notaCorrecao, comentarioCorrecao
// Filtros
busca, filtroTipo, soPendentes          // nível 1
buscaAluno, soPendentesEntregas         // nível 2
// Computed
conteudosExibidos  // busca + tipo + só pendentes
entregasExibidas   // busca aluno + só pendentes
resumo             // { conteudos, pendentes, corrigidas } — para a sidebar
// Ações
fetchConteudos()            // onMounted
selecionarConteudo(c)       // zera entregas/seleção + fetchEntregas
selecionarEntrega(e)        // zera detalhe + fetch detalhe + preenche nota/comentario
salvarCorrecao()            // §7
voltarParaConteudos()       // zera para o nível 1
voltarParaEntregas()        // zera para o nível 2
```

---

## 9. Dashboard (`DocenteEntregasSidebar`)

- **Portal Docente** (intro) · **Como funciona** (instruções) · **Resumo** (Conteúdos / Pendentes / Corrigidas + barra de progresso `pctCorrigido`).
- Receita completa em `padrao_dashboard_docente.md`.

---

## 10. Regras de negócio (resumo)

1. **Corrige só o que criou;** leciona = 🔒 leitura (validado na RPC).
2. **Pendentes primeiro** nas duas listas.
3. **Auditoria** `corrigido_por`/`corrigido_em` + `corrigido_por_nome` em cada correção.
4. **Gabarito só para o docente** — a RPC do docente inclui `correta` + `escolhida`; a do aluno omite.
5. **`409` não se aplica aqui** (correção não tem prazo) — erros: `ACESSO_NEGADO` (400/403) e `SEM_PERMISSAO` (400).
6. **Re-link pós-salvamento** mantém o header/contadores atualizados sem estado stale.
7. **Botão "Salvar"/"Editar"** muda conforme `jaCorrigido`; `0` é nota válida (botão checa `!nota` com nota sempre string via setter).

---

## 11. Estados da UI

| Estado | Renderização |
|---|---|
| Nível 1 (nada selecionado) | Lista de conteúdos `w-full` |
| Nível 2 (conteúdo selecionado) | Conteúdos `w-80` + alunos; header "← Conteúdos" + título + `X pendente(s) de Y` + 🔒 se leitura |
| Nível 3 (aluno selecionado) | Conteúdos saem p/ esquerda; alunos `w-80` + correção; botão **Voltar** no topo da correção |
| Carregando | Spinner central ("Carregando..."/"Carregando entrega...") |
| Sem entregas | Empty state com ícone + dica |
| 🔒 somente leitura | Pill âmbar + form esmaecido + aviso |
| Salvar | Spinner no botão + toast "Correção salva!" |
| Erro | Toast (statusMessage ou message) |

---

## 12. Checklist para recriar

- [ ] 3 níveis com recolhimento (`w-full` ⇄ `w-80`, `transition-all`) — ver `padrao_animacao_yazi_niri.md`.
- [ ] Nível 1: filtros (busca, tipo, só pendentes), 🔒, badge pendentes/total; `selecionarConteudo`.
- [ ] Nível 2: filtros (busca aluno, só pendentes), avatar/inicial, tentativa, nota/pendente + tooltip; `selecionarEntrega`.
- [ ] Nível 3: pills de auditoria (🔒, Corrigido por X em ..., Nota), gabarito lado a lado (✓/✕/resposta do aluno), form nota+comentário, botão Salvar/Editar.
- [ ] `v-model` number → setter coage para string (senão `.trim()` quebra).
- [ ] `salvarCorrecao` com re-link pós-refetch.
- [ ] Dashboard com progresso (ver `padrao_dashboard_docente.md`).
- [ ] RPCs: `lms_list_conteudos_entregas_docente`, `lms_list_entregas_conteudo`, `lms_get_entrega_detalhe` (gabarito), `lms_salvar_correcao` (só criador + auditoria).
- [ ] `SECURITY INVOKER` + validação `lms_user_expandido_id()` em todas.
