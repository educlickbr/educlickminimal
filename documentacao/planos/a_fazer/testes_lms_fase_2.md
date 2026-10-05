# Roteiro de Testes — LMS Fase 2 (2.0 → 2.4)

> **Objetivo:** validar em runtime o que já foi implementado nas Fases 2.0–2.4, que hoje estão marcadas como "✅ implementado — testar" em `lms_fase_2.md`. É o que trava o fechamento do LMS antes da 2.5.
>
> **Como usar:** marque cada item `[x]` conforme passa. Se falhar, registre na seção **9. Relato de falha** (URL + payload/console). Não "conserta na mão" — só registre.
>
> **Ambiente:** `npm run dev` no `front_end` + banco remoto já com as migrations aplicadas até `20260827173000`.

---

## 0. Pré-requisitos

- [ ] Um usuário **aluno** (matriculado num programa/ciclo com conteúdos distribuídos).
- [ ] Um usuário **gestor** (acesso a `Programação de Atividades`).
- [ ] Um usuário **docente** (com login no Portal Docente) — de preferência o **criador** de pelo menos um conteúdo, para testar correção.
- [ ] Pelo menos 1 **material**, 1 **atividade** e 1 **avaliação** já distribuídos/associados ao programa do aluno.
- [ ] Ao menos uma **avaliação** com ambiente seguro, outra com autoavaliação, e outra com `tentativas_permitidas > 1`.

---

## 1. Fase 2.0 — Dívidas rápidas

### 1.1 Rascunho de atividade pré-carregado
- [ ] Aluno abre uma **atividade**, escreve texto e anexa um arquivo, **sai sem entregar**.
- [ ] Reabre a mesma atividade → **texto e arquivo continuam** ali.
- **Esperado:** `lms_get_conteudos_do_aluno` devolve `atividade_texto`/`atividade_arquivo`; `selecionarConteudo` preenche ao reabrir.

### 1.2 Upload na resposta dissertativa
- [ ] Aluno abre uma **avaliação** com pergunta dissertativa, anexa arquivo (UploadMini) e entrega.
- [ ] Confere que a entrega gravou o arquivo (aluno vê o anexo; docente vê "Abrir arquivo enviado").
- **Esperado:** `id_arquivo_envio` gravado em `lms_resposta_aluno` / `lms_submissao_*`.

### 1.3 Ordem aleatória
- [ ] Admin cria avaliação com `ordem_perguntas = 'aleatoria'` (mín. 3 perguntas / 3 alternativas).
- [ ] Aluno abre a avaliação **duas vezes** → ordem de perguntas/alternativas varia.
- **Esperado:** `lms_get_avaliacao_para_aluno` embaralha quando `ordem_perguntas = 'aleatoria'`.

---

## 2. Fase 2.1 — Dashboards no quadrante direito

### 2.1.1 Aluno (`/minhas_atividades`)
- [ ] Sidebar (quadrante direito) mostra **Como funciona**, **Por tipo**, **Status**, **Por escopo**.
- [ ] Clicar num bloco **filtra** a árvore e a lista ao lado.
- [ ] No mobile, a sidebar abre como **drawer** (overlay + slide).

### 2.1.2 Currículo (`/programacao_atividades?tab=curriculo`)
- [ ] Sidebar mostra **Como usar**, **Escopos do programa**, **Estado do currículo**.
- [ ] Clicar em associados/livres/ocultos **filtra** o navegador/painel ao lado.

---

## 3. Fase 2.2 — Navegador dinâmico (comportamento de recolher)

### 3.1 Currículo
- [ ] Sem escopo alvo → árvore ocupa tudo (`flex-1`).
- [ ] Clicar em **"+ Adicionar conteúdo"** num escopo → árvore **recolhe** (`w-96`) e o **navegador surge à direita** (slide + borda violeta).
- [ ] Tentar associar **sem escopo alvo** → **toast** de aviso (não associa).
- [ ] Clicar **Cancelar** → volta ao estado recolhido/expandido anterior.

### 3.2 Distribuição (`/programacao_atividades?tab=distribuicao`)
- [ ] Sem item selecionado → lista de escopos `flex-1`.
- [ ] Selecionar um item → lista **recolhe** (`w-80`) e surge o painel **"Atribuindo a X"**.
- [ ] As 4 sub-abas (Áreas/Cursos/Módulos/Componentes) são **independentes** (não cascata).

### 3.3 Aluno
- [ ] Visão central tem **Menu | Resumo**, iniciando em **Menu**.
- [ ] "Todos os conteúdos" **limpa o central** e volta ao menu (não deixa tela ociosa).

