<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                >{{
                    loading ? "..." : componentes.length + " componente(s)"
                }}</span
            >
            <button @click="openNovo" class="add-btn">+ Novo Componente</button>
        </div>
        <div
            v-if="loading"
            class="py-16 flex flex-col items-center justify-center gap-3"
        >
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                >Carregando...</span
            >
        </div>
        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <div
                v-if="componentes.length === 0"
                class="col-span-full empty-state"
            >
                <p class="text-sm font-bold text-white/40">Nenhum componente</p>
            </div>
            <div v-for="c in componentes" :key="c.id" class="comp-card">
                <div class="comp-avatar">
                    {{ (c.nome_componente || "?").charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-primary truncate">
                        {{ c.nome_componente || "-" }}
                    </p>
                    <p class="text-[9px] text-secondary/40 truncate">
                        {{ c.descricao || "-" }}
                    </p>
                </div>
                <button
                    @click="openEditar(c)"
                    class="comp-action-btn comp-action-edit"
                >
                    ✎
                </button>
                <button
                    @click="confirmDelete(c.id)"
                    class="comp-action-btn comp-action-delete"
                >
                    ✕
                </button>
            </div>
        </div>
        <AcademicoOfertaModalComponente
            v-model="showModal"
            :isEdit="isEdit"
            :initialData="
                editData
                    ? {
                          nome_componente: editData.nome_componente,
                          descricao: editData.descricao ?? undefined,
                      }
                    : null
            "
            @save="handleSave"
        />
        <GlobalModalConfirmacao
            v-model="showConfirmDelete"
            title="Excluir Componente"
            message="Confirmar?"
            type="danger"
            confirmText="Excluir"
            :loading="isDeleting"
            @confirm="handleDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { useOfertaCore } from "~/composables/academico_oferta/useOfertaCore";
import { useToast } from "~/composables/useToast";
import { useAppStore } from "~~/stores/app";

const core = useOfertaCore();
const store = useAppStore();
const toast = useToast();

const componentes = ref<any[]>([]);
const loading = ref(false);
const showModal = ref(false);
const isEdit = ref(false);
const editData = ref<any>(null);
const showConfirmDelete = ref(false);
const deleteTarget = ref<string | null>(null);
const isDeleting = ref(false);

async function fetchComponentes() {
    loading.value = true;
    try {
        const id = await core.garantirEntidade();
        const res = (await $fetch("/api/academico_oferta/componentes", {
            params: { id_entidade: id, page: 1, limit: 20 },
        })) as any;
        componentes.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch (e: any) {
        toast.showToast(e?.message || "Erro", { type: "error" });
    } finally {
        loading.value = false;
    }
}

function openNovo() {
    isEdit.value = false;
    editData.value = null;
    showModal.value = true;
}
function openEditar(c: any) {
    isEdit.value = true;
    editData.value = c;
    showModal.value = true;
}
function confirmDelete(id: string) {
    deleteTarget.value = id;
    showConfirmDelete.value = true;
}

async function handleDelete() {
    if (!deleteTarget.value) return;
    isDeleting.value = true;
    try {
        const id = await core.garantirEntidade();
        await $fetch("/api/academico_oferta/componentes", {
            method: "DELETE",
            body: { id: deleteTarget.value, id_entidade: id },
        });
        toast.showToast("Componente removido", { type: "success" });
        fetchComponentes();
    } catch (e: any) {
        toast.showToast(e.message || "Erro", { type: "error" });
    } finally {
        isDeleting.value = false;
        showConfirmDelete.value = false;
        deleteTarget.value = null;
    }
}

async function handleSave(data: any) {
    try {
        const id = await core.garantirEntidade();
        await $fetch("/api/academico_oferta/componentes", {
            method: "POST",
            body: {
                id: isEdit.value ? editData.value?.id : undefined,
                id_entidade: id,
                nome_componente: data.nome_componente,
                descricao: data.descricao ?? null,
                usuario_id: store.user_expandido_id,
            },
        });
        toast.showToast("Salvo", { type: "success" });
        showModal.value = false;
        fetchComponentes();
    } catch (e: any) {
        toast.showToast(e.message || "Erro", { type: "error" });
    }
}

onMounted(() => fetchComponentes());
</script>

<style scoped>
.comp-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 12px;
}
.comp-avatar {
    background: rgba(139, 92, 246, 0.1);
    color: #a78bfa;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
}
.comp-action-btn {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.5);
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
}
.comp-action-edit:hover {
    background: rgba(139, 92, 246, 0.15);
    color: #c4b5fd;
}
.comp-action-delete:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
}
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
}
.add-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    border: 1px solid rgba(139, 92, 246, 0.4);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}
.add-btn:hover {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.45);
    transform: translateY(-1px);
}
</style>
