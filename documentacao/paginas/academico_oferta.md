# Página Acadêmico Oferta (`/academico_oferta`)

## Visão Geral

Tela administrativa do módulo acadêmico para gestão de estrutura e oferta:

- **Áreas**
- **Componentes**
- **Módulos**
- **Cursos**
- **Ciclos**
- **Programas**

**Rota:** `/academico_oferta`  
**Layout:** `base`  
**Arquivo principal:** `front_end/app/pages/academico_oferta.vue`

---

## Navegação por Abas

A aba ativa é sincronizada via query string (`?tab=...`) e cada aba carrega seus dados sob demanda.

| Aba | Objetivo | Leitura principal | Ação principal |
|---|---|---|---|
| `areas` | Categorização da oferta acadêmica | `GET /api/areas` | `ModalArea` |
| `componentes` | Cadastro de componentes curriculares | `GET /api/componentes` | `ModalComponente` |
| `modulos` | Agrupamento de componentes e planos | `GET /api/modulos` (+ componentes) | `ModalModulo` |
| `cursos` | Grade curricular por curso | `GET /api/cursos` (+ áreas/módulos) | `ModalCurso` |
| `ciclos` | Manifestação temporal de módulo | `GET /api/ciclos` (+ mod/prog) | `ModalCiclo` |
| `programas` | Ofertas agrupando ciclos | `GET /api/programas` (+ cursos) | `ModalPrograma` |

---

## O que cada aba faz

### 1. Áreas
- Lista áreas por entidade.
- Permite criar/editar via **ModalArea**.
- Exclusão via **ModalConfirmacao** e `DELETE /api/areas`.

### 2. Componentes
- Lista componentes curriculares.
- Criação/edição via **ModalComponente** (o modal emite `save` e a página persiste em `/api/componentes`).
- Exclusão com confirmação.

### 3. Módulos
- Lista módulos com indicadores (qtd. componentes/planos).
- Modal de módulo com 3 abas internas:
  - **Geral** (nome/descrição),
  - **Componentes** (`/api/modulo_componente`),
  - **Planos** (`/api/plano_aula`).
- Exclusão com confirmação.

### 4. Cursos
- Lista cursos e vínculo de área.
- Modal de curso com 3 abas internas:
  - **Geral**,
  - **Áreas** (gestão de áreas no contexto do modal),
  - **Grade** (vínculo de módulos via `/api/curso_modulo`).
- Exclusão com confirmação.

### 5. Ciclos
- Lista ciclos com período e módulo relacionado.
- Modal de ciclo com foco em programação temporal:
  - dados gerais,
  - grade semanal,
  - dias extras,
  - simulação e geração de cronograma.
- Endpoints-chave: `/api/ciclos`, `/api/ciclos/calcular_cronograma`, `/api/ciclos/gerar`, `/api/ciclo_dia_semana`, `/api/ciclo_dia_extra`.
- Exclusão com confirmação.

### 6. Programas
- Lista programas (descrição, curso, qtd. ciclos).
- Criação/edição via **ModalPrograma** (wizard por etapas).

---

## Modais da página

| Modal | Função | Onde é usado |
|---|---|---|
| `ModalArea` | CRUD de área educacional | Aba **Áreas** |
| `ModalComponente` | Form de componente (emite payload para salvar) | Aba **Componentes** |
| `ModalModulo` | Gestão completa de módulo + componentes + planos | Aba **Módulos** |
| `ModalCurso` | Gestão de curso + área + grade de módulos | Aba **Cursos** |
| `ModalCiclo` | Programação de ciclo e geração de calendário | Aba **Ciclos** |
| `ModalPrograma` | Wizard de oferta/programa com seleção de ciclos e processos | Aba **Programas** |
| `ModalConfirmacao` | Confirmação de ações destrutivas | Exclusões em várias abas |

---

## Mudanças recentes nesta página (Processos no Programa)

### Contexto
O passo de **Prazos** no `ModalPrograma` foi substituído por **Processos**, para permitir múltiplos processos seletivos por programa.

### Mudança de UX/Frontend
No `ModalPrograma`:
- etapa 3 agora é **Processos**;
- em vez de 1 bloco de datas, há **cards múltiplos** de processo;
- cada card possui:
  - `nome_processo`
  - `data_inicio` / `data_fim` do processo seletivo
  - `matricula_inicio` / `matricula_fim` (opcional)
- validações no cliente:
  - nome/início/fim obrigatórios por processo,
  - períodos válidos (fim >= início),
  - **sem sobreposição entre processos** (regra de não overlap).

### Mudança de API
- Novo endpoint para edição:
  - `GET /api/programas/processos?id_programa=...`
- Endpoints de salvar passaram a aceitar `processos`:
  - `POST /api/programas`
  - `POST /api/programas/criar_com_ciclos`
- Mantido fallback legado com campos únicos (`processo_seletivo_*`, `matricula_*`) para compatibilidade.

### Mudança de banco
Migration nova:
- `supabase/migrations/20260610154000_programa_processos_multiplos.sql`

Principais pontos:
- sincronização de processos por programa via função `aca_sync_processos_programa`;
- adaptação das RPCs `aca_upsert_programa` e `aca_create_programas_lote` para receber `p_processos JSONB`;
- regra de não sobreposição no banco com constraint de exclusão por intervalo (`tstzrange`).

Migration complementar de escopo de matrícula:
- `supabase/migrations/20260610142000_move_matricula_to_processo_seletivo.sql`

---

## Fluxo técnico resumido (Programa)

1. Usuário abre modal em **Programas**.
2. Seleciona origem/curso/ciclos.
3. Cadastra 1+ processos nos cards da etapa **Processos**.
4. Frontend valida não-overlap.
5. Salva em `/api/programas` (edição) ou `/api/programas/criar_com_ciclos` (criação).
6. Backend encaminha para RPCs acadêmicas, que sincronizam processos em `aca_processo_seletivo`.

---

## Arquivos relacionados

| Arquivo | Responsabilidade |
|---|---|
| `front_end/app/pages/academico_oferta.vue` | Página principal e orquestração de abas/modais |
| `front_end/app/components/ModalPrograma.vue` | Wizard de criação/edição de programa |
| `front_end/server/api/programas/processos.get.ts` | Leitura de processos por programa |
| `front_end/server/api/programas.post.ts` | Persistência de edição de programa |
| `front_end/server/api/programas/criar_com_ciclos.post.ts` | Persistência de criação em lote |
| `supabase/migrations/20260610154000_programa_processos_multiplos.sql` | Regra estrutural e RPCs para múltiplos processos |
| `supabase/migrations/20260610142000_move_matricula_to_processo_seletivo.sql` | Matrícula no escopo do processo seletivo |
