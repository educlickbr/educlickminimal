# Páginas de Formulário

Rotas:
- **Formulário público**: `/form/[tipo_proc]/[tipo_cand]/[area_id]/[programa_id]`
- **Sucesso**: `/form/sucesso?id_inscricao=UUID`

---

## `/form/:tipo_proc/:tipo_cand/:area_id/:programa_id`

### Visão Geral

Tela pública de preenchimento de formulário de inscrição em processo seletivo:

- **Blocos dinâmicos** — carregados via configuração com perguntas customizáveis
- **Salvamento automático** — cada pergunta salva individualmente ao perder o foco
- **Upload de arquivos/fotos** — via R2 Storage, com placeholder estilizado
- **Busca de CEP** — auto-preenchimento de endereço via ViaCEP
- **Validação de obrigatórios** — frontend + RPC antes de finalizar
- **Verificação de duplicidade** — bloqueia o form se já inscrito
- **Finalização** — cria inscrição na tabela `aca_processo_seletivo_inscricoes`
- **Redirecionamento** — após finalizar, vai para `/form/sucesso`

Query params aceitos: `?id_processo_seletivo=UUID&id_entidade=UUID&tab=N`

### Arquitetura

Pipeline: **Orquestrador → Composable → BFF → RPC → Banco**

```
app/pages/form/[tipo_proc]/[tipo_cand]/[area_id]/[programa_id].vue  ← orquestrador
app/pages/form/sucesso.vue                                            ← página de confirmação
app/components/form/FormPergunta.vue                                  ← componente de input por tipo
app/composables/form/useFormConfig.ts                                 ← carrega config do formulário
app/composables/form/useFormAnswers.ts                                ← CRUD de respostas (id_arquivo)
app/composables/form/useFormFiles.ts                                  ← upload/download/remoção R2
app/composables/form/useFormCep.ts                                    ← busca CEP + lock campos
app/composables/form/useFormInscricao.ts                              ← verificar/criar inscrição
server/api/form/config.get.ts                                         ← GET config → aca_get_form_config_completo
server/api/form/save.post.ts                                          ← POST save → aca_upsert_resposta_form
server/api/form/respostas.get.ts                                      ← GET respostas → aca_get_respostas_usuario
server/api/form/inscricao.get.ts                                      ← GET verificar (por id_processo ou id_inscricao)
server/api/form/inscricao.post.ts                                     ← POST criar → aca_criar_inscricao
server/api/form/validar.post.ts                                       ← POST validar obrigatórios → aca_validar_form_obrigatorio
server/api/r2/sign.get.ts                                             ← GET signed URL (R2)
server/api/r2/upload.post.ts                                          ← POST upload (R2)
server/api/r2/delete.post.ts                                          ← POST delete (R2 + banco)
```

### Composables

| Composable | Responsabilidade |
|---|---|
| `useFormConfig` | Fetch `/api/form/config`, monta blocos + perguntas sys-* |
| `useFormAnswers` | Estado `answers`/`saveStatus`, save/load respostas. File/foto usa `id_arquivo` |
| `useFormFiles` | Upload/download/remoção via R2, injeta `answers` + `saveAnswer` + `idEntidade` |
| `useFormCep` | Busca ViaCEP, lock/unlock campos dependentes |
| `useFormInscricao` | `verificarInscricao` (bloqueio) + `finalizarInscricao` (POST) |

### Fluxo de inicialização

```
onMounted
  ├── store.initSession()
  ├── verificarInscricao(id_processo, tipo_proc, tipo_cand)
  │     └── existe? → tela "Já Inscrito" (bloqueia form)
  └── não existe → loadFormConfig → loadUserAnswers → fetchFileInfo
```

### Tipos de pergunta suportados (`FormPergunta.vue`)

| Tipo | Renderização |
|---|---|
| `text`, `email` | input padrão |
| `cpf` | input com formatação |
| `cep` | input com busca ViaCEP |
| `endereco` | input bloqueável via CEP |
| `select` | dropdown |
| `data`, `date` | date picker |
| `textarea` | textarea |
| `file` | placeholder c/ ícone 📄 + upload → nome + visualizar + remover |
| `foto` | placeholder c/ ícone 📷 + upload → miniatura 64x64 + nome + remover |

