# Guia — Tema Claro/Escuro no EduClick (padrão de refatoração)

> **Status:** Documentação de padrão — para refatorar páginas/modais que ainda usam cores escuro hardcoded.
> **Objetivo:** um guia prático com tudo que aprendemos aplicando o tema claro para que qualquer página/modal fique correta no claro e no escuro, de forma consistente.

---

## 1. O princípio central

**O app encara o "modo claro quebrado" como problema de cores hardcoded, não de tokens.**

- Componentes que usam **tokens/variáveis** (`bg-div-15`, `text-text`, `text-secondary`, `bg-background`, `var(--field-*)`) **já seguem o tema** automaticamente (claro/escuro).
- Páginas/modais que usam **`rgba(255,255,255,…)`, `text-white`, `bg-white/*`, `bg-[#…]`, `border-white/*`** ou **`<style scoped>` com cores escuras fixas** quebram no claro (texto/invisível, fundo apagado, sem moldura).

> Regra de ouro: **sempre usar tokens.** Nunca `rgba(255,255,255,*)`/`text-white`/`bg-white/*`/cores hex escuras fixas em elemento que deve seguir o fundo/texto do tema.

---

## 2. Tokens disponíveis (tema)

Todos vivem em `front_end/app/assets/css/style.css`. O tema é ativado por `data-theme="dark"` | `"light"` no `<html>` (controlado pelo store `toggleTheme`/`initTheme`).

| Token | Uso | Escuro | Claro |
|---|---|---|---|
| `--color-background` | fundo da página | `#0a0a0c` | `#e7e9ee` |
| `--color-text` | texto principal | `#e8e6e8` | `#1f2430` |
| `--color-secondary` | texto secundário/labels | `#8c878d` | `#5b6472` |
| `--color-secondary-surface` | superfície (cards/`div-15`) | translúcido | `#f1f3f6` |
| `--color-secondary-surface-hover` | hover de superfície (`div-30`) | — | `#e9ecf1` |
| `--color-primary` / `--primary-hover` | cor de marca (pode vir do branding) | — | — |
| `--color-divider` | borda/moldura (footer, cards) | `rgba(255,255,255,0.08)` | `rgba(31,36,48,0.20)` |
| `--field-bg` | fundo de input/textarea | translúcido escuro | `#f9fafb` |
| `--field-bg-select` / `--field-bg-option` | fundo de select/options | — | `#fff` |
| `--field-border` | borda de campo/modal | translúcido | `rgba(31,36,48,0.14)` |
| `--field-border-focus` | borda em foco | — | `rgba(139,92,246,0.55)` |
| `--field-text` | texto de campo | claro | `rgba(31,36,48,0.92)` |
| `--field-placeholder` | placeholder | — | — |

**⚠️ CASCATA IMPORTANTE:** o bloco `[data-theme="light"]` **deve ficar no FINAL do `style.css`**, DEPOIS de todos os `:root`. Como `[data-theme]` e `:root` têm a mesma especificidade, quem vem por último vence. Se o tema claro vier antes de um `:root` que redefine `--field-*`, os campos voltam a texto claro. (Bug corrigido ao mover o `[data-theme="light"]` para o fim.)

---

## 3. Classes globais do design system (`.ds-*`)

Vivem no `style.css` e são **theme-aware**. Usar em vez de `<style scoped>` com cores fixas.

| Classe | Uso |
|---|---|
| `.ds-card` / `.ds-card-inner` | Card com superfície + borda + hover |
| `.ds-avatar` | Inicial do card (cor primária) |
| `.ds-name` / `.ds-desc` | Título / descrição do card |
| `.ds-tabs-nav` / `.ds-tab-btn` / `.ds-tab-btn--active` | Navegação por abas |
| `.ds-btn-primary` | Botão principal (gradiente) |
| `.ds-empty` | Empty state |
| `.ds-modal-overlay` / `.ds-modal-panel` / `.ds-modal-accent-bar` / `.ds-modal-header` / `.ds-modal-header-icon` / `.ds-modal-title` / `.ds-modal-subtitle` / `.ds-modal-close-btn` / `.ds-modal-footer` / `.ds-btn-cancel` / `.ds-btn-save` | Modal padrão |

