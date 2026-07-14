<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

definePageMeta({
    layout: false,
});

const { showToast } = useToast();
const router = useRouter();

// Form State
const formData = ref({
    nome_grupo: "",
    email_contato: "",
    redes_sociais: "",
    nome_empresa: "",
    razao_social: "",
    cnpj: "",
    telefone_fixo: "",
    telefone_celular: "",
    regiao_administrativa: "",
    endereco: "",
    numero: "",
    complemento: "",
    cep: "",
    cidade: "",
    banco: "",
    agencia: "",
    conta_corrente: "",
    pix: "",
});

const isSubmitting = ref(false);

// Active block (tabs)
const activeBlock = ref("cadastral");
const blocks = ["cadastral", "endereco", "bancario"];

const formatBlockName = (name: string) => {
    const names: Record<string, string> = {
        cadastral: "Dados Cadastrais",
        endereco: "Endereço",
        bancario: "Dados Bancários",
    };
    return names[name] || name;
};

const handleSubmit = async () => {
    // Validate required fields
    if (!formData.value.nome_grupo || !formData.value.email_contato) {
        showToast("Preencha os campos obrigatórios: Nome do Grupo e E-mail", {
            type: "error",
            duration: 6000,
        });
        return;
    }

    isSubmitting.value = true;
    try {
        const result: any = await ofetch("/api/jnpta/grupos", {
            method: "POST",
            body: formData.value,
        });

        if (result && result.ok) {
            showToast("Grupo criado com sucesso!", { type: "success" });
            router.push(`/jnpta/${result.id_grupo}`);
        } else {
            throw new Error("Erro ao criar grupo");
        }
    } catch (err: any) {
        console.error("Error creating grupo:", err);
        showToast(
            err.data?.statusMessage || "Erro ao criar grupo. Tente novamente.",
            { type: "error", duration: 6000 },
        );
    } finally {
        isSubmitting.value = false;
    }
};

const handleCancel = () => {
    router.push("/jnpta");
};
</script>

