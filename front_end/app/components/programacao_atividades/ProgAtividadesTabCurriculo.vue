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
                    <Icon name="ph:caret-down-bold" :class="{ 'rotate-180': aberto }" class="select-arrow w-3.5 h-3.5" />
                </button>
                <div v-if="aberto" class="select-dropdown">
                    <div v-if="ctx.loadingProgramas.value" class="flex items-center gap-2 p-4">
                        <div class="w-4 h-4 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                        <span class="text-xs font-bold text-secondary/50">Carregando...</span>
                    </div>
                    <button v-for="p in ctx.programas.value" :key="p.id" @click="selecionar(p)"
                        class="select-option" :class="{ 'select-option--active': ctx.programaSelecionado.value?.id === p.id }">
                        <div class="select-option-info">
                            <span class="select-option-titulo">{{ p.descricao }}</span>
                            <span class="select-option-sub">{{ p.curso_nome }} · {{ p.qtd_ciclos }} ciclo(s)</span>
                        </div>
                    </button>
                    <div v-if="!ctx.loadingProgramas.value && ctx.programas.value.length === 0" class="p-4 text-center">
                        <span class="text-xs font-bold text-secondary/40">Nenhum programa encontrado</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Layout 2 colunas -->
        <div v-if="!ctx.programaSelecionado.value" class="flex flex-col items-center justify-center py-24 gap-2">
            <p class="text-sm font-bold text-secondary/50">Selecione um programa acima</p>
        </div>

        <div v-else class="flex gap-5" style="height: calc(100vh - 220px); min-height: 500px;">

            <!-- ── COLUNA ESQUERDA: Árvore do currículo ──── -->
            <div 
                :class="ctx.selectedScopeKey.value ? 'w-96 flex-shrink-0' : 'flex-1'"
                class="flex flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative transition-all duration-300"
            >
                <div class="px-5 py-4 border-b border-divider bg-div-15 flex items-center justify-between">
                    <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Currículo</span>
                    <span v-if="ctx.programaSelecionado.value" class="text-[9px] font-black text-secondary/60 bg-div-30 px-2 py-0.5 rounded-full border border-divider">{{ ctx.programaSelecionado.value.descricao }}</span>
                </div>

                <div v-if="ctx.loadingEstrutura.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                    <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Carregando...</span>
                </div>

                <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">

                    <!-- ── Programa (conteúdos soltos) ────── -->
                    <div class="flex flex-col">
                        <button @click="ctx.toggleSection('programa')" class="accordion-trigger">
                            <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.isExpanded('programa') }" class="accordion-arrow w-3 h-3" />
                            <Icon name="ph:book-bookmark-duotone" class="text-primary w-4 h-4 mr-1" />
                            <span>Programa</span>
                            <span class="accordion-count">{{ ctx.getConteudos('programa').length }}</span>
                        </button>
                        <div v-if="ctx.isExpanded('programa')" class="accordion-content">
                            <div v-if="ctx.isLoadingConteudos('programa')" class="flex items-center gap-2 p-3">
                                <div class="w-3 h-3 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                            </div>
                            <ConteudoRow v-for="c in ctx.getConteudos('programa')" :key="'prog_' + c.id_conteudo"
                                :item="c" @toggle="ctx.toggleAtivo(c, 'programa')" @destaque="ctx.toggleDestaque(c, 'programa')" />
                            <button @click="ctx.definirEscopoAlvo(ctx.selectedScopeKey.value === 'programa' ? null : 'programa')"
                                class="add-btn-mini" :class="{ 'add-btn-mini--active': ctx.selectedScopeKey.value === 'programa' }">
                                <Icon v-if="ctx.selectedScopeKey.value === 'programa'" name="ph:x-bold" class="w-3 h-3" />
                                <Icon v-else name="ph:plus-bold" class="w-3 h-3" />
                                <span>{{ ctx.selectedScopeKey.value === 'programa' ? 'Cancelar' : 'Adicionar' }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- ── Componentes ──────────────────── -->
                    <div v-if="(ctx.estrutura.value?.componentes || []).length > 0" class="flex flex-col">
                        <button @click="ctx.togglePasta('componentes')" class="accordion-trigger">
                            <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.pastaAberta.componentes }" class="accordion-arrow w-3 h-3" />
                            <Icon name="ph:folder-duotone" class="text-primary w-4 h-4 mr-1" />
                            <span>Componentes</span>
                            <span class="accordion-count">{{ ctx.estrutura.value.componentes.length }}</span>
                        </button>
                        <div v-if="ctx.pastaAberta.componentes" class="accordion-content">
                            <div v-for="comp in ctx.estrutura.value.componentes" :key="'comp_' + comp.id" class="flex flex-col">
                                <button @click="ctx.toggleSection('componente:' + comp.id)" class="accordion-trigger sub">
                                    <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.isExpanded('componente:' + comp.id) }" class="accordion-arrow w-2.5 h-2.5" />
                                    <Icon name="ph:folder-open-duotone" class="text-primary w-3.5 h-3.5 mr-1" />
                                    <span>{{ comp.nome }}</span>
                                    <span class="accordion-count">{{ ctx.getConteudos('componente:' + comp.id).length }}</span>
                                </button>
                                <div v-if="ctx.isExpanded('componente:' + comp.id)" class="accordion-content">
                                    <div v-if="ctx.isLoadingConteudos('componente:' + comp.id)" class="flex items-center gap-2 p-3">
                                        <div class="w-3 h-3 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                                    </div>
                                    <ConteudoRow v-for="c in ctx.getConteudos('componente:' + comp.id)" :key="'comp_' + c.id_conteudo"
                                        :item="c" @toggle="ctx.toggleAtivo(c, 'componente:' + comp.id)" @destaque="ctx.toggleDestaque(c, 'componente:' + comp.id)" />
                                    <button @click="ctx.definirEscopoAlvo(ctx.selectedScopeKey.value === 'componente:' + comp.id ? null : 'componente:' + comp.id)"
                                        class="add-btn-mini" :class="{ 'add-btn-mini--active': ctx.selectedScopeKey.value === 'componente:' + comp.id }">
                                        <Icon v-if="ctx.selectedScopeKey.value === 'componente:' + comp.id" name="ph:x-bold" class="w-3 h-3" />
                                        <Icon v-else name="ph:plus-bold" class="w-3 h-3" />
                                        <span>{{ ctx.selectedScopeKey.value === 'componente:' + comp.id ? 'Cancelar' : 'Adicionar' }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── Módulos/Ciclos ───────────────── -->
                    <div v-if="(ctx.estrutura.value?.modulos || []).length > 0" class="flex flex-col">
                        <button @click="ctx.togglePasta('modulos')" class="accordion-trigger">
                            <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.pastaAberta.modulos }" class="accordion-arrow w-3 h-3" />
                            <Icon name="ph:squares-four-duotone" class="text-primary w-4 h-4 mr-1" />
                            <span>Módulos/Ciclos</span>
                            <span class="accordion-count">{{ ctx.estrutura.value.modulos.length }}</span>
                        </button>
                        <div v-if="ctx.pastaAberta.modulos" class="accordion-content">
                            <div v-for="mod in ctx.estrutura.value.modulos" :key="'mod_' + mod.id" class="flex flex-col">
                                <button @click="ctx.toggleSection('modulo:' + mod.id)" class="accordion-trigger sub">
                                    <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.isExpanded('modulo:' + mod.id) }" class="accordion-arrow w-2.5 h-2.5" />
                                    <Icon name="ph:folder-open-duotone" class="text-primary w-3.5 h-3.5 mr-1" />
                                    <span>{{ mod.nome }}</span>
                                    <span class="accordion-count">{{ ctx.getConteudos('modulo:' + mod.id).length + ctx.aulasDoModulo(mod.id).length }}</span>
                                </button>
                                <div v-if="ctx.isExpanded('modulo:' + mod.id)" class="accordion-content">
                                    <div v-if="ctx.isLoadingConteudos('modulo:' + mod.id)" class="flex items-center gap-2 p-3">
                                        <div class="w-3 h-3 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                                    </div>

                                    <ConteudoRow v-for="c in ctx.getConteudos('modulo:' + mod.id)" :key="'mod_' + c.id_conteudo"
                                        :item="c" @toggle="ctx.toggleAtivo(c, 'modulo:' + mod.id)" @destaque="ctx.toggleDestaque(c, 'modulo:' + mod.id)" />
                                    <button @click="ctx.definirEscopoAlvo(ctx.selectedScopeKey.value === 'modulo:' + mod.id ? null : 'modulo:' + mod.id)"
                                        class="add-btn-mini" :class="{ 'add-btn-mini--active': ctx.selectedScopeKey.value === 'modulo:' + mod.id }">
                                        <Icon v-if="ctx.selectedScopeKey.value === 'modulo:' + mod.id" name="ph:x-bold" class="w-3 h-3" />
                                        <Icon v-else name="ph:plus-bold" class="w-3 h-3" />
                                        <span>{{ ctx.selectedScopeKey.value === 'modulo:' + mod.id ? 'Cancelar' : 'Adicionar' }}</span>
                                    </button>

                                    <!-- Aulas do módulo -->
                                    <div v-if="ctx.aulasDoModulo(mod.id).length > 0" class="flex flex-col ml-3 mt-2 mb-1">
                                        <span class="text-[9px] font-bold text-secondary/60 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <Icon name="ph:calendar-blank-duotone" class="w-3 h-3 text-secondary/60" />
                                            Aulas
                                        </span>
                                        <div v-for="aula in ctx.aulasDoModulo(mod.id)" :key="'aula_' + aula.id" class="flex flex-col">
                                            <button @click="ctx.toggleSection('calendario:' + aula.id)" class="accordion-trigger sub">
                                                <Icon name="ph:caret-down-bold" :class="{ 'rotated': ctx.isExpanded('calendario:' + aula.id) }" class="accordion-arrow w-2.5 h-2.5" />
                                                <Icon name="ph:chalkboard-teacher-duotone" class="text-primary w-3.5 h-3.5 mr-1" />
                                                <span>{{ aula.nome }}</span>
                                                <span class="accordion-count">{{ ctx.getConteudos('calendario:' + aula.id).length }}</span>
                                            </button>
                                            <div v-if="ctx.isExpanded('calendario:' + aula.id)" class="accordion-content">
                                                <div v-if="ctx.isLoadingConteudos('calendario:' + aula.id)" class="flex items-center gap-2 p-3">
                                                    <div class="w-3 h-3 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                                                </div>
                                                <ConteudoRow v-for="c in ctx.getConteudos('calendario:' + aula.id)" :key="'aula_' + c.id_conteudo"
                                                    :item="c" @toggle="ctx.toggleAtivo(c, 'calendario:' + aula.id)" @destaque="ctx.toggleDestaque(c, 'calendario:' + aula.id)" />
                                                <button @click="ctx.definirEscopoAlvo(ctx.selectedScopeKey.value === 'calendario:' + aula.id ? null : 'calendario:' + aula.id)"
                                                    class="add-btn-mini" :class="{ 'add-btn-mini--active': ctx.selectedScopeKey.value === 'calendario:' + aula.id }">
                                                    <Icon v-if="ctx.selectedScopeKey.value === 'calendario:' + aula.id" name="ph:x-bold" class="w-3 h-3" />
                                                    <Icon v-else name="ph:plus-bold" class="w-3 h-3" />
                                                    <span>{{ ctx.selectedScopeKey.value === 'calendario:' + aula.id ? 'Cancelar' : 'Adicionar' }}</span>
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
                class="flex-1 flex flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative navegador--alvo"
                style="animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);"
            >
                <div class="px-5 py-4 border-b border-divider bg-div-15 flex flex-col gap-3">
                    <div class="flex items-center gap-3">
                        <div class="flex-1 flex items-center gap-2 text-sm font-bold text-text">
                            <span class="text-secondary/60 text-[10px] font-black uppercase tracking-widest bg-div-30 px-2 py-0.5 rounded-full border border-divider">Conteúdos</span>
                            <span class="text-xs text-secondary/60 font-bold">{{ ctx.programaSelecionado.value.descricao }}</span>
                        </div>
                        <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest ml-auto">{{ ctx.conteudosExibidos.value.length }} de {{ ctx.conteudosDisponiveis.value.length }}</span>
                    </div>

                    <div class="filter-bar !mb-0 !border-0 !bg-div-15 !p-3">
                        <div class="relative flex-1 min-w-[200px]">
                            <Icon name="ph:magnifying-glass-light" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/40 pointer-events-none" />
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

                        <div class="w-px h-6 bg-divider mx-2 max-xl:hidden xl:block" />

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
                            <span class="text-secondary/60 uppercase tracking-widest">Escopo alvo</span>
                            <span class="text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{{ ctx.selectedScopeKey.value }}</span>
                        </div>
                        <button @click="ctx.definirEscopoAlvo(null)" class="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider flex items-center gap-1">
                            <Icon name="ph:x-bold" class="w-2.5 h-2.5" />
                            <span>Cancelar</span>
                        </button>
                    </div>
                </div>

                <div v-if="ctx.loadingConteudos.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                    <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Carregando...</span>
                </div>

                <div v-else-if="ctx.conteudosExibidos.value.length === 0" class="flex-1 flex flex-col items-center justify-center gap-2 empty-state">
                    <p class="text-sm font-bold text-secondary/60">Nenhum conteúdo encontrado</p>
                    <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest mt-1">Crie conteúdos no Repositório primeiro</p>
                </div>

                <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">
                    <div v-for="c in ctx.conteudosExibidos.value" :key="c.id"
                        class="assoc-row"
                        :class="{ 'assoc-row--on': c.ativo }"
                    >
                        <div class="assoc-accent" v-if="c.ativo" />

                        <button @click="ctx.toggleAssociacaoPainel(c)" class="assoc-toggle"
                            :disabled="!ctx.selectedScopeKey.value"
                            :title="ctx.selectedScopeKey.value ? (c.op_id ? 'Desassociar' : 'Associar ao escopo') : 'Selecione o escopo primeiro (Adicionar na árvore)'">
                            <Icon v-if="c.op_id" name="ph:check-square-fill" class="w-4 h-4 text-primary" />
                            <div v-else class="w-3.5 h-3.5 rounded border border-divider transition-colors group-hover:border-primary/40" />
                        </button>

                        <button v-if="c.id_arquivo" @click="abrirArquivo(c.id_arquivo)" class="file-btn" title="Abrir arquivo">
                            <Icon name="ph:file-arrow-down-bold" class="w-3.5 h-3.5" />
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

                        <div class="flex items-center gap-2 opacity-60 ml-auto mr-4 max-lg:hidden lg:flex">
                            <span v-if="c.criado_por_nome" class="assoc-autor">{{ c.criado_por_nome }}</span>
                            <span v-if="c.criado_em" class="assoc-data">{{ formatDate(c.criado_em) }}</span>
                        </div>

                        <!-- Toggle: ativo -->
                        <button @click="ctx.toggleAtivoPainel(c)" class="toggle-switch-btn" :class="c.ativo ? 'on' : 'off'"
                            :disabled="!ctx.selectedScopeKey.value"
                            :title="ctx.selectedScopeKey.value ? (c.ativo ? 'Ocultar do aluno' : 'Mostrar ao aluno') : 'Selecione o escopo primeiro (Adicionar na árvore)'">
                            <span class="toggle-label">{{ c.ativo ? 'Visível' : 'Oculto' }}</span>
                            <div class="toggle-track">
                                <div class="toggle-thumb" />
                            </div>
                        </button>

                        <!-- Configurar exibição (timing) -->
                        <button v-if="c.op_id" @click="ctx.abrirConfigTiming(c)" class="gear-btn" title="Configurar disponibilidade/prazo">
                            <Icon name="ph:gear-bold" class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Modal: Configurar exibição (timing) ──────────── -->
        <div v-if="ctx.showModalTiming.value && ctx.timingAlvo.value" class="ds-modal-overlay" @click.self="ctx.showModalTiming.value = false">
            <div class="ds-modal-panel max-w-md">
                <div class="ds-modal-accent-bar" />
                <div class="ds-modal-header">
                    <div class="ds-modal-header-icon">
                        <Icon name="ph:clock-bold" class="w-5 h-5 text-primary" />
                    </div>
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                        <h3 class="ds-modal-title">Configurar Exibição</h3>
                        <p class="ds-modal-subtitle truncate">{{ ctx.timingAlvo.value.titulo }}</p>
                    </div>
                    <button @click="ctx.showModalTiming.value = false" class="ds-modal-close-btn">&times;</button>
                </div>

                <div class="p-6 flex flex-col gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <BaseField
                            v-model="ctx.formTiming.data_disponivel"
                            label="Disponível a partir de"
                            type="datetime-local"
                        />
                        <BaseField
                            v-model="ctx.formTiming.data_entrega_limite"
                            label="Entrega limite"
                            type="datetime-local"
                        />
                    </div>

                    <div v-if="ctx.timingAlvo.value.tipo !== 'material'" class="grid grid-cols-3 gap-3">
                        <BaseField
                            v-model="ctx.formTiming.duracao_minutos"
                            label="Duração (min)"
                            type="number"
                            :min="1"
                            placeholder="—"
                        />
                        <BaseField
                            v-model="ctx.formTiming.tentativas_permitidas"
                            label="Tentativas"
                            type="number"
                            :min="1"
                            placeholder="—"
                        />
                        <BaseField
                            v-if="ctx.timingAlvo.value.tipo === 'avaliacao'"
                            v-model="ctx.formTiming.pontuacao_maxima"
                            label="Pontuação máx."
                            type="number"
                            :min="0"
                            placeholder="—"
                        />
                    </div>

                    <p class="text-[10px] font-bold text-secondary/60 leading-relaxed">
                        Deixe em branco para sem restrição. Datas em horário local.
                    </p>
                </div>

                <div class="ds-modal-footer">
                    <button @click="ctx.showModalTiming.value = false" class="ds-btn-cancel">Cancelar</button>
                    <button @click="ctx.salvarTiming()" class="ds-btn-save" :disabled="ctx.savingTiming.value">
                        <div v-if="ctx.savingTiming.value" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Salvar</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useProgAtividadesCurriculo } from "~/composables/programacao_atividades/useProgAtividadesCurriculo";
