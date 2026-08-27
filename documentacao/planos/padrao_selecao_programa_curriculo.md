# Padrão de Seleção de Programa no Currículo — Recriação (dropdown rico)

> **Propósito:** documentar **exatamente** como o **programa é escolhido** no Currículo (admin) para iniciar o processo — o **dropdown rico** no topo, acima da parte central. O agente do outro lado não replicou esse detalhe; aqui está o passo a passo completo.
>
> **⚠️ Importante:** a seleção de programa **não** é um `<select>` nativo — é um **dropdown customizado** (botão + painel flutuante) com **duas linhas por opção** (descrição do programa + curso · ciclos). Ele dispara todo o carregamento do currículo.

---

## 1. O que é

No topo da aba Currículo, acima da área central (árvore + navegador), há um dropdown rico que define **qual programa (turma/oferta)** será gerido:

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┬────┐           │
│  │ Programa 2026.2                             │  ▾ │  ← botão  │
│  │ Curso de Fotografia                         │    │           │
│  └─────────────────────────────────────────────┴────┘           │
│         ▼ (aberto)                                              │
│  ┌─────────────────────────────────────────────────┐            │
│  │ Programa 2026.2 · Curso de Fotografia · 4 ciclo(s)│           │
│  │ Programa 2026.1 · Curso de Fotografia · 4 ciclo(s)│           │
│  │ Programa Marketing 2026.2 · Curso de Marketing · 2  │           │
│  └─────────────────────────────────────────────────┘            │
├──────────────────────────────────────────────────────────────────┤
│  (parte central: árvore + navegador — ver padrao_curriculo_admin)│
└──────────────────────────────────────────────────────────────────┘
```

- **Sem programa selecionado:** o corpo mostra só um aviso central ("Selecione um programa acima") — a árvore **não aparece**.
- **Com programa selecionado:** o corpo renderiza a árvore + navegador; o dropdown exibe o programa atual (título + curso).

---

## 2. Comportamento (passo a passo)

1. **Ao montar a aba** (`onMounted`): `ctx.fetchProgramas()` carrega a lista (spinner dentro do dropdown enquanto carrega).
2. **Clicar no botão** → alterna `aberto` (seta rotaciona `rotate-180`).
3. **Dropdown aberto:**
   - `loadingProgramas` → spinner + "Carregando..."
   - lista vazia → "Nenhum programa encontrado"
   - lista → cada opção: `descricao` (título) + `curso_nome · qtd_ciclos ciclo(s)` (sub); a opção do programa atual fica destacada (`select-option--active`).
4. **Clicar numa opção** → `selecionar(p)`:
   - `ctx.selecionarPrograma(p)` → dispara o carregamento do currículo (ver §4)
   - `aberto = false` (dropdown fecha)
5. **Trocar de programa** a qualquer momento → o estado anterior é limpo (árvore, cache, escopo alvo, filtros) e o novo currículo carrega.

> **Nota (comportamento atual):** o dropdown abre/fecha **apenas pelo clique no botão** — não há handler de "clicar fora para fechar" (pode ser adicionado como melhoria; documentar como comportamento atual).

---

## 3. Dados

### Interface (ProgramaOption)

```ts
interface ProgramaOption {
  id: string;          // id do aca_programa
  descricao: string;   // título do programa (ex.: "Programa 2026.2")
  curso_nome: string;  // nome do curso
  area_nome?: string;  // nome da área (opcional)
  qtd_ciclos: number;  // quantos ciclos o programa tem
}
```

### RPC e BFF

```
GET /api/programacao_atividades/curriculo/programas?id_entidade=X
  → RPC lms_list_programas_para_curriculo(p_id_entidade)
  → { itens: ProgramaOption[] }
