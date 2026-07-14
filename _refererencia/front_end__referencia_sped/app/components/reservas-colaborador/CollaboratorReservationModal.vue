<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import { useAppStore } from "../../stores/app";
import { $fetch as ofetch } from "ofetch";

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits(["close", "saved"]);

const appStore = useAppStore();
const { showToast } = useToast();

const loading = ref(false);
const searchLoading = ref(false);
const productSearch = ref("");
const productResults = ref<any[]>([]);
const selectedProduct = ref<any>(null);

// Fixed Periods
const periods = [
    { id: "matutino", label: "Matutino", start: "08:00", end: "12:00" },
    { id: "almoco", label: "Almoço", start: "12:00", end: "13:00" },
    { id: "vespertino", label: "Vespertino", start: "13:00", end: "17:00" },
    { id: "jantar", label: "Jantar", start: "17:00", end: "18:00" },
    { id: "noturno", label: "Noturno", start: "18:00", end: "22:00" },
];

const selectedPeriod = ref<string>("matutino");
const selectedDate = ref<string>("");

const form = ref({
    data_retirada: "",
    data_devolucao: "",
    quantidade: 1,
});

// Update calculated dates when Date or Period changes
const updateDates = () => {
    if (!selectedDate.value || !selectedPeriod.value) {
        form.value.data_retirada = "";
        form.value.data_devolucao = "";
        return;
    }

    const [yearStr, monthStr, dayStr] = selectedDate.value.split("-");

    if (!yearStr || !monthStr || !dayStr) return;

    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    const day = parseInt(dayStr);

    const period = periods.find((p) => p.id === selectedPeriod.value);
    if (!period) return;

    const [startHour, startMin] = period.start.split(":").map(Number);
    const [endHour, endMin] = period.end.split(":").map(Number);

    const startDate = new Date(year, month, day, startHour, startMin, 0);
    const endDate = new Date(year, month, day, endHour, endMin, 0);

    form.value.data_retirada = startDate.toISOString();
    form.value.data_devolucao = endDate.toISOString();

    // Trigger search if valid
    handleSearch();
};

// Reset on open
watch(
    () => props.isOpen,
    (val) => {
        if (val) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");

            selectedDate.value = `${year}-${month}-${day}`;
            selectedPeriod.value = "matutino";

            productSearch.value = "";
            selectedProduct.value = null;
            productResults.value = [];
            form.value.quantidade = 1;

            updateDates();
        }
    },
);

watch([selectedDate, selectedPeriod], () => {
    updateDates();
});

let searchTimer: any = null;
const handleSearch = () => {
    if (searchTimer) clearTimeout(searchTimer);

    if (productSearch.value.length < 2) {
        productResults.value = [];
        searchLoading.value = false;
        return;
    }

    if (!form.value.data_retirada || !form.value.data_devolucao) {
        return;
    }

    searchLoading.value = true;
    searchTimer = setTimeout(async () => {
        try {
            const results = await ofetch(
                "/api/producao/estoque/produtos-disponiveis",
                {
                    params: {
                        busca: productSearch.value,
                        data_retirada: form.value.data_retirada,
                        data_devolucao: form.value.data_devolucao,
                    },
                },
            );
            productResults.value = Array.isArray(results) ? results : [];
        } catch (e) {
            console.error(e);
            productResults.value = [];
        } finally {
            searchLoading.value = false;
        }
    }, 300);
};

const selectProduct = (prod: any) => {
    selectedProduct.value = prod;
    productSearch.value = "";
    productResults.value = [];
    form.value.quantidade = 1;
};

