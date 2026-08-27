# Padrão do Consumo do Aluno — Recriação (`/minhas_atividades`)

> **Propósito:** documentar **exatamente** como o **aluno** consome o LMS — desde a **seleção do curso** (cards de programa) até abrir/responder um conteúdo. Para o agente do outro lado recriar fiel.
>
> **Visão geral do fluxo:**
> ```
> Cards de programa (matrículas) → entrar no curso → visão central (Menu|Resumo)
>   → clicar num conteúdo → visão recolhe à esquerda + conteúdo no centro
>   → material (abre e marca visto) / atividade (rascunho/entrega) / avaliação (timer/tentativas)
> ```

---

## 1. Seleção do curso (cards de programa)

### Tela

```
┌────────────────────────────────────────────────────────────┐
│  MINHAS ATIVIDADES                          [n programa(s)] │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ 🏫 Curso X      │  │ 🏫 Curso Y      │  │ ...         │ │
│  │ Programa 2026.2 │  │ Programa 2026.1 │  │             │ │
│  │ 4 ciclos      → │  │ 2 ciclos      → │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Como é feito

- Ao montar a página, o composable chama `fetchProgramas()`:

```ts
GET /api/minhas_atividades/programas?id_entidade=X&id_usuario=<user_expandido_id>
→ { itens: [ { id_matricula, id_programa, descricao, nome_curso, qtd_ciclos } ] }
```

- **Fonte:** matrículas ativas do aluno (RPC `lms_get_programas_do_aluno` via `aca_matricula` → `user_expandido`).
- Cada card mostra: avatar com ícone de curso, `nome_curso`, `descricao` (programa), `qtd_ciclos`, seta. Clique → `selecionarPrograma(prog)` (entrar no curso).

---

## 2. Entrar no curso (contexto do programa)

`selecionarPrograma(prog)` **limpa todo o estado anterior** e:

1. Carrega a **estrutura** (casca da árvore):

```ts
GET /api/minhas_atividades/estrutura?id_programa=X&id_entidade=E
→ { area?, componentes: [{id, nome, id_modulo?}], modulos: [{id, nome_modulo, id_entidade}],
    ciclos: [{id, id_modulo, descricao, ...}], aulas: [{id, id_ciclo, nome, dt_hora_ini, ...}] }
```

2. **Pré-carrega todos os escopos** em background (`carregarTodosConteudos`) para o dashboard ter contadores corretos — sem bloquear a árvore.
3. Reseta: `visaoCentral = 'menu'`, filtros, conteúdo ativo, submissões.

### Layout do contexto do curso

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Meus cursos]  Programa 2026.2 · Curso X                      │
├──────────────────────────────────────────┬──────────────────────┤
│  Visão central (Menu | Resumo)           │  Painel (dashboard)  │
│  📚 Programa      (2)                    │  Como funciona       │
│  📁 Componentes   (3)                    │  Por tipo: [Mat][Atv]│
│  📁 Módulos/Ciclos(2)                    │  Status: [✓][⏰][✕]  │
│    ...                                   │  Por escopo: ...    │
└──────────────────────────────────────────┴──────────────────────┘
```

> O **Painel à direita** (quadrante do layout `base.vue`) é o dashboard com filtros clicáveis que se aplicam à árvore E à lista (por tipo, status, escopo).

---

## 3. Visão central: Menu | Resumo

- **`visaoCentral = 'menu'` (default)** → `ConteudoArvore` — árvore de acordeons idêntica em estrutura à do currículo admin, mas com **conteúdos do aluno** (com badges de status).
- **`visaoCentral = 'resumo'`** → `ConteudoLista` — lista agrupada por seção (dedupe de conteúdo repetido entre escopos; pendências primeiro).
- Toggle `VisaoToggle` (Menu | Resumo) no header da visão (grande e recolhida).

### Árvore do aluno (acordeons)

```
📚 Programa            (conteúdos do programa — soltos)
📁 Componentes         (pasta) → cada componente → conteúdos
📁 Módulos/Ciclos      (pasta) → cada módulo → conteúdos + 📅 Aulas (cada aula → conteúdos)
```

- **Lazy loading por escopo** (mesmo padrão do admin): abre o acordeon → busca `GET /api/minhas_atividades/conteudos?...escopo_tipo=X&escopo_id=Y` → cache em `conteudosMap`.
- **A árvore mostra TODOS os escopos** (componentes, módulos, aulas) mesmo vazios — o aluno navega a estrutura completa do programa.
- Cada linha de conteúdo (`ConteudoLinha`): tipo colorido (Mat/Atv/Ava) + badges: ✓ concluído, ⏰ agendado, ✕ prazo encerrado, R rascunho, E entregue, **nota** (com tooltip "Nota · Corrigido por X em DD/MM · comentário").

---

## 4. Abrir conteúdo (visão recolhe)

```ts
function selecionarConteudo(item) {
  conteudoAtivo.value = item;
  visaoLista.value = false;
  // atividade com rascunho → pré-preenche texto/arquivo da última tentativa
}
```

- **Desktop:** a visão central recolhe para `w-80` (esquerda) e o conteúdo abre no centro (`ConteudoMaterial` / `ConteudoAtividade` / `ConteudoAvaliacao`).
- **Mobile:** conteúdo em tela cheia; botões "Menu" (árvore) e "Filtros" (dashboard) abrem **drawers** da direita (overlay + painel slide).
- **"← Todos os conteúdos"** no header do conteúdo → limpa a seleção e volta à visão central grande.

