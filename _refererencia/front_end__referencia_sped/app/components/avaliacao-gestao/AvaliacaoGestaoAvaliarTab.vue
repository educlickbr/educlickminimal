<template>
    <div>
        <!-- Barra de filtros -->
        <div class="bg-[#16161E] border border-white/5 rounded p-4 mb-6">
            <h4
                class="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"
            >
                <svg
                    class="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                </svg>
                Filtros
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div class="md:col-span-3">
                    <BaseSelect
                        v-model="anoSemestreModel"
                        :options="semestreOptions"
                        label-key="nome"
                        value-key="id"
                        placeholder="Ano / Semestre"
                    />
                </div>

                <div class="md:col-span-3 relative">
                    <BaseSelect
                        v-model="turmaAtiva"
                        :options="turmaFilterOptions"
                        label-key="nome"
                        value-key="id"
                        placeholder="Selecione uma turma"
                        :disabled="loadingTurmas"
                    />
                    <div
                        v-if="loadingTurmas"
                        class="absolute right-10 top-1/2 -translate-y-1/2 z-10"
                    >
                        <svg
                            class="animate-spin h-4 w-4 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            />
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                    </div>
                </div>

                <div class="md:col-span-3">
                    <BaseSelect
                        v-model="etapaAtiva"
                        :options="etapaOptions"
                        placeholder="Selecione a etapa"
                    />
                </div>

                <div class="md:col-span-3">
                    <input
                        v-model="buscaAluno"
                        type="text"
                        placeholder="Buscar por nome do aluno ou RA..."
                        class="w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 h-10"
                    />
                </div>
            </div>
        </div>

        <!-- Dashboard mobile (visível só em telas pequenas) -->
        <div
            v-if="dashboardStats"
            class="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 mb-6"
        >
            <div class="bg-[#16161E] border border-white/5 rounded p-4">
                <p
                    class="text-[10px] uppercase tracking-wider text-secondary font-bold"
                >
                    Na Seleção
                </p>
                <p class="text-2xl font-black text-white mt-1">
                    {{ dashboardStats.total_alunos }}
                </p>
                <p class="text-[11px] text-secondary mt-1">
                    {{ dashboardStats.total_avaliadas }} avaliadas
                </p>
            </div>
            <div class="bg-[#16161E] border border-white/5 rounded p-4">
                <p
                    class="text-[10px] uppercase tracking-wider text-secondary font-bold"
                >
                    Publicação em lote
                </p>
                <p
                    class="text-sm font-bold mt-1"
                    :class="
                        dashboardStats.total_nao_elegiveis_publicacao === 0
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                    "
                >
                    {{
                        dashboardStats.total_nao_elegiveis_publicacao === 0
                            ? "Liberada"
                            : "Bloqueada"
                    }}
                </p>
                <button
                    v-if="dashboardPendencias.length"
                    @click="showPendenciasModal = true"
                    class="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                >
                    Ver pendências
                </button>
            </div>
        </div>

        <!-- Aviso: sem avaliação para a turma -->
        <Transition name="modal-fade">
            <div
                v-if="turmaAtiva && !loadingAvTurma && !avaliacaoTurma"
                class="mb-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded px-4 py-3 text-amber-400 text-sm"
            >
                <svg
                    class="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
                <span
                    >Nenhuma avaliação programada para esta turma. Crie uma na
                    aba <strong>Criar Avaliação</strong> e vincule esta
                    turma.</span
                >
            </div>
        </Transition>

        <!-- Loading -->
        <div
            v-if="loadingAlunos || loadingAvTurma"
            class="flex flex-col items-center justify-center py-20"
        >
            <svg
                class="animate-spin h-8 w-8 text-primary mb-4"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                />
                <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
            </svg>
            <p class="text-sm text-secondary">Carregando alunos...</p>
        </div>

        <!-- Sem turma -->
        <div
            v-else-if="!turmaAtiva"
            class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded"
        >
            <svg
                class="w-12 h-12 text-secondary mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
            <p class="text-white font-medium">
                Selecione uma turma para ver os alunos
            </p>
        </div>

        <!-- Vazio -->
        <div
            v-else-if="!alunosFiltrados.length && !loadingAlunos"
            class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded"
        >
            <p class="text-white font-medium">Nenhum aluno encontrado</p>
        </div>

        <!-- Lista de alunos -->
        <div v-else class="space-y-2">
            <div
                v-for="aluno in alunosFiltrados"
                :key="aluno.aluno_id"
                class="bg-[#16161E] border border-white/5 rounded md:overflow-visible overflow-hidden transition-colors group relative"
                :class="
                    alunoAberto === aluno.aluno_id
                        ? 'border-primary/20'
                        : 'hover:border-white/10'
                "
            >
                <!-- Cabeçalho do aluno -->
                <div
                    class="flex items-stretch border-b border-white/5 relative"
                >
                    <!-- Foto -->
                    <div
                        class="w-16 md:w-20 relative flex-shrink-0 group/photo hover:z-50 flex flex-col border-r border-white/5 bg-white/5"
                    >
                        <div
                            class="relative flex-1 w-full rounded-tl md:rounded-tl"
                        >
                            <img
                                v-if="aluno.foto_resposta && store.hash_base"
                                :src="store.hash_base + aluno.foto_resposta"
                                alt="Foto do Aluno"
                                class="absolute inset-0 w-full h-full object-cover transition-all duration-300 z-10 rounded-tl md:rounded-tl"
                                :class="
                                    avaliacaoTurma
                                        ? 'group-hover/photo:scale-[1.8] group-hover/photo:translate-x-16 group-hover/photo:translate-y-6 group-hover/photo:shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover/photo:rounded-lg'
                                        : ''
                                "
                                @error="
                                    (e: any) =>
                                        (e.target.style.display = 'none')
                                "
                            />
                            <div
                                v-else
                                class="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-tl md:rounded-tl"
                            >
                                <span
                                    class="text-xl font-bold text-secondary"
                                    >{{
                                        aluno.name_display?.fallbackInitial
                                    }}</span
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Área de Informações -->
                    <div
                        class="flex-1 flex items-center justify-between min-w-0 px-4 py-4 gap-3 min-h-[110px]"
                    >
                        <div
                            class="flex-1 min-w-0 flex flex-col justify-center"
                        >
                            <div class="flex items-start gap-2 min-w-0">
                                <div
                                    class="font-semibold text-white text-sm truncate"
                                    :title="aluno.name_display?.primaryName"
                                >
                                    {{ aluno.name_display?.primaryName }}
                                </div>
                                <span
                                    v-if="isAlunoPcd(aluno)"
                                    class="inline-flex items-center px-1.5 h-4 border border-blue-500/15 bg-blue-500/5 text-[8px] leading-none font-bold uppercase tracking-[0.14em] text-blue-300 flex-shrink-0 mt-0.5"
                                    >PCD</span
                                >
                            </div>
                            <div
                                class="text-[10px] text-secondary truncate mt-0.5"
                            >
                                {{ aluno.name_display?.secondaryText }}
                            </div>
                            <div
                                class="text-[10px] text-secondary truncate italic mt-0.5"
                            >
                                Nome Artístico:
                                {{ aluno.nome_artistico || "Não possui" }}
                            </div>
                            <div
                                class="text-[11px] text-secondary/60 font-mono mt-1"
                            >
                                RA: {{ aluno.ra ?? aluno.ra_legado ?? "—" }}
                            </div>
                        </div>

                        <button
                            @click="toggleAluno(aluno.aluno_id)"
                            :disabled="!avaliacaoTurma"
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
                            :class="
                                avaliacaoTurma
                                    ? alunoAberto === aluno.aluno_id
                                        ? 'bg-primary/90 text-white shadow-inner'
                                        : 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 hover:-translate-y-0.5'
                                    : 'opacity-30 cursor-not-allowed bg-white/5 text-secondary border border-white/10'
                            "
                        >
                            <svg
                                class="w-3.5 h-3.5 transition-transform duration-200"
                                :class="
                                    alunoAberto === aluno.aluno_id
                                        ? 'rotate-180'
                                        : ''
                                "
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                            Avaliar
                        </button>
                    </div>
                </div>

                <!-- Painel expandido com critérios -->
                <Transition name="slide-down">
                    <div
                        v-if="alunoAberto === aluno.aluno_id"
                        class="border-t border-white/5 bg-black/20"
                    >
                        <div
                            v-if="loadingAlunoCriterios[aluno.aluno_id]"
                            class="flex justify-center py-4"
                        >
                            <svg
                                class="animate-spin h-5 w-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                />
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                        </div>
                        <div v-else class="px-4 py-3 space-y-3">
                            <!-- Sub-abas: Histórico (apenas quando Relatório Final) -->
                            <div
                                v-if="isRelatorioFinal"
                                class="flex items-center gap-1 bg-[#0f0f15] rounded p-1"
                            >
                                <button
                                    @click="
                                        setSubAbaAluno(aluno.aluno_id, 'atual')
                                    "
                                    class="flex-1 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors"
                                    :class="
                                        getSubAbaAluno(aluno.aluno_id) ===
                                        'atual'
                                            ? 'bg-primary text-white shadow'
                                            : 'text-secondary hover:text-white'
                                    "
                                >
                                    Avaliação Atual
                                </button>
                                <button
                                    @click="
                                        setSubAbaAluno(
                                            aluno.aluno_id,
                                            'historico',
                                        )
                                    "
                                    class="flex-1 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                                    :class="
                                        getSubAbaAluno(aluno.aluno_id) ===
                                        'historico'
                                            ? 'bg-primary text-white shadow'
                                            : 'text-secondary hover:text-white'
                                    "
                                >
                                    Histórico
                                    <span
                                        v-if="
                                            getAvaliacoesAnteriores(
                                                aluno.aluno_id,
                                            ).length
                                        "
                                        class="px-1.5 py-0.5 rounded text-[9px] bg-white/10"
                                        >{{
                                            getAvaliacoesAnteriores(
                                                aluno.aluno_id,
                                            ).length
                                        }}</span
                                    >
                                    <span
                                        v-else-if="
                                            loadingAvaliacoesAnteriores[
                                                aluno.aluno_id
                                            ]
                                        "
                                        class="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"
                                    ></span>
                                </button>
                            </div>

                            <!-- Conteúdo: AVALIAÇÃO ATUAL -->
                            <template
                                v-if="
                                    getSubAbaAluno(aluno.aluno_id) === 'atual'
                                "
                            >
                                <!-- Critérios -->
                                <div
                                    v-for="(c, idx) in getCriteriosAluno(
                                        aluno.aluno_id,
                                    )"
                                    :key="c.id_criterio"
                                    class="flex flex-col md:flex-row md:items-center justify-between gap-3 py-3"
                                    :class="
                                        idx !==
                                        getCriteriosAluno(aluno.aluno_id)
                                            .length -
                                            1
                                            ? 'border-b border-white/5'
                                            : ''
                                    "
                                >
                                    <div
                                        class="flex-1 min-w-0 flex flex-col items-start gap-2 pr-4"
                                    >
                                        <span
                                            translate="no"
                                            class="text-sm font-medium text-white/90 leading-tight"
                                            >{{ c.criterio }}</span
                                        >
                                        <span
                                            translate="no"
                                            class="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border shadow-sm backdrop-blur-sm transition-colors"
                                            :class="{
                                                'text-emerald-500 border-emerald-500/20 bg-emerald-500/10':
                                                    c.conceito ===
                                                        'Acima do Esperado' ||
                                                    c.conceito ===
                                                        'Aprovado(a)',
                                                'text-blue-500 border-blue-500/20 bg-blue-500/10':
                                                    c.conceito === 'Adequado',
                                                'text-red-500 border-red-500/20 bg-red-500/10':
                                                    c.conceito ===
                                                        'Pode Melhorar' ||
                                                    c.conceito ===
                                                        'Não Aprovado(a)',
                                                'text-yellow-500 border-yellow-500/20 bg-yellow-500/10':
                                                    !c.conceito ||
                                                    c.conceito ===
                                                        'Aprovado(a) com Ressalvas',
                                            }"
                                            >{{
                                                c.conceito
                                                    ? conceitoLabel[c.conceito]
                                                    : "PENDENTE"
                                            }}</span
                                        >
                                    </div>
                                    <div
                                        class="flex items-center gap-2 mt-1 md:mt-0 w-full md:w-auto flex-col md:flex-row bg-[#16161E] md:bg-transparent p-2 md:p-0 rounded border border-white/5 md:border-0 relative"
                                    >
                                        <Transition name="fade">
                                            <div
                                                v-if="
                                                    savingMap[
                                                        `${aluno.aluno_id}_${c.id_criterio}`
                                                    ]
                                                "
                                                class="absolute -top-3 -right-2 md:static md:top-auto md:right-auto bg-[#0f0f15] md:bg-transparent rounded-full shadow-lg md:shadow-none p-1 z-10"
                                            >
                                                <span
                                                    v-if="
                                                        savingMap[
                                                            `${aluno.aluno_id}_${c.id_criterio}`
                                                        ] === 'saving'
                                                    "
                                                    class="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0 block md:mt-0.5 m-1"
                                                />
                                                <svg
                                                    v-else-if="
                                                        savingMap[
                                                            `${aluno.aluno_id}_${c.id_criterio}`
                                                        ] === 'saved'
                                                    "
                                                    class="w-4 h-4 text-emerald-400 flex-shrink-0"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2.5"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                                <svg
                                                    v-else-if="
                                                        savingMap[
                                                            `${aluno.aluno_id}_${c.id_criterio}`
                                                        ] === 'error'
                                                    "
                                                    class="w-4 h-4 text-red-400 flex-shrink-0"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </div>
                                        </Transition>

                                        <template
                                            v-if="
                                                c.criterio === 'Conceito Final'
                                            "
                                        >
                                            <button
                                                translate="no"
                                                v-for="opt in opcoesConceitoFinal"
                                                :key="opt"
                                                @click="
                                                    salvarConceito(
                                                        aluno.aluno_id,
                                                        c.id_criterio,
                                                        opt,
                                                    )
                                                "
                                                class="w-full md:w-auto px-3 py-2.5 md:py-1.5 rounded text-[10.5px] font-bold uppercase tracking-wider transition-all text-white border border-transparent flex items-center justify-center md:inline-block shadow-sm"
                                                :class="[
                                                    conceitoCor[opt],
                                                    c.conceito === opt
                                                        ? 'opacity-100 shadow-md shadow-white/5 md:scale-[1.03] ring-1 ring-white/20 ring-offset-1 ring-offset-[#0f0f15]'
                                                        : 'opacity-30 md:opacity-40 hover:opacity-100 hover:scale-[1.02]',
                                                ]"
                                            >
                                                {{ conceitoLabel[opt] }}
                                            </button>
                                        </template>
                                        <template v-else>
                                            <button
                                                translate="no"
                                                v-for="opt in [
                                                    'Acima do Esperado',
                                                    'Adequado',
                                                    'Pode Melhorar',
                                                ]"
                                                :key="opt"
                                                @click="
                                                    salvarConceito(
                                                        aluno.aluno_id,
                                                        c.id_criterio,
                                                        opt,
                                                    )
                                                "
                                                class="w-full md:w-auto px-3 py-2.5 md:py-1.5 rounded text-[10.5px] font-bold uppercase tracking-wider transition-all text-white border border-transparent flex items-center justify-center md:inline-block shadow-sm"
                                                :class="[
                                                    conceitoCor[opt],
                                                    c.conceito === opt
                                                        ? 'opacity-100 shadow-md shadow-white/5 md:scale-[1.03] ring-1 ring-white/20 ring-offset-1 ring-offset-[#0f0f15]'
                                                        : 'opacity-30 md:opacity-40 hover:opacity-100 hover:scale-[1.02]',
                                                ]"
                                            >
                                                {{ conceitoLabel[opt] }}
                                            </button>
                                        </template>
                                    </div>
                                </div>
                                <div
                                    v-if="
                                        !getCriteriosAluno(aluno.aluno_id)
                                            .length
                                    "
                                    class="text-sm text-secondary py-2"
                                >
                                    Nenhum critério definido.
                                </div>

                                <!-- PARECER GLOBAL DA ETAPA -->
                                <div
                                    class="mt-4 pt-1 border-t border-white/5 bg-[#0f0f15] rounded p-4 shadow-inner"
                                >
                                    <div class="flex flex-col gap-3">
                                        <div
                                            class="flex justify-between items-center bg-[#16161E] rounded-t border-b border-white/5 px-2 py-1.5"
                                        >
                                            <label
                                                class="block text-xs font-bold text-secondary uppercase tracking-wider"
                                                >Comentário / Parecer do
                                                Professor</label
                                            >
                                            <div class="flex items-center h-5">
                                                <Transition
                                                    name="fade"
                                                    mode="out-in"
                                                >
                                                    <span
                                                        v-if="
                                                            savingMap[
                                                                `${aluno.aluno_id}_global`
                                                            ] === 'saving'
                                                        "
                                                        class="text-[10px] text-primary animate-pulse flex items-center gap-1 font-medium"
                                                    >
                                                        <svg
                                                            class="w-3 h-3 animate-spin"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                class="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                stroke-width="4"
                                                            />
                                                            <path
                                                                class="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                            />
                                                        </svg>
                                                        Salvando...
                                                    </span>
                                                    <span
                                                        v-else-if="
                                                            savingMap[
                                                                `${aluno.aluno_id}_global`
                                                            ] === 'error'
                                                        "
                                                        class="text-[10px] text-red-400 flex items-center gap-1 font-medium"
                                                    >
                                                        <svg
                                                            class="w-3 h-3"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2"
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                        Erro
                                                    </span>
                                                    <span
                                                        v-else-if="
                                                            lastSavedMap[
                                                                `${aluno.aluno_id}_global`
                                                            ]
                                                        "
                                                        class="text-[10px] text-emerald-400 flex items-center gap-1 font-medium"
                                                    >
                                                        <svg
                                                            class="w-3 h-3"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2.5"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                        Salvo com sucesso às
                                                        {{
                                                            lastSavedMap[
                                                                `${aluno.aluno_id}_global`
                                                            ]
                                                        }}
                                                    </span>
                                                </Transition>
                                            </div>
                                        </div>
                                        <div class="flex-1">
                                            <textarea
                                                v-model="
                                                    getGlobalAluno(
                                                        aluno.aluno_id,
                                                    ).comentario
                                                "
                                                rows="3"
                                                placeholder="Escreva aqui o parecer descritivo do aluno nesta etapa..."
                                                class="w-full bg-[#16161E] border border-white/5 rounded-b p-3 text-sm text-white focus:border-primary focus:outline-none resize-y transition-colors hover:border-white/10"
                                            ></textarea>
                                        </div>
                                        <div class="flex justify-end">
                                            <button
                                                class="px-3 py-1.5 rounded bg-primary hover:brightness-110 text-white text-xs font-bold transition-colors disabled:opacity-50"
                                                :disabled="
                                                    savingMap[
                                                        `${aluno.aluno_id}_global`
                                                    ] === 'saving'
                                                "
                                                @click="
                                                    salvarResultadoGlobal(
                                                        aluno.aluno_id,
                                                        'comentario',
                                                    )
                                                "
                                            >
                                                Salvar Parecer
                                            </button>
                                        </div>

                                        <!-- Aprovação Coordenação, Pedagogia e Publicação -->
                                        <div class="flex flex-col gap-2 mt-4">
                                            <!-- Coordenação -->
                                            <div
                                                class="flex items-center justify-between bg-[#16161E] border border-white/5 rounded p-3 transition-colors hover:border-white/10"
                                            >
                                                <div
                                                    class="flex flex-col gap-0.5"
                                                >
                                                    <span
                                                        class="text-[10px] font-black uppercase tracking-wider text-secondary"
                                                        >Aprovação
                                                        Coordenação</span
                                                    >
                                                    <div
                                                        v-if="
                                                            getGlobalAluno(
                                                                aluno.aluno_id,
                                                            )
                                                                .aprovado_coordenador
                                                        "
                                                        class="flex flex-col mt-1"
                                                    >
                                                        <div
                                                            class="flex items-center gap-1.5"
                                                        >
                                                            <div
                                                                class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                                                            ></div>
                                                            <span
                                                                class="text-xs text-white/90 font-medium"
                                                                >{{
                                                                    getGlobalAluno(
                                                                        aluno.aluno_id,
                                                                    )
                                                                        .user_coordenador
                                                                        ?.nome ||
                                                                    ""
                                                                }}
                                                                {{
                                                                    getGlobalAluno(
                                                                        aluno.aluno_id,
                                                                    )
                                                                        .user_coordenador
                                                                        ?.sobrenome ||
                                                                    ""
                                                                }}</span
                                                            >
                                                        </div>
                                                        <span
                                                            v-if="
                                                                getGlobalAluno(
                                                                    aluno.aluno_id,
                                                                )
                                                                    .user_coordenador
                                                                    ?.email
                                                            "
                                                            class="text-[9px] text-secondary/50 hidden md:block italic ml-3.5 mt-0.5"
                                                            >{{
                                                                getGlobalAluno(
                                                                    aluno.aluno_id,
                                                                )
                                                                    .user_coordenador
                                                                    .email
                                                            }}</span
                                                        >
                                                    </div>
                                                    <span
                                                        v-else
                                                        class="text-[10px] text-secondary/40 italic"
                                                        >Aguardando
                                                        coordenação...</span
                                                    >
                                                </div>
                                                <button
                                                    :class="[
                                                        'w-10 h-6 rounded-full flex items-center transition-colors',
                                                        getGlobalAluno(
                                                            aluno.aluno_id,
                                                        ).aprovado_coordenador
                                                            ? 'bg-emerald-500'
                                                            : 'bg-white/10',
                                                    ]"
                                                    @click="
                                                        salvarResultadoGlobal(
                                                            aluno.aluno_id,
                                                            'aprov_coordenador',
                                                        )
                                                    "
                                                    :disabled="
                                                        savingMap[
                                                            `${aluno.aluno_id}_global`
                                                        ] === 'saving'
                                                    "
                                                >
                                                    <span
                                                        :class="[
                                                            'inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform',
                                                            getGlobalAluno(
                                                                aluno.aluno_id,
                                                            )
                                                                .aprovado_coordenador
                                                                ? 'translate-x-4'
                                                                : 'translate-x-0',
                                                        ]"
                                                    ></span>
                                                </button>
                                            </div>

                                            <!-- Pedagogia -->
                                            <div
                                                class="flex items-center justify-between bg-[#16161E] border border-white/5 rounded p-3 transition-colors hover:border-white/10"
                                            >
                                                <div
                                                    class="flex flex-col gap-0.5"
                                                >
                                                    <span
                                                        class="text-[10px] font-black uppercase tracking-wider text-secondary"
                                                        >Aprovação
                                                        Pedagogo(a)</span
                                                    >
                                                    <div
                                                        v-if="
                                                            getGlobalAluno(
                                                                aluno.aluno_id,
                                                            ).aprovado_pedagogo
                                                        "
                                                        class="flex flex-col mt-1"
                                                    >
                                                        <div
                                                            class="flex items-center gap-1.5"
                                                        >
                                                            <div
                                                                class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                                                            ></div>
                                                            <span
                                                                class="text-xs text-white/90 font-medium"
                                                                >{{
                                                                    getGlobalAluno(
                                                                        aluno.aluno_id,
                                                                    )
                                                                        .user_pedagogo
                                                                        ?.nome ||
                                                                    ""
                                                                }}
                                                                {{
                                                                    getGlobalAluno(
                                                                        aluno.aluno_id,
                                                                    )
                                                                        .user_pedagogo
                                                                        ?.sobrenome ||
                                                                    ""
                                                                }}</span
                                                            >
                                                        </div>
                                                        <span
                                                            v-if="
                                                                getGlobalAluno(
                                                                    aluno.aluno_id,
                                                                ).user_pedagogo
                                                                    ?.email
                                                            "
                                                            class="text-[9px] text-secondary/50 hidden md:block italic ml-3.5 mt-0.5"
                                                            >{{
                                                                getGlobalAluno(
                                                                    aluno.aluno_id,
                                                                ).user_pedagogo
                                                                    .email
                                                            }}</span
                                                        >
                                                    </div>
                                                    <span
                                                        v-else
                                                        class="text-[10px] text-secondary/40 italic"
                                                        >Aguardando
                                                        pedagogia...</span
                                                    >
                                                </div>
                                                <button
                                                    :class="[
                                                        'w-10 h-6 rounded-full flex items-center transition-colors',
                                                        getGlobalAluno(
                                                            aluno.aluno_id,
                                                        ).aprovado_pedagogo
                                                            ? 'bg-emerald-500'
                                                            : 'bg-white/10',
                                                    ]"
                                                    @click="
                                                        salvarResultadoGlobal(
                                                            aluno.aluno_id,
                                                            'aprov_pedagogo',
                                                        )
                                                    "
                                                    :disabled="
                                                        savingMap[
                                                            `${aluno.aluno_id}_global`
                                                        ] === 'saving'
                                                    "
                                                >
                                                    <span
                                                        :class="[
                                                            'inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform',
                                                            getGlobalAluno(
                                                                aluno.aluno_id,
                                                            ).aprovado_pedagogo
                                                                ? 'translate-x-4'
                                                                : 'translate-x-0',
                                                        ]"
                                                    ></span>
                                                </button>
                                            </div>

                                            <!-- Publicação -->
                                            <div
                                                class="flex items-center justify-between bg-[#16161E] border border-white/5 rounded p-3 transition-colors hover:border-white/10"
                                                :class="
                                                    !getGlobalAluno(
                                                        aluno.aluno_id,
                                                    ).aprovado_coordenador ||
                                                    !getGlobalAluno(
                                                        aluno.aluno_id,
                                                    ).aprovado_pedagogo
                                                        ? 'opacity-50 grayscale select-none'
                                                        : ''
                                                "
                                            >
                                                <div
                                                    class="flex flex-col gap-0.5"
                                                >
                                                    <span
                                                        class="text-[10px] font-black uppercase tracking-wider text-secondary"
                                                        >Status de
                                                        Publicação</span
                                                    >
                                                    <span
                                                        class="text-xs font-medium"
                                                        :class="
                                                            getGlobalAluno(
                                                                aluno.aluno_id,
                                                            ).publicado
                                                                ? 'text-primary'
                                                                : 'text-secondary/60'
                                                        "
                                                    >
                                                        {{
                                                            getGlobalAluno(
                                                                aluno.aluno_id,
                                                            ).publicado
                                                                ? "Visível para o Estudante"
                                                                : "Oculto (Rascunho)"
                                                        }}
                                                    </span>
                                                </div>
                                                <button
                                                    :class="[
                                                        'w-10 h-6 rounded-full flex items-center transition-colors',
                                                        getGlobalAluno(
                                                            aluno.aluno_id,
                                                        ).publicado
                                                            ? 'bg-primary'
                                                            : 'bg-white/10',
                                                    ]"
                                                    @click="
                                                        salvarResultadoGlobal(
                                                            aluno.aluno_id,
                                                            'publicar',
                                                        )
                                                    "
                                                    :disabled="
                                                        !getGlobalAluno(
                                                            aluno.aluno_id,
                                                        )
                                                            .aprovado_coordenador ||
                                                        !getGlobalAluno(
                                                            aluno.aluno_id,
                                                        ).aprovado_pedagogo ||
                                                        savingMap[
                                                            `${aluno.aluno_id}_global`
                                                        ] === 'saving'
                                                    "
                                                >
                                                    <span
                                                        :class="[
                                                            'inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform',
                                                            getGlobalAluno(
                                                                aluno.aluno_id,
                                                            ).publicado
                                                                ? 'translate-x-4'
                                                                : 'translate-x-0',
                                                        ]"
                                                    ></span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>

                            <!-- Conteúdo: HISTÓRICO -->
                            <template v-else>
                                <!-- Loading do histórico -->
                                <div
                                    v-if="
                                        loadingAvaliacoesAnteriores[
                                            aluno.aluno_id
                                        ]
                                    "
                                    class="flex justify-center py-4"
                                >
                                    <svg
                                        class="animate-spin h-5 w-5 text-primary"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            class="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            stroke-width="4"
                                        />
                                        <path
                                            class="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                </div>

                                <!-- Lista de avaliações anteriores -->
                                <div
                                    v-else-if="
                                        getAvaliacoesAnteriores(aluno.aluno_id)
                                            .length
                                    "
                                    class="space-y-3"
                                >
                                    <div
                                        v-for="av in getAvaliacoesAnteriores(
                                            aluno.aluno_id,
                                        )"
                                        :key="av.id_avaliacao"
                                        class="bg-[#0f0f15] border border-white/5 rounded p-3 opacity-80"
                                    >
                                        <!-- Cabeçalho da etapa anterior -->
                                        <div
                                            class="flex items-center justify-between mb-2"
                                        >
                                            <span
                                                class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                                                :class="{
                                                    'text-purple-400 border-purple-400/20 bg-purple-400/10':
                                                        av.etapa ===
                                                        'O que nos Une',
                                                    'text-blue-400 border-blue-400/20 bg-blue-400/10':
                                                        av.etapa ===
                                                        'Mundo do Trabalho',
                                                    'text-emerald-400 border-emerald-400/20 bg-emerald-400/10':
                                                        av.etapa === 'Criação',
                                                    'text-amber-400 border-amber-400/20 bg-amber-400/10':
                                                        av.etapa ===
                                                        'Relatório Final',
                                                }"
                                                >{{ av.etapa }}</span
                                            >
                                            <span
                                                v-if="av.conceito_geral"
                                                class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                                                :class="{
                                                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':
                                                        av.conceito_geral ===
                                                            'Aprovado(a)' ||
                                                        av.conceito_geral ===
                                                            'Acima do Esperado',
                                                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20':
                                                        av.conceito_geral ===
                                                        'Aprovado(a) com Ressalvas',
                                                    'bg-red-500/10 text-red-400 border border-red-500/20':
                                                        av.conceito_geral ===
                                                        'Não Aprovado(a)',
                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20':
                                                        av.conceito_geral ===
                                                        'Adequado',
                                                }"
                                                >{{ av.conceito_geral }}</span
                                            >
                                        </div>

                                        <!-- Critérios compactos -->
                                        <div
                                            v-if="
                                                av.criterios &&
                                                av.criterios.length
                                            "
                                            class="flex flex-wrap gap-1.5 mb-2"
                                        >
                                            <div
                                                v-for="crit in av.criterios"
                                                :key="crit.id_criterio"
                                                class="flex items-center gap-1 bg-[#16161E] rounded px-2 py-1"
                                            >
                                                <span
                                                    class="text-[9px] text-secondary/70 max-w-[120px] truncate"
                                                    :title="crit.criterio"
                                                    >{{ crit.criterio }}</span
                                                >
                                                <span
                                                    class="text-[9px] font-bold uppercase"
                                                    :class="{
                                                        'text-emerald-400':
                                                            crit.conceito ===
                                                                'Acima do Esperado' ||
                                                            crit.conceito ===
                                                                'Aprovado(a)',
                                                        'text-blue-400':
                                                            crit.conceito ===
                                                            'Adequado',
                                                        'text-red-400':
                                                            crit.conceito ===
                                                                'Pode Melhorar' ||
                                                            crit.conceito ===
                                                                'Não Aprovado(a)',
                                                        'text-yellow-400':
                                                            !crit.conceito ||
                                                            crit.conceito ===
                                                                'Aprovado(a) com Ressalvas',
                                                        'text-secondary/50':
                                                            !crit.conceito,
                                                    }"
                                                    >{{
                                                        crit.conceito || "—"
                                                    }}</span
                                                >
                                            </div>
                                        </div>

                                        <!-- Comentário compacto -->
                                        <div
                                            v-if="av.comentario"
                                            class="text-[10px] text-secondary/60 italic leading-relaxed line-clamp-2"
                                        >
                                            "{{ av.comentario }}"
                                        </div>
                                    </div>
                                </div>

                                <!-- Vazio -->
                                <div
                                    v-else
                                    class="text-sm text-secondary py-4 text-center"
                                >
                                    Nenhuma avaliação anterior encontrada para
                                    este aluno.
                                </div>
                            </template>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>

        <!-- Modal: Confirmação de publicação em lote -->
        <ConfirmationModal
            :is-open="showBulkPublishConfirm"
            title="Publicar avaliações em lote"
            :message="`Confirmar a publicação de ${dashboardStats?.total_alunos || 0} avaliação(ões) da etapa '${etapaAtiva}'? Esta ação só é liberada porque todas estão completas e validadas.`"
            confirm-text="Publicar"
            cancel-text="Cancelar"
            type="info"
            :loading="bulkPublishing"
            @close="showBulkPublishConfirm = false"
            @confirm="confirmBulkPublish"
        />

        <!-- Modal: Pendências -->
        <ModalPendenciasPublicacao
            :is-open="showPendenciasModal"
            :pendencias="dashboardPendencias"
            @close="showPendenciasModal = false"
        />

        <!-- Modal: Dashboard Contexto -->
        <ModalDashboardContextoAvaliacoes
            :is-open="showDashboardContextoModal"
            :loading="loadingDashboardContexto"
            :items="dashboardContexto"
            :etapa="etapaAtiva"
            :ano-semestre="anoSemestreModel"
            :selected-turma-id="turmaAtiva"
            @close="showDashboardContextoModal = false"
        />

        <!-- Modal: Resumo Conceitos -->
        <ModalResumoConceitosTurmas
            :is-open="showResumoConceitosModal"
            :loading="loadingResumoConceitos"
            :items="resumoConceitos"
            :etapa="etapaAtiva"
            :ano-semestre="anoSemestreModel"
            @close="showResumoConceitosModal = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAppStore } from "~/stores/app";
