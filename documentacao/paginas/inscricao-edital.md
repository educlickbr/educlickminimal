# Página Inscrição em Edital (`/inscricao-edital/[id]`)

## Visão Geral

Página **pública** para candidatos se inscreverem em editais de docentes:

- **Fluxo completo** — login/cadastro → formulário → envio → confirmação
- **Reconhecimento de sessão** — se já logado, pula etapa de auth
- **Detecção de inscrição prévia** — se já inscrito, mostra "Inscrição já realizada" com data
- **Formulário dinâmico** — carregado via `frm_get_form_config`, com tipos: text, email, cpf, cep, endereco, textarea, data, select, file, foto
- **Validação inline** — CPF validado no front (`validarCPF`) e duplicidade checada no backend (RPC)
- **CEP automático** — preenche endereço, bairro, cidade, estado via VIACEP

**Rota:** `/inscricao-edital/[id]` | **Layout:** `false` (nenhum) | **Tipo:** Página única (sem SSR)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Página → BFF → RPC (SECURITY DEFINER) → Banco**

```
front_end/
app/pages/inscricao-edital/[id].vue       ← página única (~650 linhas)
server/api/public/
├── editais-docentes.get.ts                ← GET editais ativos
├── inscrever-edital.post.ts               ← POST criar inscrição
└── verificar-inscricoes.get.ts            ← GET inscrições do candidato
server/api/auth/
├── verificar-email.get.ts                 ← GET verifica email + auth
├── enviar-codigo.post.ts                  ← POST gera e envia código
├── criar-conta.post.ts                    ← POST cria conta auth
└── vincular-conta.post.ts                 ← POST vincula auth → user_expandido
server/api/formularios/
└── form_config.get.ts                     ← GET perguntas do form

supabase/migrations/
├── 20260713100030_rpc_inscrever_edital_publico.sql
├── 20260713100031_fix_inscricao_publica.sql
├── 20260713100032_fix_security_invoker.sql
├── 20260713100025_public_editais_rpc.sql       ← aca_get_editais_publicos
├── 20260713100038_fix_public_editais_add_id_form_config.sql
├── 20260713100040_fix_frm_get_form_config_definer.sql
├── 20260713100041_add_cpf_duplicate_check.sql
└── 20260713100042_add_criado_por_inscricao.sql
```

---

## Fluxo de Dados

### Etapas da página

```
etapa.value: "auth" | "loading" | "form" | "sucesso" | "erro" | "ja-inscrito"
```

### 1. Montagem (`onMounted`)

```
supabase.auth.getUser()
  ├── Se logado sem inscrição → etapa="loading" → carregarForm()
  ├── Se logado com inscrição  → etapa="ja-inscrito" (mostra data)
  └── Se deslogado             → etapa="auth" (mostra email + login/cadastro)
```

### 2. Verificação de email (`verificarEmail`)

```
blur no email
  → GET /api/auth/verificar-email?email=X
    → RPC auth_verificar_email(p_email) [SECURITY DEFINER]
      → Verifica user_expandido + auth.users
      → Se existe user_expandido sem id_user → pode_criar_conta=true
      → Se existe user_expandido com id_user → pode_criar_conta=false
      → Se auth existe sem user_expandido → corrige vínculo automaticamente
  → Mostra login (senha) OU onboarding (criar senha)
```

### 3. Login (`fazerLogin`)

```
signInWithPassword(email, password)
  → etapa="loading"
  → carregarForm()
```

### 4. Cadastro (`criarConta`)

```
signUp(email, password)
  ├── Se "User already exists" → login automático
  ├── Se novo → vincular-conta (RPC aca_find_or_create_user_expandido)
  └── refreshSession() → carregarForm()
```

### 5. Carregar formulário (`carregarForm`)

```
GET /api/public/editais-docentes?id_entidade=X
  → RPC aca_get_editais_publicos(p_id_entidade) [SECURITY DEFINER]
  → Filtra edital por id + ativo

GET /api/formularios/form_config?id_entidade=X&escopo=global&tipo_proc=seletivo&tipo_cand=docente
  → RPC frm_get_form_config(p_id_entidade, ..., p_escopo) [SECURITY DEFINER]
  → Retorna perguntas com tipo, label, placeholder, opcoes, obrigatorio, largura
  → Filtra duplicatas de sys-nome / sys-email
  → sysQuestions: "Nome" + "E-mail" (preenchidos, disabled)
```

### 6. Submissão (`handleSubmit`)

```
Validação front:
  → CPF válido (validarCPF da utils/cpf.ts)

POST /api/public/inscrever-edital { id_edital, id_entidade, respostas }
  → serverSupabaseUser → passa criado_por
  → RPC aca_get_editais_publicos (verifica edital ativo)
  → RPC aca_inscrever_edital_publico(p_id_edital, p_id_entidade, p_nome, p_email, p_respostas, p_criado_por)
    [SECURITY DEFINER]
    → 0. Verifica CPF duplicado em aca_resposta_form
    → 1. Cria/busca user_expandido
    → 2. Vincula entidade (user_entidade_user)
    → 3. Salva respostas (aca_resposta_form)
    → 4. Cria inscrição (aca_edital_docente_inscricao) com criado_por
  → etapa="sucesso"
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/public/editais-docentes` | → RPC `aca_get_editais_publicos` |
| `POST` | `/api/public/inscrever-edital` | → RPC `aca_inscrever_edital_publico` + `aca_get_editais_publicos` |
| `GET` | `/api/public/verificar-inscricoes` | → RPC `auth_verificar_email` + query `aca_edital_docente_inscricao` |
| `GET` | `/api/auth/verificar-email` | → RPC `auth_verificar_email` |
| `POST` | `/api/auth/enviar-codigo` | → RPC `aca_gerar_codigo_verificacao` |
| `POST` | `/api/auth/criar-conta` | → RPC `aca_verificar_codigo` |
| `POST` | `/api/auth/vincular-conta` | → RPC `aca_find_or_create_user_expandido` + `aca_vincular_auth_user` + `aca_atribuir_papel_auth` |
| `GET` | `/api/formularios/form_config` | → RPC `frm_get_form_config` |

