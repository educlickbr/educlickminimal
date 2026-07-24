# Página Acadêmico Oferta (`/academico_oferta`)

## Visão Geral

Tela administrativa do módulo acadêmico para **gestão completa da estrutura educacional e oferta de programas**. Esta página orquestra 6 domínios encadeados que vão desde a categorização (Áreas) até a oferta final ao público (Programas + Processos Seletivos).

**Rota:** `/academico_oferta` | **Layout:** `base` | **Orquestrador:** `pages/academico_oferta/index.vue` (~40 linhas)

### Mapa Conceitual

```
ÁREA ──< CURSO ──< GRADE (curso_modulo) >── MÓDULO
COMPONENTE ──< COMPOSIÇÃO (modulo_componente) >── MÓDULO
MÓDULO ──< CICLO (manifestação temporal)
CICLO ──< DIA_SEMANA + DIA_EXTRA + CALENDÁRIO
CICLO ──< CICLO_PROGRAMA >── PROGRAMA ──< PROCESSO_SELETIVO
```

### Dependências entre abas

```
Área ──→ Curso pertence a uma Área
Componente ──→ Módulo é composto por Componentes
Módulo ──→ Curso tem Grade de Módulos
Módulo ──→ Ciclo é uma turma/execução de um Módulo
Ciclo ──→ Programa agrega um ou mais Ciclos
```

---

## Modelo de Dados (Entidades e Relacionamentos)

### Tabelas Principais

| Tabela | Descrição | Chave Estrangeira |
|---|---|---|
| `aca_area` | Categorização (Exatas, Saúde, Humanas...) | `id_entidade` |
| `aca_componente` | Disciplina/matéria curricular | `id_entidade` |
| `aca_modulo` | Agrupamento de componentes com carga horária | `id_entidade` |
| `aca_modulo_componente` | Ponte N:N módulo ↔ componente + carga específica | `id_modulo`, `id_componente` |
| `aca_plano_aula` | Plano de ensino vinculado a um componente dentro de um módulo | `id_modulo`, `id_componente` |
| `aca_curso` | Curso (grade curricular) | `id_entidade`, `id_area` |
| `aca_curso_modulo` | Ponte N:N curso ↔ módulo com ordem/posição | `id_curso`, `id_modulo` |
| `aca_ciclo` | Turma/execução temporal de um módulo | `id_entidade`, `id_modulo`, `id_programa` |
| `aca_ciclo_dia_semana` | Regras de recorrência semanal do ciclo | `id_ciclo` |
| `aca_ciclo_dia_extra` | Dias específicos (reposições, inclusões) | `id_ciclo` |
| `aca_calendario` | Calendário gerado (aulas efetivas) | `id_ciclo`, `id_entidade` |
| `aca_feriado` | Feriados (globais ou por entidade, recorrentes ou não) | `id_entidade` (nullable) |
| `aca_evento` | Eventos escolares bloqueantes | `id_entidade` |
| `aca_programa` | Oferta agrupando ciclos | `id_entidade`, `id_curso`, `id_area` |
| `aca_ciclo_programa` | Ponte N:N programa ↔ ciclo | `id_ciclo`, `id_programa` |
| `aca_processo_seletivo` | Janelas de seleção e matrícula do programa | `id_programa` |

### Relacionamento Visual

```
aca_area
  └── aca_curso (id_area FK)

aca_componente
  └── aca_modulo_componente (id_componente FK)
        └── aca_modulo (id_modulo FK)
              ├── aca_curso_modulo (id_modulo FK)
              │     └── aca_curso (id_curso FK)
              └── aca_ciclo (id_modulo FK)
                    ├── aca_ciclo_dia_semana
                    ├── aca_ciclo_dia_extra
                    ├── aca_calendario
                    └── aca_ciclo_programa (id_ciclo FK)
                          └── aca_programa (id_programa FK)
                                └── aca_processo_seletivo (id_programa FK)
```

---

## Arquitetura (Padrão Desacoplado)

Cada aba segue rigidamente o pipeline:

**Orquestrador → Componente de Tab → Composable → BFF → RPC → Banco**

```
pages/academico_oferta/index.vue                    ← orquestrador (∼40 linhas, zero lógica)
components/academico_oferta/OfertaTab*.vue           ← 6 componentes de tab (auto-contidos, zero $fetch)
components/academico_oferta/Modal*.vue               ← 6 modais (puramente UI, zero $fetch)
components/academico_oferta/{curso,modulo,ciclo,programa}/  ← sub-componentes de abas internas
composables/academico_oferta/useOferta*.ts           ← 8 composables (Core + 1 por aba + useProgramaForm)
server/api/academico_oferta/*.ts                     ← BFFs (∼27 endpoints)
server/api/areas.*.ts, server/api/programas.*.ts     ← BFFs globais (∼8 endpoints)
supabase/migrations/*.sql                            ← RPCs SECURITY INVOKER
```

### Contrato dos Modais