<template>
    <NuxtLayout name="base">
        <div class="flex flex-col gap-8 pb-10">
            <!-- Header Section -->
            <div
                class="bg-div-15 rounded-lg p-4 md:p-8 border border-secondary/10 shadow-sm relative overflow-hidden"
            >
                <div
                    class="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"
                ></div>

                <div class="relative z-10">
                    <div class="mb-1.5 md:mb-2">
                        <span
                            class="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded"
                        >
                            JNPTA - Jornadas
                        </span>
                    </div>
                    <h1
                        class="text-xl md:text-3xl font-black text-text mb-2 leading-tight"
                    >
                        Novo Grupo
                    </h1>
                    <p
                        class="text-xs md:text-sm text-secondary leading-relaxed"
                    >
                        Preencha as informações do seu grupo de dança
                    </p>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div
                class="flex items-center gap-4 overflow-x-auto pb-4 border-b border-secondary/10"
            >
                <button
                    v-for="blockKey in blocks"
                    :key="blockKey"
                    @click="activeBlock = blockKey"
                    class="whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all duration-300 border"
                    :class="
                        activeBlock === blockKey
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-background text-secondary border-secondary/10 hover:bg-div-15'
                    "
                >
                    {{ formatBlockName(blockKey) }}
                </button>
            </div>

            <!-- Form -->
            <form
                @submit.prevent="handleSubmit"
                class="bg-background border border-secondary/10 rounded-lg p-6 md:p-8 shadow-sm"
            >
                <!-- Cadastral Block -->
                <div
                    v-show="activeBlock === 'cadastral'"
                    class="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div class="md:col-span-2">
                        <label
                            for="nome_grupo"
                            class="text-sm font-bold text-secondary"
                        >
                            Nome do Grupo <span class="text-primary">*</span>
                        </label>
                        <input
                            id="nome_grupo"
                            v-model="formData.nome_grupo"
                            type="text"
                            placeholder="Nome do Grupo"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="email_contato"
                            class="text-sm font-bold text-secondary"
                        >
                            E-mail de Contato
                            <span class="text-primary">*</span>
                        </label>
                        <input
                            id="email_contato"
                            v-model="formData.email_contato"
                            type="email"
                            placeholder="email@exemplo.com"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="redes_sociais"
                            class="text-sm font-bold text-secondary"
                            >Redes Sociais</label
                        >
                        <input
                            id="redes_sociais"
                            v-model="formData.redes_sociais"
                            type="text"
                            placeholder="@seugrupo"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="telefone_celular"
                            class="text-sm font-bold text-secondary"
                            >Telefone Celular</label
                        >
                        <input
                            id="telefone_celular"
                            v-model="formData.telefone_celular"
                            type="tel"
                            placeholder="(00) 00000-0000"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="telefone_fixo"
                            class="text-sm font-bold text-secondary"
                            >Telefone Fixo</label
                        >
                        <input
                            id="telefone_fixo"
                            v-model="formData.telefone_fixo"
                            type="tel"
                            placeholder="(00) 0000-0000"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="nome_empresa"
                            class="text-sm font-bold text-secondary"
                            >Nome da Empresa</label
                        >
                        <input
                            id="nome_empresa"
                            v-model="formData.nome_empresa"
                            type="text"
                            placeholder="Nome da Empresa"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="razao_social"
                            class="text-sm font-bold text-secondary"
                            >Razão Social</label
                        >
                        <input
                            id="razao_social"
                            v-model="formData.razao_social"
                            type="text"
                            placeholder="Razão Social"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="cnpj"
                            class="text-sm font-bold text-secondary"
                            >CNPJ</label
                        >
                        <input
                            id="cnpj"
                            v-model="formData.cnpj"
                            type="text"
                            placeholder="00.000.000/0000-00"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>
                </div>

                <!-- Endereco Block -->
                <div
                    v-show="activeBlock === 'endereco'"
                    class="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div>
                        <label
                            for="cep"
                            class="text-sm font-bold text-secondary"
                            >CEP</label
                        >
                        <input
                            id="cep"
                            v-model="formData.cep"
                            type="text"
                            placeholder="00000-000"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="cidade"
                            class="text-sm font-bold text-secondary"
                            >Cidade</label
                        >
                        <input
                            id="cidade"
                            v-model="formData.cidade"
                            type="text"
                            placeholder="Cidade"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div class="md:col-span-2">
                        <label
                            for="regiao_administrativa"
                            class="text-sm font-bold text-secondary"
                            >Região Administrativa</label
                        >
                        <input
                            id="regiao_administrativa"
                            v-model="formData.regiao_administrativa"
                            type="text"
                            placeholder="Região Administrativa"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div class="md:col-span-2">
                        <label
                            for="endereco"
                            class="text-sm font-bold text-secondary"
                            >Endereço</label
                        >
                        <input
                            id="endereco"
                            v-model="formData.endereco"
                            type="text"
                            placeholder="Rua, Avenida..."
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="numero"
                            class="text-sm font-bold text-secondary"
                            >Número</label
                        >
                        <input
                            id="numero"
                            v-model="formData.numero"
                            type="text"
                            placeholder="Número"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="complemento"
                            class="text-sm font-bold text-secondary"
                            >Complemento</label
                        >
                        <input
                            id="complemento"
                            v-model="formData.complemento"
                            type="text"
                            placeholder="Ap, Bloco..."
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>
                </div>

                <!-- Bancario Block -->
                <div
                    v-show="activeBlock === 'bancario'"
                    class="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div class="md:col-span-2">
                        <label
                            for="banco"
                            class="text-sm font-bold text-secondary"
                            >Banco</label
                        >
                        <input
                            id="banco"
                            v-model="formData.banco"
                            type="text"
                            placeholder="Nome do Banco"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="agencia"
                            class="text-sm font-bold text-secondary"
                            >Agência</label
                        >
                        <input
                            id="agencia"
                            v-model="formData.agencia"
                            type="text"
                            placeholder="0000"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div>
                        <label
                            for="conta_corrente"
                            class="text-sm font-bold text-secondary"
                            >Conta Corrente</label
                        >
                        <input
                            id="conta_corrente"
                            v-model="formData.conta_corrente"
                            type="text"
                            placeholder="00000-0"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>

                    <div class="md:col-span-2">
                        <label
                            for="pix"
                            class="text-sm font-bold text-secondary"
                            >Chave PIX</label
                        >
                        <input
                            id="pix"
                            v-model="formData.pix"
                            type="text"
                            placeholder="CPF, CNPJ, E-mail ou Telefone"
                            class="w-full mt-2 bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30"
                        />
                    </div>
                </div>

                <!-- Action Buttons -->
                <div
                    class="flex justify-between items-center pt-8 mt-8 border-t border-secondary/10"
                >
                    <button
                        type="button"
                        @click="handleCancel"
                        class="bg-background border border-secondary/10 text-secondary font-bold py-3 px-6 rounded-md text-xs uppercase tracking-wider hover:bg-div-15 transition-all"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        :disabled="isSubmitting"
                        class="bg-primary text-white font-bold py-3 px-8 rounded-md text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg
                            v-if="isSubmitting"
                            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        {{ isSubmitting ? "Salvando..." : "Salvar Grupo" }}
                    </button>
                </div>
            </form>
        </div>
    </NuxtLayout>
</template>
