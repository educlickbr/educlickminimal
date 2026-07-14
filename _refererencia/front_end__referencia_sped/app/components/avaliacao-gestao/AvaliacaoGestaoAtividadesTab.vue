<template>
    <div>
        <!-- Sub-abas -->
        <div class="mb-5 flex flex-wrap items-center gap-2">
            <button
                @click="subAbaAtividades = 'criar_atividade'"
                class="px-3 py-1.5 rounded border text-[11px] font-bold uppercase tracking-wider transition-colors"
                :class="
                    subAbaAtividades === 'criar_atividade'
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-[#16161E] border-white/10 text-secondary hover:text-white hover:border-white/20'
                "
            >
                Criar Atividades
            </button>
            <button
                @click="subAbaAtividades = 'associar_atividade'"
                class="px-3 py-1.5 rounded border text-[11px] font-bold uppercase tracking-wider transition-colors"
                :class="
                    subAbaAtividades === 'associar_atividade'
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-[#16161E] border-white/10 text-secondary hover:text-white hover:border-white/20'
                "
            >
                Associar Atividades
            </button>
            <button
                @click="subAbaAtividades = 'avaliar_atividade'"
                class="px-3 py-1.5 rounded border text-[11px] font-bold uppercase tracking-wider transition-colors"
                :class="
                    subAbaAtividades === 'avaliar_atividade'
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-[#16161E] border-white/10 text-secondary hover:text-white hover:border-white/20'
                "
            >
                Avaliar Atividades
            </button>
        </div>

        <!-- SUB-ABA: Criar Atividades -->
        <template v-if="subAbaAtividades === 'criar_atividade'">
            <div class="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h4
                        class="text-sm font-black text-white uppercase tracking-wider"
                    >
                        Catálogo de Atividades
                    </h4>
                    <p class="text-xs text-secondary mt-1">
                        Cards com atividades recuperáveis e compartilháveis
                        entre docentes.
                    </p>
                </div>
                <button
                    @click="openCriarAtividade"
                    class="px-4 py-2 rounded-lg bg-primary hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Nova atividade
                </button>
            </div>

            <div
                v-if="loadingAtividades"
                class="py-12 flex items-center justify-center text-secondary text-sm bg-[#16161E] border border-white/10 rounded-lg"
            >
                Carregando atividades...
            </div>
            <div
                v-else-if="!atividades.length"
                class="py-12 border border-dashed border-white/10 rounded-lg text-center text-secondary text-sm bg-[#16161E]"
            >
                <p class="font-semibold text-white">
                    Nenhuma atividade cadastrada ainda.
                </p>
                <button
                    @click="openCriarAtividade"
                    class="mt-3 text-primary hover:underline text-xs font-bold uppercase tracking-wider"
                >
                    Criar a primeira atividade →
                </button>
            </div>
            <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
                <article
                    v-for="atividade in atividades"
                    :key="atividade.id"
                    class="bg-[#16161E] border border-white/10 rounded-xl p-4 flex flex-col gap-4 hover:border-white/20 transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <p
                                class="text-[10px] font-black uppercase tracking-[0.18em] text-primary"
                            >
                                Atividade
                            </p>
                            <h5
                                class="mt-1 text-base font-bold text-white leading-tight line-clamp-2"
                            >
                                {{ atividade.titulo }}
                            </h5>
                        </div>
                        <span
                            class="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"
                            >Recuperação</span
                        >
                    </div>
                    <p class="text-sm text-secondary line-clamp-4">
                        {{ atividade.enunciado }}
                    </p>
                    <div
                        class="mt-auto space-y-2 border-t border-white/10 pt-3"
                    >
                        <a
                            v-if="atividade.link_externo"
                            :href="atividade.link_externo"
                            target="_blank"
                            rel="noreferrer"
                            class="block truncate text-[11px] font-medium text-primary hover:underline"
                            >Link externo</a
                        >
                        <p
                            v-if="atividade.id_turma"
                            class="truncate text-[11px] text-secondary"
                        >
                            Turma vinculada:
                            {{
                                atividade.turma_nome_turno || atividade.id_turma
                            }}
                        </p>
                        <button
                            v-if="atividade.arquivo_apoio"
                            type="button"
                            @click="openAtividadeArquivo(atividade)"
                            class="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
                            title="Ver arquivo"
                        >
                            <svg
                                class="h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.8"
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                            <span class="truncate max-w-[220px]">{{
                                String(atividade.arquivo_apoio).split("/").pop()
                            }}</span>
                        </button>
                        <p class="text-[10px] text-secondary/60">
                            Criada em
                            {{
                                new Date(
                                    atividade.criado_em,
                                ).toLocaleDateString("pt-BR")
                            }}
                        </p>
                        <div class="pt-1">
                            <button
                                type="button"
                                @click="openEditarAtividade(atividade)"
                                class="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:border-primary/40 hover:text-primary transition-colors"
                            >
                                Editar atividade
                            </button>
                        </div>
                    </div>
                </article>
            </div>
        </template>

        <!-- SUB-ABA: Associar Atividades -->
        <template v-else-if="subAbaAtividades === 'associar_atividade'">
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
                            v-model="buscaAlunoAssociar"
                            type="text"
                            placeholder="Buscar por nome do aluno ou RA..."
                            class="w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 h-10"
                        />
                    </div>
                </div>
            </div>

            <Transition name="modal-fade">
                <div
                    v-if="
                        turmaAtiva &&
                        !loadingAssociarAlunos &&
                        !associarAvaliacao
                    "
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
                        >Nenhuma avaliação encontrada para turma + etapa.
                        Crie/vincule a avaliação primeiro.</span
                    >
                </div>
            </Transition>

            <div
                v-if="loadingAssociarAlunos"
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
                <p class="text-sm text-secondary">
                    Carregando alunos com ressalvas...
                </p>
            </div>
            <div
                v-else-if="!turmaAtiva"
                class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded"
            >
                <p class="text-white font-medium">
                    Selecione uma turma para associar atividades
                </p>
            </div>
            <div
                v-else-if="!associarAlunosFiltrados.length"
                class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded"
            >
                <p class="text-white font-medium">
                    Nenhum aluno com Conceito Final "Aprovado(a) com Ressalvas"
                </p>
            </div>
            <div v-else class="space-y-2">
                <div
                    v-for="aluno in associarAlunosFiltrados"
                    :key="aluno.aluno_id"
                    class="bg-[#16161E] border border-white/5 rounded transition-colors hover:border-white/10"
                >
                    <div
                        class="flex items-start justify-between px-4 py-4 gap-4"
                    >
                        <div class="min-w-0 flex-1">
                            <div
                                class="font-semibold text-white text-sm truncate"
                                :title="aluno.name_display?.primaryName"
                            >
                                {{ aluno.name_display?.primaryName }}
                            </div>
                            <div
                                class="text-[10px] text-secondary truncate mt-0.5"
                            >
                                {{ aluno.name_display?.secondaryText }}
                            </div>
                            <div
                                class="text-[11px] text-secondary/60 font-mono mt-1"
                            >
                                RA: {{ aluno.ra ?? aluno.ra_legado ?? "—" }}
                            </div>
                            <div
                                v-if="aluno.atividade_associada"
                                class="mt-3 inline-flex items-center gap-2 bg-[#0f0f15] border border-white/8 rounded px-3 py-2 max-w-full"
                            >
                                <span
                                    class="shrink-0 text-[9px] font-black uppercase tracking-widest text-emerald-500/70"
                                    >Atividade</span
                                >
                                <span
                                    class="px-2 py-0.5 rounded border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 text-[11px] font-bold truncate max-w-[200px]"
                                    :title="
                                        aluno.atividade_associada
                                            .titulo_atividade
                                    "
                                    >{{
                                        aluno.atividade_associada
                                            .titulo_atividade
                                    }}</span
                                >
                                <button
                                    type="button"
                                    @click="handleVerAtividadeAssociada(aluno)"
                                    class="shrink-0 px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                                >
                                    Abrir
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-2 pt-0.5">
                            <span
                                class="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border text-yellow-500 border-yellow-500/20 bg-yellow-500/10 whitespace-nowrap"
                                >{{
                                    aluno.conceito_final ||
                                    "Aprovado(a) com Ressalvas"
                                }}</span
                            >
                            <button
                                v-if="!aluno.atividade_associada"
                                type="button"
                                @click="handleAssociarAtividade(aluno)"
                                class="px-3 py-1.5 rounded bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Associar atividade
                            </button>
                            <button
                                v-else
                                type="button"
                                :disabled="
                                    eliminandoAssociacao[
                                        String(
                                            aluno.aluno_id ||
                                                aluno.id_aluno ||
                                                aluno.id ||
                                                '',
                                        )
                                    ]
                                "
                                @click="handleEliminarAssociacao(aluno)"
                                class="px-3 py-1.5 rounded bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                <span
                                    v-if="
                                        eliminandoAssociacao[
                                            String(
                                                aluno.aluno_id ||
                                                    aluno.id_aluno ||
                                                    aluno.id ||
                                                    '',
                                            )
                                        ]
                                    "
                                    >Removendo…</span
                                >
                                <span v-else>Eliminar associação</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- SUB-ABA: Avaliar Atividades -->
        <template v-else>
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
                    <div class="md:col-span-2">
                        <BaseSelect
                            v-model="etapaAtiva"
                            :options="etapaOptions"
                            placeholder="Etapa"
                        />
                    </div>
                    <div class="md:col-span-2">
                        <BaseSelect
                            v-model="filtroStatusEntrega"
                            :options="statusEntregaOptions"
                            label-key="nome"
                            value-key="id"
                            placeholder="Status"
                        />
                    </div>
                    <div class="md:col-span-1">
                        <input
                            v-model="filtroDataInicio"
                            type="date"
                            title="Data início (entregue em)"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none h-10 appearance-none"
                        />
                    </div>
                    <div class="md:col-span-1">
                        <input
                            v-model="filtroDataFim"
                            type="date"
                            title="Data fim (entregue em)"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none h-10 appearance-none"
                        />
                    </div>
                </div>
            </div>

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
                        >Nenhuma avaliação encontrada para a turma + etapa
                        selecionadas.</span
                    >
                </div>
            </Transition>

            <div
                v-if="loadingEntregas"
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
                <p class="text-sm text-secondary">Carregando entregas...</p>
            </div>
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
                    Selecione uma turma e etapa para ver as entregas
                </p>
            </div>
            <div
                v-else-if="!entregasAtividades.length && !loadingEntregas"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <p class="text-white font-medium">Nenhuma entrega encontrada</p>
                <p class="text-secondary text-sm mt-1">
                    Tente ajustar os filtros ou associe atividades a alunos.
                </p>
            </div>
            <div v-else class="space-y-2">
                <div
                    v-for="entrega in entregasAtividades"
                    :key="entrega.id_entrega"
                    class="bg-[#16161E] border rounded overflow-hidden transition-colors"
                    :class="[
                        entregaAberta === entrega.id_entrega
                            ? 'border-primary/20'
                            : 'border-white/5 hover:border-white/10',
                    ]"
                >
                    <div
                        class="flex items-center justify-between px-4 py-3 gap-4"
                    >
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span
                                    class="font-semibold text-white text-sm truncate"
                                    :title="`${entrega.nome_aluno} ${entrega.sobrenome_aluno}`"
                                    >{{ entrega.nome_aluno }}
                                    {{ entrega.sobrenome_aluno }}</span
                                >
                                <span
                                    v-if="entrega.ra_aluno"
                                    class="text-[10px] font-mono text-secondary/60"
                                    >RA {{ entrega.ra_aluno }}</span
                                >
                            </div>
                            <p
                                class="text-[11px] text-secondary mt-0.5 truncate"
                                :title="entrega.titulo_atividade"
                            >
                                Atividade: {{ entrega.titulo_atividade }}
                            </p>
                            <p
                                v-if="entrega.entregue_em"
                                class="text-[10px] text-secondary/50 mt-0.5"
                            >
                                Entregue em:
                                {{
                                    new Date(
                                        entrega.entregue_em,
                                    ).toLocaleString("pt-BR")
                                }}
                            </p>
                            <p
                                v-else
                                class="text-[10px] text-amber-400/60 mt-0.5 italic"
                            >
                                Aguardando entrega do aluno
                            </p>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span
                                class="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border"
                                :class="
                                    statusEntregaClass[
                                        entrega.status_avaliacao
                                    ] ||
                                    'text-secondary border-white/10 bg-white/5'
                                "
                                >{{ entrega.status_avaliacao }}</span
                            >
                            <button
                                v-if="entrega.status_avaliacao === 'Entregue'"
                                type="button"
                                @click="
                                    entregaAberta =
                                        entregaAberta === entrega.id_entrega
                                            ? null
                                            : entrega.id_entrega
                                "
                                class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
                                :class="
                                    entregaAberta === entrega.id_entrega
                                        ? 'bg-primary/90 text-white'
                                        : 'bg-primary hover:bg-primary-hover text-white'
                                "
                            >
                                <svg
                                    class="w-3.5 h-3.5 transition-transform duration-200"
                                    :class="
                                        entregaAberta === entrega.id_entrega
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
                            <button
                                v-else-if="
                                    entrega.status_avaliacao === 'Aprovado' ||
                                    entrega.status_avaliacao === 'Reprovado'
                                "
                                type="button"
                                @click="
                                    entregaAberta =
                                        entregaAberta === entrega.id_entrega
                                            ? null
                                            : entrega.id_entrega
                                "
                                class="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 bg-white/5 text-secondary hover:text-white hover:border-white/20 text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                <svg
                                    class="w-3.5 h-3.5 transition-transform duration-200"
                                    :class="
                                        entregaAberta === entrega.id_entrega
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
                                Ver
                            </button>
                        </div>
                    </div>
                    <Transition name="slide-down">
                        <div
                            v-if="entregaAberta === entrega.id_entrega"
                            class="border-t border-white/5 bg-black/20 p-4 space-y-4"
                        >
                            <div
                                v-if="entrega.resposta_aluno"
                                class="bg-[#0f0f15] border border-white/5 rounded p-4"
                            >
                                <p
                                    class="text-[10px] font-black uppercase tracking-wider text-secondary mb-2"
                                >
                                    Resposta do aluno
                                </p>
                                <p
                                    class="text-sm text-white/80 whitespace-pre-wrap leading-relaxed"
                                >
                                    {{ entrega.resposta_aluno }}
                                </p>
                            </div>
                            <button
                                v-if="entrega.arquivo_entrega"
                                type="button"
                                @click="
                                    openEntregaArquivo(entrega.arquivo_entrega)
                                "
                                class="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-colors w-full sm:w-auto"
                            >
                                <svg
                                    class="w-4 h-4 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                </svg>
                                Ver arquivo enviado
                            </button>
                            <div
                                v-if="
                                    !entrega.resposta_aluno &&
                                    !entrega.arquivo_entrega
                                "
                                class="text-sm text-secondary/50 italic"
                            >
                                Nenhum conteúdo enviado pelo aluno ainda.
                            </div>
                            <div>
                                <label
                                    class="block text-[10px] font-black uppercase tracking-wider text-secondary mb-2"
                                    >Feedback para o aluno</label
                                >
                                <textarea
                                    v-model="feedbackMap[entrega.id_entrega]"
                                    rows="3"
                                    placeholder="Escreva aqui o feedback para o aluno (opcional)..."
                                    :disabled="
                                        entrega.status_avaliacao === 'Aprovado'
                                    "
                                    class="w-full bg-[#16161E] border border-white/5 rounded p-3 text-sm text-white focus:border-primary focus:outline-none resize-y transition-colors hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                ></textarea>
                            </div>
                            <div
                                v-if="entrega.status_avaliacao !== 'Aprovado'"
                                class="flex items-center gap-3 pt-1"
                            >
                                <button
                                    type="button"
                                    :disabled="
                                        savingEntregaMap[entrega.id_entrega] ===
                                            'saving' ||
                                        (entrega.status_avaliacao !==
                                            'Entregue' &&
                                            entrega.status_avaliacao !==
                                                'Reprovado')
                                    "
                                    @click="avaliarEntrega(entrega, 'Aprovado')"
                                    class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <svg
                                        v-if="
                                            savingEntregaMap[
                                                entrega.id_entrega
                                            ] === 'saving'
                                        "
                                        class="w-3.5 h-3.5 animate-spin"
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
                                    <svg
                                        v-else
                                        class="w-3.5 h-3.5"
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
                                    Aprovar
                                </button>
                                <button
                                    type="button"
                                    :disabled="
                                        savingEntregaMap[entrega.id_entrega] ===
                                            'saving' ||
                                        entrega.status_avaliacao !== 'Entregue'
                                    "
                                    @click="
                                        avaliarEntrega(entrega, 'Reprovado')
                                    "
                                    class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <svg
                                        class="w-3.5 h-3.5"
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
                                    Reprovar
                                </button>
                                <div
                                    v-if="
                                        savingEntregaMap[entrega.id_entrega] ===
                                        'saved'
                                    "
                                    class="text-[11px] text-emerald-400 flex items-center gap-1"
                                >
                                    <svg
                                        class="w-4 h-4"
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
                                    Salvo
                                </div>
                                <div
                                    v-if="
                                        savingEntregaMap[entrega.id_entrega] ===
                                        'error'
                                    "
                                    class="text-[11px] text-red-400 flex items-center gap-1"
                                >
                                    <svg
                                        class="w-4 h-4"
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
                                </div>
                            </div>
                            <div v-else class="flex items-center gap-2 pt-1">
                                <span
                                    class="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider"
                                    >Aprovada ✓</span
                                >
                                <span
                                    v-if="entrega.avaliado_em"
                                    class="text-[10px] text-secondary/50"
                                    >em
                                    {{
                                        new Date(
                                            entrega.avaliado_em,
                                        ).toLocaleString("pt-BR")
                                    }}</span
                                >
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </template>

        <!-- Modais -->
        <ModalAtividadeRecuperacao
            :is-open="showAtividadeModal"
            :atividade="editAtividade"
            @close="closeAtividadeModal"
            @saved="handleAtividadeSaved"
        />
        <ModalAssociarAtividade
            :is-open="showAssociarAtividadeModal"
            :aluno="alunoAssociarAtividade"
            :avaliacao="associarAvaliacao"
            :initial-ano-semestre="anoSemestreModel"
            :initial-turma-id="turmaAtiva"
            @close="closeAssociarAtividadeModal"
            @associated="handleAtividadeAssociada"
        />
        <ModalAssociarAtividade
            :is-open="showVerAtividadeModal"
            :aluno="alunoVerAtividade"
            :avaliacao="associarAvaliacao"
            :readonly="true"
            :atividade-id="
                alunoVerAtividade?.atividade_associada?.id_atividade ?? null
            "
            @close="closeVerAtividadeModal"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

import { useToast } from "../../../composables/useToast";
import { useAvaliacaoGestaoTurmas } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoTurmas";
import { useAvaliacaoGestaoAtividadesTab } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoAtividadesTab";
import { decorateStudentNames } from "../../../utils/student_name";
import { buildProtectedFileUrl } from "~/utils/protected-file-url";
import BaseSelect from "~/components/BaseSelect.vue";
import ModalAtividadeRecuperacao from "~/components/avaliacao-gestao/ModalAtividadeRecuperacao.vue";
import ModalAssociarAtividade from "~/components/avaliacao-gestao/ModalAssociarAtividade.vue";

const props = defineProps<{
    anoSemestre: string;
    etapaOptions: string[];
    semestreOptions: { id: string; nome: string }[];
}>();

const emit = defineEmits<{
    "update:anoSemestre": [value: string];
}>();

const { showToast } = useToast();
const {
    fetchAvaliacaoPorTurma: _fetchAvTurmaApi,
    avaliacaoTurma: _avaliacaoTurma,
} = useAvaliacaoGestaoTurmas();
const {
    turmas,
    turmaAtiva,
    loadingTurmas,
    fetchTurmas,
    avaliacaoTurma,
    loadingAvTurma,
    fetchAvaliacaoPorTurma,
    atividades,
    loadingAtividades,
    fetchAtividades,
    associarAlunos,
    associarAvaliacao,
    loadingAssociarAlunos,
    fetchAlunosAssociarAtividades,
    deleteAssociacaoAtividade,
    entregas: entregasAtividades,
    loadingEntregas,
    fetchEntregas: fetchEntregasAtividades,
    avaliarEntrega: avaliarEntregaApi,
    hashEntregas,
    refreshHashAtividades,
} = useAvaliacaoGestaoAtividadesTab();

const anoSemestreModel = computed({
    get: () => props.anoSemestre,
    set: (val: string) => emit("update:anoSemestre", val),
});

// ── Sub-abas ─────────────────────────────────────────────────
const subAbaAtividades = ref<
    "criar_atividade" | "associar_atividade" | "avaliar_atividade"
>("criar_atividade");

// ── Turmas / Etapa ──────────────────────────────────────────
const etapaAtiva = ref<string>("O que nos Une");

const turmaFilterOptions = computed(() => {
    const badge = (turma: any): string => {
        const nome = turma?.nome_curso || "Turma";
        const codigo = turma?.cod_turma ? ` (${turma.cod_turma})` : "";
        return `${nome}${codigo}`;
    };
    return turmas.value.map((t: any) => ({ ...t, nome: badge(t) }));
});

const _fetchAvaliacaoPorTurma = () =>
    _fetchAvTurmaApi(turmaAtiva.value, etapaAtiva.value);

// ── Atividades (CRUD) ───────────────────────────────────────
const showAtividadeModal = ref(false);
const editAtividade = ref<any | null>(null);

const openCriarAtividade = () => {
    editAtividade.value = null;
    showAtividadeModal.value = true;
};
const openEditarAtividade = (atividade: any) => {
    editAtividade.value = atividade;
    showAtividadeModal.value = true;
};
const closeAtividadeModal = () => {
    showAtividadeModal.value = false;
    editAtividade.value = null;
};

const handleAtividadeSaved = async () => {
    closeAtividadeModal();
    await _fetchAtividades();
};

const openAtividadeArquivo = async (atividade: any) => {
    const filePath = String(atividade?.arquivo_apoio || "").trim();
    if (!filePath) {
        showToast("Nenhum arquivo anexado.", { type: "info" });
        return;
    }
    if (!hashEntregas.value) await _refreshHashEntregas();
    if (!hashEntregas.value) {
        showToast("Falha ao gerar token de acesso.", { type: "error" });
        return;
    }
    try {
        const finalUrl = buildProtectedFileUrl(
            hashEntregas.value,
            filePath,
            "avaliacao",
        );
        if (!finalUrl)
            throw new Error(
                "Não foi possível compor a URL protegida do arquivo.",
            );
        window.open(finalUrl, "_blank");
    } catch (error) {
        console.error(error);
        showToast("Erro ao abrir arquivo.", { type: "error" });
    }
};

const _fetchAtividades = () => fetchAtividades();

// ── Associar Atividades ─────────────────────────────────────
const buscaAlunoAssociar = ref("");
const showAssociarAtividadeModal = ref(false);
const alunoAssociarAtividade = ref<any | null>(null);
const showVerAtividadeModal = ref(false);
const alunoVerAtividade = ref<any | null>(null);
const eliminandoAssociacao = ref<Record<string, boolean>>({});

const associarAlunosFiltrados = computed(() => {
    if (!buscaAlunoAssociar.value.trim()) return associarAlunos.value;
    const q = buscaAlunoAssociar.value.toLowerCase();
    return associarAlunos.value.filter(
        (a: any) =>
            `${a.nome ?? ""} ${a.sobrenome ?? ""} ${a.nome_aluno ?? ""} ${a.nome_social ?? ""}`
                .toLowerCase()
                .includes(q) ||
            String(a.ra ?? "")
                .toLowerCase()
                .includes(q),
    );
});

const _fetchAlunosAssociarAtividades = () =>
    fetchAlunosAssociarAtividades(
        turmaAtiva.value,
        etapaAtiva.value,
        props.anoSemestre,
    );

const handleAssociarAtividade = (aluno: any) => {
    alunoAssociarAtividade.value = aluno;
    showAssociarAtividadeModal.value = true;
};
const closeAssociarAtividadeModal = () => {
    showAssociarAtividadeModal.value = false;
    alunoAssociarAtividade.value = null;
};
const handleVerAtividadeAssociada = (aluno: any) => {
    alunoVerAtividade.value = aluno;
    showVerAtividadeModal.value = true;
};
const closeVerAtividadeModal = () => {
    showVerAtividadeModal.value = false;
    alunoVerAtividade.value = null;
};
const handleAtividadeAssociada = async () => {
    await _fetchAlunosAssociarAtividades();
};

const handleEliminarAssociacao = async (aluno: any) => {
    const idEntrega = aluno.atividade_associada?.id_entrega;
    if (!idEntrega) return;
    const alunoId = String(aluno.aluno_id || aluno.id_aluno || aluno.id || "");
    eliminandoAssociacao.value[alunoId] = true;
    try {
        await deleteAssociacaoAtividade(idEntrega);
        showToast("Associação removida com sucesso.", { type: "success" });
        await _fetchAlunosAssociarAtividades();
    } catch (e: any) {
        showToast(e.message || "Erro ao remover associação.", {
            type: "error",
        });
    } finally {
        eliminandoAssociacao.value[alunoId] = false;
    }
};

// ── Avaliar Entregas ────────────────────────────────────────
const filtroStatusEntrega = ref("");
const filtroDataInicio = ref("");
const filtroDataFim = ref("");
const entregaAberta = ref<string | null>(null);
const feedbackMap = ref<Record<string, string>>({});
const savingEntregaMap = ref<Record<string, "saving" | "saved" | "error">>({});

const statusEntregaOptions = [
    { id: "", nome: "Todos os status" },
    { id: "Pendente", nome: "Pendente" },
    { id: "Entregue", nome: "Entregue" },
    { id: "Aprovado", nome: "Aprovado" },
    { id: "Reprovado", nome: "Reprovado" },
];
const statusEntregaClass: Record<string, string> = {
    Pendente: "text-amber-400 border-amber-400/20 bg-amber-400/10",
    Entregue: "text-blue-400 border-blue-400/20 bg-blue-400/10",
    Aprovado: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
    Reprovado: "text-red-400 border-red-400/20 bg-red-400/10",
};

const _fetchEntregasAtividades = () => {
    const id = avaliacaoTurma.value?.id_avaliacao || null;
    fetchEntregasAtividades(
        id,
        filtroStatusEntrega.value || null,
        filtroDataInicio.value || null,
        filtroDataFim.value || null,
    );
};

const _refreshHashEntregas = async () => {
    await refreshHashAtividades();
};

const openEntregaArquivo = async (filePath: string) => {
    if (!filePath) return;
    if (!hashEntregas.value) await _refreshHashEntregas();
    const url = buildProtectedFileUrl(
        hashEntregas.value,
        filePath,
        "avaliacao",
    );
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else showToast("Não foi possível abrir o arquivo.", { type: "error" });
};

const avaliarEntrega = async (
    entrega: any,
    status: "Aprovado" | "Reprovado",
) => {
    const key = entrega.id_entrega;
    savingEntregaMap.value[key] = "saving";
    try {
        await avaliarEntregaApi(key, status, feedbackMap.value[key] || null);
        entrega.status_avaliacao = status;
        entrega.feedback_professor =
            feedbackMap.value[key] || entrega.feedback_professor;
        savingEntregaMap.value[key] = "saved";
        showToast(
            `Entrega ${status === "Aprovado" ? "aprovada" : "reprovada"} com sucesso.`,
            { type: "success" },
        );
        setTimeout(() => delete savingEntregaMap.value[key], 2000);
    } catch (e: any) {
        savingEntregaMap.value[key] = "error";
        showToast(e.message || "Erro ao avaliar entrega.", { type: "error" });
        setTimeout(() => delete savingEntregaMap.value[key], 3000);
    }
};

// ── Watchers ──────────────────────────────────────────────────
watch(subAbaAtividades, async (subAba) => {
    if (subAba === "associar_atividade") {
        if (!turmas.value.length) await fetchTurmas(props.anoSemestre);
        await _fetchAlunosAssociarAtividades();
    }
    if (subAba === "avaliar_atividade") {
        if (!turmas.value.length) await fetchTurmas(props.anoSemestre);
        if (!avaliacaoTurma.value && turmaAtiva.value)
            await _fetchAvaliacaoPorTurma();
        await _fetchEntregasAtividades();
    }
});

watch(turmaAtiva, async () => {
    if (subAbaAtividades.value === "associar_atividade")
        await _fetchAlunosAssociarAtividades();
    if (subAbaAtividades.value === "avaliar_atividade") {
        if (!avaliacaoTurma.value) await _fetchAvaliacaoPorTurma();
        await _fetchEntregasAtividades();
    }
});

watch(etapaAtiva, () => {
    if (subAbaAtividades.value === "associar_atividade")
        _fetchAlunosAssociarAtividades();
    if (subAbaAtividades.value === "avaliar_atividade")
        _fetchEntregasAtividades();
});

watch(anoSemestreModel, async () => {
    await fetchTurmas(props.anoSemestre);
    if (subAbaAtividades.value === "associar_atividade")
        await _fetchAlunosAssociarAtividades();
});

watch([filtroStatusEntrega, filtroDataInicio, filtroDataFim], () => {
    if (subAbaAtividades.value === "avaliar_atividade")
        _fetchEntregasAtividades();
});

// ── Init ──────────────────────────────────────────────────────
_fetchAtividades();
</script>
