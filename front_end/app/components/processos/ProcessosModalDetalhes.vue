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
    <div v-if="modelValue" class="modal-overlay" @click.self="fechar">
        <div class="modal-panel">
            <div class="modal-accent-bar" />

            <!-- Header -->
            <div class="modal-header">
                <div class="modal-header-icon">
                    <Icon name="ph:identification-card-bold" class="w-5 h-5" />
                </div>
                <div class="modal-header-text flex-1">
                    <h3 class="modal-title">Detalhes da Inscrição</h3>
                    <p class="modal-subtitle">
                        <template v-if="dados">
                            {{ dados.inscricao?.usuario?.nome_completo || "—" }}
                            ·
                            {{ dados.processo?.programa_nome || "—" }}
                        </template>
                        <template v-else>Carregando...</template>
                    </p>
                </div>
                <button @click="fechar" class="modal-close-btn">&times;</button>
            </div>

            <!-- Body -->
            <div class="modal-body">
                <!-- Loading -->
                <div
                    v-if="loading"
                    class="py-12 flex flex-col items-center gap-3"
                >
                    <div
                        class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
                    />
                    <span
                        class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
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
                        class="w-10 h-10 text-secondary/20 mb-3 mx-auto"
                    />
                    <p class="text-xs text-secondary/40">
                        Nenhum formulário configurado para este processo.
                    </p>
                </div>

                <!-- Conteúdo com abas -->
                <template v-else>
                    <!-- Tabs dos blocos -->
                    <div
                        v-if="dados.blocos.length > 1"
                        class="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide"
                    >
                        <button
                            v-for="(bloco, i) in dados.blocos"
                            :key="i"
                            @click="activeTab = i"
                            class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0"
                            :class="
                                activeTab === i
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-white/[0.02] text-secondary/40 border border-white/5 hover:text-white hover:border-white/10'
                            "
                        >
                            {{ bloco.bloco }}
                        </button>
                    </div>

                    <!-- Perguntas da aba ativa -->
                    <template v-for="(bloco, i) in dados.blocos" :key="i">
                        <div v-show="activeTab === i">
                            <h4
                                class="text-xs font-black uppercase tracking-widest text-primary/80 mb-4 pb-2 border-b border-white/5"
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
                                        class="text-[9px] font-black text-secondary/40 uppercase tracking-widest"
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
                                                class="w-12 h-12 rounded-lg border border-white/10 object-cover"
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
                                            class="text-[10px] text-secondary/40"
                                            >Não anexado</span
                                        >
                                    </template>

                                    <!-- Texto -->
                                    <span
                                        v-else
                                        class="text-[10px] font-bold text-white/80"
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
            <div class="modal-footer">
                <button @click="fechar" class="modal-btn-cancel">Fechar</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    padding: 16px;
    animation: fadeIn 0.15s ease;
}
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.modal-panel {
    position: relative;
    background: #13131a;
    border: 1px solid rgba(139, 92, 246, 0.18);
    border-radius: 16px;
    width: 100%;
    max-width: 720px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
        0 24px 80px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(139, 92, 246, 0.1);
    animation: slideUp 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
}
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-accent-bar {
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
    flex-shrink: 0;
}

.modal-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
}

.modal-header-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(139, 92, 246, 0.12);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.modal-title {
    font-size: 14px;
    font-weight: 900;
    color: #c4b5fd;
    text-transform: uppercase;
    letter-spacing: 0.15em;
}

.modal-subtitle {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2px;
}

.modal-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.4);
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
}
.modal-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
}

.modal-btn-cancel {
    padding: 10px 22px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.45);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s ease;
}
.modal-btn-cancel:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
