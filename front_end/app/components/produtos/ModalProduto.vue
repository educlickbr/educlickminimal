<template>
    <div class="ds-modal-overlay" @click.self="$emit('close')">
        <div class="ds-modal-panel max-w-md">
            <div class="ds-modal-accent-bar" />

            <!-- Header -->
            <div class="ds-modal-header">
                <div class="ds-modal-header-icon text-primary">
                    <Icon name="ph:package-bold" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ produto ? "Editar Produto" : "Novo Produto" }}
                    </h3>
                    <p class="ds-modal-subtitle">
                        {{
                            produto
                                ? "Altere os dados do produto"
                                : "Crie um novo produto comercial"
                        }}
                    </p>
                </div>
                <button class="ds-modal-close-btn" @click="$emit('close')">
                    &times;
                </button>
            </div>

            <!-- Form Body -->
            <div class="p-6 flex flex-col gap-5">
                <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">
                    {{ errorMessage }}
                </div>

                <!-- Programa -->
                <BaseSelect
                    v-model="form.id_programa"
                    label="Programa"
                    required
                    placeholder="Selecione o programa..."
                    :options="programasOptions"
                />

                <!-- Nome -->
                <BaseField
                    v-model="form.nome_produto"
                    label="Nome do Produto"
                    required
                    placeholder="Ex: Curso Completo, Mentoria Premium"
                />

                <!-- Descrição -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">
                        Descrição
                    </label>
                    <textarea
                        v-model="form.descricao"
                        class="w-full rounded-xl px-4 py-3 text-sm font-bold bg-field-bg border border-field-border text-field-text placeholder-secondary/30 focus:outline-none focus:border-primary/50 transition-all resize-none"
                        placeholder="Descrição opcional do produto"
                        rows="2"
                    />
                </div>

                <!-- Ativo -->
                <div class="flex items-center gap-3 p-3 bg-div-15 border border-divider rounded-xl">
                    <input
                        v-model="form.is_ativo"
                        type="checkbox"
                        id="chk-ativo"
                        class="accent-primary w-4 h-4 cursor-pointer"
                    />
                    <label for="chk-ativo" class="text-xs font-bold text-text cursor-pointer select-none">
                        Produto ativo para comercialização
                    </label>
                </div>
            </div>

            <!-- Footer -->
            <div class="ds-modal-footer">
                <button class="ds-btn-cancel" @click="$emit('close')">
                    Cancelar
                </button>
                <button
                    class="ds-btn-save"
                    :disabled="!canSave || saving"
                    @click="handleSave"
                >
                    <div v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{{
                        saving
                            ? "Salvando..."
                            : produto
                              ? "Salvar"
                              : "Criar Produto"
                    }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";

const props = defineProps<{
    produto: any | null;
    programas: any[];
    programaFiltro?: string | null;
    onSave: (data: any) => Promise<boolean>;
}>();

defineEmits<{ close: [] }>();

const saving = ref(false);
const errorMessage = ref("");

const form = reactive({
    id: null as string | null,
    id_programa: "",
    nome_produto: "",
    descricao: "",
    is_ativo: true,
});

const programasOptions = computed(() => {
    return props.programas.map((p) => ({
        id: p.id,
        nome: `${p.descricao || "—"} (${p.nome_curso || "Sem curso"})`,
    }));
});

onMounted(() => {
    if (props.produto) {
        form.id = props.produto.id;
        form.id_programa = props.produto.id_programa || "";
        form.nome_produto = props.produto.nome_produto || "";
        form.descricao = props.produto.descricao || "";
        form.is_ativo = props.produto.is_ativo !== false;
    } else if (props.programaFiltro) {
        form.id_programa = props.programaFiltro;
    }
});

const canSave = computed(() => {
    return form.id_programa && form.nome_produto.trim().length > 0;
});

async function handleSave() {
    errorMessage.value = "";

    if (!form.id_programa) {
        errorMessage.value = "Selecione um programa.";
        return;
    }
    if (!form.nome_produto.trim()) {
        errorMessage.value = "Informe o nome do produto.";
        return;
    }

    saving.value = true;
    const ok = await props.onSave({
        id: form.id,
        id_programa: form.id_programa,
        nome_produto: form.nome_produto.trim(),
        descricao: form.descricao || null,
        is_ativo: form.is_ativo,
    });
    saving.value = false;
    if (!ok) errorMessage.value = "Erro ao salvar. Verifique os dados.";
}
</script>

<style scoped>
.ds-modal-panel {
    display: flex;
}
</style>


