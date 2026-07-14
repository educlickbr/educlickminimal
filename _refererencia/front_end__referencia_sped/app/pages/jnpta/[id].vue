<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

definePageMeta({
    layout: false,
});

const { showToast } = useToast();
const route = useRoute();
const router = useRouter();

const grupoId = route.params.id as string;

const grupo = ref<any>(null);
const integrantes = ref<any[]>([]);
const isLoadingGrupo = ref(true);
const isLoadingIntegrantes = ref(true);

const showAddIntegrante = ref(false);
const newIntegrante = ref({
    id_user: "",
    funcao: "",
    ordem: 1,
});

const fetchGrupo = async () => {
    isLoadingGrupo.value = true;
    try {
        const data: any = await ofetch(`/api/jnpta/grupos/${grupoId}`);
        if (data?.ok) {
            grupo.value = data.grupo;
        }
    } catch (e: any) {
        console.error("Error loading grupo:", e);
        showToast("Erro ao carregar grupo", { type: "error" });
        router.push("/jnpta");
    } finally {
        isLoadingGrupo.value = false;
    }
};

const fetchIntegrantes = async () => {
    isLoadingIntegrantes.value = true;
    try {
        const data: any = await ofetch("/api/jnpta/integrantes", {
            params: { id_grupo: grupoId },
        });
        integrantes.value = data?.integrantes || [];
    } catch (e: any) {
        console.error("Error loading integrantes:", e);
        showToast("Erro ao carregar integrantes", { type: "error" });
    } finally {
        isLoadingIntegrantes.value = false;
    }
};

const handleAddIntegrante = async () => {
    if (!newIntegrante.value.funcao) {
        showToast("Preencha a função do integrante", { type: "error" });
        return;
    }
    showToast("No MVP, a seleção de integrantes será implementada em breve", {
        type: "info",
        duration: 4000,
    });
    showAddIntegrante.value = false;
};

const handleRemoveIntegrante = async (integranteId: string) => {
    if (!confirm("Tem certeza que deseja remover este integrante?")) return;
    try {
        const result: any = await ofetch(
            `/api/jnpta/integrantes/${integranteId}`,
            { method: "DELETE" },
        );
        if (result && result.ok) {
            showToast("Integrante removido com sucesso!", {
                type: "success",
            });
            fetchIntegrantes();
        }
    } catch (err: any) {
        console.error("Error removing integrante:", err);
        showToast("Erro ao remover integrante", { type: "error" });
    }
};

const handleCreateCandidatura = async () => {
    try {
        const result: any = await ofetch("/api/jnpta/candidatura", {
            method: "POST",
            body: { id_grupo: grupoId },
        });
        if (result && result.ok) {
            if (result.acao === "existente") {
                showToast(result.mensagem, { type: "info", duration: 4000 });
            } else {
                showToast("Candidatura criada com sucesso!", {
                    type: "success",
                });
            }
        }
    } catch (err: any) {
        console.error("Error creating candidatura:", err);
        showToast("Erro ao criar candidatura", { type: "error" });
    }
};

onMounted(() => {
    fetchGrupo();
    fetchIntegrantes();
});
</script>

