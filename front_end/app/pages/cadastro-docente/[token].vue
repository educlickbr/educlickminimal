<script setup lang="ts">
import { ref } from "vue";

definePageMeta({ layout: false });

const route = useRoute();
const token = route.params.token as string;

// IDs fixos das perguntas globais (mesmo do ModalDocente)
const PERGUNTAS = {
    cpf: "05c0186e-af01-4220-8031-383c8611c4fa",
    data_nascimento: "ebf7837b-545e-45a7-ac0d-55d7b235a2c2",
    cep: "a918d49a-8ac2-4796-a656-4181897a00d1",
    endereco: "745b61c2-161d-4cbb-af1c-e9065d3362f2",
    numero: "1eebb87e-ec33-4155-be21-cc50f85d7fc5",
    complemento: "23a6698e-8e01-4d58-965e-f927b2fb3d31",
    bairro: "b30fee6d-29b4-4bf9-8569-2a141150d10e",
    cidade: "9b638554-16c5-4a1a-aed8-755d85849c6c",
    estado: "44b8bfef-6ad1-4a18-8f5c-83949895f44f",
};

const form = ref({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    cpf: "",
    data_nascimento: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
});

const step = ref<"form" | "loading" | "erro">("form");
const errorMsg = ref("");

const supabase = useSupabaseClient();

// Busca CEP
async function buscarCep() {
    const cep = form.value.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
        const res: any = await $fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!res.erro) {
            form.value.endereco = res.logradouro || form.value.endereco;
            form.value.bairro = res.bairro || form.value.bairro;
            form.value.cidade = res.localidade || form.value.cidade;
            form.value.estado = res.uf || form.value.estado;
        }
    } catch { /* silencioso */ }
}

