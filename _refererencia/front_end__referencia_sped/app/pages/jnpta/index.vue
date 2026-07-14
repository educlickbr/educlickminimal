<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { getAnoSemestre } from "~~/utils/ano_semestre";
import JnptaDashboard from "~/components/JnptaDashboard.vue";
import JnptaDashboardEditais from "~/components/JnptaDashboardEditais.vue";
import ModalCriarEdital from "~/components/jnpta/ModalCriarEdital.vue";
import ModalEditarEdital from "~/components/jnpta/ModalEditarEdital.vue";
import ModalDetalhesCandidatura from "~/components/jnpta/ModalDetalhesCandidatura.vue";
import { useJnptaEditais } from "~/composables/jnpta/useJnptaEditais";
import { useJnptaCandidaturas } from "~/composables/jnpta/useJnptaCandidaturas";

definePageMeta({ layout: false });

const route = useRoute();

// ── Abas ──────────────────────────────────────────────────────
const activeTab = ref<"inscricoes" | "selecionados" | "editais">("editais");
const isSelecaoOnly = computed(
    () => String(route.query.tab || "").toLowerCase() === "inscricoes",
);

// ── Composables ───────────────────────────────────────────────
const editais = useJnptaEditais();
const candidaturas = useJnptaCandidaturas(activeTab);

// ── Dashboard Editais (gerenciado na página) ──────────────────
const dashboardEditais = ref<any>(null);
const isLoadingDashboardEditais = ref(false);
const selectedDashboardEditalId = ref<string | null>(null);

const fetchDashboardEditais = async (idEdital?: string) => {
    if (activeTab.value !== "editais") return;
    isLoadingDashboardEditais.value = true;
    try {
        const response: any = await ofetch("/api/jnpta/dashboard/editais", {
            params: idEdital ? { id_edital: idEdital } : {},
        });
        dashboardEditais.value = response?.dashboard || null;
        selectedDashboardEditalId.value =
            (response?.dashboard?.id_edital as string) || null;
    } catch {
        dashboardEditais.value = null;
    } finally {
        isLoadingDashboardEditais.value = false;
    }
};

// ── Handlers ──────────────────────────────────────────────────
const handleTabChange = (tab: "inscricoes" | "selecionados" | "editais") => {
    if (isSelecaoOnly.value && tab !== "inscricoes") return;
    activeTab.value = tab;
    if (tab === "editais") {
        editais.fetchEditais();
        fetchDashboardEditais();
        candidaturas.isLoading.value = false;
    } else {
        candidaturas.fetchCandidaturas();
    }
};

const resolveTabFromQuery = () => {
    if (isSelecaoOnly.value) return "inscricoes" as const;
    const tab = String(route.query.tab || "").toLowerCase();
    if (tab === "selecionados" || tab === "editais") return tab as any;
    return "editais" as const;
};

// ── Init ──────────────────────────────────────────────────────
onMounted(() => {
    const initialTab = resolveTabFromQuery();
    activeTab.value = initialTab;
    if (initialTab === "editais") {
        editais.fetchEditais();
        fetchDashboardEditais();
        candidaturas.isLoading.value = false;
    } else {
        candidaturas.fetchCandidaturas();
    }
});

watch(
    () => route.query.tab,
    () => {
        const nextTab = resolveTabFromQuery();
        if (nextTab !== activeTab.value) handleTabChange(nextTab);
    },
);
</script>

