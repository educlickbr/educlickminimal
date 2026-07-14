<template>
    <div class="space-y-4">
        <!-- Filtros -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div class="md:col-span-2">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Área</label
                >
                <BaseSelect
                    v-model="filtrosCertificados.area"
                    :options="areaOptionsCertificados"
                    label-key="label"
                    value-key="value"
                    placeholder="Área"
                />
            </div>
            <div class="md:col-span-2">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Ano/Semestre</label
                >
                <BaseSelect
                    v-model="filtrosCertificados.ano_semestre"
                    :options="semestreOptions"
                    label-key="nome"
                    value-key="id"
                    placeholder="Ano/Semestre"
                />
            </div>
            <div class="md:col-span-3">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Turma</label
                >
                <BaseSelect
                    v-model="filtrosCertificados.id_turma"
                    :options="turmaOptions"
                    label-key="nome"
                    value-key="id"
                    :placeholder="
                        isLoadingTurmas
                            ? 'Carregando turmas...'
                            : 'Selecione a turma'
                    "
                />
            </div>
            <div class="md:col-span-2">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Elegibilidade</label
                >
                <BaseSelect
                    v-model="filtrosCertificados.elegibilidade"
                    :options="elegibilidadeOptions"
                    label-key="label"
                    value-key="value"
                    placeholder="Elegibilidade"
                />
            </div>
            <div class="md:col-span-3">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Buscar Aluno</label
                >
                <input
                    v-model="filtrosCertificados.busca"
                    type="text"
                    placeholder="Nome, RA ou e-mail..."
                    class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-secondary/30"
                />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoadingCertificados" class="flex justify-center py-16">
            <div
                class="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"
            ></div>
        </div>

        <!-- Sem turma -->
        <div
            v-else-if="!filtrosCertificados.id_turma"
            class="rounded-xl border border-white/10 bg-[#16161E] p-5 text-sm text-secondary"
        >
            Selecione uma turma para listar alunos.
        </div>

        <!-- Vazio -->
        <div
            v-else-if="alunosCertificados.length === 0"
            class="rounded-xl border border-white/10 bg-[#16161E] p-5 text-sm text-secondary"
        >
            Nenhum aluno encontrado para os filtros selecionados.
        </div>

        <!-- Lista de alunos -->
        <div v-else class="space-y-3">
            <div
                v-for="aluno in alunosCertificados"
                :key="`${aluno.id_aluno}-${aluno.id_matricula_contexto}`"
                class="rounded-xl border border-white/10 bg-[#12121A] p-4"
            >
                <div
                    class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
                >
                    <div class="space-y-1">
                        <h3 class="text-white font-bold text-sm md:text-base">
                            {{ aluno.nome }} {{ aluno.sobrenome }}
                        </h3>
                        <p class="text-xs text-secondary">
                            {{ aluno.nome_curso }}
                            <span v-if="aluno.cod_turma_contexto"
                                >• Turma {{ aluno.cod_turma_contexto }}</span
                            >
                            <span v-if="aluno.ra">• RA {{ aluno.ra }}</span>
                        </p>
                        <p class="text-[11px] text-secondary/80">
                            Período da turma:
                            {{ formatDataCurta(aluno.dt_ini_curso_contexto) }} a
                            {{ formatDataCurta(aluno.dt_fim_curso_contexto) }}
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <span
                            class="px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider"
                            :class="
                                aluno.elegivel_certificado
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            "
                        >
                            {{
                                aluno.elegivel_certificado
                                    ? "Elegível"
                                    : "Não elegível"
                            }}
                        </span>
                        <span
                            class="px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider"
                            :class="
                                aluno.status_aprovacao === 'aprovado'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : aluno.status_aprovacao === 'reprovado'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : 'bg-white/10 text-secondary border-white/15'
                            "
                        >
                            {{ aluno.status_aprovacao }}
                        </span>
                        <span
                            class="px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider bg-white/5 text-white border-white/10"
                        >
                            {{ aluno.total_matriculas_contexto }}/{{
                                aluno.minimo_requerido
                            }}
                            matrículas
                        </span>
                    </div>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                    <button
                        @click="openDiarioModal(aluno)"
                        class="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                    >
                        Ver Diário
                    </button>
                    <button
                        v-if="isAreaRegulares(aluno.area_curso)"
                        @click="verAvaliacoesPlaceholder"
                        class="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                    >
                        Ver Avaliações
                    </button>
                    <button
                        @click="emit('preview', aluno)"
                        class="px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider bg-primary hover:brightness-110 text-white transition-colors ring-2 ring-primary/40 shadow-lg shadow-primary/25"
                    >
                        Preview Certificado
                    </button>
                    <button
                        @click="aprovarCertificacao(aluno)"
                        :disabled="!aluno.elegivel_certificado"
                        class="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-500/90 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Aprovar
                    </button>
                    <button
                        @click="toggleExpandAluno(aluno.id_aluno)"
                        class="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                    >
                        {{
                            alunoExpandido[aluno.id_aluno]
                                ? "Ocultar Histórico"
                                : "Expandir Histórico"
                        }}
                    </button>
                </div>

                <!-- Histórico expandido -->
                <div
                    v-if="alunoExpandido[aluno.id_aluno]"
                    class="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 space-y-2"
                >
                    <p
                        class="text-xs font-bold uppercase tracking-wider text-secondary"
                    >
                        Matrículas consideradas neste contexto
                    </p>
                    <div class="space-y-2">
                        <div
                            v-for="hist in aluno.historico_matriculas"
                            :key="hist.id_matricula"
                            class="flex flex-col md:flex-row md:items-center md:justify-between rounded-md border px-3 py-2 text-xs"
                            :class="
                                hist.is_contexto
                                    ? 'border-primary/30 bg-primary/5 text-white'
                                    : 'border-white/10 bg-white/5 text-secondary'
                            "
                        >
                            <span
                                >{{ hist.cod_turma || "Turma sem código"
                                }}<span v-if="hist.ano_semestre">
                                    • {{ hist.ano_semestre }}</span
                                ><span v-if="hist.turno">
                                    • {{ hist.turno }}</span
                                ></span
                            >
                            <span class="mt-1 md:mt-0"
                                >{{ formatDataCurta(hist.dt_ini_curso) }} a
                                {{ formatDataCurta(hist.dt_fim_curso)
                                }}<strong
                                    v-if="hist.is_contexto"
                                    class="text-primary ml-2"
                                    >(Contexto atual)</strong
                                ></span
                            >
                        </div>
                    </div>
                    <p
                        v-if="aluno.motivo_reprovacao"
                        class="text-xs text-amber-300"
                    >
                        Motivo da reprovação: {{ aluno.motivo_reprovacao }}
                    </p>
                </div>
            </div>

            <!-- Paginação -->
            <div
                class="flex flex-col md:flex-row items-center justify-between gap-3 pt-2"
            >
                <span class="text-xs text-secondary"
                    >Total:
                    <strong class="text-white">{{
                        paginationCertificados.total
                    }}</strong>
                    alunos</span
                >
                <div class="flex gap-2">
                    <button
                        @click="
                            paginationCertificados.page--;
                            fetchAlunosCertificados();
                        "
                        :disabled="paginationCertificados.page <= 1"
                        class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    <button
                        @click="
                            paginationCertificados.page++;
                            fetchAlunosCertificados();
                        "
                        :disabled="
                            paginationCertificados.page >=
                            paginationCertificados.pages
                        "
                        class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Diário -->
        <ModalDiario
            :isOpen="showDiarioModal"
            :aluno="selectedAlunoForDiario"
            @close="showDiarioModal = false"
        />
    </div>
</template>

<script setup lang="ts">
import {
    useGestaoCertificadosEmissao,
    type AlunoCertificadoItem,
} from "~/composables/gestao-certificados/useGestaoCertificadosEmissao";
import { useToast } from "../../../composables/useToast";
import BaseSelect from "~/components/BaseSelect.vue";
import ModalDiario from "~/components/global/ModalDiario.vue";

const emit = defineEmits<{
    preview: [aluno: AlunoCertificadoItem];
}>();

const { showToast } = useToast();

const {
    isLoadingTurmas,
    isLoadingCertificados,
    alunosCertificados,
    alunoExpandido,
    paginationCertificados,
    showDiarioModal,
    selectedAlunoForDiario,
    semestreOptions,
    filtrosCertificados,
    areaOptionsCertificados,
    elegibilidadeOptions,
    turmaOptions,
    formatDataCurta,
    isAreaRegulares,
    verAvaliacoesPlaceholder,
    toggleExpandAluno,
    openDiarioModal,
    fetchAlunosCertificados,
    aprovarCertificacao,
} = useGestaoCertificadosEmissao(showToast);
</script>