import { useToast } from "../../../composables/useToast";
import { useAvaliacaoGestaoTurmas } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoTurmas";
import { useAvaliacaoGestaoAlunos } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoAlunos";
import { useAvaliacaoGestaoDashboard } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoDashboard";
import { useAvaliacaoGestaoConceitos } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoConceitos";
import { decorateStudentNames } from "../../../utils/student_name";
import BaseSelect from "~/components/BaseSelect.vue";
import ConfirmationModal from "~/components/ConfirmationModal.vue";
import ModalPendenciasPublicacao from "~/components/avaliacao-gestao/ModalPendenciasPublicacao.vue";
import ModalDashboardContextoAvaliacoes from "~/components/avaliacao-gestao/ModalDashboardContextoAvaliacoes.vue";
import ModalResumoConceitosTurmas from "~/components/avaliacao-gestao/ModalResumoConceitosTurmas.vue";

const props = defineProps<{
    anoSemestre: string;
    etapaOptions: string[];
    semestreOptions: { id: string; nome: string }[];
}>();

const emit = defineEmits<{
    "update:anoSemestre": [value: string];
    "contexto-change": [];
}>();

const store = useAppStore();
const { showToast } = useToast();
const {
    turmas,
    turmaAtiva,
    loadingTurmas,
    fetchTurmas,
    avaliacaoTurma,
    loadingAvTurma,
    fetchAvaliacaoPorTurma,
} = useAvaliacaoGestaoTurmas();
const { alunos, loadingAlunos, fetchAlunos } = useAvaliacaoGestaoAlunos();
const {
    dashboardStats,
    loadingDashboard,
    fetchDashboard,
    dashboardContexto,
    loadingDashboardContexto,
    fetchDashboardContexto,
    resumoConceitos,
    loadingResumoConceitos,
    fetchResumoConceitos,
    bulkPublishing,
    publicarLote,
} = useAvaliacaoGestaoDashboard();