Modais são **puramente UI**. Recebem um objeto `ctx` (ou props diretas) com métodos do composable:

| Modal | Ctx Recebido | Props Adicionais |
|---|---|---|
| `ModalArea` | `onSave` (callback) | — |
| `ModalComponente` | `handleSave` (callback) | — |
| `ModalModulo` | `moduloCtx` | `componentesDisponiveis`, `componentesDoModulo`, `planos` |
| `ModalCurso` | `cursoCtx` | `areasDisponiveis`, `modulosDisponiveis`, `modulosDoCurso` |
| `ModalCiclo` | `cicloCtx` | `modulosDisponiveis`, `diasSemana`, `diasExtras`, `simulacaoData` |
| `ModalPrograma` | `programaCtx` | `listCursos`, `listAreas`, `ciclosEncontrados`, `processos` |

---

## Pipeline Completo: Tab a Tab

### 1. Aba ÁREAS

**Objetivo:** CRUD simples de áreas educacionais (categorização).

**Componentes:** `OfertaTabAreas.vue` + `ModalArea.vue`

**Fluxo:**
```
TabAreas → useOfertaAreas
  → fetchAreas() → GET /api/academico_oferta/areas?page&limit
  → handleSave() → POST /api/areas { id_entidade, nome_area, descricao, usuario_id }
  → handleDelete() → DELETE /api/academico_oferta/areas { id, id_entidade }
```

**RPCs:** `rpc('aca_list_areas', ...)` (listagem), `rpc('aca_upsert_area', ...)` (inserir/editar), `rpc('aca_delete_area', ...)` (exclusão segura com verificação de FK).

**Observações:**
- Modal simples, sem abas internas
- Confirmação de exclusão com `ModalConfirmacao`

---

### 2. Aba COMPONENTES

**Objetivo:** CRUD de componentes curriculares (disciplinas/matérias).

**Componentes:** `OfertaTabComponentes.vue` + `ModalComponente.vue`

**Fluxo:**
```
TabComponentes → useOfertaComponentes
  → fetchComponentes() → GET /api/academico_oferta/componentes?page&limit
  → handleSave() → POST /api/academico_oferta/componentes { nome_componente, descricao, ... }
  → handleDelete() → DELETE /api/academico_oferta/componentes { id, id_entidade }
```

**RPCs:** `rpc('aca_get_componentes_paginado', ...)`, `rpc('aca_upsert_componente', ...)`, `rpc('aca_delete_componente_intercept', ...)` (intercepta se há FK pendente).

**Observações:**
- Modal simples, sem abas internas
- Validação inline: nome obrigatório

**⚠️ Histórico — Ajuste de UPSERT:** Um bug anterior causava duplicação de componentes em vez de atualização. A causa era a ausência do campo `id` no payload de edição — o BFF interpretava como INSERT. A correção garantiu o repasse explícito do `id` ao `handleSave()`, ativando corretamente o comportamento de UPSERT na RPC.

---

### 3. Aba MÓDULOS

**Objetivo:** CRUD de módulos acadêmicos com composição de componentes e planos de aula.

**Componentes:** `OfertaTabModulos.vue` + `ModalModulo.vue` + `ModuloTabComponentes.vue` + `ModuloTabPlanos.vue`

#### 3.1 ModalModulo — Abas Internas

| Aba | Componente | Função |
|---|---|---|
| **Geral** | (inline) | Nome, descrição (RichTextEditor), carga horária |
| **Componentes** | `ModuloTabComponentes.vue` | Vincular componentes com carga horária e obrigatoriedade |
| **Planos** | `ModuloTabPlanos.vue` | Planos de aula vinculados a componentes |

#### 3.2 Aba Geral

Campos:
- `nome_modulo` — text, obrigatório
- `descricao` — RichTextEditor
- `carga_horaria` — number, minutos (hoje calculada via soma dos componentes, ainda editável)

**Fluxo de save:**
```
ModalModulo (aba Geral) → useOfertaModulos.handleSaveModulo()
  → POST /api/academico_oferta/modulos { id, nome_modulo, descricao, carga_horaria, ... }
  → RPC: aca_upsert_modulo
```

#### 3.3 Aba Componentes (`ModuloTabComponentes.vue`)

**Funcionalidade:**
- Vincula componentes ao módulo com carga horária (horas:minutos → minutos)
- Flag `obrigatorio` (true/false)
- Lista numerada dos componentes vinculados com badge de obrigatoriedade
- **Restrição:** módulo precisa estar salvo (`savedModuloId`) para gerenciar componentes

**Fluxo:**
```
handleAddComponente() → POST /api/academico_oferta/modulo_componente
  { id_modulo, id_componente, carga_horaria, obrigatorio, ... }
handleRemoveComponente(moduloId, componenteId) → DELETE /api/academico_oferta/modulo_componente
  { id_modulo, id_componente }
```

**RPCs:** `rpc('aca_upsert_modulo_componente', ...)`, `rpc('aca_delete_modulo_componente', ...)`

