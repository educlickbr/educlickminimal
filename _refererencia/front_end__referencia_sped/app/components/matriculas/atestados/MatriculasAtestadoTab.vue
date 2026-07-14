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
            <p class="text-sm text-secondary">Carregando solicitações...</p>
        </div>

        <!-- Empty State -->
        <div
            v-else-if="justificativas.length === 0"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                </svg>
            </div>
            <p class="text-white font-medium">Nenhuma solicitação encontrada</p>
            <p class="text-xs text-secondary mt-1">Verifique os filtros.</p>
        </div>

        <!-- LISTA DE JUSTIFICATIVAS -->
        <div v-else class="space-y-3">
            <div
                v-for="item in justificativas"
                :key="item.id"
                class="bg-[#16161E] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-6 relative"
            >
                <!-- Student info (left) -->
                <div
                    class="flex items-start gap-3 w-full md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4"
                >
                    <div
                        class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0"
                    >
                        <span class="font-bold text-white">{{
                            getNomeSolicitacao(item).charAt(0)
                        }}</span>
                    </div>
                    <div class="min-w-0">
                        <p
                            class="text-sm font-bold text-white truncate"
                            :title="getNomeSolicitacao(item)"
                        >
                            {{ getNomeSolicitacao(item) }}
                        </p>
                        <p v-if="item.tem_bolsa_ativa" class="mt-1">
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500/15 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/30"
                            >
                                Bolsista
                            </span>
                        </p>
                        <p
                            v-if="item.nome_exibicao"
                            class="text-[10px] uppercase tracking-wider text-primary/90"
                        >
                            Nome
                            {{
                                getTipoNomeExibicaoLabel(
                                    item.nome_exibicao_tipo,
                                )
                            }}
                            da solicitação
                        </p>
                        <p class="text-xs text-secondary truncate">
                            {{ item.ra }}
                        </p>
                        <p class="text-[10px] text-white/50 mt-1 truncate">
                            {{ item.cod_turma }}
                        </p>
                    </div>
                </div>

                <!-- Justificativa Info (middle) -->
                <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex items-center gap-2">
                        <span
                            class="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border"
                            :class="getScopeBadge(item.escopo)"
                            >{{ item.escopo }}</span
                        >
                        <span class="text-xs text-secondary"
                            >Solicitado em
                            {{ formatDate(item.criado_em) }}</span
                        >
                    </div>
                    <!-- Date Vigência -->
                    <div class="flex items-center gap-2">
                        <div class="grid grid-cols-2 gap-4 text-xs flex-1">
                            <div>
                                <span class="text-secondary block">Início</span>
                                <span class="text-white font-mono">{{
                                    formatDate(item.data_inicio_janela)
                                }}</span>
                            </div>
                            <div>
                                <span class="text-secondary block">Fim</span>
                                <span class="text-white font-mono">{{
                                    formatDate(item.data_fim_janela)
                                }}</span>
                            </div>
                        </div>
                        <button
                            @click="emit('openDateEditor', item)"
                            class="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary transition-colors"
                            title="Editar datas de vigência"
                        >
                            <svg
                                class="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                            </svg>
                        </button>
                    </div>

                    <!-- Date Editor (inline) -->
                    <div
                        v-if="editingDateId === item.id"
                        class="bg-black/20 p-3 rounded-lg space-y-2"
                    >
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <span
                                    class="text-[10px] text-secondary block mb-1"
                                    >Início</span
                                >
                                <input
                                    v-model="dateDrafts[item.id]!.inicio"
                                    type="date"
                                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <span
                                    class="text-[10px] text-secondary block mb-1"
                                    >Fim</span
                                >
                                <input
                                    v-model="dateDrafts[item.id]!.fim"
                                    type="date"
                                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>
                        <div class="flex items-center gap-2 pt-1">
                            <button
                                @click="emit('saveDates', item)"
                                :disabled="savingDateId === item.id"
                                class="px-3 py-1.5 bg-primary/15 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-primary rounded transition-colors border border-primary/20"
                            >
                                {{
                                    savingDateId === item.id
                                        ? "Salvando..."
                                        : "Salvar"
                                }}
                            </button>
                            <button
                                @click="emit('cancelDateEdit', item.id)"
                                :disabled="savingDateId === item.id"
                                class="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white rounded transition-colors border border-white/10"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                    <div
                        class="bg-black/20 p-3 rounded-lg text-sm text-white/90 italic border border-white/5"
                    >
                        "{{ item.texto }}"
                    </div>
                    <div
                        v-if="
                            item.status === 'Reprovado' &&
                            (item.avaliacao_submissao ||
                                editingAvaliacaoId === item.id)
                        "
                        class="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                        <div class="flex items-center justify-between mb-1">
                            <span
                                class="text-[10px] font-bold uppercase tracking-wider text-red-400"
                                >Motivo da reprovação</span
                            >
                            <button
                                v-if="editingAvaliacaoId !== item.id"
                                @click="
                                    emit('update:editingAvaliacaoId', item.id);
                                    emit(
                                        'update:avaliacaoDraft',
                                        item.avaliacao_submissao || '',
                                    );
                                "
                                :disabled="processingId === item.id"
                                class="text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-30"
                                title="Editar avaliação"
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
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            </button>
                        </div>
                        <template v-if="editingAvaliacaoId === item.id">
                            <textarea
                                :value="avaliacaoDraft"
                                @input="
                                    emit(
                                        'update:avaliacaoDraft',
                                        ($event.target as HTMLTextAreaElement)
                                            .value,
                                    )
                                "
                                rows="3"
                                class="w-full bg-[#0E0E15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors resize-none mb-2"
                            ></textarea>
                            <div class="flex items-center gap-2">
                                <button
                                    @click="emit('saveAvaliacao', item.id)"
                                    :disabled="
                                        processingId === item.id ||
                                        !avaliacaoDraft.trim()
                                    "
                                    class="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Salvar
                                </button>
                                <button
                                    @click="
                                        emit('update:editingAvaliacaoId', null)
                                    "
                                    :disabled="processingId === item.id"
                                    class="px-3 py-1 rounded text-xs text-secondary hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </template>
                        <p v-else class="text-sm text-white/80">
                            {{ item.avaliacao_submissao }}
                        </p>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-1">
                        <button
                            v-if="item.arquivo"
                            @click="emit('openAttachment', item.arquivo)"
                            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition shadow-sm shadow-primary/20"
                            title="Abrir anexo da solicitação"
                        >
                            <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zm0 0v6h6"
                                />
                            </svg>
                            Abrir Anexo
                        </button>
                        <button
                            v-if="item.caminho_ficha"
                            @click="emit('openAttachment', item.caminho_ficha)"
                            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider hover:bg-green-500/30 transition"
                            title="Abrir Ficha de Justificativa (PDF)"
                        >
                            <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                ></path>
                            </svg>
                            Ficha Justificativa
                        </button>
                    </div>
                </div>

                <!-- Actions (Right) -->
                <div
                    class="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0"
                >
                    <!-- Status Badge -->
                    <div
                        class="px-3 py-1 rounded-full text-xs font-bold border mb-0 md:mb-4 flex items-center gap-2"
                        :class="getStatusBadge(item.status)"
                    >
                        {{ item.status }}
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2">
                        <!-- Loader inline quando processando -->
                        <div
                            v-if="processingId === item.id"
                            class="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-secondary text-xs font-bold"
                        >
                            <svg
                                class="animate-spin h-3 w-3"
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
                            Salvando...
                        </div>
                        <template v-else>
                            <button
                                @click="
                                    emit('updateStatus', item.id, 'Em Análise')
                                "
                                :disabled="
                                    processingId === item.id ||
                                    item.status === 'Em Análise'
                                "
                                class="px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Em Análise
                            </button>
                            <button
                                @click="
                                    selectedItemForReprovar = item;
                                    showReprovarModal = true;
                                    emit('openReprovar', item);
                                "
                                :disabled="
                                    processingId === item.id ||
                                    item.status === 'Reprovado'
                                "
                                class="px-3 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Reprovar
                            </button>
                            <button
                                @click="
                                    emit('updateStatus', item.id, 'Aprovado')
                                "
                                :disabled="
                                    processingId === item.id ||
                                    item.status === 'Aprovado'
                                "
                                class="px-3 py-1.5 rounded bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Aprovar
                            </button>
                        </template>
                    </div>

                    <!-- Alterar Escopo -->
                    <button
                        v-if="processingId !== item.id"
                        @click="emit('updateEscopo', item)"
                        :title="`Alterar para ${item.escopo === 'atestado' ? 'justificativa' : 'atestado'}`"
                        class="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg
                            class="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                        </svg>
                        Alterar Escopo
                        <span class="opacity-60"
                            >(→
                            {{
                                item.escopo === "atestado"
                                    ? "Justificativa"
                                    : "Atestado"
                            }})</span
                        >
                    </button>
                </div>
            </div>
        </div>

        <!-- PAGINATION Justificativas -->
        <div
            v-if="justificativas.length > 0"
            class="flex flex-col md:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-white/5"
        >
            <span
                class="text-xs md:text-sm text-secondary-500 order-2 md:order-1"
            >
                <span class="font-medium text-white">{{
                    (paginacaoJustificativas.pagina_atual - 1) * limit + 1
                }}</span>
                a
                <span class="font-medium text-white">{{
                    Math.min(
                        paginacaoJustificativas.pagina_atual * limit,
                        paginacaoJustificativas.qtd_total,
                    )
                }}</span>
                de
                <span class="font-medium text-white">{{
                    paginacaoJustificativas.qtd_total
                }}</span>
            </span>
            <div class="flex gap-2 order-1 md:order-2">
                <button
                    @click="emit('prevPage')"
                    :disabled="paginacaoJustificativas.pagina_atual === 1"
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Anterior
                </button>
                <button
                    @click="emit('nextPage')"
                    :disabled="
                        paginacaoJustificativas.pagina_atual >=
                        paginacaoJustificativas.qtd_paginas
                    "
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Próxima
                </button>
            </div>
        </div>

        <!-- Modal Reprovar Justificativa -->
        <ModalReprovarJustificativa
            :isOpen="showReprovarModal"
            :nomeAluno="
                selectedItemForReprovar
                    ? getNomeSolicitacao(selectedItemForReprovar)
                    : ''
            "
            @close="
                showReprovarModal = false;
                emit('closeReprovarModal');
            "
            @confirm="
                (texto: string) => {
                    showReprovarModal = false;
                    emit(
                        'updateStatus',
                        selectedItemForReprovar.id,
                        'Reprovado',
                        texto,
                    );
                }
            "
        />
    </div>
