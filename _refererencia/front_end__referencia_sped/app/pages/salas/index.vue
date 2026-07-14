<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import { useSalas } from "../../composables/salas/useSalas";
import SalasGrid from "../../components/salas/SalasGrid.vue";
import ModalSala from "../../components/salas/ModalSala.vue";
import ConfirmationModal from "../../components/ConfirmationModal.vue";

const { showToast } = useToast();
const { salas, isLoading, fetchSalas, deleteSala } = useSalas();

// ── UI state ──────────────────────────────────────────────
const search = ref("");

const filteredSalas = computed(() => {
    if (!search.value) return salas.value;
    return salas.value.filter((s) =>
        s.nome.toLowerCase().includes(search.value.toLowerCase()),
    );
});

// ── Modal state ───────────────────────────────────────────
const showModal = ref(false);
const selectedSala = ref<any>(null);
const showDeleteConfirm = ref(false);
const itemToDelete = ref<any>(null);
const isDeleting = ref(false);

// ── Handlers ──────────────────────────────────────────────
const handleCreate = () => {
    selectedSala.value = null;
    showModal.value = true;
};

const handleEdit = (sala: any) => {
    selectedSala.value = sala;
    showModal.value = true;
};

const handleDelete = (sala: any) => {
    itemToDelete.value = sala;
    showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
    if (!itemToDelete.value) return;
    isDeleting.value = true;
    try {
        await deleteSala(itemToDelete.value.id);
        showToast("Sala excluída com sucesso!", { type: "success" });
        fetchSalas();
        showDeleteConfirm.value = false;
        itemToDelete.value = null;
    } catch (e: any) {
        showToast("Erro ao excluir sala: " + e.message, { type: "error" });
    } finally {
        isDeleting.value = false;
    }
};

const handleSaved = () => {
    fetchSalas();
};

// ── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
    fetchSalas().catch((e: any) => {
        showToast("Erro ao carregar salas: " + e.message, { type: "error" });
    });
});

definePageMeta({
    layout: false,
});
</script>

<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full relative"
        >
            <!-- HEADER -->
            <div
                class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
            >
                <div>
                    <h1 class="text-2xl font-bold text-white mb-2">Salas</h1>
                    <p class="text-secondary text-sm">
                        Gerencie as salas disponíveis para reservas.
                    </p>
                </div>

                <div class="flex items-center gap-3 w-full md:w-auto">
                    <button
                        @click="handleCreate"
                        class="bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-2 transition-colors h-[32px]"
                    >
                        <svg
                            class="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 4v16m8-8H4"
                            ></path>
                        </svg>
                        Nova Sala
                    </button>
                </div>
            </div>

            <!-- SEARCH -->
            <div class="mb-6">
                <div class="relative">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Buscar salas..."
                        class="w-full bg-[#16161E] border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 transition-colors"
                    />
                    <div class="absolute left-4 top-3.5 text-secondary/50">
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- CONTENT -->
            <SalasGrid
                :salas="filteredSalas"
                :is-loading="isLoading"
                @edit="handleEdit"
                @delete="handleDelete"
            />

            <!-- Confirmation Modal -->
            <ConfirmationModal
                :isOpen="showDeleteConfirm"
                title="Excluir Sala"
                :message="`Tem certeza que deseja excluir a sala '${itemToDelete?.nome}'? Esta ação não pode ser desfeita.`"
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                :loading="isDeleting"
                @close="showDeleteConfirm = false"
                @confirm="confirmDelete"
            />

            <!-- Create/Edit Modal -->
            <ModalSala
                :isOpen="showModal"
                :sala="selectedSala"
                @close="showModal = false"
                @saved="handleSaved"
            />
        </div>

        <template #sidebar>
            <div class="space-y-6">
                <div class="bg-[#16161E] border border-white/5 rounded-xl p-4">
                    <h3
                        class="text-xs font-bold text-secondary uppercase tracking-wider mb-2"
                    >
                        Instruções
                    </h3>
                    <p class="text-xs text-secondary/80 leading-relaxed">
                        Gerencie as salas da unidade.
                    </p>
                    <ul
                        class="mt-4 text-xs text-secondary/70 space-y-2 list-disc pl-4"
                    >
                        <li>Crie sua sala e escolha a cor de identificação.</li>
                        <li>
                            A cor da sala irá refletir no calendário de salas.
                        </li>
                        <li>
                            <span class="text-amber-500 font-bold"
                                >Atenção:</span
                            >
                            Quando apagar uma sala, todas as reservas feitas
                            ficarão órfãs e não serão mais vistas, cuidado com
                            este procedimento.
                        </li>
                    </ul>
                </div>
            </div>
        </template>
    </NuxtLayout>
</template>