---

## 5. Os três tipos de conteúdo

### Material
- Mostra descrição + card do arquivo (R2) com botão "Abrir" → `/api/r2/sign` → nova aba.
- Ao abrir (`@aberto` → `marcarMaterialVisto`): `POST /api/minhas_atividades/progresso` (upsert em `lms_progresso_aluno`) → marca `concluido` e atualiza a linha na árvore. **Falha silenciosa** (não bloqueia a abertura).

### Atividade
- Form: textarea (resposta) + `UploadMini` (anexo) + botões "Salvar rascunho" e "Entregar".
- `POST /api/minhas_atividades/atividade` com `{ id_conteudo, id_entidade, id_matricula, texto_resposta, id_arquivo_envio, status: 'rascunho'|'entregue' }`.
- **Regras:** entregar exige texto OU arquivo; `409` = prazo expirado (toast + marca `prazo_encerrado`); entregue → bloqueia edição; entrega única (reenvio configurável fica para depois).
- Entregue → card "Atividade entregue!"; corrigida → "Corrigida pelo professor" + bloco **"Feedback do professor"** (comentário + quem/quando).

### Avaliação
- Card inicial: "Iniciar avaliação" (timer avisa). Já entregue: nota (autoavaliação) + "Tentar novamente" se houver tentativas.
- `POST /api/minhas_atividades/avaliacao/iniciar` → valida prazo/tentativas → retorna `{ id, tentativa, duracao_minutos, data_entrega_limite }` → `iniciarTimer`.
- `GET /api/minhas_atividades/avaliacao?id_conteudo=X&id_entidade=E&id_matricula=M` → perguntas **SEM gabarito** + flags `{ambiente_seguro, autoavaliacao}` (ordem aleatória já embaralhada na RPC).
- **Timer:** conta regressiva a partir de `data_entrega_limite` (prioridade) ou `duracao_minutos`; **auto-envia ~3s antes do fim**; barra no topo (alerta < 5min); sem prazo → sem barra.
- **Ambiente seguro:** fullscreen + `visibilitychange` com aviso ao sair (modo prova v1).
- **Finalizar:** `POST /api/minhas_atividades/avaliacao/finalizar` → grava respostas (alternativa/texto/arquivo por pergunta) + nota na hora se **autoavaliação** (soma pontuações corretas).
- Dissertativa com upload: `UploadMini` por pergunta → `id_arquivo_envio` na resposta.

---

## 6. Painel (dashboard) — filtros clicáveis

`MinhasAtividadesSidebar` no `#sidebar` do layout:
- **Como funciona** (instruções).
- **Por tipo:** Material / Atividade / Avaliação (com contadores) → filtram a árvore e a lista.
- **Status:** Concluídos / Pendentes / Prazo ≤7d / Rascunhos (+ obs agendados/encerrados) → filtram.
- **Por escopo:** cada pasta da árvore com contador → `irParaEscopo(chave)` abre a pasta e aplica o filtro.

> Os filtros do painel são globais (aplicam à árvore E à lista) e os contadores vêm do **pré-carregamento** de todos os escopos.

---

## 7. Estados e transições da página

| Estado | Renderização |
|---|---|
| Sem programa (cards) | Grid de cards de curso; clique entra |
| `loadingProgramas` | Spinner central |
| Contexto do curso, sem conteúdo ativo | Visão central grande (Menu = árvore \| Resumo = lista) + Painel à direita |
| Conteúdo ativo (desktop) | Visão recolhe `w-80` + conteúdo no centro + "← Todos os conteúdos" |
| Conteúdo ativo (mobile) | Conteúdo tela cheia + drawers (Menu/Filtros) |
| Material aberto | Marca visto ao abrir |
| Atividade rascunho/entregue | Form habilitado/desabilitado conforme status |
| Avaliação | Timer-bar; entregue-card com nota/re-tentar |
| Prazo encerrado | Bloqueado com aviso (não some) |

---

## 8. Checklist para recriar

- [ ] Cards de programa com `fetchProgramas` no `onMounted` (RPC de matrículas ativas).
- [ ] `selecionarPrograma`: limpa estado, carrega estrutura + **pré-carrega todos os escopos** (contadores do dashboard).
- [ ] Visão central **Menu | Resumo** (default Menu) com toggle nos headers (grande e recolhida).
- [ ] Árvore com lazy por escopo; **todos os escopos visíveis** (vazios inclusive).
- [ ] Clicar conteúdo → recolhe `w-80` + conteúdo no centro; "← Todos os conteúdos" limpa e volta.
- [ ] Material: abre via R2 sign → marca visto (progresso).
- [ ] Atividade: rascunho pré-carregado, entrega única, `409` = prazo expirado.
- [ ] Avaliação: iniciar (valida tentativas/prazo) → perguntas sem gabarito → timer com auto-envio → finalizar → nota (autoavaliação) / feedback do professor.
- [ ] Painel com filtros (tipo/status/escopo) aplicados à árvore e à lista; mobile com drawers.
- [ ] Badges de status na linha (✓ ⏰ ✕ R E nota + tooltip de correção).
