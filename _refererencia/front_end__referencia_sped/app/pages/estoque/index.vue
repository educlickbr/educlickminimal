<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import { useEstoqueKits } from "../../composables/estoque/useEstoqueKits";
import { useEstoqueProdutos } from "../../composables/estoque/useEstoqueProdutos";
import { useEstoqueItens } from "../../composables/estoque/useEstoqueItens";
import EstoqueKitsTab from "../../components/estoque/EstoqueKitsTab.vue";
import EstoqueProdutosTab from "../../components/estoque/EstoqueProdutosTab.vue";
import EstoqueItensTab from "../../components/estoque/EstoqueItensTab.vue";
import KitFormModal from "../../components/estoque/KitFormModal.vue";
import ProductFormModal from "../../components/estoque/ProductFormModal.vue";
import AvariasModal from "../../components/estoque/AvariasModal.vue";
import ConfirmationModal from "../../components/ConfirmationModal.vue";

const { showToast } = useToast();
const {
    kits,
    isLoading: kitsLoading,
    fetchKits,
    createKit,
    updateKit,
    deleteKit: deleteKitFn,
} = useEstoqueKits();
const {
    produtos,
    isLoading: prodLoading,
    pagination: prodPagination,
    categorias,
    unidades,
    tipos,
    fetchProdutos,
    loadAuxiliaries,
    addStock,
    saveProduto,
    deleteProduto: deleteProdutoFn,
} = useEstoqueProdutos();
const {
    itens,
    isLoading: itensLoading,
    pagination: itensPagination,
    fetchItens,
    deleteItem,
} = useEstoqueItens();

// ── UI state ──────────────────────────────────────────────
const activeTab = ref<"kits" | "produtos" | "estoque">("kits");

// search refs (v-model nos componentes tab)
const busca = ref("");
const buscaEstoque = ref("");

// ── Modal state ───────────────────────────────────────────
const showKitModal = ref(false);
const editingKit = ref<any>(null);

const showProductModal = ref(false);
const editingProduct = ref<any>(null);

const showDeleteConfirm = ref(false);
const itemToDelete = ref<any>(null);
const isDeleting = ref(false);

const showAvariasModal = ref(false);
const selectedEstoqueItem = ref<any>(null);

const showKitSelectModal = ref(false);
const itemToAssociate = ref<any>(null);
const selectedKitId = ref<string>("");

// ── Handlers: Kits ────────────────────────────────────────
const openCreateKitModal = () => {
    editingKit.value = null;
    showKitModal.value = true;
};

const openEditKitModal = (kit: any) => {
    editingKit.value = kit;
    showKitModal.value = true;
};

const handleSaveKit = async (formData: any) => {
    if (!formData.nome.trim()) return;
    try {
        if (editingKit.value) {
            await updateKit(editingKit.value.id, formData.nome);
            showToast("Kit atualizado com sucesso!", { type: "success" });
        } else {
            await createKit(formData.nome);
            showToast("Kit criado com sucesso!", { type: "success" });
        }
        showKitModal.value = false;
        fetchKits();
    } catch (e: any) {
        showToast("Erro ao salvar kit: " + e.message, { type: "error" });
    }
};

const handleDeleteKit = (kit: any) => {
    itemToDelete.value = { ...kit, type: "kit", nome: kit.nome };
    showDeleteConfirm.value = true;
};

// ── Handlers: Produtos ────────────────────────────────────
const openCreateProductModal = async () => {
    await loadAuxiliariesWrapper();
    editingProduct.value = null;
    showProductModal.value = true;
};

const openEditProductModal = async (prod: any) => {
    await loadAuxiliariesWrapper();
    editingProduct.value = prod;
    showProductModal.value = true;
};

const handleSaveProduct = async (formData: any) => {
    if (!formData.nome || !formData.id_categoria || !formData.id_unidade) {
        showToast("Preencha os campos obrigatórios (*)", { type: "error" });
        return;
    }
    try {
        const editingId = editingProduct.value?.id || null;
        await saveProduto(formData, editingId);
        showToast(
            editingId
                ? "Produto atualizado com sucesso!"
                : "Produto criado com sucesso!",
            { type: "success" },
        );
        showProductModal.value = false;
        fetchProdutos(
            prodPagination.value.pagina_atual,
            busca.value || undefined,
        );
    } catch (e: any) {
        showToast("Erro ao salvar produto: " + e.message, { type: "error" });
    }
};

