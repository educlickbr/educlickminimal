<template>
    <div class="min-h-screen bg-[#0a0a0c] text-white font-sans">
        <header class="border-b border-white/5">
            <div class="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
                <NuxtLink
                    to="/oferta"
                    class="text-xs font-bold text-secondary/50 hover:text-white transition-colors"
                    >← Voltar</NuxtLink
                >
                <div
                    class="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center ml-auto"
                >
                    <span class="text-white text-[8px] font-black">EC</span>
                </div>
                <span class="text-sm font-bold text-white">EduClick</span>
            </div>
        </header>

        <main class="max-w-lg mx-auto px-6 py-12">
            <div v-if="isLoading" class="flex justify-center py-20">
                <div
                    class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
                />
            </div>

            <div v-else-if="erro && !oferta" class="text-center py-20">
                <p class="text-red-400 font-bold mb-4">{{ erro }}</p>
                <NuxtLink
                    to="/oferta"
                    class="text-xs font-bold text-primary hover:text-primary/80"
                    >Ver cursos disponíveis</NuxtLink
                >
            </div>

            <div v-else-if="pedidoStatus === 'concluido'" class="text-center">
                <div
                    class="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        class="text-green-400"
                    >
                        <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>
                <h1 class="text-2xl font-black mb-2">Matrícula Confirmada!</h1>
                <p class="text-sm text-secondary/60 mb-8">
                    Sua matrícula foi realizada com sucesso.
                </p>
                <NuxtLink
                    to="/meus-processos"
                    class="inline-block px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                >
                    Ver Meus Cursos
                </NuxtLink>
            </div>

            <div v-else-if="oferta">
                <CheckoutResumo
                    :oferta="oferta"
                    :valor-formatado="valorFormatado"
                    :is-gratuito="isGratuito"
                >
                    <template #actions>
                        <div class="mt-6">
                            <p
                                v-if="erro"
                                class="text-red-400 text-xs font-bold mb-4"
                            >
                                {{ erro }}
                            </p>
                            <button
                                :disabled="processando"
                                @click="confirmarMatricula"
                                class="w-full py-4 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {{
                                    processando
                                        ? isGratuito
                                            ? "Confirmando..."
                                            : "Redirecionando..."
                                        : isGratuito
                                          ? "Confirmar Matrícula"
                                          : `Ir para Pagamento - ${valorFormatado}`
                                }}
                            </button>
                            <p
                                v-if="isGratuito"
                                class="text-[10px] text-secondary/40 text-center mt-3"
                            >
                                Você não será cobrado(a) por esta matrícula.
                            </p>
                        </div>
                    </template>
                </CheckoutResumo>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "~~/stores/app";
import { useCheckout } from "~/composables/checkout/useCheckout";
import CheckoutResumo from "~/components/checkout/CheckoutResumo.vue";

definePageMeta({ layout: false });

const route = useRoute();
const store = useAppStore();
const slug = route.params.slug as string;

const {
    oferta,
    isLoading,
    pedidoStatus,
    erro,
    processando,
    isGratuito,
    valorFormatado,
    fetchOferta,
    confirmarMatricula,
} = useCheckout(slug);

onMounted(async () => {
    if (!store.initialized) await store.initSession();
    fetchOferta();
});
</script>
