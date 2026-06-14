# Processo Seletivo — Decisão de Desacoplamento

## Contexto

Originalmente, os dados de processo seletivo (datas de início/fim de inscrições) ficavam como campos diretos na tabela `aca_programa`:

```
aca_programa
  id
  nome (via aca_curso)
  processo_seletivo_inicio   ← campo direto
  processo_seletivo_fim      ← campo direto
  matricula_inicio
  matricula_fim
  ...
```

Essa modelagem assumia que **cada programa teria apenas um processo seletivo**. Isso criava um problema real: toda vez que um programa abrisse inscrições novamente (nova turma, novo semestre), seria necessário ou editar o programa existente ou duplicá-lo.

---

## A Decisão

Em **junho de 2026**, os campos de processo seletivo e matrícula foram extraídos para uma tabela própria: `aca_processo_seletivo`.

**Relação resultante: 1 programa → N processos seletivos**

```
aca_programa
  id
  id_curso
  id_area
  ...

aca_processo_seletivo
  id
  id_programa        ← FK para aca_programa
  id_entidade        ← FK para user_entidades (multi-tenant)
  nome_processo      ← ex: "Vestibular 2026/1", "Seletivo Especial Out/26"
  data_inicio        ← abertura das inscrições
  data_fim           ← encerramento das inscrições
  matricula_inicio   ← início da janela de matrícula desse processo
  matricula_fim      ← fim da janela de matrícula desse processo
  ...
```

Um mesmo programa `"Tecnologia em Análise e Desenvolvimento de Sistemas"` pode ter:
- `Vestibular 2026/1` — inscrições de jan a mar/2026
- `Vestibular 2026/2` — inscrições de jul a set/2026
- `Seletivo Especial Dez/26` — inscrições em dezembro

Cada processo aparece como um **card separado** na vitrine pública (`/oferta`), com suas próprias datas e nome.

---

## Estrutura da Tabela

```sql
CREATE TABLE public.aca_processo_seletivo (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_programa   UUID NOT NULL REFERENCES aca_programa(id) ON DELETE CASCADE,
    id_entidade   UUID NOT NULL REFERENCES user_entidades(id) ON DELETE CASCADE,
    nome_processo TEXT NOT NULL,
    data_inicio   TIMESTAMPTZ NOT NULL,
    data_fim      TIMESTAMPTZ NOT NULL,
    matricula_inicio TIMESTAMPTZ,
    matricula_fim TIMESTAMPTZ,

    -- Auditoria padrão
    criado_por    UUID REFERENCES user_expandido(id),
    criado_em     TIMESTAMPTZ DEFAULT NOW(),
    modificado_por UUID REFERENCES user_expandido(id),
    modificado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Regra de integridade: fim não pode ser antes do início
    CONSTRAINT aca_processo_seletivo_periodo_check CHECK (data_fim >= data_inicio)
);
```

### Pontos importantes

- **`ON DELETE CASCADE` em `id_programa`**: se o programa for excluído, todos os seus processos seletivos são excluídos junto.
- **`id_entidade` obrigatório**: campo fundamental para o modelo multi-tenant (RLS filtra por entidade). Sem ele, o RLS do módulo acadêmico não funciona.
- **Constraint de período**: o banco rejeita registros onde `data_fim < data_inicio` na própria camada de dados.

---

## RLS (Row Level Security)

Segue exatamente o mesmo padrão das demais tabelas do módulo acadêmico (`aca_*`):

```sql
CREATE POLICY "aca_policy_all_access_aca_processo_seletivo"
ON public.aca_processo_seletivo FOR ALL
USING (
    -- Apenas admin ou papel acadêmico (aca_*)
    (auth.jwt() ->> 'papel' = 'admin' OR auth.jwt() ->> 'papel' LIKE 'aca_%')
    AND
    -- Apenas da entidade do usuário logado
    EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e
        WHERE e::uuid = aca_processo_seletivo.id_entidade
    )
);
```

A RPC pública `aca_get_programas_publicos` é `SECURITY DEFINER` e filtra `id_entidade` explicitamente no `WHERE` — bypassando o RLS de forma controlada para servir a vitrine pública.

---

## Impacto na Vitrine Pública

A query da RPC filtra processos com inscrições ainda abertas:

```sql
WHERE p.id_entidade = p_id_entidade
  AND ps.data_fim >= NOW()   -- ← só processos com inscrições abertas
```

Se um programa tiver dois processos abertos ao mesmo tempo, ele aparece **duas vezes** na vitrine — uma vez por processo. Isso é intencional: cada processo tem nome, datas e link de inscrição independentes.

O link do botão "Acessar" carrega o `id_processo_seletivo` como query param:

```
/form/seletivo/estudante/{id_area}/{id_programa}?id_processo_seletivo={uuid}
```

Dessa forma o formulário sabe a qual processo a inscrição pertence.

---

## Impacto no Frontend (painel administrativo)

Os endpoints de criação de programa (`/api/programas.post.ts` e `/api/programas/criar_com_ciclos.post.ts`) ainda recebem `processo_seletivo_inicio` e `processo_seletivo_fim` no corpo da requisição e os repassam para a RPC de criação. A RPC cuida de inserir o processo seletivo inicial junto com o programa.

> **Próximo passo natural**: criar uma interface no painel `academico_oferta.vue` (aba Programas) para **adicionar/editar/remover processos seletivos** de um programa existente, sem depender apenas do fluxo de criação.

---

## Arquivos de Referência

| Arquivo | Descrição |
|---|---|
| `supabase/migrations/20260603111000_create_aca_processo_seletivo.sql` | Criação da tabela, FKs, constraint e RLS |
| `supabase/migrations/20260603143500_update_aca_public_programs_to_processos.sql` | RPC pública atualizada com JOIN |
| `db/General/Scripts/tables/tabelas_academico.sql` | Schema consolidado (linha 235+) |
| `front_end/server/api/programas/criar_com_ciclos.post.ts` | Criação de programa já insere processo seletivo inicial |
| `front_end/app/pages/oferta.vue` | Vitrine pública que consome os processos |
