# Plano — Camada Comercial (Módulo `com_*`)

> 📐 **Arquitetura:** Este plano segue o padrão de desacoplamento documentado em [`documentacao/guias/guia_refatoracao_desacoplamento.md`](../guias/guia_refatoracao_desacoplamento.md).
>
> **Pipeline de cada página:** Orquestrador → Componente de tab → Composable → BFF → RPC → Banco

---

## Objetivo

Criar a estrutura comercial completa do EduClick: produtos, ofertas, checkout e gestão de pedidos — integrada ao módulo acadêmico existente.

---

## Sumário do Modelo de Dados

```
aca_programa (existente)
  ├── gratuito boolean                ← novo
  ├── exige_processo_seletivo boolean ← novo
  │
  ├── com_produto (1 programa → N produtos)
  │     └── com_oferta (1 produto → N ofertas)
  │           ├── com_oferta_elegivel (1 oferta → N elegíveis)
  │           └── com_pedido (1 oferta → N pedidos)
  │
  ├── aca_processo_seletivo (existente, 1 programa → N processos)
  │     └── aca_processo_seletivo_inscricoes (existente)
  │           └── com_pedido.id_inscricao (FK opcional)
  │
  └── com_config_gateway (1 entidade → 1 config) ← FASE 4
```

---

## FASE 0 — Migrações no Banco de Dados

> **Ordem obrigatória**: respeitar as dependências de FK.

### 0.1 Migration `academico` — Novos campos em `aca_programa`

```sql
ALTER TABLE public.aca_programa
  ADD COLUMN gratuito boolean NOT NULL DEFAULT true,
  ADD COLUMN exige_processo_seletivo boolean NOT NULL DEFAULT false;
```

**Impacto:** Programas existentes viram `gratuito = true` por padrão. Nada quebra — é opt-in.

---

### 0.2 Migration — `com_produto`

```sql
CREATE TABLE public.com_produto (
    id               uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade      uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_programa      uuid NOT NULL REFERENCES public.aca_programa(id) ON DELETE CASCADE,
    nome_produto     text NOT NULL,
    descricao        text,
    tipo_recorrencia text NOT NULL DEFAULT 'unico',  -- 'unico' | 'recorrente'
    is_ativo         boolean DEFAULT true NOT NULL,

    -- Auditoria (padrão do módulo acadêmico)
    criado_por       uuid REFERENCES public.user_expandido(id),
    modificado_por   uuid REFERENCES public.user_expandido(id),
    criado_em        timestamptz DEFAULT now(),
    modificado_em    timestamptz DEFAULT now(),

    CONSTRAINT com_produto_pkey PRIMARY KEY (id),
    CONSTRAINT com_produto_unique_nome UNIQUE (id_entidade, id_programa, nome_produto)
);

ALTER TABLE public.com_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "com_policy_all_access_produto"
ON public.com_produto FOR ALL
USING (
    (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
        WHERE e::uuid = com_produto.id_entidade
    )
);
```

---

### 0.3 Migration — Types + `com_oferta`

