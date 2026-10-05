# Guia Geral de Desacoplamento — Componentes Vue/Nuxt

## 1) Problema

Arquivos com 5k~15k linhas concentrando **todo** o HTML de múltiplas subabas/estágios + **toda** a lógica (estado, chamadas de API, cálculos) no mesmo `<script setup>`. Exemplo real: `AbaEstoque.vue` → `AbaMovimentacao.vue` (~10.600 linhas) com 7 estágios do funil de expedição.

**Sintomas típicos:**
- Scroll infinito para achar uma `<div>`
- Mudar um botão quebra outra aba sem querer
- Linter lento, IDE pesada
- Impossível dar manutenção em dupla (arquivo único = conflito garantido)

---

## 2) Estratégia: 3 fases

| Fase | O que faz | Resultado |
|---|---|---|
| **Fase 1** — Extrair templates | Cada subaba/estágio vira um componente `.vue` com `provide/inject` para compartilhar estado | Arquivo orquestrador reduz **drasticamente** de tamanho |
| **Fase 2** — Extrair lógica em composables | O `<script setup>` do orquestrador é fatiado em `composables/` por domínio | Orquestrador fica com ~200 linhas de script |
| **Fase 3** — Refinar contratos | `props` tipados para componentes que não precisam do túnel inteiro, tipagem estrita | Componentes verdadeiramente reutilizáveis |

---

## 3) Fase 1: Extração de templates (provide/inject)

### 3.1 Identificar o que extrair

Olhe a árvore de condicionais do template. Cada `v-if`/`v-else-if` que renderiza um bloco **grande e autocontido** vira um componente:

```html
<div v-if="tab === 'pedidos'">       → PedidosTab.vue
<div v-else-if="tab === 'entregas'">  → EntregasTab.vue
<div v-else>                          → ResumoTab.vue
```

O mesmo vale para esteiras/funil (wizard/stages):

```html
<div v-if="stage === 'CADASTRO'">     → EstagioCadastro.vue
<div v-else-if="stage === 'REVISAO'"> → EstagioRevisao.vue
<div v-else>                          → EstagioConclusao.vue
```

### 3.2 Estrutura de diretórios

```
componentes/
├── AbaPrincipal.vue          ← orquestrador (scripts + provide + v-if chain)
└── estagios/
    ├── cadastro/
    │   └── EstagioCadastro.vue
    ├── revisao/
    │   └── EstagioRevisao.vue
    └── conclusao/
        └── EstagioConclusao.vue
```

Cada pasta de estágio pode ter **subcomponentes** (ex: dentro de `separacao/` podem existir `RemessaModuloCesta.vue`, `RemessaModuloProduto.vue`).

### 3.3 O túnel (provide/inject)

O orquestrador (`AbaPrincipal.vue`) exporta **todo** o estado e funções via `provide`:

```js
// AbaPrincipal.vue
provide('meuContexto', {
  // estado reativo
  items: readonly(items),
  activeStage,
  loading,
  // funções
  fetchItems,
  submitForm,
  // até componentes filhos, se necessário
  ModalCustomizado,
})
```

Cada componente filho consome:

```js
// EstagioCadastro.vue
const ctx = inject('meuContexto')
// usa: ctx.items, ctx.activeStage, ctx.fetchItems(), etc.
```

**Regra de ouro do túnel:**
- O `provide` expõe **tudo** que os filhos podem precisar
- Os filhos só usam o túnel — sem props, sem emit para callback comum
- O `emit` dos filhos fica reservado para eventos que **sobem até a página pai** (ex: `sidebar-summary-change`)
- **Não** duplique estado entre orquestrador e filho — cada `ref` tem um único dono

### 3.4 Template do orquestrador após extração

```html
<template>
  <div class="flex flex-col h-full">
    <!-- Botões de navegação ficam no orquestrador -->
    <div class="flex gap-1">
      <button v-for="stage in STAGES" @click="activeStage = stage.id">
        {{ stage.label }}
      </button>
    </div>

    <div class="flex-1 overflow-auto">
      <div v-if="loading">Carregando...</div>
      <EstagioCadastro v-else-if="activeStage === 'CADASTRO'" />
      <EstagioRevisao v-else-if="activeStage === 'REVISAO'" />
      <EstagioConclusao v-else />
    </div>
  </div>
</template>
```

O template do orquestrador agora tem **~40 linhas** em vez de milhares.

### 3.5 Template do componente extraído

O componente extraído recebe **apenas** o HTML que estava dentro do seu `v-if` original. Exemplo:

**Antes** (no orquestrador):
```html
<div v-else-if="activeStage === 'CADASTRO'" class="space-y-2">
  <HeaderAvisos :avisos="avisos" />
  <div class="bg-background p-4">
    <input v-model="formData.nome" />
    <button @click="submitForm">Salvar</button>
  </div>
  <ModalCustomizado />
</div>
```

**Depois** (`EstagioCadastro.vue`):
```html
<template>
  <div class="space-y-2">
    <HeaderAvisos :avisos="ctx.avisos" />
    <div class="bg-background p-4">
      <input v-model="ctx.formData.nome" />
      <button @click="ctx.submitForm()">Salvar</button>
    </div>
    <component :is="ctx.ModalCustomizado" />
  </div>
</template>

<script setup>
const ctx = inject('meuContexto')
</script>
```

---

## 4) Fase 2: Composables (reduzir `<script setup>`)

### 4.1 Identificar domínios

Agrupe as funções e estado por **domínio** (não por arquivo). Exemplo para o módulo de expedição:

| Composable | Responsabilidade |
|---|---|
| `useExpedicaoCore` | Estado base: `items`, `loading`, `escolas`, `activeStage`, navegação de estágios |
| `useExpedicaoSeparacao` | Remessas, produtos selecionados, tombamento, inclusão/exclusão de itens |
| `useExpedicaoFefo` | Cálculo FEFO, sugestão de origens, conferência de disponibilidade |
| `useExpedicaoDemandas` | CRUD de demandas, filtros, resumo de disponibilidade por demanda |
| `useExpedicaoRotas` | CRUD de rotas, expansão de rota em remessas |
| `useExpedicaoCestas` | Previa de cestas, conferência, override de quantidades |
| `useExpedicaoWorkflow` | Movimentações (pending/approved/in-transit), aprovação, preparo, trânsito, recebimento |
| `useExpedicaoDocs` | Anexos, impressão de relatórios, memorandos |

### 4.2 Estrutura de um composable

```ts
// composables/expedicao/useExpedicaoCore.ts
export function useExpedicaoCore() {
  const appStore = useAppStore()
  const toast = useToastStore()

  const items = ref([])
  const loading = ref(false)
  const activeStage = ref('SEPARACAO')

  const fetchItems = async () => { /* ... */ }
  const setStage = (stageId: string) => { activeStage.value = stageId }

  return {
    items: readonly(items),
    loading: readonly(loading),
    activeStage,
    fetchItems,
    setStage,
  }
}
```

### 4.3 Como o orquestrador usa composables

```js
// AbaPrincipal.vue
import { useExpedicaoCore } from '@/composables/expedicao/useExpedicaoCore'
import { useExpedicaoWorkflow } from '@/composables/expedicao/useExpedicaoWorkflow'

const core = useExpedicaoCore()
const workflow = useExpedicaoWorkflow()

// Agrega tudo para o tunnel
provide('expedicaoContext', {
  ...core,
  ...workflow,
  // outros composables...
})
```

O `<script setup>` do orquestrador passa de **8.000 linhas** para ~**200 linhas**.

---

## 5) Padrão de execução (passo a passo)

### Para cada página que for desacoplar:

1. **Criar o orquestrador** (ex: `AbaPrincipal.vue`) como cópia exata do arquivo que funciona
2. **Criar pastas** `estagios/<nome>/` para cada bloco v-if
3. **Extrair 1 componente por vez**:
   - Copiar o arquivo orquestrador para `estagios/<nome>/EstagioNome.vue`
   - Nesse arquivo, apagar **tudo** do template que não é daquele estágio
   - No orquestrador, trocar o bloco inline por `<EstagioNome v-else-if="..." />`
   - Testar
4. **Repetir** para cada estágio
5. **Criar composables** fatiando o `<script setup>` por domínio
6. **Substituir** no orquestrador as definições inline por chamadas aos composables

### Checklist de validação por componente extraído

- [ ] O componente renderiza sem erros de console
- [ ] O estado é compartilhado corretamente (mudar no componente filho reflete no pai e vice-versa)
- [ ] Eventos que sobem para a página (`emit`) continuam funcionando
- [ ] O orquestrador **diminuiu** de tamanho (nunca aumentar)
- [ ] Nenhuma lógica foi duplicada entre orquestrador e componente

---

## 6) O que **NÃO** fazer

