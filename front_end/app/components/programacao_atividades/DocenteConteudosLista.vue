<template>
    <div class="flex flex-col flex-1 min-h-0">
        <!-- Barra de filtros -->
        <div class="px-3 py-2.5 border-b border-divider bg-div-15 flex flex-col gap-2 shrink-0">
            <div class="flex items-center justify-between gap-2">
                <span class="flex items-center gap-1.5 text-[9px] font-black text-secondary/60 uppercase tracking-widest">
                    <Icon name="ph:file-text-duotone" class="w-3.5 h-3.5 text-primary shrink-0" />
                    Conteúdos com entregas
                </span>
                <span class="text-[9px] font-black text-secondary/60 bg-div-30 px-2 py-0.5 rounded-full border border-divider">{{ ctx.conteudosExibidos.value.length }}</span>
            </div>
            <div class="relative">
                <Icon name="ph:magnifying-glass-light" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/40 pointer-events-none" />
                <input v-model="ctx.busca.value" type="text" placeholder="Buscar conteúdo..." class="busca-input" />
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
                <button class="pill" :class="{ 'pill--on': !ctx.filtroTipo.value }" @click="ctx.filtroTipo.value = null">Todos</button>
                <button class="pill" :class="{ 'pill--on': ctx.filtroTipo.value === 'atividade' }" @click="ctx.filtroTipo.value = ctx.filtroTipo.value === 'atividade' ? null : 'atividade'">Atividades</button>
                <button class="pill" :class="{ 'pill--on': ctx.filtroTipo.value === 'avaliacao' }" @click="ctx.filtroTipo.value = ctx.filtroTipo.value === 'avaliacao' ? null : 'avaliacao'">Avaliações</button>
                <label class="check-label ml-auto">
                    <input v-model="ctx.soPendentes.value" type="checkbox" class="accent-primary" /> Só pendentes
                </label>
            </div>
        </div>

        <!-- Lista -->
        <div class="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1">
            <div v-if="ctx.loadingConteudos.value" class="flex flex-col items-center justify-center py-16 gap-3">
                <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                <span class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Carregando...</span>
            </div>
            <div v-else-if="ctx.conteudosExibidos.value.length === 0" class="flex flex-col items-center justify-center py-16 gap-2">
                <Icon name="ph:file-dashed-duotone" class="w-7 h-7 text-secondary/40" />
                <p class="text-[11px] font-bold text-secondary/60">Nenhum conteúdo com entregas</p>
                <p class="text-[9px] font-bold text-secondary/40 uppercase tracking-widest">Ajuste os filtros ou aguarde entregas</p>
            </div>
            <template v-else>
                <button
                    v-for="c in ctx.conteudosExibidos.value"
                    :key="c.id_conteudo"
                    class="doc-row"
                    :class="{ 'doc-row--ativa': ctx.conteudoSelecionado.value?.id_conteudo === c.id_conteudo }"
                    @click="ctx.selecionarConteudo(c)"
                >
                    <span class="tipo" :class="'tipo--' + c.tipo">{{ c.tipo === 'atividade' ? 'Atv' : 'Ava' }}</span>
                    <span class="doc-titulo">{{ c.titulo }}</span>
                    <span v-if="!c.eh_meu" class="badge-leitura" title="Somente leitura — conteúdo de programa que você leciona">🔒</span>
                    <span class="badge-pend" :class="{ 'badge-pend--zero': c.qtd_pendentes === 0 }"
                        :title="c.qtd_pendentes + ' pendente(s) de ' + c.qtd_total">{{ c.qtd_pendentes }}/{{ c.qtd_total }}</span>
                </button>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDocenteEntregas } from "~/composables/programacao_atividades/useDocenteEntregas";

defineProps<{
    ctx: ReturnType<typeof useDocenteEntregas>;
}>();
</script>

<style scoped>
.busca-input { width: 100%; padding: 7px 10px 7px 30px; border-radius: 8px; border: 1px solid var(--field-border); background: var(--field-bg); color: var(--field-text); font-size: 11px; font-weight: 600; outline: none; transition: all 0.15s; }
.busca-input:focus { border-color: rgba(139,92,246,0.35); }
.busca-input::placeholder { color: var(--color-secondary); opacity: 0.4; }

.pill { padding: 4px 10px; border-radius: 7px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; }
.pill:hover { color: var(--color-text); background: var(--color-secondary-surface-hover); }
.pill--on { border-color: rgba(139,92,246,0.45); background: rgba(139,92,246,0.1); color: var(--color-primary); }

.check-label { display: inline-flex; align-items: center; gap: 5px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-secondary); opacity: 0.6; cursor: pointer; white-space: nowrap; }

.doc-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); cursor: pointer; transition: all 0.15s; text-align: left; }
.doc-row:hover { background: var(--color-secondary-surface-hover); border-color: rgba(139,92,246,0.2); }
.doc-row--ativa { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.3); }

.tipo { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
.tipo--atividade { background: rgba(245,158,11,0.14); color: #f59e0b; }
.tipo--avaliacao { background: rgba(139,92,246,0.16); color: var(--color-primary); }

.doc-titulo { font-size: 11px; font-weight: 700; color: var(--color-text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.badge-pend { font-size: 8px; font-weight: 800; padding: 2px 7px; border-radius: 6px; flex-shrink: 0; background: rgba(245,158,11,0.12); color: #f59e0b; }
.badge-pend--zero { background: rgba(16,185,129,0.1); color: #10b981; }
.badge-leitura { font-size: 9px; flex-shrink: 0; opacity: 0.8; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 4px; }
</style>
