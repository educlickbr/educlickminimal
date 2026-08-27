<template>
    <div class="flex items-center gap-1">
        <button
            class="visao-btn"
            :class="{ 'visao-btn--on': ctx.visaoCentral.value === 'menu' }"
            @click="ctx.visaoCentral.value = 'menu'"
            title="Ver como árvore por escopo"
        >
            <Icon name="ph:tree-structure-bold" class="w-3 h-3" />
            Menu
        </button>
        <button
            class="visao-btn"
            :class="{ 'visao-btn--on': ctx.visaoCentral.value === 'resumo' }"
            @click="ctx.visaoCentral.value = 'resumo'"
            title="Ver como lista de conteúdos"
        >
            <Icon name="ph:squares-four-bold" class="w-3 h-3" />
            Resumo
        </button>
    </div>
</template>

<script setup lang="ts">
import { useMinhasAtividades } from "~/composables/programacao_atividades/useMinhasAtividades";

defineProps<{
    ctx: ReturnType<typeof useMinhasAtividades>;
}>();
</script>

<style scoped>
.visao-btn {
    display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
    border-radius: 6px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface);
    color: var(--color-secondary); font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.visao-btn:hover { color: var(--color-primary); border-color: rgba(139,92,246,0.35); background: var(--color-secondary-surface-hover); }
.visao-btn--on { background: rgba(139,92,246,0.12); color: var(--color-primary); border-color: rgba(139,92,246,0.25); }
</style>