| Erro | Por que evitar |
|---|---|
| Editar o arquivo original sem ter uma cópia funcionando | Perde a referência do que funciona |
| Reformatação de código durante extração | Dificulta o diff e introduz bugs de sintaxe |
| Trocar `v-else` por `v-if` sem pensar na cadeia condicional | Quebra a renderização — um `v-else` fora da cadeia renderiza sempre |
| Duplicar estado (`ref` no pai E no filho) | Perde consistência — um dono único para cada dado |
| Mudar nome de variáveis/funções durante a extração | O túnel `provide/inject` depende dos nomes originais |
| Extrair template **antes** de ter o túnel funcionando | Componente filho não tem acesso ao estado |

---

## 7) Exemplo real: Expedição (aplicado)

```
suprimentos/expedicao/movimentacao/
├── AbaMovimentacao.vue               ← arquivo original (~10.600 linhas, funciona)
├── AbaMovPrincipal.vue               ← orquestrador refatorado (~7.000 linhas de script + template reduzido)
├── composables/expedicao/            ← composables por domínio (Fase 2)
│   ├── useExpedicaoCore.ts
│   ├── useExpedicaoSeparacao.ts
│   ├── useExpedicaoFefo.ts
│   └── ...
└── estagios/
    ├── separacao/EstagioSeparacao.vue
    ├── aguardando_aprovacao/EstagioAguardandoAprovacao.vue
    ├── aprovado_para_retirada/EstagioAprovadoParaRetirada.vue
    ├── em_preparo/EstagioEmPreparo.vue
    ├── em_transito/EstagioEmTransito.vue
    ├── remanejamento/EstagioRemanejamento.vue
    └── recebido/EstagioRecebido.vue
```

**Template do orquestrador após Fase 1:**
```html
<EstagioAguardandoAprovacao v-else-if="activeStage === 'AGUARDANDO_APROVACAO'" />
<EstagioAprovadoParaRetirada v-else-if="activeStage === 'APROVADO_PARA_RETIRADA'" />
<EstagioEmPreparo v-else-if="activeStage === 'EM_PREPARO'" />
<EstagioEmTransito v-else-if="activeStage === 'EM_TRANSITO'" />
<EstagioRemanejamento v-else-if="activeStage === 'EM_REMANEJAMENTO'" />
<EstagioRecebido v-else-if="activeStage === 'RECEBIDO'" />
<EstagioSeparacao v-else />
```

De ~3.000 linhas de template para 7 linhas de componente + fallbacks.

---

## 8) Resumo visual

```
ANTES:                           DEPOIS:
┌──────────────────────┐         ┌──────────────────────┐
│ AbaEstoque.vue       │         │ AbaPrincipal.vue     │
│ (10.600 linhas)      │         │ (~200 linhas script) │
│                      │         │                      │
│ <script>             │         │ import composables   │
│  8000 linhas lógica  │         │ provide(túnel)       │
│ </script>            │         │                      │
│                      │         │ <template>           │
│ <template>           │         │   <Estagio1 />       │
│  <div v-if>...       │         │   <Estagio2 />       │
│   (300 linhas)       │         │   <Estagio3 />       │
│  <div v-else-if>...  │         │ </template>          │
│   (400 linhas)       │         └──────────────────────┘
│  <div v-else-if>...  │                  │
│   (2000 linhas)      │         ┌────────┼────────┐
│ </template>          │         │        │        │
└──────────────────────┘     Estagio1  Estagio2  Estagio3
                             inject()  inject()  inject()
```

O resultado final: **1 arquivo enxuto que orquestra + N componentes focados que renderizam**. Todo estado vive no orquestrador (ou nos composables que ele importa) e é compartilhado via `provide/inject`. Nenhum dado é duplicado.

---

## 9) Boas Práticas de Robustez e UX (Lições Aprendidas)

Após as refatorações dos módulos de **Estrutura Acadêmica** e **Grupos de Estudo**, consolidamos práticas que garantem a estabilidade do app:

### 9.1 Blindagem de Contexto (Context Shielding)
Nunca use `inject` sem um valor padrão (fallback). Se o componente filho for renderizado durante uma transição de página onde o orquestrador ainda não montou o `provide`, o app irá quebrar.

**O Jeito Certo:**
```typescript
// No componente filho
const ctx = inject('meuContexto', { 
  items: [], 
  isLoading: false,
  handleEdit: () => {} // Fallbacks para funções também!
});
```

