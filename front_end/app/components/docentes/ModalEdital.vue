<template>
    <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="emit('update:modelValue', false)"
    >
        <div class="ds-modal-panel max-w-lg">
            <div class="ds-modal-accent-bar" />

            <div class="ds-modal-header">
                <div class="ds-modal-header-icon text-primary">
                    <Icon name="ph:clipboard-text-light" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ edital?.id ? "Editar Edital" : "Novo Edital" }}
                    </h3>
                    <p class="ds-modal-subtitle">
                        {{ edital?.id ? "Altere as informações do edital" : "Crie um edital de seleção docente" }}
                    </p>
                </div>
                <button @click="emit('update:modelValue', false)" class="ds-modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="p-6 flex flex-col gap-4">
                <!-- Nome -->
                <BaseField
                    v-model="form.nome"
                    label="Nome do Edital"
                    required
                    placeholder="Ex: Seleção Docente 2026.2"
                />

                <!-- Descrição -->
                <BaseField
                    v-model="form.descricao"
                    label="Descrição"
                    type="textarea"
                    optional
                    placeholder="Breve descrição do edital..."
                    :rows="2"
                />

                <!-- Período -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BaseField
                        v-model="form.data_ini"
                        label="Data Início"
                        type="date"
                        required
                    />
                    <BaseField
                        v-model="form.data_fim"
                        label="Data Fim"
                        type="date"
                        required
                    />
                </div>

                <!-- Formulário de Inscrição -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        Formulário de Inscrição
                    </label>
                    <div v-if="loadingForms" class="text-[10px] text-secondary/50 py-2">
                        Carregando formulários...
                    </div>
                    <select
                        v-else
                        v-model="form.id_form_config"
                        class="w-full bg-field-bg border border-field-border rounded-xl px-3 py-2.5 text-xs font-bold text-field-text outline-none focus:border-primary/40"
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
                                    : 'bg-div-15 border border-divider text-secondary'
                            "
                        >
                            ● Ativo
                        </button>
                        <button
                            @click="form.status = 'inativo'"
                            class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                            :class="
                                form.status === 'inativo'
                                    ? 'bg-div-15 border border-divider text-text'
                                    : 'bg-div-15 border border-divider text-secondary'
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
                    <span>{{ edital?.id ? "Salvar" : "Criar Edital" }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

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

<style scoped>
.ds-modal-panel {
    display: flex;
}
</style>
