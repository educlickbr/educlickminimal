# Página de Ofertas (`/oferta`)

## Visão Geral

Página **pública** que exibe os programas acadêmicos com inscrições abertas. Se o usuário estiver logado, verifica em lote quais processos ele já está inscrito e exibe "Já Inscrito" em vez de "Acessar".

**Rota:** `/oferta`  
**Layout:** Customizado (`layout: false`)  
**Arquivo:** `front_end/app/pages/oferta.vue`

---

## Funcionalidades

### 1. Carregamento de dados

| Endpoint | RPC | O que retorna |
|---|---|---|
| `GET /api/public/programas` | `aca_get_programas_publicos` | Programas com processo seletivo ativo |
| `GET /api/public/areas` | `aca_get_areas_publicas` | Áreas para filtro |

### 2. Verificação de inscrições (usuário logado)

Após carregar os programas, se o usuário estiver logado (`user.value`):

| Endpoint | RPC | O que retorna |
|---|---|---|
| `POST /api/form/inscricoes-lote` | `aca_verificar_inscricoes_lote` | `{ id_processo: true, ... }` |

A RPC recebe array de `id_processo_seletivo` e retorna um mapa dos processos em que o `user_expandido` já tem inscrição ativa.

### 3. Filtro por Área

Botões dinâmicos pelas áreas. `filteredProgramas` (computed) filtra por `id_area`. "Todos" exibe todos.

### 4. Cards de Programa

Cada card exibe:
- Área, nome do processo, carga horária
- Datas: início das aulas, inscrições até, matrículas a partir de
- **Botão condicional**:
  - `!inscritos[id_processo]` → "Acessar" (leva ao formulário)
  - `inscritos[id_processo]` → "Já Inscrito" (badge desabilitado âmbar)

### 5. Link para Formulário

```
/form/seletivo/estudante/{id_area}/{id_programa}?id_processo_seletivo={id_processo_seletivo}
```

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `loading` | Grid de skeletons |
| `filteredProgramas.length === 0` | Mensagem vazia |
| `inscritos[id_processo]` | Badge "Já Inscrito" desabilitado no lugar do botão "Acessar" |
| Normal | Cards com botão "Acessar" |

---

## Arquivos Relacionados

| Arquivo | Função |
|---|---|
| `front_end/app/pages/oferta.vue` | Página principal |
| `front_end/server/api/public/programas.get.ts` | Endpoint programas |
| `front_end/server/api/public/areas.get.ts` | Endpoint áreas |
| `front_end/server/api/form/inscricoes-lote.post.ts` | Verificação em lote |
| `supabase/migrations/20260622130000_rpc_verificar_inscricoes_lote.sql` | RPC batch |

---

## Histórico de Mudanças

### 2026-06-22 — Bloqueio de re-inscrição
- Adicionada verificação em lote de inscrições (`aca_verificar_inscricoes_lote`)
- Botão "Acessar" substituído por "Já Inscrito" para processos já inscritos
- Criação do BFF `inscricoes-lote.post.ts`

### 2026-06-03 — Refatoração para `aca_processo_seletivo`
- Tabela `aca_processo_seletivo` separada do programa
- RPC `aca_get_programas_publicos` com JOIN em processos
- Card por processo (não por programa)
- `id_processo_seletivo` passado como query param