const handleAddStock = async (prod: any) => {
    if (!prod.quantidade_a_adicionar || prod.quantidade_a_adicionar <= 0)
        return;
    try {
        await addStock(
            prod.id,
            prod.quantidade_a_adicionar,
            prod.valor_inicial,
        );
        showToast(
            `${prod.quantidade_a_adicionar} itens adicionados ao estoque!`,
            { type: "success" },
        );
        fetchProdutos(
            prodPagination.value.pagina_atual,
            busca.value || undefined,
        );
    } catch (e: any) {
        showToast("Erro ao adicionar estoque: " + e.message, { type: "error" });
    }
};

const handleDeleteProduct = (prod: any) => {
    itemToDelete.value = { ...prod, type: "produto", nome: prod.nome };
    showDeleteConfirm.value = true;
};

// ── Handlers: Estoque / Avarias ───────────────────────────
const openAvariasModal = (item: any) => {
    selectedEstoqueItem.value = item;
    showAvariasModal.value = true;
};

const handleDeleteEstoqueItem = (item: any) => {
    itemToDelete.value = {
        ...item,
        type: "estoque",
        nome: `${item.produto?.nome} (${item.id.split("-")[0]})`,
    };
    showDeleteConfirm.value = true;
};

// ── Confirmação de exclusão ───────────────────────────────
const confirmDelete = async () => {
    if (!itemToDelete.value) return;
    isDeleting.value = true;
    try {
        if (itemToDelete.value.type === "kit") {
            await deleteKitFn(itemToDelete.value.id);
            showToast("Kit excluído com sucesso!", { type: "success" });
            fetchKits();
        } else if (itemToDelete.value.type === "produto") {
            await deleteProdutoFn(itemToDelete.value.id);
            showToast("Produto excluído com sucesso!", { type: "success" });
            fetchProdutos(1, busca.value || undefined);
        } else if (itemToDelete.value.type === "estoque") {
            await deleteItem(itemToDelete.value.id);
            showToast("Item removido do estoque!", { type: "success" });
            fetchItens(
                itensPagination.value.pagina_atual,
                buscaEstoque.value || undefined,
            );
        }
        showDeleteConfirm.value = false;
        itemToDelete.value = null;
    } catch (e: any) {
        showToast(e.message, { type: "error" });
    } finally {
        isDeleting.value = false;
    }
};

// ── Wrappers (injetam params + toast) ─────────────────────
const loadAuxiliariesWrapper = async () => {
    try {
        await loadAuxiliaries();
    } catch (e: any) {
        showToast("Erro ao carregar dados auxiliares", { type: "error" });
    }
};

const fetchProdutosWrapper = (page: number = 1) => {
    fetchProdutos(page, busca.value || undefined).catch((e: any) => {
        showToast("Erro ao carregar produtos: " + e.message, { type: "error" });
    });
};

const fetchItensWrapper = (page: number = 1) => {
    fetchItens(page, buscaEstoque.value || undefined).catch((e: any) => {
        showToast("Erro ao carregar estoque: " + e.message, { type: "error" });
    });
};

// ── Search debounce ───────────────────────────────────────
let searchTimeout: any;
watch(busca, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchProdutosWrapper(1), 500);
});

let searchEstoqueTimeout: any;
watch(buscaEstoque, () => {
    clearTimeout(searchEstoqueTimeout);
    searchEstoqueTimeout = setTimeout(() => fetchItensWrapper(1), 500);
});

// ── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
    if (activeTab.value === "kits") fetchKits().catch(() => {});
    if (activeTab.value === "produtos") fetchProdutosWrapper();
    if (activeTab.value === "estoque") fetchItensWrapper();
});

watch(activeTab, (tab) => {
    if (tab === "kits") fetchKits().catch(() => {});
    if (tab === "produtos" && produtos.value.length === 0)
        fetchProdutosWrapper();
    if (tab === "estoque" && itens.value.length === 0) fetchItensWrapper();
});

definePageMeta({
    layout: false,
});
</script>

