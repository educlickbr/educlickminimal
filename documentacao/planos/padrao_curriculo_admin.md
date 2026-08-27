# Padrão do Currículo (Admin) — Recriação

> **Propósito:** documentar **exatamente** como funciona o **Currículo** (operacional) do LMS — a tela que gerencia o que o **programa** (turma) consome. Para o agente do outro lado recriar fiel.
>
> **⚠️ O erro mais comum:** entender como mais uma navegação em cascata de abas. **NÃO É.** O Currículo usa **acordeons** (pastas) e o conceito de **escopo alvo**: você escolhe uma pasta da árvore (programa/componente/módulo/ciclo/aula), clica em "Adicionar" e associa conteúdos do repositório **àquele escopo** com radio (associar) + toggle (visível/oculto) + configuração de prazo.

---

## 1. O que é (e o que não é)

**NÃO é** (errado):
```
Abas Área → Curso → Módulo → Componente (como na Distribuição) com cascata
```

**É** (correto):
```
1. Escolhe o PROGRAMA (dropdown rico no topo)  ← a "turma" que vamos gerir
2. Carrega a ÁRVORE de acordeons daquele programa:
     📚 Programa (conteúdos soltos)
     📁 Componentes (pasta) → cada componente
     📁 Módulos/Ciclos (pasta) → cada módulo → 📅 Aulas do módulo
3. Abre uma pasta/acordeon → conteúdo carregado SOB DEMANDA (lazy)
4. Para INJETAR conteúdo numa pasta: clica em "Adicionar" daquela pasta
   → a pasta vira o ESCOPO ALVO → a árvore recolhe (w-96) e o NAVEGADOR
   de conteúdos surge à direita
5. No navegador: radio associa/desassocia o conteúdo ao escopo alvo;
   toggle mostra/oculta do aluno; engrenagem configura prazo/disponibilidade
```

**A associação no Currículo é diferente da Distribuição:** aqui você **não navega por abas** — você **escolhe a pasta** (escopo) e injeta/controla conteúdos **daquele escopo para aquele programa**. O que veio da Distribuição aparece como **herdado** (pode ser desativado por programa).

---

## 2. A tela (layout)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [ Dropdown rico: "Programa 2026.2 · Curso X · 4 ciclos"      ▾ ]    │
├──────────────────────────────┬───────────────────────────────────────┤
│  Currículo            [badge]│  (quando há escopo alvo → surge aqui)  │
│  📚 Programa            (2) │  Conteúdos  Programa 2026.2           │
│  📁 Componentes         (3) │  [busca] [Todos][Atv][Ava] [Só meus]  │
│    ▸ Componente A       (1) │  Escopo alvo: componente:A   [Cancelar]│
│    ▸ Componente B       (2) │  ┌──────────────────────────────────┐  │
│  📁 Módulos/Ciclos      (2) │  │ [radio] Conteúdo 1   [Visível] ⚙ │  │
│    ▸ Módulo 1           (3) │  │ [radio] Conteúdo 2   [Visível] ⚙ │  │
│      📅 Aula 12/08      (1) │  └──────────────────────────────────┘  │
│                             │  ← entra com slideInRight              │
│  (recolhe p/ w-96 quando    │                                        │
│   escopo alvo ativo)        │                                        │
└──────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Estado (composable)

```ts
programaSelecionado   // ProgramaOption — o programa gerido (dropdown)
estrutura             // { area?, componentes[], modulos[], ciclos[], aulas[] } — casca da árvore
conteudosMap          // Map<chave, ConteudoItem[]> — conteúdos por escopo (lazy)
expandedSections      // Set<string> — acordeons abertos
pastaAberta           // { componentes, modulos } — pastas abertas
selectedScopeKey      // string | null — o ESCOPO ALVO (ex.: 'componente:<id>', 'ciclo:<id>', 'calendario:<id>', 'programa', 'area')
conteudosDisponiveis  // ConteudoPanel[] — navegador (todos do repositório + estado)
ativosMap             // Map<id_conteudo, { ativo, op_id, timing }> — linhas operacionais
```

**Chaves de escopo da árvore** (o que o `selectedScopeKey`/`expandedSections` guardam):

```ts
'programa'                          // conteúdos soltos do programa (id_programa)
'area'                              // conteúdo de área do programa
'componente:<id>'                   // componente (id_componente, vínculo via programa)
'modulo:<id>'                       // módulo (id_modulo)
'ciclo:<id>'                        // ciclo (id_ciclo) — subitem do módulo
'calendario:<id>'                   // aula (id_calendario) — dentro do ciclo/módulo
```

---

## 4. Fluxo de dados (funções + BFFs)

| Ação | Função | Chamada BFF |
|---|---|---|
| Selecionar programa | `selecionarPrograma(prog)` | `Promise.all([ GET /api/programacao_atividades/curriculo?id_programa=X&id_entidade=E , GET .../curriculo/ativos?id_programa=X&id_entidade=E ])` → `estrutura` + `ativosMap`; depois `GET .../conteudos` (navegador) |
| Abrir acordeon (lazy) | `toggleSection(key)` | `GET /api/programacao_atividades/curriculo/conteudos?id_programa=X&id_entidade=E&escopo_tipo=<tipo>&escopo_id=<id>` → `{ conteudos: ConteudoItem[] }` (só na primeira vez por chave) |
| "Adicionar" numa pasta | `definirEscopoAlvo(key)` | (front) seta `selectedScopeKey`; árvore recolhe `w-96`; navegador surge |
| **Associar** (radio) | `toggleAssociacaoPainel(c)` | **exige escopo alvo** (toast se não) — `POST /api/programacao_atividades/curriculo` com body do operacional → cria linha; ou `DELETE` com `{id: op_id}` → remove linha (volta à herança) |
| **Mostrar/ocultar** (toggle) | `toggleAtivoPainel(c)` | exige escopo alvo — `POST .../curriculo` com `ativo: !ativo` (upsert) → linha com ativo false = oculto do aluno |
| Ativo/destaque (árvore) | `toggleAtivo(item, key)` / `toggleDestaque(item, key)` | `POST .../curriculo` (herdado ativo → cria linha `ativo:false`; linha `ativo:false` → cria linha `ativo:true`; linha → DELETE) |
| Configurar prazo | `abrirConfigTiming(c)` → `salvarTiming()` | Modal → `POST .../curriculo` com timing (`data_disponivel`, `data_entrega_limite`, `duracao_minutos`, `tentativas_permitidas`, `pontuacao_maxima`) |