const {
    alunoAberto,
    conceitosCache,
    loadingAlunoCriterios,
    savingMap,
    lastSavedMap,
    getCriteriosAluno,
    getGlobalAluno,
    toggleAluno: _toggleAluno,
    salvarConceito: _salvarConceito,
    salvarResultadoGlobal: _salvarResultadoGlobal,
    fetchAvaliacoesAnteriores,
    getAvaliacoesAnteriores,
    loadingAvaliacoesAnteriores,
} = useAvaliacaoGestaoConceitos();

// ── Computed local para anoSemestre ──────────────────────────
const anoSemestreModel = computed({
    get: () => props.anoSemestre,
    set: (val: string) => emit("update:anoSemestre", val),
});

// ── Turmas ───────────────────────────────────────────────────
const turmaFilterOptions = computed(() => {
    const badge = (turma: any): string => {
        const nome = turma?.nome_curso || "Turma";
        const codigo = turma?.cod_turma ? ` (${turma.cod_turma})` : "";
        return `${nome}${codigo}`;
    };
    return turmas.value.map((t: any) => ({ ...t, nome: badge(t) }));
});

const _fetchTurmas = () => fetchTurmas(props.anoSemestre);

// ── Avaliação vinculada à turma e Etapa ──────────────────────
const etapaAtiva = ref<string>("O que nos Une");

