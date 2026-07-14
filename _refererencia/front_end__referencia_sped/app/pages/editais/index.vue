<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER & CONTROLS -->
            <div
                class="flex flex-col md:flex-row items-center justify-end gap-6 mb-8"
            >
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <!-- Period Select -->
                    <div class="relative w-full md:w-40">
                        <select
                            v-model="anoSemestre"
                            @change="fetchEditais(anoSemestre)"
                            class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"
                        >
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

                    <!-- New Button -->
                    <button
                        @click="handleNewEdital"
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

            <!-- CONTENT: EDITAIS -->
            <div class="space-y-6">
                <!-- Loading -->
                <div v-if="isLoading" class="flex justify-center py-20">
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                    ></div>
                </div>

                <!-- List -->
                <div v-else-if="editais.length > 0" class="flex flex-col gap-4">
                    <EditalCard
                        v-for="edital in editais"
                        :key="edital.id"
                        :edital="edital"
                        :download-file="downloadFile"
                        @edit="handleEditEdital"
                        @add-etapa="handleAddEtapa"
                        @edit-etapa="
                            (etapa, editalId) =>
                                handleEditEtapa(etapa, editalId)
                        "
                    />
                </div>

                <!-- Empty State -->
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
        </div>

        <!-- MODALS -->
        <ModalEdital
            :is-open="isEditalModalOpen"
            :edital="editingEdital"
            @close="isEditalModalOpen = false"
            @saved="handleEditalSaved"
        />

        <ModalEtapa
            :is-open="isEtapaModalOpen"
            :etapa="editingEtapa"
            :edital-id="selectedEditalIdForEtapa || ''"
            @close="isEtapaModalOpen = false"
            @saved="handleEtapaSaved"
        />
    </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAnoSemestre } from "../../../utils/ano_semestre";
import { useEditais } from "~/composables/editais/useEditais";
import EditalCard from "~/components/editais/EditalCard.vue";
import ModalEdital from "~/components/editais/ModalEdital.vue";
import ModalEtapa from "~/components/editais/ModalEtapa.vue";

definePageMeta({
    // permissions.global handles route protection
});

// Composables
const { editais, isLoading, fetchEditais, downloadFile } = useEditais();

// State
const anoSemestre = ref(getAnoSemestre());

// Modals
const isEditalModalOpen = ref(false);
const editingEdital = ref(null);
const isEtapaModalOpen = ref(false);
const editingEtapa = ref(null);
const selectedEditalIdForEtapa = ref<string | null>(null);

// Handlers
const handleNewEdital = () => {
    editingEdital.value = null;
    isEditalModalOpen.value = true;
};

const handleEditEdital = (edital: any) => {
    editingEdital.value = edital;
    isEditalModalOpen.value = true;
};

const handleEditalSaved = () => {
    fetchEditais(anoSemestre.value);
};

const handleAddEtapa = (edital: any) => {
    selectedEditalIdForEtapa.value = String(
        edital?.id ?? edital?.id_edital ?? "",
    );
    editingEtapa.value = null;
    isEtapaModalOpen.value = true;
};

const handleEditEtapa = (etapa: any, editalId: string) => {
    selectedEditalIdForEtapa.value = editalId;
    editingEtapa.value = etapa;
    isEtapaModalOpen.value = true;
};

const handleEtapaSaved = () => {
    fetchEditais(anoSemestre.value);
};

// Init
onMounted(() => {
    fetchEditais(anoSemestre.value);
});
</script>
