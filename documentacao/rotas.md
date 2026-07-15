# 🗺️ Mapa de Rotas — EduClick

Todas as rotas do sistema, com layout, autenticação, orquestrador e links para documentação.

---

## Legenda

| Ícone | Significado |
|---|---|
| 🔓 | Pública (sem login) |
| 🔒 | Requer autenticação |
| 👑 | Requer admin |
| `base` | Layout com sidebar |
| `wide` | Layout sem sidebar |
| `false` | Sem layout (página standalone) |

---

## 📄 Páginas Públicas

| Rota | Layout | Auth | Orquestrador | Documentação |
|---|---|---|---|---|
| `/` | `false` | 🔓 | `pages/index.vue` | [`paginas/landing_page/`](paginas/landing_page/) |
| `/oferta` | `false` | 🔓 | `pages/oferta.vue` | [`paginas/oferta.md`](paginas/oferta.md) |
| `/form/:tipo_proc/:tipo_cand/:area_id/:programa_id` | `false` | 🔓 | `pages/form/[tipo_proc]/[tipo_cand].vue` | [`paginas/form.md`](paginas/form.md) |
| `/form/sucesso` | `false` | 🔓 | `pages/form/sucesso.vue` | — |
| `/checkout/:slug` | `false` | 🔓 | `pages/checkout/[slug].vue` | — |
| `/checkout/sucesso` | `false` | 🔓 | `pages/checkout/sucesso.vue` | — |
| `/cadastro-docente/:token` | `false` | 🔓 | `pages/cadastro-docente/[token].vue` | — |
| `/trabalhe-conosco` | `false` | 🔓 | `pages/trabalhe-conosco.vue` | — |
| `/mensagem` | `false` | 🔓 | `pages/mensagem.vue` | — |
| `/auth/login` | — | 🔓 | `pages/auth/login.vue` | — |
| `/auth/cadastro` | — | 🔓 | `pages/auth/cadastro.vue` | — |
| `/auth/recuperar_senha` | — | 🔓 | `pages/auth/recuperar_senha.vue` | — |
| `/auth/trocar_senha` | — | 🔓 | `pages/auth/trocar_senha.vue` | — |
| `/teste-layout` | `base` | 🔓 | `pages/teste-layout.vue` | — |

---

## 📄 Páginas Administrativas (Requer Login)

| Rota | Layout | Auth | Orquestrador | Documentação |
|---|---|---|---|---|
| `/academico_oferta` | `base` | 🔒 | `pages/academico_oferta/index.vue` | [`paginas/academico_oferta.md`](paginas/academico_oferta.md) |
| `/academico_calendario` | `base` | 🔒 | `pages/academico_calendario/index.vue` | [`paginas/academico_calendario.md`](paginas/academico_calendario.md) |
| `/matriculas` | `base` | 🔒 | `pages/matriculas/index.vue` | [`paginas/matriculas.md`](paginas/matriculas.md) |
| `/processos` | `base` | 🔒 | `pages/processos/index.vue` | [`paginas/processos.md`](paginas/processos.md) |
| `/formularios` | `wide` | 🔒 | `pages/formularios/index.vue` | [`paginas/formularios.md`](paginas/formularios.md) |
| `/meus-cursos` | `base` | 🔒 | `pages/meus-cursos/index.vue` | [`paginas/meus-cursos.md`](paginas/meus-cursos.md) |
| `/meus-processos` | `base` | 🔒 | `pages/meus-processos/index.vue` | [`paginas/meus-processos.md`](paginas/meus-processos.md) |
| `/produtos` | `base` | 🔒 | `pages/produtos/index.vue` | [`paginas/produtos.md`](paginas/produtos.md) |
| `/docentes` | `base` | 🔒 | `pages/docentes/index.vue` | — |
| `/configuracoes/pagamento` | `base` | 🔒 | `pages/configuracoes/pagamento.vue` | — |
| `/minhas-inscricoes` | — | 🔒 | _(a confirmar)_ | [`paginas/minhas-inscricoes.md`](paginas/minhas-inscricoes.md) |

> **Nota:** O controle de autenticação é feito pelo middleware do Supabase (`@nuxtjs/supabase`), configurado em `nuxt.config.ts` com as rotas de exclusão.

---

## 📁 APIs (BFFs)

