<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = defineProps<{
    modelValue: boolean;
    idEntidade: string;
    editDocenteId?: string | null;
    onSave: (idUserExpandido: string) => Promise<boolean>;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void;
}>();

const editando = computed(() => !!props.editDocenteId);
const loadingDados = ref(false);

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
    id_docente: "",
    id_user_expandido: "",
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

        if (editando.value) {
            const res = (await $fetch("/api/docentes/atualizar-dados", {
                method: "POST",
                body: {
                    id_docente: props.editDocenteId,
                    id_user_expandido: form.value.id_user_expandido,
                    id_entidade: props.idEntidade,
                    valor_hora_aula: valorCentavos > 0 ? valorCentavos : null,
                    respostas,
                },
            })) as any;

            if (res?.success) {
                successMsg.value = "Dados atualizados com sucesso!";
                await props.onSave("");
                setTimeout(() => emit("update:modelValue", false), 1000);
            } else {
                error.value = res?.message || "Erro ao atualizar.";
            }
        } else {
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
        }
    } catch (e: any) {
        error.value = e?.message || "Erro ao salvar docente.";
    } finally {
        saving.value = false;
    }
}

watch(
    () => props.modelValue,
    async (val) => {
        if (val) {
            error.value = "";
            successMsg.value = "";

            if (props.editDocenteId) {
                // Modo edição: carrega dados
                loadingDados.value = true;
                try {
                    const res = (await $fetch("/api/docentes/docente-detalhes", {
                        params: { id: props.editDocenteId },
                    })) as any;
                    if (res?.success) {
                        const d = res.docente;
                        const r = d.respostas || {};
                        form.value = {
                            nome: d.nome_completo || "",
                            email: d.email || "",
                            valor_hora_aula: d.valor_hora_aula
                                ? (d.valor_hora_aula / 100).toFixed(2).replace(".", ",")
                                : "",
                            cpf: r["05c0186e-af01-4220-8031-383c8611c4fa"]?.resposta || "",
                            data_nascimento: r["ebf7837b-545e-45a7-ac0d-55d7b235a2c2"]?.resposta || "",
                            cep: r["a918d49a-8ac2-4796-a656-4181897a00d1"]?.resposta || "",
                            endereco: r["745b61c2-161d-4cbb-af1c-e9065d3362f2"]?.resposta || "",
                            numero: r["1eebb87e-ec33-4155-be21-cc50f85d7fc5"]?.resposta || "",
                            complemento: r["23a6698e-8e01-4d58-965e-f927b2fb3d31"]?.resposta || "",
                            bairro: r["b30fee6d-29b4-4bf9-8569-2a141150d10e"]?.resposta || "",
                            cidade: r["9b638554-16c5-4a1a-aed8-755d85849c6c"]?.resposta || "",
                            estado: r["44b8bfef-6ad1-4a18-8f5c-83949895f44f"]?.resposta || "",
                            id_docente: d.id || "",
                            id_user_expandido: d.id_user_expandido || "",
                        };
                    }
                } catch {
                    error.value = "Erro ao carregar dados.";
                } finally {
                    loadingDados.value = false;
                }
            } else {
                // Modo criação: zera tudo
                form.value = {
                    nome: "", email: "", valor_hora_aula: "", cpf: "", data_nascimento: "",
                    cep: "", endereco: "", numero: "", complemento: "",
                    bairro: "", cidade: "", estado: "",
                    id_docente: "", id_user_expandido: "",
                };
            }
        }
    },
);
</script>

<template>
    <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="emit('update:modelValue', false)"
    >
        <div class="ds-modal-panel max-w-2xl">
            <div class="ds-modal-accent-bar" />

            <div class="ds-modal-header">
                <div class="ds-modal-header-icon">
                    <Icon name="ph:user-plus-light" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">{{ editando ? 'Editar Docente' : 'Cadastrar Docente' }}</h3>
                    <p class="ds-modal-subtitle">{{ editando ? 'Altere os dados cadastrais' : 'Preencha os dados do novo docente' }}</p>
                </div>
                <button @click="emit('update:modelValue', false)" class="ds-modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="p-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <!-- Loading dados no edit -->
                <div v-if="loadingDados" class="py-12 flex flex-col items-center gap-3">
                    <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Carregando dados...</span>
                </div>

                <template v-else>
                    <!-- Nome + Email -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BaseField
                            v-model="form.nome"
                            label="Nome completo"
                            required
                            placeholder="Nome do docente"
                        />
                        <BaseField
                            v-model="form.email"
                            label="Email"
                            type="email"
                            required
                            placeholder="docente@email.com"
                        />
                    </div>

                    <!-- Valor Hora/Aula -->
                    <BaseField
                        v-model="form.valor_hora_aula"
                        label="Valor Hora/Aula (R$)"
                        optional
                        placeholder="Ex: 50,00"
                    />

                    <!-- CPF + Data Nascimento -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BaseField
                            :modelValue="mascaraCpf(form.cpf)"
                            @update:modelValue="(v) => form.cpf = mascaraCpf(v)"
                            label="CPF"
                            optional
                            placeholder="000.000.000-00"
                        />
                        <BaseField
                            v-model="form.data_nascimento"
                            label="Data de Nascimento"
                            type="date"
                            optional
                        />
                    </div>

                    <!-- CEP + buscar -->
                    <div class="flex flex-col gap-1.5">
                        <div class="flex items-end gap-2">
                            <div class="flex-1">
                                <BaseField
                                    :modelValue="mascaraCep(form.cep)"
                                    @update:modelValue="(v) => { form.cep = mascaraCep(v); if (form.cep.length === 9) buscarCep(); }"
                                    label="CEP"
                                    optional
                                    placeholder="00000-000"
                                />
                            </div>
                            <button
                                @click="buscarCep"
                                type="button"
                                class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all h-[42px]"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>

                    <!-- Endereço + Número -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="md:col-span-2">
                            <BaseField
                                v-model="form.endereco"
                                label="Endereço"
                                optional
                                placeholder="Rua / Avenida..."
                            />
                        </div>
                        <BaseField
                            v-model="form.numero"
                            label="Número"
                            optional
                            placeholder="Ex: 123"
                        />
                    </div>

                    <!-- Complemento + Bairro -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BaseField
                            v-model="form.complemento"
                            label="Complemento"
                            optional
                            placeholder="Apto, Bloco, Casa..."
                        />
                        <BaseField
                            v-model="form.bairro"
                            label="Bairro"
                            optional
                            placeholder="Nome do bairro"
                        />
                    </div>

                    <!-- Cidade + Estado -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BaseField
                            v-model="form.cidade"
                            label="Cidade"
                            optional
                            placeholder="Nome da cidade"
                        />
                        <BaseField
                            v-model="form.estado"
                            label="Estado (UF)"
                            optional
                            placeholder="Ex: SP"
                        />
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
                </template>
            </div>

            <div class="ds-modal-footer">
                <button
                    @click="emit('update:modelValue', false)"
                    class="ds-btn-cancel"
                    :disabled="saving"
                >
                    Cancelar
                </button>
                <button
                    @click="handleSave"
                    :disabled="saving"
                    class="ds-btn-save"
                >
                    <div
                        v-if="saving"
                        class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    />
                    <span>{{ editando ? 'Salvar Docente' : 'Cadastrar Docente' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.12); border-radius: 4px; }
</style>
