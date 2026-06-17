<template>
    <div class="flex flex-col gap-6">
        <!-- Loading -->
        <div
            v-if="loading"
            class="py-16 flex flex-col items-center justify-center gap-3"
        >
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                >Carregando áreas...</span
            >
        </div>

        <!-- Grid -->
        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <!-- Empty -->
            <div v-if="areas.length === 0" class="col-span-full empty-state">
                <div class="empty-icon">
                    <Icon name="ph:folders-bold" class="w-8 h-8" />
                </div>
                <p class="empty-title">Nenhuma área cadastrada</p>
                <p class="empty-subtitle">
                    Use categorias para organizar seus cursos (ex: Exatas,
                    Saúde, Humanas)
                </p>
                <button @click="openNova" class="empty-cta mt-4">
                    Nova Área Educacional
                </button>
            </div>

            <!-- Cards -->
            <div v-for="a in areas" :key="a.id" class="comp-card">
                <div class="comp-card-accent" />
                <div class="comp-avatar">
                    {{ (a.nome_area || "?").charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-primary truncate">
                        {{ a.nome_area }}
                    </p>
                    <p
                        class="text-[9px] text-secondary/40 font-medium truncate"
                    >
                        {{ a.descricao || "Sem descrição" }}
                    </p>
                </div>
                <div class="comp-actions group-hover:opacity-100">
                    <button
                        @click="openEditar(a)"
                        class="comp-action-btn comp-action-edit"
                        title="Editar área"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                        >
                            <path
                                d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM51.31,168,136,83.31,152.69,100,68,184.69ZM48,208V196.69l11.31,11.31Zm48,0H79.31L192,95.31l16.69,16.69Z"
                            />
                        </svg>
                    </button>
                    <button
                        @click="confirmDelete(a.id)"
                        class="comp-action-btn comp-action-delete"
                        title="Excluir área"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                        >
                            <path
                                d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal de criação/edição -->
        <ModalArea
            v-model="showModal"
            :isEdit="isEdit"
            :initialData="editData"
            :idEntidade="idEntidade"
            @saved="handleSaved"
        />

        <!-- Modal de confirmação de exclusão -->
        <ModalConfirmacao
            v-model="showConfirmDelete"
            title="Excluir Área Educacional"
            message="Tem certeza? A exclusão desta área pode afetar cursos e programas vinculados a ela."
            type="danger"
            confirmText="Excluir Área"
            :loading="isDeleting"
            @confirm="handleDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { useOfertaAreas } from "~/composables/academico_oferta/useOfertaAreas";
import { useToast } from "~/composables/useToast";

const props = defineProps<{
    idEntidade: string | null;
}>();

const emit = defineEmits<{
    (e: "dataChanged"): void;
}>();

const toast = useToast();

const {
    areas,
    loading,
    showModal,
    isEdit,
    editData,
    showConfirmDelete,
    isDeleting,
    fetchAreas,
    openNova,
    openEditar,
    handleSaved,
    confirmDelete,
    handleDelete,
} = useOfertaAreas({
    getEntidadeAtivaId: () => props.idEntidade,
    garantirEntidade: async () => {
        if (!props.idEntidade) throw new Error("Entidade ativa não encontrada");
        return props.idEntidade;
    },
    toast,
});

// Expõe para o orquestrador

defineExpose({ fetchAreas, openNova });
</script>
