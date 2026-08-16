<template>
    <div class="flex flex-col gap-5">
        <!-- Dropdown de programa -->
        <div class="flex items-center gap-3">
            <div class="relative" style="min-width: 360px;">
                <button @click="aberto = !aberto" class="select-btn">
                    <div v-if="ctx.programaSelecionado.value" class="select-btn-content">
                        <span class="select-btn-titulo">{{ ctx.programaSelecionado.value.descricao }}</span>
                        <span class="select-btn-sub">{{ ctx.programaSelecionado.value.curso_nome }}</span>
                    </div>
                    <span v-else class="select-btn-placeholder">Selecione um programa...</span>
                    <svg :class="{ 'rotate-180': aberto }" class="select-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
                <div v-if="aberto" class="select-dropdown">
                    <div v-if="ctx.loadingProgramas.value" class="flex items-center gap-2 p-4">
                        <div class="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                        <span class="text-xs font-bold text-white/30">Carregando...</span>
                    </div>
                    <button v-for="p in ctx.programas.value" :key="p.id" @click="selecionar(p)"
                        class="select-option" :class="{ 'select-option--active': ctx.programaSelecionado.value?.id === p.id }">
                        <div class="select-option-info">
                            <span class="select-option-titulo">{{ p.descricao }}</span>
                            <span class="select-option-sub">{{ p.curso_nome }} · {{ p.qtd_ciclos }} ciclo(s)</span>
                        </div>
                    </button>
                    <div v-if="!ctx.loadingProgramas.value && ctx.programas.value.length === 0" class="p-4 text-center">
                        <span class="text-xs font-bold text-white/20">Nenhum programa encontrado</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Layout 2 colunas -->
        <div v-if="!ctx.programaSelecionado.value" class="flex flex-col items-center justify-center py-24 gap-2">
            <p class="text-sm font-bold text-white/20">Selecione um programa</p>
        </div>

        <div v-else class="flex gap-5" style="height: calc(100vh - 220px); min-height: 500px;">

            <!-- ── COLUNA ESQUERDA: Árvore do currículo ──── -->
            <div 
                :class="ctx.selectedScopeKey.value ? 'w-96 flex-shrink-0' : 'flex-1'"
                class="flex flex-col bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative transition-all duration-300"
            >
                <div class="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Currículo</span>
                    <span v-if="ctx.programaSelecionado.value" class="text-[9px] font-black text-secondary/20 bg-white/5 px-2 py-0.5 rounded-full">{{ ctx.programaSelecionado.value.descricao }}</span>
                </div>

                <div v-if="ctx.loadingEstrutura.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                    <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">Carregando...</span>
                </div>

                <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">

                    <!-- ── Programa (conteúdos soltos) ────── -->
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
                            <ConteudoRow v-for="c in ctx.getConteudos('programa')" :key="'prog_' + c.id_conteudo"
                                :item="c" @toggle="ctx.toggleAtivo(c, 'programa')" @destaque="ctx.toggleDestaque(c, 'programa')" />
                            <button @click="ctx.definirEscopoAlvo(ctx.selectedScopeKey.value === 'programa' ? null : 'programa')"
                                class="add-btn-mini" :class="{ 'add-btn-mini--active': ctx.selectedScopeKey.value === 'programa' }">
                                <svg v-if="ctx.selectedScopeKey.value === 'programa'" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                {{ ctx.selectedScopeKey.value === 'programa' ? 'Cancelar' : 'Adicionar' }}
                            </button>
                        </div>
                    </div>

                    <!-- ── Componentes ──────────────────── -->
                    <div v-if="(ctx.estrutura.value?.componentes || []).length > 0" class="flex flex-col">
                        <button @click="togglePasta('componentes')" class="accordion-trigger">
                            <svg :class="{ 'rotated': pastaAberta.componentes }" class="accordion-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                            <svg class="text-violet-400 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            Componentes
                            <span class="accordion-count">{{ ctx.estrutura.value.componentes.length }}</span>
                        </button>
                        <div v-if="pastaAberta.componentes" class="accordion-content">
                            <div v-for="comp in ctx.estrutura.value.componentes" :key="'comp_' + comp.id" class="flex flex-col">
                                <button @click="ctx.toggleSection('componente:' + comp.id)" class="accordion-trigger sub">
                                    <svg :class="{ 'rotated': ctx.isExpanded('componente:' + comp.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                    <svg class="text-violet-400 mr-1" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                    {{ comp.nome }}
                                    <span class="accordion-count">{{ ctx.getConteudos('componente:' + comp.id).length }}</span>
                                </button>
                                <div v-if="ctx.isExpanded('componente:' + comp.id)" class="accordion-content">
                                    <div v-if="ctx.isLoadingConteudos('componente:' + comp.id)" class="flex items-center gap-2 p-3">
                                        <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                                    </div>
                                    <ConteudoRow v-for="c in ctx.getConteudos('componente:' + comp.id)" :key="'comp_' + c.id_conteudo"
                                        :item="c" @toggle="ctx.toggleAtivo(c, 'componente:' + comp.id)" @destaque="ctx.toggleDestaque(c, 'componente:' + comp.id)" />
                                    <button @click="ctx.definirEscopoAlvo(ctx.selectedScopeKey.value === 'componente:' + comp.id ? null : 'componente:' + comp.id)"
                                        class="add-btn-mini" :class="{ 'add-btn-mini--active': ctx.selectedScopeKey.value === 'componente:' + comp.id }">
                                        <svg v-if="ctx.selectedScopeKey.value === 'componente:' + comp.id" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                        <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                        {{ ctx.selectedScopeKey.value === 'componente:' + comp.id ? 'Cancelar' : 'Adicionar' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── Módulos/Ciclos ───────────────── -->
                    <div v-if="(ctx.estrutura.value?.modulos || []).length > 0" class="flex flex-col">
                        <button @click="togglePasta('modulos')" class="accordion-trigger">
                            <svg :class="{ 'rotated': pastaAberta.modulos }" class="accordion-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                            <svg class="text-violet-400 mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            Módulos/Ciclos
                            <span class="accordion-count">{{ ctx.estrutura.value.modulos.length }}</span>
                        </button>
                        <div v-if="pastaAberta.modulos" class="accordion-content">
                            <div v-for="mod in ctx.estrutura.value.modulos" :key="'mod_' + mod.id" class="flex flex-col">
                                <button @click="ctx.toggleSection('modulo:' + mod.id)" class="accordion-trigger sub">
                                    <svg :class="{ 'rotated': ctx.isExpanded('modulo:' + mod.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                    <svg class="text-violet-400 mr-1" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                    {{ mod.nome }}
                                    <span class="accordion-count">{{ ctx.getConteudos('modulo:' + mod.id).length + ctx.aulasDoModulo(mod.id).length }}</span>
                                </button>
                                <div v-if="ctx.isExpanded('modulo:' + mod.id)" class="accordion-content">
                                    <div v-if="ctx.isLoadingConteudos('modulo:' + mod.id)" class="flex items-center gap-2 p-3">
                                        <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                                    </div>

                                    <ConteudoRow v-for="c in ctx.getConteudos('modulo:' + mod.id)" :key="'mod_' + c.id_conteudo"
                                        :item="c" @toggle="ctx.toggleAtivo(c, 'modulo:' + mod.id)" @destaque="ctx.toggleDestaque(c, 'modulo:' + mod.id)" />
                                    <button @click="ctx.definirEscopoAlvo(ctx.selectedScopeKey.value === 'modulo:' + mod.id ? null : 'modulo:' + mod.id)"
                                        class="add-btn-mini" :class="{ 'add-btn-mini--active': ctx.selectedScopeKey.value === 'modulo:' + mod.id }">
                                        <svg v-if="ctx.selectedScopeKey.value === 'modulo:' + mod.id" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                        <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                        {{ ctx.selectedScopeKey.value === 'modulo:' + mod.id ? 'Cancelar' : 'Adicionar' }}
                                    </button>

                                    <!-- Aulas do módulo -->
                                    <div v-if="ctx.aulasDoModulo(mod.id).length > 0" class="flex flex-col ml-3 mt-2 mb-1">
                                        <span class="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <svg class="text-white/20" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                            Aulas
                                        </span>
                                        <div v-for="aula in ctx.aulasDoModulo(mod.id)" :key="'aula_' + aula.id" class="flex flex-col">
                                            <button @click="ctx.toggleSection('calendario:' + aula.id)" class="accordion-trigger sub">
                                                <svg :class="{ 'rotated': ctx.isExpanded('calendario:' + aula.id) }" class="accordion-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 5l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                                <svg class="text-violet-400 mr-1" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                {{ aula.nome }}
                                                <span class="accordion-count">{{ ctx.getConteudos('calendario:' + aula.id).length }}</span>
                                            </button>
                                            <div v-if="ctx.isExpanded('calendario:' + aula.id)" class="accordion-content">
                                                <div v-if="ctx.isLoadingConteudos('calendario:' + aula.id)" class="flex items-center gap-2 p-3">
                                                    <div class="w-3 h-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                                                </div>
                                                <ConteudoRow v-for="c in ctx.getConteudos('calendario:' + aula.id)" :key="'aula_' + c.id_conteudo"
                                                    :item="c" @toggle="ctx.toggleAtivo(c, 'calendario:' + aula.id)" @destaque="ctx.toggleDestaque(c, 'calendario:' + aula.id)" />
                                                <button @click="ctx.definirEscopoAlvo(ctx.selectedScopeKey.value === 'calendario:' + aula.id ? null : 'calendario:' + aula.id)"
                                                    class="add-btn-mini" :class="{ 'add-btn-mini--active': ctx.selectedScopeKey.value === 'calendario:' + aula.id }">
                                                    <svg v-if="ctx.selectedScopeKey.value === 'calendario:' + aula.id" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                                    <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                                    {{ ctx.selectedScopeKey.value === 'calendario:' + aula.id ? 'Cancelar' : 'Adicionar' }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── COLUNA DIREITA: Navegador de conteúdos ──── -->
            <div 
                v-if="ctx.selectedScopeKey.value"
                class="flex-1 flex flex-col bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative animate-in fade-in slide-in-from-right-4 duration-300"
                style="animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);"
            >
                <div class="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex flex-col gap-3">
                    <div class="flex items-center gap-3">
                        <div class="flex-1 flex items-center gap-2 text-sm font-bold text-white/80">
                            <span class="text-secondary/40 text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Conteúdos</span>
                            <span class="text-xs text-white/30 font-bold">{{ ctx.programaSelecionado.value.descricao }}</span>
                        </div>
                        <span class="text-[10px] font-black text-secondary/40 uppercase tracking-widest ml-auto">{{ ctx.conteudosExibidos.value.length }} de {{ ctx.conteudosDisponiveis.value.length }}</span>
                    </div>

                    <div class="filter-bar !mb-0 !border-0 !bg-white/[0.02] !p-3">
                        <div class="relative flex-1 min-w-[200px]">
                            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" width="13" height="13" viewBox="0 0 14 14" fill="none">
                                <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                            <input v-model="ctx.busca.value" placeholder="Buscar conteúdo..." class="busca-input !py-2" />
                        </div>

                        <div class="flex gap-1">
                            <button v-for="t in tiposFiltro" :key="t.value"
                                @click="filtrarPorTipo(t.value)"
                                class="filtro-chip"
                                :class="[
                                    ctx.filtroTipo.value === t.value ? 'filtro-chip--active' : '',
                                    ctx.filtroTipo.value === t.value ? 'tipo--' + t.value : '',
                                ]">
                                {{ t.label }}
                            </button>
                        </div>

                        <div class="w-px h-6 bg-white/10 mx-2 max-xl:hidden xl:block" />

                        <div class="flex items-center gap-1.5 max-xl:hidden xl:flex">
                            <button @click="ctx.filtroMeus.value = !ctx.filtroMeus.value"
                                class="toggle-btn" :class="{ 'toggle-btn--on': ctx.filtroMeus.value }">
                                Só meus
                            </button>
                        </div>
                    </div>

                    <!-- Indicador de escopo alvo -->
                    <div v-if="ctx.selectedScopeKey.value" class="flex items-center justify-between px-1 pt-1">
                        <div class="flex items-center gap-2 text-[10px] font-bold">
                            <span class="text-white/40 uppercase tracking-widest">Escopo alvo</span>
                            <span class="text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">{{ ctx.selectedScopeKey.value }}</span>
                        </div>
                        <button @click="ctx.definirEscopoAlvo(null)" class="text-[10px] font-bold text-red-400/70 hover:text-red-400 transition-colors uppercase tracking-wider flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                            Cancelar
                        </button>
                    </div>
                </div>

                <div v-if="ctx.loadingConteudos.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                    <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">Carregando...</span>
                </div>

                <div v-else-if="ctx.conteudosExibidos.value.length === 0" class="flex-1 flex flex-col items-center justify-center gap-2 empty-state">
                    <p class="text-sm font-bold text-white/30">Nenhum conteúdo encontrado</p>
                    <p class="text-[10px] font-bold text-white/15 uppercase tracking-widest mt-1">Crie conteúdos no Repositório primeiro</p>
                </div>

                <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">
                    <div v-for="c in ctx.conteudosExibidos.value" :key="c.id"
                        class="assoc-row"
                        :class="{ 'assoc-row--on': c.ativo }"
                    >
                        <div class="assoc-accent" v-if="c.ativo" />

                        <!-- Radio: associação (cria/remove linha no currículo) -->
                        <button @click="ctx.toggleAssociacaoPainel(c)" class="assoc-toggle" :title="c.op_id ? 'Desassociar' : 'Associar ao currículo'">
                            <svg v-if="c.op_id" width="14" height="14" viewBox="0 0 12 12" fill="none">
                                <rect width="12" height="12" rx="3" fill="#8b5cf6"/>
                                <path d="M3.5 6l2 2 3-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div v-else class="w-[14px] h-[14px] rounded-[3px] border border-white/20 transition-colors group-hover:border-white/40" />
                        </button>

                        <button v-if="c.id_arquivo" @click="abrirArquivo(c.id_arquivo)" class="file-btn" title="Abrir arquivo">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </button>
                        <div v-else class="file-placeholder" />

                        <div class="info-container">
                            <span class="assoc-titulo" :class="{ 'assoc-titulo--off': c.op_id && !c.ativo }">{{ c.titulo }}</span>
                            <div class="tags-container">
                                <span class="assoc-tipo" :class="'tipo--' + c.tipo">{{ c.tipo }}</span>
                                <div v-if="c.blocos && c.blocos.length > 0" class="assoc-blocos">
                                    <span v-for="b in c.blocos" :key="b.id" class="assoc-bloco-tag">{{ b.titulo }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 opacity-40 ml-auto mr-4 max-lg:hidden lg:flex">
                            <span v-if="c.criado_por_nome" class="assoc-autor">{{ c.criado_por_nome }}</span>
                            <span v-if="c.criado_em" class="assoc-data">{{ formatDate(c.criado_em) }}</span>
                        </div>

                        <!-- Toggle: ativo (aluno vê ou não) -->
                        <button @click="ctx.toggleAtivoPainel(c)" class="toggle-switch-btn" :class="c.ativo ? 'on' : 'off'" :title="c.ativo ? 'Ocultar do aluno' : 'Mostrar ao aluno'">
                            <span class="toggle-label">{{ c.ativo ? 'Visível' : 'Oculto' }}</span>
                            <div class="toggle-track">
                                <div class="toggle-thumb" />
                            </div>
                        </button>

                        <!-- Configurar exibição (timing) -->
                        <button v-if="c.op_id" @click="ctx.abrirConfigTiming(c)" class="gear-btn" title="Configurar disponibilidade/prazo">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Modal: Configurar exibição (timing) ──────────── -->
        <div v-if="ctx.showModalTiming.value && ctx.timingAlvo.value" class="modal-overlay" @click.self="ctx.showModalTiming.value = false">
            <div class="modal-panel">
                <div class="modal-accent-bar" />
                <div class="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/5">
                    <div class="flex flex-col gap-0.5">
                        <span class="text-sm font-black text-white/85">Configurar exibição</span>
                        <span class="text-[11px] font-bold text-white/25">{{ ctx.timingAlvo.value.titulo }}</span>
                    </div>
                    <button @click="ctx.showModalTiming.value = false" class="modal-xclose" title="Fechar">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    </button>
                </div>

                <div class="p-6 flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="field-label">Disponível a partir de</label>
                            <input v-model="ctx.formTiming.data_disponivel" type="datetime-local" class="field-input" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="field-label">Entrega limite</label>
                            <input v-model="ctx.formTiming.data_entrega_limite" type="datetime-local" class="field-input" />
                        </div>
                    </div>

                    <div v-if="ctx.timingAlvo.value.tipo !== 'material'" class="grid grid-cols-3 gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="field-label">Duração (min)</label>
                            <input v-model.number="ctx.formTiming.duracao_minutos" type="number" min="1" step="5" class="field-input" placeholder="—" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="field-label">Tentativas</label>
                            <input v-model.number="ctx.formTiming.tentativas_permitidas" type="number" min="1" class="field-input" placeholder="—" />
                        </div>
                        <div v-if="ctx.timingAlvo.value.tipo === 'avaliacao'" class="flex flex-col gap-2">
                            <label class="field-label">Pontuação máx.</label>
                            <input v-model.number="ctx.formTiming.pontuacao_maxima" type="number" min="0" step="0.5" class="field-input" placeholder="—" />
                        </div>
                    </div>

                    <p class="text-[10px] font-bold text-white/20 leading-relaxed">
                        Deixe em branco para sem restrição. Datas em horário local.
                    </p>
                </div>

                <div class="modal-footer">
                    <button @click="ctx.showModalTiming.value = false" class="modal-btn-cancel">Cancelar</button>
                    <button @click="ctx.salvarTiming()" class="modal-btn-save" :disabled="ctx.savingTiming.value">
                        <div v-if="ctx.savingTiming.value" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useProgAtividadesCore } from "~/composables/programacao_atividades/useProgAtividadesCore";
import { useProgAtividadesCurriculo } from "~/composables/programacao_atividades/useProgAtividadesCurriculo";
import { useToast } from "~/composables/useToast";
import ConteudoRow from "~/components/programacao_atividades/ConteudoRow.vue";

const core = useProgAtividadesCore();
const toast = useToast();

const ctx = useProgAtividadesCurriculo({
    getEntidadeAtivaId: () => core.getEntidadeAtivaId(),
    garantirEntidade: () => core.garantirEntidade(),
    toast,
});

const aberto = ref(false);

const pastaAberta = reactive({
    componentes: false,
    modulos: false,
});

function togglePasta(pasta: "componentes" | "modulos") {
    pastaAberta[pasta] = !pastaAberta[pasta];
}

const tiposFiltro = [
    { value: "", label: "Todos" },
    { value: "material", label: "Material" },
    { value: "atividade", label: "Atividade" },
    { value: "avaliacao", label: "Avaliação" },
];

function selecionar(p: any) {
    ctx.selecionarPrograma(p);
    aberto.value = false;
}

function filtrarPorTipo(tipo: string) {
    ctx.filtroTipo.value = ctx.filtroTipo.value === tipo ? null : tipo;
}

function formatDate(d: string): string {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

async function abrirArquivo(id: string) {
    try {
        const res = (await $fetch("/api/r2/sign", { params: { id } })) as any;
        if (res?.signedUrl) window.open(res.signedUrl, "_blank");
    } catch (e) {
        console.error("Erro ao abrir arquivo", e);
    }
}

onMounted(() => ctx.fetchProgramas());
</script>

<style scoped>
/* ── Select ──────────────────────────────────── */
.select-btn { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.15s; text-align: left; }
.select-btn:hover { border-color: rgba(139,92,246,0.3); }
.select-btn-content { flex: 1; overflow: hidden; }
.select-btn-titulo { font-size: 13px; font-weight: 800; color: rgba(232,230,240,0.9); display: block; }
.select-btn-sub { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-btn-placeholder { flex: 1; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.25); }
.select-arrow { flex-shrink: 0; color: rgba(255,255,255,0.3); transition: transform 0.15s; }
.rotate-180 { transform: rotate(180deg); }
.select-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20; background: #15151f; border: 1px solid rgba(139,92,246,0.15); border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.6); max-height: 280px; overflow-y: auto; }
.select-option { width: 100%; padding: 10px 14px; display: flex; align-items: center; gap: 10px; border: none; background: transparent; cursor: pointer; transition: all 0.15s; text-align: left; }
.select-option:hover { background: rgba(139,92,246,0.06); }
.select-option--active { background: rgba(139,92,246,0.1); }
.select-option-info { overflow: hidden; flex: 1; }
.select-option-titulo { font-size: 12px; font-weight: 700; color: rgba(232,230,240,0.8); display: block; }
.select-option-sub { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.25); display: block; }

/* ── Accordion ───────────────────────────────── */
.accordion-trigger { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(139,92,246,0.15); background: rgba(139,92,246,0.03); color: rgba(232,230,240,0.9); font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s; text-align: left; margin-bottom: 2px; }
.accordion-trigger:hover { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.25); }
.accordion-trigger.sub { padding: 7px 12px; border-radius: 8px; font-size: 11px; background: rgba(139,92,246,0.02); border: 1px solid rgba(139,92,246,0.1); margin-bottom: 2px; }
.accordion-trigger.sub:hover { background: rgba(139,92,246,0.05); border-color: rgba(139,92,246,0.2); }
.accordion-arrow { flex-shrink: 0; color: rgba(255,255,255,0.3); transition: transform 0.15s; }
.accordion-arrow.rotated { transform: rotate(180deg); }
.accordion-count { margin-left: auto; font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 6px; }
.accordion-content { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 2px 16px; border-left: 1px solid rgba(255,255,255,0.05); margin-left: 6px; }

/* ── Empty state ─────────────────────────────── */
.empty-state { padding: 3rem 1.5rem; }

/* ── Filter bar ──────────────────────────────── */
.filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }

