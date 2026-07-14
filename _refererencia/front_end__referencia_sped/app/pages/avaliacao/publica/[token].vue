<script setup lang="ts">
// @ts-nocheck
const route = useRoute();
const token = computed(() => String(route.params.token || ""));
const nomeExibicao = computed(() =>
    typeof route.query.nome === "string" ? route.query.nome : "registro",
);

definePageMeta({
    layout: false,
});

// ---- main data ----
// @ts-expect-error Nuxt useFetch type inference
const { data, pending, error } = await useFetch(
    `/api/avaliacao-publica/${token.value}?nome=${encodeURIComponent(nomeExibicao.value)}`,
);
const r: any = computed(() => (data as any)?.value);
const avaliacao = computed(() => r.value?.avaliacao || null);

const isRelatorioFinal = computed(
    () => avaliacao.value?.etapa === "Relatório Final",
);

// ---- contexto (opcional) ----
const contextoData = ref<any>(null);
const contextoPending = ref(false);

if (import.meta.client && isRelatorioFinal.value) {
    contextoPending.value = true;
    $fetch("/api/avaliacao-publica/contexto", {
        params: { token: token.value },
    })
        .then((res) => (contextoData.value = res))
        .finally(() => (contextoPending.value = false));
}

const avaliacoesContexto = computed(() => {
    if (!contextoData.value?.avaliacoes) return [];
    return contextoData.value.avaliacoes.filter(
        (a: any) => a.id_avaliacao !== avaliacao.value?.id_avaliacao,
    );
});

const expiraEmLabel = computed(() => {
    const rawValue =
        r.value?.token_publico_expira_em ||
        avaliacao.value?.token_publico_expira_em ||
        null;
    if (!rawValue) return "Nao informado";

    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) return "Nao informado";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
});

const linkExpirado = computed(() => !!r.value?.expired);
const errorTitle = computed(() =>
    linkExpirado.value ? "Link expirado" : "Avaliacao indisponivel",
);
const errorMessage = computed(() => {
    if (linkExpirado.value) {
        return (
            r.value?.message ||
            "Link expirado. Favor gerar outro na pagina de avaliacao."
        );
    }
    return r.value?.message || "Avaliacao indisponivel no momento.";
});