#### 3.4 Aba Planos (`ModuloTabPlanos.vue`)

**Funcionalidade:**
- Cria/edita/exclui planos de aula vinculados a um componente específico do módulo
- Campos: `id_componente` (select), `titulo_plano` (text), `ementa` (RichTextEditor)
- CRUD completo com edição inline e exclusão com confirmação
- **Restrição:** módulo precisa estar salvo

**Fluxo:**
```
handleSavePlano() → POST /api/academico_oferta/plano_aula { id_modulo, id_componente, titulo_plano, ementa }
handleDeletePlano(id) → DELETE /api/academico_oferta/plano_aula { id }
```

**RPCs:** `rpc('aca_upsert_plano_aula', ...)`, `rpc('aca_delete_plano_aula', ...)`

---

### 4. Aba CURSOS

**Objetivo:** CRUD de cursos com gestão de áreas e grade curricular.

**Componentes:** `OfertaTabCursos.vue` + `ModalCurso.vue` + `CursoTabAreas.vue` + `CursoTabGrade.vue`

#### 4.1 ModalCurso — Abas Internas

| Aba | Componente | Função |
|---|---|---|
| **Geral** | (inline) | Nome, descrição (RichTextEditor), área (select) |
| **Áreas** | `CursoTabAreas.vue` | Sub-CRUD de áreas dentro do curso |
| **Grade** | `CursoTabGrade.vue` | Grade curricular: vincula módulos com ordem |

#### 4.2 Aba Geral

Campos:
- `nome_curso` — text, obrigatório
- `descricao` — RichTextEditor
- `id_area` — select de áreas disponíveis

**Fluxo:**
```
handleSaveCurso() → POST /api/academico_oferta/cursos { nome_curso, descricao, id_area }
  → RPC: aca_upsert_curso
```

#### 4.3 Aba Áreas (`CursoTabAreas.vue`)

**Funcionalidade:**
- CRUD completo de áreas dentro do modal do curso (sub-CRUD)
- Formulário inline com nome da área, botão "Criar Área" / "Atualizar"
- Lista com edição (lápis) e exclusão (lixeira)
- Loading e empty states

**Fluxo:**
```
handleSaveArea() → POST /api/areas { id_entidade, nome_area, descricao, usuario_id }
handleDeleteArea(id) → DELETE /api/areas { id, id_entidade }
```

#### 4.4 Aba Grade (`CursoTabGrade.vue`)

**Funcionalidade:**
- Vincula módulos ao curso com posição/ordem numérica
- Lista com badge de carga horária, descrição truncada
- Botão de remover módulo da grade
- **Restrição:** curso precisa estar salvo primeiro (exibe pending state)

**Fluxo:**
```
handleAddModulo() → POST /api/academico_oferta/curso_modulo { id_curso, id_modulo, ordem }
handleRemoveModulo(cursoId, moduloId) → DELETE /api/academico_oferta/curso_modulo { id_curso, id_modulo }
```

---

### 5. Aba CICLOS (Motor de Calendário)

⚠️ **Esta é a aba mais complexa da página.**

**Objetivo:** CRUD de ciclos (turmas) com motor de geração de calendário completo.

**Componentes:** `OfertaTabCiclos.vue` + `ModalCiclo.vue` + `ciclo/CicloTabProgramacao.vue`

#### 5.1 ModalCiclo — Abas Internas

| Aba | Componente | Função |
|---|---|---|
| **Geral** | (inline) | Módulo, descrição, período, ano/semestre, turno |
| **Programação** | `CicloTabProgramacao.vue` | Motor de calendário (simulação + persistência) |

#### 5.2 Aba Geral

Campos:
- `id_modulo` — select de módulos disponíveis
- `descricao` — text
- `ano_semestre` — ex: "2026/1" (sugestão automática via `ano_semestre.ts`: mês ≤ 6 → "Is", mês > 6 → "IIs")
- `descricao` (título) — sugestão automática: `Nome do Módulo` + `Ano-Semestre` se não preenchido manualmente
- `turno` — select: `matutino`, `vespertino`, `noturno`, `integral`, `sabado`, `livre`
- `data_ini` — date
- `data_fim` — (calculado pelo motor, readonly)

#### 5.3 Aba Programação — Motor de Calendário

**Componente:** `CicloTabProgramacao.vue`

Dividido em **4 seções numeradas** (com step indicator próprio):

##### Seção ① — Dias de Aula na Semana

- Select de dia da semana (DOM a SÁB)
- Input `hora_ini` e `hora_fim` (time)
- Botão "Adicionar" → cria chip removível
- Chips exibem dia abreviado + horário
- Validação: pelo menos um dia necessário para simular

**Vínculo com BFF:**
```
saveCiclo() → POST /api/academico_oferta/ciclo_dia_semana
  { id_ciclo, dias: [{ dia_sem, hora_ini, hora_fim }], ... }
```

##### Seção ② — Simulação do Cronograma