**Cards pequenos de lista** (não o card grande de grid): usar `bg-div-15 border border-divider` + `hover:border-primary/30`.

---

## 4. Componentes globais de campo (`BaseField` e `BaseSelect`)

- **`BaseField`** (`front_end/app/components/global/BaseField.vue`) — campo padrão theme-aware.
  - Props: `v-model`, `label`, `required`, `optional`, `type` ("input" default | "textarea" | "select" | "display" | tipos nativos como "date"/"time"/"number"/"datetime-local").
  - Herda `$attrs` (placeholder, `@blur`, `@keyup.enter`, `:disabled`).
  - `type="display"` → bloco readonly/calculado (cor primária, cursor not-allowed) — útil p/ "carga horária total".
  - **Limitação:** `type="select"` não tem placeholder/empty-option (ver dívida).
- **`BaseSelect`** — dropdown custom (searchable). Não converter para `BaseField` select.

---

## 5. Checklist de conversão de uma página/modal

1. **Template — trocar utilitários escuros por tokens/`.ds-*`:**
   - `text-white/*` → `text-text` | `text-secondary/*`
   - `bg-white/*` / `bg-[#0f0f15]` / `bg-[#16161E]` → `bg-div-15` | `bg-background`
   - `border-white/*` → `border-secondary/10` | `border-divider`
   - `bg-div-10` (**não existe!**) → `bg-div-15`
   - Botão criar/`add-btn` → `ds-btn-primary`
   - Tabs (`tabs-nav`/`tab-btn`/`tab-btn--active`) → `ds-tabs-nav`/`ds-tab-btn`/`ds-tab-btn--active`
   - Empty (`empty-state`) → `ds-empty`; `text-white/30` → `text-secondary/60`; `text-white/15` → `text-secondary/40`
   - Modal (`modal-overlay`/`modal-panel`/`modal-header`/…) → `ds-modal-*`
   - Card (`X-card`/`X-name`/`X-avatar`/`X-desc`) → `ds-card`/`ds-name`/`ds-avatar`/`ds-desc`
   - Input/textarea/select manual de formulário → `BaseField`

2. **`<style scoped>` — reduzir ao mínimo:**
   - Remova tudo que virou `.ds-*` (card, avatar, name, desc, add-btn, empty, primitivas de modal, keyframes).
   - Mantenha apenas o específico (accent-bar, badges de status, grids/tabelas complexos), sempre com `var(--color-*)`.
   - Nunca deixe `rgba(255,255,255,*)` fixo em elemento que segue o tema.

3. **Cores semânticas (podem ficar):**
   - Verde sucesso `#34d399/#4ade80`, âmbar `#fbbf24`, vermelho erro `#f87171`, azul `#38bdf8` — são estados, mantêm nos dois temas.
   - Botões primários (gradiente violeta) mantêm `color:#fff`.

4. **Inline styles em componentes globais** (ex.: `RichTextEditor`) — trocar os `rgba(255,255,255,*)` inline por `var(--field-*)`.

5. **Contadores e labels de meta-info** — usar `text-secondary/50` (não `/30`).
   - `text-secondary/30` quase desaparece no claro (`#5b6472` a 30% = ~3:1 de contraste sobre `#e7e9ee`).
   - Padrão aprovado: `text-secondary/50` para counters (`"N item(s)"`), `text-secondary/60` para empty state text.
   - O spinner "Carregando..." também segue este padrão.

6. **Badges de card com `color: #c4b5fd` fixo** — substituir por `color: var(--color-primary)`.
   - `#c4b5fd` (violet-300) sobre `#f1f3f6` fica abaixo de 3:1 de contraste no claro.
   - Badges semânticos de status (gratuito/pago/seleção) usam cores absolutas (verde/âmbar/azul) — essas **podem ficar**.
   - Badges de contexto (área, categoria) devem usar `color: var(--color-primary)` + `background: rgba(139,92,246,0.08)` + `border: 1px solid rgba(139,92,246,0.2)`.
   - Badges neutros (count de módulos, componentes): `color: var(--color-secondary)` + `background: var(--color-secondary-surface)` + `border: 1px solid var(--color-divider)`.

