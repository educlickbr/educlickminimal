<script setup lang="ts">
const props = defineProps<{
    reservas: any[];
    isLoading: boolean;
    pagination: {
        pagina_atual: number;
        qtd_paginas: number;
        qtd_itens: number;
    };
    expandedReservas: Set<string>;
    expandedItems: Record<string, any[]>;
    loadingDetails: Record<string, boolean>;
}>();

const busca = defineModel<string>("busca", { default: "" });

const emit = defineEmits<{
    (e: "statusUpdate", reserva: any, newStatus: string): void;
    (e: "delete", reserva: any): void;
    (e: "toggleExpand", reserva: any): void;
    (e: "pageChange", page: number): void;
}>();

const isExpanded = (reserva: any) => {
    return props.expandedReservas.has(reserva.ids[0]);
};
</script>

<template>
    <div>
        <!-- Search -->
        <div class="mb-6">
            <div class="relative">
                <input
                    v-model="busca"
                    type="text"
                    placeholder="Buscar reservas por nome do usuário..."
                    class="w-full bg-[#16161E] border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 transition-colors"
                />
                <div class="absolute left-4 top-3.5 text-secondary/50">
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div
            v-if="isLoading && reservas.length === 0"
            class="py-20 flex justify-center"
        >
            <svg
                class="animate-spin h-8 w-8 text-primary"
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
        </div>

        <!-- Empty -->
        <div
            v-else-if="reservas.length === 0"
            class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
        >
            <div class="text-4xl mb-4 text-secondary/50">
                <svg
                    class="w-16 h-16"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                </svg>
            </div>
            <p class="text-white font-medium">Nenhuma reserva encontrada</p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 gap-4">
            <div
                v-for="reserva in reservas"
                :key="reserva.ids[0]"
                class="bg-[#16161E] border border-white/5 rounded-xl p-5 flex flex-col relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
                <div
                    class="flex items-center justify-between mb-3 border-b border-white/5 pb-2"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs"
                        >
                            {{ reserva.nome_usuario.charAt(0).toUpperCase() }}
                        </div>
                        <h4 class="font-bold text-white text-sm">
                            {{ reserva.nome_usuario }}
                        </h4>
                    </div>
                    <div
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                        :class="{
                            'bg-amber-500/10 text-amber-500 border-amber-500/20':
                                reserva.status === 'reservado',
                            'bg-blue-500/10 text-blue-500 border-blue-500/20':
                                reserva.status === 'retirado',
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20':
                                reserva.status === 'devolvido',
                            'bg-red-500/10 text-red-500 border-red-500/20': [
                                'atrasado',
                                'cancelado',
                            ].includes(reserva.status),
                        }"
                    >
                        {{ reserva.status }}
                    </div>
                </div>

                <div class="flex items-center gap-3 mb-3">
                    <h3 class="text-base font-bold text-white leading-tight">
                        {{ reserva.produto_nome }}
                    </h3>
                    <div
                        class="bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5 text-xs font-bold flex items-center gap-1"
                    >
                        <span>{{ reserva.qtd_itens }}</span>
                        <span class="text-[8px] uppercase opacity-70"
                            >unid</span
                        >
                    </div>
                </div>

                <div
                    class="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3 bg-white/5 p-2 rounded text-[10px]"
                >
                    <div>
                        <span class="text-secondary block font-bold"
                            >Reservado</span
                        >
                        <span class="text-white">{{
                            new Date(reserva.data_reserva).toLocaleString()
                        }}</span>
                    </div>
                    <div v-if="reserva.data_retirada">
                        <span class="text-secondary block font-bold"
                            >Retirado</span
                        >
                        <span class="text-white">{{
                            new Date(reserva.data_retirada).toLocaleString()
                        }}</span>
                    </div>
                    <div>
                        <span class="text-secondary block font-bold"
                            >Prev. Devolução</span
                        >
                        <span class="text-white">{{
                            reserva.data_devolucao
                                ? new Date(
                                      reserva.data_devolucao,
                                  ).toLocaleDateString()
                                : "-"
                        }}</span>
                    </div>
                    <div v-if="reserva.data_devolvido">
                        <span class="text-secondary block font-bold"
                            >Devolvido</span
                        >
                        <span class="text-white">{{
                            new Date(reserva.data_devolvido).toLocaleString()
                        }}</span>
                    </div>
                </div>

                <div
                    class="flex items-center justify-between gap-3 pt-2 border-t border-white/5"
                >
                    <button
                        @click="emit('toggleExpand', reserva)"
                        class="text-xs text-secondary hover:text-white transition-colors flex items-center gap-1 font-medium"
                    >
                        <span v-if="isExpanded(reserva)">Ocultar Itens</span>
                        <span v-else>Ver Itens ({{ reserva.qtd_itens }})</span>
                        <svg
                            class="w-3 h-3 transition-transform duration-200"
                            :class="isExpanded(reserva) ? 'rotate-180' : ''"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </button>

                    <div class="flex items-center gap-2">
                        <button
                            v-if="reserva.status === 'reservado'"
                            @click="emit('statusUpdate', reserva, 'retirado')"
                            class="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-[10px] font-bold uppercase transition-colors"
                        >
                            Retirar
                        </button>
                        <button
                            v-if="reserva.status === 'retirado'"
                            @click="emit('statusUpdate', reserva, 'devolvido')"
                            class="bg-emerald-500 hover:bg-emerald-600 text-white rounded px-3 py-1 text-[10px] font-bold uppercase transition-colors"
                        >
                            Devolver
                        </button>
                        <button
                            @click="emit('delete', reserva)"
                            class="text-secondary hover:text-danger p-1 transition-colors"
                            title="Excluir"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Expanded Items -->
                <div
                    v-if="isExpanded(reserva)"
                    class="mt-3 pt-3 border-t border-white/5 bg-black/20 -mx-5 -mb-5 px-5 pb-4"
                >
                    <div
                        v-if="loadingDetails[reserva.ids[0]]"
                        class="flex justify-center py-2"
                    >
                        <svg
                            class="animate-spin h-4 w-4 text-primary"
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
                    </div>
                    <div v-else class="flex flex-col gap-1">
                        <div
                            v-for="item in expandedItems[reserva.ids[0]] || []"
                            :key="item.id"
                            class="flex items-center justify-between text-[10px] bg-white/5 px-2 py-1.5 rounded font-mono hover:bg-white/10 transition-colors"
                        >
                            <span class="text-white"
                                >ID: {{ item.id.split("-")[0] }}...</span
                            >
                            <span class="text-primary">{{
                                item.codigo_barras || "S/N"
                            }}</span>
                            <span class="text-secondary">{{
                                item.status_item || "Indefinido"
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div
            v-if="reservas.length > 0"
            class="flex flex-col md:flex-row items-center justify-between gap-3 mt-8 pt-4 border-t border-white/5"
        >
            <span
                class="text-xs md:text-sm text-secondary-500 order-2 md:order-1"
            >
                <span class="font-medium text-white">{{
                    (pagination.pagina_atual - 1) * 12 + 1
                }}</span>
                a
                <span class="font-medium text-white">{{
                    Math.min(pagination.pagina_atual * 12, pagination.qtd_itens)
                }}</span>
                de
                <span class="font-medium text-white">{{
                    pagination.qtd_itens
                }}</span>
            </span>
            <div class="flex gap-2 order-1 md:order-2">
                <button
                    @click="emit('pageChange', pagination.pagina_atual - 1)"
                    :disabled="pagination.pagina_atual === 1"
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Anterior
                </button>
                <button
                    @click="emit('pageChange', pagination.pagina_atual + 1)"
                    :disabled="
                        pagination.pagina_atual >= pagination.qtd_paginas
                    "
                    class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Próxima
                </button>
            </div>
        </div>
    </div>
</template>
