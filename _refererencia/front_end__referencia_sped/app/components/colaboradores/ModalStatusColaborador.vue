<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

const props = defineProps<{
    isOpen: boolean;
    colaborador: any;
}>();

const emit = defineEmits(["close", "confirm"]);
const { showToast } = useToast();
const isLoading = ref(false);

const localStatus = ref(false);

watch(
    () => props.colaborador,
    (newVal) => {
        if (newVal) {
            localStatus.value = newVal.status;
        }
    },
    { immediate: true },
);

const handleConfirm = async () => {
    isLoading.value = true;
    try {
        await ofetch("/api/colaboradores/update-status", {
            method: "POST",
            body: {
                id: props.colaborador.id,
                status: localStatus.value,
            },
        });

        showToast("Status atualizado com sucesso!", { type: "success" });
        emit("confirm");
        emit("close");
    } catch (e: any) {
        console.error("Erro ao atualizar status:", e);
        showToast("Erro ao atualizar status.", { type: "error" });
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
                    <div
                        class="w-1.5 h-1.5 rounded-full"
                        :class="localStatus ? 'bg-green-500' : 'bg-red-500'"
                    ></div>
                    Alterar Status
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
                <div class="flex items-center gap-3">
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
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            ></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-white">
                            {{ colaborador?.nome }} {{ colaborador?.sobrenome }}
                        </p>
                        <p class="text-[10px] text-secondary">
                            {{ colaborador?.email }}
                        </p>
                    </div>
                </div>

                <div class="bg-white/5 rounded-lg p-4 border border-white/5">
                    <p class="text-xs text-secondary mb-3 font-medium">
                        Situação da conta:
                    </p>

                    <label
                        class="flex items-center justify-between cursor-pointer group"
                    >
                        <span
                            class="text-sm font-bold transition-colors"
                            :class="
                                localStatus ? 'text-green-400' : 'text-red-400'
                            "
                        >
                            {{ localStatus ? "CONTA ATIVA" : "CONTA INATIVA" }}
                        </span>

                        <div class="relative">
                            <input
                                type="checkbox"
                                v-model="localStatus"
                                class="sr-only"
                            />
                            <div
                                class="w-10 h-6 bg-white/10 rounded-full transition-colors group-hover:bg-white/20"
                                :class="{
                                    '!bg-green-500/20': localStatus,
                                    '!bg-red-500/20': !localStatus,
                                }"
                            ></div>
                            <div
                                class="absolute left-1 top-1 w-4 h-4 bg-secondary rounded-full transition-transform duration-200"
                                :class="{
                                    'translate-x-4 !bg-green-500': localStatus,
                                    '!bg-red-500': !localStatus,
                                }"
                            ></div>
                        </div>
                    </label>
                    <p class="text-[10px] text-secondary mt-3">
                        {{
                            localStatus
                                ? "O usuário terá acesso normal ao sistema conforme seu perfil."
                                : "O usuário perderá acesso imediato ao sistema."
                        }}
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
                    Confirmar
                </button>
            </div>
        </div>
    </div>
</template>
