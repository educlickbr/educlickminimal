<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- LOADING -->
            <div v-if="isLoading" class="flex justify-center py-20">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
                ></div>
            </div>

            <!-- EMPTY STATE -->
            <div
                v-else-if="editais.length === 0"
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
                <p class="text-white font-bold">Nenhum edital disponível.</p>
                <p class="text-xs text-secondary mt-1">
                    Fique atento para futuras oportunidades.
                </p>
            </div>

            <!-- LIST -->
            <div v-else class="flex flex-col gap-4">
                <BolsasInscricoesCard
                    v-for="edital in editais"
                    :key="edital.id"
                    :edital="edital"
                    :is-expanded="expandedEditalId === edital.id"
                    :download-file="downloadFile"
                    :format-date="formatDate"
                    :get-etapa-status="getEtapaStatus"
                    :get-sorted-etapas="getSortedEtapas"
                    @toggle-expand="toggleExpand"
                    @inscrever="handleInscrever"
                />
            </div>
        </div>

        <!-- Modal Inscrição -->
        <ModalInscricaoBolsas
            :show="showModal"
            :selected-edital="selectedEdital"
            :file="file"
            :aceite="aceite"
            :cpf="cpf"
            :banco="banco"
            :agencia="agencia"
            :tipo-conta="tipoConta"
            :conta="conta"
            :chave-pix="chavePix"
            :is-submitting="isSubmitting"
            :status-text="statusText"
            :is-form-valid="isFormValid"
            @close="closeModal"
            @file-upload="handleFileUpload"
            @update:aceite="aceite = $event"
            @update:cpf="cpf = $event"
            @update:banco="banco = $event"
            @update:agencia="agencia = $event"
            @update:tipo-conta="tipoConta = $event"
            @update:conta="conta = $event"
            @update:chave-pix="chavePix = $event"
            @submit="_submitInscricao"
        />
    </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { formatDate } from "~/utils/date";
import { useBolsasInscricoes } from "~/composables/bolsas-inscricoes/useBolsasInscricoes";
import { useInscricaoModal } from "~/composables/bolsas-inscricoes/useInscricaoModal";
import BolsasInscricoesCard from "~/components/bolsas-inscricoes/BolsasInscricoesCard.vue";
import ModalInscricaoBolsas from "~/components/bolsas-inscricoes/ModalInscricaoBolsas.vue";

definePageMeta({});

// Editais list
const {
    editais,
    isLoading,
    expandedEditalId,
    fetchEditais,
    toggleExpand,
    getSortedEtapas,
    getEtapaStatus,
    downloadFile,
} = useBolsasInscricoes();

// Inscrição modal
const {
    showModal,
    selectedEdital,
    file,
    aceite,
    cpf,
    banco,
    agencia,
    tipoConta,
    conta,
    chavePix,
    isFormValid,
    isSubmitting,
    statusText,
    handleInscrever,
    closeModal,
    handleFileUpload,
    submitInscricao,
} = useInscricaoModal();

// Wrapper: refetch editais after successful submission
const _submitInscricao = async () => {
    const ok = await submitInscricao();
    if (ok) fetchEditais();
};

onMounted(() => {
    fetchEditais();
});
</script>
