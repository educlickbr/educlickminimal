<script setup lang="ts">
import BaseSelect from "../BaseSelect.vue";
import {
    getAnoSemestre,
    getAnoSemestreList,
} from "../../../utils/ano_semestre";
import draggable from "vuedraggable";
import { useAvaliacaoGestaoCriarAvaliacao } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoCriarAvaliacao";

const {
    fetchTurmas: _fetchTurmasModal,
    upsertAvaliacao,
    acaoTurma,
    fetchCriterios,
    saveCriterio,
    deleteCriterio,
    fetchTurmasAvaliacao,
    fetchAvaliadores,
} = useAvaliacaoGestaoCriarAvaliacao();

const props = defineProps<{
    isOpen: boolean;
    avaliacao?: any | null;
}>();

const emit = defineEmits<{
    close: [];
    saved: [];
}>();

// ── Abas ─────────────────────────────────────────────────────
const abaAtiva = ref<"turmas" | "criterios" | "avaliador">("turmas");

// ── Semestres ─────────────────────────────────────────────────
const semestres = getAnoSemestreList(6);

// ── Opções ───────────────────────────────────────────────────
const etapaOptions = [
    "O que nos Une",
    "Mundo do Trabalho",
    "Criação",
    "Relatório Final",
];

// ── Form (aba Turmas) ────────────────────────────────────────
const form = ref({
    id: null as string | null,
    ano_semestre: getAnoSemestre(),
    etapa: "",
    id_avaliador_1: "",
    id_avaliador_2: "",
});

// ── Abas e Opções ────────────────────────────────────────────

// Multi-seleção de turmas
const todasTurmas = ref<any[]>([]);
const turmasSelected = ref<string[]>([]); // IDs selecionados AGORA
const turmasOriginal = ref<string[]>([]); // IDs ao abrir (para calcular diff)
const buscaTurma = ref("");
const loadingTurmas = ref(false);
const savingTurmas = ref(false);
const erroTurmas = ref("");

const turmasFiltradas = computed(() => {
    if (!buscaTurma.value.trim()) return todasTurmas.value;
    const q = buscaTurma.value.toLowerCase();
    return todasTurmas.value.filter(
        (t: any) =>
            t.nome_curso?.toLowerCase().includes(q) ||
            t.cod_turma?.toLowerCase().includes(q),
    );
});

const toggleTurma = (id: string) => {
    const idx = turmasSelected.value.indexOf(id);
    if (idx === -1) turmasSelected.value.push(id);
    else turmasSelected.value.splice(idx, 1);
};

const turmaSelecionada = (id: string) => turmasSelected.value.includes(id);

const turmaLabel = (id: string) => {
    const t = todasTurmas.value.find((t: any) => t.id === id);
    return t ? `${t.nome_curso} (${t.cod_turma || ""})` : id;
};

const carregarTurmasDisponiveis = async () => {
    todasTurmas.value = await _fetchTurmasModal(
        form.value.ano_semestre || undefined,
    );
};

// ── Salvar aba Turmas ────────────────────────────────────────
const salvarTurmas = async () => {
    if (!form.value.ano_semestre) {
        erroTurmas.value = "Selecione o período.";
        return;
    }
    if (!form.value.etapa) {
        erroTurmas.value = "Selecione a etapa.";
        return;
    }

    savingTurmas.value = true;
    erroTurmas.value = "";
    try {
        // 1. Upsert da avaliação (cria ou actualiza)
        const result: any = await upsertAvaliacao({
            id: form.value.id,
            ano_semestre: form.value.ano_semestre,
            etapa: form.value.etapa,
            id_avaliador_1: form.value.id_avaliador_1 || null,
            id_avaliador_2: form.value.id_avaliador_2 || null,
        });
        form.value.id = result?.id;

        // 2. Diff de turmas: adicionar novas, remover desvinculadas
        const toAdd = turmasSelected.value.filter(
            (id) => !turmasOriginal.value.includes(id),
        );
        const toRemove = turmasOriginal.value.filter(
            (id) => !turmasSelected.value.includes(id),
        );

        for (const id_turma of toAdd) {
            await acaoTurma(form.value.id, id_turma, false);
        }
        for (const id_turma of toRemove) {
            await acaoTurma(form.value.id, id_turma, true);
        }

        // Atualiza original após salvar
        turmasOriginal.value = [...turmasSelected.value];

        // Avança para critérios se for nova avaliação
        if (!props.avaliacao) abaAtiva.value = "criterios";

        emit("saved");
    } catch (e: any) {
        erroTurmas.value = e?.statusMessage || "Erro ao salvar.";
    } finally {
        savingTurmas.value = false;
    }
};

