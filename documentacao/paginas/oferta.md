# Página de Ofertas Pública (`/oferta`)

## Visão Geral

Página **pública** (sem login obrigatório) que exibe programas acadêmicos disponíveis. Se o usuário estiver logado, verifica em lote quais processos ele já está inscrito e exibe "Já Inscrito" em vez de "Acessar"/"Comprar"/"Matricular".

**Rota:** `/oferta`  
**Layout:** `false` (layout customizado inline)  
**Arquivo:** `pages/oferta.vue`

---

## Funcionalidades

- **Lista de programas** com processo seletivo ativo (data_fim >= now())
- **Ofertas comerciais** integradas — mostra preço como badge nos cards
- **Filtro por área** — botões dinâmicos com "Todos" + áreas
- **Cards de programa** — área, nome, carga horária, datas, badge de preço (Grátis / R$ XX)
- **Verificação de inscrição** (se logado) — badge "Já Inscrito" substitui botão
- **Roteamento inteligente** conforme tipo do programa:
  - `exige_processo_seletivo = true` → botão "**Acessar**" → formulário de processo seletivo
  - `exige_processo_seletivo = false` + `gratuito = false` → botão "**Comprar**" → form de matrícula + checkout
  - `exige_processo_seletivo = false` + `gratuito = true` → botão "**Matricular**" → form de matrícula direta

---

## Arquitetura (não refatorada)

```
app/pages/oferta.vue                      ← única página (tudo inline)
server/api/public/
├── programas.get.ts                       ← GET → RPC aca_get_programas_publicos
├── areas.get.ts                           ← GET → RPC aca_get_areas_publicas
└── ofertas.get.ts                         ← GET → RPC com_get_ofertas_publicas
server/api/form/
└── inscricoes-lote.post.ts               ← POST → RPC aca_verificar_inscricoes_lote
```

### APIs consumidas

| Método | Endpoint | RPC | Descrição |
|---|---|---|---|
| `GET` | `/api/public/programas` | `aca_get_programas_publicos` | Programas com processo seletivo ativo |
| `GET` | `/api/public/areas` | `aca_get_areas_publicas` | Áreas para filtro |
| `GET` | `/api/public/ofertas` | `com_get_ofertas_publicas` | Ofertas ativas com preço |
| `POST` | `/api/form/inscricoes-lote` | `aca_verificar_inscricoes_lote` | Verifica inscrições do usuário |

---

## Fluxo de Dados

```
1. fetchData() via Promise.allSettled
   ├── GET /api/public/programas?id_entidade=X
   ├── GET /api/public/areas?id_entidade=X
   └── GET /api/public/ofertas?id_entidade=X
         → com_get_ofertas_publicas → ofertas com slug, valor_centavos, programa_id

2. ofertasPorPrograma (computed)
   → mapa { programa_id: oferta }
   → usado para badge de preço e roteamento

3. Roteamento (getFormUrl)
   prog.exige_processo_seletivo
     ├── true  → /form/seletivo/estudante/{area}/{prog}
     ├── false + pago → /checkout/{slug}
     └── false + grátis → /checkout/{slug} (fluxo grátis)
```

---

## Estrutura Visual

```
┌─────────────────────────────────────────────────────┐
│ Header (logo + navegação + Entrar/Cadastrar)        │
├─────────────────────────────────────────────────────┤
│ Hero: "Cursos e Formações" + descrição              │
├─────────────────────────────────────────────────────┤
│ Filtro: [Todas] [Área 1] [Área 2] ...             │
├─────────────────────────────────────────────────────┤
│ Grid de Cards:                                      │
│ ┌────────────────────┐  ┌────────────────────┐     │
│ │ Área  | Preço/R$   │  │ Área  | Grátis     │     │
│ │ Nome do Programa   │  │ Nome do Programa   │     │
│ │ Nome do Processo   │  │ Carga Horária      │     │
│ │ Carga | Datas      │  │ ...                │     │
│ │ [Acessar]          │  │ [Comprar]          │     │
│ └────────────────────┘  └────────────────────┘     │
├─────────────────────────────────────────────────────┤
│ Footer                                              │
└─────────────────────────────────────────────────────┘
```

---

## Funcionalidades Recentes (Julho/2026)

### Badge de preço
Ofertas pagas exibem badge verde com valor formatado (`R$ 12,00`). Ofertas gratuitas exibem badge "Grátis".

### Roteamento inteligente
- **Com processo seletivo**: botão "Acessar" → formulário de processo (`/form/seletivo/...`)
- **Sem processo seletivo**: botão "Comprar" ou "Matricular" → form de matrícula (`/form/matricula/...`)

