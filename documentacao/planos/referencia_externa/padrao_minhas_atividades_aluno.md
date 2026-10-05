# Padrão do Consumo do Aluno — Recriação (`/minhas_atividades`)

> **Propósito:** documentar **exatamente** como o **aluno** consome o LMS — da **seleção do curso** (cards) até abrir/responder um conteúdo — **incluindo a navegação central (toggle Menu | Resumo), a árvore, a lista de resumo e os filtros**. Para o agente do outro lado recriar fiel, **sem precisar ampliar**.
>
> **⚠️ Importante sobre "abas":** o consumo do aluno **NÃO tem abas** (tabs) de escopo. A navegação é por **acordeons** (árvore) com um **toggle de visão** (Menu | Resumo) no header. Se o outro projeto pensou em abas, está errado — ver §4.

---

## 1. Visão geral do fluxo

```
Cards de programa (matrículas) → entrar no curso → visão central (toggle Menu | Resumo)
  → clicar num conteúdo → visão recolhe à esquerda + conteúdo no centro
  → material (abre e marca visto) / atividade (rascunho/entrega) / avaliação (timer/tentativas)
```

### Arquitetura (componentes)

```
pages/minhas_atividades/index.vue                     ← orquestrador (core + toast + ctx; <NuxtLayout name="base"> + #sidebar)
components/minhas_atividades/
├── MinhasAtividadesPage.vue                          ← cards de curso + contexto (visão central ⇄ detalhe) + drawers mobile
├── MinhasAtividadesSidebar.vue                       ← dashboard (Como funciona, Por tipo, Status, Por escopo) — ver padrao_dashboard_aluno.md
├── ConteudoArvore.vue                                ← árvore (Menu) com lazy
├── ConteudoLista.vue                                 ← lista agrupada (Resumo) — reusa ConteudoLinha
├── ConteudoLinha.vue                                 ← linha com tipo + badges
├── VisaoToggle.vue                                   ← toggle Menu | Resumo
├── ConteudoMaterial.vue / ConteudoAtividade.vue / ConteudoAvaliacao.vue  ← os 3 tipos
composables/programacao_atividades/useMinhasAtividades.ts
server/api/minhas_atividades/                         ← programas, estrutura, conteudos, avaliacao, progresso, atividade, avaliacao/{iniciar,finalizar}
```

---

## 2. Seleção do curso (cards de programa)

- `onMounted → fetchProgramas()`:

```
GET /api/minhas_atividades/programas?id_entidade=X&id_usuario=<user_expandido_id>
→ 200 { itens: [ { id_matricula, id_programa, descricao, nome_curso, qtd_ciclos } ] }
```

- Fonte: matrículas ativas (`lms_get_programas_do_aluno` via `aca_matricula` → `user_expandido`).
- Card: avatar (ícone curso) + `nome_curso` + `descricao` + `qtd_ciclos` + seta. Clique → `selecionarPrograma(prog)`.

---

## 3. Entrar no curso (contexto do programa)

`selecionarPrograma(prog)` **limpa todo o estado anterior** e carrega:

```ts
// 1. Estrutura (casca da árvore):
GET /api/minhas_atividades/estrutura?id_programa=X&id_entidade=E
→ 200 {
    area: { id, nome_area } | null,
    componentes: [ { id, nome } ],
    modulos:     [ { id, nome_modulo } ],
    ciclos:      [ { id, id_modulo, descricao, data_ini, data_fim } ],
    aulas:       [ { id, id_ciclo, nome, dt_hora_ini } ],
  }

// 2. Pré-carrega TODOS os escopos em background (contadores do dashboard corretos):
carregarTodosConteudos()  // chaves: 'programa' + 'componente:<id>' + 'modulo:<id>' + 'calendario:<id>'
                          // Promise.allSettled → não bloqueia a árvore

// 3. Reseta: visaoCentral='menu', filtros, conteudoAtivo=null, submissões/timer zerados
```

### Layout do contexto

