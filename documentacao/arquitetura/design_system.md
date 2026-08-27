# Design System — EduClick UI Premium

> **Referência canônica do contrato visual do projeto.**  
> Aplica-se a **todos** os componentes e páginas — admin e públicas.  
> Veja também: `documentacao/arquitetura/front_end.md` (seção 7 — legado, mantido para tokens de cores e UX de campos), `.agents/skills/padrao-design-ui/SKILL.md` (skill de implementação rápida) e `documentacao/planos/plano-tema-claro-escuro.md` (checklist e status de conversão dual-theme).

> **⚠️ Dual-theme:** O projeto suporta tema escuro (padrão histórico) e tema claro (`data-theme="light"`). **Nunca usar cores hardcoded** (`rgba(255,255,255,*)`, `text-white`, `bg-[#hex]`) — usar sempre os tokens de `var(--color-*)` e `var(--field-*)`. Ver seção 16.

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
- [16. Tema Claro — Regras e Padrões](#16-tema-claro--regras-e-padrões)

---

## 1. Princípios

1. **Cor violeta como único acento** — `#8b5cf6` / `#7c3aed` são os únicos cromáticos de destaque. Outros tons (verde, âmbar, azul) existem apenas para representar estado (status/papel), nunca como identidade decorativa.
2. **Nunca preto puro** — backgrounds sempre vêm da paleta: `#0a0a0c` (página), `#0f0f17` (superfície), `#13131a` (modal).
3. **Hierarquia pela opacidade** — quanto mais profundo na pilha visual, mais escuro. Nunca mais claro.
4. **Ações em hover, não no repouso** — botões de edição, remoção e ação ficam com `opacity: 0` e surgem no hover do card pai. A interface fica limpa por padrão.
5. **Accent bars comunicam pertencimento** — a cor e posição da accent bar (lateral, topo) indicam o nível hierárquico do elemento.
6. **`backdrop-filter: blur()` apenas em modais de seleção** — overlay padrão é sólido `rgba(0,0,0,0.82–0.85)`. Blur é admitido em modais de busca/seleção (ex: `ModalAtribuirDocente`).
7. **Botões sem emoji nem ícone decorativo** — o rótulo é texto puro ("Salvar", "Editar", "Novo conteúdo"). Nunca "💾 Salvar" / "➕ Novo". Emojis podem aparecer apenas como badge de estado (ex.: 🔒 somente leitura), nunca como ícone de ação.

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

### Meta-badges (área, turma, semestre, contagem)

> **⚠️ Dual-theme:** Usar `var(--color-*)` — nunca `rgba(255,255,255,*)` ou `#c4b5fd` fixo.

```css
/* Badge neutro (contagem de itens, semestre, turma) */
.meta-badge {
  font-size: 8px; font-weight: 900; text-transform: uppercase;
  letter-spacing: 0.08em; padding: 3px 8px; border-radius: 6px;
  background: var(--color-secondary-surface);
  border: 1px solid var(--color-divider);
  color: var(--color-secondary);
  display: inline-flex; align-items: center; gap: 4px;
}
/* Badge de contexto violet (área, categoria) */
.meta-badge--violet {
  background: rgba(139,92,246,0.08);
  border-color: rgba(139,92,246,0.2);
  color: var(--color-primary);   /* ← nunca #c4b5fd fixo */
}
/* Badge âmbar (atenção, pendente) */
.meta-badge--amber {
  background: rgba(245,158,11,0.08);
  border-color: rgba(245,158,11,0.2);
  color: #fbbf24;  /* semântico — mantém nos dois temas */
}
```

**Regra de cor para badges:**
| Tipo | `color` | `background` | `border` |
|---|---|---|---|
| Neutro (count/semestre) | `var(--color-secondary)` | `var(--color-secondary-surface)` | `var(--color-divider)` |
| Contexto/categoria | `var(--color-primary)` | `rgba(139,92,246,0.08)` | `rgba(139,92,246,0.2)` |
| Gratuito/sucesso | `#34d399` | `rgba(16,185,129,0.08)` | `rgba(16,185,129,0.2)` |
| Pago/atenção | `#fbbf24` | `rgba(245,158,11,0.08)` | `rgba(245,158,11,0.2)` |
| Seleção/especial | `var(--color-primary)` | `rgba(139,92,246,0.08)` | `rgba(139,92,246,0.2)` |
| Matrícula direta/info | `#38bdf8` | `rgba(56,189,248,0.08)` | `rgba(56,189,248,0.2)` |

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

> **Padrão atual (theme-aware):** use as classes globais `.ds-tabs-nav`, `.ds-tab-btn`, `.ds-tab-btn--active` (definidas em `style.css`). Elas seguem o tema claro/escuro automaticamente. O CSS antigo abaixo com cores escuro fixas **quebra no claro** e deve ser evitado em componentes novos.

```css
.ds-tabs-nav {
  display: flex; gap: 4px;
  background: var(--color-secondary-surface);
  border: 1px solid var(--field-border);
  border-radius: 12px; padding: 4px;
}
.ds-tab-btn {
  padding: 7px 16px; border-radius: 8px;
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--color-secondary);
  border: none; background: none; cursor: pointer; transition: all 0.15s;
}
.ds-tab-btn:hover { color: var(--color-text); background: var(--color-secondary-surface-hover); }
.ds-tab-btn--active { background: var(--color-primary); color: #fff; }
```

> **⚠️ Aba ativa é sólida (decisão 2026-08-26).** Antes usava `rgba(139,92,246,0.14)` (translúcido violeta fixo). Agora é `background: var(--color-primary); color: #fff` — bloco sólido que acompanha o branding. Fundo translúcido da marca sobre fundo escuro escurece a cor (laranja vira marrom `#3A2D27`), por isso a aba ativa ficou sólida.

<!-- Antigo (não usar em novos): .tabs-nav/.tab-btn com rgba(255,255,255,*) -->

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

### Regra: sem emoji/ícone decorativo no rótulo

Botões comunicam a ação **apenas pelo texto**. SVG funcional é admitido quando a ação é puramente icônica (ex.: fechar modal, abrir arquivo) — e nunca emoji.

```
✅ "Salvar" · "Editar" · "Salvar correção" · "Abrir arquivo enviado"
❌ "💾 Salvar" · "✏️ Editar" · "📎 Abrir arquivo" · "➕ Novo conteúdo"
```

Emojis ficam restritos a **badges de estado** (🔒 somente leitura, ✓ corrigido), não a ações.

### Botão primário (add / nova ação)

> **⚠️ Sólido, não gradiente.** O gradiente violeta fixo foi removido (decisão 2026-08-26): ele não acompanha o branding e fica ruim em cores como o laranja da ensi. Hoje o padrão é derivar de `var(--color-primary)` e usar cor **sólida**.

```css
/* repouso */
background: var(--color-primary);
border: 1px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
color: #fff;
box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.30);
/* hover */
background: var(--color-primary-hover);
box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.45);
transform: translateY(-1px);
```

Classes globais que já fazem isso: `.ds-btn-primary` (novo/add) e `.ds-btn-save` (salvar). Botões primários locais equivalentes (`.open-btn`, `.btn-submit`, `.btn-iniciar`, `.btn-finalizar`, `.add-btn`, `.action-btn-primary`, `.pag-num--active`) seguem o mesmo padrão sólido.

### Botão ghost / ação secundária no card

```css
background: color-mix(in srgb, var(--color-primary) 8%, transparent);
border: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
color: var(--color-primary);
padding: 7px 14px; border-radius: 9px;

hover: background: color-mix(in srgb, var(--color-primary) 18%, transparent);
       border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
```

---

## 13. Paginação

> **⚠️ Dual-theme:** Usar `border-divider`, `hover:text-text`, `hover:bg-div-15` — nunca `border-white/5`, `hover:text-white`, `hover:bg-white/5`.

```html
<!-- Separador superior -->
<div class="border-t border-divider mt-4 pt-4 flex items-center justify-center gap-1">
  <!-- Botão anterior / próximo -->
  <button class="w-8 h-8 rounded-lg text-secondary hover:text-text hover:bg-div-15
                 transition-all disabled:opacity-20 disabled:cursor-not-allowed">‹</button>

  <!-- Número ativo -->
  <button class="w-8 h-8 rounded-lg bg-primary text-white">3</button>

  <!-- Número inativo -->
  <button class="w-8 h-8 rounded-lg text-secondary hover:text-text hover:bg-div-15">4</button>

  <!-- Ellipsis -->
  <span class="text-secondary/30 text-[10px] px-1">...</span>
</div>
```

```css
/* Referência CSS equivalente (tokens) */
.pag-btn {
  width: 32px; height: 32px; border-radius: 8px;
  font-size: 10px; font-weight: 900;
  color: var(--color-secondary);
  background: transparent; border: none;
  cursor: pointer; transition: all 0.15s;
}
.pag-btn:hover:not(:disabled) {
  background: var(--color-secondary-surface);  /* = bg-div-15 */
  color: var(--color-text);
}
.pag-btn:disabled { opacity: 0.20; cursor: not-allowed; }

.pag-num--active { background: var(--color-primary); color: #fff; }

/* Separador */
.pag-divider { border-top: 1px solid var(--color-divider); }
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
| `/meus-processos` | `meus-processos/index.vue` | Cards de aluno, status pills, paginação dual-theme ✅ |
| `/matriculas` | `MatriculasList.vue` | Coluna única, avatar, status pill com dot |
| `/processos` | `ProcessosTabInscritos.vue` | Coluna única, 3 status pills no footer, meta à direita |
| `/docentes` | `DocentesTabDocentes.vue` | Coluna única, avatar, valor hora/aula editável, modais em `.ds-modal-*` |
| `/atribuicao` | `AtribuicaoPage.vue` | Accent bar de topo + lateral, badge de papel com dot |
| `/atribuicao` (modal) | `ModalAtribuirDocente.vue` | Card selecionado com accent bar + checkbox gradient |
| `/formularios?tab=perguntas` | `FormulariosTabPerguntas.vue` | Grid 2 colunas, badges de tipo |

> **Referência dual-theme:** `/academico_oferta` — todos os tabs convertidos com badges, contadores e paginação usando tokens. Usar como modelo ao converter novas páginas.

---

## 16. Tema Claro — Regras e Padrões

> O tema é ativado por `data-theme="light"` no `<html>` (store `toggleTheme`/`initTheme`).  
> Toda a lógica de cor está em `[data-theme="light"]` no **final** de `style.css`.

### Tokens principais (claro vs. escuro)

| Token | Escuro | Claro |
|---|---|---|
| `--color-background` | `#0a0a0c` | `#e7e9ee` |
| `--color-text` | `#e8e6e8` | `#1f2430` |
| `--color-secondary` | `#8c878d` | `#5b6472` |
| `--color-secondary-surface` | translúcido branco | `#f1f3f6` |
| `--color-secondary-surface-hover` | — | `#e9ecf1` |
| `--color-divider` | `rgba(255,255,255,0.08)` | `rgba(31,36,48,0.20)` |
| `--field-bg` | `rgba(255,255,255,0.04)` | `#f9fafb` |
| `--field-border` | `rgba(255,255,255,0.07)` | `rgba(31,36,48,0.14)` |
| `--field-text` | `rgba(232,230,240,0.9)` | `rgba(31,36,48,0.92)` |

### O que NUNCA usar (quebra no claro)

| ❌ Hardcoded | ✅ Token equivalente |
|---|---|
| `text-white` / `text-white/*` | `text-text` / `text-secondary/*` |
| `bg-white/*` / `bg-[#hex escuro]` | `bg-div-15` / `bg-background` |
| `border-white/*` / `border-white/5` | `border-divider` |
| `hover:text-white` | `hover:text-text` |
| `hover:bg-white/5` | `hover:bg-div-15` |
| `rgba(255,255,255,*)` em `<style scoped>` | `var(--color-*)` / `var(--field-*)` |
| `color: #c4b5fd` em badges | `color: var(--color-primary)` |

### Contadores e meta-labels

```html
<!-- ✅ Correto -->
<span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">
  {{ count }} item(s)
</span>

<!-- ❌ Errado — desaparece no claro -->
<span class="text-[10px] font-black text-secondary/30 ...">
```

**Escala de opacidade aprovada:**
- `/50` — counters de lista ("N item(s)"), "Carregando..."
- `/60` — empty state título
- `/40` — empty state subtítulo

### Cores semânticas (mantêm em ambos os temas)

Estas **não precisam de token** — são fixas por convenção de estado:

| Cor | Valor | Uso |
|---|---|---|
| Sucesso/ativo | `#34d399` | Matriculado, aprovado, ativo |
| Atenção/pendente | `#fbbf24` | Pendente, pago, atenção |
| Erro/reprovado | `#f87171` | Reprovado, erro, cancelado |
| Info/auxiliar | `#38bdf8` | Matrícula direta, informação |
| Botão primário | `color: #fff` | Sempre branco sobre gradiente violet |

### Checklist rápido ao criar/converter um componente

- [ ] Nenhum `text-white`, `bg-white/*`, `border-white/*` no template
- [ ] Nenhum `rgba(255,255,255,*)` no `<style scoped>`
- [ ] Contadores com `text-secondary/50` (não `/30`)
- [ ] Badges neutros com `var(--color-secondary)` + `var(--color-secondary-surface)` + `var(--color-divider)`
- [ ] Badges de contexto com `var(--color-primary)` (não `#c4b5fd`)
- [ ] Paginação com `border-divider`, `hover:text-text`, `hover:bg-div-15`
- [ ] Inputs/selects via `BaseField` (herda `var(--field-*)` automaticamente)

### Tema padrão por entidade (multi-tenant / white label)

Cada entidade (`user_entidades.tema`) define o **tema padrão** (`dark` | `light`) para quem entra naquele domínio. O usuário ainda pode alternar manualmente com o toggle do header — quando ele alterna, `localStorage.theme` é gravado e passa a **prevalecer** sobre o tema da entidade.

**Fluxo (quem aplica):**
- Migration `20260822090000_entidade_tema.sql` → coluna `user_entidades.tema` (default `dark`; ENSI = `light`).
- Migration `20260822090100_rpc_entidade_tema.sql` → `app_resolver_entidade_por_dominio` e `app_get_minha_sessao` retornam `tema` no objeto da entidade/branding.
- `server/api/me.ts` → expõe `tema` (usa sempre a entidade ativa resolvida, seja por domínio ou fallback).
- Store `app.ts` → `aplicarTemaDaEntidade(tema)` é chamado no `initSession`, **apenas se `localStorage.theme` estiver vazio** (respeita escolha manual). Seta `data-theme` no `<html>` e `isDark`.

**Regra de precedência:** `localStorage.theme` (escolha manual) **>** tema da entidade **>** default `dark`.

**Fallback de dev (`localhost`):** quem manda qual entidade resolve no localhost é `EDUCLICK_FALLBACK_ENTIDADE_ID` no `.env` da `front_end` (default `00ca60ea-…` = `educlick_modelo`, tema `dark`). Em dev, ao setar esse ID, o `/api/me` **prioriza o fallback sobre o domínio** e, se o usuário não pertencer à entidade, entra em modo **bypass** (trata como admin só para testar branding/tema localmente). A resolução de entidade por domínio/id acontece **no BFF via RPC `SECURITY DEFINER`** (`app_resolver_entidade_por_dominio` / `app_resolver_entidade_por_id`), com `GRANT` **só para `service_role`** — não é exposta a `anon`/`authenticated` e o `me.ts` **não usa query direta** (ver `servidor_ssr_bff.md` §5.2). A policy de **leitura de `user_entidades` permanece pública** (outras RPCs `SECURITY INVOKER` leem essa tabela e dependem disso); a resolução DEFINER é que não depende mais dessa policy.

### Cores de marca: sempre derivar, nunca fixar o violeta

A cor primária vem do **branding da entidade** (`user_entidades.cor_principal`), injetada como `--color-primary` no `<html>`. **Nunca hardcode o violeta** (`#7c3aed`, `#8b5cf6`, `#a78bfa`, `rgba(139,92,246,*)`) em elemento que deve acompanhar a marca — use `var(--color-primary)` ou `color-mix(...)`. Ex.: a aba ativa da ensi fica laranja; na educlick, violeta.

### Padrão “sólido” em botões e accent bars (decisão 2026-08-26)

**Gradiente (`linear-gradient(...)`) não deve ser usado em botões primários nem barras de marca** — em certas cores (ex.: laranja da ensi) fica ruim. Todo elemento “primário” usa cor **sólida**:

```css
/* Repouso */
background: var(--color-primary);   color: #fff;
/* Hover */
background: var(--color-primary-hover);
```

Aplicado a (padrão do design system):
- `.ds-btn-primary`, `.ds-btn-save` (globais) — e botões primários locais equivalentes (`.open-btn`, `.btn-submit`, `.btn-iniciar`, `.btn-finalizar`, `.add-btn`, `.action-btn-primary`, `.pag-num--active`).
- **Accent bars** (barras de 3px de destaque no hover de cards, topo de modais, etc.): `background: var(--color-primary)`.
- Aba ativa (`.ds-tab-btn--active`): `background: var(--color-primary); color: #fff` (bloco sólido, evita o laranja “marrom” ao ficar translúcido no escuro).
- `.ds-modal-accent-bar`: `background: var(--color-primary)`.

**Atenção de cor:** `color-mix(... primary N%, transparent)` sobre fundo escuro escurece a cor — **laranja translúcido vira marrom** (`#3A2D27`). Prefira **superfícies translúcidas** misturando com `var(--color-secondary-surface)` (não `transparent`) ou use cor **sólida**.

---

## 17. Padrão de Calendário e Timeline Dual-Theme

Aplica-se às páginas e componentes de gestão de datas, feriados, eventos e grade de aulas (ex.: `/academico_calendario`, `/calendario-salas`, etc.).

### 1. Timeline Vertical de Meses e Eventos (`CalendarioTabFeriados` / `CalendarioTabEventos`)
- **Linha central/guia:** `w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent`.
- **Nó da linha do tempo (`Timeline Node`):**
  - Mês com registros / ativo: `bg-primary shadow-[0_0_10px_rgba(139,92,246,0.3)] border border-primary text-white`.
  - Mês sem registros / inativo: `bg-background border-2 border-divider text-secondary/40`.
- **Cabeçalho do Mês:** Nome do mês em `text-text` (mês atual em `text-primary`), ano em `text-secondary/50`.
- **Card de Evento (`.comp-card`):**
  - `background: var(--color-secondary-surface); border: 1px solid var(--color-divider); border-radius: 12px;`
  - Hover: `background: var(--color-secondary-surface-hover); border-color: rgba(139, 92, 246, 0.3);`
  - Bloco de Data (Dia da semana + número): `bg-div-15 border border-divider` com dia em `text-secondary/60` e número em `text-primary`.
  - Título do evento: `text-text`.

### 2. Grade de Calendário Mensal e Semanal (`CalendarioTabCalendario`)
- **Container da Grade:** `border border-divider rounded-xl overflow-hidden`.
- **Cabeçalho dos dias da semana (DOM, SEG...):** `bg-div-15 border-b border-divider text-secondary/60 text-[9px] font-black uppercase tracking-[0.18em]`.
- **Células dos Dias:** `border-r border-b border-divider bg-background hover:bg-div-15`.
- **Número do Dia da Célula:** `cell.isToday ? 'bg-primary text-white' : 'text-text'`.
### 3. Matriz de Reserva de Salas/Recursos x Dias (`CalendarioGrid` em `/calendario-salas`)
- **Container da Matriz:** `bg-secondary-surface border border-divider rounded-xl relative`.
- **Cabeçalho de datas e colunas fixas (sticky top/left):** `bg-secondary-surface border-divider text-secondary/60 text-[9px] font-black uppercase`.
- **Células de Recurso (ex: Sala):** `bg-secondary-surface border-r border-b border-divider text-text`.
- **Cartões/Slots de Reserva:**
  - Reserva de Aula: `bg-div-15 border-l-4 border-divider text-text` com badge `bg-div-30 text-secondary`.
  - Reserva de Evento: `bg-primary/10 border-l-4 border-primary text-text` com badge `bg-primary/10 text-primary`.
  - Intervalo: `text-amber-500/60 font-bold uppercase`.
---

## 18. Padrão de Cards de Módulo/Ciclo e Atribuição Docente (`/atribuicao`)

Aplica-se aos componentes de organização acadêmica por módulos, ciclos e componentes curriculares (`AtribuicaoCicloCard`, `AtribuicaoPage`, `ModalAtribuirDocente`).

### 1. Cards de Módulo/Ciclo (`AtribuicaoCicloCard`)
- **Container do Ciclo:** `bg-secondary-surface border border-divider rounded-xl overflow-hidden`.
- **Accent Bar:** `height: 3px; background: linear-gradient(90deg, #7c3aed, rgba(124,58,237,0.2));`.
- **Header do Ciclo:** Ícone em `bg-primary/10 border border-primary/20 text-primary`, título em `text-text`, descrição em `text-secondary/60`, contador em `text-secondary/50`.
- **Linhas de Componentes (`.comp-row`):** `border-b border-divider hover:bg-div-15`.
- **Nível / Guia vertical do componente:** `w-0.5 h-7 rounded bg-primary/30`.

### 2. Badges Semânticos de Docentes Atribuídos
- **Docente Titular:** `bg-emerald-500/10 border border-emerald-500/25 text-emerald-500` (ponto indicador: `#10b981`).
- **Docente Substituto:** `bg-amber-500/10 border border-amber-500/25 text-amber-500` (ponto indicador: `#f59e0b`).
- **Docente Auxiliar:** `bg-sky-500/10 border border-sky-500/25 text-sky-500` (ponto indicador: `#0284c7`).
- **Outros/Padrão:** `bg-secondary-surface-hover border border-divider text-secondary`.

### 3. Seleção de Docentes no Modal de Atribuição (`ModalAtribuirDocente`)
- **Cards de Docentes na Lista (`.docente-card`):** `bg-secondary-surface border border-divider hover:bg-secondary-surface-hover`.
- **Card Selecionado:** `border-primary bg-primary/5` com barra lateral acentuada `bg-gradient-to-b from-primary to-primary/60`.

---

## 19. Padrão de Programação de Atividades e Correção Docente (`/programacao_atividades` & `/portal-docente/entregas`)

Aplica-se às visões de Repositório, Distribuição, Montagem de Currículo e Correção de Entregas pelo docente (`ProgAtividadesTab*`, `ConteudoRow`, `DocenteEntregas*`, `ModalProgAtividades*`).

### 1. Painéis Duplos e Árvore (`ProgAtividadesTabCurriculo` & `ProgAtividadesTabDistribuicao`)
- **Containers de Painel (Esquerdo/Direito):** `bg-secondary-surface border border-divider rounded-2xl overflow-hidden`.
- **Cabeçalho Interno dos Painéis:** `px-5 py-4 border-b border-divider bg-div-15 flex items-center justify-between`.
- **Gatilhos de Acordeão / Árvore (`.accordion-trigger`):** `bg-secondary-surface border border-divider text-text hover:bg-secondary-surface-hover`. Subgatilhos em `bg-secondary-surface border border-divider`.
- **Linhas de Conteúdo (`ConteudoRow` & `.assoc-row`):** `bg-secondary-surface border border-divider rounded-xl hover:bg-secondary-surface-hover`. Quando ativo/associado: `bg-primary/5 border-primary/30`.

### 2. Badges de Tipos de Conteúdo
- **Material:** `bg-blue-500/12 text-blue-500`.
- **Atividade:** `bg-amber-500/12 text-amber-500`.
- **Avaliação / Questionário:** `bg-primary/12 text-primary`.

### 3. Construtor de Perguntas e Questionários (`ModalProgAtividadesConteudo`)
- **Modal de Passos:** Utiliza a estrutura `.ds-modal-overlay`, `.ds-modal-panel max-w-3xl`, `.ds-modal-accent-bar`, `.ds-modal-footer`, `.ds-btn-cancel` e `.ds-btn-save`.
- **Navegador de Passos (Step Indicator):** Passos concluídos em `bg-emerald-500 text-white`, passo ativo em `bg-primary text-white`, passos futuros em `bg-secondary-surface-hover text-secondary`.
- **Cards de Perguntas (`.pergunta-card`):** `bg-secondary-surface border border-divider rounded-xl p-4`.
- **Alternativas:** `border border-divider bg-secondary-surface`. Alternativa correta: `border-emerald-500/30 bg-emerald-500/5 text-emerald-500`. Alternativa incorreta escolhida: `border-red-500/30 bg-red-500/5 text-red-500`.

---

## 20. Padrão de Produtos e Ofertas Comerciais (`/produtos`)

Aplica-se às visões de hierarquia comercial em 3 níveis (Programa → Produto → Oferta) (`ProdutosTabLista`, `ModalProduto`, `ModalOferta`).

### 1. Hierarquia de Containers e Acabamento por Nível
- **Nível 1 — Programa (`.prog-card`):** `bg-secondary-surface border border-divider rounded-xl`. Hover: `border-primary/30`. Accent bar violeta na lateral esquerda.
- **Nível 2 — Produto (`.prod-item`):** `bg-secondary-surface border border-divider rounded-lg`. Hover: `border-indigo-500/30`. Accent bar azul-índigo (`#6366f1`). Avatar: `bg-indigo-500/10 border-indigo-500/20 text-indigo-500`.
- **Nível 3 — Oferta (`.oferta-card`):** `bg-secondary-surface border border-divider rounded-md`. Background da seção: `bg-div-15`. Accent bar azul-celeste (`#3b82f6`). Slug: `text-primary font-mono`. Valor: `text-text font-black`.

### 2. Badges de Visibilidade e Pagamento
- **Gratuito / Ativo / Pago Único:** `bg-emerald-500/10 border border-emerald-500/25 text-emerald-500`.
- **Pago / Recorrente:** `bg-amber-500/10 border border-amber-500/25 text-amber-500`.
- **Visibilidade Pública:** `bg-sky-500/10 border border-sky-500/25 text-sky-500`.
- **Visibilidade Oculta:** `bg-primary/10 border border-primary/25 text-primary`.
- **Inativo / Padrão:** `bg-secondary-surface-hover border border-divider text-secondary`.

---

## 21. Padrão de Configuração de Gateway de Pagamento (`/configuracoes/pagamento`)

Aplica-se à tela de status e integração de pagamentos (`ConfigGatewayStatus`, `pagamento.vue`).

### 1. Card de Conexão e Integradores
- **Container do Card:** `bg-secondary-surface border border-divider rounded-xl overflow-hidden shadow-sm`.
- **Barra Superior de Status:** `height: 4px;` com gradiente `from-emerald-500 to-teal-500` (quando conectado) ou `from-amber-500 to-orange-500` (quando pendente).
- **Ícone do Integrador:** `w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500` (conectado) ou `bg-amber-500/10 border border-amber-500/20 text-amber-500` (pendente).
- **Linhas de Detalhes (`Conta` e `Ambiente`):** `bg-div-15 border border-divider rounded-lg px-4 py-2.5`, valor em `font-mono text-text font-bold`.

---

## 22. Padrão de Meus Cursos — Portal do Aluno (`/meus-cursos`)

Aplica-se aos cards de cursos adquiridos pelo aluno (`meus-cursos/index.vue`).

### 1. Cards de Curso Adquirido (`.curso-card`)
- **Container do Card:** `bg-secondary-surface border border-divider rounded-2xl overflow-hidden`.
- **Accent Top Bar:** `h-1 bg-gradient-to-r from-primary to-purple-500`.
- **Hover do Card Interativo:** `bg-secondary-surface-hover border-primary/30 transform -translate-y-0.5 shadow-md`.
- **Título do Programa:** `text-base font-black text-text`.
- **Nome Curto:** `text-[10px] font-black uppercase tracking-widest text-primary`.
- **Status do Curso:** Badge `bg-emerald-500/10 border border-emerald-500/25 text-emerald-500` (Ativo) ou `bg-secondary-surface-hover border border-divider text-secondary` (Pendente).
- **Botão de Acesso ("Abrir"):** `text-[10px] font-black uppercase tracking-widest text-primary` acompanhado de `Icon name="ph:caret-right-bold"`.

---

## 23. Padrão do LMS do Aluno (`/minhas_atividades`)

Aplica-se aos componentes de estudo do aluno (`MinhasAtividadesPage`, `ConteudoArvore`, `ConteudoLista`, `ConteudoLinha`, `ConteudoMaterial`, `ConteudoAtividade`, `ConteudoAvaliacao`, `MinhasAtividadesSidebar`).

### 1. Árvore de Conteúdos & Resumo
- **Containers Principais:** `bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm`.
- **Header do Painel:** `border-b border-divider bg-div-15 px-5 py-4`.
- **Linha de Conteúdo (`ConteudoLinha`):**
  - Normal: Hover em `bg-secondary-surface-hover`.
  - Ativo: `bg-primary/12 border border-primary/25 text-primary`.
  - Indisponível/Agendado: `opacity-50`.
  - Badges por Tipo: Material (`bg-blue-500/12 text-blue-500`), Atividade (`bg-emerald-500/12 text-emerald-500`), Avaliação (`bg-amber-500/12 text-amber-500`).

### 2. Player de Conteúdos, Atividades e Provas
- **Cards de Referência & Feedback:** `bg-secondary-surface border border-divider rounded-xl p-4`.
- **Botão de Alternância de Visão (`VisaoToggle`):** `bg-secondary-surface border border-divider text-secondary`, ativo em `bg-primary/12 border-primary/25 text-primary`.
- **Timer de Avaliação:** `bg-primary/8 border border-primary/25 text-primary rounded-xl px-4 py-3`, alerta em `bg-red-500/8 border-red-500/30 text-red-500`.
- **Alternativas de Múltipla Escolha:** Card `bg-secondary-surface border border-divider rounded-xl`, selecionado em `bg-primary/8 border-primary/50`.









