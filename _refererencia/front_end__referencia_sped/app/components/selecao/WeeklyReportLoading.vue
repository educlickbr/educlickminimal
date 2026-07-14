<script setup lang="ts">
defineProps<{
    isOpen: boolean;
}>();
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
        <div
            class="bg-[#16161E] border border-white/10 rounded-xl px-6 py-5 flex items-center gap-4 shadow-xl"
        >
            <div
                class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"
            ></div>
            <div>
                <p class="text-white text-sm font-semibold">
                    Gerando relatório semanal
                </p>
                <p class="text-secondary-400 text-xs mt-1">
                    Preparando semanas, turmas e totais para impressão em
                    PDF...
                </p>
            </div>
        </div>
    </div>
</template>
