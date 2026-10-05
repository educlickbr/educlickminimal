# Bug — Associação de conteúdos no Currículo (`/programacao_atividades?tab=curriculo`)

> **Status:** corrigido no código — pendente aplicar a migration em 2026-10-05.
> **Origem:** relato do gestor ao testar a Fase 2 do LMS.
> **Data:** 2026-10-05.

---

## Contexto

Rota: `/programacao_atividades?tab=curriculo` (página admin). O "Currículo" é a camada de **Operação** do LMS; a aba "Distribuição" é o **Blueprint** (`lms_distribuicao`).

Arquivos-chave:
- `front_end/app/components/programacao_atividades/ProgAtividadesTabCurriculo.vue`
- `front_end/app/composables/programacao_atividades/useProgAtividadesCurriculo.ts`
- `front_end/server/api/programacao_atividades/curriculo/{conteudos.get,ativos.get,index.post,index.delete}.ts`
- RPCs em `supabase/migrations/20260729100000_refactor_lms_curriculo_lazy.sql` e `supabase/migrations/20260729100001_add_programa_escopo.sql` (`lms_get_curriculo_conteudos`, `lms_upsert_operacional`)

---

## Sintoma (relato do gestor)

Ao abrir uma **pasta** (ex.: Componente X) e clicar em **Adicionar**, o navegador à direita lista os conteúdos e mostra um já associado (checkbox marcado). Porém:

1. O conteúdo **não aparece na lista abaixo da aba** (nó do componente na árvore).
2. **Não consigo adicionar mais de um** conteúdo seguido — o painel fecha após cada associação.
3. Sinto que **duas chamadas** são feitas (`/curriculo/conteudos` e `/conteudos`) onde deveria haver uma só.

## Evidências (payloads reais)

- `GET /api/programacao_atividades/curriculo/conteudos?id_programa=…&escopo_tipo=componente&escopo_id=d6575d6a-…`
  → `{ "conteudos": [ { "id_conteudo": "ce488f51-…", "herdado": true, "op_id": null, … } ] }`
- `GET /api/programacao_atividades/conteudos`
  → `{ "itens": [ 3 conteúdos do catálogo ], "qtd_total": 3, "pagina_atual": 1 }`

---

## Causa raiz (confirmar no código antes de editar)

- **R1 — Escopo colapsado (núcleo do "erro de lógica").** `escopoKeyToParams()` (L160-164) retorna `{}` para `componente:`, `modulo:`, `area` e `programa`; logo `montarBodyOperacional()` (L168-187) envia **`id_programa`**. Mas a árvore lista `componente`/`modulo`/`area` a partir de **`lms_distribuicao`** (RPC `lms_get_curriculo_conteudos`, branches L37-86), que não contém a associação feita. Só o nó **`programa`** (branch L23-35) lê o operacional. => associa "no componente" mas grava no programa.
- **R2 — Painel fecha após cada ação.** `toggleAssociacaoPainel()` (L504) e `toggleAtivoPainel()` (L545) fazem `selectedScopeKey.value = null` no fim → some o navegador (`v-if="ctx.selectedScopeKey.value"`) e a árvore volta a `flex-1`.
- **R3 — Árvore não atualiza.** Esses dois métodos **não invalidam** `conteudosMap` (diferente de `toggleAtivo()`, L462-463, que invalida). E `carregarConteudosSeNecessario()` (L107-109) faz `early-return` se a chave já existe → colapsar/reexpandir **não refaz** o fetch.
- **R4 — Duas fontes sem estado compartilhado.** Árvore = `/curriculo/conteudos` (escopo); navegador = `/conteudos` (catálogo inteiro) + `ativosMap` (de `/curriculo/ativos`, que só lê operacional **program-level**, L13-19). O checkbox do navegador reflete o programa, não o escopo clicado.

---

## Decisão de produto

O comportamento desejado é "associar conteúdo àquele escopo (componente/módulo/aula)". Como `lms_conteudo_operacional` só suporta `programa`/`ciclo`/`calendario`, há duas rotas:

- **Opção A (sem mudar schema):** deixar explícito que "Adicionar" sob componente/módulo associa ao **programa**; ajustar rótulos (ex.: "Escopo alvo: Programa (via Componente X)") e garantir que a árvore mostre o resultado no nó correto (`programa`). Menos fiel ao modelo mental, mas barato.
- **Opção B (com migration nova):** dar suporte real a `componente`/`modulo` no operacional (colunas/`escopo_tipo`+`escopo_id` ou `id_componente`/`id_modulo`, atualizar a constraint `lms_conteudo_operacional_um_escopo` e as branches da RPC) → associação por escopo de verdade. É o que o gestor parece esperar.

**Decisão:** Opção B — associação real por escopo, com `id_programa` como dono obrigatório e um subescopo opcional (`id_area`, `id_componente`, `id_modulo`, `id_ciclo` ou `id_calendario`). Após a escolha, R2 e R3 devem ser corrigidos de qualquer forma.

---

## Correções obrigatórias (independente da opção)

1. **Manter o navegador aberto** após associar/desassociar/ocultar, para permitir adicionar vários (remover o `selectedScopeKey.value = null` de L504/L545, ou só limpar quando o usuário clicar "Cancelar").
2. **Refletir na hora na árvore:** após qualquer mutação, invalidar/recarregar `conteudosMap` do(s) escopo(s) afetado(s) e refazer o fetch — nunca confiar no cache do `carregarConteudosSeNecessario`.
3. **Eliminar redundância:** o navegador e a árvore do escopo ativo devem compartilhar o mesmo estado (uma fonte). Ao abrir o escopo, uma chamada; associar/ocultar atualiza a lista em memória, sem segunda chamada de catálogo.
4. **Consistência do checkbox** com o escopo alvo selecionado (não com o programa global).

---

## Restrições

- RPCs sempre `SECURITY INVOKER` (nunca `DEFINER`).
- Se precisar mudar o banco, **nova migration** (nunca editar migration já aplicada).
- Preservar a animação YAZI/Niri (árvore `flex-1` ⇄ `w-96`, navegador `slideInRight`) — ver `documentacao/planos/referencia_externa/padrao_animacao_yazi_niri.md` e `padrao_curriculo_admin.md`.
- Não introduzir `v-if`/`v-else` conflitantes nem classes `hidden`+`flex` no mesmo elemento (já causou bug antes).

---

## Testes de aceite

1. Escopo "Programa": adicionar 2 conteúdos seguidos → ambos aparecem no nó Programa imediatamente.
2. Escopo "Componente X" (conforme opção escolhida): associação aparece na lista abaixo da aba X, sem recarregar o programa.
3. Associar/desassociar 3x sem fechar o navegador.
4. Trocar de programa → estado limpo (árvore, cache, escopo alvo, filtros).
5. Sem erros no console/500 nas rotas `/api/programacao_atividades/curriculo*`.

---

## Entregável

- Correção + (se Opção B) migration nova.
- Atualizar `documentacao/planos/referencia_externa/padrao_curriculo_admin.md` com a semântica decidida.
