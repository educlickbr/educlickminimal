# Plano — LMS Fase 2 (pós-v1 aluno)

## Visão Geral

Evolução do LMS após o fechamento do **v1** (admin: repositório → distribuição → currículo + aluno: `/minhas_atividades`).

**Referência conceitual:** [`arquitetura_lms.md`](./arquitetura_lms.md) — pipeline Blueprint (distribuição) vs. Operação (currículo), modelagem do banco e funil de resolução de conteúdos.

**Estado atual (v1 fechado):**
- Admin completo: repositório (conteúdos/blocos/questionários), distribuição (blueprint), currículo (herança, timing, destaque)
- Aluno completo: cards de programa → árvore por escopo → material (marca visto) / atividade (rascunho+entrega+upload) / avaliação (timer + sem gabarito)
- RLS do estudante + 6 RPCs do aluno (migration `20260806100005`, já no banco)

---

## Ordem de Execução

| # | Fase | Esforço | Dependência |
|---|---|---|---|
| 2.0 | Dívidas rápidas (rascunho, upload dissertativa, ordem aleatória) | 🟢 1 sessão | — |
| 2.1 | Dashboards no quadrante direito (aluno + currículo) | 🟢🟢 | — |
| 2.2 | Navegador em destaque no currículo | 🟢 | 2.1 (mesma região de layout) |
| 2.3 | Avaliação: ambiente seguro + autoavaliação + tentativas | 🟢🟢 | admin já fechado (só toggles) |
| 2.4 | Ilha de docentes (correção de entregas) | 🟢🟢🟢 | planejar como projeto próprio |
| 2.5 | Relatórios e exportação (coordenador) | 🟢🟢 | 2.4 (dados de correção) |
| — | Visão futura (notificações, questões, certificados…) | — | — |

---

## Fase 2.0 — Dívidas rápidas

### 2.0.1 Rascunho de atividade pré-carregado ao reabrir
- **Hoje:** o rascunho salva (`lms_upsert_submissao_atividade`), mas ao reabrir o conteúdo o texto/arquivo do rascunho não volta (comentário em `useMinhasAtividades.selecionarConteudo`)
- **Fix:** migration nova — `lms_get_conteudos_do_aluno` passa a retornar `atividade_texto` e `atividade_arquivo` (do `sub_atv` já JOINado); `selecionarConteudo` pré-preenche `textoAtividade`/`arquivoAtividade` quando `atividade_status === 'rascunho'`
- **Arquivos:** migration RPC + `useMinhasAtividades.ts`

### 2.0.2 Upload de arquivo na resposta dissertativa
- **Hoje:** `lms_resposta_aluno.id_arquivo_envio` existe, mas `ConteudoAvaliacao` não tem upload nas perguntas dissertativas
- **Fix:** migration nova — `lms_finalizar_submissao_avaliacao` lê `id_arquivo_envio` de cada item de `p_respostas` e grava na coluna; front: `UploadMini` por pergunta `tipo === 'dissertativa'`, resposta ganha `id_arquivo_envio`
- **Arquivos:** migration RPC + `ConteudoAvaliacao.vue` + `useMinhasAtividades.ts` (tipo `Resposta`)

### 2.0.3 Ordem aleatória de perguntas
- **Hoje:** `lms_avaliacao.ordem_perguntas` aceita `'aleatoria'` (admin já salva), mas `lms_get_avaliacao_para_aluno` não embaralha
- **Fix:** migration nova — `ORDER BY random()` quando `ordem_perguntas = 'aleatoria'` (e também embaralhar alternativas)
- **Arquivos:** migration RPC (front nada)

> ⚠️ As 3 exigem **migration nova** (RPCs da `00005` já subiram — regra do projeto: nunca editar migration subida).

---

## Fase 2.1 — Dashboards no quadrante direito

**Objetivo:** usar o quadrante direito reservado no layout das duas páginas com blocos de instrução e dados, onde **clicar filtra a árvore**.

### `/minhas_atividades` (aluno)
- **Bloco de instruções** — como funciona a página (entregar atividade, timer, prazo, rascunho)
- **Bloco de contadores** (clique filtra/expande a árvore):
  - Por escopo: conteúdos por componente, por módulo, por aula
  - Por tipo: materiais / atividades / avaliações
  - Por status: concluídos vs. pendentes, prazos próximos (24h/7d), rascunhos
- **Implementação:** contadores calculados no front a partir de `estrutura` + `conteudosMap` (sem RPC nova); clique → `toggleSection` + highlight

