import { ref, computed, watch, onMounted } from 'vue'
import { $fetch as ofetch } from 'ofetch'
import { getAnoSemestre, getAnoSemestreList } from '../../../utils/ano_semestre'

export interface TurmaOption { id: string; cod_turma: string | null; nome_curso: string; ano_semestre: string | null; turno: string | null; dt_ini_curso: string | null; dt_fim_curso: string | null; }
export interface HistoricoMatricula { id_matricula: string; id_turma: string; cod_turma: string | null; ano_semestre: string | null; turno: string | null; dt_ini_curso: string | null; dt_fim_curso: string | null; ordem_seq: number; is_contexto: boolean; }
export interface AlunoCertificadoItem {
    id_certificado_emitido: string | null; id_aluno: string; nome: string; sobrenome: string; email: string | null; ra: string | null;
    id_matricula_contexto: string; id_turma_contexto: string; cod_turma_contexto: string | null; ano_semestre_contexto: string | null;
    turno_contexto: string | null; dt_ini_curso_contexto: string | null; dt_fim_curso_contexto: string | null; id_curso: string;
    nome_curso: string; cod_curso: string | null; area_curso: string; modalidade: string | null; descricao_curso: string | null;
    certificado_texto_institucional: string | null; certificado_nome_coordenador: string | null; certificado_nome_docente: string | null;
    certificado_nome_curador: string | null; certificado_carga_horaria_exibida: string | null;
    qtd_modulos: number | null; qtd_aulas_modulo: number | null; qtd_periodos: number | null; qtd_minutos_periodo: number | null;
    qtd_minutos_total: number | null; turma_concluida: boolean; total_matriculas_contexto: number; minimo_requerido: number;
    elegivel_certificado: boolean; historico_matriculas: HistoricoMatricula[];
    status_aprovacao: 'pendente' | 'aprovado' | 'reprovado'; motivo_reprovacao: string | null;
}