### 9.2 v-if para "Clean State" (Lazy Rendering)
Em páginas com muitos modais e estados de formulário, prefira `v-if` a `v-show`.
- **Benefício:** Ao fechar um modal ou trocar de aba, o componente é destruído. Ao abrir novamente, ele é reinicializado do zero.
- **Resultado:** Evita que dados de uma edição anterior fiquem "presos" no formulário ou que watchers fiquem consumindo CPU em abas escondidas.

### 9.3 Deep Linking (Sincronização com URL)
Sempre sincronize a aba ativa com a URL. Isso permite que o usuário use o botão "voltar" do navegador ou dê F5 e permaneça no mesmo lugar.

```typescript
// No Orquestrador
watch(currentTabId, (newId) => {
    router.push({ query: { ...route.query, tab: newId } });
});
```

### 9.4 BFF por Domínio (Isolamento de API)
Não centralize todas as chamadas de API do sistema em arquivos gigantes. Ao desacoplar um módulo, crie uma estrutura de pastas no servidor que espelhe o front.

```
server/api/
└── grupos_estudo/           ← Pasta dedicada
    ├── grupos.get.ts
    ├── grupos.post.ts
    └── tutores.delete.ts
```
Isso isola erros e facilita a manutenção do backend sem afetar outros módulos.

### 9.5 RPC para Tudo — Query Direta só em Fluxo Deslogado
Toda leitura/escrita em tabelas deve passar por **BFF → RPC**, nunca query direta ao Supabase via `.from('tabela').select(...)`.

A única exceção são fluxos de **onboarding** (`/convite`) onde o usuário ainda não está autenticado e o RLS não permite acesso via RPC.

```
✅ BFF → (client as any).rpc('minha_rpc', params)
❌ BFF → client.from('tabela').select('id, nome')
```

### 9.6 Validação no Front Antes do BFF
Erros de constraint do banco (`duplicate key`, `not-null`) são confusos para o usuário. Sempre valide campos obrigatórios **no front** antes de enviar ao BFF:

```js
const handleSave = async () => {
  if (!formDados.value.nome_completo) {
    errorMessage.value = 'Nome completo é obrigatório.'
    return
  }
  if (!formDados.value.matricula || !formDados.value.matricula.trim()) {
    errorMessage.value = 'Matrícula é obrigatória.'
    return
  }
  // ... enviar ao BFF
}
```

E no BFF, traduza erros de constraint que possam escapar:

```ts
} catch (err: any) {
  const rawMessage = err.message || ''
  if (rawMessage.includes('duplicate key') || rawMessage.includes('unique_matricula_empresa')) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Já existe um registro com esta matrícula nesta empresa.',
    })
  }
  // ...
}
```

---

## 10) Padrões de Composables e Orquestrador

### 10.1 Os 2 composables mínimos

Para cada módulo/página com abas, crie **no mínimo** dois composables:

| Composable | Responsabilidade | Exemplo |
|---|---|---|
| `useXxxApi` | `useFetch` com URL dinâmica por tab + computeds (`items`, `total`, `pages`, `isLoading`, `refresh`) | `useUsuariosApi.ts` |
| `useXxxActions` | Estado dos modais (`isModalOpen`, `selectedItem`) + funções CRUD (`handleNew`, `handleEdit`, `handleDelete`, `confirmDelete`) | `useUsuariosActions.ts` |

### 10.2 useFetch com URL dinâmica por tab

O `useFetch` com thunk de URL é o padrão ouro para páginas com abas — a URL muda conforme a tab ativa e o Nuxt reexecuta a chamada automaticamente:

```ts
export function useXxxApi(options: { currentTabId: Ref<string>, ... }) {
  const { data: bffData, pending, refresh } = useFetch(
    () => `/api/xxx/${currentTabId.value}`,  // ← thunk dinâmico
    {
      query: computed(() => ({ pagina: page.value, ... })),
      watch: [currentTabId, page, search],
      immediate: true,
    },
  );

  const items = computed(() => (bffData.value as any)?.items || []);
  const isLoading = computed(() => pending.value);
  return { items, isLoading, refresh };
}
```

### 10.3 `reactive` como agregador do túnel

Quando o orquestrador tem vários composables, use `reactive({...})` para agregar tudo em um único objeto antes do `provide`. Isso garante desembrulho automático de refs no template:

```ts
const api = useXxxApi({ currentTabId, page, ... })
const actions = useXxxActions({ currentTabId, ... })

const contexto = reactive({
  currentTabId,
  items: computed(() => api.items.value),
  total: computed(() => api.total.value),
  isLoading: computed(() => api.isLoading.value),
  refresh: api.refresh,
  ...actions,  // espalha refs de modais e funções
})

provide('xxxContext', contexto)
```

