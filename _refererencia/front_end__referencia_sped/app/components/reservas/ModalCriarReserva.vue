<script setup lang="ts">
import { useToast } from "../../../composables/useToast";
import { $fetch as ofetch } from "ofetch";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const { showToast } = useToast();
const isLoading = ref(false);

// Date defaults
const defaultStart = () => {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const defaultEnd = () => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const form = ref({
  userSearch: "",
  productSearch: "",
  data_retirada: defaultStart(),
  data_devolucao: defaultEnd(),
});

const selectedUser = ref<any>(null);
const selectedProducts = ref<Array<{ produto: any; quantidade: number }>>([]);
const tempSelectedProduct = ref<any>(null);
const tempQuantidade = ref(1);
const userResults = ref<any[]>([]);
const productResults = ref<any[]>([]);

// Reset on open
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      form.value.userSearch = "";
      form.value.productSearch = "";
      form.value.data_retirada = defaultStart();
      form.value.data_devolucao = defaultEnd();
      selectedUser.value = null;
      selectedProducts.value = [];
      tempSelectedProduct.value = null;
      tempQuantidade.value = 1;
      userResults.value = [];
      productResults.value = [];
    }
  }
);

const searchUsers = async () => {
  if (form.value.userSearch.length < 2) {
    userResults.value = [];
    return;
  }
  userResults.value = await ofetch("/api/producao/estoque/users-reserva", {
    params: { busca: form.value.userSearch },
  });
};

const selectUser = (user: any) => {
  selectedUser.value = user;
  form.value.userSearch = "";
  userResults.value = [];
};

const clearUser = () => {
  selectedUser.value = null;
};

const searchProdutos = async () => {
  if (form.value.productSearch.length < 2) {
    productResults.value = [];
    return;
  }
  if (!form.value.data_retirada || !form.value.data_devolucao) {
    showToast("Selecione as datas de retirada e devolução primeiro", { type: "error" });
    return;
  }
  productResults.value = await ofetch("/api/producao/estoque/produtos-disponiveis", {
    params: {
      busca: form.value.productSearch,
      data_retirada: new Date(form.value.data_retirada).toISOString(),
      data_devolucao: new Date(form.value.data_devolucao).toISOString(),
    },
  });
};

const selectProduct = (prod: any) => {
  tempSelectedProduct.value = prod;
  form.value.productSearch = "";
  productResults.value = [];
  tempQuantidade.value = 1;
};

const addProductToList = () => {
  if (!tempSelectedProduct.value || tempQuantidade.value <= 0) return;
  if (tempQuantidade.value > tempSelectedProduct.value.qtd_disponivel) {
    showToast("Quantidade maior que disponível", { type: "error" });
    return;
  }
  selectedProducts.value.push({
    produto: tempSelectedProduct.value,
    quantidade: tempQuantidade.value,
  });
  tempSelectedProduct.value = null;
  tempQuantidade.value = 1;
};

const removeProduct = (index: number) => {
  selectedProducts.value.splice(index, 1);
};

const isFormValid = computed(() => {
  if (!selectedUser.value) return false;
  if (selectedProducts.value.length === 0) return false;
  if (!form.value.data_retirada || !form.value.data_devolucao) return false;
  return selectedProducts.value.every(
    (item) => item.quantidade > 0 && item.quantidade <= item.produto.qtd_disponivel
  );
});

