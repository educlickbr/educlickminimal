# Padrão do Dashboard do Portal Docente — Recriação (`/portal-docente/entregas`)

> **Propósito:** documentar **exatamente** a **dashboard** (quadrante direito / `#sidebar`) da página de entregas do docente — intro, instruções e **resumo com barra de progresso** da correção. Para o agente do outro lado recriar fiel.
>
> **Componente:** `DocenteEntregasSidebar.vue` — renderizado no `#sidebar` do layout por `pages/portal-docente/entregas.vue`.

---

## 1. O que é

```
┌───────────────────────────────┐
│ 👥 Portal Docente             │  ← intro
│ Corrija as entregas das       │
│ atividades/avaliações. Você   │
│ corrige o que criou; do       │
│ programa que leciona é 🔒.    │
│                               │
│ 💡 Como funciona              │  ← instruções
│ • Conteúdos — com entregas    │
│ • Aluno — resposta + gabarito │
│ • Correção — nota + coment.   │
│ • 🔒 Somente leitura          │
│                               │
│ 📊 Resumo                     │  ← contadores + progresso
│ ◉ Conteúdos com entregas  (7) │
│ 🟡 Entregas pendentes     (9) │
│ 🟢 Corrigidas             (6) │
│ ▓▓▓▓▓▓░░░░ 40%               │  ← barra de progresso
│ 40% das entregas corrigidas   │
└───────────────────────────────┘
```

---

## 2. Cards e o que cada um faz

### 2.1 Portal Docente (intro — informativo)

```html
<p class="dash-text">Corrija as entregas das atividades e avaliações.
Você corrige o que criou; conteúdos dos programas que leciona
aparecem em modo somente leitura.</p>
```

### 2.2 Como funciona (instruções)

```html
<li><b>Conteúdos</b> — atividades/avaliações com entregas; pendentes primeiro.</li>
<li><b>Aluno</b> — clique na entrega e veja a resposta (e o gabarito, em avaliações).</li>
<li><b>Correção</b> — nota + comentário. Só o criador do conteúdo corrige.</li>
<li>🔒 <b>Somente leitura</b> — conteúdos do programa que você leciona, sem nota.</li>
```

### 2.3 Resumo (contadores + barra de progresso) ⭐

```html
<div class="dash-linha"><span class="dash-dot dash-dot--conteudo" /> Conteúdos com entregas
  <span class="dash-count">{{ ctx.resumo.value.conteudos }}</span></div>
<div class="dash-linha"><span class="dash-dot dash-dot--pend" /> Entregas pendentes
  <span class="dash-count">{{ ctx.resumo.value.pendentes }}</span></div>
<div class="dash-linha"><span class="dash-dot dash-dot--ok" /> Corrigidas
  <span class="dash-count">{{ ctx.resumo.value.corrigidas }}</span></div>

<div class="dash-progress">
  <div class="dash-progress-bar" :style="{ width: pctCorrigido + '%' }" />
</div>
<span class="dash-obs">{{ pctCorrigido }}% das entregas corrigidas</span>
```

- **Dots:** violeta (conteúdo) · âmbar (pendente) · verde (corrigida).
- **Barra de progresso:** gradiente violeta; largura = `pctCorrigido`.

---

## 3. Dados (composable)

```ts
// resumo (computed)
{
  conteudos:  conteudos.value.length,                              // nº de conteúdos com entregas
  pendentes:  soma(c.qtd_pendentes),                               // entregas sem nota
  corrigidas: soma(c.qtd_corrigidas),                              // entregas com nota
}

// pctCorrigido (computed, no componente da sidebar)
const pctCorrigido = computed(() => {
  const total = resumo.corrigidas + resumo.pendentes;
  if (total === 0) return 0;
  return Math.round((resumo.corrigidas / total) * 100);
});
```

> Os contadores vêm da RPC `lms_list_conteudos_entregas_docente` (`qtd_total/qtd_pendentes/qtd_corrigidas` por conteúdo) e são recarregados após cada correção salva.

---

## 4. Estados

| Estado | Renderização |
|---|---|
| Carregando conteúdos | Contadores zerados até o fetch terminar (a sidebar sempre renderiza) |
| Sem entregas | Resumo com zeros e barra em 0% |
| Com entregas | Contadores reais + barra com % |

> Diferente das outras dashboards, esta **não filtra** — é informativa/resumo (os filtros da página ficam nas próprias listas: busca, tipo, só pendentes).

---

## 5. Estilos (tokens)

```css
.dash-card · .dash-title · .dash-text · .dash-list   /* padrão comum das dashboards */
.dash-linha (linha com dot + label + contador)
.dash-dot--conteudo (violeta) / --pend (âmbar) / --ok (verde)
.dash-count (pill à direita)
.dash-progress (trilho 4px) · .dash-progress-bar (gradiente violeta, width dinâmico)
.dash-obs (texto do %)
```

---

## 6. Checklist para recriar

- [ ] Intro + Como funciona + Resumo (3 cards).
- [ ] Resumo com 3 linhas (conteúdos / pendentes / corrigidas) e dots coloridos.
- [ ] Barra de progresso com `pctCorrigido` (guarda de divisão por zero).
- [ ] Texto "X% das entregas corrigidas".
- [ ] Contadores alimentados pela RPC de conteúdos com entregas; atualizam após salvar correção.
- [ ] Sem filtros nesta dashboard (informativa).
