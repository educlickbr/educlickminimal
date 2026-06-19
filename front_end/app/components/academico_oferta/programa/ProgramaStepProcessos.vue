<template>
    <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-2">
            <h4
                class="text-sm font-black text-primary uppercase tracking-widest"
            >
                Processos Seletivos
            </h4>
            <p class="text-xs text-secondary/60">
                Cadastre uma ou mais janelas de seleção. Os períodos não podem
                se sobrepor.
            </p>
        </div>
        <div class="flex items-center justify-between">
            <span
                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest"
                >{{ processos.length }} processo(s)</span
            >
            <button
                @click="$emit('addProcesso')"
                :disabled="!canAddProcesso"
                class="px-3 py-2 rounded-lg border border-primary/20 bg-primary/10 text-[10px] font-black text-primary uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            >
                + Novo Processo
            </button>
        </div>
        <div class="flex flex-col gap-4">
            <div
                v-for="(processo, idx) in processos"
                :key="processo.id || idx"
                class="flex flex-col gap-4 p-5 rounded-xl border border-secondary/10 bg-div-5"
            >
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                        >
                            <Icon name="ph:files-bold" class="w-4 h-4" />
                        </div>
                        <h5
                            class="text-xs font-black text-primary uppercase tracking-widest"
                        >
                            Processo {{ idx + 1 }}
                        </h5>
                    </div>
                    <button
                        v-if="processos.length > 1"
                        @click="$emit('removeProcesso', idx)"
                        class="w-7 h-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                        title="Remover"
                    >
                        <Icon name="ph:trash-bold" class="w-3.5 h-3.5" />
                    </button>
                </div>
                <div class="flex flex-col gap-1.5">
                    <label
                        class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1"
                        >Nome do Processo</label
                    >
                    <input
                        type="text"
                        v-model="processo.nome_processo"
                        placeholder="Ex: Vestibular 2026/1"
                        class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-primary bg-background outline-none focus:border-primary/40 transition-colors"
                    />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center gap-3 mb-1">
                            <div
                                class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                            >
                                <Icon
                                    name="ph:calendar-check-bold"
                                    class="w-5 h-5"
                                />
                            </div>
                            <h6
                                class="text-[10px] font-black text-primary uppercase tracking-widest"
                            >
                                Processo Seletivo
                            </h6>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label
                                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1"
                                >Início</label
                            ><input
                                type="datetime-local"
                                v-model="processo.data_inicio"
                                class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-primary bg-background outline-none focus:border-primary/40 transition-colors"
                            />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label
                                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1"
                                >Fim</label
                            ><input
                                type="datetime-local"
                                v-model="processo.data_fim"
                                class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-primary bg-background outline-none focus:border-primary/40 transition-colors"
                            />
                        </div>
                    </div>
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center gap-3 mb-1">
                            <div
                                class="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center"
                            >
                                <Icon
                                    name="ph:user-plus-bold"
                                    class="w-5 h-5"
                                />
                            </div>
                            <h6
                                class="text-[10px] font-black text-green-500 uppercase tracking-widest"
                            >
                                Matrícula (Opcional)
                            </h6>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label
                                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1"
                                >Início</label
                            ><input
                                type="datetime-local"
                                v-model="processo.matricula_inicio"
                                class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-green-500 bg-background outline-none focus:border-green-500/40 transition-colors"
                            />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label
                                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1"
                                >Fim</label
                            ><input
                                type="datetime-local"
                                v-model="processo.matricula_fim"
                                class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-green-500 bg-background outline-none focus:border-green-500/40 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="validationMessage"
            class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start"
        >
            <Icon
                name="ph:warning-octagon-fill"
                class="w-5 h-5 text-red-500 shrink-0 mt-0.5"
            />
            <p class="text-[10px] text-red-500/90 leading-relaxed">
                {{ validationMessage }}
            </p>
        </div>
        <div
            v-else
            class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 items-start"
        >
            <Icon
                name="ph:check-circle-fill"
                class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
            />
            <p class="text-[10px] text-emerald-500/90 leading-relaxed">
                Regra ativa: sem overlap entre processos.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    processos: {
        id: string | null;
        nome_processo: string;
        data_inicio: string | null;
        data_fim: string | null;
        matricula_inicio: string | null;
        matricula_fim: string | null;
    }[];
    canAddProcesso: boolean;
    validationMessage: string | null;
}>();

defineEmits<{
    addProcesso: [];
    removeProcesso: [index: number];
}>();
</script>
