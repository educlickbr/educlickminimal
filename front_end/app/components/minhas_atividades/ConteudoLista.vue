<template>
    <div class="flex flex-col gap-3">
        <!-- Seções agrupadas -->
        <div v-for="sec in secoes" :key="sec.chave" class="flex flex-col gap-1">
            <div class="secao-header">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
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
            <p class="text-sm font-bold text-white/30">Nenhum conteúdo encontrado</p>
            <p class="text-[10px] font-bold text-white/15 uppercase tracking-widest mt-1">Ajuste os filtros ou aguarde o carregamento</p>
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
.secao-header { display: flex; align-items: center; gap: 6px; padding: 6px 10px 4px; color: rgba(255,255,255,0.3); }
.secao-nome { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
.secao-count { font-size: 8px; font-weight: 800; color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); padding: 1px 6px; border-radius: 5px; }
.empty-state { padding: 3rem 1.5rem; }
</style>
