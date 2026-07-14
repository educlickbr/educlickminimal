<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER -->
            <div
                class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
            >
                <div>
                    <h1
                        class="text-2xl font-black text-white flex items-center gap-2"
                    >
                        <div class="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                        Meus Dados
                    </h1>
                    <p class="text-sm text-secondary mt-1">
                        Visualize e edite seus dados cadastrais
                    </p>
                </div>
            </div>

            <!-- FILTROS -->
            <MeusDadosFiltros
                :selected-ano-semestre="selectedAnoSemestre"
                :ano-semestre-options="anoSemestreOptions"
                :selected-turma-id="selectedTurmaId"
                :turmas-options="turmasOptions"
                @update:ano-semestre="handleAnoSemestreChange"
                @update:turma="handleTurmaChange"
            />

            <!-- Loading Form -->
            <div
                v-if="loadingForm"
                class="bg-[#16161E] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center mt-6"
            >
                <svg
                    class="animate-spin h-8 w-8 text-rose-500 mb-4"
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
                <p class="text-sm text-secondary">Carregando dados...</p>
            </div>

            <!-- Error -->
            <div
                v-else-if="errorForm"
                class="bg-[#16161E] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-red-400 mt-6"
            >
                <svg
                    class="w-12 h-12 mb-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                </svg>
                <p>{{ errorForm }}</p>
            </div>

            <!-- Empty state (sem turma selecionada) -->
            <div
                v-else-if="!selectedTurmaId"
                class="bg-[#16161E] border border-white/5 rounded-xl p-12 text-center mt-6"
            >
                <div class="text-secondary mb-2">
                    <svg
                        class="w-16 h-16 mx-auto mb-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">
                    Selecione uma turma
                </h3>
                <p class="text-sm text-secondary">
                    Use os filtros acima para visualizar e editar seus dados
                    cadastrais.
                </p>
            </div>

            <!-- FORM -->
            <MeusDadosForm
                v-else
                class="mt-8"
                :form-data="formData"
                :answers="answers"
                :is-saving="isSaving"
                :last-saved="lastSaved"
                :turma-id="selectedTurmaId"
                :hash-base="store.hash_base"
                @save="handleSave"
                @upload="handleUpload"
                @delete-file="handleDeleteFile"
            />
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { useAppStore } from "~/stores/app";
import {
    getAnoSemestre,
    getAnoSemestreList,
} from "../../../utils/ano_semestre";

import MeusDadosFiltros from "~/components/meus-dados/MeusDadosFiltros.vue";
import MeusDadosForm from "~/components/meus-dados/MeusDadosForm.vue";
import { useMeusDados } from "~/composables/meus-dados/useMeusDados";

definePageMeta({
    layout: false,
});

// --- Store ---
const store = useAppStore();

// --- Composables ---
const {
    minhasTurmas,
    loadingForm,
    formData,
    errorForm,
    answers,
    isSaving,
    lastSaved,
    selectedTurmaId,
    fetchMinhasTurmas,
    fetchFormData,
    saveAnswer,
    uploadFile,
    deleteFile,
} = useMeusDados();

// --- UI State ---
const selectedAnoSemestre = ref<string>(getAnoSemestre());

// --- Computed ---
const anoSemestreOptions = computed(() => getAnoSemestreList(5));

const turmasOptions = computed(() => {
    if (!selectedAnoSemestre.value) return [];
    return minhasTurmas.value
        .filter(
            (t) => t.ano_semestre === selectedAnoSemestre.value && !!t.id_turma,
        )
        .map((t) => ({
            id: t.id_turma,
            id_matricula: t.id_matricula,
            id_turma: t.id_turma,
            nome: `${t.cod_turma} - ${t.nome_curso} (${t.turno})`,
        }));
});

// --- Wrappers (injetam parâmetros do estado de UI) ---
const handleAnoSemestreChange = (value: string) => {
    selectedAnoSemestre.value = value;
    selectedTurmaId.value = null;
    formData.value = null;
};

const handleTurmaChange = (value: string | null) => {
    selectedTurmaId.value = value;
    if (value) {
        fetchFormData(value);
    } else {
        formData.value = null;
    }
};

const handleSave = (perguntaId: string, value: any) => {
    if (selectedTurmaId.value) {
        saveAnswer(perguntaId, value, selectedTurmaId.value);
    }
};

const handleUpload = async (perguntaId: string, file: File) => {
    if (selectedTurmaId.value) {
        const result = await uploadFile(
            perguntaId,
            file,
            selectedTurmaId.value,
        );
        if (result.ok && result.uuidName) {
            answers.value[perguntaId] = result.uuidName;
            // Renova hash para garantir que o CDN sirva o novo arquivo
            await store.refreshHash();
        }
    }
};

const handleDeleteFile = async (perguntaId: string, fileName: string) => {
    if (selectedTurmaId.value) {
        const result = await deleteFile(
            perguntaId,
            fileName,
            selectedTurmaId.value,
        );
        if (result.ok) {
            answers.value[perguntaId] = null;
        }
    }
};

// --- Lifecycle ---
onMounted(() => {
    if (store.initialized) {
        fetchMinhasTurmas();
    } else {
        const unwatch = watch(
            () => store.initialized,
            (val) => {
                if (val) {
                    fetchMinhasTurmas();
                    unwatch();
                }
            },
        );
    }
});
</script>
