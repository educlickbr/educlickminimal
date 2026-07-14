<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-3 md:p-8 flex-1 w-full"
        >
            <!-- Search -->
            <div class="bg-[#16161E] border border-white/5 rounded-lg p-4 mb-6">
                <label
                    class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                >
                    Buscar documento
                </label>
                <input
                    v-model="filters.busca"
                    type="text"
                    placeholder="Buscar por nome do documento"
                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/40 h-10"
                />
            </div>

            <!-- Loading -->
            <div
                v-if="loading"
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
                <p class="text-sm text-secondary">Buscando documentos...</p>
            </div>

            <!-- Empty -->
            <div
                v-else-if="documentos.length === 0"
                class="bg-[#16161E] border border-white/5 rounded-xl p-12 text-center"
            >
                <svg
                    class="w-16 h-16 mx-auto mb-4 opacity-20 text-white"
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
                <h3 class="text-lg font-bold text-white mb-2">
                    Nenhum documento encontrado
                </h3>
                <p class="text-sm text-secondary">
                    {{
                        filters.busca
                            ? "Nenhum documento corresponde à sua busca no momento."
                            : "Não há documentos publicados para você no momento."
                    }}
                </p>
            </div>

            <!-- List -->
            <div v-else class="space-y-3">
                <DocumentosAcademicosCard
                    v-for="doc in documentos"
                    :key="doc.id"
                    :doc="doc"
                    :hash-base-local="hashBaseLocal"
                />
            </div>

            <!-- Pagination -->
            <div
                v-if="documentos.length > 0"
                class="flex flex-col md:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-white/5"
            >
                <span class="text-xs md:text-sm text-secondary-500 order-2 md:order-1">
                    <span class="font-medium text-white">{{ (pagination.pagina_atual - 1) * LIMITE + 1 }}</span>
                    a
                    <span class="font-medium text-white">{{ Math.min(pagination.pagina_atual * LIMITE, pagination.total) }}</span>
                    de
                    <span class="font-medium text-white">{{ pagination.total }}</span>
                </span>
                <div class="flex gap-2 order-1 md:order-2">
                    <button
                        @click="previousPage"
                        :disabled="pagination.pagina_atual === 1"
                        class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    <button
                        @click="nextPage"
                        :disabled="pagination.pagina_atual >= pagination.qtd_paginas"
                        class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useDocumentosAcademicos } from "~/composables/documentos-academico/useDocumentosAcademicos";
import DocumentosAcademicosCard from "~/components/documentos-academico/DocumentosAcademicosCard.vue";

definePageMeta({
    layout: false,
});

// Composables (só lógica + chamadas externas)
const { fetchHashBase, fetchDocumentos } = useDocumentosAcademicos();

// Estado da página
const loading = ref(false);
const documentos = ref<any[]>([]);
const hashBaseLocal = ref<string | null>(null);
const LIMITE = 20;
const filters = ref({ busca: "" });
const pagination = ref({
    pagina_atual: 1,
    qtd_paginas: 1,
    total: 0,
});
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Fetch
const loadDocumentos = async (pagina = 1) => {
    loading.value = true;
    try {
        const data: any = await fetchDocumentos({
            busca: filters.value.busca || null,
            pagina,
            limite: LIMITE,
        });
        documentos.value = data?.itens || [];
        pagination.value = {
            pagina_atual: data?.pagina ?? pagina,
            qtd_paginas: data?.qtd_paginas ?? 1,
            total: data?.total ?? 0,
        };
    } catch (e) {
        console.error("Erro ao buscar documentos:", e);
    } finally {
        loading.value = false;
    }
};

// Paginação
const previousPage = () => {
    if (pagination.value.pagina_atual > 1) {
        loadDocumentos(pagination.value.pagina_atual - 1);
    }
};

const nextPage = () => {
    if (pagination.value.pagina_atual < pagination.value.qtd_paginas) {
        loadDocumentos(pagination.value.pagina_atual + 1);
    }
};

// Busca com debounce
watch(
    () => filters.value.busca,
    () => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadDocumentos(1), 400);
    },
);

onMounted(async () => {
    hashBaseLocal.value = await fetchHashBase();
    loadDocumentos();
});

onBeforeUnmount(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
});
</script>
