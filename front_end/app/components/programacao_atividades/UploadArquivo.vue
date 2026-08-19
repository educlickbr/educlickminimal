<template>
    <div class="flex flex-col gap-2">
        <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">
            {{ label }}
        </label>

        <!-- Estado: sem arquivo -->
        <div v-if="!fileId && !uploading" class="upload-zone" @click="triggerInput">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="text-white/30">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span class="text-[11px] font-bold text-white/30">{{ placeholder }}</span>
            <input
                ref="fileInput"
                type="file"
                class="hidden"
                @change="handleFile"
                :accept="accept"
            />
        </div>

        <!-- Uploading -->
        <div v-else-if="uploading" class="upload-zone uploading">
            <div class="w-4 h-4 border-2 border-white/30 border-t-primary rounded-full animate-spin" />
            <span class="text-[11px] font-bold text-white/40">Enviando...</span>
        </div>

        <!-- Arquivo selecionado -->
        <div v-else class="upload-file">
            <div class="upload-file-info">
                <!-- Ícone de arquivo clicável -->
                <button @click="abrirArquivo" class="file-icon-btn" title="Visualizar arquivo">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M5 2h5l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3" fill="rgba(139,92,246,0.08)"/>
                        <path d="M10 2v4h4" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                        <path d="M6 8h6M6 11h6M6 14h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    </svg>
                </button>
                <!-- Nome do arquivo clicável -->
                <button @click="abrirArquivo" class="file-name-btn" :title="'Visualizar: ' + fileName">
                    {{ fileName }}
                </button>
            </div>
            <button @click="removerArquivo" class="file-remove-btn" title="Remover arquivo">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
    modelValue: string | null;
    label?: string;
    placeholder?: string;
    accept?: string;
    escopo?: string;
    getUserExpandidoId?: () => string | null;
    getIdEntidade?: () => string | null;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string | null];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const fileName = ref("");
const fileId = ref<string | null>(props.modelValue);

watch(
    () => props.modelValue,
    (v) => {
        fileId.value = v;
        if (v && !fileName.value) fetchFileName(v);
        if (!v) fileName.value = "";
    },
);

// Se já tem um arquivo ao montar, busca o nome
onMounted(() => {
    if (fileId.value) fetchFileName(fileId.value);
});

async function fetchFileName(id: string) {
    try {
        const res = (await $fetch("/api/r2/sign", {
            params: { id },
        })) as any;
        if (res?.nomeOriginal) fileName.value = res.nomeOriginal;
    } catch {
        fileName.value = "Arquivo";
    }
}

async function abrirArquivo() {
    if (!fileId.value) return;
    try {
        const res = (await $fetch("/api/r2/sign", {
            params: { id: fileId.value },
        })) as any;
        if (res?.signedUrl) {
            window.open(res.signedUrl, "_blank");
        }
    } catch (e) {
        console.error("Erro ao abrir arquivo", e);
    }
}

function triggerInput() { fileInput.value?.click(); }

async function handleFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    fileName.value = file.name;
    uploading.value = true;

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
    } finally {
        uploading.value = false;
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
.upload-zone {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px;
    border: 1px dashed rgba(255,255,255,0.12);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    background: rgba(255,255,255,0.015);
}
.upload-zone:hover { border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.03); }
.upload-zone.uploading { cursor: wait; opacity: 0.7; }

.upload-file {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    background: rgba(139,92,246,0.04);
    transition: border-color 0.15s;
}
.upload-file:hover { border-color: rgba(139,92,246,0.25); }

.upload-file-info {
    display: flex; align-items: center; gap: 8px;
    overflow: hidden; flex: 1;
}

.file-icon-btn {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    border: none; background: rgba(139,92,246,0.1);
    color: #a78bfa; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.file-icon-btn:hover { background: rgba(139,92,246,0.18); color: #c4b5fd; }

.file-name-btn {
    background: none; border: none; padding: 0;
    font-size: 12px; font-weight: 700; color: rgba(232,230,240,0.8);
    cursor: pointer; text-align: left;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    transition: color 0.15s;
}
.file-name-btn:hover { color: #a78bfa; text-decoration: underline; }

.file-remove-btn {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    border: none; background: transparent;
    color: rgba(255,255,255,0.25); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.file-remove-btn:hover { background: rgba(239,68,68,0.12); color: #fca5a5; }

.hidden { display: none; }
</style>
