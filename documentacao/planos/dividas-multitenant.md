# Dívidas e Frentes Futuras — Multientidade / Permissões

> **Status:** Registro consolidado do que está pendente no escopo de multientidade, com ordem de execução e cortes.
> **Fonte:** `documentacao/planos/plano-multientidade-permissoes.md` e `documentacao/arquitetura/permissoes.md`.
> **Data:** 2026-08-21 (revisado e reorganizado).

---

## O que já está feito

- **Fase A (schema+seed)** ✅ — `user_entidades` (dominios, rota_inicial, configuracoes), `app_permissoes`, `user_papeis_auth.id_entidade`, seed por papel (entidade acadêmico).
- **Fase B (backend de sessão)** ✅ — RPCs `app_resolver_entidade_por_dominio` e `app_get_minha_sessao`; BFF `/api/me` estendido; `user_produto` removido; `nxt_get_user_session_v1` monta produtos via `entidade_produto`.
- **Fase F (multi-produto / gate)** ✅ — acesso por produto (`entidade_produto` + `sem_acesso` no BFF + avisa/desloga no front).
- **Fase C (front de sessão)** ✅ implementada, **parcialmente validada** — menu filtra por permissão, branding por entidade, toggle claro/escuro, fallback de entidade por env.
- **Glow com a cor da entidade (item 1)** ✅ — `aplicarBranding()` converte o hex da cor principal em `--color-primary-rgb` (`hexToRgbString`), então os efeitos de brilho acompanham a cor da entidade.

---

## 🚀 Agora (ordem de execução)

1. ~~**Entidade define o tema claro/escuro por padrão**~~ — **✅ FEITO (2026-08-26).** Coluna `user_entidades.tema`; RPCs retornando `tema`; BFF `/api/me`; store `aplicarTemaDaEntidade`. **Auth (login/cadastro/recuperar/trocar) também segue o tema da entidade** via endpoint BFF `/api/entidade/dominio` + composable `useTemaEntidade` (dívida #1 do plano-tema resolvida). Segurança: RPCs de resolução viraram `SECURITY DEFINER` chamadas via BFF (grant só service_role). Botões/accent bars sólidos em `var(--color-primary)`. Falta apenas **validar em runtime** (`supabase db push` + nuxt).
2. ~~**"Selecione..." nos dropdowns (`BaseField`)**~~ — **✅ FEITO (2026-08-26).** Nova prop `emptyLabel` no `BaseField` type="select" (com fallback para o `placeholder` via $attrs); opção vazia fica `disabled` quando `required`. Aplicado em selects de `academico_oferta`, `formularios` e modais. Aplica o novo padrão: `empty-label="Selecione..."`.

---

## 🧩 Na medida do uso — portais/páginas por cliente (multitenant)

4. ~~**Página de início / landing da ensi**~~ — **✅ FEITO (2026-08-27).** Estrutura criada em `components/landing/ensi/` e roteada em `index.vue`. Integrada com o BFF público, cores da marca ENSI (laranja `#DF8B35` + claro), logos dinâmicos, FAQ acordeão, contatos reais e vitrine dinâmica de ofertas consumindo `/api/public/*`. Documentado em `documentacao/paginas/landing_page_ensi.md`.
5. **Rota/portal inicial por entidade** — como tudo é desacoplado, todos começam na mesma página; quando um cliente pedir alteração, usar um `if` por entidade para mostrar componentes diferentes (componente A para entidade X, B para Y). **Não urgente — na medida do uso.**
6. **Admin de páginas** — lugar onde o cliente monta o seu portal escolhendo módulos/blocos e configurações. A base pronta + customização por cliente (anti-SaaS).
7. **Módulo de eventos** — espetáculos, filmes, palestras, encontros, congressos, etc. Entra no **admin da página**, escolhendo o **formato** do evento. (Casa com a arquitetura de permissões por ilha.)
8. **Módulo de comunicação** — blog + quadro de novidades. Também no **admin da página**. **Bem futuro**, ainda multitenant.

---

## 📋 Próximo grande módulo (depois de resolver o multitenant)

9. **Cadastro manual de colaborador** — cadastrar pessoa manualmente (só no `user_expandido`), gerar um **convite**; no login, o sistema descobre que já existe `user_expandido` e abre espaço para criar senha + confirmar **inline** (mesmo fluxo do onboarding). Para quem não veio por matrícula/processo seletivo (colaboradores). **Ainda não feito.**

---

## ⏸️ Adiadas

10. **Fase D — tela de administrar permissões** — hoje as permissões são geridas no painel do Supabase/SQL. A tela para o gestor conceder/revogar sem SQL fica para depois (relacionada ao admin de páginas / permissões por ilha).
11. **Fase E — RLS por entidade (segurança no banco)** — hoje o banco usa o papel global em `noticias`/`leads`. Evoluir para checar o papel da entidade certa. Escopo pequeno (2 policies), mas é segurança — fazer com teste.

---

## ✂️ Cortadas (não pertencem a este projeto)

- **Seletor de entidade no menu / URL única multi-tenant** — este projeto resolve a entidade **por URL/domínio** (white label). (Removida antes.)
- **Domínios/URL reais** — já estão definidos (não é dívida). (Removida nesta revisão.)
- **Financeiro Família (multi-produto / módulo financeiro)** — é **outro projeto Nuxt em outra pasta**, tratado por lá. (Removida nesta revisão.)

---

## Ordem resumida das próximas ações

```
AGORA:   ~~tema por entidade (1)~~ ✅ ~~select "Selecione..." (2)~~ ✅ → landing da ensi (4)
NA MEDIDA: página da ensi (4) → portal/rota por entidade (5) → admin de páginas (6)
          → módulo de eventos (7) → comunicação blog/novidades (8)
PRÓXIMO:  cadastro de colaborador + convite (9)
ADIADO:   tela de permissões Fase D (10) · RLS Fase E (11)
```

---

## Histórico de revisão

| Data | Descrição |
|---|---|
| 2026-08-21 | Reorganizado em ordem de execução + frentes futuras (admin de páginas, eventos, comunicação), cortes (domínios, Financeiro Família) |
| 2026-08-21 | Registro inicial consolidado da conversa |
| 2026-08-26 | Glow (item 1) marcado ✅ feito; tema por entidade (item 2) com código pronto, falta validar; numeração/ordem atualizada |
| 2026-08-26 | Tema por entidade ✅ FEITO + auth segue tema da entidade (BFF `/api/entidade/dominio` + `useTemaEntidade`); RPCs DEFINER via BFF; botões/barras sólidos. Próximo: **landing da ensi** (item 4) |
| 2026-08-26 | `BaseField` select ganhou `emptyLabel` (placeholder de opção vazia); aplicado em `academico_oferta`/`formularios`/modais. Item 2 ✅ FEITO. Próximo: landing da ensi |
| 2026-08-27 | Landing Page ENSI ✅ FEITA (Item 4). Estrutura modular em `components/landing/ensi/`, integração BFF, tema claro/laranja, logos dinâmicos, FAQ acordeão, contatos reais e vitrine dinâmica de cursos integrada com `/api/public/*`. Documentada em `documentacao/paginas/landing_page_ensi.md`. |