### Validação de obrigatórios (dupla camada)

1. **Frontend**: varre `blocos`, checa `pergunta.obrigatorio` × `answers`
2. **RPC** `aca_validar_form_obrigatorio`: consulta `aca_form_config` × `aca_resposta_form`

Se pendentes → toast com labels → bloqueia finalização.

### Armazenamento de arquivos/fotos

Respostas de tipo `file`/`foto` usam a coluna `id_arquivo` (FK → `global_arquivos`), não `resposta`:

```
Upload:  answers[id] = fileUUID → saveAnswer → resposta="arquivo", id_arquivo=fileUUID
Load:    answers[id] = id_arquivo (com fallback para resposta antiga)
Delete:  answers[id] = null → saveAnswer → resposta=null, id_arquivo=null
```

### APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/form/config` | → RPC `aca_get_form_config_completo` |
| `POST` | `/api/form/save` | → RPC `aca_upsert_resposta_form` |
| `GET` | `/api/form/respostas` | → RPC `aca_get_respostas_usuario` |
| `GET` | `/api/form/inscricao` | → `aca_verificar_inscricao` ou query direta por `id_inscricao` |
| `POST` | `/api/form/inscricao` | → RPC `aca_criar_inscricao` |
| `POST` | `/api/form/validar` | → RPC `aca_validar_form_obrigatorio` |
| `GET` | `/api/r2/sign` | → R2 signed URL |
| `POST` | `/api/r2/upload` | → R2 upload + insert global_arquivos (id_entidade, criado_por) |
| `POST` | `/api/r2/delete` | → R2 delete + delete global_arquivos (count exact) |

---

## `/form/sucesso`

### Visão Geral

Página exibida após finalização da inscrição. Só acessível com `?id_inscricao=UUID`.

- Verifica se a inscrição existe no banco
- Animação de check (bounce-in + draw-check)
- Exibe ID da inscrição
- Botão "Ir para o Início"

### Estrutura

```
app/pages/form/sucesso.vue  ← standalone, sem layout
server/api/form/inscricao.get.ts  ← busca por id_inscricao (query direta)
```

---

## Histórico de mudanças

### 2026-06-22 — Foto, obrigatórios, validação, sucesso
- Adicionado tipo `foto` no `FormPergunta.vue` (upload, miniatura, placeholder)
- Refatorado `file` com placeholder estilizado (ícone 📄 + "Selecionar")
- Refatorado armazenamento: `id_arquivo` (FK global_arquivos) em vez de `resposta`
- `useFormAnswers.saveAnswer`: file/foto envia `id_arquivo` + dummy `resposta="arquivo"`
- `useFormAnswers.loadUserAnswers`: file/foto lê `id_arquivo` com fallback compat
- `useFormFiles`: adicionado `idEntidade` dep, envia `user_expandido_id`/`id_entidade` no upload/delete
- Removido `confirm()` do browser — confirmação inline no `FormPergunta` (file + foto)
- RPC `aca_upsert_resposta_form`: corrigido COALESCE → sobrescreve sempre
- Migration: FK `global_arquivos.empresa_id` → `id_entidade` (user_entidades)
- Migration: RLS delete policy corrigida via `user_expandido.id_user = auth.uid()`
- RPC `aca_validar_form_obrigatorio` + BFF `/api/form/validar`
- Validação dupla (front + RPC) antes de finalizar inscrição
- Verificação de inscrição existente no `onMounted` — bloqueia form se já inscrito
- Página `/form/sucesso` com animação após finalização
- `inscricao.get.ts`: busca por `id_inscricao` como alternativa aos params de verificação

### 2026-06-19 — Correção FK e migration
- Migration: FK `aca_resposta_form.id_arquivo` corrigida de `glb_arquivo` → `global_arquivos`
- Migration: RLS delete corrigida para `user_expandido`

### 2026-06-18 — Refatoração de desacoplamento
- `$fetch` do `ofetch` removido dos composables
- Criado `useFormConfig`
- `useToast` movido para seção de composables
- `initialTab` via `route.query.tab`
- Template: `v-show` para preservar estado entre tabs