---

## 6. Modal `RichTextEditor` (já corrigido)

O `RichTextEditor` global tinha inline `rgba(255,255,255,…)` → trocado por `var(--field-bg)`/`var(--field-border)`/`var(--field-text)`. Usar sempre o componente global, não duplicar.

---

## 7. Header dos layouts (base e wide)

Ambos os layouts autenticados (`base.vue`, `wide.vue`) devem ter no header: **toggle de tema** (sol/lua), **botão de sair**, **menu**. Bordas do header/footer → `border-divider`. Ambos devem ter o **gate de produto** (`sem_acesso` → aviso + deslogar).

---

## 7b. Tema padrão por entidade (item 2 das dívidas)

Cada entidade (`user_entidades.tema`) define o tema padrão (`dark` | `light`) para quem entra naquele domínio. Implementado via migrations `20260822090000_entidade_tema.sql` e `20260822090100_rpc_entidade_tema.sql` + `aplicarTemaDaEntidade` no store.

- Precedência: **escolha manual do usuário (`localStorage.theme`) > tema da entidade > default `dark`**.
- O toggle grava `localStorage.theme`; a partir daí o tema manual prevalece sobre a entidade.
- Dev/localhost: `EDUCLICK_FALLBACK_ENTIDADE_ID` no `.env` decide qual entidade renderiza; para validar outra entidade (ex.: ENSI com `light`), mude esse ID e limpe `localStorage.theme`.
- Ver também seção 16 do `design_system.md`.

---

## 8. Status dos módulos

### ✅ Concluídos (sem hardcoded)
- `/academico_oferta` — referência de conversão (tabs, contadores e badges refinados)
- `/formularios` — referência de conversão (`FormulariosTabPerguntas` e `FormulariosTabConfiguracoes` com tokens)
- `/meus-processos` — equalizado em 2026-08-26 (paginação e badges com `var(--color-primary)`)
- `/processos` — totalmente convertido em 2026-08-26 (`ProcessosTabInscritos`, `ProcessosModalAvaliar`, `ProcessosModalDetalhes` e página principal)
- `/matriculas` — totalmente convertido em 2026-08-26 (`MatriculasList`, `MatriculasModalDetalhes`, modal inativar e página principal)
- `/docentes` — totalmente convertido em 2026-08-26 (`DocentesTabDocentes`, `DocentesTabCurriculos`, `DocentesTabEditais`, `DocentesTabSelecao`, `ModalDocente`, `ModalEdital`, `ModalVinculosDocente`, `ModalAvaliarCandidato` e página principal)
- `/academico_calendario` — totalmente convertido em 2026-08-26 (`CalendarioTabFeriados`, `CalendarioTabEventos`, `CalendarioTabCalendario`, `ModalFeriado`, `ModalEvento` e página principal; normatização do Padrão de Calendário/Timeline)
- `/calendario-salas` — totalmente convertido em 2026-08-26 (`CalendarioGrid`, `CalendarioSalasTabSalas`, `CalendarioSalasTabHorarios`, `ModalReservaSala` e página principal; normatização da Matriz de Reserva no Design System)
- `/atribuicao` — totalmente convertido em 2026-08-26 (`AtribuicaoPage`, `AtribuicaoCicloCard`, `ModalAtribuirDocente` e página principal; normatização da Seção 18 do Design System)
- `/programacao_atividades` & `/portal-docente/entregas` — totalmente convertidos em 2026-08-26 (`ProgAtividadesTab*`, `ConteudoRow`, `DocenteEntregas*`, `DocenteCorrecao`, `UploadArquivo`, `UploadMini`, `ModalProgAtividades*` e páginas principais; normatização da Seção 19 do Design System)
- `/produtos` — totalmente convertido em 2026-08-26 (`ProdutosTabLista`, `ModalProduto`, `ModalOferta` e página principal; normatização da Seção 20 do Design System)
- `/configuracoes/pagamento` — totalmente convertido em 2026-08-26 (`ConfigGatewayStatus` e página principal; normatização da Seção 21 do Design System)
- `/meus-cursos` — totalmente convertido em 2026-08-26 (Portal do Aluno, Cards de cursos adquiridos e status de matrícula; normatização da Seção 22 do Design System)
- `/minhas_atividades` — totalmente convertido em 2026-08-26 (LMS do Aluno, `MinhasAtividadesPage`, `ConteudoArvore`, `ConteudoLista`, `ConteudoLinha`, `ConteudoMaterial`, `ConteudoAtividade`, `ConteudoAvaliacao`, `MinhasAtividadesSidebar`, `VisaoToggle` e página principal; normatização da Seção 23 do Design System)

