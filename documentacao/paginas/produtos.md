# Página Produtos Comerciais (`/produtos`)

## Visão Geral

Tela administrativa para gestão de produtos e ofertas comerciais, organizada em hierarquia de 3 níveis:

- **Nível 1 — Programas** — cards dos programas acadêmicos com badge Gratuito/Pago
- **Nível 2 — Produtos** — ao expandir o programa, lista de produtos com badges Ativo/Inativo
- **Nível 3 — Ofertas** — ao expandir o produto, lista de ofertas com badges de preço, tipo, visibilidade e status

**Rota:** `/produtos` | **Layout:** `base` | **Orquestrador:** `pages/produtos/index.vue` (~55 linhas)

---

## Arquitetura (padrão desacoplado)

Pipeline: **Orquestrador → Componente → Composable → BFF → RPC → Banco**

```
app/pages/produtos/index.vue                          ← orquestrador (~55 linhas)
app/components/produtos/
├── ProdutosTabLista.vue                               ← lista hierárquica (programas > produtos > ofertas)
├── ModalProduto.vue                                   ← CRUD de produto
└── ModalOferta.vue                                    ← CRUD de oferta + elegíveis (CPF)
app/composables/produtos/
├── useProdutosCore.ts                                 ← fetch programas, produtos (lazy), ofertas (lazy)
└── useProdutosActions.ts                              ← CRUD de produto
server/api/comercial/
├── produtos.{get,post,delete}.ts                      ← BFFs de produto
├── ofertas.{get,post,delete}.ts                       ← BFFs de oferta
└── oferta-elegivel.{get,post,delete}.ts               ← BFFs de elegíveis (CPF)
supabase/migrations/
├── 20260703100000_...                                 ← campos gratuito + exige_processo_seletivo
├── 20260703110000_create_com_produto_table.sql        ← tabela com_produto
├── 20260703160000_create_com_oferta_table.sql         ← tabela com_oferta + tipos
├── 20260703180000_create_com_oferta_elegivel_table.sql ← tabela com_oferta_elegivel
├── 20260703120000_com_produto_rpcs.sql                ← RPCs com_produto
├── 20260703170000_com_oferta_rpcs.sql                 ← RPCs com_oferta
├── 20260703190000_com_oferta_elegivel_rpcs.sql        ← RPCs com_oferta_elegivel
├── 20260703150000_drop_and_recreate_...               ← fix overload RPCs
├── 20260703130000_remove_tipo_recorrencia_...         ← remove tipo_recorrencia do produto
└── 20260703200000_elegivel_simplify_to_cpf.sql        ← simplifica elegível para CPF
```

### Estrutura de diretórios

```
front_end/app/
├── pages/produtos/index.vue
├── components/produtos/
│   ├── ProdutosTabLista.vue
│   ├── ModalProduto.vue
│   └── ModalOferta.vue
├── composables/produtos/
│   ├── useProdutosCore.ts
│   └── useProdutosActions.ts
│
server/api/comercial/
├── produtos.get.ts
├── produtos.post.ts
├── produtos.delete.ts
├── ofertas.get.ts
├── ofertas.post.ts
├── ofertas.delete.ts
├── oferta-elegivel.get.ts
├── oferta-elegivel.post.ts
└── oferta-elegivel.delete.ts
```

### APIs (BFFs)

| Método | Endpoint | RPC | Descrição |
|---|---|---|---|
| `GET` | `/api/comercial/produtos` | `com_get_produtos` | Listar produtos (filtro `id_programa`) |
| `POST` | `/api/comercial/produtos` | `com_upsert_produto` | Criar/editar produto |
| `DELETE` | `/api/comercial/produtos` | `com_delete_produto` | Excluir produto (bloqueia se houver ofertas) |
| `GET` | `/api/comercial/ofertas` | `com_get_ofertas` | Listar ofertas (filtro `id_produto`) |
| `POST` | `/api/comercial/ofertas` | `com_upsert_oferta` | Criar/editar oferta |
| `DELETE` | `/api/comercial/ofertas` | `com_delete_oferta` | Excluir oferta (bloqueia se houver pedidos) |
| `GET` | `/api/comercial/oferta-elegivel` | `com_get_elegiveis` | Listar CPFs autorizados de uma oferta |
| `POST` | `/api/comercial/oferta-elegivel` | `com_upsert_elegivel` | Adicionar CPF autorizado |
| `DELETE` | `/api/comercial/oferta-elegivel` | `com_delete_elegivel` | Remover CPF autorizado |

### APIs globais usadas

| Endpoint | Motivo |
|---|---|
| `/api/programas` | Listar programas para hierarquia |
| `/api/academico_oferta/cursos` | Nome do curso nos cards |

---

## Componentes

### ProdutosTabLista.vue

**Props:**
- `programas: any[]` — programas com produtos e ofertas aninhados (lazy)
- `ofertasPorProduto: Record<string, any[]>` — mapa de ofertas por produto
- `carregandoOfertas: Record<string, boolean>` — estado de loading por produto

