<template>
    <div class="flex flex-col gap-6">
        <!-- Sub-abas do escopo -->
        <div class="flex items-center gap-2 flex-wrap">
            <button
                v-for="e in escoposList"
                :key="e.key"
                @click="ctx.alternarEscopo(e.key)"
                :class="['escopo-btn', ctx.escopoAtivo.value === e.key ? 'escopo-btn--active' : '']"
            >{{ e.label }}</button>
        </div>

        <div class="flex gap-6" style="min-height: 450px;">
            <!-- Painel esquerdo: itens do escopo -->
            <div class="w-64 flex-shrink-0 flex flex-col gap-2">
                <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest px-1">{{ escopoLabel }}</span>

                <div v-if="ctx.loadingEscopos.value" class="flex items-center gap-2 py-4 px-2">
                    <div class="w-4 h-4 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-[10px] font-bold text-secondary/30">Carregando...</span>
                </div>
                <div v-else-if="ctx.escopos.value.length === 0" class="flex flex-col items-center py-8 gap-1 px-2">
                    <p class="text-xs font-bold text-white/20">Nenhum item</p>
                </div>
                <div v-else class="flex flex-col gap-1 overflow-y-auto">
                    <button
                        v-for="item in ctx.escopos.value"
                        :key="item.id"
                        @click="ctx.selecionarItem(item)"
                        :class="['escopo-item-btn', ctx.escopoSelecionado.value?.id === item.id ? 'escopo-item-btn--active' : '']"
                    >
                        <div class="escopo-item-avatar">{{ (item.nome || "?").charAt(0).toUpperCase() }}</div>
                        <div class="escopo-item-info">
                            <span class="escopo-item-nome">{{ item.nome }}</span>
                            <span v-if="item.descricao" class="escopo-item-desc">{{ item.descricao.replace(/<[^>]*>/g, '').substring(0, 35) }}</span>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Painel direito: todos os conteúdos com toggle -->
            <div class="flex-1 flex flex-col gap-3">
                <div v-if="!ctx.escopoSelecionado.value" class="flex-1 flex flex-col items-center justify-center gap-2">
                    <p class="text-sm font-bold text-white/20">Selecione um item ao lado</p>
                </div>

                <template v-else>
                    <!-- Linha 1: Busca + Tipo (cores do tipo de conteúdo) -->
                    <div class="flex items-center gap-3 flex-wrap">
                        <div class="relative flex-1 max-w-xs">
                            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" width="13" height="13" viewBox="0 0 14 14" fill="none">
                                <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                            <input v-model="ctx.busca.value" placeholder="Buscar conteúdo..." class="busca-input" />
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
                    </div>

                    <!-- Linha 2: Toggles adicionais + contador -->
                    <div class="flex items-center gap-2 flex-wrap">
                        <button
                            @click="ctx.filtroMeus.value = !ctx.filtroMeus.value"
                            :class="['toggle-btn', ctx.filtroMeus.value ? 'toggle-btn--on' : '']"
                        >Só meus</button>
                        <button
                            @click="ctx.mostrarAssociados.value = !ctx.mostrarAssociados.value"
                            :class="['toggle-btn', ctx.mostrarAssociados.value ? 'toggle-btn--on' : '']"
                        >Associados</button>
                        <button
                            @click="ctx.mostrarDisponiveis.value = !ctx.mostrarDisponiveis.value"
                            :class="['toggle-btn', ctx.mostrarDisponiveis.value ? 'toggle-btn--on' : '']"
                        >Disponíveis</button>
                        <span class="text-[10px] font-black text-secondary/40 uppercase tracking-widest ml-auto">
                            {{ ctx.conteudosAssoc.value.filter(c => c.associado).length }} associados
                            / {{ ctx.conteudosExibidos.value.length }} exibidos
                        </span>
                    </div>

                    <!-- Loading -->
                    <div v-if="ctx.loadingConteudos.value" class="flex items-center gap-2 py-8">
                        <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                        <span class="text-xs font-bold text-secondary/30">Carregando...</span>
                    </div>

                    <!-- Vazia -->
                    <div v-else-if="ctx.conteudosExibidos.value.length === 0" class="flex-1 flex flex-col items-center justify-center gap-2">
                        <p class="text-sm font-bold text-white/20">Nenhum conteúdo encontrado</p>
                        <p class="text-[10px] font-bold text-white/10 uppercase tracking-widest">Tente ajustar os filtros</p>
                    </div>

                    <!-- Lista -->
                    <div v-else class="flex flex-col gap-1 overflow-y-auto">
                        <div
                            v-for="c in ctx.conteudosExibidos.value"
                            :key="c.id"
                            class="assoc-row"
                            :class="{ 'assoc-row--on': c.associado }"
                        >
                            <button
                                @click="ctx.toggleAssociacao(c)"
                                class="assoc-toggle"
                                :class="c.associado ? 'assoc-toggle--on' : ''"
                                :title="c.associado ? 'Remover' : 'Associar'"
                            >
                                <svg v-if="c.associado" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <rect width="12" height="12" rx="3" fill="#7c3aed"/>
                                    <path d="M3.5 6l2 2 3-4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                                <div v-else class="w-[12px] h-[12px] rounded-[3px] border border-white/20" />
                            </button>
                            <span class="assoc-tipo" :class="'tipo--' + c.tipo">{{ c.tipo }}</span>
                            <span class="assoc-titulo">{{ c.titulo }}</span>
                            <div v-if="c.blocos && c.blocos.length > 0" class="assoc-blocos">
                                <span v-for="b in c.blocos" :key="b.id" class="assoc-bloco-tag">{{ b.titulo }}</span>
                            </div>
                            <span v-if="c.criado_por_nome" class="assoc-autor">{{ c.criado_por_nome }}</span>
                            <span v-if="c.criado_em" class="assoc-data">{{ new Date(c.criado_em).toLocaleDateString() }}</span>
                            <span v-if="c.criado_em" class="assoc-data">{{ new Date(c.criado_em).toLocaleDateString() }}</span>
                    </div>
                </template>
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
/* ── Sub-abas ──────────────────────────────── */
.escopo-btn {
    padding: 6px 16px; border-radius: 8px;
    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.35);
    cursor: pointer; transition: all 0.15s;
}
.escopo-btn:hover { color: rgba(255,255,255,0.6); }
.escopo-btn--active { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.3); color: #a78bfa; }