### ❌ Pendentes (não convertidos)
- _(nenhum — `/checkout` foi tokenizado e as landings públicas foram fixadas em `data-theme="dark"`)_. Restam apenas detalhes da dívida #2 (violeta fixo em hovers/badges) e o tema da entidade no auth (dívida #1).

Aplicar: mesmo checklist da seção 5 acima.

---

## 8b. Dívidas registradas (não resolvidas aqui)

1. ~~**Tema da entidade nas páginas auth (login/cadastro/recuperar/trocar).**~~ **✅ RESOLVIDA (2026-08-26).** As 4 páginas auth agora resolvem a entidade pelo domínio via BFF (`/api/entidade/dominio` → RPC `SECURITY DEFINER`) e aplicam o tema + branding, respeitando `localStorage.theme`. Criado `composable/useTemaEntidade` (`aplicarTemaDaEntidadePublica`) e endpoint BFF `server/api/entidade/dominio.get.ts` (suporta override de dev via `EDUCLICK_FALLBACK_ENTIDADE_ID` no localhost).
2. **Cor primária fixa espalhada (`rgba(139,92,246,*)`, `#7c3aed`, `#a78bfa`).** Ainda há violeta fixo inline em alguns pontos (principalmente hovers/badges/form cards de `academico_oferta/*` e `programacao_atividades/*`, ex.: `.action-edit:hover`, `.prog-step`, `.prog-badge`, `.area-form-card`). Esses **não acompanham o branding** — na ensi (laranja) aparecem tons violeta/marrom. Regra: substituir por `var(--color-primary)`/`color-mix`. **Já resolvidos nesta rodada:** botões primários (`.ds-btn-primary`, `.ds-btn-save`, `.open-btn`, `.btn-submit`, `.btn-iniciar`, `.btn-finalizar`, `.add-btn`, `.action-btn-primary`, `.pag-num--active`) e as accent bars de todos os módulos — tudo agora **sólido** em `var(--color-primary)`.
3. **Botões/barras sólidos em vez de gradiente (decisão de design).** Em algumas cores de marca (ex.: laranja da ensi) o gradiente fica ruim. Por decisão do usuário: todos os botões primários e accent bars passaram a ser **sólidos** em `var(--color-primary)` (repouso) e `var(--color-primary-hover)` (hover), em todos os módulos.

---

## 9. Histórico de revisão