### O body do POST (constraint exclusiva — o coração)

```ts
// montarBodyOperacional: exatamente UM de (id_programa, id_ciclo, id_calendario)
function escopoKeyToParams(key) {
  if (key.startsWith('ciclo:'))      return { id_ciclo: key.split(':')[1] };
  if (key.startsWith('calendario:')) return { id_calendario: key.split(':')[1] };
  return {}; // area, componente, modulo, programa → só id_programa
}

// POST /api/programacao_atividades/curriculo
{
  "id_entidade": "uuid",
  "id_conteudo": "uuid",
  "ativo": true | false,            // false = oculto do aluno
  "usuario_id": "uuid",
  "id_programa": "uuid"             // OU "id_ciclo" OU "id_calendario" — nunca 2 juntos
  // opcional: "destaque": true, "data_disponivel": ISO, "data_entrega_limite": ISO,
  //           "duracao_minutos": 60, "tentativas_permitidas": 2, "pontuacao_maxima": 10
}
```

> **Regra do "herdado":** sem linha em `lms_conteudo_operacional` = **herdado** (vem da distribuição) = **visível** para o aluno. Criar linha = **override**: `ativo:true` (reforça/ajusta timing) ou `ativo:false` (oculta **só para este programa**). Remover a linha (DELETE) = volta à herança.

---

## 5. Regras de negócio do Currículo

1. **Associação exige escopo alvo** — sem `selectedScopeKey`, radio/toggle do navegador não funcionam (toast "Selecione primeiro o escopo").
2. **Escopo único por linha** — o body manda `id_programa` OU `id_ciclo` OU `id_calendario` (constraint `lms_conteudo_operacional_um_escopo`).
3. **Lazy loading** — cada acordeon carrega conteúdos **na primeira abertura** (cache em `conteudosMap`); a árvore (casca) vem completa, os conteúdos sob demanda.
4. **Ativo na árvore × ativo no navegador** — a árvore mostra o estado real (herdado/ativo/oculto com badge); o navegador tem **radio** (associar/desassociar) e **toggle** (visível/oculto) separados — radio = pertence ou não ao escopo; toggle = aluno vê ou não.
5. **Timing** — configuração por escopo (linha operacional): `data_disponivel` (agendado), `data_entrega_limite` (prazo), duração, tentativas, pontuação máxima.
6. **Destaque** — `destaque=true` na linha operacional (estrela na árvore).
7. **Filtros do navegador** — busca, tipo, Só meus; no **sidebar** (dashboard): filtros por estado do currículo (associados/livres/ocultos) aplicados ao navegador (`filtroEstado`).
8. **Trocar de programa** — limpa tudo (árvore, cache, escopo alvo, filtros) e recarrega.

---

## 6. Animações (relação com o padrão YAZI/Niri)

- **Árvore recolhe** `flex-1` ⇄ `w-96 flex-shrink-0` + `transition-all duration-300` (mesmo padrão base da Distribuição — ver `padrao_animacao_yazi_niri.md` §3).
- **Navegador surge** à direita com `slideInRight` (inline):

```css
animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

---

## 7. Diferença Distribuição × Currículo (não confundir)

| | **Distribuição** | **Currículo** |
|---|---|---|
| Aba | 4 sub-abas independentes (Área/Curso/Módulo/Componente) | Sem abas — dropdown de **programa** + acordeons |
| Seleção | Item da aba → associa direto | **Escopo alvo** (pasta) → navegador → radio/toggle |
| Alvo da linha | `lms_distribuicao` (blueprint) com escopo área/curso/módulo/componente | `lms_conteudo_operacional` com programa/ciclo/calendario |
| Herança | É a fonte da herança | Consome a herança e pode sobrescrever (ocultar/ajustar) |
| Controles | Só toggle associa/desassocia | Radio (associar) + toggle (visível) + gear (timing) + estrela (destaque) |

---

## 8. Checklist para recriar

- [ ] Dropdown rico de programa (descrição + curso + ciclos) no topo.
- [ ] `selecionarPrograma`: carrega estrutura + ativos (Promise.all) + navegador; limpa tudo ao trocar.
- [ ] Árvore de acordeons com **lazy loading** por chave (`programa`, `componente:`, `modulo:`, `ciclo:`, `calendario:`); pastas Componentes e Módulos/Ciclos.
- [ ] "Adicionar" na pasta → `selectedScopeKey` (escopo alvo) → árvore recolhe `w-96` + navegador com slideInRight + indicador "Escopo alvo: X [Cancelar]".
- [ ] Navegador: todos os conteúdos do repositório com `associado` (op_id) / `ativo` (herdado = true).
- [ ] Radio associa/desassocia (POST/DELETE) e toggle visível/oculto — **ambos exigindo escopo alvo**.
- [ ] Modal de timing (disponibilidade/prazo/duração/tentativas/pontuação) com `montarBodyOperacional` (1 escopo por linha).
- [ ] Sidebar com resumo (escopos do programa + estado do currículo) e filtro por estado.