const _fetchAvaliacaoPorTurma = async () => {
    dashboardStats.value = null;
    alunoAberto.value = null;
    conceitosCache.value = {};
    await fetchAvaliacaoPorTurma(turmaAtiva.value, etapaAtiva.value);
    await _fetchDashboard();
};

watch(etapaAtiva, () => {
    _fetchAvaliacaoPorTurma();
    _fetchDashboardContextoIfOpen();
});

// ── Alunos ───────────────────────────────────────────────────
const _fetchAlunos = () => fetchAlunos(turmaAtiva.value, props.anoSemestre);
const buscaAluno = ref("");

const alunosFiltrados = computed(() => {
    if (!buscaAluno.value.trim()) return alunos.value;
    const q = buscaAluno.value.toLowerCase();
    return alunos.value.filter(
        (a: any) =>
            `${a.nome ?? ""} ${a.sobrenome ?? ""} ${a.nome_aluno ?? ""} ${a.nome_social ?? ""}`
                .toLowerCase()
                .includes(q) || (a.ra ?? "").toLowerCase().includes(q),
    );
});

const isAlunoPcd = (aluno: any) =>
    String(aluno?.pcd || "")
        .toLowerCase()
        .includes("sim");

// ── Lazy load de conceitos por aluno ─────────────────────────
// (conceitosCache agora vem de useAvaliacaoGestaoConceitos)

