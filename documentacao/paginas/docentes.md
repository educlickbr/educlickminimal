# Página Docentes (`/docentes`)

## Visão Geral

Tela **administrativa** para gestão completa de docentes:

- **4 abas fixas** — Editais, Seleção, Docentes, Currículos
- **Editais** — CRUD de editais/oportunidades, associar formulário `seletivo` + `docente` + escopo `global`
- **Seleção** — candidatos inscritos em editais, avaliação (aprovar/recusar/suplente)
- **Docentes** — cadastro manual, vínculo com componentes, convite para criar conta, valor hora/aula
- **Currículos** — propostas espontâneas enviadas pela página `/trabalhe-conosco`

**Rota:** `/docentes` | **Layout:** `base` | **Orquestrador:** `pages/docentes/index.vue`

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/docentes/index.vue                                    ← orquestrador
app/components/docentes/
├── DocentesTabEditais.vue                                      ← CRUD editais
├── DocentesTabSelecao.vue                                      ← avaliar candidatos
├── DocentesTabDocentes.vue                                     ← lista + cadastro
├── DocentesTabCurriculos.vue                                   ← propostas recebidas
├── ModalEdital.vue                                             ← criar/editar edital
├── ModalDocente.vue                                            ← cadastro manual
├── ModalVinculosDocente.vue                                    ← vincular componentes
└── ModalAvaliarCandidato.vue                                   ← aprovar/recusar
app/composables/docentes/
├── useDocentesCore.ts                                          ← abas + entidade
├── useDocentesEditais.ts                                       ← CRUD editais + forms
├── useDocentesSelecao.ts                                       ← inscrições + avaliação
├── useDocentesLista.ts                                         ← docentes + vínculos
└── useDocentesCurriculos.ts                                    ← propostas espontâneas
server/api/docentes/
├── editais.get.ts / .post.ts / .delete.ts                      ← CRUD editais
├── editais-dropdown.get.ts                                     ← editais para dropdown
├── formularios-disponiveis.get.ts                              ← forms para associar
├── inscricoes.get.ts / .post.ts                                ← inscrições em editais
├── docentes.get.ts / .post.ts / .delete.ts                     ← CRUD docentes
├── docente-detalhes.get.ts                                     ← dados completos
├── componentes.get.ts                                          ← componentes para vínculo
├── vinculos.get.ts / .post.ts                                  ← vínculo docente-componente
├── cadastro-completo.post.ts                                   ← criar docente + respostas
├── valor-hora-aula.post.ts                                     ← atualizar valor hora/aula
├── atualizar-dados.post.ts                                     ← atualizar dados
├── curriculos.get.ts / .post.ts / .delete.ts                   ← CRUD propostas
├── gerar-convite.post.ts                                       ← gerar link de convite
├── gerar-codigo.post.ts                                        ← gerar código verificação
├── verificar-codigo.post.ts                                    ← verificar código
├── enviar-convite.post.ts                                      ← enviar convite email
└── enviar-convite-login.post.ts                                ← enviar convite login
supabase/migrations/
├── 20260713100000_create_aca_docente_tables.sql                ← tabelas base
├── 20260713100001_rpc_aca_docente.sql                          ← RPCs docentes
├── 20260713100002_rpc_aca_edital_docente.sql                   ← RPCs editais
├── 20260713100003_rpc_aca_inscricao_edital.sql                 ← RPCs inscrições
├── 20260713100004_rpc_aca_vinculo_docente.sql                  ← RPCs vínculos
├── 20260713100005_rpc_aca_proposta_docente.sql                 ← RPCs propostas
├── 20260713100006_rpc_aca_criar_docente_completo.sql           ← RPC cadastro completo
├── 20260713100007_rpc_aca_convite_docente.sql                  ← RPC convite
├── 20260713100008_add_verificacao_email.sql                    ← código verificação
├── 20260713100009_add_valor_hora_aula.sql                      ← coluna valor_hora_aula
├── 20260713100010_fix_aca_criar_docente_completo.sql           ← fix cadastro
├── 20260713100011_add_escopo_to_form_config.sql                ← escopo global
├── 20260713100012_public_rpc_security_definer.sql              ← security definer
├── 20260713100013_add_convite_enviado.sql                      ← coluna convite
├── 20260713100014_fix_id_user_and_papel.sql                    ← fix vinculo auth
├── 20260713100015_rpc_verificar_email.sql                      ← RPC verificar email
├── 20260713100016_rls_docentes.sql                             ← RLS policies
├── 20260713100017_fix_rpc_codigo_definer.sql                   ← fix definer
├── 20260713100018_rpc_vincular_conta.sql                       ← RPC vincular auth
├── 20260713100019_fix_remove_email_verificado.sql              ← fix verificação
├── 20260713100020_fix_user_entidade_user.sql                   ← fix entidade
├── 20260713100021_fix_aca_get_docentes_nome.sql                ← fix nome
├── 20260713100022_fix_aca_get_docentes_security.sql            ← fix security
├── 20260713100023_add_tem_conta_to_docentes.sql                ← coluna tem_conta
├── 20260713100024_fix_entidade_cadastro_manual.sql             ← fix entidade
└── 20260713100030-42 (demais migrations de auth/public)        ← fluxo público
```

---

## Fluxo de Dados

### Aba 1 — Editais

```
Orquestrador → DocentesTabEditais.vue
  Composables: useDocentesEditais

