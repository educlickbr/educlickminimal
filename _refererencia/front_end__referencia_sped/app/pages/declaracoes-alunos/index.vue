<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER -->
            <div
                class="flex flex-col md:flex-row items-center justify-end gap-4 mb-8"
            >
                <button
                    @click="openModal"
                    :disabled="!store.user_expandido_id"
                    class="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Solicitar Declaração
                </button>
            </div>

            <!-- CONTENT -->
            <div v-if="loading" class="flex justify-center py-20">
                <div class="text-center">
                    <svg
                        class="animate-spin h-8 w-8 text-primary mx-auto mb-4"
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
                    <p class="text-secondary text-sm">
                        Carregando histórico...
                    </p>
                </div>
            </div>

            <div
                v-else-if="declaracoes.length === 0"
                class="bg-[#16161E] border border-white/5 rounded-xl p-12 text-center"
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">
                    Nenhuma declaração
                </h3>
                <p class="text-sm text-secondary">
                    Você ainda não solicitou nenhuma declaração.
                </p>
            </div>

            <div v-else class="space-y-4">
                <DeclaracoesCard
                    v-for="item in declaracoes"
                    :key="item.id"
                    :item="item"
                    :format-date="formatDate"
                    @open-name-choice="openNameChoiceModal"
                />
            </div>

            <ModalSolicitarDeclaracao
                :is-open="modalOpen"
                :declaracoes-anteriores="declaracoes"
                @close="modalOpen = false"
                @success="fetchDeclaracoes"
            />
        </div>

        <ModalNomeImpressao
            :is-open="showPrintNameModal"
            :loading="printNameLoading"
            :options="printNameOptions"
            :context-label="
                printNameAction === 'public'
                    ? 'na página pública da declaração'
                    : 'na declaração impressa'
            "
            @close="closePrintNameModal"
            @confirm="confirmNameChoice"
        />
    </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAppStore } from "~/stores/app";
import { useDeclaracoesLista } from "~/composables/declaracoes/useDeclaracoesLista";
import { useDeclaracoesNome } from "~/composables/declaracoes/useDeclaracoesNome";
import DeclaracoesCard from "~/components/declaracoes/DeclaracoesCard.vue";
import ModalSolicitarDeclaracao from "~/components/declaracoes/ModalSolicitarDeclaracao.vue";
import ModalNomeImpressao from "~/components/ModalNomeImpressao.vue";

const store = useAppStore();

definePageMeta({
    layout: false,
});

// Composables (só lógica + chamadas externas)
const { declaracoes, loading, fetchDeclaracoes } = useDeclaracoesLista();
const {
    formatDate,
    fetchNomeOptions,
    openPublicDeclaration,
    openDeclaration,
} = useDeclaracoesNome();

// Estado de UI
const modalOpen = ref(false);
const showPrintNameModal = ref(false);
const printTargetDeclaration = ref<any | null>(null);
const printNameOptions = ref<any[]>([]);
const printNameLoading = ref(false);
const printNameAction = ref<"print" | "public">("print");

// Handlers de UI
const openModal = () => {
    modalOpen.value = true;
};

const closePrintNameModal = () => {
    showPrintNameModal.value = false;
    printTargetDeclaration.value = null;
    printNameOptions.value = [];
    printNameLoading.value = false;
};

const openNameChoiceModal = async (item: any, action: "print" | "public") => {
    if (item.aprovado === false) {
        alert("Esta declaração foi reprovada. Entre em contato com a secretaria.");
        return;
    }

    if (item.aprovado !== true) {
        alert("Esta declaração ainda está aguardando aprovação.");
        return;
    }

    printTargetDeclaration.value = item;
    showPrintNameModal.value = true;
    printNameLoading.value = true;
    printNameOptions.value = [];
    printNameAction.value = action;

    try {
        const opts = await fetchNomeOptions(item.id_matricula);
        printNameOptions.value = opts;
    } catch (error) {
        console.error(error);
        window.alert("Não foi possível carregar as opções de nome para impressão.");
        closePrintNameModal();
    } finally {
        printNameLoading.value = false;
    }
};

const confirmNameChoice = async (opcao: any) => {
    if (!printTargetDeclaration.value || !opcao.disponivel || !opcao.valor) return;
    const item = printTargetDeclaration.value;
    const action = printNameAction.value;
    closePrintNameModal();
    if (action === "public") {
        await openPublicDeclaration(item, opcao.tipo || "registro");
        return;
    }
    await openDeclaration(item, opcao.valor, opcao.tipo || "registro");
};

onMounted(() => {
    fetchDeclaracoes();
});
</script>