```sql
CREATE TYPE public.tipo_visibilidade AS ENUM ('publica', 'oculta');
CREATE TYPE public.tipo_pagamento_oferta AS ENUM ('unico', 'recorrente');

CREATE TABLE public.com_oferta (
    id                    uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade           uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_produto            uuid NOT NULL REFERENCES public.com_produto(id) ON DELETE CASCADE,
    slug                  text NOT NULL,
    nome_curto            text,

    -- Preço
    valor_centavos        int4 DEFAULT 0 NOT NULL,

    -- Config de pagamento
    tipo_pagamento        tipo_pagamento_oferta DEFAULT 'unico' NOT NULL,
    parcelamento_maximo   int2 DEFAULT 1 NOT NULL,      -- 1 = à vista
    recorrencia_periodo   text,                          -- 'mensal', 'anual'
    recorrencia_intervalo int2 DEFAULT 1,                -- a cada N períodos

    -- Vigência
    disponivel_a_partir_de timestamptz,
    disponivel_ate         timestamptz,

    -- Controle de acesso
    visibilidade           tipo_visibilidade DEFAULT 'publica' NOT NULL,
    exige_elegibilidade    boolean DEFAULT false NOT NULL,
    is_ativa               boolean DEFAULT true NOT NULL,

    -- Auditoria
    criado_por       uuid REFERENCES public.user_expandido(id),
    modificado_por   uuid REFERENCES public.user_expandido(id),
    criado_em        timestamptz DEFAULT now(),
    modificado_em    timestamptz DEFAULT now(),

    CONSTRAINT com_oferta_pkey PRIMARY KEY (id),
    CONSTRAINT com_oferta_slug_entidade_key UNIQUE (id_entidade, slug)
);

ALTER TABLE public.com_oferta ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_com_oferta_vitrine
ON public.com_oferta (id_entidade, is_ativa, visibilidade, disponivel_a_partir_de, disponivel_ate);

-- RLS admin
CREATE POLICY "com_policy_all_access_oferta"
ON public.com_oferta FOR ALL
USING (
    (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
        WHERE e::uuid = com_oferta.id_entidade
    )
);

-- RLS público (leitura)
CREATE POLICY "com_policy_select_public_oferta"
ON public.com_oferta FOR SELECT
USING (
    visibilidade = 'publica'
    AND is_ativa = true
    AND (disponivel_a_partir_de IS NULL OR disponivel_a_partir_de <= now())
    AND (disponivel_ate IS NULL OR disponivel_ate >= now())
);
```

---

### 0.4 Migration — `com_oferta_elegivel`

```sql
CREATE TABLE public.com_oferta_elegivel (
    id            uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade   uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_oferta     uuid NOT NULL REFERENCES public.com_oferta(id) ON DELETE CASCADE,
    email         text NOT NULL,
    cpf           text,
    utilizado_em  timestamptz,
    expirado_em   timestamptz,

    criado_por    uuid REFERENCES public.user_expandido(id),
    criado_em     timestamptz DEFAULT now(),

    CONSTRAINT com_oferta_elegivel_pkey PRIMARY KEY (id),
    CONSTRAINT com_oferta_elegivel_oferta_email_key UNIQUE (id_oferta, email)
);

ALTER TABLE public.com_oferta_elegivel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "com_policy_select_self_elegivel"
ON public.com_oferta_elegivel FOR SELECT
USING (email = auth.jwt() ->> 'email');
```

---

### 0.5 Migration — `com_pedido`

```sql
CREATE TYPE public.tipo_status_pedido AS ENUM ('pendente', 'concluido', 'cancelado', 'reembolsado');

CREATE TABLE public.com_pedido (
    id                       uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade              uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    id_oferta                uuid NOT NULL REFERENCES public.com_oferta(id) ON DELETE CASCADE,
    id_usuario               uuid NOT NULL REFERENCES public.user_expandido(id),
    id_inscricao             uuid REFERENCES public.aca_processo_seletivo_inscricoes(id),

    status                   tipo_status_pedido DEFAULT 'pendente' NOT NULL,
    valor_pago_centavos      int4 NOT NULL DEFAULT 0,

    stripe_checkout_id       text,
    stripe_payment_intent_id text,

    pago_em                  timestamptz,
    cancelado_em             timestamptz,

    criado_por       uuid REFERENCES public.user_expandido(id),
    modificado_por   uuid REFERENCES public.user_expandido(id),
    criado_em        timestamptz DEFAULT now(),
    modificado_em    timestamptz DEFAULT now(),

    CONSTRAINT com_pedido_pkey PRIMARY KEY (id)
);

ALTER TABLE public.com_pedido ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_com_pedido_usuario ON public.com_pedido (id_usuario);
CREATE INDEX idx_com_pedido_status  ON public.com_pedido (status);

CREATE POLICY "com_policy_all_access_pedido"
ON public.com_pedido FOR ALL
USING (
    (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
    AND EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
        WHERE e::uuid = com_pedido.id_entidade
    )
);

CREATE POLICY "com_policy_select_self_pedido"
ON public.com_pedido FOR SELECT
USING (
    id_usuario = (SELECT id FROM public.user_expandido WHERE id_user = auth.uid())
);
```