```

- A RPC lista os programas da entidade com join do curso (e área) e `COUNT` de ciclos.
- **Fonte dos dados:** `aca_programa` (o "container" comercial do período letivo) + `aca_curso` + `aca_ciclo_programa`.

---

## 4. O que acontece ao selecionar (fluxo completo)

`selecionarPrograma(prog)` no composable:

```ts
async function selecionarPrograma(prog) {
  programaSelecionado.value = prog;          // 1. guarda o programa
  // 2. reseta o estado anterior:
  expandedSections.value = new Set();        //    fecha acordeons
  conteudosMap.value = new Map();            //    limpa cache lazy
  selectedScopeKey.value = null;             //    limpa escopo alvo
  filtroEstado.value = null;                 //    limpa filtros
  loadingEstrutura.value = true;

  // 3. carrega a estrutura + estado dos conteúdos (paralelo):
  const [estruturaRes, ativosRes] = await Promise.all([
    GET /api/programacao_atividades/curriculo?id_programa=X&id_entidade=E,
    GET /api/programacao_atividades/curriculo/ativos?id_programa=X&id_entidade=E,
  ]);
  estrutura.value = estruturaRes;            // árvore: area, componentes, modulos, ciclos, aulas
  // monta ativosMap (id_conteudo → { ativo, op_id, timing })

  // 4. carrega o navegador (conteúdos do repositório com estado):
  await fetchConteudosRepositorio();
  loadingEstrutura.value = false;
}
```

| Passo | O que entrega | Detalhe |
|---|---|---|
| Resets | Estado limpo | Acordeons fechados, cache zerado, escopo alvo nulo, filtros zerados |
| Estrutura | Árvore (casca) | `GET .../curriculo` — escopos sempre presentes (vazios se preciso) |
| Ativos | Mapa de linhas operacionais | `GET .../curriculo/ativos` — para saber o que é herdado/ativo/oculto + timing |
| Navegador | Conteúdos com estado | `GET .../conteudos` (repositório) mesclado com `ativosMap` → radio/toggle/gear |

---

## 5. Estados do dropdown

| Estado | Condição | Renderização |
|---|---|---|
| Fechado, sem seleção | `!aberto && !programaSelecionado` | Botão com placeholder "Selecione um programa..." |
| Fechado, com seleção | `!aberto && programaSelecionado` | Botão com `descricao` + `curso_nome` |
| Aberto, carregando | `aberto && loadingProgramas` | Dropdown com spinner + "Carregando..." |
| Aberto, vazio | `aberto && !loading && programas.length === 0` | "Nenhum programa encontrado" |
| Aberto, com lista | `aberto && programas.length > 0` | Opções com 2 linhas; atual destacada (`--active`) |

---

## 6. Estilos (tokens do design system)

```css
.select-btn        /* botão do dropdown (largura total, campo padrão) */
.select-btn-titulo /* 13px, 800, cor de texto */
.select-btn-sub    /* 10px, 600, cor secundária (curso) */
.select-btn-placeholder
.select-arrow      /* seta; .rotate-180 ao abrir */
.select-dropdown   /* absolute abaixo do botão, z-20, max-height 280px, overflow-y auto,
                      sombra 0 16px 48px rgba(0,0,0,.4), fundo da superfície */
.select-option     /* hover com superfície-hover; --active com rgba(139,92,246,.1) */
.select-option-titulo / .select-option-sub
```

---

## 7. Checklist para recriar

- [ ] Dropdown customizado (botão + painel absoluto) com `min-width: 360px` no topo da aba.
- [ ] Duas linhas: título (descrição) + sub (curso · ciclos); placeholder "Selecione um programa...".
- [ ] `onMounted → fetchProgramas()` (RPC `lms_list_programas_para_curriculo`).
- [ ] Opção ativa destacada (`select-option--active`); seta rotaciona.
- [ ] `selecionar(p)` → `selecionarPrograma(p)` + fecha o dropdown.
- [ ] **Sem programa → corpo com aviso "Selecione um programa acima"** (árvore só aparece depois).
- [ ] Trocar de programa → resets completos (acordeons, cache lazy, escopo alvo, filtros).
- [ ] Carregamento em paralelo: estrutura + ativos + navegador (Promise.all).
