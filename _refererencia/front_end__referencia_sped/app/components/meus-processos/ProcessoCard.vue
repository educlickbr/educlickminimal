<script setup lang="ts">
defineProps<{
    processo: any;
    canEnroll?: boolean;
}>();

defineEmits<{
    enroll: [processo: any];
    "open-documents": [processo: any];
}>();

const formatDate = (dateString: string) => {
    if (!dateString) return "--/--/----";
    return new Date(dateString).toLocaleDateString("pt-BR");
};
</script>

<template>
    <div
        class="group bg-div-15 rounded-lg p-4 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
    >
        <!-- Info Column -->
        <div class="flex-grow flex items-center gap-4">
            <!-- Status Dot -->
            <div
                class="w-1.5 h-12 rounded-full hidden md:block"
                :class="
                    processo.documentos_pendentes
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                "
            ></div>

            <div>
                <div class="flex items-center gap-2 mb-2">
                    <span
                        class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20"
                    >
                        Inscrito
                    </span>
                    <span
                        class="px-2 py-0.5 rounded bg-white/5 text-secondary-400 text-[10px] font-bold uppercase tracking-wider border border-white/10"
                    >
                        {{ processo.area_normalizada }}
                    </span>
                    <!-- Tipo Candidatura (Novo) -->
                    <span
                        v-if="processo.tipo_candidatura"
                        class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20"
                    >
                        {{ processo.tipo_candidatura }}
                    </span>
                </div>

                <h3
                    class="text-sm md:text-base font-bold text-white leading-tight group-hover:text-primary transition-colors"
                >
                    {{ processo.nome_curso }}
                </h3>

                <div
                    class="flex flex-wrap gap-4 text-[10px] md:text-xs text-secondary-400 mt-1.5 opacity-60"
                >
                    <span
                        >Solicitado:
                        <strong>{{
                            formatDate(processo.criado_em)
                        }}</strong></span
                    >
                    <span
                        >Início:
                        <strong>{{
                            formatDate(processo.dt_ini_curso)
                        }}</strong></span
                    >
                </div>
            </div>
        </div>

        <!-- Action Column -->
        <div class="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            <span
                v-if="processo.documentos_pendentes"
                class="text-[10px] font-bold text-red-400 uppercase tracking-wide md:hidden"
            >
                Pendente
            </span>

            <span
                v-if="processo.is_matriculado"
                class="px-4 py-1.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap"
            >
                Matriculado
            </span>

            <!-- Botão Matrícula -->
            <button
                v-if="!processo.is_matriculado && canEnroll"
                @click="$emit('enroll', processo)"
                class="px-4 py-1.5 rounded text-xs font-bold bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
                Matricule-se
            </button>

            <button
                @click="$emit('open-documents', processo)"
                class="ml-auto md:ml-0 px-4 py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                :class="
                    processo.documentos_pendentes
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                "
            >
                {{
                    processo.documentos_pendentes
                        ? "Corrigir"
                        : "Ver Documentos"
                }}
            </button>
        </div>
    </div>
</template>
