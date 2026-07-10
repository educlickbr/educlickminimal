# Página Meus Cursos (`/meus-cursos`)

## Visão Geral

Tela do **aluno** para visualizar seus cursos adquiridos (matrículas com pedidos concluídos):

- **Cards de curso** — nome do programa, oferta, valor pago, status
- **Badges de status** — ✅ Ativo (concluído) / ⏳ Pendente
- **Empty state** — mensagem + link "Ver cursos disponíveis"
- **Grid responsivo** — 1 col (mobile) / 2 col (desktop)

**Rota:** `/meus-cursos` | **Layout:** `base` | **Orquestrador:** `pages/meus-cursos/index.vue`

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → BFF → RPC → Banco**

```
app/pages/meus-cursos/index.vue               ← orquestrador (~78 linhas)
server/api/comercial/
└── pedidos.get.ts                              ← GET → RPC com_get_pedidos (filtra por usuário)
supabase/migrations/
├── 20260708210000_com_get_pedidos_fix.sql      ← adiciona filtro p_id_usuario
└── 20260703240000_com_pedido_rpcs.sql          ← RPC com_get_pedidos
```

### Estrutura de diretórios

```
front_end/app/
└── pages/meus-cursos/index.vue

server/api/comercial/
└── pedidos.get.ts

supabase/migrations/
├── 20260708210000_com_get_pedidos_fix.sql
└── 20260703240000_com_pedido_rpcs.sql
```

---

## Fluxo de Dados

```
1. Aluno acessa /meus-cursos
2. store.initSession() → resolve entidade + user_expandido_id
3. GET /api/comercial/pedidos?id_entidade=X&status=concluido&page=1&limit=50
   → BFF extrai id_usuario da sessão
   → RPC com_get_pedidos(p_id_entidade, p_id_usuario, p_status='concluido')
   → retorna { itens[], qtd_total, pagina_atual }
4. Cards renderizados com programa_descricao, nome_curto, valor_pago_centavos, status
```

---

## APIs

| Método | Endpoint | Pipeline |
|---|---|---|
| `GET` | `/api/comercial/pedidos` | → BFF → RPC `com_get_pedidos` |

### Parâmetros

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id_entidade` | UUID | Obrigatório |
| `status` | string | Filtro opcional (ex: `concluido`) |
| `page` | int | Padrão 1 |
| `limit` | int | Padrão 20 |

> O BFF extrai automaticamente o `id_usuario` da sessão do usuário logado. O aluno só vê seus próprios pedidos.

---

## Lógica de Negócio

### Filtro por usuário
O BFF `pedidos.get.ts` obtém o `user_expandido.id` a partir da sessão (`auth.getSession()`) e passa como `p_id_usuario` para a RPC. Isso garante que o aluno só veja os cursos que ele próprio comprou.

### Status
- **concluido** → Badge ✅ Ativo (verde)
- **pendente** → Badge ⏳ Pendente (cinza)
- Outros status podem ser adicionados conforme necessário

### Valor pago
Exibido como `R$ 12,00` (centavos convertidos). Zero para cursos gratuitos.

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `loading` | Spinner centralizado |
| `pedidos.length === 0` | Empty state com ícone + "Nenhum curso adquirido" + link `/oferta` |
| Normal | Grid de cards com badges e informações |

---

## Contrato Visual

- **Layout**: `base` com sidebar
- **Cards**: `bg-[#0f0f17] border border-white/5 rounded-xl` com hover `border-primary/30`
- **Accent bar**: `h-1 bg-gradient-to-r from-primary to-purple-500`
- **Badge ativo**: `bg-emerald-500/10 border-emerald-500/20 text-emerald-400`
- **Badge pendente**: `bg-white/[0.04] border-white/10 text-white/30`
- **Grid**: `grid-cols-1 md:grid-cols-2 gap-4`

---

## Histórico de Mudanças

### 2026-07-08 — Criação da página

- **Página:** `pages/meus-cursos/index.vue` — layout base, fetch de pedidos concluídos do usuário
- **BFF:** `pedidos.get.ts` — extrai `id_usuario` da sessão e filtra por ele
- **RPC:** `com_get_pedidos` — adicionado parâmetro `p_id_usuario` + fix coluna `nome_completo`
