# Gestão Acadêmica - Oferta e Modelagem de Sistema

## Histórico de Implementações Recentes
Esta documentação registra os padrões estruturais implementados nas interfaces e lógica de negócio da gestão acadêmica (Cursos, Módulos, Componentes, Áreas e Planos de Aula).

### 1. Padrão de Exclusão (Soft/Hard Delete Flow)
Foi estabelecido um padrão consistente de UX e Segurança para exclusão de quaisquer entidades da estrutura acadêmica.

*   **Frontend (UI)**: Toda exclusão utiliza o componente `<ModalConfirmacao>` customizado, que dispensa o `confirm()` nativo do navegador, possuindo agora um tema avermelhado (`danger`) utilizando CSS vars do Tailwind (`var(--color-danger)`).
*   **Backend for Frontend (BFF)**: Adicionadas rotas de API em Nuxt (`server/api/*.delete.ts`) para intermediar os comandos, interceptando as requisições HTTPS e autenticando de forma segura (via `#supabase/server`).
*   **Database (Supabase RPCs)**: Nenhuma exclusão é feita por queries diretas baseadas em front. Todas utilizam RPCs com `SECURITY INVOKER`, garantindo que o RLS seja respeitado.

### 2. Tratamento Amigável de Chaves Estrangeiras (Foreign Keys)
Para proteger o usuário final de mensagens brutas de erro de banco de dados (ex: `violates foreign key constraint`), as novas RPCs inspecionam as tabelas adjacentes ativamente antes de realizar o `DELETE`.

Se uma dependência for encontrada, o retorno é cancelado de forma limpa e uma mensagem de instrução clara é devolvida.

Exemplos contruídos usando esse padrão:
- **`aca_delete_componente`**: Verifica uso na Grade (`aca_carga_horaria`) e nos Planos de Aula (`aca_plano_de_aula`).
- **`aca_delete_modulo`**: Verifica uso em Grade de Cursos (`aca_curso_modulo`), Turmas/Ciclos (`aca_ciclo`) e Planos.
- **`aca_delete_curso`**: Verifica existência de Turmas ("Programas") ativas vinculadas (`aca_programa`).
- **`aca_delete_plano_de_aula`**: Deleta o plano e deixa as referências ou arquivos de apoio cascatear nativamente (`aca_ref_plano_de_aula`).

### 3. Ajuste de Fluxo UPSERT (Componente)
Um bug em que componentes eram duplicados em vez de atualizados foi corrigido.
Por não receber a variável `id` original oriunda do `$fetch` no frontend, o backend interpretava a `request` como INSERT. Agora a edição possui repasse explícito do `id` acionando perfeitamente o comportamento de UPSERT.

### 4. Padrões Acordados
*   **Regras Universais**: Nunca editar manuamente migrations já submetidas, criando preferencialmente arquivos de evolução (ex: atualizações das RPCs).
*   **Permissões**: Funções de banco devem usar `SECURITY INVOKER` na sua declaração padrão, não cruzando os acessos pré-estabelecidos.
*   **Aparência e Nomenclatura**: Botões vazios ("Empty States") e Modais foram revisados para nomenclatura condizente — ex: "Ciclo" substitui "Turma" no agendamento para manter coesão técnica.

### 5. Motor de Ciclos Acadêmicos e Calendário
O motor de geração de horários (Ciclos) passou por uma refatoração profunda para suportar cenários complexos (como carga horária variável e suspensão por feriados) mantendo um dashboard fluído e limpo.
* **Carga Horária Dinâmica**: A coluna obsoleta `carga_horaria` em `aca_modulo` foi abandonada. Todo o cálculo é extraído dinamicamente via a soma das cargas de `aca_modulo_componente`.
* **Feriados e Eventos Inteligentes**: A simulação matemática (`aca_calcular_cronograma_aulas`) passou a cruzar os dias de grade regular/extra com as tabelas de `aca_feriado` e `aca_evento`. Tais interrupções aparecem de forma visual como *badges* vermelhas e não deduzem os minutos semanais exigidos.
* **Database Cleanup e Consistência de Calendário**: Apesar dos Feriados aparecerem na prévia visual, o insert final bloqueia propositalmente dados não-aula antes de jogar na tabela oficial (`aca_calendario`), garantindo que o banco de dados armazene estritamente atividades curriculares válidas.
* **Proteção de Simulação**: O código da RPC geradora ganhou travas explícitas (*Safety Guards*) para impedir Loops Infinitos caso aulas tivessem duração cadastrada corrompida (0 minutos ou negativas).

