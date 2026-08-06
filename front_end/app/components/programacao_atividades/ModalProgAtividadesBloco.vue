<template>
    <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="$emit('update:modelValue', false)"
    >
        <div class="modal-panel">
            <div class="modal-accent-bar"></div>

            <div class="modal-header">
                <div class="modal-header-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216Z"/>
                        <path d="M88,96h80a8,8,0,0,0,0-16H88a8,8,0,0,0,0,16Zm0,32h80a8,8,0,0,0,0-16H88a8,8,0,0,0,0,16Zm0,32h40a8,8,0,0,0,0-16H88a8,8,0,0,0,0,16Z"/>
                    </svg>
                </div>
                <div class="modal-header-text">
                    <h3 class="modal-title">{{ isEdit ? "Editar" : "Novo" }} Bloco</h3>
                    <p class="modal-subtitle">Agrupamento de Conteúdo no Repositório</p>
                </div>
                <button @click="$emit('update:modelValue', false)" class="modal-close-btn">&times;</button>
            </div>

            <div class="p-6 flex flex-col gap-5">
                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Título</label>
                    <input
                        v-model="form.titulo"
                        placeholder="Ex: Introdução ao Roteiro"
                        class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Descrição (Opcional)</label>
                    <textarea
                        v-model="form.descricao"
                        placeholder="Descreva o conteúdo deste bloco..."
                        rows="3"
                        class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none resize-none"
                    ></textarea>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Cor de Identificação (Opcional)</label>
                    <div class="flex items-center gap-3">
                        <input
                            v-model="form.cor_ident"
                            type="color"
                            class="w-10 h-10 rounded-lg border border-secondary/10 bg-background cursor-pointer"
                        />
                        <input
                            v-model="form.cor_ident"
                            placeholder="#7c3aed"
                            class="flex-1 px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary/50 focus:border-primary/50 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button @click="$emit('update:modelValue', false)" class="modal-btn-cancel">Cancelar</button>
                <button
                    @click="handleSave"
                    :disabled="loading || !form.titulo.trim()"
                    class="modal-btn-save"
                >
                    <div v-if="loading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {{ loading ? "Salvando..." : isEdit ? "Atualizar Bloco" : "Criar Bloco" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";

const props = defineProps<{
    modelValue: boolean;
    isEdit?: boolean;
    initialData?: any | null;
    onSave: (data: { id: string | null; titulo: string; descricao: string; cor_ident: string }) => Promise<boolean>;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    saved: [];
}>();

const loading = ref(false);

const form = reactive({
    id: null as string | null,
    titulo: "",
    descricao: "",
    cor_ident: "",
});

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            if (props.initialData) {
                form.id = props.initialData.id;
                form.titulo = props.initialData.titulo || "";
                form.descricao = props.initialData.descricao || "";
                form.cor_ident = props.initialData.cor_ident || "";
            } else {
                form.id = null;
                form.titulo = "";
                form.descricao = "";
                form.cor_ident = "";
            }
        }
    },
    { immediate: true },
);

async function handleSave() {
    if (!form.titulo.trim()) return;

    loading.value = true;
    const ok = await props.onSave({ ...form });
    loading.value = false;

    if (ok) {
        emit("saved");
        emit("update:modelValue", false);
    }
}
</script>

<style scoped>
.modal-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.85); padding: 16px;
    animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-panel {
    position: relative;
    background: #0f0f17;
    border: 1px solid rgba(139, 92, 246, 0.18);
    border-radius: 16px;
    width: 100%; max-width: 500px;
    overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1);
    animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1);
}
@keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-accent-bar {
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
    flex-shrink: 0;
}

.modal-header {
    display: flex; align-items: center; gap: 14px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
}
.modal-header-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(139,92,246,0.12);
    border: 1px solid rgba(139,92,246,0.2);
    color: #a78bfa;
    display: flex; align-items: center; justify-content: center;
}
.modal-header-text { flex: 1; }
.modal-title { font-size: 13px; font-weight: 800; color: #e8e6f0; }
.modal-subtitle { font-size: 10px; font-weight: 700; color: rgba(139,92,246,0.55); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }

.modal-close-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4);
    font-size: 18px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
}
.modal-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

.modal-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.2);
}
.modal-btn-cancel {
    padding: 10px 22px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.45);
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s ease;
}
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.modal-btn-save {
    padding: 10px 28px; border-radius: 9px; border: none;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    color: #fff; font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s ease;
    box-shadow: 0 4px 14px rgba(139,92,246,0.35);
    display: flex; align-items: center; gap: 8px;
}
.modal-btn-save:hover { background: linear-gradient(135deg,#6d28d9,#7c3aed); box-shadow: 0 6px 20px rgba(139,92,246,0.5); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
