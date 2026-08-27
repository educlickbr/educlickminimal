# Plano — LMS Fase 2 (pós-v1 aluno)

## Visão Geral

Evolução do LMS após o fechamento do **v1** (admin: repositório → distribuição → currículo + aluno: `/minhas_atividades`).

**Referência conceitual:** [`arquitetura_lms.md`](./arquitetura_lms.md) — pipeline Blueprint (distribuição) vs. Operação (currículo), modelagem do banco e funil de resolução de conteúdos.

**Estado atual:** v1 fechado + **Fase 2.0, 2.1 e 2.3 implementadas** (aguardando bateria de testes completa). Migrations criadas: `20260819100000` (RLS), `20260819100001` (2.0), `20260819100002` (2.3), `20260819100003` (drop overload).

---

## Status das Fases

| # | Fase | Status |
|---|---|---|
| 2.0 | Dívidas rápidas (rascunho, upload dissertativa, ordem aleatória) | ✅ Implementado (migration `19100001`) — testar |
| 2.1 | Dashboard no quadrante direito (aluno + currículo) | ✅ Implementado (Painel no `#sidebar`) — testar |
| 2.2 | Navegador em destaque no currículo | 🔄 **Revisado** — o usuário preferiu o comportamento dinâmico de recolher (ver abaixo) |
| 2.3 | Avaliação: ambiente seguro + autoavaliação + tentativas | ✅ Implementado (migration `19100002`) — testar |
| 2.4 | Ilha de docentes (correção de entregas) | ✅ Implementado (migration `20260820100000`) — testar |
| — | **Multientidade: permissões + domínio + branding** | 🔜 **Antes da 2.5** — plano em `plano-multientidade-permissoes.md` (relatórios são por entidade/cliente) |
| 2.5 | Relatórios e exportação (coordenador) | ⏳ |
| — | Visão futura (notificações, questões, certificados…) | ⏳ |

---

## ✅ Fase 2.0 — Dívidas rápidas (feita)

- **Rascunho de atividade pré-carregado** — `lms_get_conteudos_do_aluno` retorna `atividade_texto`/`atividade_arquivo`; `selecionarConteudo` preenche ao reabrir
- **Upload na resposta dissertativa** — `lms_finalizar_submissao_avaliacao` grava `id_arquivo_envio`; `UploadMini` por pergunta no aluno
- **Ordem aleatória** — `lms_get_avaliacao_para_aluno` embaralha perguntas e alternativas quando `ordem_perguntas = 'aleatoria'`

## ✅ Fase 2.1 — Dashboards no quadrante direito (feita)

- **Aluno**: Painel no `#sidebar` do layout (`MinhasAtividadesSidebar`) — Como funciona, Por tipo, Status, Por escopo; cliques filtram a árvore e a lista; mobile abre como drawer
- **Admin**: `ProgAtividadesCurriculoSidebar` — Como usar, Escopos do programa, Estado do currículo (associados/livres/ocultos filtram o painel)
- Pré-carregamento de todos os escopos no aluno para contadores corretos

## 🔄 Fase 2.2 — Navegador em destaque (revisada)

**Decisão:** a primeira tentativa (navegador sempre visível + árvore compacta fixa) foi **revertida**. O usuário preferiu o comportamento **dinâmico de recolher** (que existia no commit `ec9ca6b`):

- **Currículo**: sem escopo alvo → árvore `flex-1` (ocupa tudo); clicou "Adicionar" → árvore recolhe `w-96` + navegador surge à direita (slideInRight + borda violeta). **Associação exige escopo alvo** (toast se tentar sem)
- **Distribuição**: sem item → lista de escopos `flex-1`; selecionou → recolhe `w-80` + painel de associação surge ("Atribuindo a X")
- **Aluno**: visão central **Menu | Resumo** (default Menu) — ver detalhe no `minhas_atividades.md`

## ✅ Fase 2.3 — Avaliação avançada (feita)

- Colunas `ambiente_seguro` + `autoavaliacao` em `lms_avaliacao`
- Admin (`ModalProgAtividadesConteudo`): toggles na aba Perguntas; autoavaliação bloqueia dissertativas (UI + validação na RPC); `p_ordem_perguntas` corrigido no upsert
- Aluno: modo prova (fullscreen + aviso de saída), nota na hora (autoavaliação), "Tentar novamente" por `tentativas_permitidas`
- Migration `19100003`: drop do overload órfão de 7 params da upsert

---

## ✅ Fase 2.4 — Ilha Docente: Portal Docente (feita)

**Objetivo:** o docente corrige as entregas das atividades/avaliações do que ele criou (ou leciona) — fluxo invertido do aluno.

### Nova ilha no FullPageMenu (4ª ilha)