Listar:
  GET /api/docentes/editais?id_entidade=X
    → RPC aca_get_editais_docente(p_id_entidade) [SECURITY INVOKER]
    → Retorna { itens: [{ id, nome, descricao, data_ini, data_fim, status, id_form_config, qtd_inscricoes }] }

Criar/Editar:
  POST /api/docentes/editais { id_entidade, nome, ..., id_form_config }
    → RPC aca_upsert_edital_docente(...) [SECURITY INVOKER]

Deletar:
  DELETE /api/docentes/editais?id=X
    → RPC aca_delete_edital_docente(p_id)

Formulários disponíveis (dropdown):
  GET /api/docentes/formularios-disponiveis?id_entidade=X&tipo_proc=seletivo&tipo_cand=docente
    → RPC frm_get_formularios_salvos(p_id_entidade)
    → Filtro BFF: tipo_proc='seletivo', tipo_cand='docente', escopo='global'
```

### Aba 2 — Seleção

```
Orquestrador → DocentesTabSelecao.vue
  Composables: useDocentesSelecao

Dropdown editais:
  GET /api/docentes/editais-dropdown?id_entidade=X

Inscrições por edital:
  GET /api/docentes/inscricoes?id_edital=X
    → RPC aca_get_inscricoes_edital(p_id_edital)
    → Retorna candidatos com nome, email, status, respostas

Avaliar candidato:
  POST /api/docentes/inscricoes { id, status }
    → RPC aca_avaliar_inscricao_docente(p_id, p_status, p_modificado_por)
    → Status: 'aguardando' | 'aprovado' | 'recusado' | 'suplente'
```

### Aba 3 — Docentes

```
Orquestrador → DocentesTabDocentes.vue
  Composables: useDocentesLista

Listar:
  GET /api/docentes/docentes?id_entidade=X&busca=&pagina=1&limite=20
    → RPC aca_get_docentes(p_id_entidade, p_busca, p_pagina, p_limite)
    → Retorna { itens: [{ id, nome, email, ativo, tem_conta, valor_hora_aula, criado_em }], total }

Cadastro manual:
  POST /api/docentes/cadastro-completo { id_entidade, nome, email, respostas, valor_hora_aula }
    → RPC aca_criar_docente_completo(...) [SECURITY DEFINER]
    → Cria user_expandido + aca_docente + respostas + entidade

Detalhes:
  GET /api/docentes/docente-detalhes?id_docente=X
    → user_expandido + respostas do docente

Atualizar dados:
  POST /api/docentes/atualizar-dados { id_docente, respostas }
    → Atualiza respostas do formulário

Valor hora/aula:
  POST /api/docentes/valor-hora-aula { id_docente, valor_centavos }
    → UPDATE aca_docente SET valor_hora_aula

Componentes (vínculo):
  GET /api/docentes/componentes?id_entidade=X
    → Lista componentes disponíveis

  GET /api/docentes/vinculos?id_docente=X
    → Vínculos atuais do docente

  POST /api/docentes/vinculos { id_docente, vinculos: [{ id_componente }] }
    → Substitui vínculos do docente

Convite:
  POST /api/docentes/gerar-convite { id_docente }
    → Gera token + link + webhook Power Automate

  POST /api/docentes/enviar-convite { id_docente, email }
    → Envia email com link de cadastro

  POST /api/docentes/enviar-convite-login { id_docente, email }
    → Envia convite para criar conta (login page)
```

### Aba 4 — Currículos

```
Orquestrador → DocentesTabCurriculos.vue
  Composables: useDocentesCurriculos

Listar:
  GET /api/docentes/curriculos?id_entidade=X
    → RPC aca_get_propostas_docente(p_id_entidade)
    → Retorna { itens: [{ nome, email, telefone, minibio, criado_em, ... }] }

Criar (envio público via /trabalhe-conosco):
  POST /api/docentes/curriculos { id_entidade, nome, email, telefone, minibio, id_curriculo }
    → RPC aca_upsert_proposta_docente(...)

