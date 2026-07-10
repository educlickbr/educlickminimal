# educlick — Branding Guide 2026

> Produto da **Zero Tropical**. Atualizado em julho de 2026.

---

## Contexto

O Educlick nasceu como uma edtech independente e hoje é um **produto**
da Zero Tropical — consultoria de tecnologia sob medida.

Diferente da geração anterior de sistemas educacionais engessados,
o Educlick é uma **base sólida e pronta** que se adapta à operação
de cada escola. A identidade visual reflete esse posicionamento:
**maduro, direto e flexível** — sem firulas, sem infantilização.

---

## Conceito

| Pilar | Expressão visual |
|---|---|
| **Base pronta** | Fundo escuro sólido (`#0a0a0c`), estrutura limpa, sem ruído |
| **Flexível** | Componentes modulares, glassmorphism, adaptação por tenant |
| **Tecnologia** | Violeta como cor de ação, glow effects, tipografia moderna |
| **Proximidade** | Tom direto, sem jargão, sem "perene" |

---

## Logotipo

Arquivo: `/public/educlick_logo.png`

- Fundo transparente
- Cor: off-white
- Uso principal: header e footer da landing page e do app
- Margem de respiro: mínimo 16px ao redor
- Tamanho mínimo: 28px de altura

**⚠️ Não distorcer, não alterar cor, não aplicar efeitos.**

---

## Paleta de Cores

### Cor primária — Violeta

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#8b5cf6` | Botões, acentos, links, glow, foco |
| `primary-dark` | `#7c3aed` | Hover, fundo de seções destaque |
| `primary-rgb` | `139, 92, 246` | Para rgba() em overlays e shadows |

O violeta comunica **tecnologia com personalidade** — nem o azul corporativo
genérico, nem o rosa infantilizado de edtechs da década passada.

### Superfícies

| Token | Hex | Uso |
|---|---|---|
| `background` | `#0a0a0c` | Fundo principal |
| `surface-card` | `rgba(255,255,255,0.04)` | Cards, modais |
| `surface-alt` | `#1a102e` | Fundo de seções de destaque (violeta bem escuro) |
| `border` | `rgba(255,255,255,0.05)` | Bordas de cards |
| `border-hover` | `rgba(139,92,246,0.30)` | Borda no hover |

### Texto

| Token | Hex | Uso |
|---|---|---|
| `text` | `#e8e6e8` | Texto principal |
| `secondary` | `#8c878d` | Texto secundário, placeholders |
| `muted` | `rgba(255,255,255,0.20)` | Copyright, metadados |

### Semânticas

| Cor | Hex | Significado |
|---|---|---|
| Verde | `#95C11E` | Sucesso, ativo, aprovado |
| Âmbar | `#FFD753` | Pendente, atenção |
| Vermelho | `#E7333F` | Erro, reprovado, perigo |

---

## Tipografia

### Principal: Inter

Família: `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif`

| Uso | Weight | Size | Tracking |
|---|---|---|---|
| Hero headline | `900` (black) | `3rem–6rem` | `-0.02em` |
| Section title | `900` (black) | `1.875rem–3rem` | `-0.01em` |
| Card title | `700` (bold) | `1.125rem` | normal |
| Body | `400` (regular) | `0.875rem–1.125rem` | normal |
| Labels / badges | `700–900` | `10px–11px` | `0.2em` uppercase |

**Regra:** nunca usar mais de 2 weights na mesma tela.

---

## Grafismos auxiliares

### Dot pattern
```
background-image: radial-gradient(#8b5cf6 1.5px, transparent 1.5px);
background-size: 24px 24px;
opacity: 0.06;
```
Uso: fundo do hero e seções de destaque. Opacidade sempre ≤ 0.06.

### Hard shadow
```
box-shadow: 4px 4px 0 rgba(139, 92, 246, 0.35);
```
Uso: botões CTA, cards especiais, seção "O problema". Herdado da Zero Tropical.

### Formas abstratas
Círculos com `blur-3xl` e bordas rotacionadas (`rotate-12`, `rotate-45`)
com `border-primary/20`. Uso: hero, transições entre seções.

### Accent bar
```
h-0.5 bg-gradient-to-r from-primary to-purple-500
```
Uso: topo de cards no hover. Sutil, aparece só na interação.

---

## Componentes

### Cards padrão
```
bg-white/[0.04] border border-white/5 rounded-xl
hover:border-primary/30 hover:-translate-y-1
transition-all duration-300
```

### Botão primário
```
bg-primary text-white font-black rounded-xl
hover:bg-primary-dark hover:-translate-y-0.5
transition-all
```
Com hard shadow: `box-shadow: 4px 4px 0 rgba(76, 29, 149, 1);`

### Botão outline
```
border border-white/10 text-secondary
hover:border-primary/30 hover:text-primary
```

### Badge / tag
```
text-[10px] font-bold uppercase tracking-wider
px-3 py-1 rounded border
```
Cores variam por significado (verde, âmbar, vermelho, violeta).

---

## Tom de voz

| ✅ Usar | ❌ Evitar |
|---|---|
| Direto, prático | Jargão corporativo |
| "base sólida", "adaptável" | "perene", "fôrma", "disruptivo" |
| "pronto para usar" | "solução inovadora" |
| "sem surpresas" | "revolucionário" |

O Educlick comunica como um **parceiro técnico confiável**, não como
uma startup tentando impressionar investidor.

---

## Arquivos de referência

| Arquivo | Descrição |
|---|---|
| `front_end/public/educlick_logo.png` | Logo oficial |
| `front_end/app/assets/css/style.css` | Tokens CSS (variáveis) |
| `front_end/tailwind.config.ts` | Mapeamento Tailwind → tokens |
| `documentacao/paginas/landing_page/educlick_produto/texto_referencia.md` | Copy da landing page |
| `documentacao/paginas/landing_page/educlick_produto/referencia_visual.html` | Referência visual Zero Tropical |