### `/programacao_atividades?tab=curriculo` (admin)
- **Bloco de resumo do programa:** totais por escopo, conteúdos ocultos, destaques, itens sem timing configurado (dívida de configuração)
- **Implementação:** contadores no front a partir da estrutura lazy; se precisar de totais não carregados, avaliar RPC `lms_get_resumo_programa` depois

---

## Fase 2.2 — Navegador em destaque no currículo (dívida de layout)

- **Hoje:** no admin, a árvore (esquerda) disputa espaço com o navegador de conteúdos (direita)
- **Fix (espelhar `/minhas_atividades`):** navegador de conteúdos **grande à direita** (busca + filtros); a árvore só entra em cena ao **clicar** em um conteúdo (vira detalhe)
- **Arquivos:** `ProgAtividadesTabCurriculo.vue` + `useProgAtividadesCurriculo.ts` (estado de seleção)

---

## Fase 2.3 — Avaliação: ambiente seguro + autoavaliação + tentativas

### Admin (`ModalProgAtividadesConteudo`, aba Perguntas)
- Toggles: **"Ambiente seguro"** (`ambiente_seguro`) e **"Autoavaliação"** (`autoavaliacao`)
- `autoavaliacao = true` → **bloqueia perguntas dissertativas** (só múltipla escolha)

### Banco (migration nova)
- `ALTER TABLE lms_avaliacao ADD COLUMN ambiente_seguro BOOLEAN DEFAULT FALSE, ADD COLUMN autoavaliacao BOOLEAN DEFAULT FALSE`
- `lms_upsert_avaliacao_completa` aceita as flags
- `lms_get_avaliacao_para_aluno` retorna as flags
- `lms_finalizar_submissao_avaliacao`: quando `autoavaliacao`, **calcula a nota na hora** (soma `pontuacao` das corretas) e grava `nota_total` — aluno vê a pontuação imediatamente

### Aluno (`ConteudoAvaliacao`)
- `ambiente_seguro`: fullscreen + `visibilitychange` (troca de aba perde foco/bloqueia com aviso); o "modo prova" completo (trava de navegação) fica para depois
- `autoavaliacao`: tela de resultado com nota ao finalizar

### Reenvio (dívida antiga do plano)
- `tentativas_permitidas` já existe no `lms_conteudo_operacional`; `lms_iniciar_submissao_avaliacao` libera nova tentativa quando `tentativa < tentativas_permitidas` (hoje entrega única)

---

## Fase 2.4 — Ilha de docentes (correção de entregas)

**Objetivo:** o docente vê as entregas dos alunos das atividades/avaliações **que ele criou** — fluxo invertido do aluno.

### Fluxo (padrão currículo: lista → direita)
```
Conteúdos criados por mim (atividades/avaliações)
  └─ clica → lista de alunos com entrega (pendentes primeiro)
      └─ clica no aluno → entrega + gabarito lado a lado → nota + comentário
```

### Elementos
- **Dash de pendentes:** entregas sem correção, por conteúdo, por prazo; filtros (corrigido/não, por conteúdo, por aluno)
- **Correção:** nota + comentário por entrega; comentário por questão (opcional v2)
- **Aluno vê:** nota e comentário no `lms_get_conteudos_do_aluno` (nota já retorna; comentário novo)

### Banco (migration nova)
- Colunas de comentário: `lms_submissao_atividade.comentario`, `lms_submissao_avaliacao.comentario`
- RPCs: listar entregas por conteúdo/aluno, salvar correção (nota+comentário)
- Papel: `aca_docente` já passa em `lms_usuario_eh_gestor()` → **sem mudança de RLS**

### Observações
- Reaproveita a Fase 2 de correção anotada em `documentacao/paginas/minhas_atividades.md`
- Existe `plano-gestao-docentes.md` na pasta de planos — revisar antes para alinhar cadastro vs. ilha de atividades

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
- **Mobile/UX** das páginas novas — árvore de 2 colunas precisa de adaptação responsiva

---

## Já feito (não refazer)

- ✅ Upload de arquivo em **atividade** (`ConteudoAtividade` + `UploadMini` → `id_arquivo_envio`)
- ✅ Timer com auto-envio ~3s antes do fim (sem race com `PRAZO_EXPIRADO`)
- ✅ Material marca como visto (`progresso.post.ts` → `lms_progresso_aluno`)
- ✅ Gabarito nunca vai ao aluno (RPC omite `correta`)
- ✅ Fora do prazo = bloqueado com badge (não some)
