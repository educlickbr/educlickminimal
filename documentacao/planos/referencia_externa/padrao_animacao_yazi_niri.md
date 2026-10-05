# Padrão de Animação YAZI/Niri — Recriação ponto a ponto

> **Propósito:** documentar **com detalhe de implementação** como a animação de navegação estilo **YAZI** (gerenciador de arquivos: painéis entram/saem de cena deslizando) e **Niri** (compositor de janelas: transições fluidas) foi aplicada no LMS — para um agente de outro projeto recriar **idêntico**.
>
> **Visual:** os tokens de cor/borda abaixo são do design system local (`bg-secondary-surface`, `border-divider`, `text-text`, `text-secondary/60`…). No outro projeto, **troque pelos tokens locais**; o **mecanismo (estrutura, classes dinâmicas, CSS de transição, gatilhos) deve ser copiado fielmente**.

---

## 1. O conceito

A navegação do LMS usa listas que **recolhem para a esquerda** quando um item é selecionado, abrindo espaço para o detalhe à direita. A versão YAZI/Niri refina isso em **dois comportamentos**:

1. **Recolhimento por largura (YAZI básico)** — a coluna da lista muda de tamanho (`flex-1` ⇄ `w-80`/`w-96`) com `transition-all`, e o painel de detalhe surge ao lado.
2. **Deslizamento de cena (YAZI/Niri avançado)** — além do recolhimento, elementos **deslizam para fora/para dentro** (`translateX`), passando **por cima** do painel adjacente (z-index), como painéis que entram e saem da tela. O detalhe entra **da direita**; ao voltar, ele some **para a direita** enquanto a lista volta **da esquerda** — as duas animações em sincronia (mesma duração e easing).

A regra mental que guia tudo: **o olho deve entender "o que eu tinha à esquerda continua lá e o que abri veio de fora"** — sem movimentos sem sentido (ex.: a lista indo para a esquerda quando deveria só crescer).

---

## 2. Onde está aplicado (mapa)

| Lugar | Componente | Nível | Mecanismo |
|---|---|---|---|
| Currículo (admin) | `ProgAtividadesTabCurriculo.vue` | Básico (largura) | `:class` alternando `flex-1` ⇄ `w-96 flex-shrink-0` + `transition-all duration-300` |
| Distribuição (admin) | `ProgAtividadesTabDistribuicao.vue` | Básico (largura) | `:class` alternando `flex-1` ⇄ `w-80 flex-shrink-0` + `transition-all duration-300` |
| Aluno | `MinhasAtividadesPage.vue` | Simples (instantâneo) | Visão central `hidden lg:flex w-80 flex-shrink-0` quando há conteúdo ativo; transição de "card" entre estados |
| **Portal Docente** | `DocenteEntregasPage.vue` | **Avançado (YAZI/Niri)** | Recolhimento por largura + deslizamento de cena + 2 `<Transition>` de entrada/saída |

> Os níveis **básico** e **avançado** são compatíveis — a coluna do Portal Docente usa o mesmo `transition-all duration-300` do currículo/distribuição, e o deslizamento é um refinamento por cima.

---

## 3. Padrão básico — recolhimento por largura (Currículo / Distribuição)

### Código (padrão exato)

```html
<div class="flex gap-5" style="height: calc(100vh - 220px); min-height: 500px;">
    <!-- Coluna da lista: cresce (sem seleção) ou recolhe (com seleção) -->
    <div
        :class="ctx.selecionado.value ? 'w-80 flex-shrink-0' : 'flex-1'"
        class="flex flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative transition-all duration-300"
    >
        ...lista...
    </div>

    <!-- Painel de detalhe: aparece quando há seleção (irmão da coluna) -->
    <div v-if="ctx.selecionado.value" class="flex-1 ...rounded-2xl...">
        ...detalhe / associação...
    </div>
</div>
```

### Explicação ponto a ponto

1. **Container** `flex gap-5` com **altura fixa** (`height: calc(100vh - 220px)`) — o padrão do projeto para telas de lista+detalhe. O `min-height: 500px` evita esmagar em telas baixas.
2. **A coluna** tem na classe base `transition-all duration-300` — é isso que anima a largura. As classes dinâmicas alternam:
   - **Sem seleção:** `flex-1` → a coluna ocupa toda a largura (a lista em destaque).
   - **Com seleção:** `w-80 flex-shrink-0` (distribuição) ou `w-96 flex-shrink-0` (currículo) → recolhe e o detalhe entra no espaço restante.