---

### 0.6 Migration — `com_config_gateway` (posterior, apenas schema)

> ⚠️ **Adiada para FASE 4.** Stripe Connect vs chaves manuais será decidido na implementação.

```sql
CREATE TABLE public.com_config_gateway (
    id                      uuid DEFAULT gen_random_uuid() NOT NULL,
    id_entidade             uuid NOT NULL REFERENCES public.user_entidades(id) ON DELETE CASCADE,
    gateway_name            text DEFAULT 'stripe' NOT NULL,
    is_sandbox              boolean DEFAULT true NOT NULL,
    stripe_account_id       text,

    criado_em               timestamptz DEFAULT now(),
    modificado_em           timestamptz DEFAULT now(),

    CONSTRAINT com_config_gateway_pkey PRIMARY KEY (id),
    CONSTRAINT com_config_gateway_id_entidade_key UNIQUE (id_entidade)
);
```

---

## FASE 1 — Backend (BFFs)

> **Padrão:** `server/api/comercial/<entidade>.<metodo>.ts`
>
> - Toda leitura/escrita via **RPC** (`client.rpc('minha_rpc', params)`)
> - Zero query direta `client.from('tabela').select()`
> - Validação de erros de constraint traduzidos para o front

### 1.1 — `server/api/comercial/` (BFFs do módulo)

| Método | Endpoint | RPC | Descrição |
|---|---|---|---|
| `GET` | `/api/comercial/produtos` | `com_get_produtos` | Listar produtos da entidade (filtro opcional `id_programa`) |
| `POST` | `/api/comercial/produtos` | `com_upsert_produto` | Criar/editar produto |
| `DELETE` | `/api/comercial/produtos` | `com_delete_produto` | Excluir (verifica se há ofertas vinculadas) |
| `GET` | `/api/comercial/ofertas` | `com_get_ofertas` | Listar ofertas da entidade |
| `POST` | `/api/comercial/ofertas` | `com_upsert_oferta` | Criar/editar oferta |
| `DELETE` | `/api/comercial/ofertas` | `com_delete_oferta` | Excluir oferta |
| `GET` | `/api/comercial/oferta-elegivel` | `com_get_elegiveis` | Listar elegíveis de uma oferta |
| `POST` | `/api/comercial/oferta-elegivel` | `com_upsert_elegivel` | Adicionar email/cpf |
| `DELETE` | `/api/comercial/oferta-elegivel` | `com_delete_elegivel` | Remover elegível |
| `GET` | `/api/comercial/pedidos` | `com_get_pedidos` | Listar pedidos (filtros: status, oferta, período) |
| `GET` | `/api/comercial/pedidos/[id]` | `com_get_pedido` | Detalhe do pedido |

### 1.2 — `server/api/public/` (Vitrine pública)

| Método | Endpoint | RPC | Descrição |
|---|---|---|---|
| `GET` | `/api/public/ofertas` | `com_get_ofertas_publicas` | Listar ofertas públicas + ativas + vigentes |
| `POST` | `/api/public/verificar-elegibilidade` | `com_verificar_elegibilidade` | Verificar se email logado é elegível |

### 1.3 — `server/api/comercial/checkout/` (Checkout)

| Método | Endpoint | Ação |
|---|---|---|
| `POST` | `/api/comercial/checkout/criar` | Criar pedido + retornar URL de redirecionamento (ou concluir direto se gratuito) |
| `POST` | `/api/comercial/checkout/webhook` | (FASE 4) Webhook Stripe |

---

## FASE 2 — Frontend (Páginas Administrativas)

### 2.1 Refatorar `academico_oferta` — Tab Programas

**Pipeline:** Orquestrador (existente) → `OfertaTabProgramas.vue` → `useOfertaProgramas.ts` (modificado) → BFF → RPC

**Arquivos afetados:**

