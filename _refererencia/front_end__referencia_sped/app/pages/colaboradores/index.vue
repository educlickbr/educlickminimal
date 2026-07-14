<script setup lang="ts">
import ModalStatusColaborador from "~/components/colaboradores/ModalStatusColaborador.vue";
import ModalTrocaPapel from "~/components/colaboradores/ModalTrocaPapel.vue";
import ModalConviteColaborador from "~/components/colaboradores/ModalConviteColaborador.vue";
import ModalDadosCandidato from "~/components/modais_globais/ModalDadosCandidato.vue";
import { useColaboradores } from "~/composables/colaboradores/useColaboradores";

const {
    colaboradores,
    isLoading,
    pagination,
    filters,
    hashBase,
    showStatusModal,
    showConviteModal,
    showDadosModal,
    showTrocaPapelModal,
    modalMode,
    selectedColaborador,
    selectedDadosColaborador,
    fetchColaboradores,
    previousPage,
    nextPage,
    openStatusModal,
    openTrocaPapelModal,
    openDadosModal,
    openPhotoModal,
    handleStatusUpdated,
    handleRoleUpdated,
    handleCandidateUpdate,
} = useColaboradores();

// Debounced Search
let searchTimeout: any;
watch(
    () => filters.value.busca,
    () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const { refreshHash } = useAppStore();
            await refreshHash();
            fetchColaboradores(1);
        }, 500);
    },
);

onMounted(() => {
    fetchColaboradores();
});
</script>

