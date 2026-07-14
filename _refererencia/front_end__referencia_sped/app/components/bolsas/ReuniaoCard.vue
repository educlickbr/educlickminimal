<script setup lang="ts">
import { ref, computed } from "vue";
import { formatDate } from "~/utils/date";
import ModalDiario from "~/components/global/ModalDiario.vue";

type ReuniaoPresencaStatus =
    | "presente"
    | "falta"
    | "abonada"
    | "justificada"
    | null;

const props = defineProps<{
    reuniao: any;
}>();

const emit = defineEmits<{
    (
        e: "presenca-change",
        id_reuniao: string,
        id_atribuicao: string,
        presenca: ReuniaoPresencaStatus,
        observacoes: string,
    ): void;
}>();

const isExpanded = ref(false);
const isSaving = ref<Record<string, boolean>>({});
const observacoes = ref<Record<string, string>>({});

// Modal Diario
const showDiarioModal = ref(false);
const diarioAluno = ref<any>(null);

const openDiario = (aluno: any) => {
    console.log("[ReuniaoCard] openDiario — aluno:", {
        id_matricula: aluno.id_matricula,
        id_aluno: aluno.id_aluno,
        id_turma: aluno.id_turma,
        nome: aluno.nome,
    });
    diarioAluno.value = {
        id_matricula: aluno.id_matricula,
        id_aluno: aluno.id_aluno,
        id_turma: aluno.id_turma,
        nome: aluno.nome,
        sobrenome: aluno.sobrenome,
        nome_curso: aluno.nome_curso,
        ano_semestre: aluno.ano_semestre,
    };
    showDiarioModal.value = true;
};

const statusOptions: Array<{
    value: Exclude<ReuniaoPresencaStatus, null>;
    label: string;
    shortLabel: string;
}> = [
    { value: "presente", label: "Presente", shortLabel: "P" },
    { value: "falta", label: "Falta", shortLabel: "F" },
    { value: "abonada", label: "Abonada", shortLabel: "A" },
    { value: "justificada", label: "Justificada", shortLabel: "J" },
];

const totalAtribuidosExibicao = computed(() => {
    const alunos = Array.isArray(props.reuniao?.alunos)
        ? props.reuniao.alunos
        : [];
    if (alunos.length > 0) {
        return alunos.filter((aluno: any) => !aluno?.encerrado).length;
    }
    return Number(props.reuniao?.total_atribuidos || 0);
});

const totalExecutados = computed(() => {
    const alunos = Array.isArray(props.reuniao?.alunos)
        ? props.reuniao.alunos
        : [];
    if (alunos.length === 0) {
        return Number(props.reuniao?.total_presentes || 0);
    }

    return alunos.filter((aluno: any) => {
        if (aluno?.encerrado) return false;
        return aluno?.presenca !== null && aluno?.presenca !== undefined;
    }).length;
});

const percentualExecucao = computed(() => {
    if (!totalAtribuidosExibicao.value || totalAtribuidosExibicao.value === 0)
        return 0;
    return Math.round(
        (totalExecutados.value / totalAtribuidosExibicao.value) * 100,
    );
});

const alunosOrdenados = computed(() => {
    const list = Array.isArray(props.reuniao?.alunos)
        ? [...props.reuniao.alunos]
        : [];
    return list.sort((a: any, b: any) => {
        const aClosed = !!a?.encerrado;
        const bClosed = !!b?.encerrado;
        if (aClosed !== bClosed) return aClosed ? 1 : -1;
        const aSocial = String(a?.nome_social || "").trim();
        const aName = (aSocial || `${a?.nome || ""} ${a?.sobrenome || ""}`)
            .trim()
            .toLowerCase();
        const bSocial = String(b?.nome_social || "").trim();
        const bName = (bSocial || `${b?.nome || ""} ${b?.sobrenome || ""}`)
            .trim()
            .toLowerCase();
        return aName.localeCompare(bName);
    });
});

const getAlunoPrimaryName = (aluno: any) => {
    const social = String(aluno?.nome_social || "").trim();
    return social || `${aluno?.nome || ""} ${aluno?.sobrenome || ""}`.trim();
};