### 6. Deleção Segura de Ciclos Acadêmicos
Estendendo o padrão de Soft/Hard Delete, Ciclos agora possuem sua versão da estrutura de exclusão através da RPC `aca_delete_ciclo`:
* **Trava de Turma Master**: Impede que a exclusão apague indiretamente (em cascata) turmas integradas na tabela `aca_ciclo_programa`.
* **Exclusão Ativa de Dependências**: Apaga silenciosamente e preventivamente o calendário derivado daquele ciclo (na ausência de ON DELETE CASCADE intencional) antes de pulverizar o registro central do Ciclo, contornando travas rigorosas do banco (`ForeignKey Violation`).
* **Visualização Prévia**: Abrir a janela de *Ajustar* num Ciclo existente irá executar uma varredura cruzada auto-simulada, exibindo detalhadamente a grade mesclada com suas interrupções festivas.

### 7. Classificação por Ano-Semestre (Semestre Letivo)
Foi introduzida a classificação formal de períodos letivos nos Ciclos para facilitar a organização acadêmica histórica.
*   **Identificador de Semestre**: Adicionada a coluna `ano_semestre` (ex: `26Is`, `26IIs`, `25IIs`) à tabela `aca_ciclo`.
*   **Motor de Sugestão Automática**: Implementado o utilitário `ano_semestre.ts` que calcula o semestre sugerido com base na `data_ini` do ciclo (Mês <= 6 -> Is, Mês > 6 -> IIs).
*   **Nomenclatura Inteligente de Título**: O campo "Observação" foi renomeado para "Título do Ciclo". O sistema agora gera sugestões automáticas combinando o `Nome do Módulo` + `Ano-Semestre` caso o usuário não defina um título manual, reduzindo o esforço repetitivo de digitação.

### 8. Ofertas Acadêmicas (Programas) em Lote
A engine de criação de Programas (Ofertas) foi expandida para permitir flexibilidade total na nomenclatura comercial dos produtos ofertados.
*   **Customização Individual**: Ao optar pela estratégia de "Ofertas Múltiplas", o sistema agora abre campos de texto individuais para cada ciclo selecionado.
*   **RPC de Lote Evoluída**: A função `aca_create_programas_lote` agora aceita um payload `JSONB` com as descrições customizadas, permitindo criar múltiplos programas com nomes distintos em uma única transação atômica.
*   **Padrão de Sugestão de Oferta**: Implementada a lógica de sugestão `[Curso] - [Semestre] - [Módulo]` no wizard de conclusão, garantindo que as ofertas geradas sigam um padrão comercial limpo e profissional.

### 9. Estabilidade e Performance de UI
*   **Bust-Cache de Navegação**: Implementado o parâmetro de cache-buster `_t: Date.now()` em todas as requisições GET de Cursos, Módulos e Componentes dentro dos modais. Isso resolve problemas de "dados fantasmas" onde itens recém-criados não apareciam nos dropdowns devido ao cache agressivo do navegador em navegações SPA.
*   **Garantia de Sessão Ativa**: As funções de fetch no `onMounted` da tela de Ofertas foram blindadas com `store.initSession()`, garantindo que as requisições de API nunca falhem por falta de `id_entidade` durante um reload forçado (F5).

---
_Data da última revisão: 04 de Maio de 2026_

### 10. Dashboard de Calendário Acadêmico (Visão por Programa)

