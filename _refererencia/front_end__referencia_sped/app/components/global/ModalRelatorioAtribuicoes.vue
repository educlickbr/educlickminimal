<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'

const props = defineProps<{
    isOpen: boolean
    anoSemestre: string
}>()

const emit = defineEmits(['close'])

const isLoading = ref(false)
const isLoadingEditais = ref(false)
const isLoadingTurmas = ref(false)
const isPrintingLoading = ref(false)
const relatorioData = ref<any[]>([])
const filteredData = ref<any[]>([])
const searchQuery = ref('')
const selectedEdital = ref('')
const selectedTurma = ref('')
const todasEditais = ref<any[]>([])
const todasTurmas = ref<any[]>([])
const selectedMonth = ref(new Date().getMonth() + 1)

const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const mesSelecionado = computed(() => meses[selectedMonth.value - 1] || 'Inválido')

const isEncerrado = (student: any) => {
    if (typeof student?.encerrado === 'boolean') return student.encerrado
    if (!student?.vigencia_fim) return false
    return new Date(student.vigencia_fim).getTime() <= Date.now()
}

const getReuniaoFaltas = (student: any) => Number(student?.reunioes_mes_faltas || 0)

const getTotalComReuniao = (student: any) => {
    const totalApi = student?.faltas_total_geral_com_reunioes
    if (totalApi !== null && totalApi !== undefined) {
        return Number(totalApi)
    }

    const faltasGeral = Number(student?.faltas_geral || 0)
    const faltasReuniao = Number(student?.reunioes_faltas_geral ?? student?.reunioes_mes_faltas ?? 0)
    return faltasGeral + (faltasReuniao > 0 ? faltasReuniao : 0)
}

const formatNumero = (value: any) => {
    const num = Number(value || 0)
    return Number.isInteger(num) ? String(num) : num.toFixed(1)
}

const formatData = (value: any) => {
    if (!value) return '--'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '--'
    return date.toLocaleDateString('pt-BR')
}

const formatVigencia = (student: any) => {
    const inicio = formatData(student?.vigencia_inicio)
    const fim = student?.vigencia_fim ? formatData(student.vigencia_fim) : 'Ativa'
    return `${inicio} - ${fim}`
}

const getNomePrincipal = (student: any) => {
    const social = String(student?.nome_social || '').trim()
    if (social) return social
    const nome = String(student?.nome || '').trim()
    const sobrenome = String(student?.sobrenome || '').trim()
    return `${nome} ${sobrenome}`.trim()
}

const getNomeSocialExibicao = (student: any) => {
    const social = String(student?.nome_social || '').trim()
    return social || '--'
}

const hasNomeSocial = (student: any) => {
    return String(student?.nome_social || '').trim().length > 0
}

const getNomeRegistro = (student: any) => {
    const social = String(student?.nome_social || '').trim()
    const nome = String(student?.nome || '').trim()
    const sobrenome = String(student?.sobrenome || '').trim()
    const nomeCompleto = `${nome} ${sobrenome}`.trim()
    if (social && nomeCompleto && social.toLowerCase() !== nomeCompleto.toLowerCase()) return nomeCompleto
    return ''
}

// Carregar editais disponíveis
const fetchEditais = async () => {
    isLoadingEditais.value = true
    try {
        const response = await $fetch('/api/bolsas/editais') as any
        const data = response.data || response || []
        todasEditais.value = (Array.isArray(data) ? data : []).sort((a: any, b: any) => {
            const dateA = new Date(b.criado_em || 0).getTime()
            const dateB = new Date(a.criado_em || 0).getTime()
            return dateA - dateB
        })
        if (!selectedEdital.value) selectedEdital.value = ''
    } catch (err: any) {
        console.error('[editais fetch]', err)
    } finally {
        isLoadingEditais.value = false
        // Garantir carregamento inicial com filtro "Todos".
        if (props.isOpen) {
            fetchRelatorio()
        }
    }
}

