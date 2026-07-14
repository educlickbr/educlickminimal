<script setup lang="ts">
import BaseSelect from "~/components/BaseSelect.vue";
import { useAvaliacaoGestaoCriarAvaliacao } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoCriarAvaliacao";
import { useAvaliacaoGestaoConceitos } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoConceitos";

const route = useRoute();
const id_avaliacao = computed(() => route.params.id as string);

// ── Dados da Avaliação ────────────────────────────
const avaliacao = ref<any>(null);
const criterios = ref<any[]>([]);
const turmas = ref<any[]>([]);
const turmaAtiva = ref<string>("");

// ── Grade de Conceitos ────────────────────────────
const grade = ref<any[]>([]);
const isLoading = ref(false);

const conceitoOptions = [
    { id: "Acima do Esperado", label: "Acima do Esperado" },
    { id: "Adequado", label: "Adequado" },
    { id: "Pode Melhorar", label: "Pode Melhorar" },
];

const {
    fetchConceitos: _fetchConceitos,
    salvarConceito: _salvarConceito,
    savingMap,
} = useAvaliacaoGestaoConceitos();

const {
    avaliacoes,
    fetchAvaliacoes,
    fetchCriterios,
    fetchTurmas: _fetchTurmasModal,
} = useAvaliacaoGestaoCriarAvaliacao();

// ── Buscar turmas vinculadas ───────────────────────
const carregarTurmas = async () => {
    try {
        // Busca todas as turmas e filtra via avl_av_turma (via RPC get_avaliacoes)
        // Como a RPC index retorna apenas totais, usamos a lista de avaliações para descobrir o id
        await fetchAvaliacoes(null);
        const avl = avaliacoes.value.find(
            (a: any) => a.id === id_avaliacao.value,
        );
        avaliacao.value = avl || null;

        turmas.value = await _fetchTurmasModal();

        // Selecionar primeira turma automaticamente
        if (turmas.value.length > 0 && !turmaAtiva.value) {
            turmaAtiva.value = turmas.value[0].id;
        }
    } catch (e) {
        console.error(e);
    }
};

const carregarCriterios = async () => {
    try {
        criterios.value = await fetchCriterios(id_avaliacao.value);
    } catch (e) {
        console.error(e);
    }
};

// ── Buscar grade de conceitos ─────────────────────
const carregarGrade = async () => {
    if (!turmaAtiva.value) return;
    isLoading.value = true;
    grade.value = [];
    try {
        const data = await _fetchConceitos(id_avaliacao.value, {
            id_turma: turmaAtiva.value,
        });
        grade.value = data || [];
    } catch (e) {
        console.error(e);
    } finally {
        isLoading.value = false;
    }
};

// ── Auto-save conceito ────────────────────────────
const getConceito = (aluno: any, id_criterio: string): string => {
    const item = aluno.conceitos?.find(
        (c: any) => c.id_criterio === id_criterio,
    );
    return item?.conceito || "";
};

const salvarConceito = async (
    aluno: any,
    id_criterio: string,
    conceito: string,
) => {
    await _salvarConceito(aluno.id_aluno, id_criterio, conceito, () => {
        // Atualizar local no objeto aluno
        const item = aluno.conceitos?.find(
            (c: any) => c.id_criterio === id_criterio,
        );
        if (item) item.conceito = conceito;
    });
};

// ── Cor do conceito ───────────────────────────────
const conceitoCor: Record<string, string> = {
    "Acima do Esperado":
        "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    Adequado: "bg-blue-500/10    border-blue-500/30    text-blue-400",
    "Pode Melhorar": "bg-amber-500/10   border-amber-500/30   text-amber-400",
};

const turmaOptions = computed(() =>
    turmas.value.map((t: any) => ({
        id: t.id,
        label: `${t.nome_curso} (${t.cod_turma || ""})`,
    })),
);

watch(turmaAtiva, carregarGrade);

onMounted(async () => {
    await Promise.all([carregarTurmas(), carregarCriterios()]);
    await carregarGrade();
});
</script>