// ── Form (aba Critérios) ─────────────────────────────────────
interface Criterio {
    id?: string;
    criterio: string;
    ordem: number;
    _novo?: boolean;
}

const criterios = ref<Criterio[]>([]);
const savingCriterios = ref(false);
const erroCriterios = ref("");

const addCriterio = () =>
    criterios.value.push({
        criterio: "",
        ordem: criterios.value.length,
        _novo: true,
    });

const removerCriterio = async (i: number) => {
    const c = criterios.value.at(i);
    if (!c) return;
    if (c.id) {
        // Existente → excluir no backend
        try {
            await deleteCriterio(c.id);
        } catch (e) {
            console.error(e);
            return;
        }
    }
    criterios.value.splice(i, 1);
};

const salvarCriterios = async () => {
    if (!form.value.id) {
        erroCriterios.value = "Salve a avaliação primeiro (aba Turmas).";
        return;
    }
    savingCriterios.value = true;
    erroCriterios.value = "";
    try {
        for (const [i, c] of criterios.value.entries()) {
            if (!c.criterio.trim()) continue;
            await saveCriterio({
                id_avaliacao: form.value.id,
                criterio: c.criterio,
                ordem: i,
                id: c.id || null,
            });
        }
        emit("saved");
    } catch (e: any) {
        erroCriterios.value = e?.statusMessage || "Erro ao salvar critérios.";
    } finally {
        savingCriterios.value = false;
    }
};

watch(
    () => form.value.ano_semestre,
    (val, old) => {
        if (val && val !== old) carregarTurmasDisponiveis();
    },
);

// ── Watch: reset ao abrir/fechar ────────────────────────────
watch(
    () => props.isOpen,
    async (open) => {
        if (!open) return;
        abaAtiva.value = "turmas";
        erroTurmas.value = "";
        erroCriterios.value = "";

        if (props.avaliacao) {
            // Edição: pré-popula
            form.value = {
                id: props.avaliacao.id,
                ano_semestre: props.avaliacao.ano_semestre,
                etapa: props.avaliacao.etapa,
                id_avaliador_1: props.avaliacao.id_avaliador_1 || "",
                id_avaliador_2: props.avaliacao.id_avaliador_2 || "",
            };

            // Carrega turmas vinculadas e critérios existentes em paralelo
            const [turmasData, criteriosData] = await Promise.all([
                fetchTurmasAvaliacao(props.avaliacao.id).catch(() => []),
                fetchCriterios(props.avaliacao.id).catch(() => []),
            ]);

            const ids = (turmasData as any[]).map((t: any) => t.id);
            turmasSelected.value = ids;
            turmasOriginal.value = [...ids];
            criterios.value = (criteriosData as any[]).map((c: any) => ({
                ...c,
            }));
        } else {
            // Criação
            form.value = {
                id: null,
                ano_semestre: getAnoSemestre(),
                etapa: "",
                id_avaliador_1: "",
                id_avaliador_2: "",
            };
            turmasSelected.value = [];
            turmasOriginal.value = [];
            criterios.value = [];
        }

        await carregarTurmasDisponiveis();
    },
);

// ── Avaliadores (Docentes) ───────────────────────────────────
const opcoesAvaliadores1 = ref<any[]>([]);
const opcoesAvaliadores2 = ref<any[]>([]);
const isSearching1 = ref(false);
const isSearching2 = ref(false);
let avaliadorSearchTimer: ReturnType<typeof setTimeout> | null = null;

