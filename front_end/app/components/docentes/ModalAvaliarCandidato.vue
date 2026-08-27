<template>
    <div
        v-if="modelValue"
        class="ds-modal-overlay"
        @click.self="emit('update:modelValue', false)"
    >
        <div class="ds-modal-panel max-w-md">
            <div class="ds-modal-accent-bar" />

            <div class="ds-modal-header">
                <div class="ds-modal-header-icon text-primary">
                    <Icon name="ph:clipboard-light" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">Avaliar Candidato</h3>
                    <p class="ds-modal-subtitle">
                        {{ inscricao?.nome_completo || "—" }}
                    </p>
                </div>
                <button @click="emit('update:modelValue', false)" class="ds-modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="p-6 flex flex-col gap-5">
                <!-- Dados do candidato -->
                <div class="flex items-center gap-4 p-4 bg-div-15 border border-divider rounded-xl">
                    <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-base border border-primary/20 shrink-0">
                        {{ (inscricao?.nome_completo || "?")[0].toUpperCase() }}
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <span class="text-sm font-bold text-text">
                            {{ inscricao?.nome_completo || "—" }}
                        </span>
                        <span class="text-xs text-secondary/60">
                            {{ inscricao?.email || "—" }}
                        </span>
                        <span class="text-[10px] text-secondary/50">
                            Inscrito em {{ formatDate(inscricao?.criado_em) }}
                        </span>
                    </div>
                </div>

                <!-- Status atual -->
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        Status atual:
                    </span>
                    <span
                        class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                        :class="STATUS_OPTIONS.find(s => s.id === inscricao?.status)?.cls || ''"
                    >
                        {{ STATUS_OPTIONS.find(s => s.id === inscricao?.status)?.label || inscricao?.status }}
                    </span>
                </div>

                <!-- Ações -->
                <div class="flex flex-col gap-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                        Alterar para:
                    </span>
                    <div class="grid grid-cols-2 gap-2">
                        <button
                            v-for="opt in STATUS_OPTIONS"
                            :key="opt.id"
                            @click="handleAvaliar(opt.id)"
                            :disabled="saving || inscricao?.status === opt.id"
                            class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02]"
                            :class="inscricao?.status === opt.id ? opt.cls : 'border-divider text-secondary hover:text-text hover:bg-div-15'"
                        >
                            <Icon :name="opt.icon" class="w-4 h-4" />
                            {{ opt.label }}
                        </button>
                    </div>
                </div>

                <!-- Erro -->
                <div
                    v-if="error"
                    class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                >
                    {{ error }}
                </div>
            </div>

            <div class="ds-modal-footer">
                <button
                    @click="emit('update:modelValue', false)"
                    class="ds-btn-cancel"
                    :disabled="saving"
                >
                    Fechar
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
    modelValue: boolean;
    inscricao: any;
    onAvaliar: (id: string, status: string) => Promise<boolean>;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void;
}>();

const saving = ref(false);
const error = ref("");

const STATUS_OPTIONS = [
    { id: "aguardando", label: "Aguardando", icon: "ph:circle-light", cls: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
    { id: "aprovado", label: "Aprovar", icon: "ph:check-circle-bold", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
    { id: "recusado", label: "Recusar", icon: "ph:x-circle-bold", cls: "bg-red-500/10 border-red-500/20 text-red-400" },
    { id: "suplente", label: "Suplente", icon: "ph:clock-clockwise-bold", cls: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
];

async function handleAvaliar(status: string) {
    saving.value = true;
    error.value = "";
    const ok = await props.onAvaliar(props.inscricao.id, status);
    saving.value = false;
    if (ok) {
        emit("update:modelValue", false);
    } else {
        error.value = "Erro ao avaliar inscrição.";
    }
}

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR");
}
</script>

<style scoped>
.ds-modal-panel {
    display: flex;
}
</style>
