# Landing Page ENSI (`/` — Entidade ENSI)

## Visão Geral

Página **pública** da entidade **ENSI (Escola Nacional de Saúde Integrada)**. É ativada automaticamente no domínio da ENSI (ou no `localhost` via `EDUCLICK_FALLBACK_ENTIDADE_ID` configurado com a ENSI).

A página aplica o tema claro por padrão (`data-theme="light"`), o branding com a cor primária laranja (`#DF8B35`) e secundária (`#F7BC3A`), e apresenta a proposta pedagógica de Saúde Integrada, áreas de atuação, contatos reais e vitrine dinâmica de cursos integrada com o BFF público.

**Rota:** `/`  
**Layout:** `false`  
**Arquivos:**  
- [`front_end/app/pages/index.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/pages/index.vue) (Roteador multientidade)
- [`front_end/app/components/landing/ensi/EnsiLanding.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/EnsiLanding.vue) (Container principal)

---

## Seções & Componentes (`components/landing/ensi/`)

| Componente | Função | Destaques |
|---|---|---|
| [`LandingHeader.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/LandingHeader.vue) | Cabeçalho fixo com navegação e acesso ao portal | Exibe `branding.logo_fechado` no topo + botão "Área do Aluno" (`/auth/login`) |
| [`LandingHero.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/LandingHero.vue) | Hero principal e métricas oficiais | Frase da marca + 4 métricas oficiais (10 Anos no Mercado, +1.000 Alunos, +40 Cursos Realizados, Dezenas de Produções Científicas) |
| [`LandingSobre.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/LandingSobre.vue) | História e propósito institucional | Texto oficial de fundação em 2013 + 7 áreas da saúde integradas (Biomedicina, Enfermagem, Farmácia, Fisioterapia, Fonoaudiologia, Nutrição, Psicologia) |
| [`LandingCursos.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/LandingCursos.vue) | Vitrine dinâmica de cursos | Busca dinamicamente do BFF público, filtro por área, resumo de até 4 cursos com setas de navegação, empty state "Sem ofertas de curso no momento" e link "Saiba Mais" apontando para `/oferta` |
| [`LandingDiferenciais.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/LandingDiferenciais.vue) | Diferenciais competitivos | Cards com accent bars em `var(--color-primary)` (Corpo Docente de Elite, Plataforma Exclusiva, Certificação Válida, Suporte Individualizado) |
| [`LandingDuvidas.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/LandingDuvidas.vue) | Espaço de Dúvidas Frequentes (FAQ) | Acordeão interativo com as 6 principais dúvidas e esclarecimentos dos alunos |
| [`LandingContato.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/LandingContato.vue) | Canais reais de atendimento | Telefone/WhatsApp `(11) 94499-8004`, E-mail `contato@ensi.com.br` e Endereço da Sede em São Paulo |
| [`LandingFooter.vue`](file:///home/eikmeier/Documentos/dev/nuxt/educlickminimal/front_end/app/components/landing/ensi/LandingFooter.vue) | Rodapé institucional | Exibe `branding.logo_aberto` (sem texto ao lado), links rápidos e copyright da ENSI |

---

## Arquitetura & Fluxo de Dados

```
front_end/app/pages/index.vue
   ├── useTemaEntidade().aplicarTemaDaEntidadePublica()
   │     └── GET /api/entidade/dominio (BFF -> RPC app_resolver_entidade_por_dominio)
   │           ├── Aplica --color-primary (#DF8B35) e data-theme="light"
   │           └── Retorna { id, nome, tema, branding }
   │
   └── Se nome contiver "ensi":
         renderiza <LandingEnsiEnsiLanding />
```

### APIs BFF Consumidas

| Método | Endpoint | RPC / Função | Função na Landing |
|---|---|---|---|
| `GET` | `/api/entidade/dominio` | `app_resolver_entidade_por_dominio` | Resolução pública da entidade pelo domínio (tema, branding, logo) |
| `GET` | `/api/public/programas` | `aca_get_programas_publicos` | Programas ativos para o bloco dinâmico de cursos |
| `GET` | `/api/public/areas` | `aca_get_areas_publicas` | Áreas acadêmicas para as pills do seletor de áreas |
| `GET` | `/api/public/ofertas` | `com_get_ofertas_publicas` | Ofertas comerciais com preços formatados nos cards |

---

## Estrutura Visual da Landing

```
┌────────────────────────────────────────────────────────────────────────┐
│ Header: Logo Fechado + Menu Suave + [Área do Aluno]                    │
├────────────────────────────────────────────────────────────────────────┤
│ Hero: Tagline + Headline Saúde + Frase da Marca + 4 Métricas Oficial   │
├────────────────────────────────────────────────────────────────────────┤
│ Sobre: História de Fundação 2013 + 7 Áreas + 3 Pilares                  │
├────────────────────────────────────────────────────────────────────────┤
│ Cursos (Dinâmico): Pills de Áreas + Grid de 4 Cards + Setas Navegação   │
├────────────────────────────────────────────────────────────────────────┤
│ Diferenciais: Grid de 4 diferenciais ENSI                              │
├────────────────────────────────────────────────────────────────────────┤
│ Dúvidas (FAQ): Header Laranja + Acordeão de 6 Questões com Transições   │
├────────────────────────────────────────────────────────────────────────┤
│ Contato: 3 Cards com Contatos Reais (WhatsApp, Email, Endereço SP)     │
├────────────────────────────────────────────────────────────────────────┤
│ Footer: Logo Aberto + Navegação + Copyright ENSI                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Regras de Design System Cumpridas
- **Accent Bars & Botões Sólidos:** Utilizam `var(--color-primary)` em cor sólida (laranja da ENSI), sem gradientes fixos.
- **Dual-Theme & Tokens:** Uso estrito de `bg-background`, `text-text`, `text-secondary`, `bg-div-15`, `border-divider` e `var(--color-primary)`.
- **Logos Dinâmicos:** Header usa `branding.logo_fechado` e Footer usa `branding.logo_aberto`.

---

## Histórico de Atualizações

### 2026-08-27 — Construção Inicial da Landing Page ENSI
- Criada a estrutura modular em `components/landing/ensi/`.
- Integrada a resolução dinâmica pelo domínio via `useTemaEntidade()`.
- Adicionadas a história oficial de fundação (2013), frases de posicionamento e 7 áreas da saúde.
- Adicionadas as 4 métricas oficiais extraídas de referência.
- Adicionados os contatos reais (WhatsApp, E-mail e Endereço em SP).
- Implementado o acordeão de FAQ (Dúvidas Frequentes).
- Bloco de cursos tornado 100% dinâmico consumindo `/api/public/*` com seletor de área, setas de paginação (máx. 4 cards) e direcionamento para `/oferta`.
