# Página de Ofertas (`/oferta`)

## Visão Geral

Página **pública** (sem autenticação) que exibe os programas acadêmicos com inscrições abertas de uma entidade. Funciona como vitrine de processos seletivos — o candidato navega pelos cursos disponíveis e clica para acessar o formulário de inscrição.

**Rota:** `/oferta`  
**Layout:** Customizado (sem o layout padrão da plataforma — `layout: false`)  
**Arquivo:** `front_end/app/pages/oferta.vue`

---

## Funcionalidades

### 1. Carregamento de dados
Ao montar, a página faz duas chamadas em paralelo:

| Endpoint | RPC Supabase | O que retorna |
|---|---|---|
| `GET /api/public/programas` | `aca_get_programas_publicos` | Lista de programas com processo seletivo ativo |
| `GET /api/public/areas` | `aca_get_areas_publicas` | Áreas educacionais disponíveis para o filtro |

Ambos recebem `?id_entidade=<uuid>` como parâmetro. Se não enviado na query string, usa um fallback fixo no código.

### 2. Filtro por Área
Botões de filtro gerados dinamicamente pelas áreas retornadas. O botão "Todos" (padrão) exibe todos os programas. Ao clicar em uma área, `filteredProgramas` (computed) filtra por `id_area`.

### 3. Cards de Programa
Cada card exibe:
- **Nome do programa** (`nome_display` = `nome_curso` ou `descricao` do programa)
- **Nome do processo seletivo** (`nome_processo`)
- **Área educacional** (`nome_area`)
- **Carga horária total** (calculada em horas a partir dos módulos/componentes)
- **Data de início das aulas** (menor `data_ini` dos ciclos do programa)
- **Inscrições até** (`processo_seletivo_fim` — destacado em laranja)
- **Matrículas a partir de** (`matricula_inicio`)

### 4. Link para Formulário de Inscrição
O botão "Acessar" de cada card leva para:

```
/form/seletivo/estudante/{id_area}/{id_programa}?id_processo_seletivo={id_processo_seletivo}
```

O `id_processo_seletivo` é passado como query param para que o formulário saiba a qual processo a inscrição pertence.

---

## Arquitetura de Dados

### Fonte: RPC `aca_get_programas_publicos`

```sql
-- Filtro principal: só retorna processos seletivos com data_fim >= NOW()
-- Ou seja: apenas inscrições ainda abertas aparecem na vitrine
WHERE p.id_entidade = p_id_entidade
  AND ps.data_fim >= NOW()
```

**Tabelas envolvidas no JOIN:**

```
aca_programa
  └── aca_processo_seletivo  (JOIN — 1 programa pode ter N processos)
  └── aca_curso              (LEFT JOIN — nome do curso)
  └── aca_area               (LEFT JOIN — nome da área)
  └── aca_ciclo_programa     (LEFT JOIN — vínculo programa ↔ ciclo)
       └── aca_ciclo         (LEFT JOIN — datas de início/fim das aulas)
            └── aca_modulo_componente  (subconsulta — carga horária)
```

**Campos retornados por programa:**

| Campo | Origem |
|---|---|
| `id` | `aca_programa.id` |
| `id_processo_seletivo` | `aca_processo_seletivo.id` |
| `id_area` | `aca_programa.id_area` |
| `nome_area` | `aca_area.nome_area` |
| `nome_processo` | `aca_processo_seletivo.nome_processo` |
| `nome_display` | `nome_curso` ou `descricao` (fallback) |
| `processo_seletivo_fim` | `aca_processo_seletivo.data_fim` |
| `matricula_inicio` | `aca_processo_seletivo.matricula_inicio` |
| `data_inicio_aula` | `MIN(aca_ciclo.data_ini)` |
| `carga_horaria_total_horas` | `SUM(carga_horaria dos componentes) / 60` |

### Segurança

- A RPC é `SECURITY DEFINER` — executa com permissões elevadas mas com filtro explícito de `id_entidade`
- `GRANT EXECUTE ... TO authenticated` — acesso apenas para usuários autenticados no Supabase
- **Sem acesso a `anon`** — a página pública usa o servidor Nuxt como intermediário (server-side API route), que usa o service role ou a sessão do usuário logado

---

## Formatação de Datas

Todas as datas são formatadas no fuso `America/Sao_Paulo` usando `Intl.DateTimeFormat`:

- `formatDate(dateStr)` → `DD/MM/YYYY`  
- `formatDateTime(dateStr)` → `DD/MM/YYYY HH:MM`

---

## Estados da UI

| Estado | Renderização |
|---|---|
| `loading = true` | Grid de 6 skeletons animados (`animate-pulse`) |
| `filteredProgramas.length === 0` | Mensagem vazia com ícone |
| Normal | Grid responsivo 1/2/3 colunas |

---

## Histórico de Mudanças Relevantes

### Junho 2026 — Refatoração para `aca_processo_seletivo`
Antes: a RPC buscava diretamente de `aca_programa` usando campos de processo seletivo embutidos no próprio programa (ex: `data_inicio_processo`, `data_fim_processo`).

Depois: criada a tabela `aca_processo_seletivo` para separar a gestão de processos seletivos dos programas. Um programa pode ter múltiplos processos ao longo do tempo. A RPC passou a fazer `INNER JOIN` com `aca_processo_seletivo`, retornando um card por processo (não por programa).

**Migration:** `supabase/migrations/20260603143500_update_aca_public_programs_to_processos.sql`

**Impacto no frontend:**
- O `key` do `v-for` dos cards passou a usar `prog.id_processo_seletivo || prog.id` (antes era só `prog.id`)
- O link do botão "Acessar" passa `id_processo_seletivo` como query param
- `prog.id` continua sendo `aca_programa.id` para não quebrar a rota do formulário

---

## Arquivos Relacionados

| Arquivo | Função |
|---|---|
| `front_end/app/pages/oferta.vue` | Página principal |
| `front_end/server/api/public/programas.get.ts` | Endpoint que chama a RPC |
| `front_end/server/api/public/areas.get.ts` | Endpoint de áreas para o filtro |
| `supabase/migrations/20260603111000_create_aca_processo_seletivo.sql` | Criação da tabela de processos seletivos |
| `supabase/migrations/20260603143500_update_aca_public_programs_to_processos.sql` | RPC atualizada com JOIN |
| `front_end/app/pages/form/[tipo_proc]/[tipo_cand]/[area_id]/[programa_id].vue` | Formulário de inscrição destino |
