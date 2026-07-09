<template>
    <div class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-panel modal-panel--md">
            <div class="modal-accent-bar" />

            <!-- Header -->
            <div class="modal-header">
                <div class="modal-header-icon">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                    </svg>
                </div>
                <div class="modal-header-text">
                    <h3 class="modal-title">
                        {{ produto ? "Editar Produto" : "Novo Produto" }}
                    </h3>
                    <p class="modal-subtitle">
                        {{
                            produto
                                ? "Altere os dados do produto"
                                : "Crie um novo produto comercial"
                        }}
                    </p>
                </div>
                <button class="modal-close-btn" @click="$emit('close')">
                    ✕
                </button>
            </div>

            <!-- Form -->
            <div class="modal-body">
                <div v-if="errorMessage" class="modal-error">
                    {{ errorMessage }}
                </div>

                <!-- Programa -->
                <div class="form-field">
                    <label class="form-label"
                        >Programa <span class="text-red-400">*</span></label
                    >
                    <select v-model="form.id_programa" class="form-input">
                        <option value="" disabled>
                            Selecione o programa...
                        </option>
                        <option
                            v-for="p in programas"
                            :key="p.id"
                            :value="p.id"
                        >
                            {{ p.descricao || "—" }} ({{
                                p.nome_curso || "Sem curso"
                            }})
                        </option>
                    </select>
                </div>

                <!-- Nome -->
                <div class="form-field">
                    <label class="form-label"
                        >Nome do Produto
                        <span class="text-red-400">*</span></label
                    >
                    <input
                        v-model="form.nome_produto"
                        type="text"
                        class="form-input"
                        placeholder="Ex: Curso Completo, Mentoria Premium"
                    />
                </div>

                <!-- Descrição -->
                <div class="form-field">
                    <label class="form-label">Descrição</label>
                    <textarea
                        v-model="form.descricao"
                        class="form-input form-textarea"
                        placeholder="Descrição opcional do produto"
                        rows="2"
                    />
                </div>

                <!-- Ativo -->
                <div class="form-field">
                    <label class="form-checkbox">
                        <input v-model="form.is_ativo" type="checkbox" />
                        <span>Produto ativo</span>
                    </label>
                </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
                <button class="modal-btn-cancel" @click="$emit('close')">
                    Cancelar
                </button>
                <button
                    class="modal-btn-save"
                    :disabled="!canSave || saving"
                    @click="handleSave"
                >
                    {{
                        saving
                            ? "Salvando..."
                            : produto
                              ? "Salvar"
                              : "Criar Produto"
                    }}
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
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.modal-panel {
    background: #13131a;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    width: 100%;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}
.modal-accent-bar {
    height: 3px;
    border-radius: 20px 20px 0 0;
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
}
.modal-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 20px 24px 0;
}
.modal-header-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
    background: rgba(139, 92, 246, 0.12);
    color: #a78bfa;
    display: flex;
    align-items: center;
    justify-content: center;
}
.modal-header-text {
    flex: 1;
}
.modal-title {
    font-size: 15px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.92);
}
.modal-subtitle {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 2px;
}
.modal-close-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.3);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.modal-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.modal-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.modal-error {
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
    font-size: 11px;
    font-weight: 700;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.form-label {
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(255, 255, 255, 0.35);
}
.form-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(232, 230, 240, 0.9);
    font-size: 13px;
    font-weight: 700;
    outline: none;
    transition: border-color 0.15s ease;
    font-family: inherit;
}
.form-input:focus {
    border-color: rgba(139, 92, 246, 0.45);
}
.form-textarea {
    resize: vertical;
    min-height: 60px;
}

.form-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
}
.form-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    accent-color: #8b5cf6;
}

.grid.grid-cols-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px 20px;
}
.modal-btn-cancel {
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.15s;
}
.modal-btn-cancel:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
}

.modal-btn-save {
    padding: 10px 24px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    border: 1px solid rgba(139, 92, 246, 0.4);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}
.modal-btn-save:hover {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
}
.modal-btn-save:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
</style>