<template>
    <NuxtLayout name="base">
        <div class="flex flex-col gap-8 pb-10">
            <div
                class="bg-div-15 rounded-lg p-4 md:p-8 border border-secondary/10 shadow-sm relative overflow-hidden"
            >
                <div
                    class="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"
                ></div>

                <div v-if="!isLoadingGrupo && grupo" class="relative z-10">
                    <div class="mb-1.5 md:mb-2">
                        <span
                            class="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded"
                        >
                            JNPTA - Jornadas
                        </span>
                    </div>
                    <h1
                        class="text-xl md:text-3xl font-black text-text mb-2 leading-tight"
                    >
                        {{ grupo.nome_grupo }}
                    </h1>

                    <div
                        class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm font-bold text-secondary"
                    >
                        <div
                            v-if="grupo.cidade"
                            class="flex items-center gap-2"
                        >
                            <svg
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                                ></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {{ grupo.cidade }}
                        </div>
                        <div
                            v-if="grupo.email_contato"
                            class="flex items-center gap-2"
                        >
                            <svg
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                                ></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            {{ grupo.email_contato }}
                        </div>
                    </div>
                </div>

                <div v-else class="relative z-10 animate-pulse">
                    <div class="h-4 w-20 bg-primary/10 rounded mb-4"></div>
                    <div class="h-10 w-3/4 bg-div-30 rounded mb-6"></div>
                    <div class="h-4 w-1/3 bg-div-30 rounded"></div>
                </div>
            </div>

            <div
                class="bg-div-15 rounded-lg p-6 md:p-8 border border-secondary/10"
            >
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-black text-text">Integrantes</h2>
                    <button
                        @click="showAddIntegrante = true"
                        class="bg-primary text-white font-bold py-2 px-4 rounded-md text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <svg
                            class="w-4 h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Adicionar
                    </button>
                </div>

                <div v-if="isLoadingIntegrantes" class="space-y-3">
                    <div
                        v-for="i in 3"
                        :key="i"
                        class="bg-div-30 rounded-lg p-4 animate-pulse"
                    >
                        <div class="h-5 w-1/3 bg-div-15 rounded mb-2"></div>
                        <div class="h-4 w-1/2 bg-div-15 rounded"></div>
                    </div>
                </div>

                <div
                    v-else-if="integrantes.length === 0"
                    class="text-center py-12"
                >
                    <div
                        class="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-4"
                    >
                        <svg
                            class="w-6 h-6"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path
                                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                            ></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <p class="text-sm text-secondary">
                        Nenhum integrante adicionado ainda
                    </p>
                </div>

                <div v-else class="space-y-3">
                    <div
                        v-for="integrante in integrantes"
                        :key="integrante.id"
                        class="bg-background rounded-lg p-4 border border-secondary/10 flex items-center justify-between hover:border-primary/20 transition-all"
                    >
                        <div class="flex-1">
                            <h3 class="text-sm font-bold text-text">
                                {{ integrante.nome }}
                                {{ integrante.sobrenome }}
                            </h3>
                            <p class="text-xs text-secondary mt-1">
                                {{ integrante.funcao }}
                            </p>
                            <p
                                v-if="integrante.email"
                                class="text-xs text-secondary/60 mt-0.5"
                            >
                                {{ integrante.email }}
                            </p>
                        </div>
                        <button
                            @click="handleRemoveIntegrante(integrante.id)"
                            class="text-danger hover:bg-danger/10 p-2 rounded-md transition-all"
                            title="Remover integrante"
                        >
                            <svg
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path
                                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex gap-4">
                <button
                    @click="router.push('/jnpta')"
                    class="bg-background border border-secondary/10 text-secondary font-bold py-3 px-6 rounded-md text-xs uppercase tracking-wider hover:bg-div-15 transition-all"
                >
                    Voltar
                </button>
                <button
                    v-if="grupo?.is_owner"
                    @click="handleCreateCandidatura"
                    class="bg-primary text-white font-bold py-3 px-8 rounded-md text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
                >
                    Criar Candidatura
                </button>
            </div>
        </div>

        <Teleport to="body">
            <div
                v-if="showAddIntegrante"
                class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                @click.self="showAddIntegrante = false"
            >
                <div
                    class="bg-div-15 rounded-lg p-6 max-w-md w-full border border-secondary/10"
                >
                    <h3 class="text-lg font-black text-text mb-4">
                        Adicionar Integrante
                    </h3>
                    <p class="text-xs text-secondary mb-4">
                        No MVP, este recurso está em desenvolvimento. Em breve
                        você poderá buscar e adicionar integrantes.
                    </p>
                    <div class="flex gap-3 justify-end">
                        <button
                            @click="showAddIntegrante = false"
                            class="bg-background border border-secondary/10 text-secondary font-bold py-2 px-4 rounded-md text-xs uppercase hover:bg-div-30 transition-all"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </NuxtLayout>
</template>