- Botão "Simular Cronograma" → `POST /api/academico_oferta/ciclos/calcular_cronograma`
- Resultado exibe:
  - **Encontros** (quantidade de aulas geradas)
  - **Início** (data do primeiro encontro)
  - **Fim Previsto** (data do último encontro)
  - **Status de Carga**: ✅ saldo 0 / ⚠️ saldo != 0
- Loading state com spinner

**BFF:** `ciclos/calcular_cronograma.post.ts` → chama RPC `aca_calcular_cronograma_aulas`

**RPC — `aca_calcular_cronograma_aulas`:**
- Calcula carga total como **soma dos `carga_horaria` de `aca_modulo_componente`** (não mais do módulo)
- Loop dia a dia a partir de `data_inicio`:
  - Safety: max 2000 iterações
  - Para cada dia candidato (regular ou extra), verifica feriados (recorrentes/globais) e eventos bloqueantes
  - Feriados/eventos aparecem como informativos (não consomem carga)
  - Dias que NÃO são candidatos (nem regular, nem extra) são simplesmente pulados
- Retorna JSON: `{ success, data_fim, saldo_minutos, dias_gerados[{ data, tipo, hora_ini, hora_fim, duracao_minutos, observacao }] }`

##### Seção ③ — Dias Extras (Reposições)

- Formulário com: `data` (date), `hora_ini` (time), `hora_fim` (time), `observacoes` (text)
- Chips removíveis
- Indicador de quantidade (`X extras`)
- Estilo visual diferenciado (laranja)

**Vínculo com BFF:**
```
saveCiclo() → POST /api/academico_oferta/ciclo_dia_extra
  { id_ciclo, dias: [{ data, hora_ini, hora_fim, observacoes }], ... }
```

##### Seção ④ — Cronograma Detalhado

- Exibido após simulação bem-sucedida
- Grid de linhas com:
  - **Nº** da aula
  - **Data** + dia da semana abreviado
  - **Tipo** (badge: `regular` / `extra` / `feriado` / `evento`) com cor por tipo
  - **Observação** (nome do feriado/evento, ou "Aula Regular")
  - **Horário** (hora_ini → hora_fim) + duração
- `border-left` colorido por tipo
- `max-height` com scroll

**Detalhes do Motor:**

- **Carga Horária Dinâmica:** A coluna obsoleta `carga_horaria` em `aca_modulo` foi abandonada. Todo o cálculo é extraído dinamicamente via a soma das cargas de `aca_modulo_componente`.
- **Proteção de Simulação (Safety Guards):** A RPC `aca_calcular_cronograma_aulas` possui travas explícitas que impedem loops infinitos caso aulas tenham duração cadastrada como 0 minutos ou negativa.
- **Database Cleanup:** Feriados e eventos aparecem na prévia visual (Simulação) mas o insert final bloqueia propositalmente dados não-aula antes de inserir na tabela oficial `aca_calendario`, garantindo que o banco armazene estritamente atividades curriculares válidas.
- **Feriados e Eventos Inteligentes:** A simulação cruza os dias de grade regular/extra com as tabelas de `aca_feriado` e `aca_evento`. Interrupções aparecem como *badges* vermelhas na prévia e não deduzem os minutos semanais exigidos.

#### 5.4 Save Completo do Ciclo

O save do ciclo é uma **transação de 4 etapas** orquestrada pelo composable `useOfertaCiclos.handleSaveCiclo()`:

```
1. POST /api/academico_oferta/ciclos (upsert do ciclo → RPC aca_upsert_ciclo_v1)
   ├── id, id_entidade, id_modulo, descricao, ano_semestre, turno, data_ini, data_fim, usuario_id
   └── retorna id do ciclo

2. POST /api/academico_oferta/ciclo_dia_semana (grava regras semanais)
   └── id_ciclo, dias: [{ dia_sem, hora_ini, hora_fim }]

3. POST /api/academico_oferta/ciclo_dia_extra (grava dias extras)
   └── id_ciclo, dias: [{ data, hora_ini, hora_fim, observacoes }]

4. POST /api/academico_oferta/ciclos/gerar (RPC aca_gerar_calendario_ciclo)
   └── Re-executa simulação, apaga calendário antigo, insere novo, atualiza data_fim do ciclo
```

**RPC — `aca_gerar_calendario_ciclo`:**
- Carrega módulo, data_inicio, dias_semana e dias_extras do ciclo
- Chama `aca_calcular_cronograma_aulas` internamente
- Se saldo != 0, retorna erro ("Matemática de horas falhou")
- Apaga registros existentes em `aca_calendario` para o ciclo
- Insere novos registros (apenas os tipos `regular` e `extra` — feriados/eventos NÃO persistem)
- Atualiza `data_fim` no `aca_ciclo`

#### 5.5 Exclusão de Ciclo

```
confirmDelete(id) → DELETE /api/academico_oferta/ciclos { id, id_entidade }
  → RPC: aca_delete_ciclo (JSONB: { success, message })
```

