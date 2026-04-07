---
description: Padrão obrigatório de Design System UI — EduClick
---

# 🎨 Design System — EduClick UI

Este documento define o padrão visual obrigatório para **todos os componentes e páginas** do projeto EduClick.  
Sempre que criar ou editar um componente de UI, siga estas regras.

---

## 🎨 Cor Principal

- **Primária:** Violet/Purple `#8b5cf6` (disponível via `var(--color-primary)` e `bg-primary` no Tailwind)
- **Dark background da página:** `#13131a` (`var(--color-background)` no tema dark)

---

## 🪟 Padrão de Modais

Todo modal deve seguir esta estrutura e estas classes:

```html
<div class="modal-overlay" @click.self="fechar">
  <div class="modal-panel">               <!-- fundo = var(--color-background) -->
    <div class="modal-accent-bar"></div>  <!-- barra violeta no topo -->
    <div class="modal-header">
      <div class="modal-header-icon"><!-- SVG --></div>
      <div class="modal-header-text">
        <h3 class="modal-title">Título</h3>
        <p class="modal-subtitle">Subtítulo</p>
      </div>
      <button class="modal-close-btn">&times;</button>
    </div>
    <!-- conteúdo scrollável -->
    <div class="modal-body">...</div>
    <!-- rodapé com ações -->
    <div class="modal-footer">
      <button class="modal-btn-cancel">Cancelar</button>
      <button class="modal-btn-save">Salvar</button>
    </div>
  </div>
</div>
```

### Hierarquia de camadas no modal

| Camada | Cor | Propósito |
|---|---|---|
| Overlay (fora) | `rgba(0,0,0,0.85)` | Tela escurecida ao redor |
| Modal panel | `var(--color-background)` = `#13131a` | **Mesmo tom da tela** |
| Accent bar (topo) | Gradiente `#7c3aed → #a78bfa` | 3px de destaque violeta |
| Campos de formulário | `rgba(255,255,255,0.04)` | Superfície elevada, tom dos cards |

### CSS de referência para o `<style scoped>`

```css
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.85);
  padding: 16px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

.modal-panel {
  position: relative;
  background: #13131a;                      /* = var(--color-background) */
  border: 1px solid rgba(139,92,246,0.18);
  border-radius: 16px;
  width: 100%; max-width: 680px;
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1);
  animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1);
}
.modal-panel--lg { max-width: 960px; max-height: 92vh; }
@keyframes slideUp {
  from { opacity:0; transform: translateY(16px) scale(0.98) }
  to   { opacity:1; transform: translateY(0) scale(1) }
}
.modal-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
  flex-shrink: 0;
}
.modal-header {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.modal-header-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(139,92,246,0.12);
  border: 1px solid rgba(139,92,246,0.2);
  color: #a78bfa;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.modal-title {
  font-size: 14px; font-weight: 900; color: #c4b5fd;
  text-transform: uppercase; letter-spacing: 0.15em;
}
.modal-subtitle {
  font-size: 10px; font-weight: 700;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;
}
.modal-close-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: none; background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.4);
  font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s ease;
}
.modal-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.15);
  flex-shrink: 0;
}
.modal-btn-cancel {
  padding: 10px 22px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45);
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s ease;
}
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.modal-btn-save {
  padding: 10px 28px; border-radius: 9px; border: none;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: #fff; font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(139,92,246,0.35);
}
.modal-btn-save:hover { background: linear-gradient(135deg,#6d28d9,#7c3aed); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
```

---

## 📋 Padrão de Cards de Lista

Todo card de item em lista usa este padrão (classe `.comp-card`):

- **Fundo:** `rgba(255,255,255,0.025)` — mesmo tom da superfície da interface
- **Hover:** border violet sutil + translateX(2px)
- **Accent bar:** linha violeta à esquerda animada no hover
- **Avatar:** initial da letra, fundo violet/10
- **Ações (editar/excluir):** aparecem apenas no hover (opacity 0 → 1)

---

## 📝 Padrão de Campos de Formulário (GLOBAL)

> **Esta regra já está aplicada globalmente em `style.css` — não é necessário adicionar nenhuma classe.**

Todo `<input>`, `<select>` e `<textarea>` do projeto **herda automaticamente**:

| Estado | Background | Borda |
|---|---|---|
| Idle | `rgba(255,255,255,0.04)` — superfície dos cards | `rgba(255,255,255,0.07)` |
| Hover | `rgba(139,92,246,0.08)` — tinte violet | mantém |
| Focus | mantém | `rgba(139,92,246,0.45)` + glow |
| Disabled | opacity 0.45 | — |

**Variáveis CSS** (redefina localmente se precisar variar):
```css
--field-bg:           rgba(255, 255, 255, 0.04);
--field-bg-hover:     rgba(139, 92, 246, 0.08);
--field-border:       rgba(255, 255, 255, 0.07);
--field-border-focus: rgba(139, 92, 246, 0.45);
--field-text:         rgba(232, 230, 240, 0.9);
--field-placeholder:  rgba(255, 255, 255, 0.22);
--field-shadow-focus: 0 0 0 3px rgba(139, 92, 246, 0.10);
```

**Em casos de necessidade de override** (ex: campo em fundo claro), use a classe `.vi-field` que força os mesmos tokens com `!important`.

---

## 🧭 Navegação por Abas (Tab Pills)

```css
/* Container */
.tabs-nav {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 4px;
}
/* Botão inativo */
.tab-btn { padding: 7px 16px; border-radius: 9px; ... color: rgba(255,255,255,0.35); }
/* Botão ativo */
.tab-btn--active { color: #c4b5fd; background: rgba(139,92,246,0.15); }
```

---

## ⚡ Princípios gerais

1. **Nunca usar preto puro** (`#000` ou `#080810`) em fundos visíveis — usar sempre o tom da paleta da interface
2. **Hierarquia de elevação** (mais profundo → mais claro): overlay preto → fundo da tela → modal/card → campos
3. **Cor violeta** é o único acento cromático — evitar outros tons de destaque não aprovados
4. **Modais sem blur** — overlay sólido `rgba(0,0,0,0.85)`, sem `backdrop-filter: blur()`
5. **Ações em hover** — botões de editar/deletar ficam ocultos e aparecem apenas ao passar o mouse