const submit = async () => {
    if (!selectedProduct.value) return;
    if (!appStore.user_expandido_id) {
        await appStore.initSession();
    }

    if (!appStore.user_expandido_id) {
        showToast(
            "Erro: Não foi possível identificar o usuário. Tente recarregar a página.",
            { type: "error" },
        );
        return;
    }

    loading.value = true;
    try {
        await ofetch("/api/producao/estoque/reserva", {
            method: "POST",
            body: {
                id_usuario: appStore.user_expandido_id as string,
                id_produto: selectedProduct.value.id,
                quantidade: form.value.quantidade,
                data_retirada: form.value.data_retirada,
                data_devolucao: form.value.data_devolucao,
            },
        });

        showToast("Reserva realizada com sucesso!", { type: "success" });
        emit("saved");
        emit("close");
    } catch (e: any) {
        showToast(e.message, { type: "error" });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
        <div
            class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            @click="emit('close')"
        ></div>

        <div
            class="relative w-full max-w-lg transform rounded-2xl bg-[#16161E] border border-white/10 p-6 text-left shadow-xl transition-all"
        >
            <h3 class="text-lg font-bold text-white mb-6">Nova Reserva</h3>

            <div class="space-y-6">
                <!-- 1. Data e Período (FIRST) -->
                <div class="space-y-4 pb-4 border-b border-white/5">
                    <div>
                        <label
                            class="block text-xs font-bold text-secondary mb-1 uppercase"
                            >Data</label
                        >
                        <input
                            v-model="selectedDate"
                            type="date"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none text-sm"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-xs font-bold text-secondary mb-2 uppercase"
                            >Período</label
                        >
                        <div class="grid grid-cols-3 gap-2">
                            <button
                                v-for="period in periods"
                                :key="period.id"
                                @click="selectedPeriod = period.id"
                                class="px-2 py-2 rounded-lg text-xs font-bold transition-all border"
                                :class="
                                    selectedPeriod === period.id
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white/5 text-secondary border-transparent hover:bg-white/10'
                                "
                            >
                                {{ period.label }}
                                <span
                                    class="block text-[9px] opacity-70 font-medium"
                                    >{{ period.start }} - {{ period.end }}</span
                                >
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 2. Produto -->
                <div>
                    <label
                        class="block text-xs font-bold text-secondary mb-1 uppercase"
                        >Produto</label
                    >
                    <div class="relative">
                        <input
                            v-model="productSearch"
                            @input="handleSearch"
                            type="text"
                            :disabled="!selectedDate || !selectedPeriod"
                            :placeholder="
                                !selectedDate
                                    ? 'Selecione a data primeiro...'
                                    : 'Buscar equipamento...'
                            "
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        <!-- Dropdown -->
                        <div
                            v-if="productResults.length > 0"
                            class="absolute left-0 right-0 top-full mt-1 bg-[#23232d] border border-white/10 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto"
                        >
                            <div
                                v-for="prod in productResults"
                                :key="prod.id"
                                @click="selectProduct(prod)"
                                class="px-3 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0"
                            >
                                <img
                                    v-if="prod.imagem"
                                    :src="prod.imagem"
                                    class="w-8 h-8 rounded bg-white/5 object-cover"
                                />
                                <div
                                    v-else
                                    class="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[8px] font-bold text-secondary"
                                >
                                    IMG
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs font-bold text-white">
                                        {{ prod.nome }}
                                    </p>
                                    <p class="text-[10px] text-secondary">
                                        Disp: {{ prod.qtd_disponivel }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Selected Product -->
                    <div
                        v-if="selectedProduct"
                        class="mt-3 flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
                    >
                        <img
                            v-if="selectedProduct.imagem"
                            :src="selectedProduct.imagem"
                            class="w-10 h-10 rounded bg-black/20 object-cover"
                        />
                        <div
                            v-else
                            class="w-10 h-10 rounded bg-black/20 flex items-center justify-center text-[10px] font-bold text-secondary"
                        >
                            IMG
                        </div>

                        <div class="flex-1">
                            <p
                                class="text-sm font-bold"
                                :class="
                                    selectedProduct.qtd_disponivel > 0
                                        ? 'text-white'
                                        : 'text-red-500'
                                "
                            >
                                {{ selectedProduct.nome }}
                            </p>
                            <p class="text-[10px] text-secondary">
                                Disponível neste período:
                                <span class="font-bold text-white">{{
                                    selectedProduct.qtd_disponivel
                                }}</span>
                            </p>
                        </div>

                        <button
                            @click="
                                selectedProduct = null;
                                productSearch = '';
                            "
                            class="text-secondary hover:text-white"
                        >
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- 3. Quantidade -->
                <div>
                    <label
                        class="block text-xs font-bold text-secondary mb-1 uppercase"
                        >Quantidade</label
                    >
                    <input
                        v-model="form.quantidade"
                        type="number"
                        min="1"
                        :max="
                            selectedProduct ? selectedProduct.qtd_disponivel : 1
                        "
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none text-sm"
                        :disabled="!selectedProduct"
                    />
                </div>
            </div>

            <div
                class="mt-8 flex justify-end gap-3 pt-4 border-t border-white/5"
            >
                <button
                    @click="emit('close')"
                    class="px-4 py-2 text-sm font-bold text-secondary hover:text-white transition-colors"
                >
                    Cancelar
                </button>
                <button
                    @click="submit"
                    :disabled="
                        loading ||
                        !selectedProduct ||
                        selectedProduct.qtd_disponivel <= 0
                    "
                    class="px-6 py-2 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
                    :class="
                        !selectedProduct || selectedProduct.qtd_disponivel <= 0
                            ? 'bg-white/10 text-secondary cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-600'
                    "
                >
                    <svg
                        v-if="loading"
                        class="animate-spin h-4 w-4"
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
                    Confirmar Reserva
                </button>
            </div>
        </div>
    </div>
</template>
