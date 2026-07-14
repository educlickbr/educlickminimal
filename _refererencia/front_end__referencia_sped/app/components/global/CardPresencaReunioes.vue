<script setup lang="ts">
import { ref, onMounted } from "vue";
import { $fetch as ofetch } from "ofetch";

interface ReuniaoPresenca {
    id_reuniao: string;
    nome: string;
    data_reuniao: string;
    presenca: string | null;
    observacoes: string | null;
}

interface Props {
    id_matricula: string;
    ano_semestre: string;
}

const props = defineProps<Props>();

const isLoading = ref(false);
const isBolsista = ref(false);
const reunioesData = ref<ReuniaoPresenca[]>([]);

const fetchReunioes = async () => {
    isLoading.value = true;
    try {
        const result: any = await ofetch("/api/aluno/reunioes-presenca", {
            query: {
                id_matricula: props.id_matricula,
                ano_semestre: props.ano_semestre,
            },
        });

        isBolsista.value = result?.is_bolsista || false;
        reunioesData.value = result?.data || [];
    } catch (error) {
        console.error("Erro ao carregar presença em reuniões:", error);
        isBolsista.value = false;
        reunioesData.value = [];
    } finally {
        isLoading.value = false;
    }
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return "--";
    try {
        const cleanDate = dateStr.substring(0, 10);
        const [year, month, day] = cleanDate.split("-");
        return `${day}/${month}/${year}`;
    } catch {
        return "--";
    }
};

const getStatusColor = (presenca: string | null) => {
    if (!presenca) return "bg-white/10 text-white/40";
    if (presenca === "presente") return "bg-green-500/20 text-green-300";
    if (presenca === "falta") return "bg-red-500/20 text-red-300";
    if (presenca === "abonada") return "bg-blue-500/20 text-blue-300";
    if (presenca === "justificada") return "bg-amber-500/20 text-amber-300";
    return "bg-green-500/20 text-green-300";
};

const getStatusLabel = (presenca: string | null) => {
    if (!presenca) return "Não marcado";
    if (presenca === "presente") return "Presente";
    if (presenca === "falta") return "Falta";
    if (presenca === "abonada") return "Abonada";
    if (presenca === "justificada") return "Justificada";
    return "Presente";
};

onMounted(() => {
    fetchReunioes();
});
</script>

<template>
    <div v-if="isBolsista" class="space-y-3">
        <!-- Cabeçalho -->
        <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <svg
                class="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
            </svg>
            Presença em Reuniões Bolsa Oportunidade
        </h4>

        <!-- Loading -->
        <div
            v-if="isLoading"
            class="flex items-center gap-2 py-4 text-secondary text-sm"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
            </svg>
            Carregando...
        </div>

        <!-- Empty State -->
        <div
            v-else-if="reunioesData.length === 0"
            class="text-center py-6 text-secondary text-sm"
        >
            Nenhuma reunião registrada para este semestre.
        </div>

        <!-- Tabela -->
        <div
            v-else
            class="bg-black/20 rounded-lg border border-white/5 overflow-hidden"
        >
            <div class="max-h-60 overflow-y-auto">
                <table class="w-full text-sm">
                    <thead
                        class="sticky top-0 bg-white/5 border-b border-white/5"
                    >
                        <tr>
                            <th
                                class="px-4 py-2 text-left text-xs font-bold text-secondary uppercase"
                            >
                                Data
                            </th>
                            <th
                                class="px-4 py-2 text-left text-xs font-bold text-secondary uppercase"
                            >
                                Reunião
                            </th>
                            <th
                                class="px-4 py-2 text-center text-xs font-bold text-secondary uppercase"
                            >
                                Presença
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        <tr
                            v-for="reuniao in reunioesData"
                            :key="reuniao.id_reuniao"
                            class="hover:bg-white/5 transition-colors"
                        >
                            <td class="px-4 py-2 text-white/60 font-mono">
                                {{ formatDate(reuniao.data_reuniao) }}
                            </td>
                            <td class="px-4 py-2 text-white">
                                {{ reuniao.nome }}
                            </td>
                            <td class="px-4 py-2 text-center">
                                <span
                                    class="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                                    :class="getStatusColor(reuniao.presenca)"
                                >
                                    {{ getStatusLabel(reuniao.presenca) }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
