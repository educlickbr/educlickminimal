<template>
    <div
        translate="no"
        class="notranslate bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full font-sans space-y-4"
    >
        <!-- Search -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div class="md:col-span-9">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Buscar Certificado</label
                >
                <input
                    v-model="filtros.busca"
                    type="text"
                    placeholder="Curso, código do curso ou turma..."
                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-secondary/30"
                />
            </div>
            <div class="md:col-span-3 flex items-end">
                <div
                    class="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
                >
                    Apenas certificados aprovados aparecem aqui.
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-16">
            <div
                class="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"
            ></div>
        </div>

        <!-- Empty -->
        <div
            v-else-if="certificados.length === 0"
            class="rounded-xl border border-white/10 bg-[#16161E] p-6 text-center"
        >
            <h2 class="text-base font-black text-white">
                Nenhum certificado aprovado encontrado
            </h2>
            <p class="text-sm text-secondary mt-2 max-w-2xl mx-auto">
                Assim que um certificado for aprovado pela equipe acadêmica, ele
                ficará disponível aqui para visualização e impressão.
            </p>
        </div>

        <!-- List -->
        <div v-else class="space-y-3">
            <MeusCertificadosCard
                v-for="item in certificados"
                :key="item.id_certificado_emitido"
                :item="item"
                :normalizar-area="normalizarArea"
                :get-area-badge-class="getAreaBadgeClass"
                :format-data-curta="formatDataCurta"
                @open-public="openPublicCertificado"
                @open-name-choice="openNameChoiceModal"
            />

            <!-- Pagination -->
            <div
                class="flex flex-col md:flex-row items-center justify-between gap-3 pt-2"
            >
                <span class="text-xs text-secondary"
                    >Total:
                    <strong class="text-white">{{ pagination.total }}</strong>
                    certificados</span
                >
                <div class="flex gap-2">
                    <button
                        @click="prevPage"
                        :disabled="pagination.page <= 1"
                        class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    <button
                        @click="nextPage"
                        :disabled="pagination.page >= pagination.pages"
                        class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Nome -->
        <ModalNomeImpressaoCertificados
            :show="showPrintNameModal"
            :loading="printNameLoading"
            :options="printNameOptions"
            @close="closePrintNameModal"
            @confirm="confirmNameChoice"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useMeusCertificadosLista } from "~/composables/meus-certificados/useMeusCertificadosLista";
import { useMeusCertificadosNome } from "~/composables/meus-certificados/useMeusCertificadosNome";
import MeusCertificadosCard from "~/components/meus-certificados/MeusCertificadosCard.vue";
import ModalNomeImpressaoCertificados from "~/components/meus-certificados/ModalNomeImpressaoCertificados.vue";

definePageMeta({
    layout: "base",
});

useHead({
    title: "Meus Certificados | SPEDigital",
    htmlAttrs: { translate: "no", class: "notranslate" },
    bodyAttrs: { class: "notranslate" },
});

// Composables (só lógica + chamadas externas)
const { fetchMeusCertificados } = useMeusCertificadosLista();
const {
    normalizarArea,
    getAreaBadgeClass,
    formatDataCurta,
    fetchNomeOptions,
    openPublicCertificado,
    previewCertificado,
} = useMeusCertificadosNome();

// Estado da página
const certificados = ref<any[]>([]);
const isLoading = ref(false);
const filtros = ref({ busca: "" });
const pagination = ref({ total: 0, page: 1, pages: 1, limit: 12 });
const showPrintNameModal = ref(false);
const printTargetCertificado = ref<any | null>(null);
const printNameOptions = ref<any[]>([]);
const printNameLoading = ref(false);

// Fetch
const loadCertificados = async () => {
    isLoading.value = true;
    try {
        const data = await fetchMeusCertificados({
            busca: filtros.value.busca || null,
            page: pagination.value.page,
            limit: pagination.value.limit,
        });
        certificados.value = (data?.itens || []) as any[];
        pagination.value = {
            total: data?.total || 0,
            page: data?.page || 1,
            pages: data?.pages || 1,
            limit: data?.limit || 12,
        };
    } catch (error) {
        console.error("Erro ao buscar certificados do aluno:", error);
        certificados.value = [];
        pagination.value = { total: 0, page: 1, pages: 1, limit: 12 };
    } finally {
        isLoading.value = false;
    }
};

// Paginação
const prevPage = () => {
    pagination.value.page--;
    loadCertificados();
};

const nextPage = () => {
    pagination.value.page++;
    loadCertificados();
};

// Busca com debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(
    () => filtros.value.busca,
    () => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            pagination.value.page = 1;
            loadCertificados();
        }, 350);
    },
);

// Modal handlers
const closePrintNameModal = () => {
    showPrintNameModal.value = false;
    printTargetCertificado.value = null;
    printNameOptions.value = [];
    printNameLoading.value = false;
};

const openNameChoiceModal = async (item: any) => {
    printTargetCertificado.value = item;
    showPrintNameModal.value = true;
    printNameLoading.value = true;
    printNameOptions.value = [];

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

const confirmNameChoice = (opcao: any) => {
    if (!opcao.disponivel || !opcao.valor || !printTargetCertificado.value) return;
    const item = printTargetCertificado.value;
    closePrintNameModal();
    previewCertificado(item, opcao.valor);
};

onMounted(() => {
    loadCertificados();
});
</script>
