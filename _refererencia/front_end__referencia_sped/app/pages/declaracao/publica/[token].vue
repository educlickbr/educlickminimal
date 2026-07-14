<script setup lang="ts">
// @ts-nocheck
interface DeclaracaoPublica {
    id_declaracao: string;
    n_declaracao: number | null;
    criado_em: string | null;
    data_declaracao: string | null;
    id_matricula: string;
    dt_matricula: string | null;
    id_turma: string;
    cod_turma: string;
    ano_semestre: string;
    turno: string;
    area_curso: string;
    nome_curso: string;
    nome_aluno: string;
    cpf_aluno: string | null;
    qtd_semestres: number | null;
    carga_horaria_minutos: number | null;
    num_semestre_atual: number | null;
    total_semestres_cursados: number | null;
    token_publico_expira_em?: string | null;
}

const route = useRoute();
const token = computed(() => String(route.params.token || ""));
const nomeExibicao = computed(() =>
    typeof route.query.nome === "string" ? route.query.nome : "registro",
);

definePageMeta({
    layout: false,
});

useHead({
    title: "Verificação de Declaração | SPED Digital",
    htmlAttrs: {
        translate: "no",
        class: "notranslate",
    },
    bodyAttrs: {
        class: "notranslate",
    },
});

const { data, pending, error } = await useFetch(
    `/api/declaracao/publica/${token.value}?nome=${encodeURIComponent(nomeExibicao.value)}`,
);

const res: any = data;

const declaracao = computed(() => res?.declaracao || null);

const expiraEmLabel = computed(() => {
    const rawValue =
        res?.token_publico_expira_em ||
        declaracao.value?.token_publico_expira_em ||
        null;

    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) return "Não informado";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
});

const cargaHorariaHoras = computed(() => {
    const minutos = declaracao.value?.carga_horaria_minutos || 0;
    return Math.floor(minutos / 60);
});

const numeroDeclaracao = computed(() => {
    const numero = declaracao.value?.n_declaracao;
    if (numero !== null && numero !== undefined) return String(numero);
    return declaracao.value?.id_declaracao || "Não informado";
});

const dataDeclaracao = computed(() => {
    const raw =
        declaracao.value?.data_declaracao || declaracao.value?.criado_em;
    if (!raw) return "Não informado";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "Não informado";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date);
});

const dataMatricula = computed(() => {
    const raw = declaracao.value?.dt_matricula;
    if (!raw) return "Não informado";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "Não informado";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date);
});

const linkExpirado = computed(() => !!res?.expired);
const errorTitle = computed(() =>
    linkExpirado.value ? "Link expirado" : "Declaração indisponível",
);
const errorMessage = computed(() => {
    const r: any = res;
    if (linkExpirado.value) {
        return (
            r?.message || "Link expirado. Favor gerar outro na página interna."
        );
    }
    return r?.message || "Declaração indisponível no momento.";
});

useHead({
    title: "Verificação de Declaração | SPED Digital",
    htmlAttrs: {
        translate: "no",
        class: "notranslate",
    },
    bodyAttrs: {
        class: "notranslate",
    },
});
</script>