A página `academico_calendario.vue` foi expandida para suportar uma visão consolidada do calendário de um Programa, mesclando aulas, feriados e eventos numa interface dupla (mensal e semanal).

#### 10.1 Seletor de Programa
*   A aba **Calendário** ganhou um dropdown que carrega a lista de `aca_programa` da entidade.
*   Ao selecionar um programa, a função `fetchCalendarEvents` é disparada chamando o endpoint `/api/programas/calendario`.
*   O estado do programa selecionado é guardado em `selectedProgramaId` / `selectedPrograma`.

#### 10.2 Visões Mensal e Semanal
*   **Mensal**: grade 7×N semanas gerada por `calMonthGrid`, navegável via `prevMonth` / `nextMonth`.
*   **Semanal**: grade de 7 colunas gerada por `calWeekDays`, navegável via `prevWeek` / `nextWeek`.
*   O alternador entre modos é controlado por `viewMode` (`'mensal'` | `'semanal'`).
*   Cada célula recebe os eventos do dia via o computed `eventsMap` — um `Record<YYYY-MM-DD, item[]>`.

#### 10.3 RPC `aca_get_calendario_programa` (v1 → v2)
Toda a lógica de busca de dados do calendário foi centralizada numa única RPC com `SECURITY INVOKER`, eliminando queries diretas ao schema no backend for front (`calendario.get.ts`).

A RPC retorna um array `itens` unificado com o campo `_tipo` discriminando cada registro:

| `_tipo` | Fonte | Campos-chave |
|---|---|---|
| `'aula'` | `aca_calendario` | `data`, `hora_ini`, `hora_fim`, `ciclo_desc` |
| `'feriado'` | `aca_feriado` | `data`, `nome`, `recorrente_anual`, `is_global` |
| `'evento'` | `aca_evento` | `data_inicio`, `data_fim`, `nome_evento` |

**v2 (migration `20260429115000`)** corrigiu dois pontos da v1:
1.  **Projeção de feriados recorrentes**: Feriados com `recorrente_anual = true` são projetados para **cada ano** coberto pelas aulas do programa via `generate_series`, em vez de serem retornados apenas pela data original cadastrada. Isso garante que "Ano Novo" (cadastrado como `2025-01-01`) apareça também em `2026-01-01`.
2.  **Inclusão de Eventos**: `aca_evento` é consultado filtrando pelo overlap de datas com o período das aulas (`data_fim >= v_min_date AND data_inicio <= v_max_date`).

#### 10.4 `eventsMap` — Computed Unificado
O `eventsMap` processa os três tipos de item em um único passo:
*   **Aulas e Feriados**: indexados diretamente pela chave `data` (YYYY-MM-DD).
*   **Eventos multi-day**: expandidos dia a dia com `expandMultiDay()`, cada dia recebendo uma cópia com `id` único (`{id}_api_{data}`).
*   **Fallback**: eventos do `eventos.value` (fetch separado, aba Eventos) também são expandidos, evitando duplicidade.

#### 10.5 Separação de Estados de Loading
Para evitar que o spinner do calendário bloqueasse os dados de feriados/eventos (que usavam o mesmo `loading` ref), foram criados refs separados:
*   `loading` — exclusivo de `fetchCalendarEvents` (calendário do programa).
*   `loadingFeriados` — exclusivo de `fetchFeriados` (aba Feriados).
*   `loadingEventos` — exclusivo de `fetchEventos` (aba Eventos).

#### 10.6 Módulo `@nuxt/icon`
O componente `<Icon>` estava sendo usado em toda a aplicação sem o módulo instalado, gerando o warning `Failed to resolve component: Icon`. Corrigido com:
```bash
npm install @nuxt/icon
```
E adicionado em `nuxt.config.ts` nos `modules`.

#### 10.7 Robustez do `ciclos.get.ts`
A extração de `id_modulo` via join `aca_ciclo` foi tornada mais defensiva: trata tanto o caso em que o Supabase retorna o join como objeto quanto como array (comportamento variável do PostgREST dependendo do schema), evitando `undefined` silencioso.
