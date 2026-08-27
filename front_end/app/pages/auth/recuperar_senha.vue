<script setup lang="ts">
import { useToast } from "~/composables/useToast";
const supabase = useSupabaseClient();
const router = useRouter();
import { useAppStore } from "~~/stores/app";
const store = useAppStore();
const { showToast } = useToast();

// Aplica o tema/branding da entidade (via BFF) quando deslogado;
// se não houver entidade resolvida, respeita a preferência manual.
onMounted(async () => {
    const { aplicarTemaDaEntidadePublica } = useTemaEntidade();
    const aplicouEntidade = await aplicarTemaDaEntidadePublica();
    if (!aplicouEntidade) store.initTheme();
});
const email = ref("");
const loading = ref(false);

const handleRecover = async () => {
    if (!email.value) {
        showToast("Por favor, informe seu e-mail.", { type: "error" });
        return;
    }

    loading.value = true;
    try {
        // Assume URL base is configured correctly in Supabase or using window.location.origin
        const redirectTo = `${window.location.origin}/auth/trocar_senha`;

        const { error } = await supabase.auth.resetPasswordForEmail(
            email.value,
            {
                redirectTo: redirectTo,
            },
        );

        if (error) throw error;

        store.setStatusMessage({
            title: "Verifique seu E-mail",
            message: `Enviamos um link de recuperação para ${email.value}. Clique no link para criar uma nova senha.`,
            type: "success",
            actionLabel: "Voltar ao Login",
            actionPath: "/auth/login",
        });

        router.push("/mensagem");
    } catch (err: any) {
        console.error("Recover error:", err);
        showToast(err.message || "Erro ao enviar e-mail de recuperação.", {
            type: "error",
        });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div
        class="min-h-screen flex items-center justify-center bg-background p-6 font-sans relative overflow-hidden"
    >
        <!-- Background Accents -->
        <div class="absolute inset-0 pointer-events-none">
            <div
                class="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[180px]"
            ></div>
            <div
                class="absolute bottom-[0%] right-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]"
            ></div>
        </div>

        <div class="w-full max-w-md relative z-10">
            <!-- Card -->
            <div
                class="bg-div-15 backdrop-blur-2xl border border-divider rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
            >
                <div class="flex flex-col items-center mb-8">
                    <h1
                        class="text-2xl font-black text-text uppercase tracking-[0.2em] text-center"
                    >
                        Recuperar Senha
                    </h1>
                    <p
                        class="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-2 text-center"
                    >
                        Informe seu e-mail para receber o link
                    </p>
                </div>

                <form @submit.prevent="handleRecover" class="space-y-6">
                    <div class="space-y-2">
                        <label
                            for="email"
                            class="text-[10px] font-black uppercase tracking-widest text-secondary/60 ml-1"
                            >E-mail</label
                        >
                        <div class="relative group">
                            <input
                                v-model="email"
                                type="email"
                                id="email"
                                required
                                placeholder="seu@email.com"
                                class="w-full bg-field border border-field-border rounded-2xl px-5 py-4 text-sm font-bold text-field-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:field-placeholder group-hover:border-field-border"
                            />
                            <div
                                class="absolute right-5 top-1/2 -translate-y-1/2 text-field-placeholder group-focus-within:text-primary transition-colors"
                            >
                                <svg
                                    class="w-5 h-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                                    ></path>
                                    <polyline
                                        points="22,6 12,13 2,6"
                                    ></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        :disabled="loading"
                        class="w-full bg-primary text-white font-black py-5 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <span
                            v-if="loading"
                            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        ></span>
                        {{ loading ? "Enviando..." : "Enviar Link" }}
                    </button>
                </form>

                <div class="mt-8 text-center space-y-4">
                    <NuxtLink
                        to="/auth/login"
                        class="inline-block text-[10px] font-black uppercase tracking-widest text-secondary/60 hover:text-text transition-colors"
                    >
                        ← Voltar para Login
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* SFC Style */
</style>
