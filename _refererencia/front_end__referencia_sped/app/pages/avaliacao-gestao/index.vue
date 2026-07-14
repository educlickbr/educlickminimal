<script setup lang="ts">
import BaseSelect from "~/components/BaseSelect.vue";
import AvaliacaoGestaoCriarTab from "~/components/avaliacao-gestao/AvaliacaoGestaoCriarTab.vue";
import AvaliacaoGestaoAvaliarTab from "~/components/avaliacao-gestao/AvaliacaoGestaoAvaliarTab.vue";
import AvaliacaoGestaoAtividadesTab from "~/components/avaliacao-gestao/AvaliacaoGestaoAtividadesTab.vue";
import ConfirmationModal from "~/components/ConfirmationModal.vue";
import ModalDashboardContextoAvaliacoes from "~/components/avaliacao-gestao/ModalDashboardContextoAvaliacoes.vue";
import ModalResumoConceitosTurmas from "~/components/avaliacao-gestao/ModalResumoConceitosTurmas.vue";
import AvaliacaoGestaoSidebar from "~/components/avaliacao-gestao/AvaliacaoGestaoSidebar.vue";
import {
    getAnoSemestre,
    getAnoSemestreList,
} from "../../../utils/ano_semestre";
import { buildProtectedFileUrl } from "~/utils/protected-file-url";
import { decorateStudentNames } from "../../../utils/student_name";
import { useAppStore } from "~/stores/app";
import { useToast } from "../../../composables/useToast";
import { useAvaliacaoGestaoTurmas } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoTurmas";
import { useAvaliacaoGestaoAlunos } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoAlunos";
import { useAvaliacaoGestaoDashboard } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoDashboard";
import { useAvaliacaoGestaoConceitos } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoConceitos";
import { useAvaliacaoGestaoAtividadesTab } from "~/composables/avaliacao-gestao/useAvaliacaoGestaoAtividadesTab";

const store = useAppStore();
const { showToast } = useToast();
const {
    turmas,
    turmaAtiva,
    loadingTurmas,
    fetchTurmas,
    avaliacaoTurma,
    loadingAvTurma,
    fetchAvaliacaoPorTurma,
} = useAvaliacaoGestaoTurmas();
const { alunos, loadingAlunos, fetchAlunos } = useAvaliacaoGestaoAlunos();
const {
    dashboardStats,
    loadingDashboard,
    fetchDashboard,
    dashboardContexto,
    loadingDashboardContexto,
    fetchDashboardContexto,
    resumoConceitos,
    loadingResumoConceitos,
    fetchResumoConceitos,
    bulkPublishing,
    publicarLote,
} = useAvaliacaoGestaoDashboard();
const {
    atividades,
    loadingAtividades,
    associarAlunos,
    associarAvaliacao,
    loadingAssociarAlunos,
    entregas: entregasAtividades,
    loadingEntregas,
    hashEntregas,
    fetchAtividades: _fetchAtividadesApi,
    fetchAlunosAssociarAtividades: _fetchAlunosAssocApi,
    deleteAssociacaoAtividade,
    fetchEntregas: _fetchEntregasApi,
    avaliarEntrega: _avaliarEntregaApi,
    refreshHashAtividades,
} = useAvaliacaoGestaoAtividadesTab();

// ── Abas ─────────────────────────────────────────────────────
const abaAtiva = ref<"criar" | "avaliar" | "atividades">("criar");
const subAbaAtividades = ref<
    "criar_atividade" | "associar_atividade" | "avaliar_atividade"
>("criar_atividade");

// ── Semestres ─────────────────────────────────────────────────
const semestres = getAnoSemestreList(6);
const anoSemestre = ref(getAnoSemestre());
const criarTabRef = ref();
const avaliarTabRef = ref();

const etapaAtiva = ref<string>("O que nos Une");
const buscaAluno = ref("");

