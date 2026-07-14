<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

const props = defineProps<{
    isOpen: boolean;
    colaborador: any;
}>();

const emit = defineEmits(["close", "confirm"]);
const { showToast } = useToast();
const client = useSupabaseClient();
const isLoading = ref(false);
const isFetchingRoles = ref(false);

const roles = ref<any[]>([]);
const selectedRole = ref<string>("");

onMounted(async () => {
    fetchRoles();
});

const fetchRoles = async () => {
    isFetchingRoles.value = true;
    try {
        const { data, error } = await (client.rpc as any)("nxt_get_papeis");
        if (error) throw error;
        const excludedRoles = ["estudante", "candidato", "admin"];
        roles.value = (data || []).filter(
            (r: any) => !excludedRoles.includes(r.nome),
        );
    } catch (e) {
        console.error("Erro ao buscar papeis:", e);
    } finally {
        isFetchingRoles.value = false;
    }
};

watch(
    () => props.colaborador,
    (newVal) => {
        if (newVal) {
            selectedRole.value = newVal.papel_id;
        }
    },
    { immediate: true },
);

const handleConfirm = async () => {
    if (!selectedRole.value) {
        showToast("Selecione um papel.", { type: "info" });
        return;
    }

    isLoading.value = true;
    try {
        await ofetch("/api/colaboradores/update-role", {
            method: "POST",
            body: {
                id: props.colaborador.id,
                papel_id: selectedRole.value,
            },
        });

        showToast("Papel atualizado com sucesso!", { type: "success" });
        emit("confirm");
        emit("close");
    } catch (e: any) {
        console.error("Erro ao atualizar papel:", e);
        showToast("Erro ao atualizar papel.", { type: "error" });
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
        <div
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            @click="$emit('close')"
        ></div>

        <div
            class="relative bg-div-15 border border-white/10 rounded-xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl"
        >
            <div
                class="p-4 border-b border-white/5 flex items-center justify-between bg-[#1A1A24]"
            >
                <h3
                    class="text-sm font-bold text-white flex items-center gap-2"
                >
                    <svg
                        class="w-4 h-4 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        ></path>
                    </svg>
                    Trocar Papel
                </h3>
                <button
                    @click="$emit('close')"
                    class="text-secondary hover:text-white transition-colors"
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
                            d="M6 18L18 6M6 6l12 12"
                        ></path>
                    </svg>
                </button>
            </div>

            <div class="p-6 flex flex-col gap-6">
                <div class="flex items-center gap-3 mb-2">
                    <div
                        class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-secondary"
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-white">
                            {{ colaborador?.nome }} {{ colaborador?.sobrenome }}
                        </p>
                        <p class="text-[10px] text-secondary">
                            Papel Atual: {{ colaborador?.nome_papel }}
                        </p>
                    </div>
                </div>

                <div>
                    <label class="text-xs font-bold text-secondary mb-2 block"
                        >Selecione o Novo Papel</label
                    >
                    <div class="relative">
                        <select
                            v-model="selectedRole"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none"
                            :disabled="isFetchingRoles"
                        >
                            <option value="" disabled>Selecione...</option>
                            <option
                                v-for="role in roles"
                                :key="role.id"
                                :value="role.id"
                            >
                                {{ role.nome }}
                            </option>
                        </select>
                        <div class="absolute right-3 top-3 pointer-events-none">
                            <svg
                                class="w-3 h-3 text-secondary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7"
                                ></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div
                    class="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3"
                >
                    <p class="text-[10px] text-yellow-500 leading-relaxed">
                        <span class="font-bold">Atenção:</span> Alterar o papel
                        mudará as permissões de acesso deste usuário
                        imediatamente.
                    </p>
                </div>
            </div>

            <div
                class="p-4 border-t border-white/5 bg-[#1A1A24] flex justify-end gap-2"
            >
                <button
                    @click="$emit('close')"
                    class="px-4 py-2 rounded-lg text-xs font-bold text-secondary hover:text-white hover:bg-white/5 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    @click="handleConfirm"
                    :disabled="isLoading"
                    class="px-4 py-2 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    <svg
                        v-if="isLoading"
                        class="animate-spin w-3 h-3"
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
                    Confirmar Troca
                </button>
            </div>
        </div>
    </div>
</template>