const _fetchAvaliadores = async (busca?: string, target: 1 | 2 = 1) => {
    if (target === 1) isSearching1.value = true;
    else isSearching2.value = true;
    try {
        const list = await fetchAvaliadores(busca);
        if (target === 1) {
            const sel1 = opcoesAvaliadores1.value.find(
                (d: any) => d.id === form.value.id_avaliador_1,
            );
            if (sel1 && !list.some((d: any) => d.id === sel1.id))
                list.push(sel1);
            opcoesAvaliadores1.value = list;
        } else {
            const sel2 = opcoesAvaliadores2.value.find(
                (d: any) => d.id === form.value.id_avaliador_2,
            );
            if (sel2 && !list.some((d: any) => d.id === sel2.id))
                list.push(sel2);
            opcoesAvaliadores2.value = list;
        }
    } catch (e) {
        console.error(e);
    } finally {
        if (target === 1) isSearching1.value = false;
        else isSearching2.value = false;
    }
};

const onSearchAvaliador1 = (val: string) => {
    if (avaliadorSearchTimer) clearTimeout(avaliadorSearchTimer);
    avaliadorSearchTimer = setTimeout(() => _fetchAvaliadores(val, 1), 350);
};

const onSearchAvaliador2 = (val: string) => {
    if (avaliadorSearchTimer) clearTimeout(avaliadorSearchTimer);
    avaliadorSearchTimer = setTimeout(() => _fetchAvaliadores(val, 2), 350);
};

watch(abaAtiva, (aba) => {
    if (aba === "avaliador") {
        if (!opcoesAvaliadores1.value.length) _fetchAvaliadores("", 1);
        if (!opcoesAvaliadores2.value.length) _fetchAvaliadores("", 2);
    }
});

const salvarAvaliadores = async () => {
    savingTurmas.value = true;
    try {
        await upsertAvaliacao({
            id: form.value.id,
            ano_semestre: form.value.ano_semestre,
            etapa: form.value.etapa,
            id_avaliador_1: form.value.id_avaliador_1 || null,
            id_avaliador_2: form.value.id_avaliador_2 || null,
        });
        emit("saved");
        emit("close");
    } catch (e) {
        console.error(e);
    } finally {
        savingTurmas.value = false;
    }
};
</script>

