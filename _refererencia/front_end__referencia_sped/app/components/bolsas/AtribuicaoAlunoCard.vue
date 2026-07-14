<script setup lang="ts">
import { ref, computed } from "vue";
import { useAppStore } from "~/stores/app";
import { formatDate } from "~/utils/date";
import ModalDiario from "~/components/global/ModalDiario.vue";

const props = defineProps<{
    aluno: any;
}>();

const emit = defineEmits<{
    (e: "atribuir", aluno: any): void;
    (e: "suplente", aluno: any): void;
    (e: "encerrar", aluno: any): void;
    (e: "reativar", aluno: any): void;
    (e: "promover", aluno: any): void;
    (e: "dados", aluno: any): void;
}>();

const store = useAppStore();

const studentLabel = computed(() => {
    return `${props.aluno?.nome || ""} ${props.aluno?.sobrenome || ""}`.trim();
});

const socialName = computed(() =>
    String(props.aluno?.nome_social || "").trim(),
);

const socialLabel = computed(() => socialName.value || "--");
const hasSocialName = computed(() => socialName.value.length > 0);

const primaryName = computed(() => {
    return socialName.value || studentLabel.value;
});

const legalName = computed(() => {
    if (!socialName.value) return "";
    if (!studentLabel.value) return "";
    if (socialName.value.toLowerCase() === studentLabel.value.toLowerCase())
        return "";
    return studentLabel.value;
});

const getBadgeClass = (active: boolean, variant: "blue" | "green" | "gray") => {
    if (!active) return "bg-white/5 text-secondary border border-white/5";
    if (variant === "blue")
        return "bg-blue-400/10 text-blue-400 border border-blue-400/20";
    if (variant === "green")
        return "bg-green-400/10 text-green-400 border border-green-400/20";
    return "bg-white/5 text-secondary border border-white/5";
};

const isSuplente = computed(() => {
    if (
        props.aluno?.is_suplente !== undefined &&
        props.aluno?.is_suplente !== null
    ) {
        return !!props.aluno.is_suplente;
    }

    if (props.aluno?.id_atribuicao_suplente) {
        return true;
    }

    return (
        !!props.aluno?.id_atribuicao &&
        !props.aluno?.vigencia_inicio &&
        !props.aluno?.vigencia_fim &&
        !props.aluno?.atribuido
    );
});
const isEncerrado = computed(() => {
    if (isSuplente.value) return false;
    return !props.aluno?.atribuido && props.aluno?.encerrado_historico;
});

// Modal Diario
const showDiarioModal = ref(false);
</script>