**Emits:**
- `expandir(programaId)` — dispara fetch de produtos do programa
- `expandir-oferta(produtoId)` — dispara fetch de ofertas do produto
- `editar-produto(produto)` — abre modal de edição de produto
- `novo-produto(programaId)` — abre modal de criação de produto com programa pré-selecionado
- `nova-oferta(produtoId)` — abre modal de criação de oferta
- `editar-oferta(oferta, produtoId)` — abre modal de edição de oferta

**Hierarquia visual:**

```
Programa (expansível)
  └── Produtos (carregados lazy ao expandir)
        ├── Produto A
        │     ├── Info + badges (Ativo/Inativo)
        │     ├── [💰] Nova Oferta
        │     ├── [✎] Editar
        │     └── Ofertas (carregadas lazy ao expandir)
        │           ├── Oferta 01  /slug  [✎]
        │           │   R$ 399,00  💳 À vista  🌍 Pública  🟢 Ativa
        │           └── Oferta 02  /outra  [✎]
        │               R$ 49,90  🔄 Mensal  🔒 Oculta  🟢 Ativa
        └── Produto B ...
```

### ModalProduto.vue

**Props:** `produto`, `programas`, `programaFiltro`, `onSave`

**Campos:**
- Programa (dropdown)
- Nome do produto
- Descrição
- Ativo/Inativo

### ModalOferta.vue

**Props:** `produtoId`, `oferta` (opcional, modo edição), `onSave`

**Campos:**
- Slug + Nome Curto
- Valor (R$) — aceita `12,20` → converte para centavos
- Tipo (Único / Recorrente)
- Parcelamento máximo (se único)
- Período + Intervalo (se recorrente)
- Vigência (datas em America/Sao_Paulo)
- Visibilidade (Pública / Oculta)
- Ativa
- Exige elegibilidade (toggle) → seção de CPFs autorizados

---

## Composables

| Composable | Responsabilidade |
|---|---|
| `useProdutosCore` | `fetchProgramas()`, `fetchProdutosPorPrograma(id)` (lazy), `fetchOfertasPorProduto(id)` (lazy), `upsertOfertaLocal(produtoId, data)` (reativo sem refetch), `programasComProdutos` (computed agrupado) |
| `useProdutosActions` | Estado de modais (`isModalOpen`, `selectedItem`, `filtroPrograma`) + `handleSave` (POST produto) |

### Lazy Loading

- **Nível 1 (Programas):** carregado ao montar a página
- **Nível 2 (Produtos):** carregado ao expandir o programa — `fetchProdutosPorPrograma`
- **Nível 3 (Ofertas):** carregado ao expandir o produto — `fetchOfertasPorProduto`

Cada nível só é buscado uma vez. Após criar/editar oferta, `upsertOfertaLocal` atualiza o array reativo sem refetch.

---

## RPCs do Módulo

| RPC | Descrição |
|---|---|
| `com_get_produtos` | Lista produtos com JOIN em programa e curso |
| `com_upsert_produto` | Cria/edita com validação de nome único |
| `com_delete_produto` | Exclui com proteção de integridade (oferta vinculada) |
| `com_get_ofertas` | Lista ofertas com JOIN em produto |
| `com_upsert_oferta` | Cria/edita com validação de slug único + tipos |
| `com_delete_oferta` | Exclui com proteção de integridade (pedido vinculado) |
| `com_get_elegiveis` | Lista CPFs autorizados de uma oferta |
| `com_upsert_elegivel` | Adiciona/atualiza CPF (UNIQUE por oferta+cpf) |
| `com_delete_elegivel` | Remove CPF autorizado |

---

## Fluxos

### Criar produto
```
Admin → /produtos → clica ➕ em um programa
  → ModalProduto preenche dados
  → POST /api/comercial/produtos → com_upsert_produto
  → upsertOfertaLocal insere no array reativo
```

### Criar oferta
```
Admin → /produtos → expande programa → expande produto → clica 💰
  → ModalOferta preenche slug, valor, tipo, vigência
  → POST /api/comercial/ofertas → com_upsert_oferta
  → upsertOfertaLocal insere no array reativo (sem refetch)
```

### Gerenciar elegíveis
```
Admin → /produtos → oferta → edita → marca "Exige elegibilidade"
  → Adiciona CPFs manualmente (ou via Power Automate)
  → Ao acessar oferta oculta, sistema verifica CPF
```

---

## Decisões de Design

| Decisão | Opção | Justificativa |
|---|---|---|
| Estrutura da página | Hierarquia expansível (3 níveis) | Evita páginas isoladas; visão completa em um lugar |
| Lazy loading | Por clique (nível 2 e 3) | Evita N+1 requests na carga inicial |
| Atualização reativa | `upsertOfertaLocal` sem refetch | Zero flicker, instantâneo |
| Identificador elegível | CPF (sem email) | Ship fast; Power Automate gerencia confirmação |
| Conversão de moeda | `"12,20"` → 1220 centavos | Input amigável, armazenamento preciso |
| Timezone | America/Sao_Paulo via `date-fns-tz` | Operaçao brasileira, sem hardcoded offset |