| Arquivo | Mudança |
|---|---|
| `components/academico_oferta/OfertaTabProgramas.vue` | Adicionar badges `GRATUITO` / `PAGO` e `C/ SELEÇÃO` / `MATRÍCULA DIRETA` nos cards |
| `components/academico_oferta/programa/ProgramaStepConclusao.vue` | Adicionar toggles `gratuito` e `exige_processo_seletivo` |
| `composables/academico_oferta/useOfertaProgramas.ts` | Incluir `gratuito` e `exige_processo_seletivo` no `handleSave` |
| `composables/academico_oferta/useProgramaForm.ts` | Incluir campos no form state + `initEdit` |
| `server/api/academico_oferta/programas.post.ts` | Aceitar `gratuito` e `exige_processo_seletivo` no body |

---

### 2.2 Nova Página: `/produtos`

**Rota:** `/produtos` | **Layout:** `base`

**Estrutura (padrão desacoplado):**

```
app/pages/produtos/index.vue                         ← orquestrador (~50 linhas)
app/components/produtos/
├── ProdutosTabLista.vue                              ← grid/cards de produtos
└── ModalProduto.vue                                   ← CRUD (onSave como prop)
app/composables/produtos/
├── useProdutosCore.ts                                 ← estado base, listagem
└── useProdutosActions.ts                              ← CRUD + modais
server/api/comercial/                                  ← (já criado na FASE 1)
```

**Orquestrador (`index.vue`):**
```ts
// setup
const core = useProdutosCore()      // listagem
const actions = useProdutosActions() // modais + CRUD

const contexto = reactive({
  ...core,
  ...actions,
})
provide('produtosContext', contexto)
```

**Template do orquestrador:**
```html
<template>
  <div class="flex flex-col h-full p-6">
    <div class="flex items-center justify-between mb-6">
      <h1>Produtos</h1>
      <button @click="actions.handleNew()">Novo Produto</button>
    </div>
    <ProdutosTabLista v-if="!core.isLoading.value" />
    <div v-else>Carregando...</div>
    <ModalProduto v-if="actions.isModalOpen.value"
      :on-save="actions.handleSave"
      :produto="actions.selectedItem"
      @close="actions.closeModal()" />
  </div>
</template>
```

**`ProdutosTabLista.vue`:**
- Grid de cards (2 colunas desktop)
- Cada card: nome, programa, tipo_recorrencia, status ativo/inativo
- Botões de ação no hover (editar, excluir)
- Botão "Criar Oferta" → navega para `/ofertas?produto_id=X`

**`ModalProduto.vue`:**
- Props: `onSave`, `produto` (null = novo, objeto = edição)
- Emite: `close`
- Campos: selecionar programa (dropdown), nome, descrição, tipo_recorrencia (único/recorrente), is_ativo
- Validação front antes de chamar `onSave`
- Zero `$fetch` inline

---

### 2.3 Nova Página: `/ofertas`

> ⚠️ Página mais rica do módulo — requer atenção especial ao desacoplamento.

**Rota:** `/ofertas` | **Layout:** `base`

**Estrutura (padrão desacoplado):**

```
app/pages/ofertas/index.vue                           ← orquestrador (~70 linhas)
app/components/ofertas/
├── OfertasTabLista.vue                                ← grid/cards + filtros
├── OfertasSecaoElegiveis.vue                          ← tabela de emails (subcomponente do modal)
└── ModalOferta.vue                                     ← CRUD completo (onSave como prop)
app/composables/ofertas/
├── useOfertasCore.ts                                   ← listagem + filtros + fetchProdutos
└── useOfertasActions.ts                                ← CRUD + modais + elegíveis
server/api/comercial/                                   ← (já criado na FASE 1)
```

**Conteúdo de `OfertasTabLista.vue`:**
- Filtros: por produto (dropdown), por visibilidade (pública/oculta), por status (ativa/inativa)
- Lista em grid com cards contendo: slug, nome_curto, valor formatado, visibilidade, vigência, status
- Badges: `PUBLICA` / `OCULTA`, `GRATUITA` / `R$ XX`, `ATIVA` / `INATIVA`