// ── Modais ────────────────────────────────────────────────────
const showPendenciasModal = ref(false);
const showDashboardContextoModal = ref(false);
const showResumoConceitosModal = ref(false);
const showBulkPublishConfirm = ref(false);

// ── Wrappers ──────────────────────────────────────────────────
const _fetchTurmas = () => fetchTurmas(anoSemestre.value);
const _fetchAlunos = () => fetchAlunos(turmaAtiva.value, anoSemestre.value);
const _fetchAvaliacaoPorTurma = async () => {
    dashboardStats.value = null;
    alunoAberto.value = null;
    conceitosCache.value = {};
    await fetchAvaliacaoPorTurma(turmaAtiva.value, etapaAtiva.value);
    await _fetchDashboard();
};
const _fetchDashboard = () => {
    const id = avaliacaoTurma.value?.id_avaliacao;
    const turma = turmaAtiva.value;
    if (id && turma) fetchDashboard(id, turma);
};
const refreshDashboardContextoIfOpen = async () => {
    if (!showDashboardContextoModal.value) return;
    await _fetchDashboardContexto();
};
const _fetchDashboardContexto = () =>
    fetchDashboardContexto(
        idsTurmasContexto.value,
        anoSemestre.value,
        etapaAtiva.value,
    );
const _fetchResumoConceitos = () =>
    fetchResumoConceitos(
        idsTurmasContexto.value,
        anoSemestre.value,
        etapaAtiva.value,
    );

// ── Computed ──────────────────────────────────────────────────
const turmaFilterOptions = computed(() => {
    const badge = (turma: any): string => {
        const nome = turma?.nome_curso || "Turma";
        const codigo = turma?.cod_turma ? ` (${turma.cod_turma})` : "";
        return `${nome}${codigo}`;
    };
    return turmas.value.map((t: any) => ({ ...t, nome: badge(t) }));
});
const turmaSelecionada = computed(
    () =>
        turmas.value.find((item: any) => item.id === turmaAtiva.value) || null,
);
const idsTurmasContexto = computed(() =>
    turmas.value.map((item: any) => item.id).filter(Boolean),
);
const resumoDashboardContexto = computed(() => ({
    total: dashboardContexto.value.length,
    concluidas: dashboardContexto.value.filter((item: any) => item.concluida)
        .length,
    pendentes: dashboardContexto.value.filter(
        (item: any) => item.possui_avaliacao && !item.concluida,
    ).length,
    semAvaliacao: dashboardContexto.value.filter(
        (item: any) => !item.possui_avaliacao,
    ).length,
}));
const podeTentarPublicarLote = computed(
    () =>
        !!turmaAtiva.value &&
        !!avaliacaoTurma.value &&
        !loadingDashboard.value &&
        !bulkPublishing.value,
);
const dashboardPendencias = computed(
    () => dashboardStats.value?.pendencias || [],
);
const totalPendenciasAvaliacao = computed(
    () =>
        dashboardPendencias.value.filter((item: any) => item.falta_avaliacao)
            .length,
);
const totalPendenciasCoordenador = computed(
    () =>
        dashboardPendencias.value.filter((item: any) => item.falta_coordenador)
            .length,
);
const totalPendenciasPedagogo = computed(
    () =>
        dashboardPendencias.value.filter((item: any) => item.falta_pedagogo)
            .length,
);