const getAlunoLegalName = (aluno: any) => {
    const social = String(aluno?.nome_social || "").trim();
    const nomeCompleto =
        `${aluno?.nome || ""} ${aluno?.sobrenome || ""}`.trim();
    if (
        social &&
        nomeCompleto &&
        social.toLowerCase() !== nomeCompleto.toLowerCase()
    )
        return nomeCompleto;
    return "";
};

const hasAlunoSocialName = (aluno: any) => {
    return String(aluno?.nome_social || "").trim().length > 0;
};

const setPresenca = async (
    idReuniao: string,
    idAtribuicao: string,
    presenca: ReuniaoPresencaStatus,
) => {
    isSaving.value[idAtribuicao] = true;
    try {
        emit(
            "presenca-change",
            idReuniao,
            idAtribuicao,
            presenca,
            observacoes.value[idAtribuicao] || "",
        );
    } finally {
        isSaving.value[idAtribuicao] = false;
    }
};

const getStatusButtonClass = (
    currentStatus: ReuniaoPresencaStatus,
    buttonStatus: Exclude<ReuniaoPresencaStatus, null>,
    isDisabled: boolean,
) => {
    if (isDisabled)
        return "border-white/10 bg-white/5 text-secondary cursor-not-allowed";
    if (currentStatus === buttonStatus) {
        if (buttonStatus === "presente")
            return "border-emerald-500 bg-emerald-600 text-white";
        if (buttonStatus === "falta")
            return "border-red-500 bg-red-600 text-white";
        if (buttonStatus === "abonada")
            return "border-amber-500 bg-amber-500 text-white";
        return "border-sky-500 bg-sky-600 text-white";
    }

    if (buttonStatus === "presente")
        return "border-emerald-700/60 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40";
    if (buttonStatus === "falta")
        return "border-red-700/60 bg-red-900/30 text-red-300 hover:bg-red-800/40";
    if (buttonStatus === "abonada")
        return "border-amber-700/60 bg-amber-900/30 text-amber-300 hover:bg-amber-800/40";
    return "border-sky-700/60 bg-sky-900/30 text-sky-300 hover:bg-sky-800/40";
};
</script>