A RPC `aca_delete_ciclo` implementa proteções adicionais:
- **Trava de Turma Master:** Impede que a exclusão apague indiretamente (em cascata) turmas integradas na tabela `aca_ciclo_programa`.
- **Exclusão Ativa de Dependências:** Antes de remover o registro central do ciclo, apaga silenciosamente o calendário derivado, dias da semana e dias extras, contornando travas de `ForeignKey Violation` (já que não há `ON DELETE CASCADE` intencional).
- **Visualização Prévia:** Ao abrir a janela de *Ajustar* num ciclo existente, uma varredura cruzada auto-simulada é executada, exibindo a grade mesclada com interrupções festivas.

---

### 6. Aba PROGRAMAS (Wizard de Oferta)

**Objetivo:** Criar/editar programas (ofertas) agrupando ciclos com processos seletivos.

**Componentes:** `OfertaTabProgramas.vue` + `ModalPrograma.vue` + `programa/ProgramaStep*.vue` (4 steps)

**Composable principal:** `useProgramaForm.ts` (300+ linhas)

#### 6.1 ModalPrograma — Wizard de 4 Steps

| Step | Componente | Função |
|---|---|---|
| **1. Origem** | `ProgramaStepOrigem.vue` | Escolher base: Curso ou Ciclo Avulso |
| **2. Ciclos** | `ProgramaStepCiclos.vue` | Selecionar ciclos com checkboxes |
| **3. Processos** | `ProgramaStepProcessos.vue` | Gerenciar múltiplos processos seletivos |
| **4. Conclusão** | `ProgramaStepConclusao.vue` | Estratégia, área, descrição, toggles |

Step indicator visual: bubbles circulares com estados **active** (violet), **done** (green + ✓), **future** (muted) + conectores.

#### 6.2 Step 1 — Origem (`ProgramaStepOrigem.vue`)

Escolha entre duas estratégias que **mudam todo o fluxo**:

| Opção | Descrição | Fluxo Seguinte |
|---|---|---|
| **A partir de um Curso** | Analisa matriz curricular e oferece ciclos do curso | Step 2 mostra select de curso + ciclos da matriz |
| **A partir de Ciclos** | Oferta avulsa sem vínculo com curso | Step 2 mostra todos os ciclos disponíveis |

- Dois radio cards grandes com ícone (graduation-cap vs books)
- Check circle no canto superior direito do selecionado
- Border colorida (violet para curso, laranja para ciclo)

#### 6.3 Step 2 — Ciclos (`ProgramaStepCiclos.vue`)

**Quando origem = curso:**
- Select de curso → dispara `fetchCursoCiclos()` que chama `GET /api/programas/buscar_ciclos_curso? id_curso&id_entidade`
- Retorna ciclos disponíveis + `modulos_ausentes` (módulos da grade sem ciclo programado)
- **Aviso de Matriz Incompleta** (card laranja) se `modulos_ausentes.length > 0`

**Quando origem = ciclo:**
- Lista todos os ciclos (`fetchAllCiclos()` via `GET /api/academico_oferta/ciclos`)

**Ambos:**
- Cards clicáveis com checkbox visual customizado (quadrado violet)
- Contador `X / Y selecionados`
- Exibe: módulo, descrição, período (data_ini → data_fim)
- Loading e empty states
- Validação de sobreposição entre ciclos selecionados (`checkOverlapping()`)

#### 6.4 Step 3 — Processos (`ProgramaStepProcessos.vue`)

**Funcionalidade:**
- Múltiplos processos seletivos por programa
- Cada processo card contém:
  - **Pill badge violet** com ícone + "Processo N"
  - **Nome do processo** (text: "Vestibular 2026/1")
  - **Datas do Processo Seletivo** (violet): `data_inicio` + `data_fim` (datetime-local)
  - **Datas de Matrícula** (green + tag "Opcional"): `matricula_inicio` + `matricula_fim` (datetime-local)
  - Botão remover (lixeira, oculto se apenas 1 processo)
- Botão "Novo Processo" (desabilitado se `canAddProcesso = false`)
- **Validação inline:**
  - Datas de processo não podem se sobrepor entre processos
  - Datas de matrícula devem estar dentro do período do processo
  - Mensagem verde "Regra ativa" ou laranja com erro

**Regra de negócio:**
```
Para salvar: 
  - Datas dos processos organizadas em ordem crescente de data_inicio
  - Processo inicial fornece processo_seletivo_inicio e matricula_inicio
  - Processo final fornece processo_seletivo_fim e matricula_fim
```

#### 6.5 Step 4 — Conclusão (`ProgramaStepConclusao.vue`)

**Campos:**

