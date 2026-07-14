<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER -->
            <EditaisAbertosHeader
                :ano-semestre="anoSemestre"
                :options="anoSemestreOptions"
                @update:ano-semestre="handleAnoSemestreChange"
            />

            <!-- CONTENT -->
            <div class="space-y-6">
                <!-- Loading -->
                <div v-if="isLoading" class="flex justify-center py-20">
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                    ></div>
                </div>

                <!-- Editais List -->
                <div v-else-if="editais.length > 0" class="flex flex-col gap-4">
                    <EditaisAbertosCard
                        v-for="edital in editais"
                        :key="edital.id"
                        :edital="edital"
                        :is-expanded="expandedEditalId === edital.id"
                        :format-date="formatDate"
                        :get-etapa-status="getEtapaStatus"
                        :get-sorted-etapas="getSortedEtapas"
                        :toggle-expand="toggleExpand"
                        :download-file="downloadFile"
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
                        Nenhum edital disponível.
                    </p>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { formatDate } from "~/utils/date";
import { getAnoSemestre } from "../../../utils/ano_semestre";

import { useEditaisAbertos } from "~/composables/editais-abertos/useEditaisAbertos";
import EditaisAbertosHeader from "~/components/editais-abertos/EditaisAbertosHeader.vue";
import EditaisAbertosCard from "~/components/editais-abertos/EditaisAbertosCard.vue";

definePageMeta({
    layout: false,
});

// Composable
const {
    isLoading,
    editais,
    expandedEditalId,
    fetchEditais,
    toggleExpand,
    getSortedEtapas,
    getEtapaStatus,
    downloadFile,
} = useEditaisAbertos();

// UI State
const anoSemestre = ref(getAnoSemestre());

// Options for period select
const anoSemestreOptions = [
    {
        value: getAnoSemestre(undefined, -1),
        label: getAnoSemestre(undefined, -1),
    },
    { value: getAnoSemestre(), label: `${getAnoSemestre()} (Atual)` },
    {
        value: getAnoSemestre(undefined, 1),
        label: getAnoSemestre(undefined, 1),
    },
];

// Wrappers
const handleAnoSemestreChange = (value: string) => {
    anoSemestre.value = value;
    fetchEditais(value);
};

// Lifecycle
onMounted(() => {
    fetchEditais(anoSemestre.value);
});
</script>