// ── Sub-aba do painel expandido (Histórico) ──────────────────
const subAbaAluno = ref<Record<string, "atual" | "historico">>({});

const isRelatorioFinal = computed(() => etapaAtiva.value === "Relatório Final");

const opcoesConceitoFinal = computed(() => {
    const base = [
        "Aprovado(a)",
        "Aprovado(a) com Ressalvas",
        "Não Aprovado(a)",
    ];
    if (isRelatorioFinal.value) {
        return base.filter((opt) => opt !== "Aprovado(a) com Ressalvas");
    }
    return base;
});

const getSubAbaAluno = (id_aluno: string) =>
    subAbaAluno.value[id_aluno] || "atual";

const setSubAbaAluno = (id_aluno: string, aba: "atual" | "historico") => {
    subAbaAluno.value[id_aluno] = aba;
};

interface DashboardPendencia {
    id_aluno: string;
    nome_aluno: string;
    ra?: string | null;
    total_criterios: number;
    total_criterios_preenchidos: number;
    falta_avaliacao: boolean;
    falta_coordenador: boolean;
    falta_pedagogo: boolean;
    elegivel_publicacao: boolean;
    publicado: boolean;
}

interface AvaliacaoDashboard {
    total_alunos: number;
    total_avaliadas: number;
    total_nao_avaliadas: number;
    total_validadas_coordenador: number;
    total_nao_validadas_coordenador: number;
    total_validadas_pedagogo: number;
    total_nao_validadas_pedagogo: number;
    total_validadas_ambos: number;
    total_nao_validadas_ambos: number;
    total_publicadas: number;
    total_nao_publicadas: number;
    total_elegiveis_publicacao: number;
    total_nao_elegiveis_publicacao: number;
    pendencias: DashboardPendencia[];
}