<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER -->
            <div class="flex items-center gap-4 mb-8">
                <NuxtLink
                    to="/avaliacao-gestao"
                    class="text-secondary hover:text-white transition-colors"
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
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </NuxtLink>
                <div>
                    <h1 class="text-2xl font-bold text-white">
                        Lançamento de Conceitos
                    </h1>
                    <div v-if="avaliacao" class="flex items-center gap-2 mt-1">
                        <span class="text-secondary text-sm">{{
                            avaliacao.etapa
                        }}</span>
                        <span class="text-white/20">·</span>
                        <span class="text-secondary text-sm font-mono">{{
                            avaliacao.ano_semestre
                        }}</span>
                    </div>
                </div>
            </div>

            <!-- SELETOR DE TURMA -->
            <div class="mb-6 max-w-lg">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Turma</label
                >
                <BaseSelect
                    v-model="turmaAtiva"
                    :options="turmaOptions"
                    label-key="label"
                    value-key="id"
                    placeholder="Selecione a turma..."
                />
            </div>

            <!-- LOADING -->
            <div v-if="isLoading" class="flex justify-center py-20">
                <div
                    class="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"
                ></div>
            </div>

            <!-- SEM TURMA -->
            <div
                v-else-if="!turmaAtiva"
                class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
            >
                <p class="text-white font-medium">
                    Selecione uma turma para ver os alunos
                </p>
            </div>

            <!-- SEM ALUNOS -->
            <div
                v-else-if="!grade.length && !isLoading"
                class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
            >
                <p class="text-white font-medium">
                    Nenhum aluno ativo nesta turma
                </p>
            </div>

            <!-- TABELA DE LANÇAMENTO -->
            <div
                v-else
                class="overflow-x-auto rounded-xl border border-white/5"
            >
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-[#0f0f15] border-b border-white/5">
                            <th
                                class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-secondary w-48 sticky left-0 bg-[#0f0f15]"
                            >
                                Aluno
                            </th>
                            <th
                                v-for="c in criterios"
                                :key="c.id"
                                class="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-secondary min-w-[170px]"
                            >
                                <span
                                    class="block truncate max-w-[150px] mx-auto"
                                    :title="c.criterio"
                                >
                                    {{ c.criterio }}
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="aluno in grade"
                            :key="aluno.id_aluno"
                            class="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                            <!-- Nome do aluno -->
                            <td
                                class="px-4 py-3 sticky left-0 bg-[#16161E] group-hover:bg-[#1a1a24]"
                            >
                                <div
                                    class="font-semibold text-white truncate max-w-[170px]"
                                    :title="`${aluno.nome} ${aluno.sobrenome}`"
                                >
                                    {{ aluno.nome }} {{ aluno.sobrenome }}
                                </div>
                                <div
                                    class="text-[10px] text-secondary truncate"
                                >
                                    {{ aluno.email }}
                                </div>
                            </td>

                            <!-- Célula de conceito por critério -->
                            <td
                                v-for="c in criterios"
                                :key="c.id"
                                class="px-3 py-2 text-center"
                            >
                                <div
                                    class="relative flex items-center justify-center gap-1.5"
                                >
                                    <!-- Indicador de saving/saved -->
                                    <span
                                        v-if="
                                            savingMap[
                                                `${aluno.id_aluno}_${c.id}`
                                            ] === 'saving'
                                        "
                                        class="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-pulse"
                                    />
                                    <span
                                        v-else-if="
                                            savingMap[
                                                `${aluno.id_aluno}_${c.id}`
                                            ] === 'saved'
                                        "
                                        class="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400"
                                    />
                                    <span
                                        v-else-if="
                                            savingMap[
                                                `${aluno.id_aluno}_${c.id}`
                                            ] === 'error'
                                        "
                                        class="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-400"
                                    />

                                    <!-- Select de conceito -->
                                    <select
                                        :value="getConceito(aluno, c.id)"
                                        @change="
                                            (e) =>
                                                salvarConceito(
                                                    aluno,
                                                    c.id,
                                                    (
                                                        e.target as HTMLSelectElement
                                                    ).value,
                                                )
                                        "
                                        class="w-full bg-[#0f0f15] border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none pr-5 text-center"
                                        :class="
                                            conceitoCor[
                                                getConceito(aluno, c.id)
                                            ] || 'border-white/10'
                                        "
                                    >
                                        <option value="">
                                            — sem conceito —
                                        </option>
                                        <option
                                            v-for="opt in conceitoOptions"
                                            :key="opt.id"
                                            :value="opt.id"
                                        >
                                            {{ opt.label }}
                                        </option>
                                    </select>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </NuxtLayout>
</template>