// ── Handlers ──────────────────────────────────────────────────
const handleOpenDashboardContexto = async () => {
    showDashboardContextoModal.value = true;
    await _fetchDashboardContexto();
};
const handleOpenResumoConceitos = async () => {
    showResumoConceitosModal.value = true;
    await _fetchResumoConceitos();
};
const handleOpenPublishBatch = () => {
    if (!podeTentarPublicarLote.value) return;
    if (!dashboardStats.value?.total_alunos) {
        showToast("Nenhum aluno encontrado no contexto selecionado.", {
            type: "info",
        });
        return;
    }
    if (Number(dashboardStats.value.total_nao_elegiveis_publicacao || 0) > 0) {
        showToast(getPendenciasResumo(dashboardStats.value), {
            type: "error",
            duration: 7000,
        });
        showPendenciasModal.value = true;
        return;
    }
    showBulkPublishConfirm.value = true;
};
const getPendenciasResumo = (stats: any) => {
    if (!stats) return "Não foi possível verificar as pendências.";
    const partes: string[] = [];
    if (totalPendenciasAvaliacao.value)
        partes.push(
            `${totalPendenciasAvaliacao.value} com critérios pendentes`,
        );
    if (totalPendenciasCoordenador.value)
        partes.push(`${totalPendenciasCoordenador.value} sem coordenação`);
    if (totalPendenciasPedagogo.value)
        partes.push(`${totalPendenciasPedagogo.value} sem pedagogo(a)`);
    if (!partes.length)
        return "Ainda existem pendências para publicação em lote.";
    return `Publicação bloqueada: ${partes.join(" • ")}.`;
};
const confirmBulkPublish = async () => {
    if (!avaliacaoTurma.value?.id_avaliacao || !turmaAtiva.value) return;
    try {
        const data: any = await publicarLote(
            avaliacaoTurma.value.id_avaliacao,
            turmaAtiva.value,
        );
        Object.values(conceitosCache.value).forEach((entry: any) => {
            if (entry?.global) entry.global.publicado = true;
        });
        showBulkPublishConfirm.value = false;
        showToast(data?.message || "Publicação em lote concluída.", {
            type: "success",
        });
        await _fetchDashboard();
        await refreshDashboardContextoIfOpen();
    } catch (error: any) {
        console.error(error);
        const errorData = error?.data?.data || {};
        if (errorData.dashboard) dashboardStats.value = errorData.dashboard;
        if (
            Array.isArray(errorData.pendencias) &&
            errorData.pendencias.length
        ) {
            dashboardStats.value = {
                ...(dashboardStats.value || {}),
                pendencias: errorData.pendencias,
            };
            showPendenciasModal.value = true;
        }
        showToast(error?.data?.statusMessage || "Não foi possível publicar.", {
            type: "error",
            duration: 7000,
        });
    }
};

// ── Conceitos (delegado ao composable) ────────────────────────
const {
    alunoAberto,
    conceitosCache,
    loadingAlunoCriterios,
    savingMap,
    lastSavedMap,
    toggleAluno,
    getCriteriosAluno: _getCriteriosAluno,
    getGlobalAluno: _getGlobalAluno,
    salvarConceito: _salvarConceito,
    salvarResultadoGlobal: _salvarResultadoGlobal,
} = useAvaliacaoGestaoConceitos();

const etapaOptions = [
    "O que nos Une",
    "Mundo do Trabalho",
    "Criação",
    "Relatório Final",
];
const semestreOptions = computed(() =>
    semestres.map((item) => ({ id: item.id, nome: item.nome })),
);

const showAtividadeModal = ref(false);
const editAtividade = ref<any | null>(null);
const buscaAlunoAssociar = ref("");
const showAssociarAtividadeModal = ref(false);
const alunoAssociarAtividade = ref<any | null>(null);
const showVerAtividadeModal = ref(false);
const alunoVerAtividade = ref<any | null>(null);

const openCriarAtividade = () => {
    editAtividade.value = null;
    showAtividadeModal.value = true;
};

const openEditarAtividade = (atividade: any) => {
    editAtividade.value = atividade;
    showAtividadeModal.value = true;
};

const closeAtividadeModal = () => {
    showAtividadeModal.value = false;
    editAtividade.value = null;
};

const handleAtividadeSaved = async () => {
    closeAtividadeModal();
    await _fetchAtividadesApi();
};

