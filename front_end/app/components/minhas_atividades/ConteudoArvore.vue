<template>
    <div class="flex flex-col bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
        <div class="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
            <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Conteúdos</span>
            <slot name="header-right" />
        </div>

        <div v-if="ctx.loadingEstrutura.value" class="flex-1 flex flex-col items-center justify-center gap-3">
            <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">Carregando...</span>
        </div>

        <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">

            <!-- Programa -->
            <div class="flex flex-col">
                <button @click="ctx.toggleSection('programa')" class="accordion-trigger">
                    <svg :class="{ 'rotated': ctx.isExpanded('programa') }" class="accordion-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    <svg class="text-violet-400 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                    Programa
                    <span class="accordion-count">{{ ctx.getConteudos('programa').length }}</span>
                </button>
                <div v-if="ctx.isExpanded('programa')" class="accordion-content">
                    <div v-if="ctx.isLoadingConteudos('programa')" class="flex items-center gap-2 p-3">
                        <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                    </div>
                    <ConteudoLinha v-for="c in ctx.getConteudos('programa')" :key="'prog_' + c.id_conteudo"
                        :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                        @select="ctx.selecionarConteudo(c)" />
                </div>
            </div>

            <!-- Componentes -->
            <div v-if="(ctx.estrutura.value?.componentes || []).length > 0" class="flex flex-col">
                <button @click="ctx.togglePasta('componentes')" class="accordion-trigger">
                    <svg :class="{ 'rotated': ctx.pastaAberta.componentes }" class="accordion-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    <svg class="text-violet-400 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    Componentes
                    <span class="accordion-count">{{ ctx.estrutura.value.componentes.length }}</span>
                </button>
                <div v-if="ctx.pastaAberta.componentes" class="accordion-content">
                    <div v-for="comp in ctx.estrutura.value.componentes" :key="'comp_' + comp.id" class="flex flex-col">
                        <button @click="ctx.toggleSection('componente:' + comp.id)" class="accordion-trigger sub">
                            <svg :class="{ 'rotated': ctx.isExpanded('componente:' + comp.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                            <span class="flex-1 text-left truncate">{{ comp.nome }}</span>
                            <span class="accordion-count">{{ ctx.getConteudos('componente:' + comp.id).length }}</span>
                        </button>
                        <div v-if="ctx.isExpanded('componente:' + comp.id)" class="accordion-content">
                            <div v-if="ctx.isLoadingConteudos('componente:' + comp.id)" class="flex items-center gap-2 p-3">
                                <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                            </div>
                            <ConteudoLinha v-for="c in ctx.getConteudos('componente:' + comp.id)" :key="'comp_' + c.id_conteudo"
                                :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                                @select="ctx.selecionarConteudo(c)" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Módulos/Ciclos -->
            <div v-if="(ctx.estrutura.value?.modulos || []).length > 0" class="flex flex-col">
                <button @click="ctx.togglePasta('modulos')" class="accordion-trigger">
                    <svg :class="{ 'rotated': ctx.pastaAberta.modulos }" class="accordion-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    <svg class="text-violet-400 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    Módulos/Ciclos
                    <span class="accordion-count">{{ ctx.estrutura.value.modulos.length }}</span>
                </button>
                <div v-if="ctx.pastaAberta.modulos" class="accordion-content">
                    <div v-for="mod in ctx.estrutura.value.modulos" :key="'mod_' + mod.id" class="flex flex-col">
                        <button @click="ctx.toggleSection('modulo:' + mod.id)" class="accordion-trigger sub">
                            <svg :class="{ 'rotated': ctx.isExpanded('modulo:' + mod.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                            <span class="flex-1 text-left truncate">{{ mod.nome }}</span>
                            <span class="accordion-count">{{ ctx.getConteudos('modulo:' + mod.id).length + ctx.aulasDoModulo(mod.id).length }}</span>
                        </button>
                        <div v-if="ctx.isExpanded('modulo:' + mod.id)" class="accordion-content">
                            <div v-if="ctx.isLoadingConteudos('modulo:' + mod.id)" class="flex items-center gap-2 p-3">
                                <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                            </div>
                            <ConteudoLinha v-for="c in ctx.getConteudos('modulo:' + mod.id)" :key="'mod_' + c.id_conteudo"
                                :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                                @select="ctx.selecionarConteudo(c)" />

                            <!-- Aulas do módulo -->
                            <div v-if="ctx.aulasDoModulo(mod.id).length > 0" class="flex flex-col ml-3 mt-2 mb-1">
                                <span class="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <svg class="text-white/20" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    Aulas
                                </span>
                                <div v-for="aula in ctx.aulasDoModulo(mod.id)" :key="'aula_' + aula.id" class="flex flex-col">
                                    <button @click="ctx.toggleSection('calendario:' + aula.id)" class="accordion-trigger sub">
                                        <svg :class="{ 'rotated': ctx.isExpanded('calendario:' + aula.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                        <span class="flex-1 text-left truncate">{{ aula.nome }}</span>
                                        <span class="accordion-count">{{ ctx.getConteudos('calendario:' + aula.id).length }}</span>
                                    </button>
                                    <div v-if="ctx.isExpanded('calendario:' + aula.id)" class="accordion-content">
                                        <div v-if="ctx.isLoadingConteudos('calendario:' + aula.id)" class="flex items-center gap-2 p-3">
                                            <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                                        </div>
                                        <ConteudoLinha v-for="c in ctx.getConteudos('calendario:' + aula.id)" :key="'aula_' + c.id_conteudo"
                                            :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                                            @select="ctx.selecionarConteudo(c)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useMinhasAtividades } from "~/composables/programacao_atividades/useMinhasAtividades";
import ConteudoLinha from "~/components/minhas_atividades/ConteudoLinha.vue";

defineProps<{
    ctx: ReturnType<typeof useMinhasAtividades>;
}>();
</script>

<style scoped>
.accordion-trigger { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border-radius: 10px; border: none; background: rgba(255,255,255,0.02); color: rgba(232,230,240,0.85); font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s; text-align: left; }
.accordion-trigger:hover { background: rgba(139,92,246,0.05); }
.accordion-trigger.sub { padding: 7px 12px; border-radius: 8px; font-size: 11px; background: rgba(255,255,255,0.015); }
.accordion-arrow { flex-shrink: 0; color: rgba(255,255,255,0.3); transition: transform 0.15s; }
.accordion-arrow.rotated { transform: rotate(180deg); }
.accordion-count { margin-left: auto; font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }
.accordion-content { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 2px 16px; border-left: 1px solid rgba(255,255,255,0.05); margin-left: 6px; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
</style>