interface AvaliacaoDashboardContextoItem {
    id_turma: string;
    turma_nome: string;
    cod_turma?: string | null;
    id_avaliacao?: string | null;
    possui_avaliacao: boolean;
    status_resumo: string;
    concluida: boolean;
    total_alunos: number;
    total_avaliadas: number;
    total_nao_avaliadas: number;
    total_validadas_coordenador: number;
    total_nao_validadas_coordenador: number;
    total_validadas_pedagogo: number;
    total_nao_validadas_pedagogo: number;
    total_validadas_ambos: number;
    total_nao_validadas_ambos: number;
    total_publicadas: number;
    total_nao_publicadas: number;
    total_elegiveis_publicacao: number;
    total_nao_elegiveis_publicacao: number;
}

const showBulkPublishConfirm = ref(false);
const showPendenciasModal = ref(false);
const showDashboardContextoModal = ref(false);
const showResumoConceitosModal = ref(false);

// ── Dashboard ────────────────────────────────────────────────
const dashboardPendencias = computed(
    () => dashboardStats.value?.pendencias || [],
);
const idsTurmasContexto = computed(() =>
    turmas.value.map((t: any) => t.id).filter(Boolean),
);
const resumoDashboardContexto = computed(() => ({
    total: dashboardContexto.value.length,
    concluidas: dashboardContexto.value.filter((item) => item.concluida).length,
    pendentes: dashboardContexto.value.filter(
        (item) => item.possui_avaliacao && !item.concluida,
    ).length,
    semAvaliacao: dashboardContexto.value.filter(
        (item) => !item.possui_avaliacao,
    ).length,
}));

