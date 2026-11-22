# Bug — Associação de conteúdos no Currículo (`/programacao_atividades?tab=curriculo`)

> **Status:** ✅ Concluído e testado — corrigido via Opção B + migrations `20261005100000`, `20261005120000` e `20261005193000` aplicadas; check do herdado e desassociação dupla implementados.
> **Origem:** relato do gestor ao testar a Fase 2 do LMS.
> **Data:** 2026-10-05.
> **Evolução do caso:** [`plano_curriculo_heranca_e_check.md`](./plano_curriculo_heranca_e_check.md) — histórico de tentativas + solução robusta.

---

## Contexto

Rota: `/programacao_atividades?tab=curriculo` (página admin). O "Currículo" é a camada de **Operação** do LMS; a aba "Distribuição" é o **Blueprint** (`lms_distribuicao`).

Arquivos-chave:
- `front_end/app/components/programacao_atividades/ProgAtividadesTabCurriculo.vue`
- `front_end/app/composables/programacao_atividades/useProgAtividadesCurriculo.ts`
- `front_end/server/api/programacao_atividades/curriculo/{conteudos.get,ativos.get,index.post,index.delete}.ts`
- `front_end/server/api/programacao_atividades/distribuicao/index.delete.ts`
- RPCs em `supabase/migrations/` (`20261005100000_fix_curriculo_operacional_por_escopo.sql`, `20261005120000_saneamento_operacional_por_escopo.sql`, `20261005193000_curriculo_catalogo_herdado_e_dist_id.sql`)

---

## Sintoma (relato do gestor)

Ao abrir uma **pasta** (ex.: Componente X) e clicar em **Adicionar**, o navegador à direita lista os conteúdos e mostra um já associado (checkbox marcado). Porém:

1. O conteúdo **não aparecia na lista abaixo da aba** (nó do componente na árvore) quando gravado no nível de programa.
2. O painel fechava após cada associação.
3. Conteúdos herdados da distribuição apareciam na árvore mas não com check claro no navegador, e não podiam ser desmarcados.

---

## Causa raiz

- **R1 — Escopo colapsado (núcleo do "erro de lógica").** `escopoKeyToParams()` retornava `{}` para `componente:`, `modulo:`, `area` e `programa`; logo `montarBodyOperacional()` enviava **`id_programa`**. Mas a árvore listava `componente`/`modulo`/`area` a partir de **`lms_distribuicao`**, que não continha a associação feita.
- **R2 — Painel fechava após cada ação.** `toggleAssociacaoPainel()` e `toggleAtivoPainel()` limpavam `selectedScopeKey.value`.
- **R3 — Árvore não atualizava.** Faltava invalidar `conteudosMap` após mutação.
- **R4 — Duas fontes sem estado compartilhado.** Árvore lia `conteudos` (operacional ∪ distribuição); navegador lia `catalogo` (que na RPC ignorava a distribuição).

---

## Decisão de produto

**Decisão:** Opção B — associação real por escopo, com `id_programa` como dono obrigatório e um subescopo opcional (`id_area`, `id_componente`, `id_modulo`, `id_ciclo` ou `id_calendario`), unificando a leitura de distribuição na RPC e permitindo desassociar tanto da distribuição quanto do operacional.

---

## Entregável

- Migration `20261005100000` (escopo em colunas no operacional).
- Migration `20261005120000` (saneamento das linhas legadas).
- Migration `20261005193000` (unificação do catálogo com a distribuição + retorno de `dist_id`).
- Correções no front-end (`ProgAtividadesTabCurriculo.vue` e `useProgAtividadesCurriculo.ts`).
