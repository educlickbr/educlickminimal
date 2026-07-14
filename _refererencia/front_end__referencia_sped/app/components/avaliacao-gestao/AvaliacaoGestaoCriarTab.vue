<template>
    <!-- ABA: CRIAR AVALIAÇÃO -->
    <div>
        <!-- Empty state -->
        <div
            v-if="!avaliacoes.length && !isLoadingAv"
            class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded mb-6"
        >
            <p class="text-white font-medium">Nenhuma avaliação criada.</p>
            <button
                @click="openCriar"
                class="mt-2 text-primary hover:underline text-xs"
            >
                Criar a primeira avaliação →
            </button>
        </div>

        <!-- Grid de avaliações -->
        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
        >
            <div
                v-for="avl in avaliacoes"
                :key="avl.id"
                class="bg-[#16161E] border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors group"
            >
                <div class="flex items-start justify-between mb-3">
                    <span
                        translate="no"
                        class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider"
                        :class="
                            etapaCor[avl.etapa] || 'bg-white/5 text-secondary'
                        "
                    >
                        {{ avl.etapa }}
                    </span>
                    <div
                        class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <button
                            @click="openEditar(avl)"
                            class="p-1.5 text-secondary hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Editar"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                        <button
                            @click="deletarAvaliacao(avl)"
                            class="p-1.5 text-secondary hover:text-red-400 hover:bg-red-400/5 rounded transition-colors"
                            title="Excluir"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <h4 class="text-white font-bold text-sm mb-1">
                    {{ avl.ano_semestre }}
                </h4>

                <div class="mt-3">
                    <div class="flex items-center justify-between mb-1.5">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wider text-secondary"
                            >Turmas</span
                        >
                        <span class="text-[10px] text-secondary/70">{{
                            getTurmasAvaliacao(avl).length
                        }}</span>
                    </div>

                    <div
                        v-if="getTurmasAvaliacao(avl).length"
                        class="flex flex-wrap gap-1.5"
                    >
                        <span
                            v-for="turma in getTurmasAvaliacao(avl).slice(0, 3)"
                            :key="turma.id"
                            class="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-secondary truncate max-w-full"
                            :title="turmaBadgeLabel(turma)"
                        >
                            {{ turmaBadgeLabel(turma) }}
                        </span>
                        <span
                            v-if="getTurmasAvaliacao(avl).length > 3"
                            class="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary"
                            :title="`${getTurmasAvaliacao(avl).length - 3} turma(s) adicional(is)`"
                        >
                            +{{ getTurmasAvaliacao(avl).length - 3 }}
                        </span>
                    </div>

                    <p v-else class="text-[11px] text-secondary/60 italic">
                        Nenhuma turma vinculada
                    </p>
                </div>
            </div>

            <!-- Botão Nova Avaliação -->
            <button
                @click="openCriar"
                class="border-2 border-dashed border-white/5 rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-secondary hover:text-white hover:border-white/10 transition-all group min-h-[120px]"
            >
                <div
                    class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </div>
                <span class="text-xs font-bold uppercase tracking-widest"
                    >Nova Avaliação</span
                >
            </button>
        </div>

        <!-- Modal de criação/edição -->
        <ModalAvaliacao
            :is-open="showModal"
            :avaliacao="editAvaliacao"
            @close="showModal = false"
            @saved="onSaved"
        />

        <!-- Modal de confirmação de exclusão -->
        <ConfirmationModal
            :is-open="showDeleteConfirm"
            title="Excluir Avaliação"
            :message="`ATENÇÃO!\nTem certeza que deseja excluir permanentemente a avaliação da etapa '${avaliacaoToDelete?.etapa}'?\nEsta ação apagará em cascata todos os critérios correspondentes e as respostas dos alunos!`"
            confirm-text="Excluir"
            cancel-text="Cancelar"
            type="danger"
            :loading="isDeleting"
            @close="showDeleteConfirm = false"
            @confirm="confirmDeleteAvaliacao"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useToast } from "../../../composables/useToast";
import { useAvaliacaoGestaoCriarAvaliacao } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoCriarAvaliacao";
import ConfirmationModal from "~/components/ConfirmationModal.vue";
import ModalAvaliacao from "~/components/avaliacao-gestao/ModalAvaliacao.vue";

const { showToast } = useToast();
const { avaliacoes, isLoadingAv, fetchAvaliacoes, deleteAvaliacao } =
    useAvaliacaoGestaoCriarAvaliacao();

// ── Dados ─────────────────────────────────────────────────────
const filtroEtapa = ref("");

const _fetchAvaliacoes = () => fetchAvaliacoes(filtroEtapa.value || null);

watch(filtroEtapa, _fetchAvaliacoes);

// ── CRUD ──────────────────────────────────────────────────────
const showModal = ref(false);
const editAvaliacao = ref<any>(null);

const openCriar = () => {
    editAvaliacao.value = null;
    showModal.value = true;
};

const openEditar = (avl: any) => {
    editAvaliacao.value = avl;
    showModal.value = true;
};

const onSaved = () => {
    showModal.value = false;
    _fetchAvaliacoes();
};

// ── Deleção ──────────────────────────────────────────────────
const showDeleteConfirm = ref(false);
const avaliacaoToDelete = ref<any>(null);
const isDeleting = ref(false);

const deletarAvaliacao = (avl: any) => {
    avaliacaoToDelete.value = avl;
    showDeleteConfirm.value = true;
};

const confirmDeleteAvaliacao = async () => {
    if (!avaliacaoToDelete.value) return;

    isDeleting.value = true;
    try {
        await deleteAvaliacao(avaliacaoToDelete.value.id);
        showDeleteConfirm.value = false;
        avaliacaoToDelete.value = null;
        showToast("Avaliação excluída com sucesso!", { type: "success" });
        await _fetchAvaliacoes();
    } catch (e: any) {
        showToast(
            e.data?.statusMessage || e.message || "Erro ao excluir avaliação.",
            { type: "error" },
        );
    } finally {
        isDeleting.value = false;
    }
};

// ── Helpers de UI ────────────────────────────────────────────
const etapaCor: Record<string, string> = {
    "O que nos Une": "text-purple-400  border-purple-400/20  bg-purple-400/10",
    "Mundo do Trabalho":
        "text-blue-400    border-blue-400/20    bg-blue-400/10",
    Criação: "text-emerald-400 border-emerald-400/20  bg-emerald-400/10",
    "Relatório Final": "text-amber-400   border-amber-400/20   bg-amber-400/10",
};

const getTurmasAvaliacao = (avl: any): any[] => {
    if (Array.isArray(avl?.turmas)) return avl.turmas;
    if (typeof avl?.turmas === "string") {
        try {
            const parsed = JSON.parse(avl.turmas);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const turmaBadgeLabel = (turma: any): string => {
    const nome = turma?.nome_curso || "Turma";
    const codigo = turma?.cod_turma ? ` (${turma.cod_turma})` : "";
    return `${nome}${codigo}`;
};

// ── Expose para a página pai ──────────────────────────────
defineExpose({ openCriar });

// ── Init ──────────────────────────────────────────────────────
_fetchAvaliacoes();
</script>