### Campos retornados pela RPC pública
A RPC `aca_get_programas_publicos` agora retorna `exige_processo_seletivo` e `gratuito` — essenciais para o roteamento correto.

---

## Incidente: erro 42803 no filtro de áreas (2026-08-27)

### Sintoma

- Log do servidor:
  ```
  ERROR  Erro ao buscar áreas públicas: { code: '42803', message: 'column "aca_area.nome_area" must appear in the GROUP BY clause or be used in an aggregate function' }
  ```
- Na página, o filtro de áreas simplesmente **some** (sem erro visível para o usuário): o endpoint `areas.get.ts` captura o erro e retorna `{ success: false, message }`, e a página trata isso silenciosamente (`areaData?.success` → lista vazia).

### Causa raiz

A RPC `aca_get_areas_publicas` tinha o `ORDER BY nome_area ASC` **fora** do agregado:

```sql
-- ❌ QUEBRADO — erro 42803
SELECT jsonb_agg(
    jsonb_build_object('id', id, 'nome_area', nome_area)
)
FROM public.aca_area
WHERE id_entidade = p_id_entidade
ORDER BY nome_area ASC;  -- coluna fora do agregado e sem GROUP BY
```

Em consulta com função agregada **sem `GROUP BY`**, o PostgreSQL exige que a coluna do `ORDER BY` esteja no `GROUP BY` ou **dentro** de um agregado. Por isso o erro `42803`.

> ⚠️ Armadilha: a migration `20260507141000` (original) já continha esse bug; uma correção intermediária (`20260827120000`) restaurou a função mas manteve o mesmo `ORDER BY` fora do agregado — o erro persistiu mesmo após o deploy. Sempre teste a query da RPC **isolada** antes de subir.

### Correção

Mover o `ORDER BY` para **dentro** do `jsonb_agg(...)` (aggregate ORDER BY):

```sql
-- ✅ CORRETO
SELECT jsonb_agg(
    jsonb_build_object('id', id, 'nome_area', nome_area)
    ORDER BY nome_area ASC
)
FROM public.aca_area
WHERE id_entidade = p_id_entidade;
```

### Migrations

| Migration | Papel |
|---|---|
| `20260507141000_aca_public_programs_rpc.sql` | Criação original (já continha o bug do `ORDER BY` fora do agregado) |
| `20260827120000_fix_aca_get_areas_publicas.sql` | Restaurou a função, mas **manteve** o bug (não resolveu) |
| `20260827130000_fix_aca_get_areas_publicas_orderby.sql` | ✅ Correção definitiva — `ORDER BY` dentro do `jsonb_agg` |

### Verificação

```sql
SELECT public.aca_get_areas_publicas('00ca60ea-6667-482d-8a96-09b877707b08');
-- deve retornar: [{"id": "uuid...", "nome_area": "..."}, ...]
```

### Regras para evitar recorrência

1. **`ORDER BY` + agregado:** se a query usa `jsonb_agg`/`array_agg` (ou qualquer agregado) sem `GROUP BY`, a ordenação vai **dentro** do agregado: `jsonb_agg(... ORDER BY coluna)`.
2. **Migrations aplicadas não se editam:** correção sempre em **nova migration** (a versão já registrada em `supabase_migrations.schema_migrations` não é reaplicada pelo `db push`).
3. **Teste a RPC no SQL Editor** com um `SELECT` direto antes de declarar resolvido.

---

## Limitações Atuais

| Limitação | Impacto |
|---|---|
| **Só programas com processo seletivo ativo** | Não mostra programas de matrícula direta |
| **Código não desacoplado** | ~440 linhas inline |
| **Layout customizado** | Ignora `layouts/base.vue` |

---

## Histórico de Mudanças

### 2026-08-27 — Correção do filtro de áreas (erro 42803)
- Causa: `ORDER BY nome_area` fora do agregado em `aca_get_areas_publicas` (coluna precisa estar no `GROUP BY` ou dentro de agregado)
- Migration definitiva: `20260827130000_fix_aca_get_areas_publicas_orderby.sql`
- A migration `20260827120000` (mesmo dia) não resolveu por manter o `ORDER BY` no escopo errado
- Detalhes na seção [Incidente: erro 42803 no filtro de áreas](#incidente-erro-42803-no-filtro-de-áreas-2026-08-27)

### 2026-07-09 — Roteamento inteligente + badge de preço
- `getFormUrl` agora verifica `exige_processo_seletivo`: se false, redireciona ao checkout
- Botão mostra "Comprar" (pago) ou "Matricular" (grátis) quando sem processo
- RPC `aca_get_programas_publicos` atualizada para retornar `exige_processo_seletivo` e `gratuito`
- `ofertasPorPrograma` map liga ofertas aos programas para exibir preço
