<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { mascaraCEP } from "~/utils/viacep";
import { useAppStore } from "~~/stores/app";
import { useFormAnswers } from "~/composables/form/useFormAnswers";
import { useFormFiles } from "~/composables/form/useFormFiles";
import { useFormCep } from "~/composables/form/useFormCep";
import { useFormInscricao } from "~/composables/form/useFormInscricao";
import { useToast } from '~/composables/useToast';

const route = useRoute();
const { tipo_proc, tipo_cand, area_id, programa_id } = route.params as {
    tipo_proc: string;
    tipo_cand: string;
    area_id: string;
    programa_id: string;
};

const store = useAppStore();

// ── Estado local (UI + orquestração) ──────────────────────
const loading = ref(true);
const blocos = ref<any[]>([]);
const activeTab = ref(0);

// ── Fallback de Entidade ──────────────────────────────────
const idEntidade = computed(
    () =>
        (route.query.id_entidade as string) ||
        "00ca60ea-6667-482d-8a96-09b877707b08",
);

// ── Composables ───────────────────────────────────────────
const answersCtx = useFormAnswers({
    idEntidade: () => idEntidade.value,
    userExpandidoId: () => store.user_expandido_id,
    onAnswersLoaded: () => cepCtx.updateEnderecoFieldsUnlockedState(),
});

const filesCtx = useFormFiles({
    answers: answersCtx.answers,
    saveStatus: answersCtx.saveStatus,
    saveAnswer: answersCtx.saveAnswer,
    userExpandidoId: () => store.user_expandido_id,
});

const cepCtx = useFormCep({
    answers: answersCtx.answers,
    saveStatus: answersCtx.saveStatus,
    saveAnswer: answersCtx.saveAnswer,
    saveMultipleAnswers: answersCtx.saveMultipleAnswers,
    blocos: () => blocos.value,
});

const inscricaoCtx = useFormInscricao();

// ── Funções de callback para eventos do FormPergunta ──────
function onPerguntaBlur(perguntaId: string, tipo?: string) {
    answersCtx.saveAnswer(perguntaId, tipo);
}

function onPerguntaCepBlur(pergunta: any) {
    cepCtx.handleCepBlur(pergunta);
}

function onPerguntaCepInput(perguntaId: string) {
    cepCtx.formatCepInput(perguntaId);
    answersCtx.answers.value[perguntaId] = mascaraCEP(
        String(answersCtx.answers.value[perguntaId] || ""),
    );
}

function onPerguntaCpfInput(perguntaId: string) {
    // formatarCPF é chamado aqui se necessário
}

function onPerguntaFileUpload(event: Event, perguntaId: string) {
    filesCtx.handleFileUpload(event, perguntaId);
}

function onPerguntaRemoveFile(perguntaId: string) {
    filesCtx.removeFile(perguntaId);
}

function onPerguntaViewFile(perguntaId: string) {
    filesCtx.viewFile(perguntaId);
}

// ── Carregar configuração do formulário ──────────────────
async function loadFormConfig() {
    loading.value = true;
    try {
        const configRes = (await $fetch("/api/form/config", {
            params: {
                id_entidade: idEntidade.value,
                programa_id: programa_id !== "0" ? programa_id : null,
                area_id: area_id !== "0" ? area_id : null,
                tipo_proc,
                tipo_cand,
            },
        })) as any;

        if (configRes.success) {
            let blocosData = configRes.blocos || [];

            if (blocosData.length === 0) {
                blocosData.push({
                    bloco: "Dados Gerais",
                    ordem: 0,
                    perguntas: [],
                });
            }

            const sysQuestions = [
                {
                    pergunta_id: "sys-nome",
                    label: "Nome",
                    tipo_pergunta: "text",
                    largura: "1",
                    obrigatorio: true,
                },
                {
                    pergunta_id: "sys-sobrenome",
                    label: "Sobrenome",
                    tipo_pergunta: "text",
                    largura: "1",
                    obrigatorio: true,
                },
                {
                    pergunta_id: "sys-email",
                    label: "E-mail",
                    tipo_pergunta: "email",
                    largura: "2",
                    obrigatorio: true,
                    disabled: true,
                },
            ];

            blocosData[0].perguntas = [
                ...sysQuestions,
                ...blocosData[0].perguntas,
            ];
            blocos.value = blocosData;

            if (store.initialized) {
                answersCtx.answers.value["sys-nome"] = store.nome || "";
                answersCtx.answers.value["sys-sobrenome"] =
                    store.sobrenome || "";
                answersCtx.answers.value["sys-email"] = store.user?.email || "";
            }

            const allPerguntaIds = blocos.value
                .flatMap((b) => b.perguntas.map((p: any) => p.pergunta_id))
                .filter((id) => !id.startsWith("sys-"));

            if (store.user_expandido_id && allPerguntaIds.length > 0) {
                await answersCtx.loadUserAnswers(allPerguntaIds, blocos.value);

                const fileQuestions = blocos.value
                    .flatMap((b) => b.perguntas)
                    .filter((p: any) => p.tipo_pergunta === "file");

                for (const q of fileQuestions) {
                    const fileId = answersCtx.answers.value[q.pergunta_id];
                    if (fileId) {
                        filesCtx.fetchFileInfo(q.pergunta_id, fileId);
                    }
                }
            }
        }
    } catch (e) {
        console.error("Erro ao carregar form:", e);
    } finally {
        loading.value = false;
    }
}

