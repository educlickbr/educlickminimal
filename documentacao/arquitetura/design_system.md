# Design System — EduClick UI Premium

> **Referência canônica do contrato visual do projeto.**  
> Aplica-se a **todos** os componentes e páginas — admin e públicas.  
> Veja também: `documentacao/arquitetura/front_end.md` (seção 7 — legado, mantido para tokens de cores e UX de campos) e `.agents/skills/padrao-design-ui/SKILL.md` (skill de implementação rápida).

---

## Sumário

- [1. Princípios](#1-princípios)
- [2. Paleta e Tokens](#2-paleta-e-tokens)
- [3. Tipografia e Labels](#3-tipografia-e-labels)
- [4. Cards de Lista (padrão premium)](#4-cards-de-lista-padrão-premium)
- [5. Hierarquia Visual — Accent Bars](#5-hierarquia-visual--accent-bars)
- [6. Badges e Pills de Status](#6-badges-e-pills-de-status)
- [7. Filtros e Filter Bar](#7-filtros-e-filter-bar)
- [8. Tabs de Navegação](#8-tabs-de-navegação)
- [9. Ações em Hover](#9-ações-em-hover)
- [10. Modais](#10-modais)
- [11. Empty States](#11-empty-states)
- [12. Botões](#12-botões)
- [13. Paginação](#13-paginação)
- [14. Comportamentos de Animação](#14-comportamentos-de-animação)
- [15. Páginas de Referência](#15-páginas-de-referência)

---

## 1. Princípios

1. **Cor violeta como único acento** — `#8b5cf6` / `#7c3aed` são os únicos cromáticos de destaque. Outros tons (verde, âmbar, azul) existem apenas para representar estado (status/papel), nunca como identidade decorativa.
2. **Nunca preto puro** — backgrounds sempre vêm da paleta: `#0a0a0c` (página), `#0f0f17` (superfície), `#13131a` (modal).
3. **Hierarquia pela opacidade** — quanto mais profundo na pilha visual, mais escuro. Nunca mais claro.
4. **Ações em hover, não no repouso** — botões de edição, remoção e ação ficam com `opacity: 0` e surgem no hover do card pai. A interface fica limpa por padrão.
5. **Accent bars comunicam pertencimento** — a cor e posição da accent bar (lateral, topo) indicam o nível hierárquico do elemento.
6. **`backdrop-filter: blur()` apenas em modais de seleção** — overlay padrão é sólido `rgba(0,0,0,0.82–0.85)`. Blur é admitido em modais de busca/seleção (ex: `ModalAtribuirDocente`).

---

## 2. Paleta e Tokens

### Cores de fundo

| Token | Valor | Uso |
|---|---|---|
| Background (página) | `#0a0a0c` | Fundo de toda página |
| Surface (card/container) | `rgba(255,255,255,0.025)` | Cards de lista admin |
| Surface alt | `#0f0f17` | Headers e containers legados |
| Modal panel | `#13131a` | Fundo de modais |

### Paleta de acento

| Token | Valor | Uso |
|---|---|---|
| Primary | `#8b5cf6` | Tabs ativas, foco, ícones ativos |
| Primary dark | `#7c3aed` | Hover de botões primários, gradiente |
| Primary light | `#a78bfa` | Texto violet secundário, carets |
| Primary softer | `#c4b5fd` | Texto em tabs ativas |

### Paleta de estado

| Estado | Cor | Uso |
|---|---|---|
| Sucesso / Titular | `#34d399` (emerald) | Status ativo, papel titular, confirmação |
| Atenção / Substituto | `#fbbf24` (amber) | Avisos, papel substituto, pendente |
| Informação / Auxiliar | `#38bdf8` (sky) | Papel auxiliar, informação neutra |
| Erro / Cancelado | `#f87171` (red) | Erro, cancelado, remoção |
| Inativo | `rgba(255,255,255,0.25)` | Status inativo, desabilitado |

### Tokens de campo (global, já no `style.css`)

```css
--field-bg:            rgba(255,255,255,0.04);
--field-bg-hover:      rgba(139,92,246,0.08);
--field-border:        rgba(255,255,255,0.07);
--field-border-focus:  rgba(139,92,246,0.45);
--field-text:          rgba(232,230,240,0.9);
--field-placeholder:   rgba(255,255,255,0.22);
--field-shadow-focus:  0 0 0 3px rgba(139,92,246,0.10);
```

---

## 3. Tipografia e Labels

### Escala em uso nos cards admin

| Tamanho | Uso |
|---|---|
| `8px / font-black / uppercase / tracking 0.10em` | Micro badges, status pills, dots |
| `9px / font-black / uppercase / tracking 0.12em` | Labels de campo, contadores, paginação |
| `10px / font-700–800 / uppercase` | Metadata, emails, meta badges |
| `11–12px / font-800–900` | Botões, corpo menor, seletor de papel |
| `13px / font-900` | Nome principal no card (`.person-name`, `.comp-nome`) |

### Regra de label de campo

```css
font-size: 9px;
font-weight: 900;
text-transform: uppercase;
letter-spacing: 0.14em;
color: rgba(255,255,255,0.28–0.35);
```

---

## 4. Cards de Lista (padrão premium)

> **Referência canônica:** `MatriculasList.vue`, `ProcessosTabInscritos.vue`, `ProdutosTabLista.vue`, `AtribuicaoPage.vue`

### Estrutura base

```html
<div class="person-card">
  <div class="person-accent-bar" />       <!-- lateral, opacity 0→1 no hover -->
  <div class="person-card-inner">
    <!-- header: avatar + identidade + ações hover -->
    <!-- meta: badges de contexto -->
    <!-- divisor: 1px rgba(255,255,255,0.04) -->
    <!-- footer: status pill + data -->
  </div>
</div>
```

### CSS base obrigatório

```css
.person-card {
  position: relative;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.person-card:hover {
  border-color: rgba(139,92,246,0.28);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(139,92,246,0.10);
}

/* Accent bar lateral — comunica hierarquia */
.person-accent-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, #7c3aed, #a78bfa);
  opacity: 0; transition: opacity 0.2s ease;
}
.person-card:hover .person-accent-bar { opacity: 1; }

.person-card-inner { padding: 16px 16px 14px 20px; display: flex; flex-direction: column; gap: 10px; }
```

### Avatar

```css
.person-avatar {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(139,92,246,0.10);
  border: 1px solid rgba(139,92,246,0.20);
  color: #a78bfa; font-size: 15px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
```

### Layout de grid

- **Cards de matrícula e processo:** `flex flex-col gap-3` (coluna única — maior largura)
- **Cards de programa/componente/área/pergunta:** `grid grid-cols-1 md:grid-cols-2 gap-3` (2 colunas)
- **Nunca mais de 2 colunas** em listagens de entidades admin

---

## 5. Hierarquia Visual — Accent Bars

O sistema usa **cor + posição** das accent bars para comunicar nível hierárquico:

| Nível | Elemento | Posição | Cor do gradiente |
|---|---|---|---|
| **L1 — Programa** | Card de programa em `/produtos` | Lateral esquerda | `#7c3aed → #a78bfa` (violet) |
| **L2 — Produto** | Card de produto dentro do programa | Lateral esquerda | `#6366f1 → #818cf8` (indigo) |
| **L3 — Oferta** | Card de oferta dentro do produto | Lateral esquerda | `#2563eb → #60a5fa` (blue) |
| **Ciclo (acadêmico)** | Card de ciclo em `/atribuicao` | Topo (horizontal) | `#7c3aed → #a78bfa → transparent` |
| **Componente (acadêmico)** | Row de componente dentro do ciclo | Lateral esquerda | `#6366f1 → #818cf8` (indigo) |
| **Card selecionado (modal)** | Card de docente/candidato selecionado | Lateral esquerda | `#7c3aed → #a78bfa` (violet) |

> **Regra:** A accent bar lateral indica "eu pertenço a algo acima". A accent bar de topo indica "eu sou um agrupador".

### Exemplo de implementação em 3 níveis (`ProdutosTabLista.vue`)

```css
/* L1 — Programa */
.programa-bar { background: linear-gradient(180deg, #7c3aed, #a78bfa); }

/* L2 — Produto (aparece ao expandir programa) */
.produto-bar  { background: linear-gradient(180deg, #6366f1, #818cf8); }

/* L3 — Oferta (aparece ao expandir produto) */
.oferta-bar   { background: linear-gradient(180deg, #2563eb, #60a5fa); }
```

---

## 6. Badges e Pills de Status

### Estrutura da pill de status

```html
<div class="person-status status--ativa">
  <div class="status-dot" style="background: #34d399" />
  Ativa
</div>
```

```css
.person-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 8px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.10em; padding: 4px 9px; border-radius: 20px;
  border: 1px solid transparent;
}
.status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

/* Variantes */
.status--ativa     { background: rgba(52,211,153,0.08);  border-color: rgba(52,211,153,0.18);  color: #34d399; }
.status--inativa   { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); }
.status--cancelada { background: rgba(239,68,68,0.08);   border-color: rgba(239,68,68,0.18);   color: #f87171; }
.status--pendente  { background: rgba(251,191,36,0.08);  border-color: rgba(251,191,36,0.18);  color: #fbbf24; }
```

### Meta-badges (área, turma, semestre)

```css
.meta-badge {
  font-size: 8px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.08em; padding: 2px 7px; border-radius: 10px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.35);
}
.meta-badge--amber { background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.18); color: #fbbf24; }
.meta-badge--violet { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.18); color: #a78bfa; }
```

---

## 7. Filtros e Filter Bar

```css
.filter-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  margin-bottom: 14px; padding: 10px 14px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; flex-shrink: 0;
}

.filter-select, .filter-input {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; padding: 8px 12px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8);
  outline: none; transition: border-color 0.15s; cursor: pointer;
}
.filter-select { /* sempre appearance-none + caret SVG violet */ }
.filter-select:focus, .filter-input:focus { border-color: rgba(139,92,246,0.35); }

.filter-count {
  font-size: 9px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.12em; color: rgba(255,255,255,0.25);
  white-space: nowrap; margin-left: auto;
}
```

**Caret customizado obrigatório em selects:**
```css
background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
background-position: right 6px center;
background-repeat: no-repeat; background-size: 1em;
appearance: none; padding-right: 28px;
```

---

## 8. Tabs de Navegação

```css
.tabs-nav {
  display: flex; gap: 4px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 4px;
}
.tab-btn {
  padding: 7px 16px; border-radius: 8px;
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.08em; color: rgba(255,255,255,0.28);
  border: none; background: none; cursor: pointer; transition: all 0.15s;
}
.tab-btn:hover { color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.04); }
.tab-btn--active { background: rgba(139,92,246,0.14); color: #c4b5fd; }
```

---

## 9. Ações em Hover

> **Regra:** Botões de ação (editar, excluir, detalhes, atribuir) ficam **invisíveis em repouso** e aparecem no hover do card/row pai.

```css
/* Grupo de ações */
.person-actions { display: flex; gap: 5px; opacity: 0; transition: opacity 0.15s ease; }
.person-card:hover .person-actions { opacity: 1; }

/* Botão de ação individual */
.act-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s ease;
}
.act-btn--neutral { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.35); }
.act-btn--neutral:hover { background: rgba(139,92,246,0.16); color: #c4b5fd; }
.act-btn--warn { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.25); }
.act-btn--warn:hover:not(:disabled) { background: rgba(239,68,68,0.14); color: #f87171; }
```

---

## 10. Modais

> Ver também: `.agents/skills/padrao-design-ui/SKILL.md` (CSS completo de referência)

### Estrutura padrão

```
modal-overlay (fixed inset-0 z-50, background rgba(0,0,0,0.82–0.85))
  └── modal-panel (#13131a, border-radius 16–18px, border rgba(139,92,246,0.18–0.20))
        ├── modal-accent-bar (2–3px gradient violet topo)
        ├── modal-header (ícone 40×40 + título + close btn)
        ├── modal-body (overflow-y auto, padding 20–24px)
        └── modal-footer (border-t, justify-end, gap-3)
```

### Box-shadow do painel

```css
box-shadow: 0 24px 80px rgba(0,0,0,0.70), 0 0 0 1px rgba(139,92,246,0.08);
```

### Botões de modal

```css
/* Cancelar */
padding: 9–10px 18–22px; border-radius: 9–10px;
border: 1px solid rgba(255,255,255,0.08); background: transparent;
color: rgba(255,255,255,0.35–0.45); font-size: 10–11px; font-weight: 800;

/* Salvar/Confirmar */
padding: 9–10px 22–28px; border-radius: 9–10px; border: none;
background: linear-gradient(135deg, #7c3aed, #8b5cf6);
color: #fff; font-size: 10–11px; font-weight: 800;
box-shadow: 0 4px 14px rgba(139,92,246,0.35);
hover: translateY(-1px) + shadow expandida
disabled: background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.20);
```

---

## 11. Empty States

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 56px 24px;
  background: rgba(255,255,255,0.015); border-radius: 14px;
  border: 1px dashed rgba(255,255,255,0.07); text-align: center;
}
/* Ícone container */
.empty-icon-wrap {
  width: 56–64px; height: 56–64px; border-radius: 16px;
  background: rgba(139,92,246,0.07); border: 1px solid rgba(139,92,246,0.14);
  color: rgba(139,92,246,0.40);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
/* Título */
font-size: 14px; font-weight: 800; color: rgba(255,255,255,0.30);
/* Subtítulo */
font-size: 10px; font-weight: 700; text-transform: uppercase;
letter-spacing: 0.10em; color: rgba(255,255,255,0.15);
```

---

## 12. Botões

### Botão primário (add / nova ação)

```css
display: flex; align-items: center; gap: 7px;
padding: 9px 18px; border-radius: 12px;
background: linear-gradient(135deg, #7c3aed, #8b5cf6);
border: 1px solid rgba(139,92,246,0.40); color: #fff;
font-size: 11px; font-weight: 800; text-transform: uppercase;
letter-spacing: 0.08em; cursor: pointer;
box-shadow: 0 4px 14px rgba(139,92,246,0.30);
transition: all 0.15s ease;

hover:
  background: linear-gradient(135deg, #6d28d9, #7c3aed);
  box-shadow: 0 6px 20px rgba(139,92,246,0.45);
  transform: translateY(-1px);
```

### Botão ghost / ação secundária no card

```css
background: rgba(139,92,246,0.08);
border: 1px solid rgba(139,92,246,0.18); color: #a78bfa;
font-size: 9px; font-weight: 900; text-transform: uppercase;
padding: 7px 14px; border-radius: 9px;

hover: background: rgba(139,92,246,0.18); border-color: rgba(139,92,246,0.35);
```

---

## 13. Paginação

```css
.pag-btn {
  padding: 6px 12px; border-radius: 8px; font-size: 9px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.08em;
  border: 1px solid rgba(255,255,255,0.08); background: transparent;
  color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s;
}
.pag-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #fff; }
.pag-btn:disabled { opacity: 0.25; cursor: not-allowed; }

.pag-num { width: 30px; height: 30px; border-radius: 8px; font-size: 10px; font-weight: 800; }
.pag-num--active {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: #fff;
  box-shadow: 0 4px 10px rgba(139,92,246,0.30);
}
```

---

## 14. Comportamentos de Animação

| Situação | Comportamento |
|---|---|
| Card hover | `translateY(-1px a -2px)` + border violet + shadow |
| Accent bar | `opacity: 0 → 1` (transition 0.2s ease) |
| Ações do card | `opacity: 0 → 1` (transition 0.15s ease) |
| Botão ação hover | `translateY(-1px)` + shadow expandida |
| Modal entrada | `slideUp`: `translateY(16–20px) scale(0.97–0.98) → 0 scale(1)` — 0.2s |
| Modal overlay | `fadeIn`: `opacity 0 → 1` — 0.15s |
| Spinner | `border-top #8b5cf6`, `animate-spin` |
| Skeleton | `animate-pulse`, `bg-white/5` |
| Toast | `translateY(1rem) → 0` na entrada, `translateY(0.5rem) → saída` |

---

## 15. Páginas de Referência

Estas páginas foram totalmente migradas para o padrão premium e servem como **implementação de referência**:

| Página | Componente | O que ilustra |
|---|---|---|
| `/academico_oferta?tab=programas` | `OfertaTabProgramas.vue` | Grid 2 colunas, accent bar lateral, ações em hover |
| `/academico_oferta?tab=areas` | `OfertaTabAreas.vue` | Grid 2 colunas, badges de contexto |
| `/academico_oferta?tab=componentes` | `OfertaTabComponentes.vue` | Grid 2 colunas, meta-badge de carga horária |
| `/academico_oferta?tab=cursos` | `OfertaTabCursos.vue` | Grid 2 colunas, modal com accent bar |
| `/produtos` | `ProdutosTabLista.vue` | **3 níveis aninhados** — accent bars violet/indigo/blue |
| `/meus-processos` | `MeusProcessosPage.vue` | Cards de aluno, status pills |
| `/matriculas` | `MatriculasList.vue` | Coluna única, avatar, status pill com dot |
| `/processos` | `ProcessosTabInscritos.vue` | Coluna única, 3 status pills no footer, meta à direita |
| `/atribuicao` | `AtribuicaoPage.vue` | Accent bar de topo + lateral, badge de papel com dot |
| `/atribuicao` (modal) | `ModalAtribuirDocente.vue` | Card selecionado com accent bar + checkbox gradient |
| `/formularios?tab=perguntas` | `FormulariosTabPerguntas.vue` | Grid 2 colunas, badges de tipo |
