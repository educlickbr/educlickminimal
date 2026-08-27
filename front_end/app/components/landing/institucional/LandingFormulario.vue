<template>
    <section id="contato" class="relative px-6 md:px-16 py-24 md:py-32">
        <div class="absolute inset-0 bg-[#181820]" />
        <div class="relative z-10">

        <div class="max-w-2xl mx-auto">
            <div class="text-center mb-12">
                <span
                    class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 inline-block">
                    Contato
                </span>
                <h2 class="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4">
                    Inicie o Contato
                </h2>
                <p class="text-secondary text-sm max-w-md mx-auto">
                    Conte qual é o cenário atual da sua escola. Vamos desenhar juntos
                    o próximo passo.
                </p>
            </div>

            <form
                @submit.prevent="submitLead"
                class="space-y-5"
            >
                <!-- Nome -->
                <div class="flex flex-col gap-1.5">
                    <label for="personName" class="text-[10px] font-bold uppercase tracking-wider text-secondary">
                        Seu nome
                    </label>
                    <input
                        id="personName"
                        v-model.trim="form.personName"
                        type="text"
                        placeholder="Ex: Maria Silva"
                        required
                        class="w-full rounded-lg px-4 py-3 text-sm"
                    />
                </div>

                <!-- Empresa -->
                <div class="flex flex-col gap-1.5">
                    <label for="companyName" class="text-[10px] font-bold uppercase tracking-wider text-secondary">
                        Nome da instituição
                    </label>
                    <input
                        id="companyName"
                        v-model.trim="form.companyName"
                        type="text"
                        placeholder="Ex: Escola Exemplo"
                        required
                        class="w-full rounded-lg px-4 py-3 text-sm"
                    />
                </div>

                <!-- Email -->
                <div class="flex flex-col gap-1.5">
                    <label for="email" class="text-[10px] font-bold uppercase tracking-wider text-secondary">
                        E-mail para retorno
                    </label>
                    <input
                        id="email"
                        v-model.trim="form.email"
                        type="email"
                        placeholder="maria@escolaexemplo.com"
                        required
                        class="w-full rounded-lg px-4 py-3 text-sm"
                    />
                </div>

                <!-- Mensagem -->
                <div class="flex flex-col gap-1.5">
                    <label for="message" class="text-[10px] font-bold uppercase tracking-wider text-secondary">
                        Qual o cenário atual?
                    </label>
                    <textarea
                        id="message"
                        v-model.trim="form.message"
                        rows="4"
                        placeholder="Descreva brevemente como a escola opera hoje e o que precisa ser resolvido..."
                        required
                        class="w-full rounded-lg px-4 py-3 text-sm resize-none"
                    />
                </div>

                <!-- Feedback -->
                <p
                    v-if="feedback.message"
                    :class="[
                        feedback.type === 'success'
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-red-400 bg-red-500/10 border border-red-500/20',
                        'text-xs rounded-lg px-4 py-3 font-bold',
                    ]"
                >
                    {{ feedback.message }}
                </p>

                <!-- Submit -->
                <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full bg-primary text-white font-black text-sm uppercase tracking-wider px-8 py-4 rounded-xl transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-none"
                    style="box-shadow: 5px 5px 0 #4c1d95;"
                >
                    <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
                        <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                    </span>
                    <span v-else>Enviar</span>
                </button>
            </form>
        </div>
        </div>
    </section>
</template>

<script setup lang="ts">
const form = reactive({
    personName: "",
    companyName: "",
    email: "",
    message: "",
});

const isSubmitting = ref(false);
const feedback = reactive<{ type: "success" | "error"; message: string }>({
    type: "success",
    message: "",
});

const submitLead = async () => {
    if (isSubmitting.value) return;

    feedback.message = "";
    isSubmitting.value = true;

    try {
        await $fetch("/api/odoo-lead", {
            method: "POST",
            body: {
                personName: form.personName,
                companyName: form.companyName,
                email: form.email,
                message: form.message,
            },
        });

        feedback.type = "success";
        feedback.message = "Recebido! Seu contato foi enviado para nosso CRM com sucesso.";

        form.personName = "";
        form.companyName = "";
        form.email = "";
        form.message = "";
    } catch (error) {
        const defaultMsg = "Não foi possível enviar agora. Tente novamente em instantes.";
        feedback.type = "error";
        feedback.message = (error as { data?: { message?: string } })?.data?.message ?? defaultMsg;
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
/* SFC Style */
</style>