</template>

<script setup lang="ts">
import { formatDate as formatDateSP } from "~/utils/date";
import ModalReprovarJustificativa from "~/components/matriculas/ModalReprovarJustificativa.vue";

const props = defineProps<{
    justificativas: any[];
    isLoading: boolean;
    paginacaoJustificativas: {
        pagina_atual: number;
        qtd_paginas: number;
        qtd_total: number;
    };
    limit: number;
    editingAvaliacaoId: string | null;
    avaliacaoDraft: string;
    processingId: string | null;
    editingDateId: string | null;
    savingDateId: string | null;
    dateDrafts: Record<string, { inicio: string; fim: string }>;
}>();

const emit = defineEmits<{
    updateStatus: [
        id: string,
        status: "Em Análise" | "Aprovado" | "Reprovado",
        avaliacao_submissao?: string,
    ];
    saveAvaliacao: [id: string];
    updateEscopo: [item: any];
    openAttachment: [path: string];
    prevPage: [];
    nextPage: [];
    "update:editingAvaliacaoId": [value: string | null];
    "update:avaliacaoDraft": [value: string];
    openReprovar: [item: any];
    closeReprovarModal: [];
    confirmReprovar: [texto: string];
    openDateEditor: [item: any];
    cancelDateEdit: [id: string];
    saveDates: [item: any];
}>();

// Reprovar modal state local
const showReprovarModal = ref(false);
const selectedItemForReprovar = ref<any>(null);

const formatDate = (dateString: string) => {
    if (!dateString) return "--";
    return formatDateSP(dateString) || "--";
};

const getStatusBadge = (status: string) => {
    if (status === "Em Análise")
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (status === "Aprovado")
        return "bg-green-500/10 text-green-500 border-green-500/20";
    if (status === "Reprovado")
        return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
};

const getScopeBadge = (scope: string) => {
    if (scope === "atestado")
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-purple-500/20 text-purple-400 border-purple-500/30";
};

const getTipoNomeExibicaoLabel = (tipo?: string | null) => {
    if (tipo === "social") return "social";
    if (tipo === "artistico") return "artistico";
    return "registro";
};

const getNomeSolicitacao = (item: any) => {
    return item?.nome_exibicao || item?.nome_aluno || "Aluno não identificado";
};
</script>