// ── Finalizar Inscrição ──────────────────────────────────
const { showToast } = useToast();

async function handleFinalizarInscricao() {
    const idProcesso = (route.query.id_processo_seletivo as string) || "";

    if (!idProcesso) {
        showToast("Processo seletivo não identificado.", { type: "error" });
        return;
    }

    const { sucesso, jaExistia } = await inscricaoCtx.finalizarInscricao({
        id_processo: idProcesso,
        tipo_proc: tipo_proc as string,
        tipo_cand: tipo_cand as string,
        // toast é tratado dentro do composable
    });

    if (sucesso && !jaExistia) {
        showToast("Inscrição finalizada com sucesso!", { type: "success" });
    }
}

// ── Init ──────────────────────────────────────────────────
onMounted(async () => {
    if (!store.initialized) await store.initSession();
    await loadFormConfig();
});
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0c] text-white font-sans">
        <header class="bg-[#0f0f17] border-b border-white/5 px-6 py-4">
            <div class="max-w-5xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <Icon name="ph:form-bold" class="w-6 h-6 text-primary" />
                    <h1 class="text-sm font-black uppercase tracking-widest">
                        {{ tipo_proc }} · {{ tipo_cand }}
                    </h1>
                </div>
                <button
                    @click="$router.back()"
                    class="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors"
                >
                    Voltar
                </button>
            </div>
        </header>

        <main class="max-w-5xl mx-auto px-6 py-12">
            <!-- Loading -->
            <div v-if="loading" class="space-y-8">
                <div class="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
                <div class="grid grid-cols-2 gap-6">
                    <div
                        v-for="i in 4"
                        :key="i"
                        class="h-20 bg-white/5 animate-pulse rounded-xl"
                    />
                </div>
            </div>

            <!-- Vazio -->
            <div
                v-else-if="blocos.length === 0"
                class="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl"
            >
                <Icon
                    name="ph:seal-warning-light"
                    class="w-16 h-16 text-secondary/20 mb-4 mx-auto"
                />
                <p class="text-secondary font-bold">
                    Nenhuma pergunta configurada para este formulário.
                </p>
            </div>

            <!-- Formulário -->
            <div v-else>
                <!-- Tabs de blocos -->
                <div
                    v-if="blocos.length > 1"
                    class="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide"
                >
                    <button
                        v-for="(bloco, i) in blocos"
                        :key="i"
                        @click="activeTab = i"
                        class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0"
                        :class="
                            activeTab === i
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-white/[0.02] text-secondary/40 border border-white/5 hover:text-white hover:border-white/10'
                        "
                    >
                        {{ bloco.bloco }}
                    </button>
                </div>

                <!-- Bloco ativo -->
                <div
                    class="bg-[#0f0f17] border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl"
                >
                    <h2 class="text-2xl font-black mb-8 tracking-tight">
                        {{ blocos[activeTab]?.bloco }}
                    </h2>

                    <div class="grid grid-cols-2 gap-x-8 gap-y-10">
                        <FormPergunta
                            v-for="pergunta in blocos[activeTab]?.perguntas"
                            :key="pergunta.pergunta_id"
                            :pergunta="pergunta"
                            :answers="answersCtx.answers.value"
                            :save-status="answersCtx.saveStatus.value"
                            :file-names="filesCtx.fileNames.value"
                            :file-links="filesCtx.fileLinks.value"
                            :is-endereco-field-disabled="
                                cepCtx.isEnderecoFieldDisabled
                            "
                            @blur="onPerguntaBlur"
                            @cep-blur="onPerguntaCepBlur"
                            @cep-input="onPerguntaCepInput"
                            @cpf-input="onPerguntaCpfInput"
                            @file-upload="onPerguntaFileUpload"
                            @remove-file="onPerguntaRemoveFile"
                            @view-file="onPerguntaViewFile"
                        />
                    </div>

                    <!-- Navegação -->
                    <div
                        class="mt-16 pt-8 border-t border-white/5 flex items-center justify-between"
                    >
                        <button
                            v-if="activeTab > 0"
                            @click="activeTab--"
                            class="px-8 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                        >
                            Anterior
                        </button>
                        <div v-else />

                        <button
                            v-if="activeTab < blocos.length - 1"
                            @click="activeTab++"
                            class="px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                        >
                            Próximo Passo
                        </button>
                        <button
                            v-else
                            @click="handleFinalizarInscricao"
                            :disabled="inscricaoCtx.enviando.value"
                            class="px-8 py-3 rounded-xl bg-green-500 text-white text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {{
                                inscricaoCtx.enviando.value
                                    ? "Enviando..."
                                    : "Finalizar Inscrição"
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
}
select option {
    background: #1a1a2e;
    color: white;
}
input[type="date"] {
    color-scheme: dark;
}
input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.7);
    cursor: pointer;
}
</style>
