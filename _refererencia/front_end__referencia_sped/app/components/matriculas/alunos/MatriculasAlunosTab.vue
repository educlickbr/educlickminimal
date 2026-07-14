<script setup lang="ts">
import { buildProtectedFileUrl } from "~/utils/protected-file-url";

const props = defineProps<{
    alunos: any[];
    isLoading: boolean;
    pagination: {
        pagina_atual: number;
        qtd_paginas: number;
        qtd_total: number;
    };
    limit: number;
    hashBase: string;
}>();

const emit = defineEmits<{
    openDataModal: [aluno: any, mode?: "dados" | "documentos"];
    openDiarioModal: [aluno: any];
    openStatusModal: [aluno: any];
    rematricula: [aluno: any];
    openEmailModal: [aluno: any];
    openTrocaTurnoModal: [aluno: any];
    openUnificarContaModal: [aluno: any];
    previousPage: [];
    nextPage: [];
}>();
</script>

<template>
    <div class="space-y-4">
        <!-- Loading State -->
        <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center py-20"
        >
            <svg
                class="animate-spin h-8 w-8 text-primary mb-4"
                xmlns="http://www.w3.org/2000/svg"
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
                ></circle>
                <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
            <p class="text-sm text-secondary">Carregando alunos...</p>
        </div>

        <!-- Empty State -->
        <div
            v-else-if="alunos.length === 0"
            class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
        >
            <div class="text-4xl mb-4 text-secondary/50">
                <svg
                    class="w-16 h-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                </svg>
            </div>
            <p class="text-white font-medium">Nenhum aluno encontrado</p>
            <p class="text-xs text-secondary mt-1">
                Verifique os filtros ou selecione outra turma.
            </p>
        </div>

        <!-- Student List (Card Layout) -->
        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 min-[1800px]:grid-cols-3 gap-4"
        >
            <div
                v-for="aluno in alunos"
                :key="aluno.id"
                class="bg-[#16161E] border border-white/5 rounded-xl flex md:overflow-visible overflow-hidden hover:border-primary/30 transition-colors group relative min-h-[160px]"
            >
                <!-- Left: Photo + Status Column -->
                <div
                    class="w-24 md:w-32 relative flex-shrink-0 bg-white/5 border-r border-white/5 group/photo hover:z-50 flex flex-col"
                >
                    <div
                        class="relative flex-1 w-full rounded-tl-xl md:rounded-tl-lg"
                    >
                        <img
                            v-if="aluno.foto_resposta && hashBase"
                            :src="
                                buildProtectedFileUrl(
                                    hashBase,
                                    aluno.foto_resposta,
                                    'secretaria',
                                )
                            "
                            class="absolute inset-0 w-full h-full object-cover transition-all duration-300 z-10 rounded-tl-xl md:rounded-tl-lg group-hover/photo:scale-[1.8] group-hover/photo:translate-x-16 group-hover/photo:translate-y-16 group-hover/photo:shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover/photo:rounded-lg"
                            alt="Foto"
                            @error="
                                (e: any) => (e.target.style.display = 'none')
                            "
                        />
                        <div
                            v-else
                            class="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-secondary bg-black/20 rounded-tl-xl md:rounded-tl-lg"
                        >
                            <span class="text-2xl mb-1"
                                >{{ aluno.nome?.charAt(0)
                                }}{{ aluno.sobrenome?.charAt(0) }}</span
                            >
                            <span class="text-[9px] opacity-50">Sem Foto</span>
                        </div>
                    </div>

                    <!-- Status Badge (Bottom Bar) -->
                    <div
                        class="w-full py-1 flex items-center justify-center gap-1.5 border-t"
                        :class="{
                            'bg-green-500/10 border-green-500/20 text-green-500':
                                ['Ativo', 'Ativa'].includes(aluno.status),
                            'bg-zinc-500/10 border-zinc-500/20 text-zinc-500':
                                !['Ativo', 'Ativa'].includes(aluno.status),
                        }"
                    >
                        <span
                            class="w-1.5 h-1.5 rounded-full"
                            :class="{
                                'bg-green-500': ['Ativo', 'Ativa'].includes(
                                    aluno.status,
                                ),
                                'bg-zinc-500': !['Ativo', 'Ativa'].includes(
                                    aluno.status,
                                ),
                            }"
                        ></span>
                        <span
                            class="text-[8px] font-black uppercase tracking-wider"
                            >{{ aluno.status }}</span
                        >
                    </div>
                </div>

                <!-- Right: Info + Actions -->
                <div
                    class="flex-1 p-3 flex flex-col justify-between min-w-0 z-10 gap-3 relative"
                >
                    <!-- Semester Count (Absolute Top Right) -->
                    <div
                        class="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10"
                    >
                        <span class="text-[10px] font-bold text-white"
                            >{{ aluno.qtd_semestres_cursados || 1 }}º</span
                        >
                        <span
                            class="text-[9px] font-bold text-secondary uppercase tracking-wider"
                            >Sem.</span
                        >
                    </div>

                    <div
                        v-if="aluno.tem_bolsa_ativa"
                        class="absolute top-12 right-3 z-20 pointer-events-none"
                    >
                        <span
                            class="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500/15 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/30"
                            >Bolsista</span
                        >
                    </div>

                    <!-- Top Info Block -->
                    <div class="space-y-1">
                        <!-- Name & Email -->
                        <div class="pr-20">
                            <h5
                                class="text-sm font-bold text-white truncate leading-tight"
                                :title="aluno.name_display?.primaryName"
                            >
                                {{ aluno.name_display?.primaryName }}
                            </h5>
                            <div class="flex items-center gap-2 mt-0.5">
                                <p class="text-[10px] text-secondary truncate">
                                    {{ aluno.email }}
                                </p>
                                <button
                                    @click="
                                        emit('openUnificarContaModal', aluno)
                                    "
                                    class="text-primary hover:text-white transition-colors"
                                    title="Unificar Conta de Aluno"
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
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                        ></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="flex items-center gap-1.5 min-w-0">
                            <span
                                class="text-[9px] text-secondary uppercase tracking-wider font-bold"
                                >{{ aluno.name_display?.secondaryLabel }}</span
                            >
                            <span
                                class="text-[10px] text-white/80 font-medium truncate"
                                >{{ aluno.name_display?.secondaryValue }}</span
                            >
                        </div>

                        <!-- Curso & Turno + RA -->
                        <div class="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5">
                            <div class="col-span-2">
                                <p
                                    class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                                >
                                    Curso
                                </p>
                                <p
                                    class="text-[10px] text-white font-medium truncate"
                                    :title="
                                        aluno.nome_curso_turno ||
                                        aluno.nome_curso
                                    "
                                >
                                    {{ aluno.nome_curso }}
                                </p>
                            </div>
                            <div class="flex items-end justify-between pr-2">
                                <div>
                                    <p
                                        class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                                    >
                                        Turno
                                    </p>
                                    <p
                                        class="text-[10px] text-white font-medium"
                                    >
                                        {{ aluno.turno }}
                                    </p>
                                </div>
                                <button
                                    @click="emit('openTrocaTurnoModal', aluno)"
                                    class="text-secondary hover:text-primary transition-colors p-0.5 rounded hover:bg-white/5"
                                    title="Trocar Turno"
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
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                        ></path>
                                    </svg>
                                </button>
                            </div>
                            <div>
                                <p
                                    class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                                >
                                    RA
                                </p>
                                <p
                                    class="text-[10px] text-white font-medium font-mono"
                                >
                                    {{ aluno.ra || aluno.ra_legado || "---" }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom: Action Bar -->
                    <div
                        class="flex items-center justify-start mt-1 pt-2 border-t border-white/5"
                    >
                        <div class="flex items-center gap-1">
                            <button
                                @click="emit('openDataModal', aluno, 'dados')"
                                class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-secondary hover:text-white transition-colors"
                                title="Ver Dados"
                            >
                                Dados
                            </button>
                            <button
                                @click="
                                    emit('openDataModal', aluno, 'documentos')
                                "
                                class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-secondary hover:text-white transition-colors"
                                title="Ver Documentos"
                            >
                                Doc.
                            </button>
                            <button
                                @click="emit('openDiarioModal', aluno)"
                                class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-secondary hover:text-white transition-colors"
                                title="Ver Diário"
                            >
                                Diário
                            </button>
                            <button
                                @click="emit('openStatusModal', aluno)"
                                class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-secondary hover:text-white transition-colors"
                                title="Ver Status"
                            >
                                Status
                            </button>
                            <button
                                v-if="
                                    aluno.area_curso &&
                                    ['regulares', 'cursos_livres'].includes(
                                        aluno.area_curso.toLowerCase(),
                                    )
                                "
                                @click="emit('rematricula', aluno)"
                                class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-secondary hover:text-white transition-colors"
                                title="Rematrícula"
                            >
                                Rematrícula
                            </button>
                            <div class="w-px h-4 bg-white/10 mx-0.5"></div>
                            <button
                                @click="emit('openEmailModal', aluno)"
                                class="p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                title="Enviar Email"
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
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    ></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- PAGINATION -->
        <div
            v-if="alunos.length > 0"
            class="flex flex-col md:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-white/5"
        >
            <span
                class="text-xs md:text-sm text-secondary-500 order-2 md:order-1"
            >
                <span class="font-medium text-white">{{
                    (pagination.pagina_atual - 1) * limit + 1
                }}</span>
                a
                <span class="font-medium text-white">{{
                    Math.min(
                        pagination.pagina_atual * limit,
                        pagination.qtd_total,
                    )
                }}</span>
                de
                <span class="font-medium text-white">{{
                    pagination.qtd_total
                }}</span>
            </span>
            <div class="flex gap-2 order-1 md:order-2">
                <button
                    @click="emit('previousPage')"
                    :disabled="pagination.pagina_atual === 1"
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Anterior
                </button>
                <button
                    @click="emit('nextPage')"
                    :disabled="
                        pagination.pagina_atual >= pagination.qtd_paginas
                    "
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Próxima
                </button>
            </div>
        </div>
    </div>
</template>
