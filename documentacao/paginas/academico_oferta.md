# Página Acadêmico Oferta (`/academico_oferta`)

## Visão Geral

Tela administrativa do módulo acadêmico para gestão de estrutura e oferta:

- **Áreas** — categorização da oferta
- **Componentes** — disciplinas/matérias
- **Módulos** — agrupamento de componentes + planos
- **Cursos** — grade curricular
- **Ciclos** — manifestação temporal de módulo
- **Programas** — ofertas agrupando ciclos + processos seletivos

**Rota:** `/academico_oferta` | **Layout:** `base` | **Orquestrador:** `pages/academico_oferta/index.vue` (~40 linhas)

---

## Arquitetura (padrão desacoplado)

Cada aba segue o pipeline: **Orquestrador → Componente de tab → Composable → BFF → RPC → Banco**

```
app/pages/academico_oferta/index.vue               ← orquestrador (~40 linhas)
app/components/academico_oferta/OfertaTab*.vue      ← 6 componentes de tab (auto-contidos)
app/components/academico_oferta/Modal*.vue          ← 6 modais (agora puro UI, zero $fetch)
app/composables/academico_oferta/useOferta*.ts      ← 8 composables (Core + 1 por aba + useProgramaForm)
server/api/academico_oferta/*.ts                    ← 27 BFFs
supabase/migrations/*.sql                           ← RPCs SECURITY INVOKER
```

### Estrutura de diretórios (atualizada)

```
front_end/app/
├── pages/academico_oferta/index.vue
├── components/academico_oferta/
│   ├── OfertaTabAreas.vue
│   ├── OfertaTabComponentes.vue
│   ├── OfertaTabModulos.vue
│   ├── OfertaTabCursos.vue
│   ├── OfertaTabCiclos.vue
│   ├── OfertaTabProgramas.vue
│   ├── ModalArea.vue
│   ├── ModalComponente.vue
│   ├── ModalModulo.vue       (abas: Geral, Componentes, Planos)
│   ├── ModalCurso.vue        (abas: Áreas, Geral, Grade)
│   ├── ModalCiclo.vue        (calendário + cronograma)
│   ├── ModalPrograma.vue     (orquestrador do wizard ~690 linhas)
│   └── programa/
│       ├── ProgramaStepOrigem.vue
│       ├── ProgramaStepCiclos.vue
│       ├── ProgramaStepProcessos.vue
│       └── ProgramaStepConclusao.vue
├── composables/academico_oferta/
│   ├── useOfertaCore.ts
│   ├── useOfertaAreas.ts
│   ├── useOfertaComponentes.ts
│   ├── useOfertaModulos.ts
│   ├── useOfertaCursos.ts
│   ├── useOfertaCiclos.ts
│   ├── useOfertaProgramas.ts
│   └── useProgramaForm.ts    ← lógica do wizard de programa
│
server/api/academico_oferta/
├── areas.{get,post,delete}.ts
├── componentes.{get,post,delete}.ts
├── modulos.{get,post,delete}.ts
├── modulo_componente.{get,post,delete}.ts
├── cursos.{get,post,delete}.ts
├── curso_modulo.{get,post,delete}.ts
├── ciclos.{get,post}.ts
├── plano_aula.{get,post,delete}.ts
├── processos.get.ts
└── ciclos/
    ├── index.delete.ts
    ├── calcular_cronograma.post.ts
    └── gerar.post.ts
```

---

## Histórico de mudanças

### Redesign Visual — Cursos (2026-06-23)

**`OfertaTabCursos.vue`** — Cards de cursos reestruturados com o mesmo padrão dos demais:

- Layout alterado de **horizontal flat** para **vertical em card** com hierarquia clara
- **Grid de 2 colunas** máximo (`grid-cols-1` mobile / `grid-cols-2` desktop)
- **Accent bar lateral violet** animada no hover
- **Botões de ação ocultos** — editar e excluir aparecem apenas no hover
- Hover com `translateY(-2px)` + glow violet sutil
- **Dois badges distintos**: área acadêmica (violet mais intenso) e contagem de módulos (violet sutil) — hierarquia visual entre ambos
- Empty state com ícone de camadas e mensagem de instrução

---

### Redesign Visual — Programas (2026-06-23)

**`OfertaTabProgramas.vue`** — Cards de programas:

- Mesmo padrão de card vertical com accent bar, hover-only actions e 2 colunas
- Avatar com inicial do nome, badge de ciclos com ícone de relógio
- Bloco de curso com label `CURSO` em pill violet sutil

**`ModalPrograma.vue`** — Step indicator:

- Substituído o row horizontal denso por **step indicator compacto**
- Bubble circular com três estados: **active** (violet), **done** (green + ✓ SVG), **future** (muted)
- Conectores como **linhas finas** entre steps — ficam verdes quando o step é concluído
- Labels `10px` uppercase para não quebrar em telas menores

**`programa/ProgramaStepCiclos.vue`**:

- Select de curso com label padronizada
- Ciclos exibidos como **cards clicáveis** com checkbox visual customizado (quadrado violet no selecionado)
- Contador `X / Y selecionados` no header da lista
- Loading e empty state com ícones SVG e mensagem descritiva
- Aviso de matriz incompleta com card de alerta orange

**`programa/ProgramaStepConclusao.vue`**:

- Campos com `step-field` padronizado e labels de 9px uppercase
- Opções de estratégia como **radio cards** com borda colorida e estado selecionado claro
- Área automática exibida como campo readonly em itálico
- Nomes múltiplos com tag orange identificando cada ciclo separadamente

**`programa/ProgramaStepProcessos.vue`**:

- Header com contador e botão "Novo Processo" alinhados
- Processo identificado por **pill badge violet** com ícone de documento
- Datas divididas em **dois grupos** lado a lado: Processo Seletivo (violet) / Matrícula (green + tag "Opcional")
- Botão remover com ícone de lixeira, oculto quando há apenas um processo
- Validação com ícones inline SVG (triângulo warn / círculo ok)

---

### Redesign Visual — Ciclos (2026-06-23)

**`OfertaTabCiclos.vue`** — Cards de ciclos reestruturados:

- Layout alterado de **horizontal flat** (tudo em uma linha) para **vertical em card** com hierarquia clara
- Padding aumentado para `18–20px` com espaçamento interno generoso
- **Botões de ação (editar/excluir) ocultos por padrão**, aparecem apenas no hover — alinhado ao padrão do design system
- Bloco "Período" com label dedicada e seta SVG, substituindo o formato inline com `→`
- **Accent bar lateral violet** animada no hover (padrão `.comp-card` do design system)
- Hover com `translateY(-2px)` + glow violet sutil

**`ciclo/CicloTabProgramacao.vue`** — Formulário de programação do cronograma:

- Seções divididas com **header numerado** (ícone step circular + título + sublabel descritiva)
- Formulários em `flex-wrap` com `gap: 12px` — elimina compressão dos campos
- Campos de horário separados em **Início** e **Fim** individuais (antes agrupados com traço)
- Chips de dias com padding confortável `6px 12px` e separação visual da lista de campos
- Resultados de simulação exibidos em **grid de cards** individuais (Encontros, Início, Fim Previsto)
- Card de status da carga em destaque com ícone SVG e texto hierarquizado
- Cronograma detalhado com `border-left` colorido por tipo e `max-height` com scroll

---

### Desacoplamento de modais + Composable do Programa (2026-06-19)

**5 modais corrigidos**: `$fetch` inline removido de ModalArea, ModalCurso, ModalModulo, ModalCiclo, ModalPrograma. **25 `$fetch`** extraídos para composables.

**Novo composable**: `useProgramaForm.ts` — lógica completa do wizard de Programa (fetchBaseLists, fetchCursoCiclos, fetchAllCiclos, checkOverlapping, toDateMs, handleSave, initEdit).

**ModalPrograma dividido** em orquestrador + 4 componentes de step:
- `ProgramaStepOrigem.vue` — escolher curso vs ciclo
- `ProgramaStepCiclos.vue` — selecionar ciclos com checkboxes
- `ProgramaStepProcessos.vue` — cards de processo seletivo (usa `v-model` nativo)
- `ProgramaStepConclusao.vue` — descrição, estratégia de agrupamento, área

**Contrato dos modais**: zero `$fetch` inline. Cada modal recebe um objeto `ctx` com métodos do composable: `ModalArea` recebe `onSave`, `ModalCurso` recebe `cursoCtx`, `ModalModulo` recebe `moduloCtx`, `ModalCiclo` recebe `cicloCtx`, `ModalPrograma` recebe `programaCtx`.

**Correção**: `OfertaTabAreas` atualizada para usar `useOfertaAreas` (antes tinha lógica duplicada inline — o composable existia mas não era usado).

### Refatoração de desacoplamento (2026-06-18)
- Orquestrador extraído (~40 linhas, zero lógica)
- 6 componentes de tab auto-contidos com composable próprio
- 7 composables: `useOfertaCore` + 1 por aba
- `initialTab` no setup (SSR-safe)
- 27 APIs movidas de `server/api/` para `server/api/academico_oferta/`

### Processos no Programa (anterior)
- ModalPrograma com wizard 4 passos (Processos Seletivos)
- Múltiplos processos por programa com validação de não-sobreposição