<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                @click.self="emit('close')"
            >
                <div
                    class="bg-[#16161E] border border-white/10 rounded w-full max-w-2xl flex flex-col shadow-2xl max-h-[90vh]"
                >
                    <!-- ── Header ────────────────────────────────────── -->
                    <div
                        class="flex items-start justify-between px-6 pt-5 pb-0 flex-shrink-0"
                    >
                        <div>
                            <h3 class="text-lg font-bold text-white">
                                {{
                                    form.id
                                        ? "Editar Avaliação"
                                        : "Nova Avaliação"
                                }}
                            </h3>
                            <p
                                v-if="form.id"
                                class="text-xs text-secondary mt-0.5 font-mono"
                            >
                                {{ form.ano_semestre }} · {{ form.etapa }}
                            </p>
                        </div>
                        <button
                            @click="emit('close')"
                            class="text-secondary hover:text-white transition-colors p-1 flex-shrink-0"
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
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <!-- ── Abas (underline, estilo matriculas) ──────── -->
                    <div
                        class="flex items-center gap-6 px-6 pt-4 border-b border-secondary/10 flex-shrink-0"
                    >
                        <button
                            @click="abaAtiva = 'turmas'"
                            class="text-sm font-bold pb-3 relative transition-colors"
                            :class="
                                abaAtiva === 'turmas'
                                    ? 'text-primary'
                                    : 'text-secondary hover:text-white'
                            "
                        >
                            Turmas
                            <span
                                v-if="abaAtiva === 'turmas'"
                                class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                            />
                        </button>
                        <button
                            @click="abaAtiva = 'criterios'"
                            :disabled="!form.id"
                            class="text-sm font-bold pb-3 relative transition-colors"
                            :class="
                                abaAtiva === 'criterios'
                                    ? 'text-primary'
                                    : form.id
                                      ? 'text-secondary hover:text-white'
                                      : 'text-secondary/30 cursor-not-allowed'
                            "
                        >
                            Critérios
                            <span
                                v-if="abaAtiva === 'criterios'"
                                class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                            />
                        </button>
                        <button
                            @click="abaAtiva = 'avaliador'"
                            :disabled="!form.id"
                            class="text-sm font-bold pb-3 relative transition-colors"
                            :class="
                                abaAtiva === 'avaliador'
                                    ? 'text-primary'
                                    : form.id
                                      ? 'text-secondary hover:text-white'
                                      : 'text-secondary/30 cursor-not-allowed'
                            "
                        >
                            Avaliadores
                            <span
                                v-if="abaAtiva === 'avaliador'"
                                class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                            />
                        </button>
                    </div>

                    <!-- ── Body ──────────────────────────────────────── -->
                    <div class="p-6 space-y-4 overflow-y-auto flex-1">
                        <!-- ABA TURMAS -->
                        <template v-if="abaAtiva === 'turmas'">
                            <!-- Período + Etapa -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        class="block text-xs text-secondary uppercase tracking-wider mb-1.5 font-bold"
                                        >Período</label
                                    >
                                    <div class="relative">
                                        <select
                                            v-model="form.ano_semestre"
                                            class="w-full bg-[#0f0f15] border border-white/10 text-white text-sm rounded focus:ring-1 focus:ring-primary focus:border-primary p-3 pr-8 outline-none cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled>
                                                Selecione...
                                            </option>
                                            <option
                                                v-for="s in semestres"
                                                :key="s.id"
                                                :value="s.id"
                                            >
                                                {{ s.nome }}
                                            </option>
                                        </select>
                                        <div
                                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary"
                                        >
                                            <svg
                                                class="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label
                                        class="block text-xs text-secondary uppercase tracking-wider mb-1.5 font-bold"
                                        >Etapa</label
                                    >
                                    <div class="relative">
                                        <select
                                            v-model="form.etapa"
                                            class="w-full bg-[#0f0f15] border border-white/10 text-white text-sm rounded focus:ring-1 focus:ring-primary focus:border-primary p-3 pr-8 outline-none cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled>
                                                Selecione...
                                            </option>
                                            <option
                                                v-for="e in etapaOptions"
                                                :key="e"
                                                :value="e"
                                            >
                                                {{ e }}
                                            </option>
                                        </select>
                                        <div
                                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary"
                                        >
                                            <svg
                                                class="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Seleção de turmas -->
                            <div>
                                <label
                                    class="text-xs text-secondary uppercase tracking-wider mb-1.5 font-bold flex items-center gap-2"
                                >
                                    Turmas
                                    <span
                                        v-if="turmasSelected.length"
                                        class="px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-[10px]"
                                    >
                                        {{ turmasSelected.length }}
                                        selecionada{{
                                            turmasSelected.length !== 1
                                                ? "s"
                                                : ""
                                        }}
                                    </span>
                                </label>

                                <!-- Tags selecionadas -->
                                <div
                                    v-if="turmasSelected.length"
                                    class="flex flex-wrap gap-1.5 mb-2"
                                >
                                    <span
                                        v-for="id in turmasSelected"
                                        :key="id"
                                        class="flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] text-primary"
                                    >
                                        {{ turmaLabel(id) }}
                                        <button
                                            @click="toggleTurma(id)"
                                            class="hover:text-red-400 transition-colors"
                                        >
                                            <svg
                                                class="w-2.5 h-2.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="3"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                </div>

                                <!-- Busca -->
                                <input
                                    v-model="buscaTurma"
                                    type="text"
                                    placeholder="Buscar turma..."
                                    class="w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none mb-2"
                                />

                                <!-- Lista -->
                                <div
                                    class="max-h-52 overflow-y-auto rounded border border-white/5 bg-[#0f0f15]"
                                >
                                    <div
                                        v-if="loadingTurmas"
                                        class="flex justify-center py-6"
                                    >
                                        <div
                                            class="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"
                                        />
                                    </div>
                                    <div
                                        v-else-if="!turmasFiltradas.length"
                                        class="py-4 text-center text-secondary text-sm"
                                    >
                                        Nenhuma turma encontrada
                                    </div>
                                    <button
                                        v-for="t in turmasFiltradas"
                                        :key="t.id"
                                        type="button"
                                        @click="toggleTurma(t.id)"
                                        class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors border-b border-white/5 last:border-0"
                                        :class="
                                            turmaSelecionada(t.id)
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-white hover:bg-white/5'
                                        "
                                    >
                                        <span
                                            class="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                                            :class="
                                                turmaSelecionada(t.id)
                                                    ? 'bg-primary border-primary'
                                                    : 'border-white/20 bg-transparent'
                                            "
                                        >
                                            <svg
                                                v-if="turmaSelecionada(t.id)"
                                                class="w-2.5 h-2.5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="3"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </span>
                                        <div class="min-w-0">
                                            <div class="font-medium truncate">
                                                {{ t.nome_curso }}
                                            </div>
                                            <div
                                                class="text-xs text-secondary truncate"
                                            >
                                                {{ t.cod_turma || ""
                                                }}{{
                                                    t.ano_semestre
                                                        ? ` · ${t.ano_semestre}`
                                                        : ""
                                                }}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <!-- Erro -->
                            <div
                                v-if="erroTurmas"
                                class="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-400 text-sm"
                            >
                                {{ erroTurmas }}
                            </div>
                        </template>

                        <!-- ABA CRITÉRIOS -->
                        <template v-else-if="abaAtiva === 'criterios'">
                            <!-- Resumo da avaliação -->
                            <div
                                class="bg-primary/5 border border-primary/20 rounded p-3 text-sm flex items-center gap-3"
                            >
                                <svg
                                    class="w-5 h-5 text-primary flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div>
                                    <span class="text-white font-semibold">{{
                                        form.etapa
                                    }}</span>
                                    <span class="text-secondary mx-2">·</span>
                                    <span class="text-secondary">{{
                                        form.ano_semestre
                                    }}</span>
                                    <span
                                        v-if="turmasSelected.length"
                                        class="text-secondary ml-2"
                                        >· {{ turmasSelected.length }} turma{{
                                            turmasSelected.length !== 1
                                                ? "s"
                                                : ""
                                        }}</span
                                    >
                                </div>
                            </div>

                            <!-- Lista de critérios -->
                            <div>
                                <div
                                    class="flex items-center justify-between mb-3"
                                >
                                    <label
                                        class="text-xs text-secondary uppercase tracking-wider font-bold"
                                        >Critérios de Avaliação</label
                                    >
                                    <button
                                        @click="addCriterio"
                                        class="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold uppercase tracking-wider transition-colors"
                                    >
                                        <svg
                                            class="w-3.5 h-3.5"
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
                                        Adicionar
                                    </button>
                                </div>

                                <div
                                    v-if="!criterios.length"
                                    class="py-8 text-center text-secondary text-sm border border-dashed border-white/10 rounded"
                                >
                                    <p>Nenhum critério ainda.</p>
                                    <button
                                        @click="addCriterio"
                                        class="mt-2 text-primary hover:underline text-xs"
                                    >
                                        Adicionar o primeiro critério →
                                    </button>
                                </div>

                                <div v-else class="space-y-2">
                                    <!-- Listagem Drag n Drop -->
                                    <draggable
                                        v-model="criterios"
                                        item-key="id"
                                        handle=".grip-handle"
                                        animation="200"
                                        ghost-class="opacity-50"
                                        class="space-y-2"
                                    >
                                        <template #item="{ element, index }">
                                            <div
                                                class="flex items-center gap-2 p-1.5 pl-1 rounded-lg border border-white/5 bg-[#0f0f15] transition-colors focus-within:border-primary/50 group"
                                                :class="
                                                    element.criterio !==
                                                    'Conceito Final'
                                                        ? 'hover:border-white/10'
                                                        : ''
                                                "
                                            >
                                                <!-- Grip icon para arrastar (Esquerda) -->
                                                <div
                                                    v-if="
                                                        element.criterio !==
                                                        'Conceito Final'
                                                    "
                                                    class="grip-handle flex-shrink-0 p-1.5 cursor-grab active:cursor-grabbing text-secondary/30 hover:text-white transition-colors rounded-md hover:bg-white/5"
                                                    title="Arraste para reordenar"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="2"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                    >
                                                        <circle
                                                            cx="9"
                                                            cy="12"
                                                            r="1.5"
                                                        ></circle>
                                                        <circle
                                                            cx="9"
                                                            cy="5"
                                                            r="1.5"
                                                        ></circle>
                                                        <circle
                                                            cx="9"
                                                            cy="19"
                                                            r="1.5"
                                                        ></circle>
                                                        <circle
                                                            cx="15"
                                                            cy="12"
                                                            r="1.5"
                                                        ></circle>
                                                        <circle
                                                            cx="15"
                                                            cy="5"
                                                            r="1.5"
                                                        ></circle>
                                                        <circle
                                                            cx="15"
                                                            cy="19"
                                                            r="1.5"
                                                        ></circle>
                                                    </svg>
                                                </div>
                                                <div
                                                    v-else
                                                    class="w-8 flex-shrink-0"
                                                ></div>

                                                <span
                                                    class="text-secondary/50 text-xs font-mono text-center flex-shrink-0 w-3"
                                                    >{{ index + 1 }}</span
                                                >
                                                <input
                                                    v-model="element.criterio"
                                                    type="text"
                                                    :disabled="
                                                        element.criterio ===
                                                        'Conceito Final'
                                                    "
                                                    :placeholder="`Critério ${index + 1}`"
                                                    class="flex-1 bg-transparent border-0 px-2 py-1.5 text-sm focus:ring-0 focus:outline-none"
                                                    :class="
                                                        element.criterio ===
                                                        'Conceito Final'
                                                            ? 'text-secondary/50 cursor-not-allowed'
                                                            : 'text-white'
                                                    "
                                                />

                                                <div
                                                    class="flex items-center pr-1"
                                                    v-if="
                                                        element.criterio !==
                                                        'Conceito Final'
                                                    "
                                                >
                                                    <button
                                                        @click="
                                                            removerCriterio(
                                                                index,
                                                            )
                                                        "
                                                        title="Excluir Critério"
                                                        class="text-secondary/30 hover:text-red-400 transition-colors flex-shrink-0 p-1.5 rounded-md hover:bg-white/5"
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
                                        </template>
                                    </draggable>
                                </div>
                            </div>

                            <!-- Erro -->
                            <div
                                v-if="erroCriterios"
                                class="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-400 text-sm"
                            >
                                {{ erroCriterios }}
                            </div>
                        </template>

                        <!-- ABA AVALIADORES -->
                        <template v-else-if="abaAtiva === 'avaliador'">
                            <!-- Resumo da avaliação (Turmas selecionadas, Etapa e Período) -->
                            <div
                                class="bg-primary/5 border border-primary/20 rounded p-3 text-sm flex items-center gap-3 mb-6"
                            >
                                <svg
                                    class="w-5 h-5 text-primary flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div>
                                    <span class="text-white font-semibold">{{
                                        form.etapa
                                    }}</span>
                                    <span class="text-secondary mx-2">·</span>
                                    <span class="text-secondary">{{
                                        form.ano_semestre
                                    }}</span>
                                    <span
                                        v-if="turmasSelected.length"
                                        class="text-secondary ml-2"
                                        >· {{ turmasSelected.length }} turma{{
                                            turmasSelected.length !== 1
                                                ? "s"
                                                : ""
                                        }}
                                        vinculada{{
                                            turmasSelected.length !== 1
                                                ? "s"
                                                : ""
                                        }}</span
                                    >
                                </div>
                            </div>

                            <div class="space-y-6 min-h-[400px]">
                                <div>
                                    <label
                                        class="block text-xs font-bold text-secondary mb-2 uppercase tracking-wider"
                                        >Primeiro Avaliador</label
                                    >
                                    <BaseSelect
                                        v-model="form.id_avaliador_1"
                                        :options="opcoesAvaliadores1"
                                        labelKey="nome"
                                        valueKey="id"
                                        placeholder="Selecione o avaliador principal..."
                                        :searchable="true"
                                        searchPlaceholder="Buscar docente..."
                                        :searching="isSearching1"
                                        :onSearch="onSearchAvaliador1"
                                        class="w-full"
                                    />
                                    <p class="text-[10px] text-secondary mt-1">
                                        Este profissional terá permissão para
                                        lançar conceitos para as turmas
                                        vinculadas a esta avaliação.
                                    </p>
                                </div>
                                <div class="pt-2 border-t border-white/5">
                                    <label
                                        class="block text-xs font-bold text-secondary mb-2 uppercase tracking-wider"
                                        >Segundo Avaliador (Co-Avaliador)</label
                                    >
                                    <BaseSelect
                                        v-model="form.id_avaliador_2"
                                        :options="opcoesAvaliadores2"
                                        labelKey="nome"
                                        valueKey="id"
                                        placeholder="Selecione um segundo avaliador se necessário..."
                                        :searchable="true"
                                        searchPlaceholder="Buscar docente..."
                                        :searching="isSearching2"
                                        :onSearch="onSearchAvaliador2"
                                        class="w-full"
                                    />
                                    <p class="text-[10px] text-secondary mt-1">
                                        Este docente também terá as mesmas
                                        permissões que o primeiro avaliador.
                                    </p>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- ── Footer ────────────────────────────────────── -->
                    <div
                        class="p-4 border-t border-white/5 flex gap-2 flex-shrink-0"
                    >
                        <!-- Aba Turmas -->
                        <template v-if="abaAtiva === 'turmas'">
                            <button
                                @click="emit('close')"
                                class="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                @click="salvarTurmas"
                                :disabled="savingTurmas"
                                class="flex-1 px-4 py-2 bg-primary hover:brightness-110 text-white text-sm font-bold rounded transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg
                                    v-if="savingTurmas"
                                    class="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    />
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                <span>{{
                                    savingTurmas
                                        ? "Salvando..."
                                        : form.id
                                          ? "Salvar Turmas"
                                          : "Criar e Ir para Critérios →"
                                }}</span>
                            </button>
                        </template>

                        <!-- Aba Critérios -->
                        <template v-else-if="abaAtiva === 'criterios'">
                            <button
                                @click="emit('saved')"
                                class="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded transition-colors"
                            >
                                Pular
                            </button>
                            <button
                                @click="salvarCriterios"
                                :disabled="savingCriterios"
                                class="flex-1 px-4 py-2 bg-primary hover:brightness-110 text-white text-sm font-bold rounded transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg
                                    v-if="savingCriterios"
                                    class="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    />
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                <span>{{
                                    savingCriterios
                                        ? "Salvando..."
                                        : "Salvar Critérios e Concluir"
                                }}</span>
                            </button>
                        </template>

                        <!-- Aba Avaliadores -->
                        <template v-else-if="abaAtiva === 'avaliador'">
                            <button
                                @click="salvarAvaliadores"
                                :disabled="savingTurmas"
                                class="w-full px-4 py-2 bg-primary hover:brightness-110 text-white text-sm font-bold rounded transition-colors flex items-center justify-center gap-2"
                            >
                                <svg
                                    v-if="savingTurmas"
                                    class="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    />
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                <span>Salvar Avaliadores e Fechar</span>
                            </button>
                        </template>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