**Conteúdo de `ModalOferta.vue`:**
- Props: `onSave`, `oferta` (null ou objeto), `produtos` (lista para dropdown)
- Campos:
  - Selecionar produto (dropdown)
  - Slug (autogerado a partir do nome_curto ou manual)
  - Nome curto (display)
  - Valor em centavos (input numérico formatado como moeda)
  - Tipo de pagamento: radio `único` / `recorrente`
    - Se `único`: parcelamento máximo (1 = à vista, 2, 3, ... 12)
    - Se `recorrente`: período (mensal/anual), intervalo
  - Visibilidade: radio `pública` / `oculta`
  - Vigência: data início e data fim
  - Toggle `exige_elegibilidade`
  - Toggle `is_ativa`
  - Se `exige_elegibilidade = true`: seção com tabela de emails (componente `OfertasSecaoElegiveis.vue`)
- Validação front: slug único, valor ≥ 0, datas consistentes
- Zero `$fetch` inline

**Deep linking:** `?tab=produto_id` para filtrar ofertas de um produto específico (vindo de `/produtos`).

---

### 2.4 Nova Página: `/pedidos`

**Rota:** `/pedidos` | **Layout:** `base`

**Estrutura (padrão desacoplado):**

```
app/pages/pedidos/index.vue                           ← orquestrador (~50 linhas)
app/components/pedidos/
├── PedidosTabLista.vue                                ← tabela + filtros
└── ModalPedidoDetalhe.vue                             ← detalhes do pedido
app/composables/pedidos/
├── usePedidosCore.ts                                  ← listagem + filtros
└── usePedidosActions.ts                               ← modal de detalhe
server/api/comercial/                                  ← (já criado na FASE 1)
```

**`PedidosTabLista.vue`:**
- Tabela com colunas: oferta, aluno, valor, status, data do pedido
- Filtros: por status (dropdown), por oferta (dropdown), por período (datas)
- Paginação (20 itens, scroll interno, paginação fixa no rodapé)

**`ModalPedidoDetalhe.vue`:**
- Exibe: slug da oferta, nome_curto, valor pago, status, data de criação, data de pagamento
- Se houver `id_inscricao`: link para a inscrição acadêmica
- Se houver `stripe_checkout_id`: link para o dashboard do Stripe

---

## FASE 3 — Frontend (Páginas Públicas / Aluno)

### 3.1 Refatorar Vitrine Pública `/oferta`

**Arquivo atual:** `app/pages/oferta.vue` (página única, sem desacoplamento)

**Mudança:** A página continuará sendo relativamente simples (sem abas), então o desacoplamento será leve.

**Pipeline:** Página → `useOfertaPublica.ts` → BFF → RPC

```
app/pages/oferta.vue                                     ← orquestrador (~60 linhas)
app/composables/oferta-publica/
└── useOfertaPublica.ts                                   ← fetch ofertas + verificação inscrições
server/api/public/ofertas.get.ts                          ← (criado na FASE 1)
server/api/public/programas.get.ts                        ← (existente, será substituído gradualmente)
```

**Nova lógica da página:**

1. Carregar ofertas públicas ativas via `GET /api/public/ofertas`
2. Cada oferta retorna: `{ ...oferta, produto: { nome, tipo_recorrencia }, programa: { nome, gratuito, exige_processo_seletivo } }`
3. Para cada card:
   - Se `gratuito = true` e `exige_processo_seletivo = true` → botão "Inscrever-se" (formulário)
   - Se `gratuito = true` e `exige_processo_seletivo = false` → botão "Matricular-se" (checkout direto)
   - Se `gratuito = false` → botão "Comprar R$ XX" → `/checkout/[slug]`
4. Manter verificação de já inscrito (para gratuitas com processo seletivo)
5. Adicionar verificação de já comprou (para pagas)

---

### 3.2 Nova Página: `/checkout/[slug]`

**Rota:** `/checkout/[slug]` | **Layout:** customizado (sem sidebar)

**Estrutura:**

```
app/pages/checkout/[slug].vue                            ← orquestrador (~50 linhas)
app/pages/checkout/sucesso.vue                            ← confirmação
app/composables/checkout/
└── useCheckout.ts                                        ← carregar oferta + criar pedido
server/api/comercial/checkout/criar.post.ts               ← (criado na FASE 1)
```

