<template>
    <div class="flex flex-col gap-6">
        <!-- Sub-abas do escopo -->
        <div class="flex items-center justify-between border-b border-divider pb-2">
            <div class="flex items-center gap-5">
                <button
                    v-for="e in escoposList"
                    :key="e.key"
                    @click="ctx.alternarEscopo(e.key)"
                    :class="['sub-tab-link', ctx.escopoAtivo.value === e.key ? 'sub-tab-link--active' : '']"
                >{{ e.label }}</button>
            </div>
        </div>

        <div class="flex gap-5" style="height: calc(100vh - 200px); min-height: 500px;">
            <!-- Painel esquerdo: itens do escopo -->
            <div
                :class="ctx.escopoSelecionado.value ? 'w-80 flex-shrink-0' : 'flex-1'"
                class="flex flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative transition-all duration-300"
            >
                <div class="px-5 py-4 border-b border-divider bg-div-15 flex items-center justify-between">
                    <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Selecionar {{ escopoLabel }}</span>
                    <span class="text-[9px] font-black text-secondary/60 bg-div-30 px-2 py-0.5 rounded-full border border-divider">{{ ctx.escopos.value.length }}</span>
                </div>

                <div v-if="ctx.loadingEscopos.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                    <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Carregando...</span>
                </div>
                <div v-else-if="ctx.escopos.value.length === 0" class="flex-1 flex flex-col items-center justify-center gap-2 empty-state">
                    <div class="empty-icon-wrap !w-12 !h-12 !mb-2">
                        <Icon name="ph:folder-simple-dashed-duotone" class="w-6 h-6 text-secondary/40" />
                    </div>
                    <p class="text-xs font-bold text-secondary/60">Nenhum item</p>
                </div>
                <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">
                    <button
                        v-for="item in ctx.escopos.value"
                        :key="item.id"
                        @click="ctx.selecionarItem(item)"
                        :class="['escopo-item-btn', ctx.escopoSelecionado.value?.id === item.id ? 'escopo-item-btn--active' : '']"
                    >
                        <div class="escopo-accent" />
                        <div class="escopo-item-avatar">{{ (item.nome || "?").charAt(0).toUpperCase() }}</div>
                        <div class="escopo-item-info">
                            <span class="escopo-item-nome">{{ item.nome }}</span>
                            <span v-if="item.descricao" class="escopo-item-desc">{{ item.descricao.replace(/<[^>]*>/g, '').substring(0, 35) }}</span>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Painel direito: todos os conteúdos com toggle -->
            <div
                v-if="ctx.escopoSelecionado.value"
                class="flex-1 flex flex-col bg-secondary-surface border border-divider rounded-2xl overflow-hidden shadow-sm relative"
                style="animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);"
            >
                <!-- Header do painel direito: Controles e busca -->
                <div class="px-5 py-4 border-b border-divider bg-div-15 flex flex-col gap-3">
                    <div class="flex items-center gap-3">
                        <div class="flex-1 flex items-center gap-2 text-sm font-bold text-text">
                            <span class="text-secondary/60 text-[10px] font-black uppercase tracking-widest bg-div-30 px-2 py-0.5 rounded-full border border-divider">Atribuindo a</span>
                            {{ ctx.escopoSelecionado.value.nome }}
                        </div>
                        <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest ml-auto">
                            {{ ctx.conteudosAssoc.value.filter(c => c.associado).length }} associados
                            / {{ ctx.conteudosExibidos.value.length }} exibidos
                        </span>
                    </div>
                    
                    <div class="filter-bar !mb-0 !border-0 !bg-div-15 !p-3">
                        <div class="relative flex-1 min-w-[200px]">
                            <Icon name="ph:magnifying-glass-light" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/40 pointer-events-none" />
                            <input v-model="ctx.busca.value" placeholder="Buscar conteúdo..." class="busca-input !py-2" />
                        </div>
                        <div class="flex gap-1">
                            <button
                                v-for="t in tiposFiltro" :key="t.value"
                                @click="filtrarPorTipo(t.value)"
                                :class="[
                                    'filtro-chip',
                                    ctx.filtroTipo.value === t.value || (!ctx.filtroTipo.value && t.value === 'todos')
                                        ? 'filtro-chip--active tipo-' + (t.value || 'todos')
                                        : ''
                                ]"
                            >{{ t.label }}</button>
                        </div>
                        
                        <div class="w-px h-6 bg-divider mx-2 max-xl:hidden xl:block"></div>
                        
                        <div class="flex items-center gap-1.5 max-xl:hidden xl:flex">
                            <button
                                @click="ctx.mostrarAssociados.value = !ctx.mostrarAssociados.value"
                                :class="['toggle-btn', ctx.mostrarAssociados.value ? 'toggle-btn--on' : '']"
                            >Associados</button>
                            <button
                                @click="ctx.mostrarDisponiveis.value = !ctx.mostrarDisponiveis.value"
                                :class="['toggle-btn', ctx.mostrarDisponiveis.value ? 'toggle-btn--on' : '']"
                            >Disponíveis</button>
                            <button
                                @click="ctx.filtroMeus.value = !ctx.filtroMeus.value"
                                :class="['toggle-btn', ctx.filtroMeus.value ? 'toggle-btn--on' : '']"
                            >Só Meus</button>
                        </div>
                    </div>
                </div>

                <!-- Loading -->
                <div v-if="ctx.loadingConteudos.value" class="flex-1 flex flex-col items-center justify-center gap-3">
                    <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Carregando conteúdos...</span>
                </div>

                <!-- Vazia -->
                <div v-else-if="ctx.conteudosExibidos.value.length === 0" class="flex-1 flex flex-col items-center justify-center gap-2 empty-state">
                    <p class="text-sm font-bold text-secondary/60">Nenhum conteúdo encontrado</p>
                    <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest mt-1">Tente ajustar os filtros acima</p>
                </div>

                <!-- Lista -->
                <div v-else class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">
                    <div
                        v-for="c in ctx.conteudosExibidos.value"
                        :key="c.id"
                        class="assoc-row"
                        :class="{ 'assoc-row--on': c.associado }"
                        @click="ctx.toggleAssociacao(c)"
                    >
                        <div class="assoc-accent" v-if="c.associado" />
                        <button
                            class="assoc-toggle"
                            :class="c.associado ? 'assoc-toggle--on' : ''"
                            :title="c.associado ? 'Remover' : 'Associar'"
                        >
                            <Icon v-if="c.associado" name="ph:check-square-fill" class="w-4 h-4 text-primary" />
                            <div v-else class="w-3.5 h-3.5 rounded border border-divider transition-colors group-hover:border-primary/40" />
                        </button>
                        <span class="assoc-tipo" :class="'tipo--' + c.tipo">{{ c.tipo }}</span>
                        <span class="assoc-titulo">{{ c.titulo }}</span>
                        
                        <div class="flex items-center gap-3 ml-auto">
                            <div v-if="c.blocos && c.blocos.length > 0" class="assoc-blocos max-md:hidden md:flex">
                                <span v-for="b in c.blocos" :key="b.id" class="assoc-bloco-tag">{{ b.titulo }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-secondary/50 max-lg:hidden lg:flex">
                                <span v-if="c.criado_por_nome" class="assoc-autor">{{ c.criado_por_nome }}</span>
                                <span v-if="c.criado_em" class="assoc-data">{{ new Date(c.criado_em).toLocaleDateString() }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useProgAtividadesCore } from "~/composables/programacao_atividades/useProgAtividadesCore";
import { useProgAtividadesDistribuicao } from "~/composables/programacao_atividades/useProgAtividadesDistribuicao";
import { useToast } from "~/composables/useToast";

const escoposList = [
    { key: "area" as const, label: "Áreas" },
    { key: "curso" as const, label: "Cursos" },
    { key: "modulo" as const, label: "Módulos" },
    { key: "componente" as const, label: "Componentes" },
];

const tiposFiltro = [
    { value: "todos", label: "Todos" },
    { value: "material", label: "Material" },
    { value: "atividade", label: "Atividade" },
    { value: "avaliacao", label: "Questionário" },
];

const core = useProgAtividadesCore();
const toast = useToast();

const ctx = useProgAtividadesDistribuicao({
    getEntidadeAtivaId: () => core.getEntidadeAtivaId(),
    garantirEntidade: () => core.garantirEntidade(),
    toast,
});

const escopoLabel = computed(() => {
    const found = escoposList.find((e) => e.key === ctx.escopoAtivo.value);
    return found ? found.label : "";
});

function filtrarPorTipo(valor: string | null) {
    ctx.filtroTipo.value = valor === "todos" ? null : valor;
}

onMounted(() => ctx.fetchEscopos());
</script>

<style scoped>
.sub-tab-link { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-secondary); opacity: 0.7; background: transparent; border: none; padding: 0 0 12px 0; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; margin-bottom: -1px; }
.sub-tab-link:hover { opacity: 1; color: var(--color-text); }
.sub-tab-link--active { color: var(--color-primary); border-bottom-color: var(--color-primary); opacity: 1; }

