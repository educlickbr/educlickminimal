<template>
    <div class="flex items-center gap-1">
        <button
            class="visao-btn"
            :class="{ 'visao-btn--on': ctx.visaoCentral.value === 'menu' }"
            @click="ctx.visaoCentral.value = 'menu'"
            title="Ver como árvore por escopo"
        >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"></path><path d="M3 6h.01M3 12h.01M3 18h.01"></path></svg>
            Menu
        </button>
        <button
            class="visao-btn"
            :class="{ 'visao-btn--on': ctx.visaoCentral.value === 'resumo' }"
            @click="ctx.visaoCentral.value = 'resumo'"
            title="Ver como lista de conteúdos"
        >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
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
.visao-btn { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.4); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.visao-btn:hover { color: #c4b5fd; border-color: rgba(139,92,246,0.35); background: rgba(139,92,246,0.05); }
.visao-btn--on { background: rgba(139,92,246,0.12); color: #c4b5fd; border-color: rgba(139,92,246,0.25); }
.visao-btn--on svg { color: #c4b5fd; }
</style>
