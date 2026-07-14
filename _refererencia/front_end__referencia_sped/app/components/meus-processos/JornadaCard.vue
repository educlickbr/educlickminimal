<script setup lang="ts">
const props = defineProps<{
    jornada: any;
}>();

defineEmits<{
    "continue-form": [jornada: any];
}>();

const getJornadaStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        rascunho: "Rascunho",
        enviada: "Inscrição enviada",
        em_analise: "Em análise",
        aprovada: "Aprovada",
        reprovada: "Reprovada",
    };
    return labels[status] || status;
};

const getJornadaStatusTone = (status: string) => {
    const tones: Record<string, string> = {
        rascunho: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
        enviada: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
        em_analise: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
        aprovada:
            "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
        reprovada: "bg-red-500/10 text-red-300 border border-red-500/20",
    };
    return (
        tones[status] || "bg-white/5 text-secondary-300 border border-white/10"
    );
};

const getJornadaResumoStatus = (status: string) => {
    if (status === "rascunho") return "Formulário pendente de envio";
    if (status === "enviada") return "Aprovação pendente";
    if (status === "em_analise") return "Em análise pela equipe";
    if (status === "aprovada") return "Inscrição aprovada";
    if (status === "reprovada") return "Inscrição não aprovada";
    return getJornadaStatusLabel(status);
};

const canContinueJornada = (item: any) =>
    item?.status === "rascunho" && !!item?.id_edital;
</script>

<template>
    <div
        class="group bg-div-15 rounded-lg p-4 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
    >
        <div class="flex-grow flex items-center gap-4">
            <div
                class="w-1.5 h-12 rounded-full hidden md:block"
                :class="
                    jornada.status === 'aprovada'
                        ? 'bg-emerald-500'
                        : jornada.status === 'reprovada'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                "
            ></div>

            <div>
                <div
                    class="flex items-center gap-2 mb-2 flex-wrap"
                >
                    <span
                        class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                        :class="
                            getJornadaStatusTone(
                                jornada.status,
                            )
                        "
                    >
                        {{
                            getJornadaStatusLabel(
                                jornada.status,
                            )
                        }}
                    </span>
                    <span
                        class="px-2 py-0.5 rounded bg-white/5 text-secondary-400 text-[10px] font-bold uppercase tracking-wider border border-white/10"
                    >
                        Jornada Paulista
                    </span>
                    <span
                        v-if="jornada.qual_tempo"
                        class="px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 text-[10px] font-bold uppercase tracking-wider border border-fuchsia-500/20"
                    >
                        {{
                            jornada.qual_tempo ===
                            "primeiro_tempo"
                                ? "Primeiro Tempo"
                                : "Segundo Tempo"
                        }}
                    </span>
                </div>

                <h3
                    class="text-sm md:text-base font-bold text-white leading-tight group-hover:text-primary transition-colors"
                >
                    {{
                        jornada.nome_grupo ||
                        "Inscrição Jornada Paulista"
                    }}
                </h3>

                <p
                    class="text-[11px] md:text-xs text-secondary-300 mt-1"
                >
                    {{
                        jornada.edital_titulo ||
                        "Edital da Jornada Paulista"
                    }}
                </p>

                <div
                    class="flex flex-wrap gap-4 text-[10px] md:text-xs text-secondary-400 mt-1.5 opacity-60"
                >
                    <span
                        >Status:
                        <strong>{{
                            getJornadaResumoStatus(
                                jornada.status,
                            )
                        }}</strong></span
                    >
                    <span
                        >Solicitado:
                        <strong>{{
                            new Date(jornada.created_at).toLocaleDateString("pt-BR")
                        }}</strong></span
                    >
                </div>
            </div>
        </div>

        <div
            class="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0"
        >
            <button
                v-if="canContinueJornada(jornada)"
                @click="$emit('continue-form', jornada)"
                class="ml-auto md:ml-0 px-4 py-1.5 rounded text-xs font-bold bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
                Continuar formulário
            </button>

            <span
                v-else
                class="ml-auto md:ml-0 px-4 py-1.5 rounded text-xs font-bold bg-white/5 text-white border border-white/10 whitespace-nowrap"
            >
                {{ getJornadaResumoStatus(jornada.status) }}
            </span>
        </div>
    </div>
</template>