const submit = async () => {
  if (!isFormValid.value) return;
  isLoading.value = true;
  try {
    for (const item of selectedProducts.value) {
      await ofetch("/api/producao/estoque/reserva", {
        method: "POST",
        body: {
          id_usuario: selectedUser.value.id,
          id_produto: item.produto.id,
          quantidade: item.quantidade,
          data_retirada: new Date(form.value.data_retirada).toISOString(),
          data_devolucao: form.value.data_devolucao
            ? new Date(form.value.data_devolucao).toISOString()
            : null,
        },
      });
    }
    showToast(`${selectedProducts.value.length} produto(s) reservado(s) com sucesso!`, {
      type: "success",
    });
    emit("saved");
    emit("close");
  } catch (e: any) {
    showToast("Erro ao criar reserva: " + e.message, { type: "error" });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-[#1A1B26] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="p-6 border-b border-white/5 flex justify-between items-center">
        <h3 class="text-lg font-bold text-white">Nova Reserva</h3>
        <button @click="emit('close')" class="text-secondary hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-6">
        <!-- User Selection -->
        <div>
          <label class="block text-xs font-bold text-secondary uppercase mb-2">Usuário</label>
          <div class="relative">
            <input
              v-model="form.userSearch"
              @input="searchUsers"
              type="text"
              class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none"
              placeholder="Buscar usuário por nome..."
            />
            <div v-if="userResults.length > 0" class="absolute z-10 w-full mt-1 bg-[#16161E] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              <div
                v-for="user in userResults"
                :key="user.id"
                @click="selectUser(user)"
                class="p-3 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0"
              >
                <div>
                  <div class="text-white text-sm font-bold">{{ user.nome }} {{ user.sobrenome }}</div>
                  <div class="text-secondary text-xs">{{ user.email }}</div>
                </div>
                <div class="text-[10px] uppercase font-bold bg-white/10 px-2 py-0.5 rounded text-secondary">{{ user.papel }}</div>
              </div>
            </div>
          </div>
          <div v-if="selectedUser" class="mt-2 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg p-2">
            <div class="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
              {{ selectedUser.nome.charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm font-bold text-white">{{ selectedUser.nome }} {{ selectedUser.sobrenome }}</span>
            <button @click="clearUser" class="ml-auto text-secondary hover:text-white text-xs">Alterar</button>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
          <div>
            <label class="block text-xs font-bold text-secondary uppercase mb-2">Data Retirada (Prev)</label>
            <input v-model="form.data_retirada" type="datetime-local" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white/70 focus:border-primary/50 focus:outline-none text-sm" @change="searchProdutos" />
          </div>
          <div>
            <label class="block text-xs font-bold text-secondary uppercase mb-2">Data Devolução (Prev)</label>
            <input v-model="form.data_devolucao" type="datetime-local" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white/70 focus:border-primary/50 focus:outline-none text-sm" @change="searchProdutos" />
          </div>
        </div>

        <!-- Product Selection -->
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="block text-xs font-bold text-secondary uppercase mb-2">Produto</label>
            <div class="relative">
              <input
                v-model="form.productSearch"
                @input="searchProdutos"
                type="text"
                class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Buscar produto..."
                :disabled="!form.data_retirada || !form.data_devolucao"
              />
              <div v-if="productResults.length > 0" class="absolute z-10 w-full mt-1 bg-[#16161E] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                <div
                  v-for="prod in productResults"
                  :key="prod.id"
                  @click="selectProduct(prod)"
                  class="p-2 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0"
                >
                  <div class="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                    <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20,6H12L10,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8A2,2 0 0,0 20,6M20,18H4V6H9.17L11.17,8H20V18M6,12H18V14H6V12Z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <div class="text-white text-sm font-bold">{{ prod.nome }}</div>
                    <div class="text-secondary text-xs">Disp: {{ prod.qtd_disponivel }}</div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Temp Selected Product -->
            <div v-if="tempSelectedProduct" class="mt-2 space-y-2">
              <div class="flex items-center gap-2 rounded-lg p-2 border"
                :class="tempSelectedProduct.qtd_disponivel > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'">
                <div class="w-10 h-10 rounded flex items-center justify-center"
                  :class="tempSelectedProduct.qtd_disponivel > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'">
                  <svg class="w-6 h-6" :class="tempSelectedProduct.qtd_disponivel > 0 ? 'text-emerald-500' : 'text-red-500'" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20,6H12L10,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8A2,2 0 0,0 20,6M20,18H4V6H9.17L11.17,8H20V18M6,12H18V14H6V12Z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-bold" :class="tempSelectedProduct.qtd_disponivel > 0 ? 'text-emerald-500' : 'text-red-500'">
                    {{ tempSelectedProduct.nome }}
                  </div>
                  <div class="text-xs text-secondary">Disponível: <span class="font-bold text-white">{{ tempSelectedProduct.qtd_disponivel }}</span></div>
                </div>
              </div>
              <div class="flex gap-2">
                <div class="flex-1">
                  <input v-model.number="tempQuantidade" type="number" min="1" :max="tempSelectedProduct.qtd_disponivel"
                    class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary/50 focus:outline-none" placeholder="Qtd" />
                </div>
                <button @click="addProductToList" :disabled="tempQuantidade <= 0 || tempQuantidade > tempSelectedProduct.qtd_disponivel"
                  class="px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all">
                  Adicionar à Reserva
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Products List (Cart) -->
        <div v-if="selectedProducts.length > 0" class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-white uppercase">Produtos a Reservar</h4>
            <span class="text-xs text-secondary bg-white/5 px-2 py-0.5 rounded">{{ selectedProducts.length }} item(ns)</span>
          </div>
          <div class="space-y-2">
            <div v-for="(item, idx) in selectedProducts" :key="idx"
              class="flex items-center gap-2 p-2 bg-black/30 border border-white/10 rounded-lg hover:border-primary/30 transition-all">
              <div class="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20,6H12L10,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8A2,2 0 0,0 20,6M20,18H4V6H9.17L11.17,8H20V18M6,12H18V14H6V12Z" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="text-sm font-bold text-white">{{ item.produto.nome }}</div>
                <div class="text-xs text-secondary">Quantidade: {{ item.quantidade }}</div>
              </div>
              <button @click="removeProduct(idx)"
                class="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all" title="Remover">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-white/5 flex justify-end gap-3">
        <button @click="emit('close')" class="px-4 py-2 text-secondary hover:text-white transition-colors text-sm font-bold">Cancelar</button>
        <button @click="submit" :disabled="!isFormValid || isLoading"
          class="px-6 py-2 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
          :class="!isFormValid ? 'bg-white/10 text-secondary cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'">
          <svg v-if="isLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Confirmar Reserva
        </button>
      </div>
    </div>
  </div>
</template>