**Fluxo do `useCheckout.ts`:**

```ts
export function useCheckout(slug: string) {
  const oferta = ref(null)
  const isLoading = ref(true)
  const step = ref('resumo') // 'resumo' | 'processando' | 'concluido' | 'erro'

  const fetchOferta = async () => { /* GET /api/public/ofertas?slug=X */ }
  const criarPedido = async () => {
    // POST /api/comercial/checkout/criar { id_oferta }
    // Se gratuito → status 'concluido' direto → redirect /checkout/sucesso
    // Se pago → retorna stripe_url → redirect externo
  }

  return { oferta, isLoading, step, fetchOferta, criarPedido }
}
```

**Template do checkout (gratuito):**
```
Resumo da oferta
  - Produto: nome
  - Valor: Grátis
  - [Confirmar Matrícula] → cria pedido concluído
```

**Template do checkout (pago) — FASE 4:**
```
Resumo da oferta
  - Produto: nome
  - Valor: R$ 399,00
  - Parcelamento: até 6x de R$ 66,50
  - [Ir para Pagamento] → Stripe Checkout
```

---

### 3.3 Refatorar `/meus-processos` — Integrar Pedidos

**Pipeline:** Orquestrador → `useMeusProcessos.ts` (modificado) → BFF → RPC

**Mudanças em `useMeusProcessos.ts`:**
- Adicionar `fetchPedidos()` → busca pedidos do usuário
- Mapear `id_inscricao` → status do pedido

**Impacto nos cards:**
- Inscrição aprovada em programa pago **sem pedido** → badge "Pendente de Pagamento" + botão "Pagar"
- Inscrição com pedido `concluido` → badge "Matrícula Confirmada"
- Programa gratuito → badge "Matrícula Ativa" (sem ação)

---

## FASE 4 — Integração com Stripe (Gateway)

> ⚠️ Planejamento inicial — detalhado quando implementado.

### 4.1 Fluxo de Checkout Pago

```
1. Frontend: POST /api/comercial/checkout/criar { id_oferta }
2. BFF: cria com_pedido com status 'pendente'
3. BFF: cria Stripe Checkout Session → retorna URL
4. Frontend: redireciona para Stripe
5. Webhook Stripe → POST /api/comercial/checkout/webhook
6. BFF: valida assinatura, atualiza com_pedido → 'concluido' + pago_em
7. Se houver id_inscricao → atualiza status da inscrição
```

### 4.2 Arquivos da FASE 4

```
server/api/comercial/config-gateway.{get,post}.ts    ← admin do gateway
server/api/comercial/checkout/webhook.post.ts         ← valida assinatura
app/pages/configuracoes/pagamento.vue                 ← página de config (orquestrador)
app/components/configuracoes-gateway/
└── ConfigGatewayForm.vue                              ← formulário de chaves
app/composables/configuracao-gateway/
└── useConfigGateway.ts
```

---

## Mapa de Dependências Entre Fases

```
FASE 0 (Migrations) ────────► FASE 1 (BFFs)
                                   │
                                   ├──► FASE 2.1 (refactor Tab Programas)
                                   ├──► FASE 2.2 (/produtos)
                                   ├──► FASE 2.3 (/ofertas)
                                   │         └──► FASE 2.4 (/pedidos)
                                   │
                                   └──► FASE 3.1 (refactor vitrine /oferta)
                                             └──► FASE 3.2 (/checkout)
                                                       └──► FASE 3.3 (/meus-processos)
                                                                   └──► FASE 4 (Stripe)
```

---

## Fluxo Completo (exemplos de ponta a ponta)

### Exemplo A: Programa gratuito, sem processo seletivo

```
Admin cria:
  Programa { gratuito: true, exige_processo_seletivo: false }
  → Produto (via /produtos)
  → Oferta pública { valor_centavos: 0 }

Aluno vê na vitrine /oferta:
  → Card com badge "GRATUITO"
  → Botão "Matricular-se"
  → /checkout/oferta-slug
  → Confirma → pedido concluído → aluno matriculado
```

### Exemplo B: Programa gratuito, com processo seletivo

