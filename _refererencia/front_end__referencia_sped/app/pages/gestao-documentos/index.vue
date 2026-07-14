<script setup lang="ts">
import BaseSelect from "~/components/BaseSelect.vue";
import ModalGestaoDocumento from "~/components/gestao-documentos/ModalGestaoDocumento.vue";
import ModalConfirmDelete from "~/components/gestao-documentos/ModalConfirmDelete.vue";
import GestaoDocumentosLista from "~/components/gestao-documentos/GestaoDocumentosLista.vue";
import { useGestaoDocumentos } from "~/composables/gestao-documentos/useGestaoDocumentos";

const {
    areaOptions,
    escopoOptions,
    publicadoOptions,
    areaLabel,
    areaBadgeClass,
    isLoading,
    isSaving,
    isDeleting,
    documentos,
    pagination,
    LIMITE,
    hashBaseLocal,
    showModal,
    showConfirmDelete,
    selectedDoc,
    fileInput,
    file,
    dragging,
    uploading,
    errorMsg,
    form,
    filters,
    fetchHashBase,
    fetchDocumentos,
    openCreate,
    openEdit,
    openDelete,
    formatDate,
    handleFileChange,
    handleDrop,
    removeFile,
    save,
    confirmDelete,
} = useGestaoDocumentos();

// ── Watchers ──────────────────────────────────────────────────
let filterTimeout: any;
watch(
    filters,
    () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => fetchDocumentos(1), 400);
    },
    { deep: true },
);
onMounted(() => {
    fetchHashBase();
    fetchDocumentos();
});
</script>

<template>
    <NuxtLayout name="base">
        <div class="bg-div-15 rounded-xl p-6 md:p-8">
            <!-- FILTERS -->
            <div class="bg-[#16161E] border border-white/5 rounded-lg p-4 mb-6">
                <div class="flex items-center justify-between mb-3">
                    <h4
                        class="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-2"
                    >
                        <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                            />
                        </svg>
                        Filtros e Ações
                    </h4>
                    <button
                        @click="openCreate"
                        class="bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                    >
                        <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Novo Documento
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div class="md:col-span-3">
                        <label
                            class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                            >Área</label
                        >
                        <BaseSelect
                            v-model="filters.area"
                            :options="areaOptions"
                            label-key="label"
                            value-key="value"
                            placeholder="Todas"
                        />
                    </div>
                    <div class="md:col-span-3">
                        <label
                            class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                            >Status</label
                        >
                        <BaseSelect
                            v-model="filters.publicado"
                            :options="publicadoOptions"
                            label-key="label"
                            value-key="value"
                            placeholder="Todos"
                        />
                    </div>
                    <div class="md:col-span-3">
                        <label
                            class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                            >Vigência — De</label
                        >
                        <input
                            v-model="filters.vigencia_ini"
                            type="date"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none h-10"
                        />
                    </div>
                    <div class="md:col-span-3">
                        <label
                            class="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5"
                            >Vigência — Até</label
                        >
                        <input
                            v-model="filters.vigencia_fim"
                            type="date"
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none h-10"
                        />
                    </div>
                </div>
            </div>

            <!-- LISTA -->
            <GestaoDocumentosLista
                :is-loading="isLoading"
                :documentos="documentos"
                :pagination="pagination"
                :hash-base-local="hashBaseLocal"
                :area-label="areaLabel"
                :area-badge-class="areaBadgeClass"
                :format-date="formatDate"
                @open-edit="openEdit"
                @open-delete="openDelete"
                @fetch-page="fetchDocumentos"
            />
        </div>

        <!-- MODAL UPSERT -->
        <ModalGestaoDocumento
            :is-open="showModal"
            :form="form"
            :file="file"
            :dragging="dragging"
            :uploading="uploading"
            :error-msg="errorMsg"
            :hash-base-local="hashBaseLocal"
            :escopo-options="escopoOptions"
            :area-options="areaOptions"
            :is-saving="isSaving"
            @close="showModal = false"
            @save="save"
            @update:file="file = $event"
            @update:dragging="dragging = $event"
            @handle-drop="handleDrop"
            @handle-file-change="handleFileChange"
            @remove-file="removeFile"
        />

        <!-- MODAL CONFIRM DELETE -->
        <ModalConfirmDelete
            :is-open="showConfirmDelete"
            :document-name="selectedDoc?.nome_documento || ''"
            :is-deleting="isDeleting"
            @close="showConfirmDelete = false"
            @confirm="confirmDelete"
        />
    </NuxtLayout>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