### 10.4 Constantes de domínio dentro do composable

Mova constantes e helpers que são **exclusivos do módulo** para dentro do composable, não para o orquestrador. Exemplo: UUIDs de papéis (`ROLES`), helpers de formatação de nome (`getPapeisByNome`).

```ts
// ❌ No orquestrador
const ROLES = { PROFESSOR: ["uuid1", "uuid2"], ... }
const getPapeisByNome = async (...) => { ... }

// ✅ Dentro de useXxxActions.ts (escopo do módulo)
const ROLES = { PROFESSOR: ["uuid1", "uuid2"], ... }
const getPapeisByNome = async (...) => { ... }
export function useXxxActions(...) { ... }
```

### 10.5 Organização de componentes por módulo

Modais e componentes exclusivos de um módulo devem ficar na pasta do módulo, não soltos na raiz de `components/`:

```
components/
├── ManagerListItem.vue          ← compartilhado
├── ModalConfirmacao.vue         ← compartilhado
└── usuarios/                    ← módulo específico
    ├── ModalGerenciarProfessor.vue
    ├── ModalGerenciarAluno.vue
    ├── ModalGerenciarAdmin.vue
    └── ...
```

---

## 11) TypeScript: Armadilhas Comuns e Soluções

### 11.1 `route.query.tab` e `Ref<string>`

`route.query.tab` retorna `LocationQueryValue | LocationQueryValue[]`, mas composables esperam `Ref<string>`. O fix:

```ts
// ❌ quebra tipagem com lang="ts"
const currentTabId = ref(route.query.tab || "default")

// ✅
const currentTabId = ref(String(route.query.tab || "default")) as Ref<string>
```

### 11.2 `currentTab` possibly undefined

Mesmo com fallback `|| TABS[0]`, o TypeScript vê `Array.find()` como `T | undefined`. No template:

```html
<!-- ❌ com lang="ts" -->
{{ currentTab.label }}

<!-- ✅ -->
{{ currentTab!.label }}
```

---

## 12) Lições Aprendidas (Acadêmico Oferta + Formulários)

Pontos críticos descobertos durante o desacoplamento real de 2 páginas (12 abas no total).

### 12.1 `$fetch` do `ofetch` QUEBRA no Nuxt

**NUNCA** importe `$fetch` de `ofetch`. Use o `$fetch` global do Nuxt (auto-importado).

```ts
// ❌ QUEBRA — não tem headers de auth, base URL, etc.
import { $fetch } from "ofetch"

// ✅ Correto — usa o global do Nuxt
// (não precisa importar, já é auto-importado)
```

**Sintoma:** página renderiza mas dados não carregam (sem erro visível).

### 12.2 `initialTab` no SETUP, não no `onMounted`

Se `activeTab` for definido como `ref("areas")` fixo e corrigido no `onMounted`, o SSR renderiza a aba errada → hydration mismatch → layout quebra (botão "Entrar" em vez do menu).

```ts
// ❌ hydration mismatch no F5
const activeTab = ref("areas")
onMounted(() => { activeTab.value = route.query.tab })

// ✅ SSR-safe
const initialTab = route.query.tab || "areas"
const activeTab = ref(initialTab)
```

### 12.3 `v-if` individual, NÃO `v-else-if`

Com `v-else-if`, Vue só monta 1 componente por vez. Com `v-if` separado, cada um tem ciclo de vida independente.

```html
<!-- ✅ -->
<OfertaTabAreas v-if="activeTab === 'areas'" />
<OfertaTabComponentes v-if="activeTab === 'componentes'" />

<!-- ❌ pode causar problemas de montagem -->
<OfertaTabAreas v-if="activeTab === 'areas'" />
<OfertaTabComponentes v-else-if="activeTab === 'componentes'" />
```

### 12.4 APIs específicas → `server/api/<pagina>/`

APIs consumidas só por uma página devem ficar em subpasta própria. APIs globais (compartilhadas) ficam na raiz.

```
server/api/
├── academico_oferta/    ← 27 BFFs exclusivos
├── formularios/         ← 6 BFFs exclusivos
├── areas.*.ts           ← global (formularios também usa)
└── programas/           ← global (calendario também usa)
```

**Como auditar:** `grep -rl "/api/xxx" front_end/app/` → se só aparece na página, move.

### 12.5 Modal com `onSave` como prop