```
Admin cria:
  Programa { gratuito: true, exige_processo_seletivo: true }
  → Processo seletivo + formulário
  → Oferta pública { valor_centavos: 0 }

Aluno:
  → Vitrine: "Inscrever-se"
  → Formulário de inscrição
  → Admin avalia → aprova
  → Meus Processos: badge "Aprovado" (sem botão de pagamento)
```

### Exemplo C: Programa pago, sem processo seletivo

```
Admin cria:
  Programa { gratuito: false, exige_processo_seletivo: false }
  → Produto → Oferta pública { valor_centavos: 39900, parcelamento_maximo: 6 }

Aluno:
  → Vitrine: "Comprar de R$ 399,00"
  → /checkout/promocao-x
  → Stripe → concluído → acesso liberado
```

### Exemplo D: Programa pago, com processo seletivo

```
Admin cria:
  Programa { gratuito: false, exige_processo_seletivo: true }
  → Processo seletivo + formulário
  → Produto + oferta

Aluno:
  → Vitrine: "Inscrever-se" (primeiro precisa ser aprovado)
  → Formulário → admin avalia → aprovado
  → Meus Processos: badge "Aprovado" + botão "Pagar R$ 399,00"
  → Checkout → Stripe → concluído
```

---

## Sugestão de Ordem de Execução

| Ordem | Passo | Entregáveis |
|---|---|---|
| **1** | FASE 0 — Rodar migrations | Banco modelado (0.1 a 0.5) |
| **2** | FASE 2.1 — Refatorar Tab Programas | Toggles gratuito + exige_processo_seletivo |
| **3** | FASE 1.1 + FASE 2.2 — BFF + Página `/produtos` | Admin de produtos funcional |
| **4** | FASE 1.2 + 1.4 + FASE 2.3 — BFF + Página `/ofertas` | Admin de ofertas (+ elegíveis) |
| **5** | FASE 1.3 + FASE 3.1 — Refatorar vitrine `/oferta` | Público vê ofertas no lugar certo |
| **6** | FASE 1.5 + 2.4 — BFF + Página `/pedidos` | Admin de pedidos |
| **7** | FASE 1.6 + 3.2 — Checkout gratuito `/checkout/[slug]` | Aluno faz matrícula direta |
| **8** | FASE 3.3 — Integrar pedidos em `/meus-processos` | Aluno vê status de pagamento |
| **9** | FASE 4 — Stripe + checkout pago | Checkout real com gateway |

---

## Decisões de Design

| Decisão | Opção | Justificativa |
|---|---|---|
| Natureza do programa | `gratuito boolean DEFAULT true` | Semântico: curso "nasce gratuito", toggle para pago |
| Tipo de recorrência | `tipo_recorrencia` no produto + detalhes na oferta | Produto categoriza, oferta precifica |
| Nome da tabela de transação | `com_pedido` | Evita confusão com `aca_processo_seletivo_inscricoes` |
| FK do usuário no pedido | `user_expandido.id` | Consistente com todo o sistema |
| FK da inscrição no pedido | `id_inscricao → aca_processo_seletivo_inscricoes` | Vincula com fluxo acadêmico existente |
| Arquitetura frontend | Orquestrador → Componentes → Composables → BFF → RPC | Padrão estabelecido no guia de desacoplamento |
| Composables | `useXxxCore` + `useXxxActions` (mínimo 2 por módulo) | Separa listagem de CRUD/modal |
| Modais | `onSave` como prop, zero `$fetch` inline | Padrão do guia (lição 12.5) |
| BFFs | 100% RPC, zero query direta | Padrão do guia (seção 9.5) |
| Convites com validade | `expirado_em` na `com_oferta_elegivel` | Controle de acesso temporal |
| RLS público | Policy de SELECT para ofertas públicas + visíveis + vigentes | Segurança sem bypass |
| Gateway | Stripe Connect (adiado para FASE 4) | Modelo mais seguro e escalável |

---

> 🔗 **Guia de referência:** [`documentacao/guias/guia_refatoracao_desacoplamento.md`](../guias/guia_refatoracao_desacoplamento.md)