3. **Regra crítica:** usar `flex-1` (com `flex-basis: 0%`) na visão cheia e `w-80` na recolhida **não** anima suavemente — `flex-basis` não transiciona bem. Por isso a versão avançada do Portal Docente usa `w-full` (largura explícita) em vez de `flex-1` (ver §4.4). No padrão básico o salto é aceitável porque só há 2 estados.
4. O painel de detalhe é um **irmão** com `v-if` — surge instantaneamente ao lado. (No avançado, ele entra deslizando.)

---

## 4. Padrão avançado — YAZI/Niri no Portal Docente

### 4.1 Anatomia do layout (diagrama de estados)

```
NÍVEL 1 — nada selecionado
[ Coluna de conteúdos (flex / w-full) ]          ← ocupa TUDO

NÍVEL 2 — conteúdo selecionado (clica num conteúdo)
[ Coluna de conteúdos (w-80) ] | [ Grupo: Alunos (flex / w-full) ]
                                      ↑ painel-direita entrou deslizando da direita (60px→0)

NÍVEL 3 — aluno selecionado (clica num aluno)
[ Coluna SOME p/ a esquerda (absolute + translateX -105% + fade) ]
                                  | [ Alunos (w-80) ] | [ Correção (flex-1) ]
                                                       ↑ correcao-in entrou da direita (80px→0)

VOLTAR (nível 3 → 2): correção some p/ a direita (80px) · conteúdos voltam da esquerda (-105%→0)
VOLTAR (nível 2 → 1): grupo de alunos viaja p/ a direita (100%) e some · coluna cresce (w-80→w-full)
```

### 4.2 O que cada elemento faz em cada nível

| Elemento | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|
| **Coluna de conteúdos** | `flex w-full relative z-10` (ocupa tudo) | `hidden lg:flex w-80 flex-shrink-0 relative z-10` (recolhida) | `hidden lg:flex absolute left-0 top-0 bottom-0 z-10 w-80 -translate-x-[105%] opacity-0 pointer-events-none` (fora do fluxo, desliza p/ fora) |
| **Grupo (Alunos + Correção)** | — (v-if false) | `flex gap-5 flex-1 min-w-0` — entrou com `painel-direita` | igual (continua) |
| **Coluna de Alunos** | — | `flex w-full` (ocupa o grupo) | `hidden lg:flex w-80 flex-shrink-0` (recolhida) |
| **Correção** | — | — (v-if false) | `flex-1 flex flex-col min-w-0 ...` — entrou com `correcao-in` |

### 4.3 Template (anotado)

```html
<!-- Container: relative p/ o absolute da coluna; overflow-hidden p/ cortar o slide na borda -->
<div class="relative flex gap-5 overflow-hidden" style="height: calc(100vh - 220px); min-height: 500px;">

    <!-- ① Coluna de conteúdos: SEMPRE no DOM (único elemento, muda de forma) -->
    <div class="flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :class="classesColuna">
        <DocenteConteudosLista :ctx="ctx" />
    </div>

    <!-- ② Grupo alunos+correção: só existe nos níveis 2/3; viaja p/ a direita ao voltar p/ nível 1 -->
    <Transition name="painel-direita">
        <div v-if="ctx.conteudoSelecionado.value" class="flex gap-5 flex-1 min-w-0">

            <!-- ③ Coluna de alunos: mesma técnica da coluna de conteúdos (cresce/encolhe) -->
            <div class="flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                :class="classesAlunos">
                <DocenteEntregasLista :ctx="ctx" />
            </div>

            <!-- ④ Correção: entra/sai da direita -->
            <Transition name="correcao-in">
                <div v-if="ctx.entregaSelecionada.value"
                    class="flex-1 flex flex-col min-w-0 bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative">
                    ...botão Voltar + DocenteCorrecao...
                </div>
            </Transition>
        </div>
    </Transition>
</div>
```

### 4.4 O computed `classesColuna` (explicado linha a linha)

```ts
const classesColuna = computed(() => {
    if (!props.ctx.conteudoSelecionado.value) {
        // NÍVEL 1: cresce para ocupar tudo
        return "flex w-full relative z-10";
    }
    if (props.ctx.entregaSelecionada.value) {
        // NÍVEL 3: sai do fluxo (absolute) e desliza para fora à esquerda
        return "hidden lg:flex absolute left-0 top-0 bottom-0 z-10 w-80 -translate-x-[105%] opacity-0 pointer-events-none";
    }
    // NÍVEL 2: recolhida à esquerda
    return "hidden lg:flex w-80 flex-shrink-0 relative z-10";
});
```

