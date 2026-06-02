# Contrato de UX e Design (Design System) - EduClick

Este documento rege as diretrizes visuais e de interação que devem ser rigorosamente seguidas em toda a plataforma EduClick para garantir consistência, elegância e um visual *premium*, evitando principalmente que estilos "feios" e nativos de cada navegador ou sistema operacional quebrem a harmonia da aplicação.

---

## 1. Componentes de Formulário

### 1.1. Campos de Seleção (Dropdowns / Selects)

É estritamente proibido o uso de `<select>` com o visual nativo do sistema operacional. Para garantir o mesmo design elegante e translúcido em qualquer cenário, todos os selects da plataforma (seja em modais ou formulários de página inteira) devem obedecer à seguinte regra de anulação de estilo (`appearance: none`) e injeção de seta (*caret*) SVG customizada.

#### A) O Problema
Por padrão, ao usar estilização livre via CSS em `<select>`, o navegador (especialmente no Windows/Chrome) injeta uma seta padrão branca no canto colada na borda direita do input, não respeitando margens e prejudicando drasticamente o aspecto premium da aplicação. Além disso, se a propriedade for definida como `background: var(--cor)`, o navegador sobrescreve a seta injetada pelo Tailwind Forms (que usa `background-image`).

#### B) O Padrão (Solução)
1.  **Appearance anulado:** A classe CSS deve contar com `appearance: none` e seus equivalentes `-webkit` e `-moz`.
2.  **Uso de background-color ao invés de background:** Somente declarar `background-color` nos inputs para garantir que qualquer `background-image` injetado via classe utilitária sobreviva.
3.  **Seta Customizada:** Injetar o ícone chevron (`<Icon name="ph:caret-down-bold" />` transformado em base64/SVG) via CSS, na cor tema do sistema, posicionado a exatos `1rem` da margem direita.
4.  **Respiro do Texto:** Aplicar `padding-right: 2.5rem` (equivalente ao `pr-10` do Tailwind) de forma forçada, para impedir que opções com nomes muito grandes fiquem esmagadas atrás da seta.

#### C) Implementação CSS Obrigatória (Referência)
*Pode ser utilizada encapsulada nas diretivas de escopo ou abstraída futuramente como uma classe utilitária do sistema, como `.app-select`.*

```css
select {
  /* Anulação da Seta Feia do Navegador */
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  
  /* Uso estrito de background-color (Nunca usar apenas 'background') */
  background-color: var(--field-bg) !important;
  border-color: var(--field-border) !important;
  color: var(--field-text) !important;
  
  /* Transições premium obrigatórias */
  transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
  
  /* Seta Customizada Chevron-Down em formato SVG (Cor Tema: Roxa #8b5cf6) */
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
  
  /* Posição da seta e proteção do texto */
  background-position: right 1rem center !important;
  background-repeat: no-repeat !important;
  background-size: 1.2em 1.2em !important;
  padding-right: 2.5rem !important;
}

/* Interações (Hover e Focus) */
select:hover {
  background-color: var(--field-bg-hover) !important;
}

select:focus {
  border-color: var(--field-border-focus) !important;
  box-shadow: var(--field-shadow-focus) !important;
  outline: none !important;
}

/* Os options do OS não podem ficar soltos, devem herdar o darkmode */
select option {
  background: var(--field-bg-option) !important;
  color: var(--field-text) !important;
}
```

---

## 2. Estrutura e Arredondamento (Border Radius)

Para manter a fluidez visual e o aspecto *premium*, o arredondamento dos grandes containers do layout deve acompanhar o das abas e dos cards de listagem (repetidores). Isso evita a sensação de "conflito de ângulos" na interface.

### 2.1. Regras de Rounding
- **Layout Principal (Header, Content, Sidebar):** Deve usar obrigatoriamente `rounded-xl` (12px).
- **Abas de Navegação (Pills):** O container externo (`tabs-nav`) deve ter `12px` e os botões internos (`tab-btn`) devem ter `9px` ou `10px` para criar o efeito de encaixe concêntrico.
- **Cards de Repetidores (Listagens):** Todos os cards de itens (Cursos, Módulos, Áreas, etc) devem usar `border-radius: 12px`.
- **Modais:** O container principal do modal deve usar `border-radius: 16px` (`rounded-2xl`) para se destacar visualmente da camada de fundo como um elemento de sobreposição.

### 2.2. Cores de Moldura (Borders)
Para evitar um visual pesado, as molduras do layout e dos cards devem usar tons de branco/cinza com baixa opacidade, ao invés de cores sólidas ou variantes do tema.

- **Padrão:** `rgba(255, 255, 255, 0.05)` a `rgba(255, 255, 255, 0.07)`.
- **Tailwind Alias:** Use `border-white/5` para containers grandes (Layout) e `border-white/10` para estados de hover ou foco leve.

### 2.3. Rodapé (Footer)
O rodapé deve ser discreto, servindo apenas como um fechamento visual da página.
- **Linha Divisora:** `border-t border-white/5`.
- **Texto (Copyright/Versão):** `text-white/20`, fonte em negrito, tamanho extra-pequeno (`text-[9px]`) e em caixa alta (`uppercase`) com espaçamento entre letras (`tracking-widest`).

> [!TIP]
> Use sempre o valor de `12px` (`rounded-xl` no Tailwind) como base para os elementos estruturais da página.

> [!IMPORTANT]
> Nunca misture `rounded-lg` (8px) com `rounded-xl` (12px) no mesmo plano visual de containers grandes. A preferência da EduClick é o visual mais suave do **XL (12px)**.
