# Modelos de Dados Atualizados (Refactoring 2026-03-20)

Este documento contém o estado atual das tabelas e RPCs modificados durante o processo de refactoring de `id_empresa` para `id_entidade` e a implementação da arquitetura multi-produto.

## 1. Tabelas de Estrutura Principal

### `public.user_entidades`
Tabela unificada que representa o Tenant.
- `id` (UUID, PK)
- `nome_entidade` (TEXT)
- `tipo` (TEXT: 'familia', 'empresa')
- `url` (TEXT) - URL mestre da entidade.
- `logo_aberto`, `logo_fechado` (TEXT)
- `cor_principal`, `cor_secundaria` (TEXT)
- `criado_em`, `modificado_em` (Auditoria)

### `public.produto`
Catálogo global de apps/módulos.
- `id` (UUID, PK)
- `nome` (TEXT) - Ex: "Educlick Acadêmico"
- `slug` (TEXT, UNIQUE) - Ex: "academico"
- `descricao` (TEXT)

### `public.entidade_produto`
Associação entre Entidade e Produto (Contexto de Acesso).
- `id` (UUID, PK)
- `id_entidade` (UUID, FK -> `user_entidades`)
- `id_produto` (UUID, FK -> `produto`)
- `url_acesso` (TEXT, UNIQUE) - URL específica para este produto.
- `configuracoes` (JSONB)
- `ativo` (BOOLEAN)

### `public.user_produto`
Vínculo explícito de Usuário a Produto dentro de uma Entidade.
- `id` (UUID, PK)
- `id_user_expandido` (UUID, FK -> `user_expandido`)
- `id_entidade` (UUID, FK -> `user_entidades`)
- `id_produto` (UUID, FK -> `produto`)
- `papel_no_produto` (TEXT)

---

## 2. Tabelas Acadêmicas (`aca_*`)

Todas as tabelas do módulo acadêmico foram migradas para usar `id_entidade`.
- **Exemplo: `aca_componente`**
    - `id` (UUID, PK)
    - `id_entidade` (UUID, FK -> `user_entidades`)
    - `nome_componente` (TEXT)
    - `descricao` (TEXT)
    - (Audit data)

*O mesmo se aplica a: `aca_modulo`, `aca_curso`, `aca_ciclo`, `aca_programa`, `aca_calendario`, etc.*

---

## 3. RPCs (Stored Procedures)

### Sessão e Contexto
- `nxt_get_user_session_v1(p_auth_id UUID)`: Retorna `usuario` + `entidades[]` (com produtos aninhados).
- `aca_get_contexto_por_url(p_url TEXT)`: Resolve `id_entidade` e `id_produto` pela URL.

### Gestão Acadêmica
- `aca_upsert_componente(p_id, p_id_entidade, ...)`
- `aca_get_componentes_paginado(p_id_entidade, p_pagina, p_limite, ...)`
- `aca_delete_componente(p_id, p_id_entidade)`
