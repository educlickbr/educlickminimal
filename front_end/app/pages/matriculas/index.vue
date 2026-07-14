<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppStore } from "~~/stores/app";
import { useMatriculasCore } from "~/composables/matriculas/useMatriculasCore";
import { useMatriculas } from "~/composables/matriculas/useMatriculas";

definePageMeta({ layout: "base" });

const store = useAppStore();
const core = useMatriculasCore();
const ctx = useMatriculas(core.idEntidade);

// ── Modal de detalhes ───────────────────────────────────
const showModalDetalhes = ref(false);
const selectedMatriculaId = ref("");

function abrirDetalhes(id: string) {
    selectedMatriculaId.value = id;
    showModalDetalhes.value = true;
}

// ── Modal de inativar ──────────────────────────────────
const showModalInativar = ref(false);
const inativarMatriculaId = ref("");
const inativarMatriculaData = ref<any>({});
const inativarLoading = ref(false);
const inativarError = ref("");

function abrirInativar(id: string, dados: any) {
    inativarMatriculaId.value = id;
    inativarMatriculaData.value = dados;
    inativarError.value = "";
    showModalInativar.value = true;
}

async function confirmarInativar() {
    inativarLoading.value = true;
    inativarError.value = "";
    try {
        const res = (await $fetch("/api/matriculas/inativar", {
            method: "POST",
            body: {
                id: inativarMatriculaId.value,
                status: "inativa",
            },
        })) as any;

        if (res?.success) {
            // Atualiza in-place para reatividade instantânea
            ctx.atualizarStatusInPlace(
                inativarMatriculaId.value,
                "inativa",
            );
            showModalInativar.value = false;
        } else {
            inativarError.value = res?.message || "Erro ao inativar matrícula";
        }
    } catch (e: any) {
        inativarError.value =
            e?.message || "Erro ao inativar matrícula";
    } finally {
        inativarLoading.value = false;
    }
}

onMounted(async () => {
    if (!store.initialized) await store.initSession();
    await core.fetchAreas();

    const q = useRoute().query.tab as string | undefined;
    if (
        q &&
        (q === "todas" || core.areas.value.some((a: any) => a.id === q))
    ) {
        core.activeTab.value = q;
    }
});
</script>

<template>
    <div class="page-wrap flex flex-col">
        <div class="page-top-row shrink-0" />

        <!-- Loading áreas -->
        <div
            v-if="core.loadingAreas.value"
            class="py-16 flex flex-col items-center justify-center gap-4"
        >
            <div
                class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
            >
                Carregando áreas...
            </span>
        </div>

        <!-- Vazio -->
        <div v-else-if="core.areas.value.length === 0" class="empty-state">
            <Icon
                name="ph:book-open-light"
                class="w-16 h-16 text-secondary/20 mb-4"
            />
            <p class="text-sm font-bold text-white/40 mb-2">
                Nenhuma área cadastrada
            </p>
            <p class="text-xs text-secondary/40">
                Cadastre áreas acadêmicas para gerenciar matrículas.
            </p>
        </div>

        <!-- Conteúdo -->
        <MatriculasList
            v-else
            :areas="core.areas.value"
            :activeTab="core.activeTab.value"
            :setActiveTab="core.setActiveTab"
            :ctx="ctx"
            @verDetalhes="abrirDetalhes"
            @inativar="abrirInativar"
        />
    </div>

    <!-- Modal Detalhes -->
    <MatriculasModalDetalhes
        v-model="showModalDetalhes"
        :idMatricula="selectedMatriculaId"
    />

    <!-- Modal Inativar (confirmação) -->
    <div
        v-if="showModalInativar"
        class="modal-overlay"
        @click.self="showModalInativar = false"
    >
        <div class="modal-panel">
            <div class="modal-accent-bar" />

            <div class="modal-header">
                <div class="modal-header-icon">
                    <Icon
                        name="ph:prohibit-bold"
                        class="w-5 h-5"
                    />
                </div>
                <div class="modal-header-text flex-1">
                    <h3 class="modal-title">Inativar Matrícula</h3>
                    <p class="modal-subtitle">
                        {{
                            inativarMatriculaData?.nome_completo || "—"
                        }}
                        ·
                        {{
                            inativarMatriculaData?.programa_descricao ||
                            "—"
                        }}
                    </p>
                </div>
                <button
                    @click="showModalInativar = false"
                    class="modal-close-btn"
                >
                    &times;
                </button>
            </div>

            <div class="modal-body flex flex-col gap-4">
                <div
                    class="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl"
                >
                    <Icon
                        name="ph:warning-circle-bold"
                        class="w-8 h-8 text-amber-400/60 flex-shrink-0"
                    />
                    <div class="flex flex-col gap-1">
                        <span
                            class="text-[10px] font-black uppercase tracking-widest text-amber-400/80"
                        >
                            Atenção
                        </span>
                        <span
                            class="text-[10px] text-white/60 font-bold leading-relaxed"
                        >
                            Deseja realmente inativar a matrícula de
                            <strong class="text-white/90">{{
                                inativarMatriculaData?.nome_completo || "—"
                            }}</strong>
                            no programa
                            <strong class="text-white/90">{{
                                inativarMatriculaData?.programa_descricao ||
                                "—"
                            }}</strong
                            >?
                        </span>
                        <span
                            class="text-[9px] text-secondary/40 mt-1"
                        >
                            O aluno não terá mais acesso ao curso. Esta ação
                            pode ser revertida.
                        </span>
                    </div>
                </div>

                <div
                    v-if="inativarError"
                    class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                >
                    {{ inativarError }}
                </div>
            </div>

            <div class="modal-footer">
                <button
                    @click="showModalInativar = false"
                    class="modal-btn-cancel"
                    :disabled="inativarLoading"
                >
                    Cancelar
                </button>
                <button
                    @click="confirmarInativar"
                    :disabled="inativarLoading"
                    class="px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <div
                        v-if="inativarLoading"
                        class="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"
                    />
                    <span>Confirmar Inativação</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-wrap {
    padding: 0.25rem 1.5rem 1rem;
    height: 100%;
}

.page-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    background: rgba(255, 255, 255, 0.015);
    border: 2px dashed rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
}

/* Modal styles (replicadas do padrão de processos) */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    padding: 16px;
    animation: fadeIn 0.15s ease;
}
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.modal-panel {
    position: relative;
    background: #13131a;
    border: 1px solid rgba(139, 92, 246, 0.18);
    border-radius: 16px;
    width: 100%;
    max-width: 520px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow:
        0 24px 80px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(139, 92, 246, 0.1);
    animation: slideUp 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
}
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-accent-bar {
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
    flex-shrink: 0;
}

.modal-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
}

.modal-header-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(139, 92, 246, 0.12);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.modal-title {
    font-size: 14px;
    font-weight: 900;
    color: #c4b5fd;
    text-transform: uppercase;
    letter-spacing: 0.15em;
}

.modal-subtitle {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2px;
}

.modal-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.4);
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
}
.modal-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.modal-body {
    padding: 24px;
}

.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
}

.modal-btn-cancel {
    padding: 10px 22px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.45);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s ease;
}
.modal-btn-cancel:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
}
.modal-btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