import ConteudoRow from "~/components/programacao_atividades/ConteudoRow.vue";

const props = defineProps<{
    ctx: ReturnType<typeof useProgAtividadesCurriculo>;
}>();

const aberto = ref(false);

const tiposFiltro = [
    { value: "", label: "Todos" },
    { value: "material", label: "Material" },
    { value: "atividade", label: "Atividade" },
    { value: "avaliacao", label: "Avaliação" },
];

function selecionar(p: any) {
    props.ctx.selecionarPrograma(p);
    aberto.value = false;
}

function filtrarPorTipo(tipo: string) {
    props.ctx.filtroTipo.value = props.ctx.filtroTipo.value === tipo ? null : tipo;
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

onMounted(() => props.ctx.fetchProgramas());
</script>

<style scoped>
.select-btn { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--field-border); background: var(--field-bg); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.15s; text-align: left; }
.select-btn:hover { border-color: rgba(139,92,246,0.3); }
.select-btn-content { flex: 1; overflow: hidden; }
.select-btn-titulo { font-size: 13px; font-weight: 800; color: var(--field-text); display: block; }
.select-btn-sub { font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.6; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-btn-placeholder { flex: 1; font-size: 12px; font-weight: 700; color: var(--color-secondary); opacity: 0.5; }
.select-arrow { flex-shrink: 0; color: var(--color-secondary); transition: transform 0.15s; }
.rotate-180 { transform: rotate(180deg); }
.select-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20; background: var(--color-secondary-surface); border: 1px solid var(--color-divider); border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.4); max-height: 280px; overflow-y: auto; }
.select-option { width: 100%; padding: 10px 14px; display: flex; align-items: center; gap: 10px; border: none; background: transparent; cursor: pointer; transition: all 0.15s; text-align: left; }
.select-option:hover { background: var(--color-secondary-surface-hover); }
.select-option--active { background: rgba(139,92,246,0.1); }
.select-option-info { overflow: hidden; flex: 1; }
.select-option-titulo { font-size: 12px; font-weight: 700; color: var(--color-text); display: block; }
.select-option-sub { font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.6; display: block; }