Por que cada parte:

| Peça | Por quê |
|---|---|
| `flex w-full` (nível 1) | **`w-full` e não `flex-1`**: largura explícita (100% → 20rem) **anima suavemente** com `transition-all`. `flex-1` (flex-basis 0%) não transiciona bem. |
| `relative z-10` (níveis 1 e 2) | O `z-10` **mantém a coluna por cima do painel adjacente** enquanto ela desliza — sem isso, ao voltar (3→2) ela deslizaria **por baixo** do painel (invisível). |
| `hidden lg:flex` (níveis 2 e 3) | **Mobile:** a coluna de apoio some; o painel central vira tela cheia. (No nível 1 é `flex` — visível também no mobile, pois é a única tela.) |
| `absolute left-0 top-0 bottom-0` (nível 3) | Sai do **fluxo** — o grupo (alunos+correção) expande para a largura total imediatamente, e a coluna desliza **por cima** (z-10) cobrindo os 320px esquerdos até sumir. O "pulo" do painel fica mascarado. |
| `-translate-x-[105%]` | Desloca **105%** da própria largura para a esquerda (320px + 5% a mais) — garante que a **borda** também saia de cena, não só o corpo. |
| `opacity-0` | Fade junto com o slide. |
| `pointer-events-none` | Enquanto está fora, não intercepta cliques. |
| `transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]` | Na classe **base** (não no computed): anima `width`/`transform`/`opacity` com o easing padrão do padrão (ver §4.6). |

### 4.5 O computed `classesAlunos`

```ts
const classesAlunos = computed(() => {
    if (!props.ctx.entregaSelecionada.value) {
        return "flex w-full";           // NÍVEL 2: ocupa todo o grupo
    }
    return "hidden lg:flex w-80 flex-shrink-0";  // NÍVEL 3: recolhida à esquerda
});
```

Mesma lógica da coluna de conteúdos: **um único elemento** que anima `width` (`w-full` ⇄ `w-80`). É isso que dá o **"mesmo pace"**: quando você clica Voltar (3→2), a coluna de conteúdos volta da esquerda, a coluna de alunos **cresce** e a correção **some à direita** — as três com `0.3s` e o mesmo easing, em sincronia.

### 4.6 CSS das transições (explicado)

```css
/* Grupo alunos+correção: entra da direita (60px) e, ao voltar p/ nível 1, SOME para a direita (100%) */
.painel-direita-enter-active, .painel-direita-leave-active {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.painel-direita-enter-from { transform: translateX(60px); opacity: 0; }
.painel-direita-leave-to   { transform: translateX(100%); opacity: 0; }

/* Correção: entra da direita (80px) e some para a direita (80px) ao voltar */
.correcao-in-enter-active, .correcao-in-leave-active {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.correcao-in-enter-from { transform: translateX(80px); opacity: 0; }
.correcao-in-leave-to   { transform: translateX(80px); opacity: 0; }
```

