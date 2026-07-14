<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseSelect from "../BaseSelect.vue";
import { getAnoSemestreList } from "../../../utils/ano_semestre";
import { buildProtectedFileUrl } from "~/utils/protected-file-url";
import { useToast } from "../../../composables/useToast";
import { useAvaliacaoGestaoAtividadesTab } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoAtividadesTab";

const props = defineProps<{
    isOpen: boolean;
    aluno?: any | null;
    avaliacao?: any | null;
    initialAnoSemestre?: string | null;
    initialTurmaId?: string | null;
    readonly?: boolean;
    atividadeId?: string | null;
}>();

const emit = defineEmits<{
    close: [];
    associated: [atividade: any];
}>();

const { showToast } = useToast();
const {
    deleteAssociacaoAtividade,
    fetchTurmas: _fetchTurmasApi,
    turmas,
    loadingTurmas,
    fetchAtividadesAssociacao,
    associarAtividade: _associarAtividadeApi,
    refreshHashAtividades,
    hashEntregas,
} = useAvaliacaoGestaoAtividadesTab();

const semestres = getAnoSemestreList(6);
const anoSemestre = ref("");
const turmaId = ref("");
const criadoPorBusca = ref("");
const atividades = ref<any[]>([]);
const loadingAtividades = ref(false);
const associatingId = ref("");
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
let createdBySearchTimeout: ReturnType<typeof setTimeout> | null = null;

const semestreOptions = computed(() => [
    { id: "", nome: "Todos os semestres" },
    ...semestres.map((item) => ({ id: item.id, nome: item.nome })),
]);

const turmaOptions = computed(() => [
    { id: "", nome: "Todas as turmas" },
    ...turmas.value.map((turma: any) => ({
        ...turma,
        nome: [
            turma?.nome_curso || "Turma",
            turma?.cod_turma ? `(${turma.cod_turma})` : null,
            turma?.turno || null,
        ]
            .filter(Boolean)
            .join(" - "),
    })),
]);

const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value)),
);

const modalTitulo = computed(() =>
    props.readonly ? "Ver Atividade Associada" : "Associar Atividade",
);

const alunoTitulo = computed(() => {
    const aluno = props.aluno || {};
    return aluno?.name_display?.primaryName || aluno?.nome || "Aluno";
});

const alunoResumo = computed(() => {
    const aluno = props.aluno || {};
    return (
        aluno?.name_display?.secondaryText ||
        `RA: ${aluno?.ra || aluno?.ra_legado || "—"}`
    );
});

const atividadeCountLabel = computed(() => {
    if (loadingAtividades.value) return "Carregando atividades...";
    if (!total.value) return "Nenhuma atividade encontrada";
    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, total.value);
    return `Exibindo ${start}–${end} de ${total.value} atividade${total.value !== 1 ? "s" : ""}`;
});

const resetState = () => {
    anoSemestre.value = "";
    turmaId.value = String(props.initialTurmaId || "").trim();
    criadoPorBusca.value = "";
    atividades.value = [];
    total.value = 0;
    page.value = 1;
    associatingId.value = "";
};

const fetchTurmas = async () => {
    try {
        await _fetchTurmasApi(anoSemestre.value || undefined);
    } catch {
        showToast("Não foi possível carregar as turmas do filtro.", {
            type: "error",
        });
    }
};

const fetchAtividades = async () => {
    if (!props.aluno?.aluno_id || !props.avaliacao?.id_avaliacao) {
        atividades.value = [];
        total.value = 0;
        return;
    }

    loadingAtividades.value = true;
    try {
        const params: Record<string, any> = {
            id_avaliacao: props.avaliacao.id_avaliacao,
            id_aluno: props.aluno.aluno_id,
            page: page.value,
            page_size: pageSize.value,
        };

        if (props.readonly && props.atividadeId) {
            params.id_atividade = props.atividadeId;
        } else {
            params.ano_semestre = anoSemestre.value || null;
            params.id_turma = turmaId.value || null;
            params.criado_por_busca = criadoPorBusca.value.trim() || null;
        }

        const data: any = await fetchAtividadesAssociacao(params);

        atividades.value = Array.isArray(data?.itens) ? data.itens : [];
        total.value = Number(data?.total ?? 0);
    } catch (error) {
        console.error(error);
        atividades.value = [];
        total.value = 0;
        showToast("Não foi possível carregar as atividades para associação.", {
            type: "error",
        });
    } finally {
        loadingAtividades.value = false;
    }
};