/* ── Busca ─────────────────────────────────── */
.busca-input {
    width: 100%; padding: 8px 12px 8px 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: #e8e6f0; font-size: 12px; font-weight: 700;
    transition: all 0.15s; outline: none;
}
.busca-input:focus { border-color: rgba(139,92,246,0.35); }
.busca-input::placeholder { color: rgba(255,255,255,0.2); }

/* ── Filtro tipo (cores) ───────────────────── */
.filtro-chip {
    padding: 5px 12px; border-radius: 7px;
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    border: 1px solid rgba(255,255,255,0.06);
    background: transparent; color: rgba(255,255,255,0.3);
    cursor: pointer; transition: all 0.15s;
}
.filtro-chip:hover { color: rgba(255,255,255,0.5); }
.filtro-chip--active { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
.tipo--todos.filtro-chip--active,
.tipo-todos { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.25); color: #a78bfa; }
.tipo-material { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.25); color: #93c5fd; }
.tipo-atividade { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.25); color: #fcd34d; }
.tipo-avaliacao { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.25); color: #c4b5fd; }

/* ── Toggle buttons (violet) ───────────────── */
.toggle-btn {
    padding: 5px 14px; border-radius: 7px;
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    border: 1px solid rgba(255,255,255,0.06);
    background: transparent; color: rgba(255,255,255,0.3);
    cursor: pointer; transition: all 0.15s;
}
.toggle-btn:hover { color: rgba(255,255,255,0.5); }
.toggle-btn--on { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.3); color: #a78bfa; }

/* ── Item do escopo ────────────────────────── */
.escopo-item-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px;
    border: 1px solid transparent;
    background: transparent; cursor: pointer; transition: all 0.15s;
    width: 100%; text-align: left;
}
.escopo-item-btn:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); }
.escopo-item-btn--active { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.2); }

.escopo-item-avatar {
    width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
    background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15);
    color: #a78bfa; font-size: 11px; font-weight: 900;
    display: flex; align-items: center; justify-content: center;
}
.escopo-item-info { overflow: hidden; flex: 1; }
.escopo-item-nome { font-size: 12px; font-weight: 700; color: rgba(232,230,240,0.8); display: block; }
.escopo-item-desc { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.25); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Conteúdos ─────────────────────────────── */
.assoc-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px;
    border: 1px solid transparent;
    transition: all 0.15s;
}
.assoc-row:hover { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); }
.assoc-row--on { background: rgba(139,92,246,0.04); border-color: rgba(139,92,246,0.12); }

.assoc-toggle {
    width: 24px; height: 24px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; cursor: pointer;
    transition: all 0.15s; border-radius: 4px;
}
.assoc-toggle:hover { background: rgba(255,255,255,0.05); }
.assoc-toggle--on:hover { background: rgba(239,68,68,0.1); }

.assoc-tipo {
    font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.08em; padding: 2px 7px; border-radius: 5px;
    flex-shrink: 0;
}
.tipo--material   { background: rgba(59,130,246,0.12); color: #93c5fd; }
.tipo--atividade  { background: rgba(245,158,11,0.12); color: #fcd34d; }
.tipo--avaliacao  { background: rgba(139,92,246,0.12); color: #c4b5fd; }

.assoc-titulo { font-size: 12px; font-weight: 700; color: rgba(232,230,240,0.8); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.assoc-blocos { display: flex; gap: 4px; flex-wrap: wrap; }
.assoc-bloco-tag { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; background: rgba(139,92,246,0.06); color: rgba(139,92,246,0.5); border: 1px solid rgba(139,92,246,0.1); } .assoc-autor { font-size: 10px; font-weight: 600; color: rgba(139,92,246,0.5); margin-left: auto; flex-shrink: 0; } .assoc-data { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.2); flex-shrink: 0; }
</style>
