<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
    idEntidade: string;
    onSave: (idUserExpandido: string) => Promise<boolean>;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void;
}>();

// IDs fixos das perguntas globais (extraídos do banco)
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
    valor_hora_aula: "",
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

const saving = ref(false);
const error = ref("");
const successMsg = ref("");

// Busca CEP automaticamente
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
    } catch {
        // silencioso
    }
}

// Máscara de CPF
function mascaraCpf(v: string) {
    return v
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Máscara de CEP
function mascaraCep(v: string) {
    return v.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2");
}

async function handleSave() {
    error.value = "";
    successMsg.value = "";

    // Validação
    if (!form.value.nome.trim()) {
        error.value = "Nome completo é obrigatório.";
        return;
    }
    if (!form.value.email.trim()) {
        error.value = "Email é obrigatório.";
        return;
    }

    saving.value = true;

    try {
        // Monta respostas das perguntas globais
        const valorCentavos = Math.round(parseFloat((form.value.valor_hora_aula || "0").replace(",", ".")) * 100);

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

        const res = (await $fetch("/api/docentes/cadastro-completo", {
            method: "POST",
            body: {
                id_entidade: props.idEntidade,
                nome: form.value.nome.trim(),
                email: form.value.email.trim(),
                valor_hora_aula: valorCentavos > 0 ? valorCentavos : null,
                respostas,
            },
        })) as any;

        if (res?.success) {
            const idUserExpandido = res.id_user_expandido;

            // Chama o onSave para atualizar a lista de docentes
            const ok = await props.onSave(idUserExpandido);

            if (ok) {
                successMsg.value = "Docente cadastrado com sucesso!";
                setTimeout(() => emit("update:modelValue", false), 1200);
            } else {
                error.value = "Erro ao vincular como docente.";
            }
        } else {
            error.value = res?.message || "Erro ao cadastrar docente.";
        }
    } catch (e: any) {
        error.value = e?.message || "Erro ao cadastrar docente.";
    } finally {
        saving.value = false;
    }
}

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            form.value = {
                nome: "", email: "", valor_hora_aula: "", cpf: "", data_nascimento: "",
                cep: "", endereco: "", numero: "", complemento: "",
                bairro: "", cidade: "", estado: "",
            };
            error.value = "";
            successMsg.value = "";
        }
    },
);
</script>

<template>
    <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="emit('update:modelValue', false)"
    >
        <div class="modal-panel">
            <div class="modal-accent-bar" />

            <div class="modal-header">
                <div class="modal-header-icon">
                    <Icon name="ph:user-plus-light" class="w-5 h-5" />
                </div>
                <div class="modal-header-text flex-1">
                    <h3 class="modal-title">Cadastrar Docente</h3>
                    <p class="modal-subtitle">Preencha os dados do novo docente</p>
                </div>
                <button @click="emit('update:modelValue', false)" class="modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="modal-body flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <!-- Nome + Email -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">Nome completo *</label>
                        <input
                            v-model="form.nome"
                            type="text"
                            placeholder="Nome do docente"
                            class="field-input"
                        />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">Email *</label>
                        <input
                            v-model="form.email"
                            type="email"
                            placeholder="docente@email.com"
                            class="field-input"
                        />
                    </div>
                </div>

                <!-- Valor Hora/Aula -->
                <div class="flex flex-col gap-1.5">
                    <label class="field-label">Valor Hora/Aula (R$)</label>
                    <input v-model="form.valor_hora_aula" type="text" placeholder="Ex: 50,00" class="field-input" />
                </div>

                <!-- CPF + Data Nascimento -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">CPF</label>
                        <input
                            :value="mascaraCpf(form.cpf)"
                            @input="form.cpf = mascaraCpf(($event.target as HTMLInputElement).value)"
                            type="text"
                            placeholder="000.000.000-00"
                            maxlength="14"
                            class="field-input"
                        />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">Data de Nascimento</label>
                        <input
                            v-model="form.data_nascimento"
                            type="date"
                            class="field-input"
                        />
                    </div>
                </div>

                <!-- CEP + buscar -->
                <div class="flex flex-col gap-1.5">
                    <label class="field-label">CEP</label>
                    <div class="flex gap-2">
                        <input
                            :value="mascaraCep(form.cep)"
                            @input="form.cep = mascaraCep(($event.target as HTMLInputElement).value); if (form.cep.length === 9) buscarCep()"
                            type="text"
                            placeholder="00000-000"
                            maxlength="9"
                            class="field-input flex-1"
                        />
                        <button
                            @click="buscarCep"
                            type="button"
                            class="px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                <!-- Endereço + Número -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2 flex flex-col gap-1.5">
                        <label class="field-label">Endereço</label>
                        <input
                            v-model="form.endereco"
                            type="text"
                            placeholder="Rua / Avenida..."
                            class="field-input"
                        />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">Número</label>
                        <input
                            v-model="form.numero"
                            type="text"
                            placeholder="Ex: 123"
                            class="field-input"
                        />
                    </div>
                </div>

                <!-- Complemento + Bairro -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">Complemento</label>
                        <input
                            v-model="form.complemento"
                            type="text"
                            placeholder="Apto, Bloco, Casa..."
                            class="field-input"
                        />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">Bairro</label>
                        <input
                            v-model="form.bairro"
                            type="text"
                            placeholder="Nome do bairro"
                            class="field-input"
                        />
                    </div>
                </div>

                <!-- Cidade + Estado -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">Cidade</label>
                        <input
                            v-model="form.cidade"
                            type="text"
                            placeholder="Nome da cidade"
                            class="field-input"
                        />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="field-label">Estado (UF)</label>
                        <input
                            v-model="form.estado"
                            type="text"
                            placeholder="Ex: SP"
                            maxlength="2"
                            class="field-input"
                        />
                    </div>
                </div>

                <!-- Erro -->
                <div
                    v-if="error"
                    class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                >
                    {{ error }}
                </div>

                <!-- Sucesso -->
                <div
                    v-if="successMsg"
                    class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-center"
                >
                    {{ successMsg }}
                </div>
            </div>

            <div class="modal-footer">
                <button
                    @click="emit('update:modelValue', false)"
                    class="modal-btn-cancel"
                    :disabled="saving"
                >
                    Cancelar
                </button>
                <button
                    @click="handleSave"
                    :disabled="saving"
                    class="px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    <div
                        v-if="saving"
                        class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    />
                    <span>Cadastrar Docente</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "~/assets/modal-styles.css";
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

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
.field-input::placeholder {
    color: rgba(255, 255, 255, 0.22);
}
</style>