<template>
    <div
        class="bg-[#16161E] border border-white/5 rounded-xl flex md:overflow-visible overflow-hidden hover:border-primary/30 transition-colors group relative min-h-[160px]"
    >
        <div
            class="w-24 md:w-32 relative flex-shrink-0 bg-white/5 border-r border-white/5 flex flex-col group/photo"
        >
            <div class="relative flex-1 w-full rounded-tl-xl md:rounded-tl-lg">
                <img
                    v-if="aluno.imagem_user && store.hash_base"
                    :src="store.hash_base + aluno.imagem_user"
                    class="absolute inset-0 w-full h-full object-cover transition-all duration-300 z-10 rounded-tl-xl md:rounded-tl-lg group-hover/photo:scale-[1.8] group-hover/photo:translate-x-16 group-hover/photo:translate-y-16 group-hover/photo:shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover/photo:rounded-lg group-hover/photo:z-50"
                    alt="Foto"
                    @error="(e: any) => (e.target.style.display = 'none')"
                />
                <div
                    v-else
                    class="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-secondary bg-black/20 rounded-tl-xl md:rounded-tl-lg"
                >
                    <span class="text-2xl mb-1"
                        >{{ aluno.nome?.charAt(0)
                        }}{{ aluno.sobrenome?.charAt(0) }}</span
                    >
                    <span class="text-[9px] opacity-50">Sem Foto</span>
                </div>
            </div>
            <div
                class="w-full py-1.5 flex items-center justify-center gap-1.5 border-t border-white/5"
                :class="
                    aluno.atribuido
                        ? 'bg-green-400/10 text-green-400'
                        : isSuplente
                          ? 'bg-amber-400/10 text-amber-300'
                          : isEncerrado
                            ? 'bg-red-400/10 text-red-400'
                            : 'bg-blue-400/10 text-blue-400'
                "
            >
                <span class="text-[8px] font-black uppercase tracking-wider">{{
                    aluno.atribuido
                        ? "ATRIBUÍDO"
                        : isSuplente
                          ? "SUPLENTE"
                          : isEncerrado
                            ? "ENCERRADO"
                            : "DISPONÍVEL"
                }}</span>
            </div>
        </div>

        <div
            class="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0 z-10 gap-3 relative"
        >
            <div class="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                    @click="showDiarioModal = true"
                    class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-secondary hover:text-white transition-colors border border-white/5 flex items-center gap-1"
                    title="Ver faltas do aluno"
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    Diário
                </button>
                <div
                    class="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10"
                >
                    <span class="text-[10px] font-bold text-white"
                        >{{ aluno.qtd_semestres_cursados || 1 }}º</span
                    >
                    <span
                        class="text-[9px] font-bold text-secondary uppercase tracking-wider"
                        >Sem.</span
                    >
                </div>
            </div>

            <div class="absolute top-14 right-3 w-36 flex flex-col gap-1.5">
                <template v-if="!isEncerrado">
                    <button
                        v-if="isSuplente"
                        @click="emit('promover', aluno)"
                        class="w-full px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[9px] font-black uppercase tracking-wider transition-colors border border-amber-500/30"
                    >
                        Promover
                    </button>
                    <button
                        @click="emit('atribuir', aluno)"
                        class="w-full px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[9px] font-black uppercase tracking-wider transition-colors shadow-lg shadow-primary/20"
                    >
                        {{ isSuplente ? "Nova Atribuição" : "Atribuir" }}
                    </button>
                    <button
                        v-if="!isSuplente"
                        @click="emit('encerrar', aluno)"
                        class="w-full px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-[9px] font-black uppercase tracking-wider transition-colors border border-red-600/30"
                    >
                        Encerrar
                    </button>
                    <button
                        @click="emit('suplente', aluno)"
                        class="w-full px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[9px] font-black uppercase tracking-wider transition-colors border border-amber-500/30"
                    >
                        Suplente
                    </button>
                </template>
                <button
                    v-else
                    @click="emit('reativar', aluno)"
                    class="w-full px-2.5 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-300 text-[9px] font-black uppercase tracking-wider transition-colors border border-green-600/30"
                >
                    Desfazer Encerramento
                </button>
                <button
                    @click="emit('dados', aluno)"
                    class="w-full px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-wider transition-colors border border-white/10"
                >
                    Dados
                </button>
            </div>

            <div class="space-y-2 pr-40">
                <div>
                    <h5
                        class="text-sm font-bold text-white truncate leading-tight"
                        :title="primaryName"
                    >
                        {{ primaryName }}
                    </h5>
                    <p
                        v-if="!hasSocialName"
                        class="text-[10px] text-secondary/80 truncate"
                        :title="socialLabel"
                    >
                        Nome social: {{ socialLabel }}
                    </p>
                    <p
                        v-if="legalName"
                        class="text-[10px] text-secondary/80 truncate"
                        :title="legalName"
                    >
                        NR: {{ legalName }}
                    </p>
                    <p class="text-[10px] text-secondary truncate">
                        {{ aluno.email }}
                    </p>
                </div>

                <div class="flex flex-wrap gap-2">
                    <span
                        class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                        :class="getBadgeClass(aluno.inscrito_edital, 'blue')"
                    >
                        {{
                            aluno.inscrito_edital
                                ? "Inscrito Edital"
                                : "Sem inscrição"
                        }}
                    </span>
                    <span
                        class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                        :class="getBadgeClass(aluno.atribuido, 'green')"
                    >
                        {{ aluno.atribuido ? "Atribuído" : "Não atribuído" }}
                    </span>
                    <span
                        v-if="isSuplente"
                        class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    >
                        Suplente
                    </span>
                </div>

                <div class="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5">
                    <div class="col-span-2">
                        <p
                            class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                        >
                            Curso
                        </p>
                        <p
                            class="text-[10px] text-white font-medium truncate"
                            :title="aluno.nome_curso"
                        >
                            {{ aluno.nome_curso }}
                        </p>
                    </div>

                    <div>
                        <p
                            class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                        >
                            Turno
                        </p>
                        <p class="text-[10px] text-white font-medium">
                            {{ aluno.turno }}
                        </p>
                    </div>

                    <div>
                        <p
                            class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                        >
                            RA
                        </p>
                        <p class="text-[10px] text-white font-medium font-mono">
                            {{ aluno.ra || "---" }}
                        </p>
                    </div>
                </div>

                <div
                    v-if="aluno.atribuido"
                    class="text-[10px] text-secondary/70"
                >
                    <span class="text-secondary">Vigência:</span>
                    <span class="text-white">{{
                        formatDate(aluno.vigencia_inicio)
                    }}</span>
                    <span v-if="aluno.vigencia_fim">
                        - {{ formatDate(aluno.vigencia_fim) }}</span
                    >
                </div>
                <div
                    v-else-if="isSuplente"
                    class="text-[10px] text-amber-300/90"
                >
                    <span class="text-amber-200">Aguardando promoção</span>
                </div>
                <div v-else-if="isEncerrado" class="space-y-0.5">
                    <div class="text-[10px] text-secondary/70">
                        <span class="text-secondary">Vigência: </span>
                        <span class="text-white">{{
                            formatDate(aluno.vigencia_inicio_enc)
                        }}</span>
                        <span v-if="aluno.vigencia_fim_enc">
                            – {{ formatDate(aluno.vigencia_fim_enc) }}</span
                        >
                    </div>
                    <div
                        v-if="aluno.motivo_inativacao_enc"
                        class="text-[10px] text-red-400/80"
                    >
                        <span class="text-secondary">Motivo: </span
                        >{{ aluno.motivo_inativacao_enc }}
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-2 mt-1 pt-2 border-t border-white/5">
                <div class="text-[9px] text-secondary/40">
                    {{
                        aluno.nome_curso_turno ||
                        aluno.nome_curso ||
                        aluno.nome_turma
                    }}
                </div>
            </div>
        </div>
    </div>

    <ModalDiario
        :is-open="showDiarioModal"
        :aluno="aluno"
        @close="showDiarioModal = false"
    />
</template>