<template>
    <NuxtLayout name="base">
        <div class="flex flex-col gap-8 pb-10">
            <!-- HEADER / ABAS -->
            <div v-if="!isSelecaoOnly" class="bg-div-15 rounded-xl p-6 md:p-8">
                <div
                    class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-secondary/10 pb-2"
                >
                    <div
                        class="flex items-center gap-6 overflow-x-auto hide-scrollbar"
                    >
                        <button
                            @click="handleTabChange('editais')"
                            class="text-sm font-bold pb-2 md:pb-0 relative transition-colors whitespace-nowrap"
                            :class="
                                activeTab === 'editais'
                                    ? 'text-primary'
                                    : 'text-secondary/50 hover:text-secondary'
                            "
                        >
                            Editais
                            <span
                                v-if="activeTab === 'editais'"
                                class="absolute bottom-[-1px] md:bottom-[-11px] left-0 w-full h-0.5 bg-primary rounded-full"
                            ></span>
                        </button>
                        <button
                            @click="handleTabChange('selecionados')"
                            class="text-sm font-bold pb-2 md:pb-0 relative transition-colors whitespace-nowrap"
                            :class="
                                activeTab === 'selecionados'
                                    ? 'text-primary'
                                    : 'text-secondary/50 hover:text-secondary'
                            "
                        >
                            Seleção
                            <span
                                v-if="activeTab === 'selecionados'"
                                class="absolute bottom-[-1px] md:bottom-[-11px] left-0 w-full h-0.5 bg-primary rounded-full"
                            ></span>
                        </button>
                    </div>
                    <div
                        v-if="activeTab === 'editais'"
                        class="flex items-center gap-4 w-full md:w-auto"
                    >
                        <div class="relative w-full md:w-40">
                            <select
                                v-model="editais.anoSemestre.value"
                                @change="editais.fetchEditais()"
                                class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none"
                            >
                                <option value="todos">Todos</option>
                                <option :value="getAnoSemestre(undefined, -1)">
                                    {{ getAnoSemestre(undefined, -1) }}
                                </option>
                                <option :value="getAnoSemestre()">
                                    {{ getAnoSemestre() }} (Atual)
                                </option>
                                <option :value="getAnoSemestre(undefined, 1)">
                                    {{ getAnoSemestre(undefined, 1) }}
                                </option>
                            </select>
                        </div>
                        <button
                            @click="editais.showCreateEditalModal.value = true"
                            class="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 shrink-0"
                        >
                            <svg
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Novo Edital
                        </button>
                    </div>
                </div>
            </div>

            <!-- LOADING -->
            <div
                v-if="editais.isLoading.value || candidaturas.isLoading.value"
                class="flex justify-center py-20"
            >
                <div
                    class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                ></div>
            </div>

            <!-- TAB EDITAIS -->
            <div
                v-if="
                    !editais.isLoading.value &&
                    !isSelecaoOnly &&
                    activeTab === 'editais'
                "
            >
                <div
                    v-if="editais.editais.value.length > 0"
                    class="flex flex-col gap-4"
                >
                    <div
                        v-for="edital in editais.editais.value"
                        :key="edital.id"
                        class="bg-[#16161E] border border-white/5 rounded-lg transition-all hover:border-primary/20 p-4 md:p-6"
                    >
                        <div
                            class="flex flex-col md:flex-row gap-4 md:items-start justify-between"
                        >
                            <div class="space-y-1 flex-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span
                                        class="text-[10px] font-black text-secondary/50 uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded bg-white/5"
                                        >{{ edital.ano_semestre }}</span
                                    >
                                    <span
                                        v-if="edital.qual_tempo"
                                        class="text-[10px] font-black uppercase tracking-widest border border-primary/20 px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                                        >{{
                                            edital.qual_tempo ===
                                            "primeiro_tempo"
                                                ? "Primeiro Tempo"
                                                : "Segundo Tempo"
                                        }}</span
                                    >
                                    <span
                                        v-if="!edital.publicado"
                                        class="text-[10px] bg-gray-500/20 text-gray-400 px-2 rounded text-xs font-bold uppercase"
                                        >Rascunho</span
                                    >
                                </div>
                                <h3
                                    class="text-base md:text-lg font-bold text-white"
                                >
                                    {{ edital.edital_titulo }}
                                </h3>
                                <p
                                    class="text-xs md:text-sm text-secondary line-clamp-2"
                                >
                                    {{
                                        edital.edital_descricao ||
                                        "Sem descrição"
                                    }}
                                </p>
                                <p class="text-[10px] text-secondary mt-2">
                                    {{
                                        new Date(
                                            edital.dt_inicio,
                                        ).toLocaleString("pt-BR", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        })
                                    }}
                                    até
                                    {{
                                        new Date(edital.dt_fim).toLocaleString(
                                            "pt-BR",
                                            {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            },
                                        )
                                    }}
                                </p>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <button
                                    @click="editais.handleOpenEditModal(edital)"
                                    class="text-secondary hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5"
                                    title="Editar"
                                >
                                    <svg
                                        class="w-4 h-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                </button>
                                <button
                                    @click="editais.handleDeleteEdital(edital)"
                                    :disabled="
                                        editais.isDeletingEdital.value ===
                                        edital.id
                                    "
                                    class="text-secondary hover:text-red-400 transition-colors p-1.5 rounded-md hover:bg-red-500/10 disabled:opacity-40"
                                    title="Excluir"
                                >
                                    <svg
                                        v-if="
                                            editais.isDeletingEdital.value !==
                                            edital.id
                                        "
                                        class="w-4 h-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    <svg
                                        v-else
                                        class="w-4 h-4 animate-spin"
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
                                        />
                                        <path
                                            class="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    v-else
                    class="flex flex-col items-center justify-center py-20 opacity-50 border-2 border-dashed border-white/5 rounded-xl"
                >
                    <div
                        class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-8 h-8 text-secondary"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            ></path>
                        </svg>
                    </div>
                    <p class="text-white font-bold">
                        Nenhum edital encontrado.
                    </p>
                    <p class="text-xs text-secondary mt-1">
                        Crie um novo edital para começar.
                    </p>
                </div>
            </div>

            <!-- TAB CANDIDATURAS -->
            <JnptaCandidaturasLista
                v-if="!candidaturas.isLoading.value && activeTab !== 'editais'"
                :candidaturas="candidaturas.candidaturas.value"
                :candidaturas-filters="{
                    anoSemestre: candidaturas.anoSemestreCandidaturas,
                    qualTempo: candidaturas.filtroQualTempo,
                    incluirRascunhos: candidaturas.incluirRascunhos,
                }"
                :get-nome-exibicao="candidaturas.getNomeExibicaoCandidatura"
                :get-subtitulo="candidaturas.getSubtituloCandidatura"
                :get-tempo-label="candidaturas.getTempoLabel"
                :get-status-label="candidaturas.getStatusLabel"
                @abrir-detalhes="candidaturas.openDetalhesModal($event)"
                @change-filters="candidaturas.handleCandidaturasFiltersChange()"
                @alterar-status="
                    candidaturas.handleCandidaturaStatus(
                        $event.item,
                        $event.status,
                    )
                "
            />
        </div>

        <!-- SIDEBAR -->
        <template #sidebar>
            <JnptaDashboard :stats="candidaturas.dashboardStats.value" />
            <JnptaDashboardEditais
                :dashboard="dashboardEditais"
                :loading="isLoadingDashboardEditais"
                :selected-id="selectedDashboardEditalId"
            />
        </template>
    </NuxtLayout>

    <!-- MODAIS -->
    <ModalCriarEdital
        :is-open="editais.showCreateEditalModal.value"
        :form-data="editais.novoEdital"
        :file="editais.file.value"
        :dragging="editais.dragging.value"
        :uploading="editais.uploading.value"
        :is-creating="editais.isCreatingEdital.value"
        :error-msg="editais.errorMsg.value"
        :get-ano-semestre="getAnoSemestre"
        @close="editais.showCreateEditalModal.value = false"
        @save="editais.handleCreateEdital"
        @update:file="editais.file.value = $event"
        @update:dragging="editais.dragging.value = $event"
        @handle-drop="editais.handleDrop"
        @handle-file-change="editais.handleFileChange"
        @remove-file="editais.removeFile"
    />

    <ModalEditarEdital
        :is-open="editais.showEditEditalModal.value"
        :editando-edital="editais.editandoEdital"
        :edit-file="editais.editFile.value"
        :edit-dragging="editais.editDragging.value"
        :is-updating="editais.isUpdatingEdital.value"
        :is-deleting-edital="editais.isDeletingEdital.value"
        :edit-error-msg="editais.editErrorMsg.value"
        :get-ano-semestre="getAnoSemestre"
        :loading-atividades="editais.loadingAtividades.value"
        :saving-atividade-id="editais.savingAtividadeId.value"
        :deleting-atividade-id="editais.deletingAtividadeId.value"
        :saving-pergunta-id="editais.savingPerguntaId.value"
        :deleting-pergunta-id="editais.deletingPerguntaId.value"
        :saving-opcao-id="editais.savingOpcaoId.value"
        :deleting-opcao-id="editais.deletingOpcaoId.value"
        :criando-atividade="editais.criandoAtividade.value"
        :atividades-edital="editais.atividadesEdital.value"
        :nova-atividade="editais.novaAtividade"
        :show-nova-atividade-form="editais.showNovaAtividadeForm.value"
        :nova-pergunta-por-atividade="editais.novaPerguntaPorAtividade.value"
        :show-nova-pergunta-form-por-atividade="
            editais.showNovaPerguntaFormPorAtividade.value
        "
        :nova-opcao-por-pergunta="editais.novaOpcaoPorPergunta.value"
        :show-nova-opcao-form-por-pergunta="
            editais.showNovaOpcaoFormPorPergunta.value
        "
        @close="editais.showEditEditalModal.value = false"
        @save="editais.handleUpdateEdital"
        @update:edit-file="editais.editFile.value = $event"
        @update:edit-dragging="editais.editDragging.value = $event"
        @handle-edit-drop="editais.handleEditDrop"
        @handle-edit-file-change="editais.handleEditFileChange"
        @remove-edit-file="editais.removeEditFile"
        @toggle-atividade="editais.toggleAtividade"
        @handle-salvar-atividade="editais.handleSalvarAtividade"
        @handle-excluir-atividade="editais.handleExcluirAtividade"
        @handle-criar-atividade="editais.handleCriarAtividade"
        @toggle-perguntas-atividade="editais.togglePerguntasAtividade"
        @handle-salvar-pergunta-atividade="
            editais.handleSalvarPerguntaAtividade
        "
        @handle-excluir-pergunta-atividade="
            editais.handleExcluirPerguntaAtividade
        "
        @handle-criar-pergunta-atividade="editais.handleCriarPerguntaAtividade"
        @handle-criar-opcao-pergunta="editais.handleCriarOpcaoPergunta"
        @handle-salvar-opcao-pergunta="editais.handleSalvarOpcaoPergunta"
        @handle-excluir-opcao-pergunta="editais.handleExcluirOpcaoPergunta"
        @toggle-nova-pergunta-form="editais.toggleNovaPerguntaForm"
        @ensure-nova-opcao="editais.ensureNovaOpcao"
        @ensure-nova-pergunta="editais.ensureNovaPergunta"
    />

    <ModalDetalhesCandidatura
        :is-open="candidaturas.showDetalhesModal.value"
        :loading="candidaturas.loadingDetalhes.value"
        :detalhes-candidatura="candidaturas.detalhesCandidatura.value"
        :detalhe-tab="candidaturas.detalheTab.value"
        :hash-base-documentos="candidaturas.hashBaseDocumentos.value"
        :opening-documento="candidaturas.openingDocumento.value"
        :get-status-label="candidaturas.getStatusLabel"
        :get-tempo-label="candidaturas.getTempoLabel"
        :get-nome-exibicao-candidatura="candidaturas.getNomeExibicaoCandidatura"
        :get-subtitulo-candidatura="candidaturas.getSubtituloCandidatura"
        @close="candidaturas.closeDetalhesModal"
        @update:detalhe-tab="candidaturas.detalheTab.value = $event"
        @open-documento="candidaturas.openDocumento"
    />
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
