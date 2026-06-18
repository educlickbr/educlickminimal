# Página Form (`/form/[tipo_proc]/[tipo_cand]/[area_id]/[programa_id]`)

## Visão Geral

Tela pública de preenchimento de formulário de inscrição em processo seletivo:

- **Blocos dinâmicos** — carregados via configuração com perguntas customizáveis
- **Salvamento automático** — cada pergunta salva individualmente ao perder o foco
- **Upload de arquivos** — via R2 Storage
- **Busca de CEP** — auto-preenchimento de endereço via ViaCEP
- **Finalização** — cria inscrição na tabela `aca_processo_seletivo_inscricoes`

**Rota:** `/form/:tipo_proc/:tipo_cand/:area_id/:programa_id` | **Layout:** nenhum (página standalone)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Composable → BFF → RPC → Banco**

```
app/pages/form/[tipo_proc]/[tipo_cand]/[area_id]/[programa_id].vue  ← orquestrador (~230 linhas)
app/components/form/FormPergunta.vue                                  ← componente de pergunta (reutilizado via v-for)
app/composables/form/useFormConfig.ts                                 ← carrega configuração do formulário
app/composables/form/useFormAnswers.ts                                ← CRUD de respostas
app/composables/form/useFormFiles.ts                                  ← upload/download/remoção de arquivos
app/composables/form/useFormCep.ts                                    ← busca de CEP + lock de campos
app/composables/form/useFormInscricao.ts                              ← verificar/criar inscrição
server/api/form/config.get.ts                                         ← GET config → RPC aca_get_form_config_completo
server/api/form/save.post.ts                                          ← POST save → RPC aca_upsert_resposta_form
server/api/form/respostas.get.ts                                      ← GET respostas → RPC aca_get_respostas_usuario
server/api/form/inscricao.get.ts                                      ← GET verificar → RPC aca_verificar_inscricao
server/api/form/inscricao.post.ts                                     ← POST criar → RPC aca_criar_inscricao
server/api/r2/sign.get.ts                                             ← GET signed URL (R2)
server/api/r2/upload.post.ts                                          ← POST upload (R2)
server/api/r2/delete.post.ts                                          ← POST delete (R2)
```

### Estrutura de diretórios

```
front_end/app/
├── pages/form/[tipo_proc]/[tipo_cand]/[area_id]/[programa_id].vue   ← orquestrador
├── components/form/
│   └── FormPergunta.vue                                              ← componente de input por tipo
├── composables/form/
│   ├── useFormConfig.ts      ← loadFormConfig + allPerguntaIds
│   ├── useFormAnswers.ts     ← answers, saveStatus, saveAnswer, loadUserAnswers
│   ├── useFormFiles.ts       ← fileNames, fileLinks, upload/download/delete
│   ├── useFormCep.ts         ← CEP lookup, enderecoFieldsUnlocked, mascara
│   └── useFormInscricao.ts   ← verificarInscricao, finalizarInscricao
│
server/api/form/
├── config.get.ts             ← RPC aca_get_form_config_completo
├── save.post.ts              ← RPC aca_upsert_resposta_form
├── respostas.get.ts          ← RPC aca_get_respostas_usuario
├── inscricao.get.ts          ← RPC aca_verificar_inscricao
└── inscricao.post.ts         ← RPC aca_criar_inscricao
server/api/r2/
├── sign.get.ts
├── upload.post.ts
└── delete.post.ts
```

---

## Orquestrador (`index.vue`)

### Composables (5)

| Composable | Instanciado por | Responsabilidade |
|---|---|---|
| `useFormConfig` | orquestrador | Fetch `/api/form/config`, monta blocos + perguntas sys-* |
| `useFormAnswers` | orquestrador | Estado `answers`/`saveStatus`, `saveAnswer` (blur), `loadUserAnswers` |
| `useFormFiles` | orquestrador | Upload/download/remoção via R2, injeta `answers` + `saveAnswer` |
| `useFormCep` | orquestrador | Busca ViaCEP, lock/unlock campos dependentes |
| `useFormInscricao` | orquestrador | Verificar/criar inscrição em processo seletivo |

### Fluxo de dados

```
useFormConfig ──blocos──→ template (v-for blocos)
useFormAnswers ──answers, saveStatus──→ FormPergunta (props)
                              └──→ useFormFiles (deps)
                              └──→ useFormCep (deps)
useFormFiles ──fileNames, fileLinks──→ FormPergunta (props)
useFormCep ──isEnderecoFieldDisabled──→ FormPergunta (props)
useFormInscricao ──enviando──→ botão Finalizar (disabled)
```

### Deep link

`initialTab` lê `route.query.tab` no `setup()` para restaurar a tab ativa via URL (ex: `?tab=2` abre o terceiro bloco). Garantido no setup, não no `onMounted`, para SSR consistente.

### Preservação de estado entre tabs

Usa `v-show` (não `v-if`) nos blocos. Como os blocos são **dinâmicos** (quantidade desconhecida em tempo de compilação), o padrão `v-if` individual por componente de tab não se aplica. O `v-show` garante que as `FormPergunta` não sejam destruídas/recriadas ao trocar de aba.

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/form/config` | → RPC `aca_get_form_config_completo` |
| `POST` | `/api/form/save` | → RPC `aca_upsert_resposta_form` |
| `GET` | `/api/form/respostas` | → RPC `aca_get_respostas_usuario` |
| `GET` | `/api/form/inscricao` | → RPC `aca_verificar_inscricao` |
| `POST` | `/api/form/inscricao` | → RPC `aca_criar_inscricao` |
| `GET` | `/api/r2/sign` | → R2 signed URL |
| `POST` | `/api/r2/upload` | → R2 upload |
| `POST` | `/api/r2/delete` | → R2 delete |

---

## Checklist de desacoplamento

- [x] APIs próprias em `server/api/form/`
- [x] APIs usam RPC (zero query direta)
- [x] `$fetch` do `ofetch` removido dos composables — usa global do Nuxt
- [x] `loadFormConfig` extraído para `useFormConfig` (zero `$fetch` inline no orquestrador)
- [x] `useToast` instanciado na seção de composables
- [x] `initialTab` via `route.query.tab` no setup (deep link)
- [x] `v-show` preserva estado das FormPergunta entre tabs
- [x] Orquestrador gerencia lifecycle (`onMounted`)
- [ ] Componentes de tab extraídos (blocos são dinâmicos, `v-show` resolve)
- [ ] APIs R2 em diretório dedicado (compartilhadas, não específicas do form)

---

## Histórico de mudanças

### Refatoração de desacoplamento (2026-06-18)
- `$fetch` do `ofetch` removido de `useFormAnswers`, `useFormFiles`, `useFormInscricao`
- Criado `useFormConfig` — extrai `loadFormConfig` do orquestrador (zero `$fetch` inline)
- `useToast` movido para seção de composables
- `initialTab` via `route.query.tab` adicionado (deep link)
- Template: `v-show` substitui `v-if` implícito via índice para preservar estado