Modais não devem chamar `$fetch` direto. Recebem a função de save como prop do composable.

```html
<!-- ModalPergunta.vue -->
<script setup>
defineProps<{ onSave: (data: any) => Promise<boolean> }>()
// chama props.onSave(formData) em vez de $fetch inline
</script>

<!-- Tab component -->
<ModalPergunta :onSave="perguntasCtx.handleSave" />
```

### 12.6 Dois padrões válidos de composable

| Padrão | Quando usar | Exemplo |
|---|---|---|
| **Auto-contido** (cada tab cria seu composable) | Tabs independentes | `academico_oferta` |
| **Compartilhado** (orquestrador cria, injeta via props) | Tabs que compartilham dados | `formularios` (perguntas) |

### 12.7 Import explícito de componentes em subpasta

Componentes em `components/<pagina>/` não são auto-importados com nome curto pelo Nuxt. Use import explícito:

```ts
// No orquestrador
import OfertaTabAreas from "~/components/academico_oferta/OfertaTabAreas.vue"
```

---

## 13) Diagnóstico Rápido de Página

Checklist para auditar uma página existente:

- [ ] `import { $fetch } from "ofetch"` → remover, usar global do Nuxt
- [ ] `initialTab` no `setup()` (não no `onMounted`)
- [ ] `v-if` individual por tab
- [ ] APIs exclusivas em `server/api/<pagina>/`
- [ ] APIs globais mantidas na raiz
- [ ] Zero `$fetch` inline nos componentes

### Exemplo: `academico_calendario` (diagnosticado e corrigido 2026-06-18)

| Check | Status |
|---|---|
| `ofetch` removido | ✅ Corrigido (3 composables) |
| APIs movidas | ✅ `feriados`, `eventos` → `server/api/calendario/` |
| `initialTab` SSR-safe | ✅ |
| Layout timeline (Feriados) | ✅ Restaurado do git (`43eabb3`) |
| Layout timeline (Eventos) | ✅ Restaurado do git |
| Layout calendário (grid rico) | ✅ Restaurado do git |

### 13.1 `timelineMonths` sempre gerar meses (mesmo sem dados)

Se o `computed` de timeline retornar `[]` quando não há dados, o usuário perde a capacidade de adicionar itens inline em cada mês. O layout original permitia adicionar feriados/eventos diretamente no mês via botão `+`.

```ts
// ❌ usuário não vê os meses, não consegue adicionar
const timelineMonths = computed(() => {
  if (rawItems.length === 0) return []
  // ...
})

// ✅ sempre gera os 12 meses do ano selecionado
const timelineMonths = computed(() => {
  // SEMPRE gera meses, mesmo sem eventos
  for (let y = minYear; y <= maxYear; y++) {
    for (let m = 0; m < 12; m++) { /* ... */ }
  }
})
```

### 13.2 Como resgatar layout do git

Layouts visuais podem ser perdidos durante a componentização. O git preserva o original.

```bash
# 1. Encontrar o commit com o layout original
git log --oneline -- "**/pagina.vue"

# 2. Extrair a seção relevante
git show <commit>:front_end/app/pages/pagina.vue | sed -n '<inicio>,<fim>p'

# 3. Adaptar para o composable + componente
# - Lógica de estado → composable (computed, refs)
# - Template → componente .vue
# - CSS scoped → <style scoped> do componente
```

### 13.3 Sintomas do `$fetch` do `ofetch`

| Sintoma | Causa |
|---|---|
| Página renderiza mas dados não carregam | `$fetch` do `ofetch` não tem headers de auth do Nuxt |
| Spinner some e mostra "Nenhum item" | API retorna erro silencioso |
| Sem erro no console | `ofetch` não loga falhas de auth |
| Funciona no clique mas não no F5 | Hydration mismatch (ver 12.2) |

**Como encontrar:** `grep -rn 'from "ofetch"' front_end/app/`

### 13.4 Modais e auto-import do Nuxt

Componentes em subpasta têm nome composto pelo auto-import. O nome usado no template precisa bater.

| Arquivo | Auto-import |
|---|---|
| `components/calendario/ModalFeriado.vue` | `<CalendarioModalFeriado>` |
| `components/formularios/ModalPergunta.vue` | `<FormulariosModalPergunta>` |
| `components/academico_oferta/ModalArea.vue` | `<AcademicoOfertaModalArea>` |

**Regra:** `<Diretório><NomeArquivo>` em PascalCase. Se não funcionar, use import explícito (12.7).