// Máscaras
function mascaraCpf(v: string) {
    return v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function mascaraCep(v: string) {
    return v.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2");
}

async function handleSubmit() {
    errorMsg.value = "";

    // Validações
    if (!form.value.nome.trim()) { errorMsg.value = "Nome completo é obrigatório."; return; }
    if (!form.value.email.trim()) { errorMsg.value = "Email é obrigatório."; return; }
    if (!form.value.senha || form.value.senha.length < 6) { errorMsg.value = "Senha deve ter no mínimo 6 caracteres."; return; }
    if (form.value.senha !== form.value.confirmarSenha) { errorMsg.value = "Senhas não conferem."; return; }

    step.value = "loading";

    try {
        // 1. Cria conta no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: form.value.email.trim(),
            password: form.value.senha,
            options: { data: { nome: form.value.nome.trim() } },
        });

        if (authError) {
            errorMsg.value = authError.message;
            step.value = "form";
            return;
        }

        const userIdFromAuth = authData.user?.id;
        if (!userIdFromAuth) {
            errorMsg.value = "Erro ao criar conta. Tente novamente.";
            step.value = "form";
            return;
        }

        // 2. Completa o cadastro (user_expandido + respostas + docente)
        const respostas: Record<string, string> = {};
        if (form.value.cpf) respostas[PERGUNTAS.cpf] = form.value.cpf;
        if (form.value.data_nascimento) respostas[PERGUNTAS.data_nascimento] = form.value.data_nascimento;
        if (form.value.cep) respostas[PERGUNTAS.cep] = form.value.cep;
        if (form.value.endereco) respostas[PERGUNTAS.endereco] = form.value.endereco;
        if (form.value.numero) respostas[PERGUNTAS.numero] = form.value.numero;
        if (form.value.complemento) respostas[PERGUNTAS.complemento] = form.value.complemento;
        if (form.value.bairro) respostas[PERGUNTAS.bairro] = form.value.bairro;
        if (form.value.cidade) respostas[PERGUNTAS.cidade] = form.value.cidade;
        if (form.value.estado) respostas[PERGUNTAS.estado] = form.value.estado;

        const res = await $fetch("/api/public/completar-cadastro-docente", {
            method: "POST",
            body: {
                token,
                nome: form.value.nome.trim(),
                respostas,
                id_user_expandido: userIdFromAuth,
            },
        });

        // Vai direto pra home (signUp já logou automático)
        await navigateTo("/", { replace: true });
    } catch (e: any) {
        errorMsg.value = e?.message || "Erro ao finalizar cadastro.";
        step.value = "form";
    }
}
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0c] text-white font-sans">
        <!-- Header -->
        <header class="sticky top-0 z-50 bg-[#0f0f17]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
            <div class="max-w-3xl mx-auto flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Icon name="ph:graduation-cap-fill" class="w-5 h-5 text-white" />
                </div>
                <span class="text-xs font-black text-text uppercase tracking-[0.2em]">
                    EduClick — Cadastro Docente
                </span>
            </div>
        </header>

        <main class="max-w-3xl mx-auto px-6 py-12">

            <!-- Formulário -->
            <div class="bg-[#0f0f17] border border-white/5 rounded-xl p-8">
                <div class="mb-8">
                    <h1 class="text-xl font-black mb-2">Cadastro de Docente</h1>
                    <p class="text-sm text-secondary/60">
                        Preencha seus dados e crie sua senha para acessar o sistema.
                    </p>
                </div>

                <form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
                    <!-- Nome + Email -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Nome completo *</label>
                            <input v-model="form.nome" type="text" placeholder="Seu nome" class="field-input" required />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Email *</label>
                            <input v-model="form.email" type="email" placeholder="seu@email.com" class="field-input" required />
                        </div>
                    </div>

                    <!-- Senha + Confirmar -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Senha *</label>
                            <input v-model="form.senha" type="password" placeholder="Mínimo 6 caracteres" class="field-input" required minlength="6" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Confirmar Senha *</label>
                            <input v-model="form.confirmarSenha" type="password" placeholder="Repita a senha" class="field-input" required />
                        </div>
                    </div>

                    <hr class="border-white/5" />

                    <!-- CPF + Data -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">CPF</label>
                            <input :value="mascaraCpf(form.cpf)" @input="form.cpf = mascaraCpf(($event.target as HTMLInputElement).value)" type="text" placeholder="000.000.000-00" maxlength="14" class="field-input" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Data de Nascimento</label>
                            <input v-model="form.data_nascimento" type="date" class="field-input" />
                        </div>
                    </div>

                    <!-- CEP -->
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">CEP</label>
                        <div class="flex gap-2">
                            <input :value="mascaraCep(form.cep)" @input="form.cep = mascaraCep(($event.target as HTMLInputElement).value); if (form.cep.length === 9) buscarCep()" type="text" placeholder="00000-000" maxlength="9" class="field-input flex-1" />
                            <button @click="buscarCep" type="button" class="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all">Buscar</button>
                        </div>
                    </div>

                    <!-- Endereço + Número -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="md:col-span-2 flex flex-col gap-1.5">
                            <label class="field-label">Endereço</label>
                            <input v-model="form.endereco" type="text" placeholder="Rua / Avenida..." class="field-input" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Número</label>
                            <input v-model="form.numero" type="text" placeholder="Ex: 123" class="field-input" />
                        </div>
                    </div>

                    <!-- Complemento + Bairro -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Complemento</label>
                            <input v-model="form.complemento" type="text" placeholder="Apto, Bloco, Casa..." class="field-input" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Bairro</label>
                            <input v-model="form.bairro" type="text" placeholder="Nome do bairro" class="field-input" />
                        </div>
                    </div>

                    <!-- Cidade + Estado -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Cidade</label>
                            <input v-model="form.cidade" type="text" placeholder="Nome da cidade" class="field-input" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="field-label">Estado (UF)</label>
                            <input v-model="form.estado" type="text" placeholder="Ex: SP" maxlength="2" class="field-input" />
                        </div>
                    </div>

                    <!-- Erro -->
                    <div v-if="errorMsg" class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                        {{ errorMsg }}
                    </div>

                    <!-- Submit -->
                    <button type="submit" :disabled="step === 'loading'" class="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                        <div v-if="step === 'loading'" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Criar Conta e Cadastrar</span>
                    </button>
                </form>
            </div>
        </main>

        <footer class="border-t border-white/5 py-8 text-center">
            <p class="text-[10px] text-secondary/30 font-black tracking-[0.3em] uppercase">EduClick :: Min</p>
        </footer>
    </div>
</template>

<style scoped>
.field-label {
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(140, 135, 141, 0.6);
}
.field-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 9px;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 700;
    color: rgba(232, 230, 240, 0.9);
    outline: none;
    transition: all 0.15s ease;
}
.field-input:focus {
    border-color: rgba(139, 92, 246, 0.45);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.field-input::placeholder { color: rgba(255, 255, 255, 0.22); }
</style>
