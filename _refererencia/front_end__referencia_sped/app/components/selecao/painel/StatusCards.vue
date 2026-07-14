<script setup lang="ts">
defineProps<{
    statusCounts: Record<string, number>;
}>();

const colorMap: Record<string, string> = {
    Aguardando: "text-yellow-400",
    Matriculado: "text-green-400",
    Aprovado: "text-blue-400",
    Recusado: "text-red-400",
    Suplente: "text-orange-400",
};

const getColor = (status: string) => colorMap[status] || "text-white";
const getLabel = (status: string) => status || "Aguardando";
</script>

<template>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div
            v-for="(count, status) in statusCounts"
            :key="status"
            class="bg-[#16161E] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]"
        >
            <span
                class="text-3xl font-black mb-1"
                :class="getColor(String(status))"
            >
                {{ count }}
            </span>
            <span
                class="text-[10px] uppercase font-bold text-secondary tracking-wider"
            >
                {{ getLabel(String(status)) }}
            </span>
        </div>
    </div>
</template>