---

## 4. Fase 2.3 — Avaliação avançada

### 4.1 Admin (`ModalProgAtividadesConteudo`, aba Perguntas)
- [ ] Toggles **ambiente seguro** e **autoavaliação** aparecem para tipo avaliação.
- [ ] Marcar **autoavaliação** → opção **dissertativa fica desabilitada** na UI.
- [ ] Salvar e reabrir → os flags persistem.
- [ ] (Banco) tentar salvar com autoavaliação + dissertativa via payload direto → **RPC rejeita**.

### 4.2 Aluno — ambiente seguro
- [ ] Iniciar avaliação com ambiente seguro → entra em **modo prova (fullscreen)** com aviso ao tentar sair.

### 4.3 Aluno — autoavaliação
- [ ] Finalizar avaliação de autoavaliação → **pontuação aparece na hora**.

### 4.4 Aluno — tentativas
- [ ] Avaliação com `tentativas_permitidas = 2` → após a 1ª entrega aparece **"Tentar novamente"**.
- [ ] Esgotadas as tentativas → **não** oferece nova.

---

## 5. Fase 2.4 — Portal Docente (`/portal-docente/entregas`)

### 5.1 Navegação e animação
- [ ] Nível 1 (nada selecionado): lista de **conteúdos com entregas** `w-full`, pendentes primeiro.
- [ ] Selecionar conteúdo → **recolhe para `w-80`** + lista de **alunos** entra à direita.
- [ ] Selecionar aluno → conteúdos **saem para a esquerda** + **correção** entra à direita, com botão **Voltar**.
- [ ] Voltar → animação **inversa consistente** (conteúdos voltam da esquerda, correção sai à direita).
- **Referência:** `padrao_animacao_yazi_niri.md`.

### 5.2 Escopo de correção
- [ ] Conteúdo **criado pelo docente** → form de nota/comentário **habilitado**.
- [ ] Conteúdo do **programa que ele leciona** (criado por outro) → aparece **🔒 Somente leitura** e form desabilitado.
- [ ] (Banco) tentar `POST /api/docente/correcao` num conteúdo de outro → **erro** (não confia no front).

### 5.3 Correção e auditoria
- [ ] Salvar correção → toast de sucesso; badge do aluno vira **nota verde**.
- [ ] Header da correção mostra **"Corrigido por {nome} em DD/MM às HH:MM"**.
- [ ] Botão muda de **"Salvar correção"** para **"Editar correção"** depois de salvo.
- [ ] Após salvar, os **contadores** (pendentes/total) atualizam sem recarregar (re-link).

### 5.4 Gabarito e feedback
- [ ] Na avaliação, o **gabarito** aparece só para o docente (alternativa correta ✓, escolhida pelo aluno ✕/badge).
- [ ] Aluno vê o **"Feedback do professor"** (comentário + quem/quando) no card.

---

## 6. Regressões rápidas (sanidade)

- [ ] `GET /api/programacao_atividades/curriculo` responde 200 com a árvore (sem erro de `FROM-clause`).
- [ ] `GET /api/docente/entrega` responde 200 (sem `column alt.ordem does not exist`).
- [ ] Associação em **Currículo** e **Distribuição** gravam sem violar `lms_conteudo_operacional_um_escopo`.

---

## 7. Fora de escopo (não testar agora)

- **Fase 2.5 — Relatórios/exportação** (não iniciada).
- Multitenant "na medida" (portal por entidade, admin de páginas, eventos, comunicação).
- itens adiados de multitenant (tela de permissões — Fase D; RLS por entidade — Fase E).

---

## 8. Relato de falha

Para cada falha, cole aqui:

```
Fase:            (ex.: 2.3)
Item:            (ex.: 4.2 ambiente seguro)
Passos:          1) ... 2) ... 3) ...
Esperado:        ...
Obtido:          ...
URL/payload:     ...
Console/Rede:    (status + mensagem)
```

---

## 9. Checklist de encerramento

- [ ] Todos os itens de 1 a 6 verificados.
- [ ] Falhas registradas na seção 8 (se houver) e corrigidas em nova migration quando for banco.
- [ ] `lms_fase_2.md` atualizado: 2.0–2.4 de "testar" → **"validado"**.
- [ ] Só então iniciar a **Fase 2.5**.

---

## Histórico

| Data | Descrição |
|---|---|
| 2026-10-05 | Criação do roteiro (retomada do projeto após pausa). |