| Data | Descrição |
|---|---|
| 2026-08-21 | Criado a partir do processo de refatoração de `academico_oferta` e `formularios` para tema claro |
| 2026-08-26 | Análise completa de todos os módulos; `/meus-processos` concluído (paginação corrigida) |
| 2026-08-26 | Refinamentos em `academico_oferta`: contadores `/30`→`/50` em todos os 6 tabs; badges sem CSS agora têm estilos com tokens; regras adicionadas ao checklist (itens 5 e 6) |
| 2026-08-26 | Equalização completa de `/formularios` e `/meus-processos`; conversão total de `/processos` e `/matriculas` para o padrão dual-theme |
| 2026-08-26 | Conversão integral do módulo `/docentes` (todas as 4 abas e 4 modais) utilizando a estrutura `.ds-modal-*`, `ds-tabs-nav` e `BaseField` |
| 2026-08-26 | Conversão do módulo `/academico_calendario` (Timeline, Grade Mensal/Semanal e Modais); criado o Padrão de Calendários & Timelines na Seção 17 do Design System |
| 2026-08-26 | Conversão do módulo `/calendario-salas` (Matriz Grid, Abas de Salas/Horários e Modal de Reserva); adicionada subseção da Matriz de Reserva na Seção 17 do Design System |
| 2026-08-26 | Conversão do módulo `/atribuicao` (Cards de Ciclos/Componentes, Badges por papel e Modal de Atribuição); adicionada Seção 18 ao Design System |
| 2026-08-26 | Conversão do módulo `/programacao_atividades` e `/portal-docente/entregas` (Repositório, Distribuição, Currículo, Modais de Construtor e Gabarito de Correção Docente); adicionada Seção 19 ao Design System |
| 2026-08-26 | Conversão do módulo `/produtos` (Hierarquia de Programa, Produto, Oferta, ModalProduto e ModalOferta); adicionada Seção 20 ao Design System |
| 2026-08-26 | Conversão do módulo `/configuracoes/pagamento` (Status Gateway Stripe e aviso de retorno); adicionada Seção 21 ao Design System |
| 2026-08-26 | Conversão do módulo `/meus-cursos` (Cards de cursos adquiridos no Portal do Aluno); adicionada Seção 22 ao Design System |
| 2026-08-26 | Conversão do módulo `/minhas_atividades` (LMS do Aluno, Player de Materiais, Atividades e Avaliações); adicionada Seção 23 ao Design System |
| 2026-08-26 | Tema padrão por entidade (item 2): coluna `user_entidades.tema`, RPCs retornando `tema`, store `aplicarTemaDaEntidade`, gate de produto estendido ao layout `wide` (consistência com `base`) |
| 2026-08-26 | Botões globais (`.ds-btn-primary`/`.ds-btn-save`) e detalhes de marca derivando de `var(--color-primary)`; `/checkout` e páginas auth (login/cadastro/recuperar/trocar) dual-theme; accent bars das abas de `academico_oferta` passam a derivar da marca; registradas dívidas (tema da entidade no auth, cor primária fixa espalhada, laranja em fundo escuro) |
| 2026-08-26 | Decisão: botões primários e accent bars **sólidos** em `var(--color-primary)` (gradiente removido) em todos os módulos (`academico_oferta`, `atribuicao`, `calendario`, `calendario-salas`, `formularios`, `matriculas`, `minhas_atividades`, `meus-processos`, `processos`, `produtos`, `programacao_atividades`, `oferta`, `trabalhe-conosco`, etc.); abas ativas sólidas; `/checkout` tokenizado + landings públicas fixadas em escuro; atualizada dívida #2 (restam `rgba(139,92,246,*)` de hovers/badges) |
| 2026-08-26 | Segurança da resolução de entidade: `app_resolver_entidade_por_dominio` e nova `app_resolver_entidade_por_id` viram **SECURITY DEFINER** chamadas **via BFF** (grant só `service_role`; removido `anon`/`authenticated`). `me.ts` não usa mais query direta (usa a RPC por id no bypass de dev). **A policy de leitura de `user_entidades` foi mantida pública** (outras RPCs INVOKER leem a tabela). Acordo `servidor_ssr_bff.md` §5.2. |
| 2026-08-26 | **Auth segue tema da entidade (dívida #1 resolvida):** endpoint BFF `server/api/entidade/dominio.get.ts` + `composable/useTemaEntidade`. As 4 páginas auth (login/cadastro/recuperar/trocar) aplicam o tema/branding da entidade pelo domínio (com override de dev por `EDUCLICK_FALLBACK_ENTIDADE_ID`), respeitando `localStorage.theme`. Landing pages continuam fixadas em escuro (decisão de design). |
| 2026-08-26 | **Oferta pública segue o tema + logo da entidade:** endpoint `/api/entidade/dominio` aceita `?id=`; `useTemaEntidade` passou a aceitar `id`, retorna entidade reativa e expõe `entidadePublica` (branding/logo). `oferta.vue` aplica tema + logo (aberto/fechado) via `useTemaEntidade(idEntidade)` e foi tokenizada (tokens, sem branco fixo). |








