<script setup lang="ts">
import { ref, computed } from "vue";
import { formatDate } from "~/utils/date";
import { useToast } from "../../../composables/useToast";

const props = defineProps<{
    edital: any;
}>();

const emit = defineEmits<{
    (e: "edit", edital: any): void;
    (e: "add-etapa", edital: any): void;
    (e: "edit-etapa", etapa: any, editalId: string): void;
    (e: "view-inscriptions", edital: any): void;
    (e: "download", item: any): void;
}>();

const isExpanded = ref(false);
const toast = useToast();

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};

const sortedEtapas = computed(() => {
    if (!props.edital.etapas) return [];
    return [...props.edital.etapas].sort(
        (a: any, b: any) => (a.ordem || 0) - (b.ordem || 0),
    );
});

const getEtapaStatus = (etapa: any) => {
    const now = new Date();
    const start = new Date(etapa.data_inicio);
    const end = new Date(etapa.data_fim);

    if (now < start)
        return {
            label: "Em Breve",
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
        };
    if (now > end)
        return {
            label: "Encerrado",
            color: "text-red-400",
            bg: "bg-red-400/10",
        };
    return { label: "Aberto", color: "text-green-400", bg: "bg-green-400/10" };
};

const downloadFile = async (item: any) => {
    if (!item.arquivo_url) {
        toast.showToast("Nenhum arquivo anexado.", { type: "info" });
        return;
    }

    try {
        const data = await ($fetch as any)("/api/refresh-hash-editais");
        const hash_base = data?.hash_base || null;
        if (!hash_base) {
            throw new Error("Falha ao gerar token de acesso.");
        }

        let finalUrl = "";
        const fileName = item.arquivo_url.split("/").pop();

        const queryStartIndex = hash_base.indexOf("?");

        if (queryStartIndex >= 0) {
            const basePath = hash_base.slice(0, queryStartIndex);
            const queryParams = hash_base.slice(queryStartIndex + 1);
            const cleanBase = basePath.endsWith("/")
                ? basePath
                : `${basePath}/`;
            finalUrl = `${cleanBase}${fileName}?${queryParams}`;
        } else {
            const cleanBase = hash_base.endsWith("/")
                ? hash_base
                : `${hash_base}/`;
            finalUrl = `${cleanBase}${fileName}`;
        }

        window.open(finalUrl, "_blank");
    } catch (e: any) {
        console.error(e);
        toast.showToast("Erro ao abrir arquivo.", { type: "error" });
    }
};

const isAgendado = computed(() => {
    return (
        props.edital.is_publicado &&
        props.edital.publicado_em &&
        new Date(props.edital.publicado_em) > new Date()
    );
});
</script>