```
┌────────────────────────────────────────────────────────────┬──────────────────┐
│ [← Meus cursos]  Programa 2026.2 · Curso X                 │  Painel (dash)   │
├───────────────────────────────────────┬────────────────────┤                  │
│  Visão central (grande)               │  (sem conteúdo)    │  Como funciona   │
│  [Menu | Resumo]  ← VisaoToggle       │                    │  Por tipo        │
│  árvore OU lista                      │                    │  Status          │
│                                       │                    │  Por escopo      │
└───────────────────────────────────────┴────────────────────┴──────────────────┘
```

---

## 4. Visão central: toggle **Menu | Resumo** (NÃO são abas) ⭐

O `VisaoToggle` é um par de botões no header da visão central (`visaoCentral: 'menu' | 'resumo'`, default **menu**):

```html
<button class="visao-btn" :class="{ 'visao-btn--on': ctx.visaoCentral.value === 'menu' }"
        @click="ctx.visaoCentral.value = 'menu'">  🌳 Menu   </button>
<button class="visao-btn" :class="{ 'visao-btn--on': ctx.visaoCentral.value === 'resumo' }"
        @click="ctx.visaoCentral.value = 'resumo'"> ▦ Resumo </button>
```

- **Menu** → `ConteudoArvore` (árvore de acordeons, §5).
- **Resumo** → `ConteudoLista` (lista agrupada, §6).
- O toggle aparece **no header da visão grande e na visão recolhida** (slot `#header-right` da árvore).
- **Não há abas de escopo** — o escopo é navegado por acordeons dentro da árvore.

---

## 5. A árvore (ConteudoArvore — visão Menu)

Estrutura de acordeons (mesma hierarquia do currículo admin, mas voltada ao aluno):

```
📚 Programa            (conteúdos soltos do programa)
📁 Componentes         (pasta) → cada componente → conteúdos
📁 Módulos/Ciclos      (pasta) → cada módulo → conteúdos + 📅 Aulas → cada aula → conteúdos
```

- **Pastas** (`pastaAberta.componentes|modulos`) — expandem a lista de filhos.
- **Acordeons** (`expandedSections`) — expandem e carregam os conteúdos do escopo (**lazy**, cache em `conteudosMap`).
- **Contadores** em cada trigger: nº de conteúdos do escopo (módulo soma conteúdos + aulas).
- **Todos os escopos aparecem** (mesmo vazios) — o aluno navega a estrutura completa.
- Cada linha (`ConteudoLinha`) com `:ativo` destacando o conteúdo aberto e `@select` → `selecionarConteudo(c)`.
- **Filtros do dashboard aplicados na árvore:** `getConteudos(key)` retorna a lista filtrada por `passaFiltros` (§7).

### Lazy loading

```ts
GET /api/minhas_atividades/conteudos?id_programa=X&id_entidade=E&id_matricula=M&escopo_tipo=<tipo>&escopo_id=<id>
→ 200 { conteudos: [ { id_conteudo, titulo, tipo, status_visibilidade, data_disponivel,
                       data_entrega_limite, duracao_minutos, tentativas_permitidas,
                       atividade_status, atividade_nota, atividade_tentativa, atividade_texto, atividade_arquivo,
                       atividade_comentario, atividade_corrigido_em, atividade_corrigido_por_nome,
                       avaliacao_status, avaliacao_nota, avaliacao_tentativa,
                       avaliacao_comentario, avaliacao_corrigido_em, avaliacao_corrigido_por_nome,
                       concluido } ] }
```

- Cache por chave; só busca na primeira abertura (`conteudosMap.has(key)`).

---

## 6. A lista Resumo (ConteudoLista — visão Resumo) ⭐

Agrupa os conteúdos por **seção na ordem da árvore** (Programa → Componentes → Módulos → Aulas), com:

1. **Dedupe** — o mesmo conteúdo aparece na **primeira seção onde foi encontrado** (`Set` de `id_conteudo`); se está em programa E componente, só no programa.
2. **Ordenação por prioridade de status** (`pesoStatus`):

