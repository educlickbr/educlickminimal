<template>
    <div
        translate="no"
        class="notranslate bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full font-sans"
    >
        <!-- Loading -->
        <div
            v-if="loading"
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
            <p class="text-secondary text-sm">Carregando avaliações...</p>
        </div>

        <!-- Empty -->
        <div
            v-else-if="!avaliacoes || avaliacoes.length === 0"
            class="flex flex-col items-center justify-center py-20 bg-div-15 rounded border border-white/5 p-8 text-center"
        >
            <div
                class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"
            >
                <svg
                    class="w-8 h-8 text-secondary/50"
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
            </div>
            <h3 class="text-white font-bold text-lg mb-2">
                Nenhuma Avaliação Publicada
            </h3>
            <p class="text-secondary text-sm max-w-sm">
                Você ainda não possui conceitos ou pareceres emitidos pelas suas
                turmas ativas. Volte mais tarde.
            </p>
        </div>

        <!-- List -->
        <div v-else class="grid grid-cols-1 gap-4">
            <AvaliacoesAlunosCard
                v-for="avl in avaliacoes"
                :key="avl.id_avaliacao"
                :avaliacao="avl"
                :is-expanded="avaliacaoAberta === avl.id_avaliacao"
                :conceito-label="conceitoLabel"
                :conceito-class="conceitoClass"
                :get-nome-completo="getNomeCompleto"
                :get-nome-avaliador="getNomeAvaliador"
                :get-public-qrcode-url="getPublicQrcodeUrl"
                :get-public-avaliacao-url="getPublicAvaliacaoUrl"
                @toggle="toggleAvaliacao"
                @open-atividade="openAtividadeEntrega"
                @open-name-choice="openNameChoiceModal"
            />
        </div>

        <!-- Modal Atividade -->
        <ModalAtividadeEntrega
            :is-open="showAtividadeEntregaModal"
            :atividade="atividadeEntregaTarget ?? null"
            @close="closeAtividadeEntrega"
            @submitted="handleAtividadeSubmitted"
        />

        <!-- Modal Nome Impressão -->
        <ModalNomeImpressaoAvaliacoes
            :show="showPrintNameModal"
            :loading="printNameLoading"
            :options="printNameOptions"
            :action-label="
                printNameAction === 'public'
                    ? 'na página pública da avaliação'
                    : 'na avaliação impressa'
            "
            @close="closePrintNameModal"
            @confirm="confirmNameChoice"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAvaliacoesAlunosLista } from "~/composables/avaliacoes-alunos/useAvaliacoesAlunosLista";
import { useAvaliacoesAlunosNome, type OpcaoNomeImpressao } from "~/composables/avaliacoes-alunos/useAvaliacoesAlunosNome";
import AvaliacoesAlunosCard from "~/components/avaliacoes-alunos/AvaliacoesAlunosCard.vue";
import ModalAtividadeEntrega from "~/components/avaliacoes-alunos/ModalAtividadeEntrega.vue";
import ModalNomeImpressaoAvaliacoes from "~/components/avaliacoes-alunos/ModalNomeImpressaoAvaliacoes.vue";
import type { AvaliacaoAluno } from "~/composables/avaliacoes-alunos/useAvaliacoesAlunosLista";

definePageMeta({
    layout: "base",
});

useHead({
    title: "Minhas Avaliações | SPEDigital",
    htmlAttrs: {
        translate: "no",
        class: "notranslate",
    },
    bodyAttrs: {
        class: "notranslate",
    },
});

// Composables (só lógica + chamadas externas)
const {
    avaliacoes,
    loading,
    refreshAvaliacoes,
    conceitoLabel,
    conceitoClass,
} = useAvaliacoesAlunosLista();

const {
    getNomeCompleto,
    getNomeAvaliador,
    getPublicQrcodeUrl,
    getPublicAvaliacaoUrl,
    fetchNomeOptions,
    openPublicAvaliacao,
    printAvaliacao,
} = useAvaliacoesAlunosNome();

// Estado de UI
const avaliacaoAberta = ref<string | null>(null);
const showPrintNameModal = ref(false);
const printTargetAvaliacao = ref<AvaliacaoAluno | null>(null);
const printNameOptions = ref<OpcaoNomeImpressao[]>([]);
const printNameLoading = ref(false);
const printNameAction = ref<"print" | "public">("print");
const showAtividadeEntregaModal = ref(false);
const atividadeEntregaTarget = ref<NonNullable<AvaliacaoAluno["atividade_associada"]> | null>(null);

// Handlers de UI
const toggleAvaliacao = (id: string) => {
    avaliacaoAberta.value = avaliacaoAberta.value === id ? null : id;
};

const openAtividadeEntrega = (avl: AvaliacaoAluno) => {
    atividadeEntregaTarget.value = avl.atividade_associada ?? null;
    showAtividadeEntregaModal.value = true;
};

const closeAtividadeEntrega = () => {
    showAtividadeEntregaModal.value = false;
    atividadeEntregaTarget.value = null;
};

const handleAtividadeSubmitted = () => {
    closeAtividadeEntrega();
    refreshAvaliacoes();
};

const openNameChoiceModal = async (avl: AvaliacaoAluno, action: "print" | "public") => {
    printTargetAvaliacao.value = avl;
    showPrintNameModal.value = true;
    printNameLoading.value = true;
    printNameOptions.value = [];
    printNameAction.value = action;

    try {
        const opts = await fetchNomeOptions();
        printNameOptions.value = opts;
    } catch (error) {
        console.error(error);
        window.alert("Não foi possível carregar as opções de nome para impressão.");
        closePrintNameModal();
    } finally {
        printNameLoading.value = false;
    }
};

const closePrintNameModal = () => {
    showPrintNameModal.value = false;
    printTargetAvaliacao.value = null;
    printNameOptions.value = [];
    printNameLoading.value = false;
};

const confirmNameChoice = async (opcao: OpcaoNomeImpressao) => {
    if (!printTargetAvaliacao.value || !opcao.disponivel || !opcao.valor) return;
    const avl = printTargetAvaliacao.value;
    const action = printNameAction.value;
    closePrintNameModal();
    if (action === "public") {
        await openPublicAvaliacao(avl, opcao.tipo);
        return;
    }
    await printAvaliacao(avl, opcao.valor, opcao.tipo);
};

onMounted(() => {
    refreshAvaliacoes();
});
</script>