.busca-input { width: 100%; padding: 10px 12px 10px 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.015); color: rgba(232,230,240,0.7); font-size: 11px; font-weight: 600; outline: none; transition: all 0.15s; }
.busca-input:focus { border-color: rgba(139,92,246,0.25); box-shadow: 0 0 0 2px rgba(139,92,246,0.06); }
.busca-input::placeholder { color: rgba(255,255,255,0.15); }

.filtro-chip { padding: 4px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.3); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: all 0.15s; }
.filtro-chip:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); }
.filtro-chip--active { background: rgba(139,92,246,0.12); color: #c4b5fd; border-color: rgba(139,92,246,0.2); }
.tipo--todos.filtro-chip--active { background: rgba(139,92,246,0.12); color: #c4b5fd; }
.tipo--material { background: rgba(96,165,250,0.08); color: #93c5fd; border-color: rgba(96,165,250,0.15); }
.tipo--atividade { background: rgba(52,211,153,0.08); color: #6ee7b7; border-color: rgba(52,211,153,0.15); }
.tipo--avaliacao { background: rgba(251,146,60,0.08); color: #fdba74; border-color: rgba(251,146,60,0.15); }

.toggle-btn { padding: 4px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.3); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.toggle-btn:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); }
.toggle-btn--on { background: rgba(139,92,246,0.12); color: #c4b5fd; border-color: rgba(139,92,246,0.2); }

/* ── Associação rows ─────────────────────────── */
.assoc-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; transition: all 0.15s ease; border: 1px solid rgba(255,255,255,0.02); background: rgba(255,255,255,0.015); position: relative; overflow: hidden; }
.assoc-row:hover { border-color: rgba(255,255,255,0.05); background: rgba(255,255,255,0.03); cursor: default; }
.assoc-row--on { background: rgba(139,92,246,0.03); border-color: rgba(139,92,246,0.15); }
.assoc-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #8b5cf6; }

.info-container { display: flex; flex-direction: column; flex: 1; overflow: hidden; gap: 3px; justify-content: center; margin-left: 2px; }
.tags-container { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.file-placeholder { width: 22px; height: 22px; flex-shrink: 0; }
.assoc-toggle { flex-shrink: 0; cursor: pointer; background: none; border: none; padding: 0; }
.assoc-titulo--off { opacity: 0.4; text-decoration: line-through; }

.assoc-tipo { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; }
.tipo--material { background: rgba(96,165,250,0.12); color: #93c5fd; }
.tipo--atividade { background: rgba(52,211,153,0.12); color: #6ee7b7; }
.tipo--avaliacao { background: rgba(251,146,60,0.12); color: #fdba74; }
.assoc-titulo { font-size: 11px; font-weight: 700; color: rgba(232,230,240,0.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Switch Toggle */
.toggle-switch-btn { display: flex; align-items: center; gap: 6px; border: none; background: transparent; cursor: pointer; padding: 0; }
.toggle-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.25); transition: color 0.15s; }
.toggle-switch-btn.on .toggle-label { color: #8b5cf6; }
.toggle-track { width: 24px; height: 14px; border-radius: 7px; background: rgba(255,255,255,0.1); position: relative; transition: all 0.2s; }
.toggle-switch-btn.on .toggle-track { background: #8b5cf6; }
.toggle-thumb { width: 10px; height: 10px; border-radius: 5px; background: white; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; }
.toggle-switch-btn.on .toggle-thumb { transform: translateX(10px); }

.file-btn { width: 22px; height: 22px; flex-shrink: 0; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: rgba(255,255,255,0.15); transition: all 0.15s; }
.file-btn:hover { color: #60a5fa; background: rgba(96,165,250,0.1); }
.assoc-blocos { display: flex; gap: 4px; flex-wrap: wrap; }
.assoc-bloco-tag { font-size: 8px; font-weight: 700; color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
.assoc-autor { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.5); }
.assoc-data { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.4); }

/* ── Add mini button ─────────────────────────── */
.add-btn-mini { padding: 8px 14px; border-radius: 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border: 1px dashed rgba(255,255,255,0.1); background: rgba(255,255,255,0.015); color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s; text-align: center; margin: 4px 0; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
.add-btn-mini:hover { border-color: rgba(139,92,246,0.4); color: #a78bfa; background: rgba(139,92,246,0.05); }
.add-btn-mini--active { border-color: rgba(139,92,246,0.5); border-style: solid; color: #fff; background: linear-gradient(135deg, rgba(124,58,237,0.8), rgba(139,92,246,0.8)); box-shadow: 0 4px 14px rgba(139,92,246,0.25); }

@keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}
.gear-btn { width: 26px; height: 26px; flex-shrink: 0; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: rgba(255,255,255,0.2); transition: all 0.15s; }
.gear-btn:hover { color: #a78bfa; background: rgba(139,92,246,0.1); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.82); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-panel { width: 480px; max-width: calc(100vw - 32px); background: #13131a; border: 1px solid rgba(139,92,246,0.2); border-radius: 18px; box-shadow: 0 32px 80px rgba(0,0,0,0.6); animation: slideUp 0.2s ease; overflow: hidden; }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.modal-accent-bar { height: 2px; background: linear-gradient(90deg, #7c3aed, #a78bfa, transparent); }
.modal-xclose { width: 28px; height: 28px; border-radius: 8px; border: none; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.35); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.modal-xclose:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.field-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); }
.field-input { width: 100%; padding: 9px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); color: rgba(232,230,240,0.75); font-size: 12px; font-weight: 600; outline: none; transition: all 0.15s; }
.field-input:focus { border-color: rgba(139,92,246,0.35); box-shadow: 0 0 0 2px rgba(139,92,246,0.08); }
.modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 14px 24px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); }
.modal-btn-cancel { padding: 8px 18px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: rgba(255,255,255,0.45); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; }
.modal-btn-cancel:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); }
.modal-btn-save { padding: 8px 18px; border-radius: 9px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; box-shadow: 0 4px 14px rgba(139,92,246,0.35); }
.modal-btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,92,246,0.45); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