// Carregar relatório
const fetchRelatorio = async () => {
    if (!props.isOpen) return

    isLoading.value = true
    try {
        const response = await $fetch('/api/bolsas/relatorio/atribuicoes', {
            query: {
                ano_semestre: props.anoSemestre,
                mes: selectedMonth.value,
                id_edital: selectedEdital.value || undefined,
                id_turma: selectedTurma.value || undefined
            }
        }) as any

        relatorioData.value = response?.data || []
        applySearch()
    } catch (err: any) {
        console.error('[relatorio fetch]', err)
    } finally {
        isLoading.value = false
    }
}

const fetchTurmas = async () => {
    isLoadingTurmas.value = true
    try {
        const data: any = await $fetch('/api/matriculas/turmas', {
            params: {
                ano_semestre: props.anoSemestre,
                area: 'Regulares'
            }
        })
        todasTurmas.value = data?.turmas || []
    } catch (err: any) {
        console.error('[turmas fetch]', err)
    } finally {
        isLoadingTurmas.value = false
    }
}

const formatTurma = (turma: any) => turma?.nome_curso_turno || turma?.nome_curso || turma?.nome_turma || turma?.id
const formatEdital = (edital: any) => edital?.titulo || edital?.nome || edital?.id

// Aplicar filtro de busca
const applySearch = () => {
    const query = searchQuery.value.toLowerCase()

    const sortEncerradosLast = (list: any[]) => {
        return [...list].sort((a: any, b: any) => {
            const aClosed = isEncerrado(a)
            const bClosed = isEncerrado(b)
            if (aClosed !== bClosed) return aClosed ? 1 : -1
            const nomeA = `${a?.nome || ''} ${a?.sobrenome || ''}`.trim()
            const nomeB = `${b?.nome || ''} ${b?.sobrenome || ''}`.trim()
            return nomeA.localeCompare(nomeB)
        })
    }

    if (!query) {
        filteredData.value = sortEncerradosLast(relatorioData.value)
        return
    }

    const filtered = relatorioData.value.filter((student: any) => {
        const nome = (student.nome || '').toLowerCase()
        const sobrenome = (student.sobrenome || '').toLowerCase()
        const nomeCompleto = `${nome} ${sobrenome}`.trim()
        const email = (student.email || '').toLowerCase()
        const curso = (student.curso || '').toLowerCase()
        return nome.includes(query) || sobrenome.includes(query) || nomeCompleto.includes(query) || email.includes(query) || curso.includes(query)
    })

    filteredData.value = sortEncerradosLast(filtered)
}

// Navegação de mês
const previousMonth = () => {
    selectedMonth.value = selectedMonth.value === 1 ? 12 : selectedMonth.value - 1
}

const nextMonth = () => {
    selectedMonth.value = selectedMonth.value === 12 ? 1 : selectedMonth.value + 1
}