const handleAssociar = async (atividade: any) => {
    if (!props.aluno?.aluno_id || !props.avaliacao?.id_avaliacao) return;

    associatingId.value = String(atividade?.id || "").trim();
    try {
        const data: any = await _associarAtividadeApi({
            id_avaliacao: props.avaliacao.id_avaliacao,
            id_aluno: props.aluno.aluno_id,
            id_atividade: atividade.id,
        });

        showToast(data?.message || "Atividade associada com sucesso.", {
            type: data?.ja_existia ? "info" : "success",
        });
        emit("associated", atividade);
        await fetchAtividades();
    } catch (error: any) {
        console.error(error);
        showToast(
            error?.data?.statusMessage ||
                error?.message ||
                "Não foi possível associar a atividade.",
            { type: "error" },
        );
    } finally {
        associatingId.value = "";
    }
};

const getCriadoPorNome = (atividade: any) => {
    const nome = [atividade?.criado_por_nome, atividade?.criado_por_sobrenome]
        .filter(Boolean)
        .join(" ")
        .trim();
    return nome || "Criador não identificado";
};

const getCriadoPorResumo = (atividade: any) => {
    return atividade?.criado_por_email || "Sem e-mail informado";
};

const getCriadoPorInitials = (atividade: any) => {
    const nome = getCriadoPorNome(atividade);
    if (!nome || nome === "Criador não identificado") return "NI";
    return (
        nome
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((item) => item[0]?.toUpperCase() || "")
            .join("") || "NI"
    );
};

const getTurmaMeta = (atividade: any) => {
    const partes = [
        atividade?.turma_nome || null,
        atividade?.cod_turma ? `(${atividade.cod_turma})` : null,
        atividade?.turno || null,
        atividade?.ano_semestre || null,
    ].filter(Boolean);

    return partes.length ? partes.join(" - ") : "Sem turma específica";
};

const openAtividadeArquivo = async (atividade: any) => {
    const filePath = String(atividade?.arquivo_apoio || "").trim();
    if (!filePath) {
        showToast("Nenhum arquivo anexado.", { type: "info" });
        return;
    }

    try {
        await refreshHashAtividades();

        if (!hashEntregas.value) {
            throw new Error("Falha ao gerar token de acesso.");
        }

        const finalUrl = buildProtectedFileUrl(
            hashEntregas.value,
            filePath,
            "avaliacao",
        );

        if (!finalUrl) {
            throw new Error(
                "Não foi possível compor a URL protegida do arquivo.",
            );
        }

        window.open(finalUrl, "_blank");
    } catch (error) {
        console.error(error);
        showToast("Erro ao abrir arquivo.", { type: "error" });
    }
};

watch(
    () => props.isOpen,
    async (open) => {
        if (!open) return;

        resetState();
        await fetchTurmas();
        await fetchAtividades();
    },
);

watch(
    () => props.initialAnoSemestre,
    (value) => {
        if (!props.isOpen || !value) return;
        anoSemestre.value = String(value).trim();
    },
);

watch(
    () => props.initialTurmaId,
    (value) => {
        if (!props.isOpen) return;
        turmaId.value = String(value || "").trim();
    },
);

watch(anoSemestre, async () => {
    if (!props.isOpen) return;

    page.value = 1;
    const turmaAtual = turmaId.value;
    await fetchTurmas();
    if (
        turmaAtual &&
        !turmas.value.some(
            (turma: any) => String(turma?.id || "") === turmaAtual,
        )
    ) {
        turmaId.value = "";
    }
    await fetchAtividades();
});

