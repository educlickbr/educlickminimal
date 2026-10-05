# Padrão de Sub-abas da Distribuição — Recriação (Blueprint)

> **Propósito:** documentar **exatamente** como funciona a navegação por **sub-abas** da Distribuição (Blueprint) do LMS — a dinâmica que **não** é navegação em cascata. Para o agente do outro lado recriar fiel.
>
> **⚠️ O erro mais comum:** recriar como "clico em Área → vejo os cursos da área → clico no curso → vejo os módulos". **NÃO É ASSIM.** As abas são **independentes**: cada aba lista os itens **daquele escopo** e você associa conteúdo **a qualquer item de qualquer aba**.

---

## 1. O que é (e o que não é)

**NÃO é** (errado):
```
Área → (cursos da área) → (módulos do curso) → (componentes do módulo)   ← cascata/hierarquia
```

**É** (correto):
```
4 sub-abas:  [ Área ] [ Curso ] [ Módulo ] [ Componente ]

1. Escolha uma sub-aba  → lista TODOS os itens daquele escopo (ex.: todos os cursos)
2. Escolha QUALQUER item (ex.: um curso específico)
3. O painel da direita abre com TODOS os conteúdos do repositório
4. Associa/desassocia com um clique (toggle) — o conteúdo passa a pertencer àquele item
5. Troque de aba e repita — cada aba é independente, sem relação de pai/filho
```

Um conteúdo pode ser associado a **vários itens de qualquer escopo** (Área X, Curso Y, Módulo Z, Componente W — tudo ao mesmo tempo). Cada associação é uma linha em `lms_distribuicao`.

---

## 2. A tela (layout)

```
┌────────────────────────────────────────────────────────────────┐
│  [ Área ] [ Curso ] [ Módulo ] [ Componente ]   ← sub-abas      │
├──────────────────────┬─────────────────────────────────────────┤
│  Selecionar Curso    │  Atribuindo a  "Curso de Fotografia"     │
│  (lista de itens do  │  X associados / Y exibidos               │
│   escopo da aba):    │  [busca] [Todos][Atv][Ava] [Assoc][Disc] │
│  • Curso A           │  ┌──────────────────────────────────┐    │
│  • Curso B  ← ativo  │  │ [toggle] Conteúdo 1  ...         │    │
│  • Curso C           │  │ [toggle] Conteúdo 2  ✓ associado │    │
│                      │  │ [toggle] Conteúdo 3  ...         │    │
│  (recolhe p/ w-80    │  └──────────────────────────────────┘    │
│   quando item ativo) │  ← entra com slideInRight                │
└──────────────────────┴─────────────────────────────────────────┘
```

- **Sub-abas** no topo (`sub-tab-link`, ativa com `sub-tab-link--active`).
- **Painel esquerdo:** itens do escopo da aba ativa; recolhe `w-80` quando um item é selecionado (`transition-all duration-300`).
- **Painel direito:** só aparece com item selecionado — header "**Atribuindo a** {nome do item}" + lista de conteúdos com toggle; entra com `slideInRight` (ver §6).

---

## 3. Estado (composable)

```ts
escopoAtivo      // 'area' | 'curso' | 'modulo' | 'componente'  — a sub-aba
escopos          // EscopoItem[] — itens daquele escopo (lista à esquerda)
escopoSelecionado// EscopoItem | null — item escolhido
conteudosAssoc   // ConteudoComAssoc[] — conteúdos do repositório mesclados com {associado, assoc_id}
assocMap         // Map<id_conteudo, id_associacao> — para dessassociar depois
```

Interface do item de conteúdo (o que o painel direito renderiza):

```ts
interface ConteudoComAssoc {
  id: string;            // id_conteudo
  titulo: string;
  tipo: string;          // material | atividade | avaliacao
  descricao?: string | null;
  blocos?: { id: string; titulo: string }[];  // blocos do repositório
  associado: boolean;    // está associado ao item selecionado?
  assoc_id?: string;     // id da linha em lms_distribuicao (para desassociar)
  criado_por_nome?: string | null;
  criado_em?: string;
}
```

---

## 4. Fluxo de dados (funções + BFFs)

