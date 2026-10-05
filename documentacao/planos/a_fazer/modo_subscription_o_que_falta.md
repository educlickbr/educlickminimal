# Plano — Modo Assinatura (Subscription) no Checkout

## Objetivo

Suportar ofertas com pagamento **recorrente** (assinatura mensal/anual) além do pagamento único atual. Stripe gerencia as cobranças automaticamente; o contrato define um prazo mínimo de fidelidade.

---

## O que já temos

| Item | Status |
|---|---|
| `com_oferta.tipo_pagamento` | Enum `'unico' / 'recorrente'` |
| `com_oferta.recorrencia_periodo` | `'mensal'`, `'anual'`, etc. |
| `com_oferta.recorrencia_intervalo` | `1` (ex: a cada 1 mês) |
| ModalOferta | Já tem campos de recorrência |
| Vitrine `/oferta` | Exibe badge "Único / Recorrente" |

## O que precisa ser feito

### 1. Migration: coluna `contrato_meses`

Adicionar em `com_oferta`:

```sql
ALTER TABLE public.com_oferta ADD COLUMN contrato_meses smallint NULL;
```

- `NULL` = sem fidelidade
- `12` = 12 meses de contrato mínimo

### 2. ModalOferta (admin)

Quando `tipo_pagamento === 'recorrente'`, exibir campo **"Duração do contrato (meses)"**.

### 3. Checkout (`criar.post.ts`)

Se `tipo_pagamento === 'recorrente'`:

```ts
mode: 'subscription',
line_items: [{
  price_data: {
    currency: 'brl',
    unit_amount: valor_centavos,
    product_data: { name: oferta.nome_curto },
    recurring: {
      interval: recorrencia_periodo || 'month',
      interval_count: recorrencia_intervalo || 1,
    },
  },
  quantity: 1,
}],
subscription_data: {
  cancel_at: contrato_meses
    ? Math.floor(Date.now() / 1000) + contrato_meses * 30 * 24 * 60 * 60
    : undefined,
},
```

Senão: fluxo atual (`mode: 'payment'`).

### 4. Webhook — novos eventos

| Evento | Quando |
|---|---|
| `checkout.session.completed` | Assinatura criada (já tratado) |
| `invoice.paid` | Cobrança recorrente OK |
| `invoice.payment_failed` | Falha na cobrança |
| `customer.subscription.deleted` | Cancelamento |

Na **Edge Function**, adicionar handlers para os novos eventos.

### 5. Matrícula

`aca_matricula` pode ganhar `data_expiracao` para vínculo temporário.

---

## Fluxo completo

```
Admin cria oferta recorrente → Aluno compra → Stripe subscription
  → Webhook checkout.session.completed → pedido + matrícula
  → Todo mês Stripe cobra → invoice.paid → renovação período
  → Fim do contrato → subscription.deleted → matrícula inativa
```

---

## Arquivos a alterar

| Arquivo | Mudança |
|---|---|
| Migration nova | Coluna `contrato_meses` |
| `ModalOferta.vue` | Campo duração contrato |
| `checkout/criar.post.ts` | `mode: 'subscription'` |
| `stripe-webhook/index.ts` | Eventos de assinatura |

---

## Observações

- Stripe no Brasil **não aceita subscription** para boleto ou Pix — apenas cartão
- `cancel_at` é data absoluta em Unix timestamp