watch(turmaId, async () => {
    if (!props.isOpen) return;
    page.value = 1;
    await fetchAtividades();
});

watch(criadoPorBusca, () => {
    if (!props.isOpen) return;

    if (createdBySearchTimeout) clearTimeout(createdBySearchTimeout);
    createdBySearchTimeout = setTimeout(() => {
        page.value = 1;
        fetchAtividades();
    }, 250);
});

watch(page, async () => {
    if (!props.isOpen) return;
    await fetchAtividades();
});

const prevPage = () => {
    if (page.value > 1) page.value--;
};
const nextPage = () => {
    if (page.value < totalPages.value) page.value++;
};
</script>

<template>
    <Transition name="modal-fade">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            @click.self="emit('close')"
        >
            <div
                class="w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#16161E] shadow-2xl"
            >
                <div class="border-b border-white/10 px-6 py-5">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p
                                class="text-[10px] font-black uppercase tracking-[0.18em] text-primary"
                            >
                                {{ modalTitulo }}
                            </p>
                            <h3 class="mt-1 text-xl font-black text-white">
                                {{ alunoTitulo }}
                            </h3>
                            <p class="mt-1 text-xs text-secondary">
                                {{ alunoResumo }}
                            </p>
                            <p class="mt-3 text-[11px] text-secondary/80">
                                {{ atividadeCountLabel }}
                            </p>
                        </div>
                        <button
                            @click="emit('close')"
                            class="text-secondary hover:text-white transition-colors"
                        >
                            <svg
                                class="h-6 w-6"
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
                </div>

                <div
                    v-if="!readonly"
                    class="border-b border-white/10 bg-[#0f0f15] px-6 py-4"
                >
                    <div class="grid grid-cols-1 gap-3 lg:grid-cols-12">
                        <div class="lg:col-span-3">
                            <label
                                class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-secondary"
                                >Ano/Semestre</label
                            >
                            <BaseSelect
                                v-model="anoSemestre"
                                :options="semestreOptions"
                                label-key="nome"
                                value-key="id"
                                placeholder="Todos os semestres"
                            />
                        </div>

                        <div class="lg:col-span-4">
                            <label
                                class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-secondary"
                                >Turma</label
                            >
                            <BaseSelect
                                v-model="turmaId"
                                :options="turmaOptions"
                                label-key="nome"
                                value-key="id"
                                placeholder="Todas as turmas"
                                :disabled="loadingTurmas"
                            />
                        </div>

                        <div class="lg:col-span-5">
                            <label
                                class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-secondary"
                                >Criado por</label
                            >
                            <input
                                v-model="criadoPorBusca"
                                type="text"
                                placeholder="Nome, sobrenome ou e-mail"
                                class="w-full rounded-lg border border-white/10 bg-[#16161E] px-4 py-3 text-sm text-white outline-none placeholder:text-secondary/35 focus:border-primary"
                            />
                        </div>
                    </div>
                </div>

                <div class="max-h-[70vh] overflow-y-auto px-6 py-5">
                    <div
                        v-if="loadingAtividades"
                        class="flex items-center justify-center py-16 text-sm text-secondary"
                    >
                        Carregando catálogo de atividades...
                    </div>

                    <div
                        v-else-if="!atividades.length"
                        class="rounded-2xl border border-dashed border-white/10 bg-[#0f0f15] px-6 py-12 text-center"
                    >
                        <p class="text-sm font-semibold text-white">
                            Nenhuma atividade encontrada com os filtros atuais.
                        </p>
                        <p class="mt-2 text-xs text-secondary">
                            Ajuste ano/semestre, turma ou criador para ampliar o
                            catálogo.
                        </p>
                    </div>

                    <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <article
                            v-for="atividade in atividades"
                            :key="atividade.id"
                            class="flex h-full flex-col rounded-2xl border border-white/10 bg-[#11131A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-colors hover:border-white/20"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <p
                                        class="text-[10px] font-black uppercase tracking-[0.18em] text-primary"
                                    >
                                        Atividade
                                    </p>
                                    <h4
                                        class="mt-1 text-base font-black leading-tight text-white"
                                    >
                                        {{ atividade.titulo }}
                                    </h4>
                                </div>
                                <span
                                    class="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                                    :class="
                                        atividade.ja_associada
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                            : 'border-white/10 bg-white/5 text-secondary'
                                    "
                                >
                                    {{
                                        atividade.ja_associada
                                            ? "Já associada"
                                            : "Disponível"
                                    }}
                                </span>
                            </div>

                            <p class="mt-3 line-clamp-4 text-sm text-secondary">
                                {{ atividade.enunciado }}
                            </p>

                            <div
                                class="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]"
                            >
                                <div
                                    class="rounded-xl border border-white/10 bg-black/20 p-3"
                                >
                                    <p
                                        class="text-[10px] font-black uppercase tracking-wider text-secondary"
                                    >
                                        Turma / Contexto
                                    </p>
                                    <p
                                        class="mt-2 text-sm font-semibold text-white"
                                    >
                                        {{ getTurmaMeta(atividade) }}
                                    </p>
                                    <p
                                        class="mt-1 text-[11px] text-secondary/75"
                                    >
                                        Criada em
                                        {{
                                            new Date(
                                                atividade.criado_em,
                                            ).toLocaleDateString("pt-BR")
                                        }}
                                    </p>
                                </div>

                                <div
                                    class="rounded-xl border border-white/10 bg-black/20 p-3"
                                >
                                    <p
                                        class="text-[10px] font-black uppercase tracking-wider text-secondary"
                                    >
                                        Criado por
                                    </p>
                                    <div class="mt-2 flex items-start gap-3">
                                        <div
                                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black uppercase text-primary"
                                        >
                                            {{
                                                getCriadoPorInitials(atividade)
                                            }}
                                        </div>
                                        <div class="min-w-0">
                                            <p
                                                class="truncate text-sm font-semibold text-white"
                                            >
                                                {{
                                                    getCriadoPorNome(atividade)
                                                }}
                                            </p>
                                            <p
                                                class="truncate text-[11px] text-secondary/80"
                                            >
                                                {{
                                                    getCriadoPorResumo(
                                                        atividade,
                                                    )
                                                }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4"
                            >
                                <a
                                    v-if="atividade.link_externo"
                                    :href="atividade.link_externo"
                                    target="_blank"
                                    rel="noreferrer"
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
                                >
                                    Link externo
                                </a>

                                <button
                                    v-if="atividade.arquivo_apoio"
                                    type="button"
                                    @click="openAtividadeArquivo(atividade)"
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:border-white/25 hover:bg-white/10"
                                >
                                    Abrir arquivo
                                </button>

                                <button
                                    v-if="!readonly"
                                    type="button"
                                    :disabled="
                                        atividade.ja_associada ||
                                        associatingId === atividade.id
                                    "
                                    @click="handleAssociar(atividade)"
                                    class="ml-auto inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                    :class="
                                        atividade.ja_associada
                                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-primary text-white hover:bg-primary-hover'
                                    "
                                >
                                    <span
                                        v-if="associatingId === atividade.id"
                                        class="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                    ></span>
                                    <span>{{
                                        atividade.ja_associada
                                            ? "Associada"
                                            : "Associar atividade"
                                    }}</span>
                                </button>
                            </div>
                        </article>
                    </div>

                    <!-- Paginação -->
                    <div
                        v-if="!loadingAtividades && total > pageSize"
                        class="mt-5 flex items-center justify-between border-t border-white/10 pt-4"
                    >
                        <span class="text-xs text-secondary">
                            {{ total }} atividade{{ total !== 1 ? "s" : "" }} no
                            total
                        </span>
                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                :disabled="page === 1"
                                @click="prevPage"
                                class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-secondary transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                            <span
                                class="min-w-[80px] text-center text-xs font-bold text-white"
                            >
                                {{ page }} / {{ totalPages }}
                            </span>
                            <button
                                type="button"
                                :disabled="page === totalPages"
                                @click="nextPage"
                                class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-secondary transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