| Ação do usuário | Função | Chamada BFF |
|---|---|---|
| Clicou numa sub-aba | `alternarEscopo(tipo)` → limpa seleção + `fetchEscopos()` | `GET /api/programacao_atividades/distribuicao/escopos?tipo_escopo=curso&id_entidade=X` → `{ itens: [{id, nome, descricao}] }` |
| Clicou num item | `selecionarItem(item)` → `carregarConteudos()` | 2 chamadas em paralelo/sequência: |
| | 1. associações do item | `GET /api/programacao_atividades/distribuicao?escopo=curso&escopo_id=<id_item>` → `{ itens: [{id, id_conteudo}] }` (monta `assocMap`) |
| | 2. conteúdos do repositório | `GET /api/programacao_atividades/conteudos?id_entidade=X&page=1&limit=200[&busca][&tipo][&criado_por]` → `{ itens }` |
| | 3. mescla | `conteudosAssoc = itens.map(c => ({...c, associado: assocMap.has(c.id), assoc_id: assocMap.get(c.id)}))` |
| Clicou num conteúdo (associar) | `toggleAssociacao(c)` | `POST /api/programacao_atividades/distribuicao` com body → cria linha |
| Clicou num conteúdo (desassociar) | `toggleAssociacao(c)` | `DELETE /api/programacao_atividades/distribuicao` com `{id: assoc_id}` → remove linha |

### Payloads exatos

```jsonc
// POST /api/programacao_atividades/distribuicao  (associar)
{
  "id_entidade": "uuid",
  "id_conteudo": "uuid-do-conteudo",
  "usuario_id": "uuid-do-user_expandido",
  "id_curso": "uuid-do-item-selecionado"   // ← dinâmico: id_area | id_curso | id_modulo | id_componente
}
// Resposta: { success: true, id: "uuid-da-linha" }  (ou { success: false, message })

// DELETE /api/programacao_atividades/distribuicao  (desassociar)
// Body: { "id": "uuid-da-linha-da-associacao", "id_entidade": "uuid" }

// GET .../distribuicao?escopo=curso&escopo_id=X  (associações do item)
// → { itens: [ { id, id_conteudo } ] }
```

> **O POST é o coração da dinâmica:** o campo do escopo é montado dinamicamente no front — `body[\`id_${escopoAtivo}\`] = escopoSelecionado.id` — e a RPC de associação cria a linha em `lms_distribuicao` com exatamente um escopo preenchido (constraint `lms_distribuicao_um_escopo`).

---

## 5. Regras de negócio da associação

1. **1 conteúdo ↔ N associações:** o mesmo conteúdo pode estar em Área, Curso, Módulo e Componente ao mesmo tempo (linhas distintas).
2. **Escopo único por linha:** cada linha de `lms_distribuicao` tem **exatamente um** escopo preenchido (constraint).
3. **Alvo único por linha:** `id_bloco` XOR `id_conteudo` (associa um bloco inteiro OU um conteúdo individual — não ambos).
4. **Filtros do painel direito:** busca por título, tipo (Todos/Atividades/Avaliações), toggles "Associados"/"Disponíveis" (filtram a lista exibida) e "Só Meus" (filtra por `criado_por`).
5. **Herança para o Currículo:** tudo associado na Distribuição vira conteúdo **herdado** no programa (o operacional puxa da distribuição; o professor pode desativar por programa no Currículo). É a ponte Blueprint → Operação.
6. **Atualização reativa:** trocar busca/tipo/filtros recarrega a lista (watchers no composable) mantendo o item selecionado.

---

## 6. Animações envolvidas (relação com o padrão YAZI/Niri)

- **Painel esquerdo:** recolhimento por largura (`flex-1` ⇄ `w-80 flex-shrink-0` + `transition-all duration-300`) — ver `padrao_animacao_yazi_niri.md` §3.
- **Painel direito:** entra com `slideInRight` — animação CSS inline no elemento:

```css
animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

---

## 7. Diferença com o Currículo (não confundir)

| | **Distribuição (Blueprint)** | **Currículo (Operacional)** |
|---|---|---|
| Navegação | **Sub-abas** (Área/Curso/Módulo/Componente) — lista de itens do escopo | **Acordeons** (Programa → Componentes → Módulos/Ciclos → Aulas) |
| Seleção | Item da aba + painel com **todos** os conteúdos para associar | **Escopo alvo** (pasta) + botão "Adicionar conteúdo" que abre o navegador de conteúdos à direita |
| Associação | Toggle direto na linha | Escolhe o escopo → clica em adicionar → seleciona no navegador |
| Finalidade | O que a instituição sempre oferece | O que a turma (programa) consome agora |

---

## 8. Checklist para recriar

- [ ] 4 sub-abas com `alternarEscopo` (limpa seleção ao trocar).
- [ ] Lista de itens por `tipo_escopo` (todos os itens daquele escopo — **sem hierarquia**).
- [ ] Selecionar item → painel direito "Atribuindo a {nome}" com todos os conteúdos do repositório (200+) mesclados com `associado`/`assoc_id`.
- [ ] Toggle associa/desassocia com POST (`id_<escopo>` dinâmico) / DELETE (`id` da linha).
- [ ] Filtros (busca, tipo, Associados/Disponíveis, Só Meus) recarregam mantendo a seleção.
- [ ] Recolhimento `w-80` + `slideInRight` no painel direito.
- [ ] Contador "X associados / Y exibidos" no header.
