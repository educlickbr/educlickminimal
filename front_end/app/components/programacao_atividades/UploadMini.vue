<template>
    <!-- Botão compacto de anexo (perguntas/alternativas) -->
    <button
        v-if="!fileId"
        @click="triggerInput"
        class="attach-btn"
        :title="label || 'Anexar arquivo'"
    >
        <Icon name="ph:paperclip-bold" class="w-3.5 h-3.5" />
        <input ref="fileInput" type="file" class="hidden" @change="handleFile" :accept="accept" />
    </button>

    <div v-else class="attach-file">
        <button @click="abrirArquivo" class="attach-file-icon" :title="fileName || 'Visualizar arquivo'">
            <Icon name="ph:file-bold" class="w-3 h-3 text-primary" />
        </button>
        <button @click="removerArquivo" class="attach-file-remove" title="Remover arquivo">
            <Icon name="ph:x-bold" class="w-2.5 h-2.5" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
    modelValue: string | null | undefined;
    label?: string;
    accept?: string;
    escopo?: string;
    getUserExpandidoId?: () => string | null;
    getIdEntidade?: () => string | null;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string | null];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const fileId = ref<string | null>(props.modelValue ?? null);
const fileName = ref("");

watch(
    () => props.modelValue,
    (v) => {
        fileId.value = v ?? null;
        if (v && !fileName.value) fetchFileName(v);
        if (!v) fileName.value = "";
    },
);

onMounted(() => {
    if (fileId.value) fetchFileName(fileId.value);
});

async function fetchFileName(id: string) {
    try {
        const res = (await $fetch("/api/r2/sign", { params: { id } })) as any;
        if (res?.nomeOriginal) fileName.value = res.nomeOriginal;
    } catch {
        fileName.value = "Arquivo";
    }
}

async function abrirArquivo() {
    if (!fileId.value) return;
    try {
        const res = (await $fetch("/api/r2/sign", { params: { id: fileId.value } })) as any;
        if (res?.signedUrl) window.open(res.signedUrl, "_blank");
    } catch (e) {
        console.error("Erro ao abrir arquivo", e);
    }
}

function triggerInput() { fileInput.value?.click(); }

async function handleFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file) return;
    fileName.value = file.name;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("saveToDb", "true");
    formData.append("escopo", props.escopo || "programacao_atividades");
    formData.append("user_expandido_id", props.getUserExpandidoId?.() || "");
    formData.append("id_entidade", props.getIdEntidade?.() || "");

    try {
        const res = (await $fetch("/api/r2/upload", {
            method: "POST",
            body: formData,
        })) as any;

        if (res?.success && res.dbRecord) {
            fileId.value = res.dbRecord.id;
            fileName.value = res.originalName || file.name;
            emit("update:modelValue", fileId.value);
        }
    } catch (e) {
        console.error("Erro no upload", e);
    }
}

async function removerArquivo() {
    if (!fileId.value) return;
    try {
        await $fetch("/api/r2/delete", {
            method: "POST",
            body: {
                fileId: fileId.value,
                user_expandido_id: props.getUserExpandidoId?.() || null,
            },
        });
    } catch (e) {
        console.error("Erro ao deletar arquivo", e);
    }
    fileId.value = null;
    fileName.value = "";
    emit("update:modelValue", null);
}
</script>

<style scoped>
.attach-btn {
    width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
    border: 1px dashed var(--color-divider);
    background: var(--color-secondary-surface);
    color: var(--color-secondary); opacity: 0.6; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.attach-btn:hover { border-color: rgba(139,92,246,0.4); color: var(--color-primary); opacity: 1; background: rgba(139,92,246,0.05); }

.attach-file {
    display: flex; align-items: center; gap: 2px; flex-shrink: 0;
}
.attach-file-icon {
    width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
    border: 1px solid rgba(139,92,246,0.2);
    background: rgba(139,92,246,0.08);
    color: var(--color-primary); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.attach-file-icon:hover { background: rgba(139,92,246,0.16); }

.attach-file-remove {
    width: 22px; height: 26px; border-radius: 7px; flex-shrink: 0;
    border: none; background: transparent;
    color: var(--color-secondary); opacity: 0.6; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.attach-file-remove:hover { background: rgba(239,68,68,0.12); color: #ef4444; opacity: 1; }

.hidden { display: none; }
</style>
