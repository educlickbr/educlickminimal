<script setup lang="ts">
import { ref, watch, computed } from "vue";

const props = defineProps<{
    modelValue: boolean;
    idInscricao: string;
    /** Dados do inscrito do card (nome, status atuais) */
    inscricaoData?: {
        nome_completo?: string;
        nome_display?: string;
        status_dados?: string;
        status_documentacao?: string;
        status_candidatura?: string;
    };
}>();

const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void;
    (e: "avaliado", dados: { campo: string; valor: string }): void;
}>();

const loading = ref(false);
const statusDados = ref("pendente");
const statusDocumentacao = ref("pendente");
const statusCandidatura = ref("pendente");

function fechar() {
    emit("update:modelValue", false);
}

watch(
    () => props.modelValue,
    (aberto) => {
        if (!aberto) return;
        statusDados.value = props.inscricaoData?.status_dados || "pendente";
        statusDocumentacao.value = props.inscricaoData?.status_documentacao || "pendente";
        statusCandidatura.value = props.inscricaoData?.status_candidatura || "pendente";
    },
);

async function avaliar(campo: string, valor: string) {
    loading.value = true;
    try {
        const res = (await $fetch("/api/processos/avaliar", {
            method: "POST",
            body: { id_inscricao: props.idInscricao, campo, valor },
        })) as any;

        if (res?.success) {
            if (campo === "status_dados") statusDados.value = valor;
            if (campo === "status_documentacao") statusDocumentacao.value = valor;
            if (campo === "status_candidatura") statusCandidatura.value = valor;
            emit("avaliado", { campo, valor });
        }
    } catch (e: any) {
        console.error("Erro ao avaliar:", e);
    } finally {
        loading.value = false;
    }
}

function toggleStatus(campo: string, atual: string) {
    const proximo = atual === "aprovado" ? "pendente" : "aprovado";
    avaliar(campo, proximo);
}

const STATUS_COLOR: Record<string, string> = {
    pendente: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    aprovado: "bg-green-500/10 border-green-500/20 text-green-400",
    reprovado: "bg-red-500/10 border-red-500/20 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
    pendente: "Pendente",
    aprovado: "Aprovado",
    reprovado: "Reprovado",
};
</script>

<template>
    <div v-if="modelValue" class="modal-overlay" @click.self="fechar">
        <div class="modal-panel">
            <div class="modal-accent-bar" />

            <div class="modal-header">
                <div class="modal-header-icon">
                    <Icon name="ph:check-square-offset-bold" class="w-5 h-5" />
                </div>
                <div class="modal-header-text flex-1">
                    <h3 class="modal-title">Avaliar Inscrição</h3>
                    <p class="modal-subtitle">
                        {{ inscricaoData?.nome_completo || "—" }}
                        ·
                        {{ inscricaoData?.nome_display || "—" }}
                    </p>
                </div>
                <button @click="fechar" class="modal-close-btn">&times;</button>
            </div>

            <div class="modal-body flex flex-col gap-4">
                <p class="text-[10px] text-secondary/40 uppercase tracking-wider">
                    Clique no botão para alternar entre Pendente e Aprovado
                </p>

                <!-- Dados -->
                <div class="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-4">
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] font-black uppercase tracking-widest text-white/80">
                            Dados do Candidato
                        </span>
                        <span class="text-[9px] text-secondary/40">
                            Informações pessoais e formulário
                        </span>
                    </div>
                    <button
                        @click="toggleStatus('status_dados', statusDados)"
                        :disabled="loading"
                        class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all"
                        :class="STATUS_COLOR[statusDados] || STATUS_COLOR.pendente"
                    >
                        {{ STATUS_LABEL[statusDados] || "Pendente" }}
                    </button>
                </div>

                <!-- Documentação -->
                <div class="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-4">
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] font-black uppercase tracking-widest text-white/80">
                            Documentação
                        </span>
                        <span class="text-[9px] text-secondary/40">
                            Arquivos e comprovantes enviados
                        </span>
                    </div>
                    <button
                        @click="toggleStatus('status_documentacao', statusDocumentacao)"
                        :disabled="loading"
                        class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all"
                        :class="STATUS_COLOR[statusDocumentacao] || STATUS_COLOR.pendente"
                    >
                        {{ STATUS_LABEL[statusDocumentacao] || "Pendente" }}
                    </button>
                </div>

                <!-- Candidatura -->
                <div class="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-4">
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] font-black uppercase tracking-widest text-white/80">
                            Candidatura
                        </span>
                        <span class="text-[9px] text-secondary/40">
                            Decisão final sobre a inscrição
                        </span>
                    </div>
                    <button
                        @click="toggleStatus('status_candidatura', statusCandidatura)"
                        :disabled="loading"
                        class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all"
                        :class="STATUS_COLOR[statusCandidatura] || STATUS_COLOR.pendente"
                    >
                        {{ STATUS_LABEL[statusCandidatura] || "Pendente" }}
                    </button>
                </div>
            </div>

            <div class="modal-footer">
                <button @click="fechar" class="modal-btn-cancel">Fechar</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed; inset: 0; z-index: 60;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.85); padding: 16px;
    animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-panel {
    position: relative; background: #13131a;
    border: 1px solid rgba(139, 92, 246, 0.18); border-radius: 16px;
    width: 100%; max-width: 480px; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(139, 92, 246, 0.1);
    animation: slideUp 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.06); flex-shrink: 0;
}

.modal-header-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(139, 92, 246, 0.12);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
}

.modal-title {
    font-size: 14px; font-weight: 900; color: #c4b5fd;
    text-transform: uppercase; letter-spacing: 0.15em;
}

.modal-subtitle {
    font-size: 10px; font-weight: 700; color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;
}

.modal-close-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4);
    font-size: 18px; font-weight: 700; display: flex;
    align-items: center; justify-content: center; cursor: pointer;
    transition: all 0.15s ease;
}
.modal-close-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

.modal-body { padding: 24px; }

.modal-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.15); flex-shrink: 0;
}

.modal-btn-cancel {
    padding: 10px 22px; border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04); color: rgba(255, 255, 255, 0.45);
    font-size: 11px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s ease;
}
.modal-btn-cancel:hover { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.7); }
</style>
