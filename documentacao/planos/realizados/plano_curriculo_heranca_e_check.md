# Plano — Currículo: escopo por coluna, herança (distribuição) e o check do navegador

> **Status:** ✅ Concluído e testado — migrations `20261005100000`, `20261005120000` e `20261005193000` aplicadas; front-end com check pleno e desassociação dupla.
> **Contexto:** bug relatado pelo gestor ao testar a Fase 2 do LMS. Substitui/complementa o relato em `bug_curriculo_associacao.md`.
> **Página:** `documentacao/paginas/programacao_atividades.md`.
> **Data:** 2026-10-05.

---

## 1. Sintoma

No Currículo (`/programacao_atividades?tab=curriculo`), ao abrir um escopo (ex.: Componente) e clicar em **Adicionar**:
- O conteúdo aparece na **árvore** (esquerda) — inclusive o que já pertencia ao escopo via distribuição.
- Mas no **navegador** (direita) ele ficava **quase invisível / desmarcado** devido à opacidade acumulada (disabled 0.3 * icon 0.5 = 0.15) e `catalogo` da RPC não trazia `herdado`/`dist_id`.
- O gestor não conseguia desmarcar nem ver o check claramente.

## 2. Causa raiz

Existem **duas noções diferentes** de "pertence ao escopo":

| Onde | Fonte | O que mostra |
|---|---|---|
| Árvore (esquerda) | `lms_get_curriculo_conteudos` → `conteudos` | **operacional ∪ distribuição** (conteúdo herdado vem com `herdado: true`) |
| Navegador (direita, check) | `lms_get_curriculo_conteudos` → `catalogo` | Antigamente apenas `op_id`; agora inclui `herdado` e `dist_id` |

## 3. Histórico de tentativas e solução

| # | Tentativa | Resultado |
|---|---|---|
| 1 | **Associação sempre nível-programa** (front antigo colapsava componente/módulo/área em `id_programa`); navegador lia `ativos` do programa | ✅ Causa original do desencontro — a associação ia para o lugar errado |
| 2 | **Migration `20261005100000` (Opção B)** — `lms_conteudo_operacional` ganhou `id_area`/`id_componente`/`id_modulo`; constraint `um_escopo` refeita; `lms_upsert_operacional` e `lms_get_curriculo_conteudos` atualizadas | ✅ Associações passam a viver no escopo certo |
| 3 | **Migration `20261005120000` (saneamento)** — re-escopou linhas **nível-programa** antigas pela distribuição (componente > módulo > área) | ✅ Corrigiu as associações antigas *que tinham linha*; **não** cria linha para conteúdo puramente herdado |
| 4 | **Fix no front e RPC `20261005193000`** — `lms_get_curriculo_conteudos` devolve `herdado: true` e `dist_id` no próprio `catalogo`; check roxo vivo; desmarcar remove da distribuição (`DELETE /api/programacao_atividades/distribuicao`) ou operacional (`DELETE /api/programacao_atividades/curriculo`) | ✅ Solução completa e robusta |

## 4. Critérios de aceite

- [x] Abrir um componente → conteúdo **herdado** aparece **marcado** (com selo "da distribuição") e **persiste após reload**.
- [x] Conteúdo com `op_id` → marcado e **clicável** (desassociar).
- [x] Conteúdo fora do escopo → **desmarcado**.
- [x] Filtros "Associados/Livres/Ocultos" e o resumo do sidebar contam herdado como "no escopo".
- [x] Nenhum 500 nas rotas `/api/programacao_atividades/curriculo*`.
- [x] Pós-fix, **hard reload** mostra o selo e o check roxo pleno.

## 5. Arquivos envolvidos

- `supabase/migrations/20261005100000_fix_curriculo_operacional_por_escopo.sql` (aplicada)
- `supabase/migrations/20261005120000_saneamento_operacional_por_escopo.sql` (aplicada)
- `supabase/migrations/20261005193000_curriculo_catalogo_herdado_e_dist_id.sql` (aplicada)
- `front_end/app/composables/programacao_atividades/useProgAtividadesCurriculo.ts` (suporte a `dist_id` e desassociação dupla)
- `front_end/app/components/programacao_atividades/ProgAtividadesTabCurriculo.vue` (check nítido, badge azul da distribuição, interativo)