```ts
rascunho (0) > pendente/disponível (1) > agendado (2) > prazo encerrado (3) > concluído (4)
// empate → título (localeCompare)
```

3. **Filtros do dashboard aplicados** (`passaFiltros` §7).
4. Seção com header (ícone + nome + contador) e linhas (`ConteudoLinha`); clique → `abrir` → `selecionarConteudo`.

```ts
const secoesLista = computed(() => {
  // por cada chave na ordem: programa → componentes → modulos → aulas
  //   filtra: !vistos.has(id) && passaFiltros(c)
  //   ordena: pesoStatus(a) - pesoStatus(b) || titulo.localeCompare
  //   adiciona a seção só se não vazia; marca vistos
});
```

---

## 7. Filtros do dashboard (aplicados à árvore E à lista) ⭐

```ts
function passaFiltros(c: ConteudoAluno): boolean {
  if (filtroTipo.value && c.tipo !== filtroTipo.value) return false;      // material|atividade|avaliacao
  if (filtroStatus.value) {
    switch (filtroStatus.value) {
      case 'concluidos': if (!c.concluido) return false; break;
      case 'pendentes':  if (c.concluido || c.status_visibilidade !== 'disponivel') return false; break;
      case 'prazos': {
        if (!c.data_entrega_limite) return false;
        const dias = (new Date(c.data_entrega_limite).getTime() - Date.now()) / 86400000;
        if (dias > 7 || dias < 0) return false;                            // entre 0 e 7 dias
        break;
      }
      case 'rascunhos': if (c.atividade_status !== 'rascunho') return false; break;
    }
  }
  return true;
}
```

- **Árvore:** `getConteudos(key)` filtra quando há filtro ativo (senão retorna a lista direto).
- **Lista:** `secoesLista` aplica `passaFiltros` + dedupe.
- **Toggle no dashboard:** `toggleFiltroTipo(tipo)` / `toggleFiltroStatus(status)` (ligam/desligam — clique de novo desliga).

---

## 8. Abrir conteúdo (visão recolhe)

```ts
function selecionarConteudo(item) {
  conteudoAtivo.value = item;
  visaoLista.value = false;
  if (item.tipo === 'atividade' && item.atividade_status === 'rascunho') {
    textoAtividade.value = item.atividade_texto || '';      // rascunho pré-carregado
    arquivoAtividade.value = item.atividade_arquivo || null;
  } else { textoAtividade.value = ''; arquivoAtividade.value = null; }
}
```

- **Desktop:** visão central recolhe para `w-80` (esquerda) + conteúdo no centro.
- **Mobile:** conteúdo em tela cheia; botões "Menu" (árvore) e "Filtros" (dashboard) abrem **drawers** da direita (overlay + painel slide; o drawer de filtros reusa `MinhasAtividadesSidebar`).
- **"← Todos os conteúdos"** (`voltarParaLista`) → limpa a seleção e volta à visão central grande.

---

## 9. Os três tipos de conteúdo

### Material
- Descrição + card do arquivo (R2) com "Abrir" → `/api/r2/sign` → nova aba.
- Ao abrir → `marcarMaterialVisto`: `POST /api/minhas_atividades/progresso` `{ id_conteudo, id_entidade, id_matricula }` (upsert em `lms_progresso_aluno`) → `concluido=true` + atualiza na árvore. **Falha silenciosa** (não bloqueia).

### Atividade
- Form: textarea + `UploadMini` + botões "Salvar rascunho"/"Entregar".
- `POST /api/minhas_atividades/atividade` `{ id_conteudo, id_entidade, id_matricula, texto_resposta, id_arquivo_envio, status: 'rascunho'|'entregue' }` → `{ success, tentativa }`.
- Entregar exige texto OU arquivo; **`409` = prazo expirado** (toast + marca `prazo_encerrado`); entregue bloqueia edição; entrega única.
- Entregue → card "Atividade entregue!"; corrigida → "Corrigida pelo professor" + bloco "Feedback do professor" (comentário + quem/quando).

