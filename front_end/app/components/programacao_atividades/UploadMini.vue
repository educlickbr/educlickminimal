<template>
    <!-- Botão compacto de anexo (perguntas/alternativas) -->
    <button
        v-if="!fileId"
        @click="triggerInput"
        class="attach-btn"
        :title="label || 'Anexar arquivo'"
    >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
        </svg>
        <input ref="fileInput" type="file" class="hidden" @change="handleFile" :accept="accept" />
    </button>

    <div v-else class="attach-file">
        <button @click="abrirArquivo" class="attach-file-icon" :title="fileName || 'Visualizar arquivo'">
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                <path d="M5 2h5l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3" fill="rgba(139,92,246,0.08)"/>
                <path d="M10 2v4h4" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
        </button>
        <button @click="removerArquivo" class="attach-file-remove" title="Remover arquivo">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
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
    border: 1px dashed rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.02);
    color: rgba(255,255,255,0.3); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.attach-btn:hover { border-color: rgba(139,92,246,0.4); color: #a78bfa; background: rgba(139,92,246,0.05); }

.attach-file {
    display: flex; align-items: center; gap: 2px; flex-shrink: 0;
}
.attach-file-icon {
    width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
    border: 1px solid rgba(139,92,246,0.2);
    background: rgba(139,92,246,0.08);
    color: #a78bfa; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.attach-file-icon:hover { background: rgba(139,92,246,0.16); color: #c4b5fd; }

.attach-file-remove {
    width: 22px; height: 26px; border-radius: 7px; flex-shrink: 0;
    border: none; background: transparent;
    color: rgba(255,255,255,0.2); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.attach-file-remove:hover { background: rgba(239,68,68,0.12); color: #fca5a5; }

.hidden { display: none; }
</style>
