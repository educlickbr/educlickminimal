<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
    modelValue: boolean;
    idInscricao: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const loading = ref(false);
const erro = ref("");
const dados = ref<any>(null);
const fileLinks = ref<Record<string, string>>({});
const fileNames = ref<Record<string, string>>({});
const activeTab = ref(0);

function setActiveTab(i: number) {
    activeTab.value = i;
}

function fechar() {
    emit("update:modelValue", false);
}

watch(
    () => props.modelValue,
    async (aberto) => {
        if (!aberto) return;
        loading.value = true;
        erro.value = "";
        dados.value = null;
        fileLinks.value = {};
        fileNames.value = {};
        activeTab.value = 0;

        try {
            const res = (await $fetch("/api/processos/detalhes", {
                params: { id_inscricao: props.idInscricao },
            })) as any;

            if (!res?.success) {
                erro.value = res?.message || "Erro ao carregar detalhes";
                return;
            }
            dados.value = res;
            await fetchFileUrls(res);
        } catch (e: any) {
            erro.value = e?.message || "Erro ao carregar detalhes";
        } finally {
            loading.value = false;
        }
    },
);

async function fetchFileUrls(res: any) {
    const idsParaBuscar: { key: string; id_arquivo: string }[] = [];
    for (const pergunta of res.perguntas || []) {
        const pid = pergunta.pergunta_id;
        const arquivoKey = pid + "_id_arquivo";
        if (res.respostas?.[arquivoKey]) {
            idsParaBuscar.push({
                key: pid,
                id_arquivo: res.respostas[arquivoKey],
            });
        }
    }
    if (idsParaBuscar.length === 0) return;
    const promessas = idsParaBuscar.map(async ({ key, id_arquivo }) => {
        try {
            const signRes = (await $fetch("/api/r2/sign", {
                params: { id: id_arquivo },
            })) as any;
            if (signRes.signedUrl) {
                fileLinks.value[key] = signRes.signedUrl;
                fileNames.value[key] = signRes.nomeOriginal || "Arquivo";
            }
        } catch {
            /* ignora */
        }
    });
    await Promise.all(promessas);
}

function isFileOrFoto(tipo: string) {
    return tipo === "file" || tipo === "foto";
}

function formatarResposta(valor: any) {
    if (valor === null || valor === undefined || valor === "") return "—";
    return String(valor);
}
</script>

<template>
    <div v-if="modelValue" class="ds-modal-overlay" @click.self="fechar">
        <div class="ds-modal-panel max-w-3xl max-h-[85vh]">
            <div class="ds-modal-accent-bar" />

            <!-- Header -->
            <div class="ds-modal-header">
                <div class="ds-modal-header-icon">
                    <Icon name="ph:identification-card-bold" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">Detalhes da Inscrição</h3>
                    <p class="ds-modal-subtitle">
                        <template v-if="dados">
                            {{ dados.inscricao?.usuario?.nome_completo || "—" }}
                            ·
                            {{ dados.processo?.programa_nome || "—" }}
                        </template>
                        <template v-else>Carregando...</template>
                    </p>
                </div>
                <button @click="fechar" class="ds-modal-close-btn">&times;</button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto flex-1">
                <!-- Loading -->
                <div
                    v-if="loading"
                    class="py-12 flex flex-col items-center gap-3"
                >
                    <div
                        class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
                    />
                    <span
                        class="text-[10px] font-black text-secondary/50 uppercase tracking-widest"
                    >
                        Carregando formulário...
                    </span>
                </div>

                <!-- Erro -->
                <div v-else-if="erro" class="py-12 text-center">
                    <Icon
                        name="ph:seal-warning-bold"
                        class="w-10 h-10 text-red-400/40 mb-3 mx-auto"
                    />
                    <p class="text-sm font-bold text-red-400">{{ erro }}</p>
                </div>

                <!-- Vazio -->
                <div
                    v-else-if="!dados?.blocos?.length"
                    class="py-12 text-center"
                >
                    <Icon
                        name="ph:clipboard-text-light"
                        class="w-10 h-10 text-secondary/40 mb-3 mx-auto"
                    />
                    <p class="text-xs text-secondary/50">
                        Nenhum formulário configurado para este processo.
                    </p>
                </div>

                <!-- Conteúdo com abas -->
                <template v-else>
                    <!-- Tabs dos blocos -->
                    <div
                        v-if="dados.blocos.length > 1"
                        class="ds-tabs-nav mb-6 overflow-x-auto scrollbar-hide"
                    >
                        <button
                            v-for="(bloco, i) in dados.blocos"
                            :key="i"
                            @click="setActiveTab(Number(i))"
                            class="ds-tab-btn whitespace-nowrap"
                            :class="{ 'ds-tab-btn--active': activeTab === i }"
                        >
                            {{ bloco.bloco }}
                        </button>
                    </div>

                    <!-- Perguntas da aba ativa -->
                    <template v-for="(bloco, i) in dados.blocos" :key="i">
                        <div v-show="activeTab === i">
                            <h4
                                class="text-xs font-black uppercase tracking-widest text-primary/80 mb-4 pb-2 border-b border-divider"
                            >
                                {{ bloco.bloco }}
                            </h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    v-for="pergunta in bloco.perguntas"
                                    :key="pergunta.pergunta_id"
                                    class="flex flex-col gap-1"
                                >
                                    <span
                                        class="text-[9px] font-black text-secondary/50 uppercase tracking-widest"
                                    >
                                        {{ pergunta.label }}
                                    </span>

                                    <!-- File / Foto -->
                                    <template
                                        v-if="
                                            isFileOrFoto(pergunta.tipo_pergunta)
                                        "
                                    >
                                        <div
                                            v-if="
                                                fileLinks[pergunta.pergunta_id]
                                            "
                                            class="flex items-center gap-3"
                                        >
                                            <img
                                                v-if="
                                                    pergunta.tipo_pergunta ===
                                                    'foto'
                                                "
                                                :src="
                                                    fileLinks[
                                                        pergunta.pergunta_id
                                                    ]
                                                "
                                                class="w-12 h-12 rounded-lg border border-divider object-cover"
                                            />
                                            <a
                                                :href="
                                                    fileLinks[
                                                        pergunta.pergunta_id
                                                    ]
                                                "
                                                target="_blank"
                                                class="text-[10px] font-bold text-primary hover:underline truncate"
                                            >
                                                {{
                                                    fileNames[
                                                        pergunta.pergunta_id
                                                    ] || "Visualizar"
                                                }}
                                            </a>
                                        </div>
                                        <span
                                            v-else
                                            class="text-[10px] text-secondary/50"
                                            >Não anexado</span
                                        >
                                    </template>

                                    <!-- Texto -->
                                    <span
                                        v-else
                                        class="text-xs font-bold text-text"
                                    >
                                        {{
                                            formatarResposta(
                                                dados.respostas?.[
                                                    pergunta.pergunta_id
                                                ],
                                            )
                                        }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
            </div>

            <!-- Footer -->
            <div class="ds-modal-footer">
                <button @click="fechar" class="ds-btn-cancel">Fechar</button>
            </div>
        </div>
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
</style>