.empty-state { text-align: center; }
.empty-icon-wrap { width: 56px; height: 56px; border-radius: 16px; background: rgba(139,92,246,0.07); border: 1px solid rgba(139,92,246,0.14); color: var(--color-primary); opacity: 0.6; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; margin-left: auto; margin-right: auto;}
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; border-radius: 12px; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 10px; }

.busca-input {
    width: 100%; padding: 8px 12px 8px 32px; border-radius: 8px;
    border: 1px solid var(--field-border);
    background: var(--field-bg);
    color: var(--field-text); font-size: 12px; font-weight: 700;
    transition: all 0.15s; outline: none;
}
.busca-input:focus { border-color: rgba(139,92,246,0.35); }
.busca-input::placeholder { color: var(--color-secondary); opacity: 0.4; }

.filtro-chip {
    padding: 5px 12px; border-radius: 7px;
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    border: 1px solid var(--color-divider);
    background: var(--color-secondary-surface); color: var(--color-secondary);
    cursor: pointer; transition: all 0.15s;
}
.filtro-chip:hover { color: var(--color-text); background: var(--color-secondary-surface-hover); }
.filtro-chip--active { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.25); color: var(--color-primary); }

.toggle-btn {
    padding: 5px 14px; border-radius: 7px;
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    border: 1px solid var(--color-divider);
    background: var(--color-secondary-surface); color: var(--color-secondary);
    cursor: pointer; transition: all 0.15s;
}
.toggle-btn:hover { color: var(--color-text); background: var(--color-secondary-surface-hover); }
.toggle-btn--on { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.3); color: var(--color-primary); }