<template>
    <div
        class="bg-[#16161E] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors"
    >
        <!-- Header / Collapsed State -->
        <button
            @click="isExpanded = !isExpanded"
            class="w-full px-4 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
            <div class="flex items-center gap-4 flex-1 text-left">
                <!-- Calendar Icon -->
                <div
                    class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                >
                    <svg
                        class="w-5 h-5 text-primary"
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
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate">
                        {{ reuniao.nome }}
                    </h4>
                    <p
                        v-if="reuniao.edital_titulo"
                        class="text-[11px] text-primary/90 mt-0.5 truncate"
                    >
                        Edital: {{ reuniao.edital_titulo }}
                    </p>
                    <p class="text-xs text-secondary mt-0.5">
                        {{ formatDate(reuniao.data_reuniao) }}
                    </p>
                </div>
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-4 ml-4">
                <!-- Presença Badge -->
                <div class="text-right">
                    <div class="text-sm font-bold text-primary">
                        {{ percentualExecucao }}%
                    </div>
                    <div class="text-[10px] text-secondary">
                        {{ totalExecutados }}/{{ totalAtribuidosExibicao }}
                    </div>
                </div>

                <!-- Expand Icon -->
                <svg
                    :class="[
                        'w-5 h-5 text-secondary transition-transform flex-shrink-0',
                        { 'rotate-180': isExpanded },
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                </svg>
            </div>
        </button>

        <!-- Expanded State: Presença List -->
        <transition
            enter-active-class="transition duration-200"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[2000px] opacity-100"
            leave-active-class="transition duration-150"
            leave-from-class="max-h-[2000px] opacity-100"
            leave-to-class="max-h-0 opacity-0"
        >
            <div
                v-if="isExpanded"
                class="border-t border-white/5 bg-black/20 max-h-[600px] overflow-y-auto"
            >
                <!-- Empty State -->
                <div
                    v-if="!reuniao.alunos || reuniao.alunos.length === 0"
                    class="p-4 text-center text-secondary text-sm"
                >
                    Nenhum aluno atribuído para esta reunião
                </div>

                <!-- Alunos List -->
                <div v-else class="divide-y divide-white/5">
                    <div
                        v-for="aluno in alunosOrdenados"
                        :key="aluno.id_atribuicao"
                        :class="[
                            'p-3 flex items-center justify-between gap-3 transition-colors',
                            aluno.encerrado
                                ? 'bg-red-950/10 hover:bg-red-950/20'
                                : 'hover:bg-white/5',
                        ]"
                    >
                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-white truncate">
                                {{ getAlunoPrimaryName(aluno) }}
                            </p>
                            <p
                                v-if="!hasAlunoSocialName(aluno)"
                                class="text-[10px] text-secondary/80 truncate"
                            >
                                Nome social: --
                            </p>
                            <p
                                v-if="getAlunoLegalName(aluno)"
                                class="text-[10px] text-secondary/80 truncate"
                            >
                                NR: {{ getAlunoLegalName(aluno) }}
                            </p>
                            <p class="text-xs text-secondary truncate">
                                {{ aluno.email }}
                            </p>
                            <p class="text-[10px] text-secondary/70 mt-0.5">
                                {{ aluno.ra }}
                                <span v-if="aluno.nome_curso || aluno.turno">
                                    •
                                    {{
                                        aluno.nome_curso ||
                                        "Curso não informado"
                                    }}
                                    <span v-if="aluno.turno">
                                        • {{ aluno.turno }}</span
                                    >
                                </span>
                            </p>
                            <p
                                v-if="aluno.encerrado"
                                class="text-[10px] text-red-300 mt-1"
                            >
                                Bolsa encerrada
                                <span v-if="aluno.vigencia_fim">
                                    em
                                    {{ formatDate(aluno.vigencia_fim) }}</span
                                >
                            </p>
                            <button
                                @click="openDiario(aluno)"
                                class="mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-secondary hover:text-white transition-colors border border-white/5"
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
                        </div>

                        <!-- Status Badge -->
                        <div class="flex-shrink-0">
                            <span
                                v-if="aluno.presenca"
                                :class="[
                                    'inline-flex items-center justify-center w-6 h-6 rounded text-white text-[10px] font-black',
                                    aluno.presenca === 'presente'
                                        ? 'bg-emerald-600'
                                        : '',
                                    aluno.presenca === 'falta'
                                        ? 'bg-red-600'
                                        : '',
                                    aluno.presenca === 'abonada'
                                        ? 'bg-amber-500'
                                        : '',
                                    aluno.presenca === 'justificada'
                                        ? 'bg-sky-600'
                                        : '',
                                ]"
                                :title="`${aluno.presenca.charAt(0).toUpperCase()}${aluno.presenca.slice(1)}`"
                            >
                                {{
                                    aluno.presenca === "presente"
                                        ? "P"
                                        : aluno.presenca === "falta"
                                          ? "F"
                                          : aluno.presenca === "abonada"
                                            ? "A"
                                            : aluno.presenca === "justificada"
                                              ? "J"
                                              : ""
                                }}
                            </span>
                        </div>

                        <!-- Presença (P/F/Reset) -->
                        <div class="flex-shrink-0 flex items-center gap-2">
                            <div
                                class="flex items-center gap-1.5 flex-wrap justify-end"
                            >
                                <button
                                    v-for="status in statusOptions"
                                    :key="status.value"
                                    :disabled="
                                        isSaving[aluno.id_atribuicao] ||
                                        aluno.encerrado
                                    "
                                    @click="
                                        setPresenca(
                                            reuniao.id,
                                            aluno.id_atribuicao,
                                            status.value,
                                        )
                                    "
                                    :class="[
                                        'min-w-8 h-8 px-2 rounded flex items-center justify-center text-xs font-black transition-all border',
                                        getStatusButtonClass(
                                            aluno.presenca ?? null,
                                            status.value,
                                            isSaving[aluno.id_atribuicao] ||
                                                aluno.encerrado,
                                        ),
                                    ]"
                                    :title="status.label"
                                >
                                    {{ status.shortLabel }}
                                </button>
                            </div>

                            <svg
                                v-if="isSaving[aluno.id_atribuicao]"
                                class="w-3 h-3 text-primary animate-spin flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>

    <ModalDiario
        :is-open="showDiarioModal"
        :aluno="diarioAluno"
        @close="showDiarioModal = false"
    />
</template>