<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-lg p-0 md:p-8 flex-1 w-full"
        >
            <!-- FILTER BAR -->
            <div class="bg-[#16161E] border border-white/5 rounded-lg p-4 mb-6">
                <h4
                    class="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"
                >
                    <svg
                        class="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        ></path>
                    </svg>
                    Filtros de Busca
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div class="md:col-span-9">
                        <input
                            v-model="filters.busca"
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 h-10"
                        />
                    </div>

                    <div class="md:col-span-3">
                        <button
                            @click="showConviteModal = true"
                            class="w-full h-10 bg-primary text-white font-bold uppercase text-[10px] tracking-wider rounded-lg hover:bg-[#b81151] transition-colors flex items-center justify-center gap-2"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                ></path>
                            </svg>
                            Convidar Usuário
                        </button>
                    </div>
                </div>
            </div>

            <!-- CONTENT AREA -->
            <div class="space-y-4">
                <!-- Loading State -->
                <div
                    v-if="isLoading"
                    class="flex flex-col items-center justify-center py-20"
                >
                    <svg
                        class="animate-spin h-8 w-8 text-primary mb-4"
                        xmlns="http://www.w3.org/2000/svg"
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
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <p class="text-sm text-secondary">
                        Carregando colaboradores...
                    </p>
                </div>

                <!-- Empty State -->
                <div
                    v-else-if="colaboradores.length === 0"
                    class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-lg"
                >
                    <div class="text-4xl mb-4 text-secondary/50">
                        <svg
                            class="w-16 h-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            ></path>
                        </svg>
                    </div>
                    <p class="text-white font-medium">
                        Nenhum colaborador encontrado
                    </p>
                    <p class="text-xs text-secondary mt-1">
                        Verifique os filtros.
                    </p>
                </div>

                <!-- List (Card Layout) -->
                <div
                    v-else
                    class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                    <div
                        v-for="colab in colaboradores"
                        :key="colab.id"
                        class="bg-[#16161E] border border-white/5 rounded-lg flex md:overflow-visible overflow-hidden hover:border-primary/30 transition-colors group relative min-h-[120px]"
                    >
                        <!-- Left: Photo -->
                        <div
                            class="w-20 md:w-24 relative flex-shrink-0 bg-white/5 border-r border-white/5 group/photo hover:z-50 flex flex-col justify-center items-center"
                        >
                            <button
                                @click.stop="openPhotoModal(colab)"
                                class="absolute top-1 left-1 z-30 p-1 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all cursor-pointer"
                                title="Alterar Foto"
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
                                        stroke-width="2"
                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    ></path>
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                    ></path>
                                </svg>
                            </button>

                            <div class="relative w-full h-full">
                                <img
                                    v-if="colab.imagem_user && hashBase"
                                    :src="hashBase + colab.imagem_user"
                                    class="absolute inset-0 w-full h-full object-cover transition-all duration-300 z-10 rounded-l-lg"
                                    :class="'group-hover/photo:scale-[1.8] group-hover/photo:translate-x-10 group-hover/photo:translate-y-0 group-hover/photo:shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover/photo:rounded-lg'"
                                    alt="Foto"
                                    @error="
                                        (e: any) =>
                                            (e.target.style.display = 'none')
                                    "
                                />
                                <div
                                    v-else
                                    class="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-secondary bg-black/20 rounded-l-lg"
                                >
                                    <span class="text-2xl mb-1"
                                        >{{ colab.nome?.charAt(0)
                                        }}{{ colab.sobrenome?.charAt(0) }}</span
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- Right: Info -->
                        <div
                            class="flex-1 p-3 flex flex-col justify-between min-w-0 z-10 gap-2 relative"
                        >
                            <div class="absolute top-3 right-3">
                                <button
                                    @click="openStatusModal(colab)"
                                    class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                                    :class="
                                        colab.status
                                            ? 'bg-green-500 text-white border-green-600'
                                            : 'bg-red-500 text-white border-red-600'
                                    "
                                    title="Alterar Status"
                                >
                                    {{ colab.status ? "Ativo" : "Inativo" }}
                                </button>
                            </div>

                            <div class="space-y-1">
                                <div class="pr-16">
                                    <h5
                                        class="text-sm font-bold text-white truncate leading-tight"
                                        :title="
                                            colab.nome + ' ' + colab.sobrenome
                                        "
                                    >
                                        {{ colab.nome }} {{ colab.sobrenome }}
                                    </h5>
                                    <p
                                        class="text-[10px] text-secondary truncate"
                                    >
                                        {{ colab.email }}
                                    </p>
                                </div>

                                <div class="mt-2 text-left">
                                    <p
                                        class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                                    >
                                        Função
                                    </p>
                                    <p
                                        class="text-[10px] text-white font-medium truncate"
                                    >
                                        {{ colab.nome_papel || "---" }}
                                    </p>
                                </div>
                            </div>

                            <div
                                class="mt-3 pt-3 border-t border-white/5 flex gap-2"
                            >
                                <button
                                    @click="openDadosModal(colab)"
                                    class="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 group/btn"
                                    title="Ver Dados"
                                >
                                    <svg
                                        class="w-3.5 h-3.5 text-secondary group-hover/btn:text-primary transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        ></path>
                                    </svg>
                                    Dados
                                </button>

                                <button
                                    @click="openTrocaPapelModal(colab)"
                                    class="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 group/btn"
                                    title="Trocar Papel"
                                >
                                    <svg
                                        class="w-3.5 h-3.5 text-secondary group-hover/btn:text-purple-400 transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                        ></path>
                                    </svg>
                                    Trocar Papel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div
                    v-if="pagination.qtd_paginas > 1"
                    class="flex items-center justify-between border-t border-white/5 pt-4 mt-6"
                >
                    <p class="text-xs text-secondary">
                        Página {{ pagination.pagina_atual }} de
                        {{ pagination.qtd_paginas }} (Total:
                        {{ pagination.qtd_total }})
                    </p>
                    <div class="flex items-center gap-2">
                        <button
                            @click="previousPage"
                            :disabled="pagination.pagina_atual === 1"
                            class="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg
                                class="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15 19l-7-7 7-7"
                                ></path>
                            </svg>
                        </button>
                        <button
                            @click="nextPage"
                            :disabled="
                                pagination.pagina_atual ===
                                pagination.qtd_paginas
                            "
                            class="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg
                                class="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Status Modal -->
            <ModalStatusColaborador
                :isOpen="showStatusModal"
                :colaborador="selectedColaborador"
                @close="showStatusModal = false"
                @confirm="handleStatusUpdated"
            />

            <!-- Dados Modal -->
            <ModalDadosCandidato
                :isOpen="showDadosModal"
                :candidato="selectedDadosColaborador"
                area="colaboradores"
                tipoProcesso="cadastro"
                tipoCandidatura="docente"
                :mode="modalMode"
                :hideTabs="modalMode === 'documentos'"
                @close="showDadosModal = false"
                @update-candidate="handleCandidateUpdate"
            />

            <!-- Troca Papel Modal -->
            <ModalTrocaPapel
                :isOpen="showTrocaPapelModal"
                :colaborador="selectedColaborador"
                @close="showTrocaPapelModal = false"
                @confirm="handleRoleUpdated"
            />

            <!-- Convite Modal -->
            <ModalConviteColaborador
                :isOpen="showConviteModal"
                @close="showConviteModal = false"
                @invite-sent="fetchColaboradores(pagination.pagina_atual)"
            />
        </div>
    </NuxtLayout>
</template>
