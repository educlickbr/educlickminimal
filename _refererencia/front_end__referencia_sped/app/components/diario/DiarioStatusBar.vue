<script setup lang="ts">
defineProps<{
    motivo: string;
}>();
</script>

<template>
    <div
        class="rounded-xl p-4 flex items-center gap-4 transition-all bg-red-500/10 border border-red-500/20"
    >
        <div class="p-2 rounded-full bg-red-500/20 text-red-500">
            <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
            </svg>
        </div>
        <div>
            <h3 class="font-bold text-red-500">Sem Aula Prevista</h3>
            <p
                class="text-xs text-secondary font-bold uppercase tracking-wider opacity-80"
            >
                {{ motivo }}
            </p>
        </div>
    </div>
</template>
