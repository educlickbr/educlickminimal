# Padrão do Dashboard do Aluno — Recriação (`/minhas_atividades`)

> **Propósito:** documentar **exatamente** a **dashboard** (quadrante direito / `#sidebar`) da página do aluno — instruções + **filtros clicáveis por tipo, status e escopo** que se aplicam à árvore E à lista da visão central. Para o agente do outro lado recriar fiel.
>
> **Componente:** `MinhasAtividadesSidebar.vue` — mesmo componente usado no `#sidebar` e no **drawer mobile** da página (`MinhasAtividadesPage.vue`).

---

## 1. O que é

```
┌───────────────────────────────┐
│ (sem curso selecionado)       │
│ 💡 Minhas Atividades          │  ← "Entre em um curso para ver o resumo..."
│                               │
│ (curso selecionado)           │
│ 💡 Como funciona              │  ← instruções
│ • Material — abre e conclui   │
│ • Atividade — rascunho/envio  │
│ • Avaliação — timer           │
│ • Fora do prazo = bloqueado   │
│                               │
│ 🗂 Por tipo                   │  ← FILTRA (material/atividade/avaliação)
│ ● Materiais             (4)   │
│ ● Atividades            (3)   │
│ ● Avaliações            (2)   │
│                               │
│ ⚡ Status                     │  ← FILTRA (grid 2×2)
│ ✓ Concluídos            (5)   │  ⏰ Pendentes (3)
│ ⏱ Prazo ≤7d            (1)   │  ✎ Rascunhos (1)
│ [+ obs: X agendado(s) ...]    │
│                               │
│ 📁 Por escopo                 │  ← NAVEGA (abre pasta + seção)
│ Componente A            (2)   │
│ Módulo 1                (3)   │
│ Aula 12/08              (1)   │
└───────────────────────────────┘
```

---

## 2. Estados

| Estado | Condição | Renderização |
|---|---|---|
| Sem curso | `!ctx.programaSelecionado.value` | Card único "💡 Minhas Atividades" + instrução |
| Com curso | `programaSelecionado` | 4 blocos: Como funciona · Por tipo · Status · Por escopo |

---

## 3. Cards e o que cada um faz

### 3.1 Como funciona (informativo)

```html
<li><b>Material</b> — abra o arquivo/link e ele marca como concluído.</li>
<li><b>Atividade</b> — responda e clique em Entregar; pode salvar rascunho antes.</li>
<li><b>Avaliação</b> — inicie, responda e finalize; o timer mostra o prazo.</li>
<li>Fora do prazo o conteúdo fica bloqueado com aviso.</li>
```

Sem clique — orientação.

### 3.2 Por tipo (filtro) ⭐

```html
<button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroTipo.value === 'material' }"
        @click="ctx.toggleFiltroTipo('material')">
  <span class="dash-dot dash-dot--material" /> Materiais
  <span class="dash-count">{{ ctx.resumo.value.por_tipo.material }}</span>
</button>
<!-- idem 'atividade' (dot verde) e 'avaliacao' (dot âmbar) -->
```

- **`toggleFiltroTipo(tipo)`:** liga/desliga (`filtroTipo.value === tipo ? null : tipo`).
- **Efeito:** filtra a **árvore** e a **lista** (visão central) — só itens do tipo.

### 3.3 Status (filtro) ⭐

Grid 2×2 (`dash-btns--grid`): Concluídos (✓) · Pendentes (⏰) · Prazo ≤7d (⏱) · Rascunhos (✎).

```html
<button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'concluidos' }"
        @click="ctx.toggleFiltroStatus('concluidos')"> ... </button>
```

- **`toggleFiltroStatus(status)`:** liga/desliga.
- **Obs:** se houver `agendados` ou `encerrados`, mostra linha extra (`dash-obs`) com os contadores (não são filtros — só informação).
- **Efeito:** filtra árvore e lista pelo status calculado.

### 3.4 Por escopo (navegação) ⭐

```html
<button v-for="e in ctx.resumo.value.por_escopo" :key="e.chave"
        class="dash-escopo" @click="ctx.irParaEscopo(e.chave)">
  <span class="dash-escopo-nome">{{ e.nome }}</span>
  <span class="dash-count">{{ e.total }}</span>
</button>
```

- **`irParaEscopo(chave)`:** `componente:` → abre pasta Componentes; `modulo:`/`calendario:` → abre pasta Módulos/Ciclos; e expande a seção do acordeon correspondente (navega na árvore).

---

## 4. Dados (composable)

```ts
// resumo (computed) — DEDUPE por conteúdo (pode estar em mais de um escopo)
{
  por_tipo:   { material, atividade, avaliacao },
  por_status: {
    concluidos,                                   // c.concluido
    pendentes,                                    // !concluido && disponivel
    agendados,                                    // status_visibilidade === 'agendado'
    encerrados,                                   // === 'prazo_encerrado'
    prazos,                                       // data_entrega_limite em até 7 dias
    rascunhos,                                    // atividade_status === 'rascunho'
  },
  por_escopo: [ { chave: 'componente:<id>'|'modulo:<id>'|'calendario:<id>', nome, total } ],
}
```

- **Dedupe:** os contadores somam cada conteúdo **uma única vez** (`Map<id_conteudo, ConteudoAluno>`), mesmo que ele apareça em vários escopos.
- **`prazos`:** `dias = (data_entrega_limite - now) / 86400000` entre 0 e 7.
- Os contadores dependem do **pré-carregamento de todos os escopos** (`carregarTodosConteudos` ao entrar no curso) — sem isso os números ficariam zerados.
- Funções: `toggleFiltroTipo`, `toggleFiltroStatus`, `irParaEscopo`.

---

## 5. Estilos (tokens)

```css
.dash-card · .dash-title · .dash-text · .dash-list   /* mesmo padrão das outras dashboards */
.dash-btns (coluna) · .dash-btns--grid (2×2)          /* status */
.dash-btn · .dash-btn--on                             /* ativo violeta */
.dash-dot--material (azul) / --atividade (verde) / --avaliacao (âmbar)   /* tipo */
.dash-count (pill; --on vira primária)
.dash-obs (agendados/encerrados) · .dash-escopo (linha de escopo com nome + contador)
```

---

## 6. Mobile

- O mesmo `MinhasAtividadesSidebar` é renderizado **dentro do drawer de filtros** (overlay + painel slide da direita) quando o botão "Filtros" é clicado no mobile.
- `drawer-overlay` (rgba(0,0,0,0.7)) + `drawer-panel` (min(340px, 85vw), slide da direita).

---

## 7. Checklist para recriar

- [ ] Sem curso → card único; com curso → 4 blocos.
- [ ] Por tipo com dots coloridos e `toggleFiltroTipo` (liga/desliga; `--on` reflete).
- [ ] Status em grid 2×2 com `toggleFiltroStatus` + obs de agendados/encerrados.
- [ ] Por escopo com `irParaEscopo` (abre pasta + expande seção).
- [ ] Filtros aplicados à **árvore e à lista**.
- [ ] Contadores com dedupe por conteúdo + pré-carregamento de todos os escopos.
- [ ] Mesmo componente no `#sidebar` e no drawer mobile.
