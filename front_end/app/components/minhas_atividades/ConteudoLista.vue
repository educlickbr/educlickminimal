<template>
    <div class="flex flex-col gap-3">
        <!-- Seções agrupadas -->
        <div v-for="sec in secoes" :key="sec.chave" class="flex flex-col gap-1">
            <div class="secao-header">
                <Icon name="ph:folder-open-bold" class="w-3 h-3 text-secondary/60" />
                <span class="secao-nome">{{ sec.nome }}</span>
                <span class="secao-count">{{ sec.itens.length }}</span>
            </div>
            <ConteudoLinha
                v-for="c in sec.itens"
                :key="sec.chave + '_' + c.id_conteudo"
                :item="c"
                :ativo="ativoId === c.id_conteudo"
                @select="emit('abrir', c)"
            />
        </div>

        <!-- Vazio -->
        <div v-if="secoes.length === 0" class="flex flex-col items-center justify-center gap-2 py-16 empty-state">
            <p class="text-sm font-bold text-text/80">Nenhum conteúdo encontrado</p>
            <p class="text-[10px] font-black text-secondary/60 uppercase tracking-widest mt-1">Ajuste os filtros ou aguarde o carregamento</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import ConteudoLinha from "~/components/minhas_atividades/ConteudoLinha.vue";

defineProps<{
    secoes: { chave: string; nome: string; itens: any[] }[];
    ativoId: string | null;
}>();

const emit = defineEmits<{
    abrir: [item: any];
}>();
</script>

<style scoped>
.secao-header { display: flex; align-items: center; gap: 6px; padding: 6px 10px 4px; color: var(--color-secondary); }
.secao-nome { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-secondary); }
.secao-count { font-size: 8px; font-weight: 800; color: var(--color-secondary); background: var(--color-secondary-surface-hover); padding: 1px 6px; border-radius: 5px; }
.empty-state { padding: 3rem 1.5rem; }
</style>
