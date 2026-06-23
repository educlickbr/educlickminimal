<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "~~/stores/app";

const route = useRoute();
const store = useAppStore();

const idInscricao = (route.query.id_inscricao as string) || "";
const loading = ref(true);
const inscricao = ref<any>(null);
const erro = ref("");

onMounted(async () => {
    await store.initSession();

    if (!idInscricao || !store.user_expandido_id) {
        erro.value = "Acesso inválido.";
        loading.value = false;
        return;
    }

    try {
        const res = (await $fetch("/api/form/inscricao", {
            params: { id_inscricao: idInscricao },
        })) as any;

        if (res?.inscricao) {
            inscricao.value = res.inscricao;
        } else {
            erro.value = "Inscrição não encontrada.";
        }
    } catch {
        erro.value = "Erro ao carregar dados da inscrição.";
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div
        class="min-h-screen bg-[#0a0a0c] text-white font-sans flex items-center justify-center"
    >
        <!-- Loading -->
        <div v-if="loading" class="text-center">
            <div
                class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin mx-auto mb-4"
            />
            <p
                class="text-xs text-secondary/40 font-bold uppercase tracking-widest"
            >
                Verificando inscrição...
            </p>
        </div>

        <!-- Erro -->
        <div v-else-if="erro" class="text-center max-w-sm">
            <div
                class="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6"
            >
                <span class="text-3xl">✕</span>
            </div>
            <p class="text-sm font-bold text-red-400 mb-2">Acesso inválido</p>
            <p class="text-xs text-secondary/40">{{ erro }}</p>
        </div>

        <!-- Sucesso -->
        <div v-else class="text-center max-w-md px-6">
            <!-- Animação de check -->
            <div
                class="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-8 animate-bounce-in"
            >
                <svg
                    class="w-12 h-12 text-green-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M20 6L9 17l-5-5" class="animate-draw-check" />
                </svg>
            </div>

            <h1
                class="text-2xl font-black uppercase tracking-widest mb-3 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent"
            >
                Inscrição Finalizada!
            </h1>

            <p class="text-sm text-secondary/60 mb-8 leading-relaxed">
                Sua inscrição foi registrada com sucesso. Acompanhe o status
                pelo painel do candidato.
            </p>

            <div
                class="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-8 inline-block"
            >
                <p
                    class="text-[9px] text-secondary/40 uppercase font-bold tracking-widest mb-1"
                >
                    ID da Inscrição
                </p>
                <p class="text-xs text-white/60 font-mono">{{ idInscricao }}</p>
            </div>

            <div class="flex flex-col gap-3">
                <NuxtLink
                    to="/"
                    class="px-8 py-3 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] text-white text-xs font-black uppercase tracking-widest hover:from-[#6d28d9] hover:to-[#7c3aed] transition-all shadow-lg shadow-purple-500/20"
                >
                    Ir para o Início
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes bounce-in {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    60% {
        transform: scale(1.1);
        opacity: 1;
    }
    100% {
        transform: scale(1);
    }
}
.animate-bounce-in {
    animation: bounce-in 0.5s ease-out;
}

@keyframes draw-check {
    0% {
        stroke-dasharray: 30;
        stroke-dashoffset: 30;
    }
    100% {
        stroke-dasharray: 30;
        stroke-dashoffset: 0;
    }
}
.animate-draw-check {
    animation: draw-check 0.6s ease-out 0.3s both;
}
</style>
