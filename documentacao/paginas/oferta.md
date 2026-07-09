# Página de Ofertas Pública (`/oferta`)

## Visão Geral

Página **pública** (sem login obrigatório) que exite os programas acadêmicos com inscrições abertas. Se o usuário estiver logado, verifica em lote quais processos ele já está inscrito e exibe "Já Inscrito" em vez de "Acessar".

**Rota:** `/oferta`  
**Layout:** `false` (layout customizado inline)  
**Arquivo:** `pages/oferta.vue` (~440 linhas — **não refatorado**)

---

## Estado Atual (06/2026)

> ⚠️ **Página ainda não refatorada** para o padrão de desacoplamento. Todo o script, template e CSS estão no mesmo arquivo.
>
> Consome dados via **RPCs legadas** do módulo acadêmico (`aca_get_programas_publicos`), não do módulo comercial (`com_*`).

### Funcionalidades

- **Lista de programas** com processo seletivo ativo (data_fim >= now())
- **Filtro por área** — botões dinâmicos com "Todos" + áreas
- **Cards de programa** — área, nome do processo, carga horária, datas
- **Verificação de inscrição** (se logado) — badge "Já Inscrito" substitui botão "Acessar"
- **Link para formulário** → `/form/seletivo/estudante/{area_id}/{programa_id}?id_processo_seletivo={uuid}`
- **Header customizado** — logo + navegação + login/cadastro
- **Footer** — rodapé simples com marca
- **Responsivo** — grid 1 col (mobile) / 2 col (desktop) / 3 col (wide)

---

## Arquitetura (atual, pré-refatoração)

```
app/pages/oferta.vue                      ← única página (~440 linhas, tudo inline)
server/api/public/
├── programas.get.ts                       ← GET → RPC aca_get_programas_publicos
└── areas.get.ts                           ← GET → RPC aca_get_areas_publicas
server/api/form/
└── inscricoes-lote.post.ts               ← POST → RPC aca_verificar_inscricoes_lote
```

### APIs consumidas

| Método | Endpoint | RPC | Descrição |
|---|---|---|---|
| `GET` | `/api/public/programas` | `aca_get_programas_publicos` | Programas com processo seletivo ativo |
| `GET` | `/api/public/areas` | `aca_get_areas_publicas` | Áreas para filtro |
| `POST` | `/api/form/inscricoes-lote` | `aca_verificar_inscricoes_lote` | Verifica se usuário já está inscrito |

---

## Fluxo de Dados

```
1. fetchData()
   ├── GET /api/public/programas?id_entidade=X
   │     → aca_get_programas_publicos → programas com processo ativo
   └── GET /api/public/areas?id_entidade=X
         → aca_get_areas_publicas → áreas para filtro

2. Se usuário logado:
   POST /api/form/inscricoes-lote
     body: { ids_processos: [...] }
     → retorna mapa { id_processo: true, ... }

3. filteredProgramas (computed)
   → filtra por activeArea (ou "Todas")
   → cada card exibe área, nome, carga, datas

4. Botão condicional:
   - inscritos[id_processo] → badge "Já Inscrito" (desabilitado)
   - senão → link para formulário de inscrição
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
│ Loading: skeleton grid                              │
│ Vazio: mensagem "Nenhum programa disponível"        │
├─────────────────────────────────────────────────────┤
│ Grid de Cards:                                      │
│ ┌────────────────────┐  ┌────────────────────┐     │
│ │ Área               │  │ Área               │     │
│ │ Nome do Processo   │  │ Nome do Processo   │     │
│ │ Carga Horária      │  │ Carga Horária      │     │
│ │ Início das aulas   │  │ Início das aulas   │     │
│ │ Inscrições até     │  │ Inscrições até     │     │
│ │ Matrículas a partir│  │ Matrículas a partir│     │
│ │ [Acessar]          │  │ [Acessar]          │     │
│ └────────────────────┘  └────────────────────┘     │
├─────────────────────────────────────────────────────┤
│ Footer                                              │
└─────────────────────────────────────────────────────┘
```

---

## Limitações Atuais

| Limitação | Impacto |
|---|---|
| **Usa RPCs legadas** (`aca_*`) | Ignora ofertas do módulo comercial (`com_oferta`), não exibe preços |
| **Só programas com processo seletivo** | Não mostra programas com matrícula direta (gratuitos sem seleção) |
| **Não consuma ofertas pagas** | Programas pagos (`gratuito = false`) não aparecem com preço |
| **Código não desacoplado** | 440 linhas inline — difícil manutenção |
| **Layout customizado** | Ignora `layouts/base.vue`, tem header/footer próprios |

---

## Próximos Passos (Refatoração Futura)

> Plano para migrar a vitrine pública para o novo módulo comercial.

1. **Criar RPC** `com_get_ofertas_publicas` — retorna ofertas públicas + ativas + vigentes com dados do produto/programa
2. **Criar BFF** `server/api/public/ofertas.get.ts` — substitui `programas.get.ts`
3. **Refatorar página** para padrão desacoplado:
   - `pages/oferta/index.vue` (orquestrador)
   - `components/oferta-publica/OfertaCard.vue`
   - `composables/oferta-publica/useOfertaPublica.ts`
4. **Adicionar suporte a ofertas pagas** — botão "Comprar R$ XX" → `/checkout/[slug]`
5. **Adicionar suporte a matrícula direta** — botão "Matricular-se" → checkout gratuito
6. **Layout** — usar `layouts/base.vue` ou manter customizado com header/footer

---

## Histórico de Mudanças

### 2026-06-03 — Refatoração para `aca_processo_seletivo`
- Tabela `aca_processo_seletivo` separada do programa
- RPC `aca_get_programas_publicos` com JOIN em processos
- Card por processo (não por programa)

### 2026-06-22 — Bloqueio de re-inscrição
- Verificação em lote de inscrições
- Badge "Já Inscrito" no lugar do botão "Acessar"