### Avaliação
- `POST /api/minhas_atividades/avaliacao/iniciar` `{ id_conteudo, id_entidade, id_matricula }` → valida prazo/tentativas → `{ success, id, tentativa, duracao_minutos, data_entrega_limite }` → `iniciarTimer`.
- `GET /api/minhas_atividades/avaliacao?id_conteudo=X&id_entidade=E&id_matricula=M` → `{ avaliacao, perguntas: [{ id_pergunta, tipo, enunciado, pontuacao, obrigatoria, ordem, id_arquivo, alternativas: [{ id_resposta_possivel, texto, ordem, id_arquivo }] }], ambiente_seguro, autoavaliacao }` — **SEM gabarito** (sem `correta`); ordem aleatória já aplicada na RPC.
- **Timer:** prioriza `data_entrega_limite`; senão `duracao_minutos`; **auto-envio ~3s antes do fim**; barra no topo (alerta < 5min); sem prazo → sem barra.
- **Ambiente seguro:** fullscreen + `visibilitychange` com aviso (modo prova v1).
- `POST /api/minhas_atividades/avaliacao/finalizar` → grava respostas (alternativa/texto/arquivo por pergunta) → nota na hora se **autoavaliação** (soma pontuações corretas).
- Entregue: "Sua nota: X" + "Tentar novamente" se `tentativa < tentativas_permitidas`; feedback do professor quando corrigida manualmente.

---

## 10. Painel (dashboard) e badges

- **Dashboard** (`MinhasAtividadesSidebar`): Como funciona · Por tipo · Status · Por escopo — **receita completa em `padrao_dashboard_aluno.md`**.
- **Badges da linha** (`ConteudoLinha`): ✓ concluído · ⏰ agendado · ✕ prazo encerrado · R rascunho · E entregue · **nota** (tooltip: "Nota · Corrigido por X em DD/MM · comentário").

---

## 11. Estados e transições

| Estado | Renderização |
|---|---|
| Sem programa | Grid de cards de curso; clique entra |
| `loadingProgramas` | Spinner central |
| Contexto, sem conteúdo | Visão central grande (Menu\|Resumo) + Painel à direita |
| Conteúdo ativo (desktop) | Visão recolhe `w-80` + conteúdo + "← Todos os conteúdos" |
| Conteúdo ativo (mobile) | Tela cheia + drawers (Menu/Filtros) |
| Material aberto | Marca visto ao abrir |
| Atividade | Form habilitado/desabilitado por status; rascunho pré-carregado |
| Avaliação | Timer-bar; entregue-card com nota/re-tentar |
| Prazo encerrado | Bloqueado com aviso (não some) |

---

## 12. Checklist para recriar

- [ ] Cards de programa (`fetchProgramas` no `onMounted`).
- [ ] `selecionarPrograma`: resets + estrutura + **pré-carrega todos os escopos**.
- [ ] Toggle **Menu | Resumo** (`VisaoToggle`) no header (grande e recolhida) — default Menu; **sem abas de escopo**.
- [ ] `ConteudoArvore`: pastas + acordeons com lazy por chave; **todos os escopos visíveis**; filtros aplicados via `getConteudos`.
- [ ] `ConteudoLista`: seções na ordem da árvore, **dedupe** (primeira seção), **pesoStatus** (rascunho→concluído), filtros via `passaFiltros`.
- [ ] `passaFiltros` com o switch exato de status (concluídos/pendentes/prazos ≤7d/rascunhos).
- [ ] Clicar conteúdo → recolhe `w-80` + conteúdo; "← Todos os conteúdos" volta.
- [ ] Material (R2 sign + progresso), Atividade (rascunho pré-carregado, `409` prazo), Avaliação (timer + auto-envio + tentativas + autoavaliação + ambiente seguro).
- [ ] Drawers mobile reusando a árvore e a sidebar.
- [ ] Dashboard com contadores deduplicados (ver `padrao_dashboard_aluno.md`).
