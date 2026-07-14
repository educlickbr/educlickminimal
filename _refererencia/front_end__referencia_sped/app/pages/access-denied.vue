<script setup lang="ts">
const router = useRouter();
const timer = ref(5);

onMounted(() => {
    const interval = setInterval(() => {
        timer.value--;
        if (timer.value <= 0) {
            clearInterval(interval);
            // Redirect back or home
            if (window.history.length > 1) {
                router.back();
            } else {
                router.push('/');
            }
        }
    }, 1000);
});
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-[#1a1b26] p-4 font-sans text-white">
        <div class="max-w-md w-full text-center space-y-6">
            <!-- Icon -->
            <div class="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>

            <!-- Text -->
            <div class="space-y-2">
                <h1 class="text-2xl font-black uppercase tracking-wider text-white">Acesso Negado</h1>
                <p class="text-secondary">Você não tem permissão para acessar esta página.</p>
            </div>

            <!-- Timer -->
            <div class="bg-white/5 rounded-lg p-4 border border-white/5">
                <p class="text-sm text-secondary">
                    Você será redirecionado em <span class="text-white font-bold">{{ timer }}</span> segundos...
                </p>
            </div>

            <!-- Button -->
            <button @click="router.push('/')" class="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold uppercase tracking-wider transition-all">
                Voltar ao Início Agora
            </button>
        </div>
    </div>
</template>