// Função para escapar HTML
const escapeHtml = (text: string) => {
    if (!text) return ''
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// Buscar dados de todos os meses
const fetchAllMonthsReport = async () => {
    const allData: Record<number, any[]> = {}
    
    for (let month = 1; month <= 12; month++) {
        try {
            const response = await $fetch('/api/bolsas/relatorio/atribuicoes', {
                query: {
                    ano_semestre: props.anoSemestre,
                    mes: month,
                    id_edital: selectedEdital.value || undefined,
                    id_turma: selectedTurma.value || undefined
                }
            }) as any
            
            allData[month] = response?.data || []
        } catch (err: any) {
            console.error(`Erro ao buscar mês ${month}:`, err)
            allData[month] = []
        }
    }
    
    return allData
}

// Construir HTML completo para impressão (todos os meses)
const buildRelatorioHtml = (allData: Record<number, any[]>) => {
    const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const styles = `
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                background: #fff;
                color: #000;
            }
            
            .page {
                page-break-after: always;
                padding: 40px;
                min-height: 100vh;
            }
            
            .page:last-child {
                page-break-after: avoid;
            }
            
            .header {
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
            }
            
            .header h1 {
                font-size: 20px;
                margin-bottom: 5px;
            }
            
            .meta {
                font-size: 12px;
                color: #666;
                margin: 3px 0;
            }
            
            .meta.strong {
                font-weight: bold;
                color: #000;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 11px;
            }
            
            thead {
                background: #f5f5f5;
                font-weight: bold;
            }
            
            th, td {
                border: 1px solid #ddd;
                padding: 6px;
                text-align: left;
            }
            
            th {
                background: #f0f0f0;
                text-align: center;
                font-weight: bold;
            }
            
            tbody tr:nth-child(even) {
                background: #fafafa;
            }
            
            td.number {
                text-align: center;
            }
            
            .badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
            }
            
            .badge.encerrado {
                background: #ffebee;
                color: #c62828;
            }
            
            .no-data {
                text-align: center;
                color: #999;
                padding: 20px;
                font-style: italic;
            }
        </style>
    `

    const monthPages = mesesNomes.map((mesNome, idx) => {
        const month = idx + 1
        const data = allData[month] || []
        
        if (data.length === 0) {
            return `
                <section class="page">
                    <header class="header">
                        <h1>Relatório de Atribuições - ${mesNome}</h1>
                        <div class="meta strong">${mesNome} / ${props.anoSemestre}</div>
                    </header>
                    <div class="no-data">Nenhum aluno encontrado para este mês.</div>
                </section>
            `
        }

        const rowsHtml = data.map((student: any) => {
            const nomeExibicao = getNomePrincipal(student)
            const encerradoBadge = isEncerrado(student) 
                ? '<span class="badge encerrado">Encerrado</span>'
                : ''

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(nomeExibicao)}</strong>
                        ${encerradoBadge}
                        <br/><small style="color: #999;">${escapeHtml(student.email || '')}</small>
                        <br/><small style="color: #999;">${escapeHtml(student.curso || '')} • ${escapeHtml(student.turno || '')}</small>
                    </td>
                    <td class="number">${student.abonosmes || 0}</td>
                    <td class="number">${formatNumero(student.faltas_p1_mes) || 0}</td>
                    <td class="number">${formatNumero(student.faltas_p2_mes) || 0}</td>
                    <td class="number">${student.faltas_ambos_p1p2_mes || 0}</td>
                    <td class="number">${formatNumero(student.faltas_total_mes) || 0}</td>
                    <td class="number">${Number(student.presencas_total_mes || 0).toFixed(1)}</td>
                    <td class="number">${formatNumero(student.presencas_geral) || 0}</td>
                    <td class="number">${getReuniaoFaltas(student) || 0}</td>
                    <td class="number"><strong>${formatNumero(getTotalComReuniao(student)) || 0}</strong></td>
                </tr>
            `
        }).join('')

        return `
            <section class="page">
                <header class="header">
                    <h1>Relatório de Atribuições - ${mesNome}</h1>
                    <div class="meta strong">${mesNome} / ${props.anoSemestre}</div>
                    <div class="meta">${data.length} aluno(s)</div>
                </header>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Aluno</th>
                            <th>Abono</th>
                            <th>P1</th>
                            <th>P2</th>
                            <th>Fal.Int.</th>
                            <th>Fal.Mês</th>
                            <th>Pres.</th>
                            <th>Pres.Ger.</th>
                            <th>Reunião</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </section>
        `
    }).join('')

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Atribuições</title>
            ${styles}
        </head>
        <body>
            ${monthPages}
        </body>
        </html>
    `
}

// Função para imprimir HTML (similar ao padrão usado em outras telas)
const printHtmlReport = (htmlContent: string) => {
    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, {
        position: 'fixed',
        right: '0',
        bottom: '0',
        width: '0',
        height: '0',
        border: '0'
    })
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(htmlContent)
    doc.close()

    const printNow = () => {
        if ((iframe as any)._hasPrinted) return
        (iframe as any)._hasPrinted = true
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe)
            }
        }, 1000)
    }

    iframe.onload = () => setTimeout(printNow, 250)
    setTimeout(printNow, 750)
}

// Handler para imprimir todos os meses
const handlePrintAllMonths = async () => {
    isPrintingLoading.value = true
    try {
        const allData = await fetchAllMonthsReport()
        const html = buildRelatorioHtml(allData)
        printHtmlReport(html)
    } catch (err: any) {
        console.error('Erro ao gerar relatório para impressão:', err)
    } finally {
        isPrintingLoading.value = false
    }
}