<template>
    <div
        translate="no"
        class="notranslate public-page min-h-screen bg-[#f4f6f8] text-[#1a1f2b]"
    >
        <div class="w-full md:max-w-5xl md:mx-auto">
            <div
                class="bg-white border border-[#d9dee5] shadow-sm overflow-hidden"
            >
                <div
                    class="border-b border-[#d9dee5] bg-primary text-white px-2 py-4 md:px-8 md:py-6"
                >
                    <div
                        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                        <div class="flex items-start gap-3">
                            <img
                                src="/logosp_sem_fundo.png"
                                alt="Logo da escola"
                                class="w-14 h-14 object-contain"
                            />
                            <div>
                                <p
                                    class="text-xs uppercase tracking-[0.2em] opacity-70"
                                >
                                    São Paulo Escola de Dança
                                </p>
                                <h1
                                    class="text-2xl md:text-3xl font-black mt-1"
                                >
                                    Verificação de Declaração
                                </h1>
                                <p class="text-sm opacity-80 mt-2">
                                    Documento institucional gerado pelo sistema
                                    SPED Digital.
                                </p>
                            </div>
                        </div>
                        <div
                            class="bg-white/10 border border-white/20 px-3 py-2 text-xs min-w-[180px]"
                        >
                            <p class="uppercase tracking-wider opacity-80">
                                Expira Em
                            </p>
                            <p class="font-bold mt-1">{{ expiraEmLabel }}</p>
                        </div>
                    </div>
                </div>

                <div v-if="pending" class="p-10 text-center">
                    <svg
                        class="animate-spin h-8 w-8 text-primary mx-auto mb-4"
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
                    <p class="text-sm text-[#4b5563]">
                        Carregando declaração pública...
                    </p>
                </div>

                <div v-else-if="error || !declaracao" class="p-10">
                    <div class="border border-red-200 bg-red-50 rounded-lg p-5">
                        <h2 class="font-bold text-red-700">{{ errorTitle }}</h2>
                        <p class="text-sm text-red-600 mt-2">
                            {{ errorMessage }}
                        </p>
                        <p
                            v-if="data?.token_publico_expira_em"
                            class="text-xs text-red-500 mt-3"
                        >
                            Última expiração registrada: {{ expiraEmLabel }}
                        </p>
                    </div>
                </div>

                <div v-else class="px-2 py-4 md:px-8 md:py-6 space-y-6">
                    <div
                        class="border border-[#d9dee5] p-4 rounded-lg bg-[#f8fafc]"
                    >
                        <p
                            class="text-xs uppercase tracking-[0.15em] text-primary font-bold"
                        >
                            Dados do Documento
                        </p>
                        <div
                            class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
                        >
                            <p>
                                <span class="font-semibold"
                                    >Declaração Nº:</span
                                >
                                {{ numeroDeclaracao }}
                            </p>
                            <p>
                                <span class="font-semibold">Emitida em:</span>
                                {{ dataDeclaracao }}
                            </p>
                            <p>
                                <span class="font-semibold">Aluno:</span>
                                {{ declaracao.nome_aluno }}
                            </p>
                            <p>
                                <span class="font-semibold">CPF:</span>
                                {{ declaracao.cpf_aluno || "Não informado" }}
                            </p>
                            <p>
                                <span class="font-semibold">Curso:</span>
                                {{ declaracao.nome_curso }}
                            </p>
                            <p>
                                <span class="font-semibold">Turma:</span>
                                {{ declaracao.cod_turma }}
                            </p>
                            <p>
                                <span class="font-semibold">Ano/Semestre:</span>
                                {{ declaracao.ano_semestre }}
                            </p>
                            <p>
                                <span class="font-semibold">Turno:</span>
                                {{ declaracao.turno }}
                            </p>
                            <p>
                                <span class="font-semibold">Área:</span>
                                {{ declaracao.area_curso }}
                            </p>
                            <p>
                                <span class="font-semibold"
                                    >Data de matrícula:</span
                                >
                                {{ dataMatricula }}
                            </p>
                            <p>
                                <span class="font-semibold"
                                    >Semestre atual:</span
                                >
                                {{ declaracao.num_semestre_atual || 0 }} de
                                {{ declaracao.total_semestres_cursados || 0 }}
                            </p>
                            <p>
                                <span class="font-semibold"
                                    >Carga horária total:</span
                                >
                                {{ cargaHorariaHoras }} horas
                            </p>
                        </div>
                    </div>

                    <div class="border border-[#d9dee5] rounded-lg p-4">
                        <p
                            class="text-xs uppercase tracking-[0.15em] text-primary font-bold"
                        >
                            Texto de Validação
                        </p>
                        <p class="text-sm text-[#1f2937] mt-3 leading-relaxed">
                            Declaramos que o(a) estudante
                            <strong>{{ declaracao.nome_aluno }}</strong
                            >, portador(a) do CPF
                            <strong>{{
                                declaracao.cpf_aluno || "Não informado"
                            }}</strong
                            >, está devidamente matriculado(a) no curso
                            <strong>{{ declaracao.nome_curso }}</strong
                            >, no turno <strong>{{ declaracao.turno }}</strong
                            >, com duração de
                            <strong>{{ declaracao.qtd_semestres || 0 }}</strong>
                            semestre(s) e carga horária total de
                            <strong>{{ cargaHorariaHoras }}</strong> hora(s).
                        </p>
                    </div>

                    <div
                        class="border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
                    >
                        Documento de verificação institucional gerado pelo
                        sistema SPED Digital da São Paulo Escola de Dança.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.public-page {
    font-family: Inter, "Helvetica Neue", Arial, sans-serif;
}
</style>