<template>
    <NuxtLayout name="base">
        <div class="bg-div-15 rounded-xl p-6 md:p-8 min-h-[calc(100vh-100px)]">
            <!-- HEADER / TABS -->
            <div
                class="flex flex-col md:flex-row items-center justify-between gap-4 mb-8"
            >
                <div
                    class="flex items-center gap-6 border-b border-secondary/10 w-full md:w-auto pb-1 overflow-x-auto no-scrollbar"
                >
                    <button
                        @click="activeTab = 'kits'"
                        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                        :class="
                            activeTab === 'kits'
                                ? 'text-primary'
                                : 'text-secondary hover:text-white'
                        "
                    >
                        Kits
                        <span
                            v-if="activeTab === 'kits'"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        ></span>
                    </button>
                    <button
                        @click="activeTab = 'produtos'"
                        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                        :class="
                            activeTab === 'produtos'
                                ? 'text-primary'
                                : 'text-secondary hover:text-white'
                        "
                    >
                        Produtos
                        <span
                            v-if="activeTab === 'produtos'"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        ></span>
                    </button>
                    <button
                        @click="activeTab = 'estoque'"
                        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                        :class="
                            activeTab === 'estoque'
                                ? 'text-primary'
                                : 'text-secondary hover:text-white'
                        "
                    >
                        Estoque / Avarias
                        <span
                            v-if="activeTab === 'estoque'"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        ></span>
                    </button>
                </div>

                <div v-if="activeTab === 'kits'">
                    <button
                        @click="openCreateKitModal"
                        class="bg-primary hover:bg-primary/80 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
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
                                d="M12 4v16m8-8H4"
                            ></path>
                        </svg>
                        Novo Kit
                    </button>
                </div>
                <div v-if="activeTab === 'produtos'">
                    <button
                        @click="openCreateProductModal"
                        class="bg-primary hover:bg-primary/80 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
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
                                d="M12 4v16m8-8H4"
                            ></path>
                        </svg>
                        Novo Produto
                    </button>
                </div>
                <div v-if="activeTab === 'estoque'"></div>
            </div>

            <!-- CONTENT -->
            <div>
                <EstoqueKitsTab
                    v-if="activeTab === 'kits'"
                    :kits="kits"
                    :is-loading="kitsLoading"
                    @create="openCreateKitModal"
                    @edit="openEditKitModal"
                    @delete="handleDeleteKit"
                />

                <EstoqueProdutosTab
                    v-if="activeTab === 'produtos'"
                    v-model:busca="busca"
                    :produtos="produtos"
                    :is-loading="prodLoading"
                    :pagination="prodPagination"
                    @create="openCreateProductModal"
                    @edit="openEditProductModal"
                    @delete="handleDeleteProduct"
                    @add-stock="handleAddStock"
                    @page-change="fetchProdutosWrapper"
                />

                <EstoqueItensTab
                    v-if="activeTab === 'estoque'"
                    v-model:busca="buscaEstoque"
                    :itens="itens"
                    :is-loading="itensLoading"
                    :pagination="itensPagination"
                    @avarias="openAvariasModal"
                    @delete="handleDeleteEstoqueItem"
                    @page-change="fetchItensWrapper"
                />

                <!-- Avarias Modal -->
                <AvariasModal
                    :isOpen="showAvariasModal"
                    :estoqueItem="selectedEstoqueItem"
                    @close="showAvariasModal = false"
                    @refresh="fetchItensWrapper(itensPagination.pagina_atual)"
                />
            </div>

            <!-- Kit Modal -->
            <KitFormModal
                :isOpen="showKitModal"
                :initialData="editingKit"
                :isLoading="kitsLoading"
                @close="showKitModal = false"
                @save="handleSaveKit"
            />

            <!-- Product Modal -->
            <ProductFormModal
                :isOpen="showProductModal"
                :initialData="editingProduct"
                :isLoading="prodLoading"
                :categorias="categorias"
                :tipos="tipos"
                :unidades="unidades"
                @close="showProductModal = false"
                @save="handleSaveProduct"
            />

            <!-- Delete Confirmation -->
            <ConfirmationModal
                :isOpen="showDeleteConfirm"
                title="Excluir Item"
                :message="`Tem certeza que deseja excluir '${itemToDelete?.nome}'? Esta ação não pode ser desfeita.`"
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                :loading="isDeleting"
                @close="showDeleteConfirm = false"
                @confirm="confirmDelete"
            />
        </div>
    </NuxtLayout>
</template>
