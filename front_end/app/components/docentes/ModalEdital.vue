<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
    edital?: any | null;
    idEntidade: string;
    onSave: (dados: any) => Promise<boolean>;
}>();

const formsDisponiveis = ref<any[]>([]);
const loadingForms = ref(false);

async function fetchForms() {
    if (!props.idEntidade) return;
    loadingForms.value = true;
    try {
        const res = (await $fetch("/api/docentes/formularios-disponiveis", {
            params: {
                id_entidade: props.idEntidade,
                tipo_proc: "seletivo",
                tipo_cand: "docente",
            },
        })) as any;
        formsDisponiveis.value = res?.itens || [];
    } catch {
        formsDisponiveis.value = [];
    } finally {
        loadingForms.value = false;
    }
}

const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void;
}>();

const form = ref({
    nome: "",
    descricao: "",
    data_ini: "",
    data_fim: "",
    status: "ativo" as string,
    id_form_config: "",
});

const saving = ref(false);
const error = ref("");

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            // Inicializa com dados do edital (se for edição)
            if (props.edital) {
                form.value = {
                    nome: props.edital.nome || "",
                    descricao: props.edital.descricao || "",
                    data_ini: props.edital.data_ini || "",
                    data_fim: props.edital.data_fim || "",
                    status: props.edital.status || "ativo",
                    id_form_config: props.edital.id_form_config || "",
                };
            } else {
                form.value = {
                    nome: "",
                    descricao: "",
                    data_ini: "",
                    data_fim: "",
                    status: "ativo",
                    id_form_config: "",
                };
            }
            error.value = "";
            void fetchForms();
        }
    },
);

async function handleSave() {
    // Validação
    if (!form.value.nome.trim()) {
        error.value = "Nome do edital é obrigatório.";
        return;
    }
    if (!form.value.data_ini || !form.value.data_fim) {
        error.value = "Período do edital é obrigatório.";
        return;
    }

    saving.value = true;
    error.value = "";

    const dados: any = { ...form.value };
    if (props.edital?.id) dados.id = props.edital.id;

    const ok = await props.onSave(dados);
    saving.value = false;

    if (ok) {
        emit("update:modelValue", false);
    } else {
        error.value = "Erro ao salvar edital.";
    }
}
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
                    <Icon name="ph:clipboard-text-light" class="w-5 h-5" />
                </div>
                <div class="modal-header-text flex-1">
                    <h3 class="modal-title">
                        {{ edital?.id ? "Editar Edital" : "Novo Edital" }}
                    </h3>
                    <p class="modal-subtitle">
                        {{ edital?.id ? "Altere as informações do edital" : "Crie um edital de seleção docente" }}
                    </p>
                </div>
                <button @click="emit('update:modelValue', false)" class="modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="modal-body flex flex-col gap-4">
                <!-- Nome -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        Nome do Edital
                    </label>
                    <input
                        v-model="form.nome"
                        type="text"
                        placeholder="Ex: Seleção Docente 2026.2"
                        class="field-input"
                    />
                </div>

                <!-- Descrição -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        Descrição
                    </label>
                    <textarea
                        v-model="form.descricao"
                        placeholder="Breve descrição do edital..."
                        rows="2"
                        class="field-input resize-none"
                    />
                </div>

                <!-- Período -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                            Data Início
                        </label>
                        <input
                            v-model="form.data_ini"
                            type="date"
                            class="field-input"
                        />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                            Data Fim
                        </label>
                        <input
                            v-model="form.data_fim"
                            type="date"
                            class="field-input"
                        />
                    </div>
                </div>

                <!-- Formulário de Inscrição (agora dinâmico) -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        Formulário de Inscrição
                    </label>
                    <div v-if="loadingForms" class="text-[10px] text-secondary/40 py-2">
                        Carregando formulários...
                    </div>
                    <select
                        v-else
                        v-model="form.id_form_config"
                        class="field-input"
                    >
                        <option value="">Sem formulário</option>
                        <option
                            v-for="f in formsDisponiveis"
                            :key="f.area_id || f.programa_id || 'global'"
                            :value="f.area_id || f.programa_id || 'global'"
                        >
                            {{ f.contexto_nome || f.escopo }} — {{ f.qtd_perguntas }} perguntas
                        </option>
                    </select>
                    <div
                        v-if="!loadingForms && formsDisponiveis.length === 0"
                        class="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mt-1"
                    >
                        ⚠ Nenhum formulário de processo seletivo para docentes encontrado.
                        Crie um em <NuxtLink to="/formularios?tab=configuracoes" class="underline text-primary">Formulários → Configurações</NuxtLink>.
                    </div>
                </div>

                <!-- Status -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        Status
                    </label>
                    <div class="flex items-center gap-3">
                        <button
                            @click="form.status = 'ativo'"
                            class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                            :class="
                                form.status === 'ativo'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-white/[0.03] border border-white/5 text-secondary/40'
                            "
                        >
                            ● Ativo
                        </button>
                        <button
                            @click="form.status = 'inativo'"
                            class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                            :class="
                                form.status === 'inativo'
                                    ? 'bg-white/5 border border-white/10 text-white/60'
                                    : 'bg-white/[0.03] border border-white/5 text-secondary/40'
                            "
                        >
                            ○ Inativo
                        </button>
                    </div>
                </div>

                <!-- Erro -->
                <div
                    v-if="error"
                    class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                >
                    {{ error }}
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
                    <span>{{ edital?.id ? "Salvar" : "Criar Edital" }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "~/assets/modal-styles.css";
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
