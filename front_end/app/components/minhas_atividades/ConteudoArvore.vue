<template>
    <div class="flex flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative">
        <div class="px-5 py-4 border-b border-divider bg-div-15 flex items-center justify-between gap-2">
            <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Conteúdos</span>
            <slot name="header-right" />
        </div>

        <div v-if="ctx.loadingEstrutura.value" class="flex-1 flex flex-col items-center justify-center gap-3">
            <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Carregando...</span>
        </div>

        <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">

            <!-- Programa -->
            <div class="flex flex-col">
                <button @click="ctx.toggleSection('programa')" class="accordion-trigger">
                    <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.isExpanded('programa') }" class="accordion-arrow w-3 h-3" />
                    <Icon name="ph:books-bold" class="text-primary mr-1 w-3.5 h-3.5" />
                    Programa
                    <span class="accordion-count">{{ ctx.getConteudos('programa').length }}</span>
                </button>
                <div v-if="ctx.isExpanded('programa')" class="accordion-content">
                    <div v-if="ctx.isLoadingConteudos('programa')" class="flex items-center gap-2 p-3">
                        <div class="w-3 h-3 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                    <ConteudoLinha v-for="c in ctx.getConteudos('programa')" :key="'prog_' + c.id_conteudo"
                        :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                        @select="ctx.selecionarConteudo(c)" />
                </div>
            </div>

            <!-- Componentes -->
            <div v-if="(ctx.estrutura.value?.componentes || []).length > 0" class="flex flex-col">
                <button @click="ctx.togglePasta('componentes')" class="accordion-trigger">
                    <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.pastaAberta.componentes }" class="accordion-arrow w-3 h-3" />
                    <Icon name="ph:folder-open-bold" class="text-primary mr-1 w-3.5 h-3.5" />
                    Componentes
                    <span class="accordion-count">{{ ctx.estrutura.value.componentes.length }}</span>
                </button>
                <div v-if="ctx.pastaAberta.componentes" class="accordion-content">
                    <div v-for="comp in ctx.estrutura.value.componentes" :key="'comp_' + comp.id" class="flex flex-col">
                        <button @click="ctx.toggleSection('componente:' + comp.id)" class="accordion-trigger sub">
                            <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.isExpanded('componente:' + comp.id) }" class="accordion-arrow w-2.5 h-2.5" />
                            <span class="flex-1 text-left truncate">{{ comp.nome }}</span>
                            <span class="accordion-count">{{ ctx.getConteudos('componente:' + comp.id).length }}</span>
                        </button>
                        <div v-if="ctx.isExpanded('componente:' + comp.id)" class="accordion-content">
                            <div v-if="ctx.isLoadingConteudos('componente:' + comp.id)" class="flex items-center gap-2 p-3">
                                <div class="w-3 h-3 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
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
                    <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.pastaAberta.modulos }" class="accordion-arrow w-3 h-3" />
                    <Icon name="ph:folder-open-bold" class="text-primary mr-1 w-3.5 h-3.5" />
                    Módulos/Ciclos
                    <span class="accordion-count">{{ ctx.estrutura.value.modulos.length }}</span>
                </button>
                <div v-if="ctx.pastaAberta.modulos" class="accordion-content">
                    <div v-for="mod in ctx.estrutura.value.modulos" :key="'mod_' + mod.id" class="flex flex-col">
                        <button @click="ctx.toggleSection('modulo:' + mod.id)" class="accordion-trigger sub">
                            <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.isExpanded('modulo:' + mod.id) }" class="accordion-arrow w-2.5 h-2.5" />
                            <span class="flex-1 text-left truncate">{{ mod.nome }}</span>
                            <span class="accordion-count">{{ ctx.getConteudos('modulo:' + mod.id).length + ctx.aulasDoModulo(mod.id).length }}</span>
                        </button>
                        <div v-if="ctx.isExpanded('modulo:' + mod.id)" class="accordion-content">
                            <div v-if="ctx.isLoadingConteudos('modulo:' + mod.id)" class="flex items-center gap-2 p-3">
                                <div class="w-3 h-3 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
                            </div>
                            <ConteudoLinha v-for="c in ctx.getConteudos('modulo:' + mod.id)" :key="'mod_' + c.id_conteudo"
                                :item="c" :ativo="ctx.conteudoAtivo.value?.id_conteudo === c.id_conteudo"
                                @select="ctx.selecionarConteudo(c)" />

                            <!-- Aulas do módulo -->
                            <div v-if="ctx.aulasDoModulo(mod.id).length > 0" class="flex flex-col ml-3 mt-2 mb-1">
                                <span class="text-[9px] font-black text-secondary/50 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Icon name="ph:calendar-blank-bold" class="text-secondary/50 w-3 h-3" />
                                    Aulas
                                </span>
                                <div v-for="aula in ctx.aulasDoModulo(mod.id)" :key="'aula_' + aula.id" class="flex flex-col">
                                    <button @click="ctx.toggleSection('calendario:' + aula.id)" class="accordion-trigger sub">
                                        <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.isExpanded('calendario:' + aula.id) }" class="accordion-arrow w-2.5 h-2.5" />
                                        <span class="flex-1 text-left truncate">{{ aula.nome }}</span>
                                        <span class="accordion-count">{{ ctx.getConteudos('calendario:' + aula.id).length }}</span>
                                    </button>
                                    <div v-if="ctx.isExpanded('calendario:' + aula.id)" class="accordion-content">
                                        <div v-if="ctx.isLoadingConteudos('calendario:' + aula.id)" class="flex items-center gap-2 p-3">
                                            <div class="w-3 h-3 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
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
.accordion-trigger { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border-radius: 10px; border: none; background: var(--color-secondary-surface); color: var(--color-text); font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s; text-align: left; }
.accordion-trigger:hover { background: var(--color-secondary-surface-hover); }
.accordion-trigger.sub { padding: 7px 12px; border-radius: 8px; font-size: 11px; background: var(--color-secondary-surface); }
.accordion-arrow { flex-shrink: 0; color: var(--color-secondary); transition: transform 0.15s; }
.accordion-arrow.rotated { transform: rotate(180deg); }
.accordion-count { margin-left: auto; font-size: 9px; font-weight: 800; color: var(--color-secondary); background: var(--color-secondary-surface-hover); padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }
.accordion-content { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 2px 16px; border-left: 1px solid var(--color-divider); margin-left: 6px; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-divider); border-radius: 4px; }
</style>
