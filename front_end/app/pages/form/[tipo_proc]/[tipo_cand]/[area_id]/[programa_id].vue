<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { mascaraCEP } from "~/utils/viacep";
import { useAppStore } from "~~/stores/app";
import { useFormAnswers } from "~/composables/form/useFormAnswers";
import { useFormFiles } from "~/composables/form/useFormFiles";
import { useFormCep } from "~/composables/form/useFormCep";
import { useFormConfig } from "~/composables/form/useFormConfig";
import { useFormInscricao } from "~/composables/form/useFormInscricao";
import { useToast } from "~/composables/useToast";

const route = useRoute();
const router = useRouter();
const { tipo_proc, tipo_cand, area_id, programa_id } = route.params as {
    tipo_proc: string;
    tipo_cand: string;
    area_id: string;
    programa_id: string;
};

const store = useAppStore();
const { showToast } = useToast();

// ── Fallback de Entidade ──────────────────────────────────
const idEntidade = computed(
    () =>
        (route.query.id_entidade as string) ||
        "00ca60ea-6667-482d-8a96-09b877707b08",
);

// ── Composables ───────────────────────────────────────────
const configCtx = useFormConfig({
    idEntidade: () => idEntidade.value,
    programa_id,
    area_id,
    tipo_proc,
    tipo_cand,
});

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
    idEntidade: () =>
        store.company?.id || (route.query.id_entidade as string) || null,
});

const cepCtx = useFormCep({
    answers: answersCtx.answers,
    saveStatus: answersCtx.saveStatus,
    saveAnswer: answersCtx.saveAnswer,
    saveMultipleAnswers: answersCtx.saveMultipleAnswers,
    blocos: () => configCtx.blocos.value,
});

const inscricaoCtx = useFormInscricao();

// ── Bloqueio: verifica se já está inscrito ─────────────────
const jaInscrito = ref(false);
const verificandoInscricao = ref(true);

// ── Deep link: tab inicial via query param ─────────────────
const initialTab = computed(() => {
    const raw = route.query.tab;
    if (raw === undefined || raw === null) return 0;
    const parsed = Number(raw);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
});
const activeTab = ref(initialTab.value);

// ── Callbacks para eventos do FormPergunta ────────────────
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

// ── Finalizar Inscrição ──────────────────────────────────
async function handleFinalizarInscricao() {
    const idProcesso = (route.query.id_processo_seletivo as string) || "";

    if (!idProcesso) {
        showToast("Processo seletivo não identificado.", { type: "error" });
        return;
    }

    // Valida campos obrigatórios (frontend)
    const pendentes: string[] = [];
    for (const bloco of configCtx.blocos.value) {
        for (const pergunta of bloco.perguntas) {
            if (!pergunta.obrigatorio) continue;
            const val = answersCtx.answers.value[pergunta.pergunta_id];
            if (val === undefined || val === null || val === "") {
                pendentes.push(pergunta.label);
            }
        }
    }
    if (pendentes.length > 0) {
        showToast(`Preencha os campos obrigatórios: ${pendentes.join(", ")}`, {
            type: "error",
            duration: 5000,
        });
        return;
    }

    // Valida obrigatórios no servidor (RPC)
    const valRes = (await $fetch("/api/form/validar", {
        method: "POST",
        body: {
            id_entidade: idEntidade.value,
            area_id: area_id !== "0" ? area_id : null,
            programa_id: programa_id !== "0" ? programa_id : null,
            tipo_proc: tipo_proc as string,
            tipo_cand: tipo_cand as string,
            user_expandido_id: store.user_expandido_id,
        },
    })) as any;

    if (!valRes?.valid) {
        const labels = (valRes.pendentes || [])
            .map((p: any) => p.label)
            .join(", ");
        showToast(`Campos obrigatórios não preenchidos: ${labels}`, {
            type: "error",
            duration: 6000,
        });
        return;
    }

    const { sucesso, jaExistia, inscricao } =
        await inscricaoCtx.finalizarInscricao({
            id_processo: idProcesso,
            tipo_proc: tipo_proc as string,
            tipo_cand: tipo_cand as string,
        });

    if (sucesso && !jaExistia && inscricao?.id) {
        router.push(`/form/sucesso?id_inscricao=${inscricao.id}`);
    } else if (jaExistia) {
        showToast("Você já está inscrito neste processo.", {
            type: "info",
        });
    }
}

