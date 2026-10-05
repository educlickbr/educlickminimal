# Padrão do Dashboard do Currículo (Admin) — Recriação

> **Propósito:** documentar **exatamente** a **dashboard** (quadrante direito / `#sidebar` do layout) da aba **Currículo** — cards com instruções, escopos do programa e **filtros por estado do currículo** que controlam o navegador de conteúdos. Para o agente do outro lado recriar fiel.
>
> **Componente:** `ProgAtividadesCurriculoSidebar.vue` · renderizado em `pages/programacao_atividades/index.vue` quando `activeTab === 'curriculo'`.

---

## 1. O que é

O quadrante direito reservado no layout (`<template #sidebar>` do `base.vue`) exibe, na tab Currículo, um painel com 3 blocos (após escolher o programa) — o **terceiro bloco filtra o navegador de conteúdos**:

```
┌───────────────────────────────┐
│ 🧭 Como usar                  │  ← instruções (radio/toggle/⚙/herdado)
│ • Radio — associa ao escopo   │
│ • Toggle — Visível/Oculto     │
│ • ⚙ — prazo, duração, tent.   │
│ • Sem linha = herdado = vis.  │
│                               │
│ 📐 Escopos do programa        │  ← abre pastas na árvore
│ 📁 Componentes          (3)   │
│ ▦ Módulos/Ciclos        (2)   │
│ 📅 Aulas                (6)   │
│                               │
│ 📊 Estado do currículo        │  ← FILTRA o navegador
│ ⛓ Associados            (5)   │
│ 🔓 Não associados       (12)  │
│ 🙈 Ocultos              (1)   │
│ [x Limpar filtro]             │  ← só aparece com filtro ativo
└───────────────────────────────┘
```

---

## 2. Estados

| Estado | Condição | Renderização |
|---|---|---|
| Sem programa | `!ctx.programaSelecionado.value` | Card único "🧭 Currículo" + texto "Selecione um programa para ver o resumo..." |
| Com programa | `programaSelecionado` | 3 cards: Como usar · Escopos do programa · Estado do currículo |

> O botão de "Limpar filtro" (`dash-limpar`) aparece apenas quando `filtroEstado` está ativo (obs sob o card de estado).

---

## 3. Cards e o que cada um faz

### 3.1 Como usar (informativo)

```html
<li><b>Radio</b> — associa o conteúdo ao escopo alvo (cria a linha no currículo).</li>
<li><b>Toggle</b> — Visível/Oculto: o aluno vê ou não.</li>
<li><b>⚙️</b> — disponibilidade, prazo, duração e tentativas.</li>
<li>Sem linha = herdado = visível para o aluno.</li>
```

Sem clique — apenas orientação de uso.

### 3.2 Escopos do programa (navegação)

- Fonte: `ctx.resumoCurriculo.value.escopos` → `{ componentes, modulos, ciclos, aulas }`.
- **Componentes** → `@click="ctx.irParaPasta('componentes')"` — abre a pasta "Componentes" na árvore (e deixa visível).
- **Módulos/Ciclos** → `ctx.irParaPasta('modulos')` — abre a pasta "Módulos/Ciclos".
- **Aulas** → `ctx.irParaPasta('modulos')` — também abre a pasta de módulos (as aulas vivem dentro dela); contador usa `escopos.aulas`.
- Cada botão só aparece se o contador for `> 0` (`v-if`).

### 3.3 Estado do currículo (filtro do navegador) ⭐

- Fonte: `ctx.resumoCurriculo.value.repositorio` → `{ total, associados, ocultos, livres }`.
- Botões com toggle de filtro:

```html
<button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroEstado.value === 'associados' }"
        @click="ctx.toggleFiltroEstado('associados')">
  ⛓ Associados  <span class="dash-count">{{ repositorio.associados }}</span>
</button>
<!-- idem 'livres' (Não associados) e 'ocultos' (Ocultos) -->
```

- **`toggleFiltroEstado(estado)`:** liga se desligado, desliga se ligado (`filtroEstado.value === estado ? null : estado`).
- **Efeito no navegador:** `conteudosExibidos` (computed) filtra por:
  - `associados` → só `!!c.op_id`
  - `livres` → só `!c.op_id`
  - `ocultos` → só `c.op_id && !c.ativo`
- **"Limpar filtro"** → `toggleFiltroEstado(filtroEstado atual)` (desliga).

---

## 4. Dados (composable)

```ts
// resumoCurriculo (computed)
{
  escopos: { componentes, modulos, ciclos, aulas },   // contagens da árvore (estrutura)
  repositorio: {
    total:       conteudosDisponiveis.length,
    associados:  filtro(c => !!c.op_id).length,
    ocultos:     filtro(c => !!c.op_id && !c.ativo).length,
    livres:      total - associados,
  },
}
```

Funções usadas: `irParaPasta(pasta)` (abre `pastaAberta`), `toggleFiltroEstado(estado)`.

---

## 5. Estilos (tokens)

```css
.dash-card   /* superfície + borda, radius 14px, padding 12x14 */
.dash-title  /* 9px, 900, uppercase, secundária */
.dash-text   /* 11px, 600, secundária 0.7 */
.dash-list   /* instruções; <b> em cor de texto */
.dash-btns   /* coluna, gap 5 */
.dash-btn    /* linha com ícone + label + contador à direita (margin-left:auto) */
.dash-btn--on/* ativo: borda violeta + fundo rgba(139,92,246,.08) + cor primária */
.dash-count  /* pill à direita; --on vira primária */
.dash-obs + .dash-limpar  /* "Limpar filtro" em vermelho (#ef4444) */
```

---

## 6. Checklist para recriar

- [ ] Renderizado no `#sidebar` apenas na tab Currículo.
- [ ] Sem programa → card de instrução único.
- [ ] Com programa → 3 cards (Como usar / Escopos / Estado).
- [ ] Escopos com contadores e `irParaPasta` (abrem pastas da árvore); `v-if` quando > 0.
- [ ] Estado com `toggleFiltroEstado` ligando/desligando; `dash-btn--on` reflete o ativo.
- [ ] Filtro aplicado ao `conteudosExibidos` do navegador (associados/livres/ocultos).
- [ ] "Limpar filtro" visível só com filtro ativo.