const openAtividadeArquivo = async (atividade: any) => {
    const filePath = String(atividade?.arquivo_apoio || "").trim();
    if (!filePath) {
        showToast("Nenhum arquivo anexado.", { type: "info" });
        return;
    }

    try {
        await refreshHashAtividades();
        const hash_base = hashEntregas.value;
        const error = null;

        if (error || !hash_base) {
            throw new Error(error || "Falha ao gerar token de acesso.");
        }

        const finalUrl = buildProtectedFileUrl(
            hash_base,
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

const fetchAtividades = () => _fetchAtividadesApi();

const associarAlunosFiltrados = computed(() => {
    if (!buscaAlunoAssociar.value.trim()) return associarAlunos.value;
    const q = buscaAlunoAssociar.value.toLowerCase();
    return associarAlunos.value.filter(
        (a: any) =>
            `${a.nome ?? ""} ${a.sobrenome ?? ""} ${a.nome_aluno ?? ""} ${a.nome_social ?? ""}`
                .toLowerCase()
                .includes(q) ||
            String(a.ra ?? "")
                .toLowerCase()
                .includes(q),
    );
});

const fetchAlunosAssociarAtividades = () =>
    _fetchAlunosAssocApi(turmaAtiva.value, etapaAtiva.value, anoSemestre.value);

const handleAssociarAtividade = (aluno: any) => {
    alunoAssociarAtividade.value = aluno;
    showAssociarAtividadeModal.value = true;
};

const closeAssociarAtividadeModal = () => {
    showAssociarAtividadeModal.value = false;
    alunoAssociarAtividade.value = null;
};

const handleVerAtividadeAssociada = (aluno: any) => {
    alunoVerAtividade.value = aluno;
    showVerAtividadeModal.value = true;
};

const closeVerAtividadeModal = () => {
    showVerAtividadeModal.value = false;
    alunoVerAtividade.value = null;
};

const handleAtividadeAssociada = async () => {
    await fetchAlunosAssociarAtividades();
};

const eliminandoAssociacao = ref<Record<string, boolean>>({});

const handleEliminarAssociacao = async (aluno: any) => {
    const idEntrega = aluno.atividade_associada?.id_entrega;
    if (!idEntrega) return;
    const alunoId = String(aluno.aluno_id || aluno.id_aluno || aluno.id || "");
    eliminandoAssociacao.value[alunoId] = true;
    try {
        await deleteAssociacaoAtividade(idEntrega);
        showToast("Associação removida com sucesso.", { type: "success" });
        await fetchAlunosAssociarAtividades();
    } catch (e: any) {
        showToast(e.message || "Erro ao remover associação.", {
            type: "error",
        });
    } finally {
        eliminandoAssociacao.value[alunoId] = false;
    }
};

// ══════════════════════════════════════════════════════════════
// SUBABA: AVALIAR ATIVIDADES
// ══════════════════════════════════════════════════════════════
const filtroStatusEntrega = ref("");
const filtroDataInicio = ref("");
const filtroDataFim = ref("");
const entregaAberta = ref<string | null>(null);
const feedbackMap = ref<Record<string, string>>({});
const savingEntregaMap = ref<Record<string, "saving" | "saved" | "error">>({});

const fetchEntregasAtividades = async () => {
    const id = avaliacaoTurma.value?.id_avaliacao || null;
    const result = await _fetchEntregasApi(
        id,
        filtroStatusEntrega.value || null,
        filtroDataInicio.value || null,
        filtroDataFim.value || null,
    );
    // Pre-populate feedback map with existing feedback
    for (const e of result) {
        if (e.id_entrega && !(e.id_entrega in feedbackMap.value)) {
            feedbackMap.value[e.id_entrega] = e.feedback_professor || "";
        }
    }
};

const refreshHashEntregas = refreshHashAtividades;

const openEntregaArquivo = async (filePath: string) => {
    if (!filePath) return;
    if (!hashEntregas.value) await refreshHashEntregas();
    const { buildProtectedFileUrl } =
        await import("~/utils/protected-file-url");
    const url = buildProtectedFileUrl(
        hashEntregas.value,
        filePath,
        "avaliacao",
    );
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else showToast("Não foi possível abrir o arquivo.", { type: "error" });
};

const avaliarEntrega = async (
    entrega: any,
    status: "Aprovado" | "Reprovado",
) => {
    const key = entrega.id_entrega;
    savingEntregaMap.value[key] = "saving";
    try {
        await _avaliarEntregaApi(key, status, feedbackMap.value[key] || null);
        entrega.status_avaliacao = status;
        entrega.feedback_professor =
            feedbackMap.value[key] || entrega.feedback_professor;
        savingEntregaMap.value[key] = "saved";
        showToast(
            `Entrega ${status === "Aprovado" ? "aprovada" : "reprovada"} com sucesso.`,
            { type: "success" },
        );
        setTimeout(() => delete savingEntregaMap.value[key], 2000);
    } catch (e: any) {
        savingEntregaMap.value[key] = "error";
        showToast(e.message || "Erro ao avaliar entrega.", { type: "error" });
        setTimeout(() => delete savingEntregaMap.value[key], 3000);
    }
};

const getCriteriosAluno = (id_aluno: string): any[] =>
    conceitosCache.value[id_aluno]?.criterios || [];
const getGlobalAluno = (id_aluno: string): any =>
    conceitosCache.value[id_aluno]?.global || {};

// ── Salvar conceito (delegado ao composable) ──────────────────
const salvarConceito = (
    id_aluno: string,
    id_criterio: string,
    conceito: string,
) =>
    _salvarConceito(id_aluno, id_criterio, conceito, () => {
        _fetchDashboard();
        refreshDashboardContextoIfOpen();
    });

const salvarResultadoGlobal = async (
    id_aluno: string,
    action?: "comentario" | "aprov_coordenador" | "aprov_pedagogo" | "publicar",
) => {
    const id = avaliacaoTurma.value?.id_avaliacao;
    if (!id) return;
    await _salvarResultadoGlobal(id, id_aluno, action, () => {
        _fetchDashboard();
        refreshDashboardContextoIfOpen();
    });
};

const conceitoCor: Record<string, string> = {
    "Acima do Esperado": "bg-emerald-500 text-white border-emerald-500",
    Adequado: "bg-blue-500 text-white border-blue-500",
    "Pode Melhorar": "bg-red-500 text-white border-red-500",
    "Aprovado(a)": "bg-emerald-500 text-white border-emerald-500",
    "Aprovado(a) com Ressalvas": "bg-yellow-500 text-white border-yellow-500",
    "Não Aprovado(a)": "bg-red-500 text-white border-red-500",
};

const conceitoLabel: Record<string, string> = {
    "Acima do Esperado": "Acima do Esperado",
    Adequado: "Adequado",
    "Pode Melhorar": "Pode Melhorar",
    "Aprovado(a)": "Aprovado(a)",
    "Aprovado(a) com Ressalvas": "Aprovado(a) com Ressalvas",
    "Não Aprovado(a)": "Não Aprovado(a)",
};

// ── Watches ──────────────────────────────────────────────────
watch(turmaAtiva, async () => {
    buscaAluno.value = "";
    await store.refreshHash();
    await Promise.all([_fetchAlunos(), _fetchAvaliacaoPorTurma()]);
    await refreshDashboardContextoIfOpen();

    if (
        abaAtiva.value === "atividades" &&
        subAbaAtividades.value === "associar_atividade"
    ) {
        await fetchAlunosAssociarAtividades();
    }
    if (
        abaAtiva.value === "atividades" &&
        subAbaAtividades.value === "avaliar_atividade"
    ) {
        await fetchEntregasAtividades();
    }
});

watch(anoSemestre, async () => {
    alunos.value = [];
    avaliacaoTurma.value = null;
    associarAvaliacao.value = null;
    associarAlunos.value = [];
    await store.refreshHash();
    await _fetchTurmas();
    await refreshDashboardContextoIfOpen();

    if (
        abaAtiva.value === "atividades" &&
        subAbaAtividades.value === "associar_atividade"
    ) {
        await fetchAlunosAssociarAtividades();
    }
});

watch(subAbaAtividades, async (subAba) => {
    if (abaAtiva.value !== "atividades") return;

    if (subAba === "associar_atividade") {
        if (!turmas.value.length) await _fetchTurmas();
        await fetchAlunosAssociarAtividades();
    }

    if (subAba === "avaliar_atividade") {
        if (!turmas.value.length) await _fetchTurmas();
        if (!avaliacaoTurma.value && turmaAtiva.value)
            await _fetchAvaliacaoPorTurma();
        await fetchEntregasAtividades();
    }
});

watch([filtroStatusEntrega, filtroDataInicio, filtroDataFim], () => {
    if (
        abaAtiva.value === "atividades" &&
        subAbaAtividades.value === "avaliar_atividade"
    ) {
        fetchEntregasAtividades();
    }
});

watch(abaAtiva, async (aba) => {
    if (aba === "avaliar" && !turmas.value.length) await _fetchTurmas();
    if (aba === "atividades") {
        await fetchAtividades();

        if (subAbaAtividades.value === "associar_atividade") {
            if (!turmas.value.length) await _fetchTurmas();
            await fetchAlunosAssociarAtividades();
        }
        if (subAbaAtividades.value === "avaliar_atividade") {
            if (!turmas.value.length) await _fetchTurmas();
            if (!avaliacaoTurma.value && turmaAtiva.value)
                await _fetchAvaliacaoPorTurma();
            await fetchEntregasAtividades();
        }
    }
});
</script>

<template>
    <NuxtLayout name="base">
        <template #sidebar>
            <AvaliacaoGestaoSidebar
                v-if="abaAtiva === 'avaliar'"
                :etapa-ativa="etapaAtiva"
                :turma-selecionada="turmaSelecionada"
                :dashboard-stats="dashboardStats"
                :dashboard-contexto="dashboardContexto"
                :resumo-dashboard-contexto="resumoDashboardContexto"
                :ids-turmas-contexto="idsTurmasContexto"
                :loading-dashboard="loadingDashboard"
                :dashboard-pendencias="dashboardPendencias"
                :total-pendencias-avaliacao="totalPendenciasAvaliacao"
                :total-pendencias-coordenador="totalPendenciasCoordenador"
                :total-pendencias-pedagogo="totalPendenciasPedagogo"
                @open-dashboard-contexto="handleOpenDashboardContexto"
                @open-resumo-conceitos="handleOpenResumoConceitos"
                @open-pendencias="showPendenciasModal = true"
            />
        </template>
        <div
            translate="no"
            class="notranslate bg-transparent md:bg-div-15 rounded-none md:rounded p-0 md:p-8 flex-1 w-full"
        >
            <!-- HEADER / ABAS — padrão matriculas -->
            <div
                class="flex flex-col md:flex-row items-center justify-between gap-4 mb-6"
            >
                <!-- Abas com underline -->
                <div
                    class="flex items-center gap-6 border-b border-secondary/10 w-full md:w-auto pb-1 overflow-x-auto no-scrollbar"
                >
                    <button
                        @click="abaAtiva = 'criar'"
                        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                        :class="
                            abaAtiva === 'criar'
                                ? 'text-primary'
                                : 'text-secondary hover:text-white'
                        "
                    >
                        Criar Avaliação
                        <span
                            v-if="abaAtiva === 'criar'"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        />
                    </button>
                    <button
                        @click="abaAtiva = 'avaliar'"
                        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                        :class="
                            abaAtiva === 'avaliar'
                                ? 'text-primary'
                                : 'text-secondary hover:text-white'
                        "
                    >
                        Avaliar
                        <span
                            v-if="abaAtiva === 'avaliar'"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        />
                    </button>
                    <button
                        @click="abaAtiva = 'atividades'"
                        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                        :class="
                            abaAtiva === 'atividades'
                                ? 'text-primary'
                                : 'text-secondary hover:text-white'
                        "
                    >
                        Atividades
                        <span
                            v-if="abaAtiva === 'atividades'"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        />
                    </button>
                </div>

                <!-- Seletor de período + ações -->
                <div
                    class="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-shrink-0"
                >
                    <button
                        v-if="abaAtiva === 'criar'"
                        @click="criarTabRef?.openCriar?.()"
                        class="self-start md:self-auto px-3 py-2 rounded bg-primary hover:brightness-110 text-white text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
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
                        <span>Criar avaliação</span>
                    </button>
                    <button
                        v-if="abaAtiva === 'avaliar'"
                        @click="handleOpenPublishBatch"
                        :disabled="!podeTentarPublicarLote"
                        class="self-start md:self-auto px-3 py-2 rounded bg-primary hover:brightness-110 text-white text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <span
                            v-if="bulkPublishing"
                            class="animate-spin w-3 h-3 border-2 border-white/20 border-t-white rounded-full"
                        ></span>
                        <span>Publicar em lote</span>
                        <span
                            v-if="dashboardStats"
                            class="px-2 py-0.5 rounded bg-white/10 text-[10px]"
                            >{{ dashboardStats.total_publicadas }}/{{
                                dashboardStats.total_alunos
                            }}</span
                        >
                    </button>
                </div>
            </div>

            <!-- ABA: CRIAR -->
            <AvaliacaoGestaoCriarTab
                v-if="abaAtiva === 'criar'"
                ref="criarTabRef"
            />

            <!-- ABA: LANÇAMENTO (Avaliar) -->
            <AvaliacaoGestaoAvaliarTab
                v-else-if="abaAtiva === 'avaliar'"
                ref="avaliarTabRef"
                :ano-semestre="anoSemestre"
                :etapa-options="etapaOptions"
                :semestre-options="semestreOptions"
                @update:ano-semestre="anoSemestre = $event"
                @contexto-change="refreshDashboardContextoIfOpen"
            />

            <AvaliacaoGestaoAtividadesTab
                v-else-if="abaAtiva === 'atividades'"
                :ano-semestre="anoSemestre"
                :etapa-options="etapaOptions"
                :semestre-options="semestreOptions"
                @update:ano-semestre="anoSemestre = $event"
            />
        </div>
        <!-- Fim do conteúdo principal -->
        <ConfirmationModal
            :is-open="showBulkPublishConfirm"
            title="Publicar avaliações em lote"
            :message="`Confirmar a publicação de ${dashboardStats?.total_alunos || 0} avaliação(ões) da etapa '${etapaAtiva}'? Esta ação só é liberada porque todas estão completas e validadas.`"
            confirm-text="Publicar"
            cancel-text="Cancelar"
            type="info"
            :loading="bulkPublishing"
            @close="showBulkPublishConfirm = false"
            @confirm="confirmBulkPublish"
        />

        <ModalDashboardContextoAvaliacoes
            :is-open="showDashboardContextoModal"
            :loading="loadingDashboardContexto"
            :items="dashboardContexto"
            :etapa="etapaAtiva"
            :ano-semestre="anoSemestre"
            :resumo="resumoDashboardContexto"
            @close="showDashboardContextoModal = false"
        />

        <ModalResumoConceitosTurmas
            :is-open="showResumoConceitosModal"
            :loading="loadingResumoConceitos"
            :items="resumoConceitos"
            :etapa="etapaAtiva"
            :ano-semestre="anoSemestre"
            @close="showResumoConceitosModal = false"
        />
    </NuxtLayout>
</template>

<style scoped>
.slide-down-enter-active {
    transition: all 0.2s ease-out;
}
.slide-down-leave-active {
    transition: all 0.15s ease-in;
}
.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