export function useGestaoCertificadosEmissao(showToast: any) {
    const isLoadingTurmas = ref(false)
    const isLoadingCertificados = ref(false)
    const turmasCertificados = ref<TurmaOption[]>([])
    const alunosCertificados = ref<AlunoCertificadoItem[]>([])
    const alunoExpandido = ref<Record<string, boolean>>({})
    const paginationCertificados = ref({ total: 0, page: 1, pages: 1, limit: 20 })
    const showDiarioModal = ref(false)
    const selectedAlunoForDiario = ref<any>(null)

    const semestres = getAnoSemestreList(6)
    const semestreOptions = computed(() => semestres.map((item) => ({ id: item.id, nome: item.nome })))

    const filtrosCertificados = ref({ area: 'Regulares', ano_semestre: getAnoSemestre(), id_turma: '', elegibilidade: 'todos', busca: '' })
    const areaOptionsCertificados = [
        { label: 'Regulares', value: 'Regulares' }, { label: 'Extensão', value: 'Extensão' },
        { label: 'Cursos Livres', value: 'Cursos Livres' }, { label: 'Especialização', value: 'especializacao' },
    ]
    const elegibilidadeOptions = [
        { label: 'Todos', value: 'todos' }, { label: 'Elegíveis', value: 'elegiveis' }, { label: 'Não elegíveis', value: 'nao_elegiveis' },
    ]

    const turmaOptions = computed(() => turmasCertificados.value.map((turma) => ({
        id: turma.id, nome: `${turma.nome_curso}${turma.cod_turma ? ` (${turma.cod_turma})` : ''}`,
    })))

    const formatDataCurta = (iso?: string | null) => {
        if (!iso) return '—'
        const data = new Date(iso)
        if (Number.isNaN(data.getTime())) return '—'
        return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    }

    const isAreaRegulares = (areaCurso: string | null | undefined) => String(areaCurso || '').toLowerCase() === 'regulares'
    const verAvaliacoesPlaceholder = () => showToast('Disponível no fim do semestre.', { type: 'info' })

    const toggleExpandAluno = (idAluno: string) => { alunoExpandido.value[idAluno] = !alunoExpandido.value[idAluno] }
    const openDiarioModal = (aluno: AlunoCertificadoItem) => {
        selectedAlunoForDiario.value = {
            id_matricula: aluno.id_matricula_contexto, id_aluno: aluno.id_aluno, id_turma: aluno.id_turma_contexto,
            nome: aluno.nome, sobrenome: aluno.sobrenome, nome_curso: aluno.nome_curso,
        }
        showDiarioModal.value = true
    }

    const fetchTurmasCertificados = async () => {
        isLoadingTurmas.value = true
        turmasCertificados.value = []
        try {
            const data: any = await ofetch('/api/cursos-turmas/turmas', {
                params: { area: filtrosCertificados.value.area, ano_semestre: filtrosCertificados.value.ano_semestre, limite: 200, pagina: 1 },
            })
            turmasCertificados.value = (data?.itens || []) as TurmaOption[]
            if (!turmasCertificados.value.find((turma) => turma.id === filtrosCertificados.value.id_turma)) {
                filtrosCertificados.value.id_turma = turmasCertificados.value[0]?.id || ''
            }
        } catch (error) { console.error('Erro ao buscar turmas:', error); turmasCertificados.value = []; filtrosCertificados.value.id_turma = '' }
        finally { isLoadingTurmas.value = false }
    }

    const fetchAlunosCertificados = async () => {
        if (!filtrosCertificados.value.id_turma) { alunosCertificados.value = []; paginationCertificados.value = { total: 0, page: 1, pages: 1, limit: 20 }; return }
        isLoadingCertificados.value = true
        try {
            const data: any = await ofetch('/api/gestao-certificados/contexto', {
                params: { id_turma: filtrosCertificados.value.id_turma, area: filtrosCertificados.value.area, ano_semestre: filtrosCertificados.value.ano_semestre, elegibilidade: filtrosCertificados.value.elegibilidade, busca: filtrosCertificados.value.busca || null, page: paginationCertificados.value.page, limit: paginationCertificados.value.limit },
            })
            alunosCertificados.value = (data?.itens || []) as AlunoCertificadoItem[]
            paginationCertificados.value = { total: data?.total || 0, page: data?.page || 1, pages: data?.pages || 1, limit: data?.limit || 20 }
        } catch (error) { console.error('Erro ao buscar alunos:', error); alunosCertificados.value = []; paginationCertificados.value = { total: 0, page: 1, pages: 1, limit: 20 } }
        finally { isLoadingCertificados.value = false }
    }

    const aprovarCertificacao = async (aluno: AlunoCertificadoItem) => {
        try {
            await ofetch('/api/gestao-certificados/aprovacao', {
                method: 'POST',
                body: {
                    id_aluno: aluno.id_aluno, id_turma_contexto: aluno.id_turma_contexto, aprovado: true, motivo: null,
                    snapshot_parametrizacao: {
                        nome_curso: aluno.nome_curso, descricao: aluno.descricao_curso, qtd_minutos_total: aluno.qtd_minutos_total,
                        texto_institucional: aluno.certificado_texto_institucional, nome_coordenador: aluno.certificado_nome_coordenador,
                        nome_docente: aluno.certificado_nome_docente, nome_curador: aluno.certificado_nome_curador, carga_horaria_exibida: aluno.certificado_carga_horaria_exibida,
                    },
                },
            })
            showToast('Certificação aprovada com sucesso.', { type: 'success' })
            await fetchAlunosCertificados()
        } catch (error: any) { showToast(error?.data?.statusMessage || error?.message || 'Erro ao atualizar certificação.', { type: 'error' }) }
    }

    watch([() => filtrosCertificados.value.area, () => filtrosCertificados.value.ano_semestre], async () => {
        paginationCertificados.value.page = 1
        await fetchTurmasCertificados()
        await fetchAlunosCertificados()
    })
    watch([() => filtrosCertificados.value.id_turma, () => filtrosCertificados.value.elegibilidade], () => {
        paginationCertificados.value.page = 1
        fetchAlunosCertificados()
    })

    let searchTimeoutCert: ReturnType<typeof setTimeout> | null = null
    watch(() => filtrosCertificados.value.busca, () => {
        if (searchTimeoutCert) clearTimeout(searchTimeoutCert)
        searchTimeoutCert = setTimeout(() => { paginationCertificados.value.page = 1; fetchAlunosCertificados() }, 350)
    })

    onMounted(() => { fetchTurmasCertificados().then(() => fetchAlunosCertificados()) })

    return {
        isLoadingTurmas, isLoadingCertificados, turmasCertificados, alunosCertificados,
        alunoExpandido, paginationCertificados, showDiarioModal, selectedAlunoForDiario,
        semestreOptions, filtrosCertificados, areaOptionsCertificados, elegibilidadeOptions,
        turmaOptions, formatDataCurta, isAreaRegulares, verAvaliacoesPlaceholder,
        toggleExpandAluno, openDiarioModal, fetchTurmasCertificados, fetchAlunosCertificados, aprovarCertificacao,
    }
}
