<script setup lang="ts">
defineProps<{
    tabs: string[];
    activeTab: string;
}>();

const emit = defineEmits<{
    (e: "select", tab: string): void;
}>();
</script>

<template>
    <div
        class="flex items-center gap-8 border-b border-secondary/10 w-full md:w-auto pb-1"
    >
        <button
            v-for="tab in tabs"
            :key="tab"
            @click="emit('select', tab)"
            class="text-sm font-bold pb-3 relative transition-colors whitespace-nowrap uppercase tracking-wider"
            :class="
                activeTab === tab
                    ? 'text-primary'
                    : 'text-secondary hover:text-white'
            "
        >
            {{ tab }}
            <span
                v-if="activeTab === tab"
                class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
            ></span>
        </button>
    </div>
</template>
