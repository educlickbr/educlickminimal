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