.escopo-item-btn {
    position: relative;
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid var(--color-divider);
    background: var(--color-secondary-surface); cursor: pointer; transition: all 0.2s ease;
    width: 100%; text-align: left;
    overflow: hidden;
}
.escopo-item-btn:hover { background: var(--color-secondary-surface-hover); border-color: rgba(139,92,246,0.2); transform: translateY(-1px); }
.escopo-item-btn--active { background: rgba(139,92,246,0.06); border-color: rgba(139,92,246,0.3); }
.escopo-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--color-primary); opacity: 0; transition: opacity 0.2s ease; }
.escopo-item-btn--active .escopo-accent { opacity: 1; }

.escopo-item-avatar {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15);
    color: var(--color-primary); font-size: 13px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}
.escopo-item-info { overflow: hidden; flex: 1; }
.escopo-item-nome { font-size: 12px; font-weight: 800; color: var(--color-text); display: block; }
.escopo-item-desc { font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.6; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;}

.assoc-row {
    position: relative;
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 12px;
    border: 1px solid var(--color-divider);
    background: var(--color-secondary-surface);
    transition: all 0.2s ease;
    cursor: pointer;
    overflow: hidden;
}
.assoc-row:hover { background: var(--color-secondary-surface-hover); border-color: rgba(139,92,246,0.2); transform: translateY(-1px); }
.assoc-row--on { background: rgba(139,92,246,0.05); border-color: rgba(139,92,246,0.25); }
.assoc-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #8b5cf6; }

.assoc-toggle {
    width: 24px; height: 24px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; cursor: pointer;
    transition: all 0.15s; border-radius: 4px; pointer-events: none;
}

.assoc-tipo {
    font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.08em; padding: 2px 7px; border-radius: 5px;
    flex-shrink: 0;
}
.tipo--material   { background: rgba(59,130,246,0.12); color: #3b82f6; }
.tipo--atividade  { background: rgba(245,158,11,0.12); color: #f59e0b; }
.tipo--avaliacao  { background: rgba(139,92,246,0.12); color: var(--color-primary); }

.assoc-titulo { font-size: 12px; font-weight: 700; color: var(--color-text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.assoc-blocos { display: flex; gap: 4px; flex-wrap: wrap; }
.assoc-bloco-tag { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; background: rgba(139,92,246,0.08); color: var(--color-primary); border: 1px solid rgba(139,92,246,0.15); } 
.assoc-autor { font-size: 10px; font-weight: 600; color: var(--color-primary); opacity: 0.8; margin-left: 8px; flex-shrink: 0; } 
.assoc-data { font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.5; flex-shrink: 0; margin-left: 4px; }

@keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}
</style>