useHead({
    title: "Verificacao de Avaliacao | SPED Digital",
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
                                    Sao Paulo Escola de Danca
                                </p>
                                <h1
                                    class="text-2xl md:text-3xl font-black mt-1"
                                >
                                    Verificacao de Avaliacao
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
                        Carregando avaliacao publica...
                    </p>
                </div>

                <div v-else-if="error || !avaliacao" class="p-10">
                    <div class="border border-red-200 bg-red-50 rounded-lg p-5">
                        <h2 class="font-bold text-red-700">{{ errorTitle }}</h2>
                        <p class="text-sm text-red-600 mt-2">
                            {{ errorMessage }}
                        </p>
                        <p
                            v-if="r?.token_publico_expira_em"
                            class="text-xs text-red-500 mt-3"
                        >
                            Ultima expiracao registrada: {{ expiraEmLabel }}
                        </p>
                    </div>
                </div>

                <!-- Avaliacao principal -->
                <div v-else class="px-2 py-4 md:px-8 md:py-6 space-y-6">
                    <div class="border border-[#d9dee5] p-3">
                        <p
                            class="text-xs uppercase tracking-[0.15em] text-primary font-bold"
                        >
                            Dados Academicos
                        </p>
                        <div
                            class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
                        >
                            <p>
                                <span class="font-semibold">Aluno:</span>
                                {{ avaliacao.nome_aluno }}
                            </p>
                            <p>
                                <span class="font-semibold">Matricula:</span>
                                {{ avaliacao.matricula_id || "&mdash;" }}
                            </p>
                            <p>
                                <span class="font-semibold">Curso:</span>
                                {{ avaliacao.curso_nome }}
                            </p>
                            <p>
                                <span class="font-semibold">Turma:</span>
                                {{ avaliacao.turma_nome }}
                            </p>
                            <p>
                                <span class="font-semibold"
                                    >Semestre letivo:</span
                                >
                                {{ avaliacao.ano_semestre }}
                            </p>
                            <p>
                                <span class="font-semibold"
                                    >Semestre atual:</span
                                >
                                {{ avaliacao.semestre_atual }} de
                                {{ avaliacao.total_semestres_cursados }}
                            </p>
                            <p class="md:col-span-2">
                                <span class="font-semibold">Etapa:</span>
                                {{ avaliacao.etapa }}
                            </p>
                        </div>
                    </div>

                    <div class="border border-[#d9dee5] p-3">
                        <p
                            class="text-xs uppercase tracking-[0.15em] text-primary font-bold"
                        >
                            Avaliadores
                        </p>
                        <div
                            class="mt-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-2"
                        >
                            <p>
                                <span class="font-semibold"
                                    >Avaliador(a) 1:</span
                                >
                                {{
                                    avaliacao.avaliador_1_nome ||
                                    "Nao informado"
                                }}
                            </p>
                            <p>
                                <span class="font-semibold"
                                    >Avaliador(a) 2:</span
                                >
                                {{
                                    avaliacao.avaliador_2_nome ||
                                    "Nao informado"
                                }}
                            </p>
                        </div>
                    </div>

                    <div class="border border-[#d9dee5] p-3">
                        <p
                            class="text-xs uppercase tracking-[0.15em] text-primary font-bold"
                        >
                            Validacao Institucional
                        </p>
                        <div
                            class="mt-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-2"
                        >
                            <p>
                                <span class="font-semibold"
                                    >Coordenador(a):</span
                                >
                                {{
                                    avaliacao.coordenador_nome ||
                                    "Nao informado"
                                }}
                            </p>
                            <p>
                                <span class="font-semibold">Pedagogo(a):</span>
                                {{ avaliacao.pedagogo_nome || "Nao informado" }}
                            </p>
                        </div>
                    </div>

                    <div class="border border-[#d9dee5] p-3">
                        <p
                            class="text-xs uppercase tracking-[0.15em] text-primary font-bold"
                        >
                            Criterios e Conceitos
                        </p>
                        <div class="mt-3 space-y-2">
                            <div
                                v-for="c in avaliacao.criterios || []"
                                :key="c.id_criterio"
                                class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] items-center gap-2 md:gap-4 border border-[#eef2f7] rounded px-3 py-2"
                            >
                                <p
                                    translate="no"
                                    class="text-sm text-[#1f2937] leading-relaxed break-words"
                                >
                                    {{ c.criterio }}
                                </p>
                                <span
                                    translate="no"
                                    class="w-full md:w-[220px] text-center text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded border border-[#dbe2ea] bg-[#f8fafc] whitespace-nowrap"
                                >
                                    {{ c.conceito || "Em avaliacao" }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="border border-[#d9dee5] rounded-lg p-4">
                        <p
                            class="text-xs uppercase tracking-[0.15em] text-primary font-bold"
                        >
                            Parecer Final
                        </p>
                        <p
                            class="text-sm text-[#1f2937] mt-3 whitespace-pre-wrap leading-relaxed"
                        >
                            {{
                                avaliacao.comentario ||
                                "Sem comentario registrado para esta avaliacao."
                            }}
                        </p>
                    </div>

                    <div
                        class="border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
                    >
                        Documento de verificacao institucional gerado pelo
                        sistema SPED Digital da Sao Paulo Escola de Danca.
                    </div>

                    <!-- Avaliacoes anteriores (apenas Relatorio Final) -->
                    <template v-if="isRelatorioFinal">
                        <div
                            v-if="contextoPending"
                            class="border border-[#d9dee5] p-6 text-center"
                        >
                            <svg
                                class="animate-spin h-6 w-6 text-primary mx-auto mb-2"
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
                                Carregando avaliacoes anteriores...
                            </p>
                        </div>

                        <div
                            v-for="av in avaliacoesContexto"
                            :key="av.id_avaliacao"
                            class="border-2 border-[#e2e8f0] bg-[#fafbfc] p-4 rounded-lg space-y-3"
                        >
                            <div class="flex items-center gap-2">
                                <span
                                    class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#cbd5e1] bg-[#e2e8f0] text-[#475569]"
                                >
                                    Etapa Anterior: {{ av.etapa }}
                                </span>
                            </div>

                            <div
                                v-if="av.criterios && av.criterios.length"
                                class="space-y-1.5"
                            >
                                <div
                                    v-for="c in av.criterios"
                                    :key="c.id_criterio"
                                    class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] items-center gap-2 md:gap-3 border border-[#eef2f7] rounded px-2.5 py-1.5 bg-white"
                                >
                                    <p
                                        translate="no"
                                        class="text-xs text-[#4b5563] leading-relaxed"
                                    >
                                        {{ c.criterio }}
                                    </p>
                                    <span
                                        translate="no"
                                        class="w-full md:w-[180px] text-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-[#dbe2ea] bg-[#f8fafc]"
                                    >
                                        {{ c.conceito || "&mdash;" }}
                                    </span>
                                </div>
                            </div>

                            <div
                                v-if="av.comentario"
                                class="text-xs text-[#64748b] italic leading-relaxed"
                            >
                                &ldquo;{{ av.comentario }}&rdquo;
                            </div>
                        </div>
                    </template>
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
