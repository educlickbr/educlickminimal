# 🏷️ Tipos Compartilhados — EduClick

Inventário dos tipos TypeScript no projeto e recomendações de centralização.

---

## 📍 Situação atual

O projeto **não tem** uma pasta `types/` dedicada. Os tipos estão espalhados pelos composables, cada um definindo suas próprias interfaces localmente.

```
composables/ → cada um com seus exports de interface
stores/      → sem tipos exportados
utils/       → EnderecoViaCEP
```

---

## 📋 Inventário de tipos existentes

### `app/utils/viacep.ts`
```typescript
export interface EnderecoViaCEP {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  cep: string
  erro?: boolean
}
```

### `app/composables/academico_oferta/useOfertaAreas.ts`
```typescript
export interface Area {
  id: string
  nome_area: string
  descricao?: string | null
  id_entidade: string
  criado_em: string
}
```

### `app/composables/academico_oferta/useOfertaComponentes.ts`
```typescript
export interface Componente {
  id: string
  id_entidade: string
  nome_componente: string
  descricao?: string | null
  criado_por?: string
  criado_em: string
  modificado_em: string
}
```

### `app/composables/form/useFormInscricao.ts`
```typescript
export interface InscricaoData {
  id: string
  id_usuario: string
  id_programa: string
  id_processo: string
  status_dados: string
  status_documentacao: string
  status_candidatura: string
  tipo_processo: string
  tipo_candidatura: string
  criado_em: string
}
```

### `app/composables/form/useFormMatricula.ts`
```typescript
export interface MatriculaData {
  id: string
  id_programa: string
  id_usuario: string
  id_pedido: string | null
  criado_em: string
}
```

### `app/composables/formularios/useFormulariosPerguntas.ts`
```typescript
export interface Pergunta {
  id: string
  id_entidade: string | null
  nome_interno: string
  label: string
  placeholder: string
  tipo_pergunta: string
  opcoes: any
  global: boolean
  created_at: string
}
```

### Docentes — tipo retornado por composable
```typescript
// Padrão usado nos 4 composables de docentes:
export type UseDocentesListaReturn = ReturnType<typeof useDocentesLista>;
export type UseDocentesEditaisReturn = ReturnType<typeof useDocentesEditais>;
export type UseDocentesCurriculosReturn = ReturnType<typeof useDocentesCurriculos>;
export type UseDocentesSelecaoReturn = ReturnType<typeof useDocentesSelecao>;
```

---

## 🔄 Padrões identificados

### Padrão 1: Interface inline no composable (mais comum)
```typescript
// composables/meu-dominio/useMinhaCoisa.ts
export interface MinhaCoisa {
  id: string
  // ...
}
```
**Prós:** coeso, perto de quem usa  
**Contras:** duplicado se mais de um domínio usa a mesma entidade

### Padrão 2: ReturnType (docentes)
```typescript
export type UseDocentesListaReturn = ReturnType<typeof useDocentesLista>;
```
**Uso:** quando o tipo de retorno é inferido, não declarado manualmente

---

## 💡 Recomendação

### 1. Criar `front_end/types/` para tipos compartilhados entre domínios

```
front_end/types/
├── aca.d.ts          ← Tipos do módulo acadêmico (Area, Componente, Modulo, Curso, Ciclo, Programa)
├── user.d.ts         ← Tipos de usuário (UserExpandido, Entidade, Produto)
├── form.d.ts         ← Tipos de formulário (Pergunta, Resposta, InscricaoData)
├── com.d.ts          ← Tipos comerciais (Pedido, Produto, Assinatura)
└── api.d.ts          ← Tipos de resposta de API (PaginatedResponse<T>, ApiResponse<T>)
```

### 2. Tipos genéricos de API (úteis em todo BFF)

```typescript
// types/api.d.ts
export interface PaginatedResponse<T> {
  itens: T[]
  total: number
  pagina: number
  limite: number
}

export interface ApiResponse<T = null> {
  success: boolean
  message?: string
  data?: T
}
```

### 3. Tipos que já poderiam ser compartilhados

| Tipo | Usado em | Candidato a |
|---|---|---|
| `Area` | `academico_oferta`, `processos`, `matriculas` | `types/aca.d.ts` |
| `Pergunta` | `formularios`, `form` | `types/form.d.ts` |

> `Area` é o caso mais claro: a mesma interface aparece em múltiplos domínios (oferta, processos, matrículas) e hoje é redeclarada em cada composable.

### 4. Quando manter inline

- Tipos **exclusivos** de um único composable (ex: `InscricaoData` só existe em `useFormInscricao`)
- Tipos inferidos via `ReturnType`

---

## 🧪 Exemplo de como ficaria

```typescript
// types/aca.d.ts — Tipos acadêmicos compartilhados
export interface Area {
  id: string
  nome_area: string
  descricao?: string | null
  id_entidade: string
  criado_em: string
}

export interface Componente {
  id: string
  id_entidade: string
  nome_componente: string
  descricao?: string | null
}

export interface Modulo {
  id: string
  id_entidade: string
  nome_modulo: string
  // ...
}
```

```typescript
// composables/academico_oferta/useOfertaAreas.ts — agora importa o tipo
import type { Area } from "~/types/aca";

// ... usar Area diretamente, sem redeclarar
```

---

## ⏭️ Próximos passos

1. Garantir que o `tsconfig.json` inclua `~/types/*` (já deve estar configurado pelo Nuxt)
2. Migrar tipos que já são usados em mais de um lugar (`Area` é o candidato #1)
3. Adoptar `PaginatedResponse<T>` e `ApiResponse<T>` como padrão nos BFFs

---

_Atualizado em: 2026-07-15_