<template>
    <div
        class="bg-[#16161E] border border-white/5 rounded-lg transition-all hover:border-primary/20 group"
    >
        <!-- Top: Main Info -->
        <div
            class="p-5 md:p-6 flex flex-col md:flex-row gap-4 md:items-start justify-between cursor-pointer relative"
            @click="toggleExpand"
        >
            <div class="flex items-start gap-4 flex-1">
                <!-- File Icon -->
                <button
                    v-if="edital.arquivo_url"
                    @click.stop="downloadFile(edital)"
                    class="mt-1 text-primary hover:text-white transition-all hover:scale-110 shrink-0 opacity-80 group-hover:opacity-100"
                    title="Ver Edital"
                >
                    <svg
                        class="w-8 h-8"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        ></path>
                    </svg>
                </button>

                <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span
                            class="text-[10px] font-black text-secondary/50 uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded bg-white/5"
                            >{{ edital.ano_semestre }}</span
                        >
                        <span
                            v-if="!edital.is_publicado"
                            class="text-[10px] bg-gray-500/20 text-gray-400 px-2 rounded text-xs font-bold uppercase"
                            >Rascunho</span
                        >
                        <span
                            v-if="isAgendado"
                            class="text-[10px] bg-blue-500/20 text-blue-400 px-2 rounded text-xs font-bold uppercase"
                            >Agendado</span
                        >
                    </div>
                    <h3
                        class="text-base md:text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug"
                    >
                        {{ edital.titulo }}
                    </h3>
                    <p
                        class="text-xs md:text-sm text-secondary line-clamp-2 max-w-2xl"
                    >
                        {{ edital.descricao }}
                    </p>
                </div>
            </div>

            <div
                class="flex items-center gap-4 md:gap-6 shrink-0 justify-end md:justify-start w-full md:w-auto mt-2 md:mt-0"
            >
                <div class="text-right hidden md:block">
                    <div
                        class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-0.5 opacity-50"
                    >
                        Período
                    </div>
                    <div class="text-xs text-white font-medium">
                        <span v-if="edital.exibir_periodo"
                            >{{ formatDate(edital.data_inicio) }}
                            -
                            {{ formatDate(edital.data_fim) }}</span
                        >
                        <span v-else class="text-secondary/50 italic"
                            >Oculto</span
                        >
                    </div>
                </div>

                <div class="flex items-center gap-2" @click.stop>
                    <button
                        @click="emit('view-inscriptions', edital)"
                        class="p-2 hover:bg-white/5 rounded-md text-secondary hover:text-white transition-colors border border-transparent hover:border-white/5"
                        title="Ver Inscrições"
                    >
                        <svg
                            class="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                            ></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </button>

                    <button
                        @click="emit('edit', edital)"
                        class="p-2 hover:bg-white/5 rounded-md text-secondary hover:text-primary transition-colors border border-transparent hover:border-white/5"
                        title="Editar Edital"
                    >
                        <svg
                            class="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                            ></path>
                            <path
                                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                            ></path>
                        </svg>
                    </button>
                    <div class="w-px h-6 bg-white/5 mx-1"></div>
                    <button
                        class="p-2 text-secondary transition-transform duration-300 hover:text-white"
                        :class="isExpanded ? 'rotate-180' : ''"
                        @click="toggleExpand"
                    >
                        <svg
                            class="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Bottom: Etapas (Expanded) -->
        <div
            v-show="isExpanded"
            class="border-t border-white/5 bg-black/20 p-5 animate-in slide-in-from-top-2 duration-200"
        >
            <div class="flex items-center justify-between mb-4">
                <h4
                    class="text-sm font-bold text-white flex items-center gap-2"
                >
                    <svg
                        class="w-4 h-4 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        ></path>
                    </svg>
                    Etapas do Processo
                </h4>
                <button
                    @click.stop="emit('add-etapa', edital)"
                    class="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                    <svg
                        class="w-3 h-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Nova Etapa
                </button>
            </div>

            <div class="space-y-2">
                <div
                    v-for="etapa in sortedEtapas"
                    :key="etapa.id"
                    class="flex items-center justify-between bg-[#1f2029] p-3 rounded-lg border border-white/5 hover:border-white/10 group/item transition-colors"
                >
                    <div class="flex items-center gap-3">
                        <div class="flex flex-col items-center gap-2">
                            <div
                                class="w-6 h-6 rounded-full bg-white/5 text-secondary text-xs font-bold flex items-center justify-center border border-white/5"
                            >
                                {{ etapa.ordem }}
                            </div>
                            <button
                                v-if="etapa.arquivo_url"
                                @click.stop="downloadFile(etapa)"
                                class="text-primary hover:text-primary-hover transition-transform hover:scale-110"
                                title="Baixar Arquivo"
                            >
                                <svg
                                    class="w-4 h-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    ></path>
                                </svg>
                            </button>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h5 class="text-sm font-bold text-white">
                                    {{ etapa.titulo }}
                                </h5>
                                <span
                                    v-if="!etapa.is_publicado"
                                    class="text-[9px] bg-gray-500/20 text-gray-400 px-1 rounded uppercase"
                                    >Rascunho</span
                                >
                            </div>
                            <p class="text-[10px] text-secondary">
                                <span v-if="etapa.exibir_periodo"
                                    >{{ formatDate(etapa.data_inicio) }}
                                    -
                                    {{ formatDate(etapa.data_fim) }}</span
                                >
                                <span v-else class="italic opacity-50"
                                    >Período não exibido</span
                                >
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <span
                            class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                            :class="
                                getEtapaStatus(etapa).bg +
                                ' ' +
                                getEtapaStatus(etapa).color
                            "
                        >
                            {{ getEtapaStatus(etapa).label }}
                        </span>

                        <button
                            @click.stop="emit('edit-etapa', etapa, edital.id)"
                            class="text-secondary hover:text-white p-1 rounded hover:bg-white/5 opacity-0 group-hover/item:opacity-100 transition-all"
                        >
                            <svg
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div
                    v-if="sortedEtapas.length === 0"
                    class="text-center py-4 text-xs text-secondary/40 italic"
                >
                    Nenhuma etapa cadastrada.
                </div>
            </div>
        </div>
    </div>
</template>
