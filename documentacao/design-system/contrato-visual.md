# 🎨 Contrato Visual — EduClick Design System

> Data: 2026-06-22  
> Baseado nos padrões extraídos de: oferta.vue, formulário de inscrição, página de sucesso, formulários admin, layouts, modal, componentes globais

---

## 1. 🌑 Paleta de Cores

### Cor &nbsp;&nbsp; | Variável CSS | Valor | Uso
---|---|---|---
**Background** | `--color-background` | `#0a0a0c` | Fundo principal das páginas
**Surface** | (inline) | `#0f0f17` | Cards, headers, containers
**Surface 2** | `--color-secondary-surface` | `rgba(140,135,141,0.09)` | Cards secundários (div-15)
**Surface Hover** | `--color-secondary-surface-hover` | `rgba(140,135,141,0.18)` | Hover de cards (div-30)

**Primary** | `--color-primary` | `#8b5cf6` | Ações principais, links ativos, badges
**Primary Hover** | `--color-primary-hover` | `#7c3aed` | Hover de botões primários
**Primary RGB** | `--color-primary-rgb` | `139, 92, 246` | Para usar com opacity (`rgba()`)

**Secondary** | `--color-secondary` | `#8c878d` | Texto secundário, labels inativos
**Secondary Hover** | `--color-secondary-hover` | `#585458` | Hover de elementos secundários

**Danger** | `--color-danger` | `#E7333F` | Erros, deleção, ações destrutivas
**Success** | `--color-success` | `#95C11E` | Confirmação, sucesso
**Warning** | `--color-warning` | `#FFD753` | Avisos, "já inscrito", atenção

**Texto** | `--color-text` | `#e8e6e8` | Cor do texto principal
**Texto opaco** | — | `rgba(255,255,255,0.4 a 0.6)` | Subtítulo, metadados

### Field Tokens (inputs, selects, textareas)

| Token | Valor | Descrição |
|---|---|---|
| `--field-bg` | `rgba(255,255,255,0.04)` | Fundo do campo |
| `--field-bg-select` | `#16161e` | Fundo opaco para `<select>` |
| `--field-bg-hover` | `rgba(139,92,246,0.08)` | Hover do campo |
| `--field-border` | `rgba(255,255,255,0.07)` | Borda padrão |
| `--field-border-focus` | `rgba(139,92,246,0.45)` | Borda em foco |
| `--field-text` | `rgba(232,230,240,0.9)` | Texto do campo |
| `--field-placeholder` | `rgba(255,255,255,0.22)` | Placeholder |
| `--field-shadow-focus` | `0 0 0 3px rgba(139,92,246,0.10)` | Glow de foco |

---

## 2. 🔤 Tipografia

### Fontes
- **Sans-serif (Tailwind)**: `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif`
- **Sans-serif (CSS)**: `Roboto, system-ui, Avenir, Helvetica, Arial, sans-serif`

### Escala de Tamanhos (Tailwind)
| Classe | px | Uso típico |
|---|---|---|
| `text-[8px]` | 8px | Micro labels, badges |
| `text-[9px]` | 9px | Labels de campos, badges |
| `text-[10px]` | 10px | Labels, metadados, tabs inativas |
| `text-[11px]` | 11px | Nomes de arquivo, textos auxiliares |
| `text-xs` | 12px | Corpo pequeno, botões, cards info |
| `text-sm` | 14px | Corpo de texto, parágrafos |
| `text-lg` | 18px | Subtítulos |
| `text-xl` | 20px | Títulos |
| `text-2xl` | 24px | Títulos de seção |
| `text-4xl` | 36px | Hero (páginas públicas) |

### Pesos
- `font-bold` (700) — a maioria dos textos
- `font-black` (900) — títulos, labels, botões, badges
- `font-medium` (500) — texto de corpo alternativo
- `font-semibold` (600) — labels do builder

### Estilo Padrão de Labels
```css
font-size: 10px;  /* ou 9px */
font-weight: 900; /* black */
text-transform: uppercase;
letter-spacing: 0.05em a 0.2em;
color: rgba(140,135,141, 0.4 a 0.6); /* secondary */
```

---

## 3. 🔘 Botões

### 3.1 Botão Primário
```html
class="px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
```
- Uso: "Acessar", "Salvar", próximo passo
- Alt com gradiente: `bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6]`

### 3.2 Botão Secundário (Outline)
```html
class="px-8 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
```
- Uso: "Voltar", "Anterior", "Cancelar"

### 3.3 Botão de Sucesso
```html
class="px-8 py-3 rounded-xl bg-green-500 text-white text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
```
- Uso: "Finalizar Inscrição", "Confirmar"