| Constante | Valor | Por quê |
|---|---|---|
| Duração | `0.3s` | Rápido o suficiente para não atrasar o fluxo, lento o bastante para ser percebido. **Igual em tudo** — sincronia. |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` | "expo out" suave — começa rápido e desacelera. É o mesmo usado no menu e no `transition-all` das colunas. |
| `enter-from` do grupo | `60px` | Deslocamento **sutil** — o grupo vem de um pouco à direita, não de fora da tela. |
| `leave-to` do grupo | `100%` | Ao voltar para o nível 1, o grupo **viaja para a direita e some** (o "devolver a tela ao menu"). |
| `enter-from`/`leave-to` da correção | `80px` | A correção desliza da direita ao abrir e **some para a direita** ao voltar (o "cancelar devolve"). |

> O `name` do `<Transition>` precisa casar com o prefixo das classes CSS (`painel-direita-*`, `correcao-in-*`). Sem `mode="out-in"` — as animações acontecem **simultâneas** (elementos irmãos).

### 4.7 Por que `overflow-hidden` no container

Sem ele, a coluna em `-translate-x-[105%]` vazaria 320px+ para a esquerda (criando scroll horizontal ou sobrepondo o header/sidebar). Com `overflow-hidden`, ela é **cortada na borda esquerda** — o efeito "desliza para fora da tela".

### 4.8 Mobile

- A coluna de conteúdos no nível 1 é `flex` (visível); nos níveis 2/3 é `hidden lg:flex` → **some no mobile**, e o painel central (alunos/correção) ocupa tudo.
- A coluna de alunos é `hidden lg:flex` no nível 3 → no mobile só a correção, com o botão **Voltar** no topo do quadro.
- As animações de transform não aparecem no mobile (elementos `display:none`) — sem efeito estranho, só os painéis que aparecem/somem com o `painel-direita`.

### 4.9 Gatilhos (o que muda de nível)

São funções do composable que alternam as refs observadas pelos `computed`:

| Função | Efeito | Transição disparada |
|---|---|---|
| `selecionarConteudo(c)` | `conteudoSelecionado = c` | Grupo entra (`painel-direita` enter); coluna encolhe `w-full→w-80` |
| `voltarParaConteudos()` | `conteudoSelecionado = null` | Grupo some p/ direita (`painel-direita` leave); coluna cresce `w-80→w-full` |
| `selecionarEntrega(e)` | `entregaSelecionada = e` | Correção entra (`correcao-in` enter); coluna de conteúdos desliza p/ fora (`absolute` + translateX); alunos encolhem `w-full→w-80` |
| `voltarParaEntregas()` | `entregaSelecionada = null` | Correção some p/ direita; coluna de conteúdos volta da esquerda; alunos crescem `w-80→w-full` |

> **Ponto-chave da escolha de design:** o slide para a esquerda da coluna de conteúdos acontece **somente** no nível 2→3 (abrir correção). No 2→1 (voltar aos conteúdos) a coluna **só cresce** (largura) — nunca viaja. Foi essa distinção que eliminou o "movimento sem sentido" (a coluna indo para a esquerda e voltando).

### 4.10 Receita passo a passo para recriar

1. Monte o container `relative flex gap-5 overflow-hidden` com altura fixa.
2. Coluna de conteúdos **única**, sempre no DOM, com `transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]` na base e o computed de 3 estados (§4.4).
3. Grupo com `<Transition name="painel-direita">` + `v-if` do conteúdo selecionado; dentro dele a coluna de alunos (computed de 2 estados, §4.5) e a correção com `<Transition name="correcao-in">`.
4. Cole o CSS das duas transições (§4.6) no `<style scoped>`.
5. Ligue os gatilhos às funções do composable (§4.9).
6. Teste as 4 transições (2→1, 1→2, 2→3, 3→2) e confira a sincronia (mesmo 0.3s/easing).

---

## 5. Padrão do aluno (visão central)

`MinhasAtividadesPage.vue` usa o **recolhimento simples**: com conteúdo ativo, a visão central (árvore/resumo) vira `hidden lg:flex w-80 flex-shrink-0` (desktop) e o conteúdo abre no centro; a transição entre "sem programa" ⇄ "com programa" usa `<Transition name="card-enter">` (fade + scale). Não tem `transition-all` de largura nem deslizamento — é o degrau mais simples do padrão. Para evoluí-lo ao nível YAZI/Niri, aplicar a receita do §4 (coluna única + `w-full` ⇄ `w-80` + transições de entrada do conteúdo).

---

## 6. Regras gerais e armadilhas

1. **Nunca animar `flex-basis`** — use `w-full` ⇄ `w-80` (larguras explícitas) para transição de largura suave.
2. **A mesma duração e easing em todas as animações da mesma transição** — é isso que cria a sincronia ("mesmo pace").
3. **`z-10` na coluna que desliza** — para passar **por cima** do painel adjacente (senão desliza por baixo, invisível).
4. **`overflow-hidden` no container** — para o slide para fora não vazar a tela.
5. **Slide para a esquerda só quando o elemento vai sair de cena de verdade** — no "voltar", prefira crescer a largura em vez de viajar (movimento sem sentido confunde).
6. **`<Transition name>` sem `mode="out-in"`** para animações simultâneas de irmãos.
7. **Mobile:** as colunas de apoio são `hidden lg:flex` — sempre deixar o painel principal em tela cheia com um botão de voltar.
8. **Teste as 4 direções** de cada transição (abrir/fechar × dois níveis) — cada uma deve ter uma "história" visual coerente.
