<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER: Period Select (inline) -->
            <div
                class="flex flex-col md:flex-row items-center justify-end gap-6 mb-8"
            >
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <div class="relative w-full md:w-40">
                        <select
                            v-model="anoSemestre"
                            @change="_fetchOportunidades"
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
                </div>
            </div>

            <!-- CONTENT -->
            <div class="space-y-6">
                <div v-if="isLoading" class="flex justify-center py-20">
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                    ></div>
                </div>

                <div
                    v-else-if="oportunidades.length > 0"
                    class="flex flex-col gap-4"
                >
                    <OportunidadesAbertasCard
                        v-for="item in oportunidades"
                        :key="item.id"
                        :oportunidade="item"
                        :download-file="downloadFile"
                        :format-date="formatDate"
                    />
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
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <p class="text-white font-bold">
                        Nenhuma oportunidade disponível.
                    </p>
                    <p class="text-xs text-secondary mt-1">
                        Fique atento para novas publicações.
                    </p>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { formatDate } from "~/utils/date";
import { getAnoSemestre } from "../../../utils/ano_semestre";
import { useOportunidadesAbertas } from "~/composables/oportunidades-abertas/useOportunidadesAbertas";
import OportunidadesAbertasCard from "~/components/oportunidades-abertas/OportunidadesAbertasCard.vue";

definePageMeta({});

const { oportunidades, isLoading, fetchOportunidades, downloadFile } =
    useOportunidadesAbertas();

const anoSemestre = ref(getAnoSemestre());
const _fetchOportunidades = () => fetchOportunidades(anoSemestre.value);

// Period options
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

onMounted(() => {
    _fetchOportunidades();
});
</script>