.accordion-trigger { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-text); font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.15s; text-align: left; margin-bottom: 2px; }
.accordion-trigger:hover { background: var(--color-secondary-surface-hover); border-color: rgba(139,92,246,0.25); }
.accordion-trigger.sub { padding: 7px 12px; border-radius: 8px; font-size: 11px; background: var(--color-secondary-surface); border: 1px solid var(--color-divider); margin-bottom: 2px; }
.accordion-trigger.sub:hover { background: var(--color-secondary-surface-hover); }
.accordion-arrow { flex-shrink: 0; color: var(--color-secondary); opacity: 0.6; transition: transform 0.15s; }
.accordion-arrow.rotated { transform: rotate(180deg); }
.accordion-count { margin-left: auto; font-size: 9px; font-weight: 800; color: var(--color-secondary); opacity: 0.6; background: var(--color-secondary-surface-hover); padding: 2px 8px; border-radius: 6px; }
.accordion-content { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 2px 16px; border-left: 1px solid var(--color-divider); margin-left: 6px; }

.empty-state { padding: 3rem 1.5rem; }

.filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 4px; }

.busca-input { width: 100%; padding: 10px 12px 10px 36px; border-radius: 8px; border: 1px solid var(--field-border); background: var(--field-bg); color: var(--field-text); font-size: 11px; font-weight: 600; outline: none; transition: all 0.15s; }
.busca-input:focus { border-color: rgba(139,92,246,0.35); }
.busca-input::placeholder { color: var(--color-secondary); opacity: 0.4; }

