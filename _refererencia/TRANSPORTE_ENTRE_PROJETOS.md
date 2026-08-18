# Transporte de Páginas entre Projetos (Pack de Recriação)

> **Propósito**: permitir que um agente em outro projeto (Nuxt + mesma
> arquitetura BFF/SSR + Supabase) recrie uma página deste sistema com
> **fidelidade funcional e visual**, apenas consumindo documentação.
>
> **Escopo**: qualquer página/módulo. Os documentos em `documentacao/paginas/*`
> capturam **regras de negócio**; este documento define o **pacote mínimo de
> transferência** que precisa acompanhá-los, e serve de checklist para
> completar a documentação de cada página.

---

## 1) Regra de Ouro

> **Documento de página sem contrato de API e sem modelo de dados NÃO permite
> recriação fiel.** Ele permite recriação "no espírito" — funcionalmente
> parecida, mas com payloads, banco e visual diferentes.

Antes de entregar um documento de página para outro projeto, verifique as **6
camadas** abaixo. As camadas 1 e 2 são obrigatórias e, hoje, são as que mais
faltam nos documentos existentes.

---

## 2) As 6 Camadas do Pack de Transferência

### Camada 1 — Contratos de API (OBRIGATÓRIA)

Para **cada endpoint** consumido pela página, documentar:

- Método + caminho + parâmetros (query/body).
- **Exemplo real de request** (JSON) — extraído do composable ou do server route.
- **Exemplo real de response** (JSON com campos anotados) — extraído do código
  ou do retorno da RPC.
- Erros esperados (código HTTP + condição, ex.: `409` quando prazo expirado).

**Fonte no projeto**: `front_end/app/composables/<modulo>/*.ts` (request) e
`front_end/server/api/<modulo>/*` (response/erros).

**Exemplo (extraído do código real do `conteudo_digital`):**

```json
// POST /api/conteudo_digital/submit
// Body:
{
  "type": "quiz",
  "itemId": "uuid-do-item",
  "answers": [
    { "id_pergunta": "uuid", "id_resposta_possivel": "uuid", "texto_resposta": null }
  ],
  "id_empresa": "uuid"
}
// type também aceita "task" com mode: "draft" (rascunho) ou ausente (envio final):
// { "type": "task", "mode": "draft", "itemId": "...", "text": "...", "fileId": "...", "id_empresa": "..." }
// Erros: 409 quando a RPC retorna "prazo de envio expirado"; 500 demais.
```

### Camada 2 — Modelo de Dados (OBRIGATÓRIA)

Documentar o **schema real** das tabelas envolvidas (não apenas as principais):

- Nome da tabela, PK/FKs, colunas com tipo e significado.
- Campos que o front consome diretamente (ex.: `tipo`, `rich_text`,
  `tempo_questionario`, `ambiente_seguro`, `auto_avaliacao`).
- Para cada RPC: nome, assinatura (`p_*`), comportamento, e se resolve usuário
  internamente via `auth.uid()`.

**Fonte no projeto**: migrations em `supabase/migrations/*` e os
`server/api/<modulo>/*.ts`.

### Camada 3 — Comportamento e Estados de UI

Não é preciso transcrever o template (~900 linhas), mas sim o **mapa de
estados** que ele renderiza:

- Estados possíveis da tela (loading, vazio, erro, sucesso, modo leitura,
  modo edição...) e o que dispara cada transição.
- Listas/abas do módulo e regra de exibição (lazy por nível, cache local...).
- Modais, overlays, contagens regressivas e comportamentos de segurança
  (ex.: fullscreen obrigatório, overlay de violação com 5s).
- Formatações específicas (timezone fixa, máscaras, cores por status).

### Camada 4 — Dependências de Infraestrutura

Listar tudo que a página importa do "resto do sistema":

- Layouts usados (`layout_secundario`, `manager`...).
- Componentes compartilhados (`LmsQuizTimer`, `ModalConfirmacao`,
  `ManagerInput`, `SelectComBusca`...).
- Stores (`useAppStore` — empresa, usuário, ROLES).
- Serviços externos (storage com token assinado, biblioteca digital, etc.).
- `useState` globais (`lmsSecureFocusMode`, `lmsHideSidebar`...).

**Regra**: se o componente/storage não for enviado junto, o documento deve
dizer o contrato mínimo dele (props/eventos, ou shape do retorno).

### Camada 5 — Padrões de Arquitetura (referência cruzada)

O outro projeto deve receber (ou já ter) os padrões:

- `documentacao/arquitetura/PADRAO_BFF_SSR.md` — endpoints BFF, `useAsyncData`
  + `ofetch`, regra de ouro do `id_empresa` como `Ref`.
- `documentacao/arquitetura/PADRAO_PAGINAS.md` — orquestrador, composables,
  `provide/inject`, estrutura de diretórios.
- `documentacao/arquitetura/PADRAO_UI.md` — contrato visual (topbar, inputs,
  modais, badges, tokens de cor).
- `documentacao/arquitetura/PADRAO_RPC.md` — quando usar RPC, resolução interna
  de usuário, `SECURITY DEFINER` vs `INVOKER`.
- `documentacao/arquitetura/SUPABASE_WORKFLOW.md` — fluxo de migrations.

### Camada 6 — Regras de Negócio

É o que os documentos de `documentacao/paginas/*` já fazem bem (ex.:
`conteudo_digital.md` cobre deadlines, timer, modo prova, autoavaliação).
Manter e complementar com as camadas 1–4.

---

## 3) Template de Documento de Página

Ao documentar uma página para transporte, usar este esqueleto (copiar e
preencher). Seções marcadas com **(O)** são obrigatórias para recriação fiel.

```markdown
# <Nome do Módulo/Página>

## 1) Visão Geral **(O)**
Caminho da página, layout usado, padrão orquestrador (0 fetch inline),
composables envolvidos.

## 2) Contratos de API **(O)**
| Endpoint | Método | Request (JSON) | Response (JSON) | Erros |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## 3) Modelo de Dados **(O)**
### Tabelas
| Tabela | Colunas (nome, tipo, significado) | FKs |
|---|---|---|
### RPCs
| RPC | Assinatura (p_*) | Comportamento | Resolve usuário interno? |
|---|---|---|---|

## 4) Regras de Negócio
Prazos, permissões, bloqueios, validações, timezone...

## 5) Estados de UI **(O)**
Lista de estados da tela e transições.

## 6) Dependências de Infraestrutura **(O)**
Layouts, componentes compartilhados, stores, serviços externos, useState.

## 7) Fluxos de Usuário
Passo a passo das jornadas principais (ex.: iniciar quiz, enviar tarefa,
ver correção).

## 8) Pendências / Notas
O que foi simplificado, o que depende de decisão do novo projeto.
```

---

## 4) Checklist antes de Entregar o Pack

- [ ] Camada 1: todos os endpoints usados pela página têm request/response em
      JSON real (não descrição textual).
- [ ] Camada 2: schema completo das tabelas e assinaturas das RPCs.
- [ ] Camada 3: mapa de estados de UI escrito.
- [ ] Camada 4: dependências de infraestrutura listadas com contrato mínimo.
- [ ] Camada 5: padrões de arquitetura anexados/referenciados.
- [ ] Camada 6: regras de negócio completas.
- [ ] Componentes citados como dependência estão inclusos no pack ou têm
      contrato descrito.

---

## 5) Exemplo Prático — Lacunas do `paginas/conteudo_digital.md` hoje

O documento atual cobre bem a Camada 6 (regras) e parcialmente a 3 (timer,
modo prova, deadline). **Faltam**:

| Camada | Lacuna | Fonte para completar |
|---|---|---|
| 1 | Payloads/response de todos os 9 endpoints da tabela §7 | `front_end/app/composables/conteudo_digital/*.ts` + `front_end/server/api/conteudo_digital/*` e `server/api/pedagogico/*` |
| 2 | Schema de folders/itens/perguntas/opções/tarefas (a doc lista só `lms_submissao` e `lms_resposta`) | `supabase/migrations/*` |
| 2 | Assinaturas das RPCs (`lms_quiz_submit_batch`, `lms_task_submit`, `lms_task_upsert_draft`, `lms_itens_get`, ...) | migrations + server routes |
| 3 | Estrutura visual: sidebar de pastas com badges de scope, aba Envios (3 stats), tela de sucesso, revisão, gabarito lado a lado, overlay de violação | `front_end/app/pages/conteudo-digital/index.vue` (template) |
| 4 | `layout_secundario.vue`, `LmsQuizTimer.vue`, `ModalConfirmacao.vue`, `/api/storage/token` (R2), `useState('lmsSecureFocusMode')` | componentes/layouts/composables |

**Resultado esperado ao completar**: um agente em outro projeto com a mesma
arquitetura recria a página com contrato, banco e visual equivalentes — não
apenas "uma página parecida".
