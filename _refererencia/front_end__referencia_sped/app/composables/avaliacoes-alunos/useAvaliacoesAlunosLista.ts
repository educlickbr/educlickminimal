import { ref } from "vue"
import { $fetch as ofetch } from "ofetch"

export interface Criterio {
    id_criterio: string
    criterio: string
    ordem: number
    conceito: string | null
}

export interface PessoaNome {
    nome?: string | null
    sobrenome?: string | null
    email?: string | null
}

export interface Avaliador {
    nome: string
    sobrenome: string
    assinatura: string | null
}

export interface Validadores {
    coordenador?: PessoaNome | null
    pedagogo?: PessoaNome | null
}

export interface AvaliacaoAluno {
    id_resultado_global: string
    id_avaliacao: string
    curso_nome: string
    turma_nome: string
    ano_semestre: string
    etapa: string
    conceito_geral: string | null
    comentario: string | null
    criterios: Criterio[]
    avaliadores?: Avaliador[]
    validadores?: Validadores | null
    token_publico?: string | null
    token_publico_expira_em?: string | null
    acesso_publico_ativo?: boolean
    token_validacao_publica?: string | null
    atividade_associada?: {
        id_entrega: string
        id_atividade: string
        titulo: string
        enunciado: string | null
        link_externo: string | null
        arquivo_apoio: string | null
        status_avaliacao: string
        resposta_aluno: string | null
        arquivo_entrega: string | null
        feedback_professor: string | null
    } | null
}

export function useAvaliacoesAlunosLista() {
    const loading = ref(true)
    const avaliacoes = ref<AvaliacaoAluno[] | null>(null)

    const refreshAvaliacoes = async () => {
        loading.value = true
        try {
            const raw = await ofetch("/api/avaliacao-alunos/minhas-avaliacoes")
            avaliacoes.value = Array.isArray(raw) ? raw : null
        } catch (e) {
            console.error(e)
        } finally {
            loading.value = false
        }
    }

    const conceitoLabel: Record<string, string> = {
        "Acima do Esperado": "Acima do Esperado",
        Adequado: "Adequado",
        "Pode Melhorar": "Pode Melhorar",
        "Aprovado(a)": "Aprovado(a)",
        "Aprovado(a) com Ressalvas": "Aprovado(a) com Ressalvas",
        "Não Aprovado(a)": "Não Aprovado(a)",
    }

    const conceitoClass: Record<string, string> = {
        "Acima do Esperado": "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
        Adequado: "text-blue-500 border-blue-500/20 bg-blue-500/10",
        "Pode Melhorar": "text-red-500 border-red-500/20 bg-red-500/10",
        "Aprovado(a)": "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
        "Aprovado(a) com Ressalvas": "text-yellow-500 border-yellow-500/20 bg-yellow-500/10",
        "Não Aprovado(a)": "text-red-500 border-red-500/20 bg-red-500/10",
    }

    return {
        avaliacoes,
        loading,
        refreshAvaliacoes,
        conceitoLabel,
        conceitoClass,
    }
}