| Campo | Tipo | Comportamento |
|---|---|---|
| **Estratégia** | Radio card | `unica` (1 programa para todos os ciclos) ou `separada` (1 programa por ciclo) |
| **Curso** | Select (readonly se edit) | Vinculado ao curso selecionado |
| **Área** | Select | Se origem=curso, área é automática (readonly, vem do curso); se ciclo, permite selecionar |
| **Gratuito** | Toggle | Marca programa como gratuito |
| **Exige Processo Seletivo** | Toggle | Controla se o programa requer processo seletivo |
| **Descrição** | Text | Nome/descrição da oferta |
| **Descrições Múltiplas** | Text[] | Quando estratégia=separada, gera um input para cada ciclo com tag laranja identificando o ciclo |

**Validação:**
- Aviso de sobreposição se `temOverlapping = true`
- Botão "Salvar" só ativo se `canSave` (validações de processo OK + ciclos selecionados)

#### 6.6 Save do Programa

**Create:**
```
POST /api/programas/criar_com_ciclos
  { id_entidade, id_curso, id_area, descricao, ciclos, estrategia, descricoes, processos, gratuito, exige_processo_seletivo }
→ RPC: aca_create_programas_lote 
  - Se estratégia='unica': 1 INSERT em aca_programa + N INSERTs em aca_ciclo_programa
  - Se estratégia='separada': N INSERTs (1 por ciclo) com descrições concatenadas
```

**Edit:**
```
POST /api/programas (global)
  { id, id_entidade, id_curso, descricao, ciclos, processos, gratuito, exige_processo_seletivo }
→ RPC: aca_upsert_programa (lida com upsert + re-vinculação de ciclos + upsert de processos)
```

**Init Edit:**
```
useProgramaForm.initEdit(programaId) → Promise.all([
  GET /api/programas/ciclos?id_programa=...      (ciclos vinculados)
  GET /api/academico_oferta/processos?id_programa=... (processos seletivos)
])
```

---

#### 6.7 Ofertas Múltiplas em Lote

Para criar múltiplos programas de uma só vez (ex: um programa para cada ciclo de um curso), o sistema oferece a estratégia de **Ofertas Múltiplas**:

- **Customização Individual:** Ao optar por esta estratégia, o wizard abre campos de texto individuais para cada ciclo selecionado, permitindo nomes comerciais distintos.
- **RPC de Lote:** A função `aca_create_programas_lote` aceita um payload `JSONB` com as descrições customizadas, criando múltiplos programas em uma única transação atômica.
- **Padrão de Sugestão:** A lógica de sugestão segue o formato `[Curso] - [Semestre] - [Módulo]`, garantindo nomes comerciais limpos e profissionais.

---

## BFFs Completos

### BFFs em `server/api/academico_oferta/`

| Endpoint | Métodos | Função |
|---|---|---|
| `areas` | GET, POST, DELETE | CRUD de áreas |
| `componentes` | GET, POST, DELETE | CRUD de componentes |
| `modulos` | GET, POST, DELETE | CRUD de módulos (listagem paginada RPC) |
| `modulo_componente` | GET, POST, DELETE | Vínculo módulo ↔ componente |
| `cursos` | GET, POST, DELETE | CRUD de cursos (listagem paginada RPC) |
| `curso_modulo` | GET, POST, DELETE | Grade curricular curso ↔ módulo |
| `ciclos` | GET, POST | Listar + upsert de ciclo |
| `ciclo_dia_semana` | GET, POST | Regras de dia da semana do ciclo |
| `ciclo_dia_extra` | GET, POST | Dias extras do ciclo |
| `plano_aula` | GET, POST, DELETE | Planos de aula do módulo |
| `processos` | GET | Listar processos seletivos de um programa |
| `ciclos/index` | DELETE | Excluir ciclo com cascata |
| `ciclos/calcular_cronograma` | POST | Simular cronograma (RPC) |
| `ciclos/gerar` | POST | Persistir calendário (RPC) |

### BFFs Globais em `server/api/`

| Endpoint | Métodos | Função |
|---|---|---|
| `areas` | GET, POST, DELETE | CRUD global de áreas (usado por CursoTabAreas e useProgramaForm) |
| `programas` | GET, POST | Listar + upsert de programas |
| `programas/criar_com_ciclos` | POST | Criar programas em lote |
| `programas/buscar_ciclos_curso` | GET | Buscar ciclos de um curso (wizard step 2) |
| `programas/ciclos` | GET | Ciclos vinculados a um programa |
| `programas/calendario` | GET | Calendário do programa |
| `programas/aula` | PATCH | Mover/cancelar/reagendar aula |
| `ciclos` | GET, POST | Ciclos (global, com fallback) |

---

## RPCs do Banco (PostgreSQL)

### Módulo Calendário

| RPC | Descrição |
|---|---|
| `aca_calcular_cronograma_aulas(p_id_entidade, p_id_modulo, p_data_inicio, p_dias_semana, p_dias_extras)` | Motor de simulação: loop dia a dia, feriados, eventos, retorna JSON com dias gerados |
| `aca_gerar_calendario_ciclo(p_id_entidade, p_id_ciclo, p_usuario_id)` | Persiste o calendário: apaga antigo, insere novo, atualiza data_fim |