Cada domínio tem seus BFFs em `front_end/server/api/<dominio>/`.

| Domínio | Endpoints |
|---|---|
| `academico_oferta/` | `areas.{get,post,delete}`, `componentes.{get,post,delete}`, `modulos.{get,post,delete}`, `cursos.{get,post,delete}`, `ciclos.{get,post}`, `programas.get`, `plano_aula.{get,post,delete}`, `ciclos/calcular_cronograma.post` |
| `matriculas/` | `index.get`, `lista.get`, `detalhes.get`, `inativar.post`, `turmas.get` |
| `processos/` | `index.get`, `inscricoes.get`, `detalhes.get`, `avaliar.post` |
| `form/` | — |
| `formularios/` | — |
| `meus-processos/` | — |
| `docentes/` | — |
| `calendario/` | — |
| `comercial/` | — |
| `admin/` | — |
| `auth/` | — |
| `r2/` | `sign` (signed URLs) |
| `public/` | — |
| **Raiz** | `areas.{get,post,delete}`, `ciclos.{get,post}`, `programas.{get,post}`, `me`, `odoo-lead.post`, `debug`, `refresh-hash` |

---

## 📁 Composables por domínio

| Domínio | Composables |
|---|---|
| `academico_oferta/` | `useOfertaCore`, `useOfertaAreas`, `useOfertaComponentes`, `useOfertaModulos`, `useOfertaCursos`, `useOfertaCiclos`, `useOfertaProgramas`, `useProgramaForm` |
| `matriculas/` | `useMatriculasCore`, `useMatriculas` |
| `processos/` | `useProcessosCore`, `useProcessos` |
| `formularios/` | `useFormulariosCore`, `useFormulariosPerguntas` |
| `calendario/` | `useCalendarioCore`, `useCalendarioFeriados`, `useCalendarioEventos`, `useCalendarioCalendario` |
| `meus-processos/` | `useMeusProcessos` |
| `docentes/` | — |
| `checkout/` | `useCheckout` |
| `produtos/` | `useProdutosCore`, `useProdutosActions` |
| `auth/` | _(via Supabase)_ |
| `configuracao-gateway/` | `useConfigGateway` |
| **Raiz** | `useCargaHoraria`, `useFavicon`, `useLandingTenant`, `useToast` |

---

## 📁 Componentes por domínio

| Domínio | Componentes |
|---|---|
| `academico_oferta/` | `OfertaTabAreas`, `OfertaTabComponentes`, `OfertaTabModulos`, `OfertaTabCursos`, `OfertaTabCiclos`, `OfertaTabProgramas`, `ModalArea`, `ModalComponente`, `ModalModulo`, `ModalCurso`, `ModalCiclo`, `ModalPrograma`, `programa/ProgramaStep*` |
| `matriculas/` | `MatriculasList`, `MatriculasModalDetalhes` |
| `processos/` | `ProcessosTabInscritos`, `ProcessosModalDetalhes`, `ProcessosModalAvaliar` |
| `form/` | _(form steps)_ |
| `formularios/` | — |
| `calendario/` | — |
| `docentes/` | `ModalAvaliarCandidato` |
| `checkout/` | `CheckoutResumo` |
| `produtos/` | `ProdutosTabLista`, `ModalProduto`, `ModalOferta` |
| `auth/` | _(form-based)_ |
| `configuracoes/` | `ConfigGatewayStatus` |
| `global/` | Componentes reutilizáveis (UI atoms) |
| `landing/` | Componentes da landing page |

---

## 🔗 Relação com a documentação

Toda página documentada em `documentacao/paginas/` segue o mesmo padrão:

| Seção da doc | O que contém |
|---|---|
| Visão Geral | Propósito, abas, rota, layout |
| Arquitetura | Pipeline + estrutura de diretórios |
| Fluxo de Dados | Diagrama textual de cada operação |
| APIs | Tabela de endpoints BFF |
| Composables | Tabela com responsabilidades |
| Componentes | Props, emits, descrição |
| Lógica de Negócio | Regras, SQL, status, validações |
| Estados da UI | Loading, empty, error, normal |
| Contrato Visual | Classes específicas aplicadas |
| Dependências | Reuso entre páginas |
| Histórico | Mudanças com data e descrição |

---

_Atualizado em: 2026-07-15_