const handleClose = () => {
    searchQuery.value = ''
    emit('close')
}

// Watchers
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        if (todasEditais.value.length === 0) {
            fetchEditais()
        } else {
            fetchRelatorio()
        }

        if (todasTurmas.value.length === 0) {
            fetchTurmas()
        }
    }
})

watch(selectedMonth, () => {
    fetchRelatorio()
})

watch(selectedEdital, () => {
    fetchRelatorio()
})

watch(selectedTurma, () => {
    fetchRelatorio()
})

watch(searchQuery, () => {
    applySearch()
})

onMounted(() => {
    if (props.isOpen) {
        fetchEditais()
        fetchTurmas()
    }
})
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="bg-[#16161E] rounded-lg w-full h-5/6 max-w-6xl flex flex-col overflow-hidden border border-white/10">
            <!-- Header -->
            <div class="border-b border-white/10 p-6 flex-shrink-0">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-white">Relatório de Atribuições</h2>
                        <p class="text-secondary-400 text-sm mt-1">{{ mesSelecionado }} / {{ props.anoSemestre }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            @click="handlePrintAllMonths"
                            :disabled="isPrintingLoading"
                            title="Imprimir todos os meses"
                            class="p-2 text-secondary-400 hover:text-white hover:bg-white/5 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg v-if="!isPrintingLoading" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <div v-else class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </button>
                        <button
                            @click="handleClose"
                            class="text-secondary-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded"
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <!-- Edital Selector -->
                    <div>
                        <label class="block text-sm font-semibold text-secondary-300 mb-2">Edital</label>
                        <select
                            v-model="selectedEdital"
                            :disabled="isLoadingEditais"
                            class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors disabled:opacity-50"
                        >
                            <option value="" class="text-black">Todos</option>
                            <option v-for="edital in todasEditais" :key="edital.id" :value="edital.id" class="text-black">
                                {{ formatEdital(edital) }}
                            </option>
                        </select>
                    </div>

                    <!-- Turma Selector -->
                    <div>
                        <label class="block text-sm font-semibold text-secondary-300 mb-2">Turma</label>
                        <select
                            v-model="selectedTurma"
                            :disabled="isLoadingTurmas"
                            class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors disabled:opacity-50"
                        >
                            <option value="" class="text-black">Todas</option>
                            <option v-for="turma in todasTurmas" :key="turma.id" :value="turma.id" class="text-black">
                                {{ formatTurma(turma) }}
                            </option>
                        </select>
                    </div>

                    <!-- Mês Navigation -->
                    <div>
                        <label class="block text-sm font-semibold text-secondary-300 mb-2">Mês</label>
                        <div class="flex items-center gap-2">
                            <button
                                @click="previousMonth"
                                title="Mês anterior"
                                class="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div class="flex-1 text-center px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white">
                                {{ mesSelecionado }}
                            </div>
                            <button
                                @click="nextMonth"
                                title="Próximo mês"
                                class="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Search -->
                    <div>
                        <label class="block text-sm font-semibold text-secondary-300 mb-2">Buscar Aluno</label>
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Nome, email, curso..."
                            class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder-secondary-500 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            <!-- Table Content -->
            <div class="flex-1 overflow-auto">
                <div v-if="isLoading" class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                        <p class="text-secondary-400">Carregando dados...</p>
                    </div>
                </div>

                <div v-else-if="filteredData.length === 0" class="flex items-center justify-center h-full">
                    <p class="text-secondary-400 text-center">
                        {{ searchQuery ? 'Nenhum aluno encontrado para os critérios selecionados.' : 'Nenhum aluno encontrado neste edital.' }}
                    </p>
                </div>

                <table v-else class="w-full text-sm border-collapse">
                    <thead class="sticky top-0 z-20 bg-[#16161E] border-b border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                        <tr>
                            <th class="bg-[#16161E] px-4 py-3 text-left font-semibold text-secondary-300 border-r border-white/5">Aluno</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-yellow-400 border-r border-white/5 w-12">Abono</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-red-400 border-r border-white/5 w-12">P1</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-red-400 border-r border-white/5 w-12">P2</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-red-500 border-r border-white/5 w-16">Faltas Inteiras</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-red-300 border-r border-white/5 w-16">Faltas Mês</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-emerald-400 border-r border-white/5 w-16">Presença</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-emerald-400 border-r border-white/5 w-16">Pres.Geral</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-blue-400 border-r border-white/5 w-16">Reunião</th>
                            <th class="bg-[#16161E] px-4 py-3 text-center font-semibold text-red-300 w-20">Total Geral</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        <tr
                            v-for="student in filteredData"
                            :key="student.id_aluno"
                            :class="[
                                'transition-colors',
                                isEncerrado(student) ? 'bg-red-950/10 hover:bg-red-950/20' : 'hover:bg-white/[0.03]'
                            ]"
                        >
                            <td class="px-4 py-3 border-r border-white/5">
                                <div>
                                    <div class="font-semibold text-white flex items-center gap-2">
                                        <span>{{ getNomePrincipal(student) }}</span>
                                        <span
                                            v-if="isEncerrado(student)"
                                            class="inline-block px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] uppercase tracking-wider"
                                        >
                                            Encerrado
                                        </span>
                                    </div>
                                    <div v-if="!hasNomeSocial(student)" class="text-xs text-secondary-500 mt-0.5">
                                        Nome social: {{ getNomeSocialExibicao(student) }}
                                    </div>
                                    <div v-if="getNomeRegistro(student)" class="text-xs text-secondary-500 mt-0.5">
                                        NR: {{ getNomeRegistro(student) }}
                                    </div>
                                    <div class="text-xs text-secondary-400 mt-0.5">{{ student.email }}</div>
                                    <div class="text-xs text-secondary-500">{{ student.curso }} • {{ student.turno }}</div>
                                    <div class="text-xs text-secondary-500">Vigência: {{ formatVigencia(student) }}</div>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-center border-r border-white/5">
                                <span class="inline-block px-2 py-1 bg-yellow-400/20 text-yellow-300 rounded text-xs font-semibold">
                                    {{ student.abonosmes }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center border-r border-white/5">
                                <span class="inline-block px-2 py-1 bg-red-400/20 text-red-300 rounded text-xs font-semibold">
                                    {{ formatNumero(student.faltas_p1_mes) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center border-r border-white/5">
                                <span class="inline-block px-2 py-1 bg-red-400/20 text-red-300 rounded text-xs font-semibold">
                                    {{ formatNumero(student.faltas_p2_mes) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center border-r border-white/5">
                                <span class="inline-block px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold">
                                    {{ student.faltas_ambos_p1p2_mes }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center border-r border-white/5">
                                <span class="inline-block px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold">
                                    {{ formatNumero(student.faltas_total_mes) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center border-r border-white/5">
                                <span class="inline-block px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded text-xs font-semibold">
                                    {{ Number(student.presencas_total_mes).toFixed(1) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center border-r border-white/5">
                                <span class="inline-block px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded text-xs font-semibold">
                                    {{ formatNumero(student.presencas_geral) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center border-r border-white/5">
                                <span
                                    class="inline-block px-2 py-1 rounded text-xs font-semibold"
                                    :class="getReuniaoFaltas(student) > 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-400/20 text-emerald-300'"
                                >
                                    {{ getReuniaoFaltas(student) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-center">
                                <span class="inline-block px-2 py-1 bg-red-400/20 text-red-200 rounded text-xs font-semibold">
                                    {{ formatNumero(getTotalComReuniao(student)) }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div class="border-t border-white/10 px-6 py-4 bg-white/5 flex-shrink-0 flex items-center justify-between">
                <p class="text-sm text-secondary-400">
                    <span class="font-semibold text-white">{{ filteredData.length }}</span> aluno(s)
                </p>
                <button
                    @click="handleClose"
                    class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-white text-sm font-semibold transition-colors"
                >
                    Fechar
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}
</style>