### 3.4 Botão de Perigo
```html
class="px-2 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white transition-colors"
```
- Uso: Remover arquivo, excluir (ações destrutivas)

### 3.5 Botão de Badge "Já Inscrito" (Disabled)
```html
class="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-default"
```

### 3.6 Botão de Tab (Ativo / Inativo)
```html
<!-- Ativo -->
class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30"

<!-- Inativo -->
class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/[0.02] text-secondary/40 border border-white/5 hover:text-white hover:border-white/10"
```

### 3.7 Botão de Filtro (Ativo / Inativo)
```html
<!-- Ativo -->
class="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20"

<!-- Inativo -->
class="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-secondary hover:text-white"
```

### 3.8 Botão "Navegação" (Tab horizontal)
```html
class="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
```

---

## 4. 📦 Cards

### 4.1 Card de Programa (Oferta pública)
```html
class="group relative bg-[#0f0f17] border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:translate-y-[-4px] shadow-xl hover:shadow-primary/5 flex flex-col"
```
- **Accent bar**: `h-1 bg-gradient-to-r from-primary to-purple-500 opacity-30 group-hover:opacity-100`
- **Padding**: `p-8` (corpo), `p-6 bg-white/[0.02] border-t border-white/5` (footer)
- **Badge de área**: `px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest`
- **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`

### 4.2 Card Interno (Admin)
```html
class="bg-white/[0.025] border border-white/5 p-3 rounded-xl hover:border-primary/30 hover:translate-x-[2px]"
```
- Accent lateral: 3px solid primary, opacity 0 → 1 on hover

### 4.3 Card de Seção (Layout base)
```html
class="bg-[var(--color-secondary-surface)] rounded-xl p-6 border border-white/5"
```

---

## 5. 📐 Layouts

### Layout Público (sem layout, `layout: false`)
- Container: `min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-primary/30`
- Header: `sticky top-0 z-50 bg-[#0f0f17]/80 backdrop-blur-md border-b border-white/5 px-6 py-4`
- Logo: Icon `ph:graduation-cap-fill` w/ gradient bg + "EduClick" + subtitle
- Nav: `text-xs font-bold uppercase tracking-widest text-secondary hover:text-white`
- Hero section com glows: `absolute *-[*%] bg-primary/10 blur-[120px] rounded-full`

### Layout Base (Admin autenticado)
- Container: `h-screen bg-background flex flex-col md:flex-row gap-4 p-2 md:p-5 overflow-hidden`
- Main: `flex-1 flex flex-col gap-4 h-full overflow-hidden relative`
- Header: `bg-transparent md:bg-div-15 px-2 py-1 md:px-4 md:py-3 rounded-xl border-0 md:border border-white/5`
- Sidebar (opcional): `w-full md:w-[320px] lg:w-[380px] bg-div-15 rounded-xl border border-white/5 p-5`
- Conteúdo scrollável: `flex-1 overflow-y-auto rounded-xl custom-scrollbar`
- Footer: `text-[9px] uppercase tracking-widest text-white/20 border-t border-white/5`

### Layout Wide (Admin sem sidebar)
- Igual ao base mas sem `<aside>`

---

## 6. 🧩 Componentes Reutilizáveis

### 6.1 Modal
- Overlay: `fixed inset-0 z-50 bg-[rgba(0,0,0,0.85)]` com `fadeIn 0.15s`
- Panel: `#13131a` bg, `rounded-2xl`, `border-primary/18`, box-shadow elevado, `slideUp 0.2s`
- Accent bar: 3-4px gradient ou cor sólida (danger/warning/info)
- Header: ícone (40x40, bg primary/12, rounded-xl) + título uppercase tracking-widest + close btn
- Body: padding 24-32px
- Footer: `flex justify-end gap-2.5 p-4` com `border-t white/6`

### 6.2 Empty State
```html
class="text-center py-20 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl"
```
- Ícone: 64px+, cor `text-secondary/20`
- Texto: `text-secondary font-bold`

### 6.3 Loading Skeleton
```html
class="bg-white/5 animate-pulse rounded-xl border border-white/5"
```

### 6.4 Spinner
```html
class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
```

### 6.5 Toast (useToast composable)
- Posição: fixed top-20px right-20px
- Cores: error `#ef4444`, success `#10b981`, info `#111827`
- Transição: fadeIn + slideDown 180ms

### 6.6 LoadingOverlay (Global)
- Full screen com bg `var(--color-background)`
- Spinner animado com múltiplos rings + pulse core
- Brand text + bouncing dots

---

## 7. 📋 Tabela de Decisões Rápidas

| Situação | Classe / Padrão |
|---|---|
| Fundo da página | `bg-[#0a0a0c]` |
| Container de conteúdo | `max-w-5xl mx-auto px-6` |
| Card container | `bg-[#0f0f17] rounded-xl border border-white/5` |
| Título de seção | `text-2xl font-black mb-8 tracking-tight` |
| Label de campo | `text-[10px] font-black uppercase tracking-widest text-secondary/60` |
| Placeholder de upload | `rounded-xl border border-white/10 bg-white/[0.03] p-3 cursor-pointer hover:border-primary/30 hover:bg-white/[0.06]` |
| Ícone decorativo | `Icon name="ph:*" class="w-* h-* text-*"` |
| Avatar/ícone container | `w-* h-* rounded-* bg-primary/10 text-primary flex items-center justify-center` |
| Divisor | `border-t border-white/5` |
| Badge informacional | `px-* py-* rounded-lg bg-*/10 border border-*/20 text-[9px] font-black uppercase tracking-widest` |
| Gradiente de texto | `text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400` |
| Glow decorativo | `absolute bg-primary/10 blur-[120px] rounded-full` |

---

## 8. 🔌 Ícones

Todos os ícones usam **Phosphor Icons** via `@nuxt/icon`:
```html
<Icon name="ph:nome-do-icone" class="w-* h-*" />
```

### Ícones comuns no projeto:
| Ícone | Uso |
|---|---|
| `ph:graduation-cap-fill` | Logo EduClick |
| `ph:form-bold` | Formulário |
| `ph:clock-bold` | Carga horária |
| `ph:user-plus-bold` | Matrículas |
| `ph:seal-check-bold` | Já inscrito / Confirmado |
| `ph:file-light` | Upload de arquivo |
| `ph:camera-light` | Upload de foto |
| `ph:trash-light` | Remover arquivo |
| `ph:arrow-square-out-bold` | Visualizar arquivo |
| `ph:sign-out-bold` | Logout |
| `ph:folder-open-light` | Empty state |
| `ph:seal-warning-light` | Erro / vazio |
| `ph:question-bold` | Pergunta |
| `ph:x-bold` ou `×` | Fechar modal |

---

## 9. 🔄 Animações

| Animação | Onde usar |
|---|---|
| `hover:translate-y-[-4px]` | Card hover (elevação) |
| `hover:translate-x-[2px]` | Card item hover (deslize) |
| `hover:opacity-100` | Accent bar hover |
| `animate-spin` | Spinner loading |
| `animate-pulse` | Skeleton loading |
| `animate-bounce` | Badge "Inscrições Abertas" |
| `animate-bounce-in` | Check de sucesso |
| `animate-draw-check` | SVG check path |

---

## 10. 📱 Responsividade

| Breakpoint | Comportamento |
|---|---|
| `md:` (768px) | Grid 2 colunas, header com borda, sidebar aparece |
| `lg:` (1024px) | Grid 3 colunas, sidebar larga (380px) |
| Padrão (mobile) | 1 coluna, header sem borda, sem sidebar |

---

## 11. 📂 Estrutura de Páginas

Cada página segue um destes padrões:

### Página Pública (`layout: false`)
```
min-h-screen bg-[#0a0a0c]
  └── header (sticky, backdrop-blur)
  └── hero (opcional: glows + título)
  └── main (max-w-7xl mx-auto px-6 pb-20)
  └── footer (border-t white/5)
```

### Página Admin (`layout: "base"` ou `"wide"`)
```
page-wrap (p-4 md:p-5)
  └── page-top-row (flex justify-between mb-8)
  │     └── tabs-nav (bg-white/2 rounded-xl p-1)
  │     └── add-btn (opcional)
  └── conteúdo
```

### Página Admin com Tabs Dinâmicas (`layout: "base"`)
```
page-wrap
  └── page-top-row (título + metadados)
  └── tabs-bar (overflow-x-auto) → tabs-nav com botões via v-for
  │     └── tab-btn com tab-badge (contagem por área)
  └── conteúdo (placeholder enquanto parcial)
```

---

## 12. 📍 Rotas e Páginas

| Rota | Layout | Tipo |
|---|---|---|
| `/` | `false` | Pública |
| `/oferta` | `false` | Pública |
| `/form/:tipo_proc/:tipo_cand/:area_id/:programa_id` | `false` | Pública |
| `/form/sucesso` | `false` | Pública |
| `/formularios` | `wide` | Admin |
| `/academico_oferta` | `base` | Admin |
| `/processos` | `base` | Admin |