const _fetchDashboard = () => {
    const id = avaliacaoTurma.value?.id_avaliacao;
    const turma = turmaAtiva.value;
    if (id && turma) fetchDashboard(id, turma);
};

const _fetchDashboardContexto = () =>
    fetchDashboardContexto(
        idsTurmasContexto.value,
        props.anoSemestre,
        etapaAtiva.value,
    );

const _fetchDashboardContextoIfOpen = async () => {
    if (!showDashboardContextoModal.value) return;
    await _fetchDashboardContexto();
};

const _fetchResumoConceitos = () =>
    fetchResumoConceitos(
        idsTurmasContexto.value,
        props.anoSemestre,
        etapaAtiva.value,
    );

const handleOpenDashboardContexto = async () => {
    showDashboardContextoModal.value = true;
    await _fetchDashboardContexto();
};

const handleOpenResumoConceitos = async () => {
    showResumoConceitosModal.value = true;
    await _fetchResumoConceitos();
};

// ── Publicação em lote ────────────────────────────────────────
const podeTentarPublicarLote = computed(
    () =>
        !!turmaAtiva.value &&
        !!avaliacaoTurma.value &&
        !loadingDashboard.value &&
        !bulkPublishing.value,
);
const turmaSelecionada = computed(
    () => turmas.value.find((t: any) => t.id === turmaAtiva.value) || null,
);