Criada a 4ª ilha **Portal Docente** (cor **âmbar/laranja**) com 2 botões:

1. **Atividades e Entregas** → rota `/portal-docente/entregas` ✅ (foco desta fase)
2. **Minha Conta** (perfil do docente — fora do escopo, placeholder desabilitado)

### Permissões (futuro, não agora)

No futuro haverá um **sistema de permissões** (tabela de permissões):
- O docente verá apenas **Programação Atividades** na ilha Acadêmico
- Terá a **própria ilha** (Portal Docente) para controlar entregas
- Hoje: botões da ilha sem restrição (gestor já vê tudo); a ilha fica visível para todos como placeholder até as permissões

### Escopo das entregas (implementado)

- **Conteúdos criados pelo docente** → pode **corrigir** (nota + comentário) — `eh_meu = (criado_por = p_id_usuario)`
- **Conteúdos do programa que ele leciona** (criados por outro) → **vê as entregas, mas não corrige** (somente leitura — badge 🔒 "Somente leitura")
- Vínculo de programa: `aca_docente → aca_docente_modulo_componente_ciclo → aca_ciclo_programa` (helper `lms_programas_do_docente`)

### Fluxo (implementado, padrão lista → direita)
```
Portal Docente → Entregas
  └─ conteúdos com entregas (atividades/avaliações) — pendentes primeiro
      └─ clica → lista de alunos com entrega (pendentes primeiro)
          └─ clica no aluno → entrega + gabarito lado a lado → nota + comentário
```

### Entregue nesta fase
- **Banco** (migration `20260820100000`): colunas `comentario` em `lms_submissao_atividade`/`lms_submissao_avaliacao`; helper `lms_programas_do_docente`; RPCs `lms_list_conteudos_entregas_docente`, `lms_list_entregas_conteudo`, `lms_get_entrega_detalhe` (gabarito + `escolhida`), `lms_salvar_correcao` (só o criador)
- **BFFs**: `server/api/docente/` (conteudos, entregas, entrega, correcao)
- **Front**: página `/portal-docente/entregas` com 3 níveis recolhidos (conteúdos → entregas → correção), Painel no `#sidebar` (Como funciona + Resumo com progresso), filtros (busca, tipo, só pendentes)
- **Segurança**: todas as RPCs `SECURITY INVOKER` (nunca DEFINER) + validação `lms_user_expandido_id()`; correção bloqueada no banco para não-criador

### Pontos abertos (pós-v1)
- **Comentário por questão** na correção (hoje nota + comentário global por entrega)
- **Nota das dissertativas na avaliação**: correção manual do professor (gabarito ao lado já funciona; autoavaliação segue automática)
- **Dash de pendentes por prazo** (vencidas/próximas) no Painel
- ~~**Aluno vê o comentário**~~ → ✅ feito (migration `20260820100003`): card de atividade/avaliação mostra "Feedback do professor" (comentário + quem/quando) e a listagem mostra tooltip na nota

### Observações
- Implementação documentada em `documentacao/paginas/portal-docente.md`
- Reaproveita a Fase 2 de correção anotada em `documentacao/paginas/minhas_atividades.md`
- Revisar `plano-gestao-docentes.md` antes (cadastro vs. ilha de atividades)

---

## Fase 2.5 — Relatórios e exportação (coordenador)

- % de conclusão por programa/curso (dados em `lms_progresso_aluno`)
- Notas médias e taxa de entrega por conteúdo/escopo (submissões + correções da 2.4)
- Exportar CSV

---

## Visão Futura (sem ordem)

- **Notificações/lembretes** — in-app primeiro ("avaliação disponível", "prazo em 24h"); e-mail depois
- **Banco de questões reutilizável** — reusar perguntas entre questionários (hoje o REPLACE apaga tudo)
- **Certificado/badge de conclusão** de programa (critério: `lms_progresso_aluno`)
- **Distribuição por turma/grupo** — hoje só por escopo acadêmico (área/curso/módulo/componente)
- **Modo prova completo** — trava de navegação (não só aviso) no ambiente seguro

---

## Já feito (não refazer)

- ✅ Upload de arquivo em **atividade** (`ConteudoAtividade` + `UploadMini` → `id_arquivo_envio`)
- ✅ Timer com auto-envio ~3s antes do fim (sem race com `PRAZO_EXPIRADO`)
- ✅ Material marca como visto (`progresso.post.ts` → `lms_progresso_aluno`)
- ✅ Gabarito nunca vai ao aluno (RPC omite `correta`)
- ✅ Fora do prazo = bloqueado com badge (não some)
- ✅ `p_ordem_perguntas` no upsert (BFF já enviava; RPC aceita agora)
- ✅ RLS `lms_resposta_aluno`: gestor all + estudante delete own