### Módulo Programa

| RPC | Descrição |
|---|---|
| `aca_create_programas_lote(p_id_entidade, p_id_curso, p_descricao, p_ciclos[], p_estrategia, p_usuario_id)` | Cria programas em lote (estratégia unica/separada) |
| `aca_upsert_programa(p_id, p_id_entidade, ..., p_processos, p_gratuito, p_exige_processo_seletivo)` | Upsert de programa com processos aninhados |
| `aca_get_programas_paginado(p_id_entidade, p_pagina, p_limite, p_busca)` | Listagem paginada com busca |

### Módulo Ciclo

| RPC | Descrição |
|---|---|
| `aca_upsert_ciclo_v1(p_id, p_id_entidade, p_id_modulo, ..., p_turno, p_ano_semestre)` | Upsert de ciclo |
| `aca_delete_ciclo(p_id_entidade, p_id_ciclo)` | Exclusão com cascata (retorna JSONB) |
| `aca_get_ciclos_do_programa(p_id_programa)` | Ciclos vinculados a um programa |

### Módulo Curso

| RPC | Descrição |
|---|---|
| `aca_upsert_curso(p_id, p_id_entidade, p_nome_curso, p_descricao, p_id_area, p_usuario_id)` | Upsert de curso |
| `aca_get_cursos_paginado(p_id_entidade, p_pagina, p_limite, p_busca)` | Listagem paginada |
| `aca_delete_curso(p_id_entidade, p_id_curso)` | Exclusão segura |

### Módulo / Componente

| RPC | Descrição |
|---|---|
| `aca_upsert_modulo(p_id, p_id_entidade, p_nome_modulo, p_descricao, p_carga_horaria, p_usuario_id)` | Upsert de módulo |
| `aca_get_modulos_paginado(p_id_entidade, p_pagina, p_limite, p_busca)` | Listagem paginada |
| `aca_delete_modulo(p_id_entidade, p_id_modulo)` | Exclusão segura |
| `aca_delete_plano(p_id_entidade, p_id_plano)` | Exclusão de plano de aula |
| `aca_upsert_modulo_componente(...)` | Vínculo módulo ↔ componente |
| `aca_delete_modulo_componente(...)` | Remoção de vínculo |

### Geral

| RPC | Descrição |
|---|---|
| `aca_list_areas(p_id_entidade)` | Listar áreas |
| `aca_upsert_area(...)` | Inserir/editar área |
| `aca_delete_area(p_id_entidade, p_id_area)` | Excluir área |
| `aca_get_componentes_paginado(...)` | Listagem paginada de componentes |
| `aca_upsert_componente(...)` | Upsert de componente |
| `aca_delete_componente_intercept(...)` | Exclusão com interceptação de FK |

---

## Padrões Transversais

### Padrão de Exclusão com Confirmação

Usado em **todas as 6 abas**:

```
user click "Excluir" → confirmDelete(id)
  → showConfirmDelete = true
  → ModalConfirmacao é exibida
  → user confirma → handleDelete()
    → loading = true
    → $fetch(DELETE) ao BFF
    → Se sucesso: toast "Removido" + fetch() refresh lista
    → Se erro: toast erro
    → finally: isDeleting = false, showConfirmDelete = false
```

### Padrão de Modal

```
- ModalOverlay (rgba(0,0,0,0.85), sem backdrop-blur)
- ModalPanel (--sm, --md, ou --lg)
  - ModalAccentBar (violet)
  - ModalHeader (ícone + título + subtítulo + close btn)
  - ModalTabs (se houver abas internas)
  - Conteúdo scrollável
  - ModalFooter (cancelar + salvar ou step navigation)
```

### Padrão de Load States Componentes de Lista

```
1. loading=true → spinner
2. loading=false + itens.length === 0 → empty state (ícone + mensagem descritiva)
3. loading=false + itens.length > 0 → lista/cards
4. erro → toast de erro (capturado no composable)
```

### Padrão de Carga Horária

```
Input no front: horas + minutos separados
Armazenamento no banco: minutos (INTEGER)
Exibição: Math.floor(minutos / 60).toString().padStart(2,'0') + ':' + (minutos % 60).toString().padStart(2,'0')
Cálculo de calendário: soma dos minutos de todos os modulo_componente do módulo
```

### Padrão de Datas

```
Input: datetime-local (yyyy-MM-ddTHH:mm)
Armazenamento: ISO string (toISOString())
Formatação exibição: dd/MM/yyyy (função formatDateShort manual)
```

### Tratamento Amigável de Chaves Estrangeiras (Foreign Keys)

Para proteger o usuário final de mensagens brutas de erro de banco (`violates foreign key constraint`), as RPCs de exclusão inspecionam as tabelas adjacentes antes de realizar o `DELETE`. Se uma dependência for encontrada, o retorno é cancelado de forma limpa com uma mensagem de instrução clara.