.filtro-chip { padding: 4px 14px; border-radius: 6px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: all 0.15s; }
.filtro-chip:hover { background: var(--color-secondary-surface-hover); color: var(--color-text); }
.filtro-chip--active { background: rgba(139,92,246,0.12); color: var(--color-primary); border-color: rgba(139,92,246,0.25); }
.tipo--todos.filtro-chip--active { background: rgba(139,92,246,0.12); color: var(--color-primary); }
.tipo--material { background: rgba(59,130,246,0.08); color: #3b82f6; border-color: rgba(59,130,246,0.15); }
.tipo--atividade { background: rgba(245,158,11,0.08); color: #f59e0b; border-color: rgba(245,158,11,0.15); }
.tipo--avaliacao { background: rgba(139,92,246,0.08); color: var(--color-primary); border-color: rgba(139,92,246,0.15); }

.toggle-btn { padding: 4px 12px; border-radius: 6px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.toggle-btn:hover { background: var(--color-secondary-surface-hover); color: var(--color-text); }
.toggle-btn--on { background: rgba(139,92,246,0.12); color: var(--color-primary); border-color: rgba(139,92,246,0.25); }

.assoc-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; transition: all 0.15s ease; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); position: relative; overflow: hidden; }
.assoc-row:hover { border-color: rgba(139,92,246,0.2); background: var(--color-secondary-surface-hover); cursor: default; }
.assoc-row--on { background: rgba(139,92,246,0.04); border-color: rgba(139,92,246,0.25); }
.assoc-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #8b5cf6; }

.navegador--alvo { border-color: rgba(139,92,246,0.3); }

.info-container { display: flex; flex-direction: column; flex: 1; overflow: hidden; gap: 3px; justify-content: center; margin-left: 2px; }
.tags-container { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.file-placeholder { width: 22px; height: 22px; flex-shrink: 0; }
.assoc-toggle { flex-shrink: 0; cursor: pointer; background: none; border: none; padding: 0; }
.assoc-toggle:disabled { opacity: 0.3; cursor: not-allowed; }
.assoc-titulo--off { opacity: 0.4; text-decoration: line-through; }

.assoc-tipo { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; }
.tipo--material { background: rgba(59,130,246,0.12); color: #3b82f6; }
.tipo--atividade { background: rgba(245,158,11,0.12); color: #f59e0b; }
.tipo--avaliacao { background: rgba(139,92,246,0.12); color: var(--color-primary); }
.assoc-titulo { font-size: 11px; font-weight: 700; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.toggle-switch-btn { display: flex; align-items: center; gap: 6px; border: none; background: transparent; cursor: pointer; padding: 0; }
.toggle-switch-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.toggle-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-secondary); opacity: 0.6; transition: color 0.15s; }
.toggle-switch-btn.on .toggle-label { color: var(--color-primary); opacity: 1; }
.toggle-track { width: 24px; height: 14px; border-radius: 7px; background: var(--color-divider); position: relative; transition: all 0.2s; }
.toggle-switch-btn.on .toggle-track { background: #8b5cf6; }
.toggle-thumb { width: 10px; height: 10px; border-radius: 5px; background: white; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; }
.toggle-switch-btn.on .toggle-thumb { transform: translateX(10px); }

.file-btn { width: 22px; height: 22px; flex-shrink: 0; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: var(--color-secondary); transition: all 0.15s; }
.file-btn:hover { color: #3b82f6; background: rgba(59,130,246,0.1); }
.assoc-blocos { display: flex; gap: 4px; flex-wrap: wrap; }
.assoc-bloco-tag { font-size: 8px; font-weight: 700; color: var(--color-primary); background: rgba(139,92,246,0.08); padding: 2px 5px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
.assoc-autor { font-size: 9px; font-weight: 600; color: var(--color-primary); opacity: 0.8; }
.assoc-data { font-size: 9px; font-weight: 600; color: var(--color-secondary); opacity: 0.5; }

.add-btn-mini { padding: 8px 14px; border-radius: 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border: 1px dashed var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); cursor: pointer; transition: all 0.15s; text-align: center; margin: 4px 0; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
.add-btn-mini:hover { border-color: rgba(139,92,246,0.4); color: var(--color-primary); background: rgba(139,92,246,0.05); }
.add-btn-mini--active { border-color: rgba(139,92,246,0.5); border-style: solid; color: #fff; background: linear-gradient(135deg, rgba(124,58,237,0.8), rgba(139,92,246,0.8)); box-shadow: 0 4px 14px rgba(139,92,246,0.25); }

@keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}
.gear-btn { width: 26px; height: 26px; flex-shrink: 0; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: var(--color-secondary); transition: all 0.15s; }
.gear-btn:hover { color: var(--color-primary); background: rgba(139,92,246,0.1); }
</style>
