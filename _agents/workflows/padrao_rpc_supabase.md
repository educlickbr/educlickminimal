---
description: Padrão obrigatório para criar funções (RPCs) PostgreSQL no Supabase
---

# Padrão de Segurança para RPCs (Supabase / PostgreSQL)

## Regra Absoluta: SECURITY INVOKER

**TODA função criada deve usar `SECURITY INVOKER`.**

```sql
CREATE OR REPLACE FUNCTION public.minha_funcao(...)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER   -- ← SEMPRE ISSO
AS $$
...
$$;
```

A segurança de acesso é garantida pelo **RLS nas tabelas**, não pela função.

---

## Exceção: SECURITY DEFINER

Só é permitido em funções que:
1. São chamadas **antes** do login (ex: hooks de autenticação)
2. São chamadas por usuários **anônimos** (sem sessão)

Exemplos legítimos:
- `jwt_custom_claims` — hook do Supabase Auth
- `salvar_lead_mensagem` — formulário público de lead

**Sempre justifique no comentário da migration por que é DEFINER.**

---

## Padrão de Migration

Toda migration de RPC deve seguir:

```sql
-- ============================================================
-- RPC: nome_da_funcao
-- Data: YYYY-MM-DD
-- Descrição: O que a função faz
-- ============================================================

CREATE OR REPLACE FUNCTION public.nome_da_funcao(
    p_parametro tipo DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- lógica aqui
    RETURN jsonb_build_object('success', true, 'message', '...');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
```

---

## RLS — Padrão do Projeto

Para tabelas acessadas por usuários logados, usar JWT claims:

```sql
-- Política de acesso por entidade (admin ou membro)
CREATE POLICY "nome_tabela: select para membros da entidade"
    ON public.nome_tabela
    FOR SELECT
    USING (
        ((auth.jwt() ->> 'papel'::text) = 'admin'::text)
        OR (EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(auth.jwt() -> 'entidades') e(ent)
            WHERE nome_tabela.id_entidade = e.ent::uuid
        ))
    );
```

Criar policies separadas para SELECT, INSERT, UPDATE, DELETE.

---

## Estrutura dos Claims do JWT

```json
{
  "papel": "admin",         // role do usuário
  "entidades": ["uuid-1", "uuid-2"]  // UUIDs das entidades
}
```

Populado por `jwt_custom_claims` (hook do Auth).

---

## Relacionamentos de Usuário

```
auth.users
    └── user_expandido (id_user)
            └── user_entidade_user (id_user → user_expandido.id)
                        └── user_entidades (id_entidade)
```

`user_expandido` **NÃO tem** `id_entidade` diretamente.
A relação usuário ↔ entidade é via `user_entidade_user`.