// ── Init ──────────────────────────────────────────────────
onMounted(async () => {
    if (!store.initialized) await store.initSession();

    // Verifica se já está inscrito neste processo
    const idProcesso = (route.query.id_processo_seletivo as string) || "";
    if (idProcesso && store.user_expandido_id) {
        const { existe } = await inscricaoCtx.verificarInscricao({
            id_processo: idProcesso,
            tipo_proc: tipo_proc as string,
            tipo_cand: tipo_cand as string,
        });
        if (existe) {
            jaInscrito.value = true;
            verificandoInscricao.value = false;
            return;
        }
    }
    verificandoInscricao.value = false;

    await configCtx.loadFormConfig();

    // Preencher respostas de sistema com dados do usuário logado
    if (store.initialized) {
        answersCtx.answers.value["sys-nome"] = store.nome || "";
        answersCtx.answers.value["sys-sobrenome"] = store.sobrenome || "";
        answersCtx.answers.value["sys-email"] = store.user?.email || "";
    }

    // Carregar respostas salvas e arquivos
    const ids = configCtx.allPerguntaIds.value;
    if (store.user_expandido_id && ids.length > 0) {
        await answersCtx.loadUserAnswers(ids, configCtx.blocos.value);

        const fileQuestions = configCtx.blocos.value
            .flatMap((b) => b.perguntas)
            .filter(
                (p: any) =>
                    p.tipo_pergunta === "file" || p.tipo_pergunta === "foto",
            );

        for (const q of fileQuestions) {
            const fileId = answersCtx.answers.value[q.pergunta_id];
            if (fileId) {
                filesCtx.fetchFileInfo(q.pergunta_id, fileId);
            }
        }
    }
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
            <!-- Verificando inscrição -->
            <div
                v-if="verificandoInscricao"
                class="py-20 flex flex-col items-center justify-center gap-4"
            >
                <div
                    class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
                />
                <span
                    class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                    >Verificando inscrição...</span
                >
            </div>

            <!-- Já inscrito -->
            <div
                v-else-if="jaInscrito"
                class="py-20 text-center max-w-md mx-auto"
            >
                <div
                    class="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6"
                >
                    <Icon
                        name="ph:seal-check-bold"
                        class="w-10 h-10 text-amber-400"
                    />
                </div>
                <h2
                    class="text-xl font-black uppercase tracking-widest mb-3 text-amber-400"
                >
                    Já Inscrito
                </h2>
                <p class="text-sm text-secondary/60 mb-8 leading-relaxed">
                    Você já realizou sua inscrição neste processo seletivo.
                    Acompanhe o status pelo painel do candidato.
                </p>
                <button
                    @click="$router.back()"
                    class="px-8 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                    Voltar
                </button>
            </div>

            <!-- Loading -->
            <div v-else-if="configCtx.loading.value" class="space-y-8">
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
                v-else-if="configCtx.blocos.value.length === 0"
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
                    v-if="configCtx.blocos.value.length > 1"
                    class="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide"
                >
                    <button
                        v-for="(bloco, i) in configCtx.blocos.value"
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

                <!-- Blocos: v-show preserva estado das FormPergunta entre tabs -->
                <template v-for="(bloco, i) in configCtx.blocos.value" :key="i">
                    <div
                        v-show="activeTab === i"
                        class="bg-[#0f0f17] border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl"
                    >
                        <h2 class="text-2xl font-black mb-8 tracking-tight">
                            {{ bloco.bloco }}
                        </h2>

                        <div class="grid grid-cols-2 gap-x-8 gap-y-10">
                            <FormPergunta
                                v-for="pergunta in bloco.perguntas"
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
                                v-if="
                                    activeTab <
                                    configCtx.blocos.value.length - 1
                                "
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
                </template>
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
