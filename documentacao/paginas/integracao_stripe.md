# Integração Stripe — Camada Comercial

## Visão Geral

Integração de pagamentos via **Stripe Connect** com suporte a múltiplas entidades (cada escola/conta tem sua própria conta Stripe conectada).

Arquitetura:

```
Aluno → /checkout/[slug] → Stripe Checkout → Paga → Webhook (Edge Function) → Atualiza pedido + Cria matrícula
```

---

## Componentes

### 1. Stripe Connect (OAuth)

Cada entidade (escola) conecta sua conta Stripe via fluxo OAuth.

**Frontend:** `pages/configuracoes/pagamento.vue`
**BFFs:**
- `server/api/comercial/stripe-connect/index.get.ts` — inicia OAuth, redireciona pro Stripe
- `server/api/comercial/stripe-connect/callback.get.ts` — recebe o código de autorização, troca por `stripe_account_id` e salva no banco

**Tabela:** `com_config_gateway`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id_entidade` | UUID FK | Entidade dona da conta |
| `gateway_name` | text | `'stripe'` |
| `stripe_account_id` | text | ID da conta conectada Stripe |
| `is_sandbox` | boolean | true = modo teste |

### 2. Checkout (Criação de Sessão)

**BFF:** `server/api/comercial/checkout/criar.post.ts`

**Fluxo:**
1. Recebe `id_oferta`
2. Busca dados da oferta + produto + programa
3. Cria pedido com status `pendente`
4. Cria sessão Stripe Checkout com `stripeAccount` (conta conectada)
5. Metadados da sessão:
   - `pedido_id` — UUID do pedido
   - `id_oferta` — UUID da oferta
   - `id_programa` — UUID do programa (para criar matrícula)
   - `id_entidade` — UUID da entidade
   - `id_usuario` — UUID do user_expandido

### 3. Webhook (Confirmação de Pagamento)

**Edge Function:** `supabase/functions/stripe-webhook/index.ts`

**Fluxo:**
1. Stripe envia evento `checkout.session.completed`
2. Edge Function valida assinatura com `constructEventAsync`
3. Atualiza pedido para `concluido` + salva `payment_intent`
4. Cria matrícula em `aca_matricula` via RPC `aca_criar_matricula`

**Deploy:**
```sh
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

**URL no Stripe Dashboard:**
```
https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook
```

**Escopo:** Contas conectadas

### 4. Fluxo Grátis

Quando `valor_centavos = 0`, o checkout/criar já define o pedido como `concluido` e cria a matrícula imediatamente — sem passar pelo Stripe.

---

## Segredos (Edge Function)

| Secret | Origem | Obrigatório |
|---|---|---|
| `STRIPE_SECRET_KEY` | `.env` local | Sim |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard (Webhooks) | Sim |
| `SUPABASE_URL` | Auto-injetado | — |
| `SUPABASE_SECRET_KEYS` | Auto-injetado (service_role) | — |

---

## Tabelas Envolvidas

| Tabela | Função |
|---|---|
| `com_config_gateway` | Configuração do Stripe por entidade |
| `com_pedido` | Registro de cada transação |
| `com_oferta` | Oferta com valor em centavos |
| `com_produto` | Produto vinculado ao programa |
| `aca_matricula` | Matrícula acadêmica criada após pagamento |
| `aca_programa` | Programa (gratuito, exige_processo_seletivo) |

---

## Preparação para Produção

### 1. Stripe — Modo Live

- No Stripe Dashboard, ativar chaves **live** (`sk_live_...`, `pk_live_...`)
- Atualizar `STRIPE_SECRET_KEY` nos segredos da Edge Function
- Criar **Conta Connect** em modo live para as entidades
- Atualizar URLs de redirecionamento (OAuth + webhook) para produção

### 2. URLs

| Finalidade | Desenvolvimento | Produção |
|---|---|---|
| Connect OAuth callback | ngrok + `/stripe-connect/callback` | `https://app.educlick.com.br/api/comercial/stripe-connect/callback` |
| Webhook | Edge Function do Supabase | Mesma Edge Function (já pública) |
| Checkout redirect | `http://localhost:3006/checkout/sucesso` | `https://app.educlick.com.br/checkout/sucesso` |

### 3. Webhook

- Já configurado via Edge Function (pública, sem verificação JWT)
- Criar endpoint em **Developers → Webhooks** com escopo **Contas conectadas**
- Evento: `checkout.session.completed`
- Signing secret deve ser atualizado nos segredos da Edge Function

### 4. Ambiente

- Remover dependência de `stripe listen` CLI
- Ngrok só é necessário para conectar NOVAS contas Stripe (OAuth)

---

## Histórico

### 2026-07-10 — Webhook migrado para Edge Function

- **Antes:** webhook no Nuxt BFF (`server/api/comercial/checkout/webhook.post.ts`) — removido
- **Agora:** Edge Function `stripe-webhook` no Supabase
- Razão: evitar RLS (service_role na Edge) + endpoint público + sem ngrok
- Bypass de RLS via `SUPABASE_SECRET_KEYS` (auto-injetado) em vez de `SUPABASE_SERVICE_ROLE_KEY` (deprecated)
- `constructEventAsync` obrigatório no Deno Edge Runtime (SubtleCrypto assíncrono)