Deletar:
  DELETE /api/docentes/curriculos?id=X
```

---

## APIs

### BFFs internos (`/api/docentes/*`)

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/docentes/editais` | → RPC `aca_get_editais_docente` |
| `POST` | `/docentes/editais` | → RPC `aca_upsert_edital_docente` |
| `DELETE` | `/docentes/editais` | → RPC `aca_delete_edital_docente` |
| `GET` | `/docentes/editais-dropdown` | → RPC `aca_get_editais_docente` (dropdown) |
| `GET` | `/docentes/formularios-disponiveis` | → RPC `frm_get_formularios_salvos` |
| `GET` | `/docentes/inscricoes` | → RPC `aca_get_inscricoes_edital` |
| `POST` | `/docentes/inscricoes` | → RPC `aca_avaliar_inscricao_docente` |
| `GET` | `/docentes/docentes` | → RPC `aca_get_docentes` |
| `POST` | `/docentes/docentes` | → RPC `aca_get_docentes` |
| `DELETE` | `/docentes/docentes` | → RPC `aca_delete_docente` |
| `GET` | `/docentes/docente-detalhes` | → query user_expandido + respostas |
| `POST` | `/docentes/cadastro-completo` | → RPC `aca_criar_docente_completo` |
| `POST` | `/docentes/valor-hora-aula` | → UPDATE aca_docente |
| `POST` | `/docentes/atualizar-dados` | → upsert respostas |
| `GET` | `/docentes/componentes` | → query aca_componente |
| `GET` | `/docentes/vinculos` | → query aca_docente_vinculo |
| `POST` | `/docentes/vinculos` | → delete + insert vínculos |
| `GET` | `/docentes/curriculos` | → RPC `aca_get_propostas_docente` |
| `POST` | `/docentes/curriculos` | → RPC `aca_upsert_proposta_docente` |
| `DELETE` | `/docentes/curriculos` | → RPC `aca_delete_proposta_docente` |
| `POST` | `/docentes/gerar-convite` | → RPC `aca_gerar_convite_docente` + webhook |
| `POST` | `/docentes/enviar-convite` | → webhook Power Automate |
| `POST` | `/docentes/enviar-convite-login` | → webhook Power Automate |
| `POST` | `/docentes/gerar-codigo` | → RPC `aca_gerar_codigo_verificacao` |
| `POST` | `/docentes/verificar-codigo` | → RPC `aca_verificar_codigo` |

### APIs externas usadas

| Endpoint | Motivo |
|---|---|
| Power Automate (webhooks) | Envio de convites e códigos por email |
| `https://viacep.com.br/ws/{cep}/json/` | Preenchimento automático de endereço (cadastro) |

---

## Estrutura do Banco

### Tabelas do módulo docente

```sql
aca_docente                       -- Docente (vinculado a user_expandido)
  id, id_entidade, id_user_expandido, ativo, valor_hora_aula
  criado_por, criado_em, modificado_por, modificado_em

aca_docente_vinculo               -- Componentes que o docente leciona
  id, id_docente, id_componente
  (FK → aca_componente, tabela já existente)

aca_edital_docente                -- Editais / oportunidades
  id, id_entidade, nome, descricao, data_ini, data_fim, status, id_form_config
  criado_por, criado_em, modificado_por, modificado_em

aca_edital_docente_inscricao      -- Candidatos inscritos em editais
  id, id_edital, id_candidato, status (aguardando/aprovado/recusado/suplente)
  criado_por, criado_em, modificado_por, modificado_em

aca_docente_proposta              -- Currículos enviados espontaneamente
  id, id_entidade, nome, email, telefone, minibio, id_curriculo
  lido, considerado, criado_em

aca_docente_convite               -- Convites gerados
  id, id_docente, token, convite_enviado, criado_em
```

### User_expandido (colunas extras)

```sql
codigo_verificacao_hash           -- Hash SHA-256 do código
codigo_verificacao_expira         -- TIMESTAMPTZ
codigo_verificacao_tentativas     -- INT (max 5)
email_verificado                  -- BOOLEAN
```

---

## Lógica de Negócio

### Fluxo de cadastro de docente

1. **Admin cadastra** via modal → `aca_criar_docente_completo`:
   - Cria `user_expandido` (sem auth)
   - Cria `aca_docente`
   - Salva respostas do formulário
   - Vincula entidade (`user_entidade_user`)

2. **Admin convida** → gera token + link → webhook Power Automate → email

3. **Docente acessa link** → cadastra senha → `signUp()` → `vincular-conta`:
   - Vincula `id_user` ao `user_expandido`
   - Atribui papel `aca_docente`
   - Cria `user_entidade_user` (se não existir)

### Status da inscrição em edital

- **`aguardando`** → candidato se inscreveu
- **`aprovado`** → admin aprovou
- **`recusado`** → admin recusou
- **`suplente`** → lista de espera

### Valor hora/aula
- Coluna `valor_hora_aula` (INTEGER, centavos) em `aca_docente`
- Só o admin pode editar (via modal no card)
- Não é exposto ao docente no auto-cadastro

### Papéis
- `aca_docente` → papel atribuído ao vincular auth user
- `aca_candidato` → papel temporário até aprovação manual (fluxo público)
- Determinado automaticamente em `vincular-conta.post.ts`

### Vínculo com componentes
- Tabela `aca_docente_vinculo` (FK → `aca_componente`)
- Substituição atômica: deleta todos + insere novos
- Componentes pré-existentes (tabela `aca_componente` do módulo acadêmico)

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `loading` | Skeleton / spinner |
| `editais.length === 0` | "Nenhum edital encontrado" |
| `docentes.length === 0` | "Nenhum docente encontrado" |
| `sem_tem_conta` | Badge "Aguardando conta" (âmbar) |
| `tem_conta` | Badge "Conta ativa" (verde) |
| Modal edital | Form com nome, descrição, datas, status, dropdown de formulário |
| Modal docente | Form com perguntas globais + valor hora/aula |
| Modal vínculos | Lista de componentes com checkboxes |
| Modal avaliar | Detalhes do candidato + botões Aprovar/Recusar/Suplente |

---

## Contrato Visual Aplicado

(mesmo design system das páginas Processos Seletivos e Matrículas)

- **Layout**: `base` com sidebar
- **Tabs**: `tabs-nav` com `tab-btn` / `tab-btn--active`
- **Cards docente**: `bg-[#0f0f17] border border-white/5 rounded-xl`
- **Badge conta**: `px-2 py-0.5 rounded text-[8px] font-black`
  - Ativa: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`
  - Pendente: `bg-amber-500/10 text-amber-400 border-amber-500/20`
- **Modais**: overlay `rgba(0,0,0,0.85)`, painel `#13131a`, accent bar gradient
- **Dropdown formulários**: filtrado por tipo_proc=seletivo, tipo_cand=docente, escopo=global
- **Botões**: primary (violeta), outline (borda), danger (vermelho), success (verde)

---

## Dependências com outras partes do sistema

### Tabelas reusadas
- `user_expandido` — usado em matrículas e processos
- `user_entidade_user` — vinculo de entidade
- `user_papeis` / `user_papeis_auth` — roles
- `aca_componente` — do módulo acadêmico (plano de ensino)
- `cmct_pergunta_form` / `aca_form_config` / `aca_resposta_form` — engine de formulários

### BFFs reusados
- `/api/auth/*` — verificar email, criar conta, vincular auth
- `/api/formularios/form_config` — carregar perguntas do formulário
- `/api/r2/upload` — upload de currículos

### Fluxo público
- `/trabalhe-conosco` → envia proposta espontânea → aparece em aba Currículos
- `/inscricao-edital/[id]` → inscrição em edital → aparece em aba Seleção

---

## Histórico de Mudanças

### 2026-07-14 a 2026-07-20 — Criação do módulo

**Banco de dados:**
- 24 migrations (00000-00024) para tabelas, RPCs, RLS, fixes
- Tabelas: `aca_docente`, `aca_docente_vinculo`, `aca_edital_docente`, `aca_edital_docente_inscricao`, `aca_docente_proposta`, `aca_docente_convite`
- RPCs: CRUD completo para cada tabela + cadastro completo + convite + código verificação

**BFFs:**
- 24 endpoints em `server/api/docentes/`
- CRUD completo para editais, docentes, inscrições, currículos, vínculos

**Composables:**
- `useDocentesCore` — abas fixas (editais/selecao/docentes/curriculos)
- `useDocentesEditais` — CRUD editais + formulários disponíveis
- `useDocentesSelecao` — listar/avaliar candidatos
- `useDocentesLista` — CRUD docentes + vínculos + convites
- `useDocentesCurriculos` — propostas espontâneas

**Componentes:**
- 4 tabs + 4 modais (edital, docente, vínculos, avaliar)

**Página:**
- `pages/docentes/index.vue` — orquestrador com initSession, tabs, modais
- `layouts/base.vue` — pageTitle para `/docentes`

**Fluxo público integrado:**
- Página `/trabalhe-conosco` → envia proposta → aba Currículos
- Página `/inscricao-edital/[id]` → inscrição → aba Seleção