### APIs externas usadas

| Endpoint | Motivo |
|---|---|
| `https://viacep.com.br/ws/{cep}/json/` | Preenchimento automático de endereço |
| Power Automate (webhooks) | Envio de código de verificação e link de cadastro por email |

---

## Fluxo de Autenticação

### Login normal (já tem conta)
```
email → verificarEmail → existe + tem auth → campo senha → Entrar → form
```

### Onboarding (pré-cadastrado sem conta)
```
email → verificarEmail → existe + sem auth → "Clique aqui para criar"
  → Enviar Código (webhook Power Automate)
  → Digitar código + senha
  → signUp() + vincular-conta → form
```

### Link de cadastro (nunca viu a plataforma)
```
Link recebido por email → /cadastro-docente/[token]
  → Formulário com senha → signUp() + vincular-conta → pronto
```

---

## Lógica de Negócio

### Tabelas envolvidas

```sql
user_expandido        -- Dados do candidato (nome, email, id_user)
aca_edital_docente    -- Editais (nome, descricao, data_ini, data_fim, status, id_form_config)
aca_form_config       -- Config de formulário (pergunta_id por tipo/cand/escopo)
cmct_pergunta_form    -- Perguntas (tipo_pergunta, label, placeholder, opcoes)
aca_resposta_form     -- Respostas (id_pergunta, resposta, id_user_expandido)
aca_edital_docente_inscricao -- Inscrições (id_edital, id_candidato, status, criado_por)
user_entidade_user    -- Vínculo candidato-entidade
user_papeis_auth      -- Papel do usuário (aca_candidato)
```

### Status da inscrição
- **`aguardando`** → inscrição recebida, aguardando avaliação

### Papel atribuído
- Candidato recém-cadastrado → `aca_candidato`
- Só vira `aca_docente` quando aprovado manualmente

### CPF duplicado
- Verificado dentro da RPC `aca_inscrever_edital_publico` (transação atômica)
- Checa `aca_resposta_form` para mesma `pergunta_id` = CPF e mesmo valor

### Formulário dinâmico
- Escopo `global`, tipo_proc `seletivo`, tipo_cand `docente`
- Perguntas `sys-nome` e `sys-email` são sintéticas (sempre adicionadas)
- Demais perguntas vêm da RPC `frm_get_form_config`
- Filtro de duplicatas por `pergunta_id` e label

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `auth` (deslogado) | Email + senha OU onboarding (criar conta) |
| `loading` | Spinner + texto "Carregando..." |
| `form` | Formulário com perguntas em grid 2 colunas |
| `sucesso` | "Inscrição Realizada!" com botão Voltar |
| `erro` | Mensagem vermelha com detalhe do erro |
| `ja-inscrito` | "Inscrição já realizada!" com data |

---

## Contrato Visual Aplicado

- **Layout**: nenhum (página isolada, sem sidebar)
- **Header**: sticky com logo + botão Sair + Voltar
- **Card principal**: `bg-[#0f0f17] border border-white/5 rounded-xl p-8`
- **Inputs**: `bg-white/[0.04] border-white/7 rounded-lg px-4 py-2.5 text-xs font-bold`
- **Grid do form**: `grid-cols-1 md:grid-cols-2 gap-5`
- **Labels**: `text-[10px] font-black uppercase tracking-widest text-secondary/60`
- **Botão submit**: gradient `from-[#7c3aed] to-[#8b5cf6]` com shadow
- **Badge de sucesso**: `bg-emerald-500/10 border-emerald-500/20 text-emerald-400`
- **Campos disabled**: opacidade 40%
- **Tema**: escuro (`#0a0a0c`), bordas `white/5`, textos `text-secondary/60`

---

## Dependências com outras partes do sistema

### Utils compartilhadas
- `~/utils/cpf` — `validarCPF`, `mascaraCPF`, `limparCPF`
- `~/utils/viacep` — `buscarCEP`, `mascaraCEP`, `CEP_DEPENDENT_FIELDS`

### BFFs compartilhados
- `/api/auth/*` — reusados da página de login
- `/api/formularios/form_config` — reusado do admin de formulários
- `/api/public/*` — específicos da página pública de editais

### Power Automate
- `POWER_AUTOMATE_LINK` — envia link de cadastro
- `POWER_AUTOMATE_TOKEN_CADASTRO` — envia código de verificação
- `POWER_AUTOMATE_CONVITE` — envia convite para criar conta

---

## Histórico de Mudanças

### 2026-07-20 — Criação da documentação

**Funcionalidades implementadas:**
- Página única `/inscricao-edital/[id]` com layout=none
- Fluxo completo: auth → form → submissão → sucesso
- Reconhecimento de sessão (se logado, pula auth)
- Detecção de inscrição prévia ("ja-inscrito" com data)
- Validação de CPF inline + duplicidade no backend
- Autocomplete de CEP com VIACEP
- Upload de arquivos (placeholder funcional)
- Sessão: logout inline
- RPCs públicas como SECURITY DEFINER para funcionar sem auth
- Migration `00038`: `aca_get_editais_publicos` com `id_form_config`
- Migration `00040`: `frm_get_form_config` como DEFINER
- Migration `00041`: CPF duplicado na RPC de inscrição
- Migration `00042`: `criado_por` na inscrição