const totalPendenciasAvaliacao = computed(
    () =>
        dashboardPendencias.value.filter((i: any) => i.falta_avaliacao).length,
);
const totalPendenciasCoordenador = computed(
    () =>
        dashboardPendencias.value.filter((i: any) => i.falta_coordenador)
            .length,
);
const totalPendenciasPedagogo = computed(
    () => dashboardPendencias.value.filter((i: any) => i.falta_pedagogo).length,
);

const handleOpenPublishBatch = () => {
    if (!podeTentarPublicarLote.value) return;
    if (!dashboardStats.value?.total_alunos) {
        showToast("Nenhum aluno encontrado no contexto selecionado.", {
            type: "info",
        });
        return;
    }
    if (Number(dashboardStats.value.total_nao_elegiveis_publicacao || 0) > 0) {
        showToast(
            `Publicação em lote bloqueada: ${totalPendenciasAvaliacao.value} com critérios pendentes`,
            { type: "error", duration: 7000 },
        );
        showPendenciasModal.value = true;
        return;
    }
    showBulkPublishConfirm.value = true;
};

const confirmBulkPublish = async () => {
    if (!avaliacaoTurma.value?.id_avaliacao || !turmaAtiva.value) return;
    try {
        const data: any = await publicarLote(
            avaliacaoTurma.value.id_avaliacao,
            turmaAtiva.value,
        );
        Object.values(conceitosCache.value).forEach((entry: any) => {
            if (entry?.global) entry.global.publicado = true;
        });
        showBulkPublishConfirm.value = false;
        showToast(
            data?.message || "Publicação em lote concluída com sucesso.",
            { type: "success" },
        );
        await _fetchDashboard();
        await _fetchDashboardContextoIfOpen();
    } catch (error: any) {
        console.error(error);
        const errorData = error?.data?.data || {};
        if (errorData.dashboard) dashboardStats.value = errorData.dashboard;
        if (
            Array.isArray(errorData.pendencias) &&
            errorData.pendencias.length
        ) {
            dashboardStats.value = {
                ...(dashboardStats.value || ({} as AvaliacaoDashboard)),
                ...(errorData.dashboard || {}),
                pendencias: errorData.pendencias,
            };
            showPendenciasModal.value = true;
        }
        showToast(
            error?.data?.statusMessage ||
                "Não foi possível publicar as avaliações em lote.",
            { type: "error", duration: 7000 },
        );
    }
};

// ── Conceitos ─────────────────────────────────────────────────
const toggleAluno = (id_aluno: string) => {
    if (!avaliacaoTurma.value) return;
    const id = avaliacaoTurma.value.id_avaliacao;
    // Se está abrindo um aluno diferente (ou fechando), reseta a sub-aba
    if (alunoAberto.value !== id_aluno) {
        subAbaAluno.value[id_aluno] = "atual";
    }
    _toggleAluno(id_aluno, id);
    // Se for Relatório Final, carrega as avaliações anteriores do aluno
    if (etapaAtiva.value === "Relatório Final") {
        fetchAvaliacoesAnteriores(
            id_aluno,
            id,
            props.anoSemestre,
            turmaAtiva.value,
        );
    }
};

// getCriteriosAluno / getGlobalAluno agora vêm de useAvaliacaoGestaoConceitos

const salvarConceito = (
    id_aluno: string,
    id_criterio: string,
    conceito: string,
) => {
    return _salvarConceito(id_aluno, id_criterio, conceito, () => {
        _fetchDashboard();
        _fetchDashboardContextoIfOpen();
    });
};

const salvarResultadoGlobal = (
    id_aluno: string,
    action?: "comentario" | "aprov_coordenador" | "aprov_pedagogo" | "publicar",
) => {
    if (!avaliacaoTurma.value) return;
    return _salvarResultadoGlobal(
        avaliacaoTurma.value.id_avaliacao,
        id_aluno,
        action,
        () => {
            _fetchDashboard();
            _fetchDashboardContextoIfOpen();
        },
    );
};

const conceitoCor: Record<string, string> = {
    "Acima do Esperado": "bg-emerald-500 text-white border-emerald-500",
    Adequado: "bg-blue-500 text-white border-blue-500",
    "Pode Melhorar": "bg-red-500 text-white border-red-500",
    "Aprovado(a)": "bg-emerald-500 text-white border-emerald-500",
    "Aprovado(a) com Ressalvas": "bg-yellow-500 text-white border-yellow-500",
    "Não Aprovado(a)": "bg-red-500 text-white border-red-500",
};

const conceitoLabel: Record<string, string> = {
    "Acima do Esperado": "Acima do Esperado",
    Adequado: "Adequado",
    "Pode Melhorar": "Pode Melhorar",
    "Aprovado(a)": "Aprovado(a)",
    "Aprovado(a) com Ressalvas": "Aprovado(a) com Ressalvas",
    "Não Aprovado(a)": "Não Aprovado(a)",
};

// ── Watchers ──────────────────────────────────────────────────
watch(turmaAtiva, async () => {
    buscaAluno.value = "";
    await store.refreshHash();
    await Promise.all([_fetchAlunos(), _fetchAvaliacaoPorTurma()]);
    await _fetchDashboardContextoIfOpen();
    emit("contexto-change");
});

watch(anoSemestreModel, async () => {
    alunos.value = [];
    avaliacaoTurma.value = null;
    await store.refreshHash();
    await _fetchTurmas();
    await _fetchDashboardContextoIfOpen();
});

// ── Init ──────────────────────────────────────────────────────
_fetchTurmas();

// ── Expose para o pai (sidebar) ─────────────────────────────
defineExpose({
    dashboardStats,
    dashboardContexto,
    loadingDashboard,
    bulkPublishing,
    showPendenciasModal,
    showDashboardContextoModal,
    showResumoConceitosModal,
    handleOpenPublishBatch,
    handleOpenDashboardContexto,
    handleOpenResumoConceitos,
    podeTentarPublicarLote,
    turmaSelecionada,
    etapaAtiva,
    dashboardPendencias,
    resumoDashboardContexto,
    totalPendenciasAvaliacao,
    totalPendenciasCoordenador,
    totalPendenciasPedagogo,
    idsTurmasContexto,
    _fetchDashboardContextoIfOpen,
    _fetchResumoConceitos,
});
</script>