| RPC | Verifica uso em |
|---|---|
| `aca_delete_componente` | Grade (`aca_carga_horaria`) e Planos de Aula (`aca_plano_de_aula`) |
| `aca_delete_modulo` | Grade de Cursos (`aca_curso_modulo`), Ciclos (`aca_ciclo`) e Planos |
| `aca_delete_curso` | Turmas/Programas ativas vinculadas (`aca_programa`) |
| `aca_delete_plano_de_aula` | Referências e arquivos de apoio (cascata nativa via `aca_ref_plano_de_aula`) |
| `aca_delete_ciclo` | Turmas vinculadas (`aca_ciclo_programa`) — trava "Turma Master" |
| `aca_delete_area` | Tabelas que referenciam a área como FK |

### Padrões Acordados

- **Regras Universais:** Nunca editar manualmente migrations já submetidas; criar preferencialmente arquivos de evolução (ex: atualizações das RPCs).
- **Permissões:** Funções de banco devem usar `SECURITY INVOKER` na sua declaração padrão, não cruzando os acessos pré-estabelecidos.
- **Aparência e Nomenclatura:** Botões vazios ("Empty States") e Modais foram revisados para nomenclatura condizente — ex: "Ciclo" substitui "Turma" no agendamento para manter coesão técnica.

### Estabilidade e Performance de UI

- **Cache-Busting:** Implementado o parâmetro `_t: Date.now()` em todas as requisições GET de Cursos, Módulos e Componentes dentro dos modais. Isso resolve dados "fantasmas" onde itens recém-criados não apareciam nos dropdowns devido ao cache agressivo do navegador em navegações SPA.
- **Garantia de Sessão Ativa:** As funções de fetch no `onMounted` da tela de Ofertas foram blindadas com `store.initSession()`, garantindo que as requisições de API nunca falhem por falta de `id_entidade` durante um reload forçado (F5).

---

## Histórico de mudanças

### Redesign Visual — Cursos (2026-06-23)
**`OfertaTabCursos.vue`** — Cards de cursos reestruturados:
- Layout alterado de horizontal flat para vertical em card
- Grid de 2 colunas max, accent bar lateral violet, hover-only actions
- Dois badges distintos: área acadêmica (violet intenso) e contagem de módulos (violet sutil)
- Empty state com ícone de camadas

### Redesign Visual — Programas (2026-06-23)
**`OfertaTabProgramas.vue`** — Mesmo padrão card vertical. Avatar com inicial, badge de ciclos, bloco CURSO.
**`ModalPrograma.vue`** — Step indicator compacto (bubbles: active/done/future + conectores).
**Steps:** cards clicáveis com checkbox, radio cards de estratégia, toggle switches, validação inline.

### Redesign Visual — Ciclos (2026-06-23)
**`OfertaTabCiclos.vue`** — Cards verticais, bloco "Período" com seta SVG, hover-only actions.
**`CicloTabProgramacao.vue`** — 4 seções numeradas, chips de dias, grid de simulação, cronograma com border-left colorido.

### Desacoplamento de modais + Composable do Programa (2026-06-19)
- 5 modais corrigidos: 25 $fetch extraídos para composables
- `useProgramaForm.ts` criado (fetchBaseLists, fetchCursoCiclos, fetchAllCiclos, checkOverlapping, handleSave, initEdit)
- ModalPrograma dividido em orquestrador + 4 componentes de step
- Contrato: modais zero $fetch, recebem ctx

### Refatoração de desacoplamento (2026-06-18)
- Orquestrador extraído (~40 linhas, zero lógica)
- 6 tabs auto-contidas com composable próprio
- 27 APIs movidas para `server/api/academico_oferta/`
- `initialTab` via query string (SSR-safe)

### Motor de Calendário (Abril 2026)
- `aca_calcular_cronograma_aulas` — simulação com feriados, eventos, loop safety 2000 iterações
- `aca_gerar_calendario_ciclo` — persistência, deleção de calendário anterior, atualização de data_fim
- Feriados globais e recorrentes, eventos bloqueantes, dias extras

### Processos no Programa (Junho 2026)
- Múltiplos processos seletivos por programa
- Validação de não-sobreposição
- Datas separadas: Processo Seletivo + Matrícula

### Turno e Ano/Semestre (Junho 2026)
- `turno` adicionado ao ciclo (matutino, vespertino, noturno, integral, sabado, livre)
- `ano_semestre` adicionado ao ciclo

---

## Fluxo de Navegação entre Abas (Ordem Lógica de Criação)

Para criar uma oferta do zero, o usuário deve seguir esta ordem:

```
1. ÁREAS → Criar categorias (Exatas, Saúde, etc.)
2. COMPONENTES → Criar disciplinas
3. MÓDULOS → Agrupar componentes + planos de aula
4. CURSOS → Montar grade curricular com módulos
5. CICLOS → Criar turmas com calendário
6. PROGRAMAS → Agrupar ciclos + processos seletivos → OFERTA
```

Cada aba depende dos dados criados nas abas anteriores.
