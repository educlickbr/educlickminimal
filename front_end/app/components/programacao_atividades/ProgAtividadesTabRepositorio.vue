<template>
    <div class="flex flex-col gap-6">
        <!-- Topo: Sub-abas discretas e Botão Novo -->
        <div class="flex items-center justify-between border-b border-divider">
            <div class="flex items-center gap-5 h-full">
                <button
                    @click="ctx.alternarVisao('conteudos')"
                    :class="['sub-tab-link', ctx.visao.value === 'conteudos' ? 'sub-tab-link--active' : '']"
                >Conteúdos</button>
                <button
                    @click="ctx.alternarVisao('blocos')"
                    :class="['sub-tab-link', ctx.visao.value === 'blocos' ? 'sub-tab-link--active' : '']"
                >Blocos</button>
            </div>

            <div class="pb-3">
                <button v-if="ctx.visao.value === 'conteudos'" @click="ctx.openNovoConteudo()" class="ds-btn-primary">
                    <Icon name="ph:plus-bold" class="w-3.5 h-3.5" />
                    <span>Novo Conteúdo</span>
                </button>
                <button v-else @click="ctx.openNovoBloco()" class="ds-btn-primary">
                    <Icon name="ph:plus-bold" class="w-3.5 h-3.5" />
                    <span>Novo Bloco</span>
                </button>
            </div>
        </div>

        <!-- VISÃO: CONTEÚDOS -->
        <template v-if="ctx.visao.value === 'conteudos'">
            <div class="filter-bar">
                <div class="relative flex-1 max-w-sm">
                    <Icon name="ph:magnifying-glass-light" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/40 pointer-events-none" />
                    <input v-model="ctx.busca.value" placeholder="Buscar conteúdo..." class="busca-input" />
                </div>
                <div class="flex gap-1">
                    <button v-for="t in tiposFiltro" :key="t.value" @click="filtrarPorTipo(t.value)"
                        :class="['filtro-chip', ctx.filtroTipo.value === t.value || (!ctx.filtroTipo.value && t.value === 'todos') ? 'filtro-chip--active' : '']"
                    >{{ t.label }}</button>
                </div>
                <label class="flex items-center gap-1.5 text-[10px] font-bold text-secondary/60 cursor-pointer whitespace-nowrap">
                    <input v-model="ctx.filtroMeus.value" type="checkbox" class="accent-primary" /> Só meus
                </label>
            </div>

            <div v-if="ctx.loadingConteudos.value" class="py-16 flex flex-col items-center justify-center gap-3">
                <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">Carregando...</span>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-if="ctx.conteudos.value.length === 0" class="col-span-full empty-state">
                    <div class="empty-icon-wrap">
                        <Icon name="ph:file-dashed-duotone" class="w-8 h-8 text-secondary/40" />
                    </div>
                    <p class="text-sm font-bold text-secondary/60">Nenhum conteúdo encontrado</p>
                    <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Tente ajustar os filtros ou crie um novo conteúdo</p>
                </div>

                <div v-for="c in ctx.conteudos.value" :key="c.id" class="item-card" @click="ctx.openEditarConteudo(c)">
                    <div class="item-accent-bar" />
                    <div class="item-card-inner">
                        <div class="item-card-header">
                            <div class="item-tipo-badge" :class="'tipo--' + c.tipo">{{ c.tipo }}</div>
                            <div class="item-card-actions" @click.stop>
                                <button @click="ctx.openEditarConteudo(c)" class="action-btn action-edit" title="Editar">
                                    <Icon name="ph:pencil-simple-bold" class="w-3.5 h-3.5" />
                                </button>
                                <button @click="ctx.confirmDelete(c.id, 'conteudo')" class="action-btn action-delete" title="Excluir">
                                    <Icon name="ph:trash-bold" class="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <p class="item-titulo">{{ c.titulo }}</p>
                        <p v-if="c.descricao" class="item-desc">{{ c.descricao.replace(/<[^>]*>/g, '').substring(0, 100) }}</p>
                        <div class="item-meta">
                            <span v-if="c.criado_por_nome" class="item-meta-autor">{{ c.criado_por_nome }}</span>
                            <span v-if="c.criado_em" class="item-meta-data">{{ new Date(c.criado_em).toLocaleDateString() }}</span>
                        </div>
                        <div v-if="c.blocos && c.blocos.length > 0" class="item-blocos">
                            <span class="item-blocos-label">Blocos:</span>
                            <span v-for="b in c.blocos" :key="b.id" class="item-bloco-tag">{{ b.titulo }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="ctx.totalPaginas.value > 1" class="flex items-center justify-center gap-2 pt-2">
                <button @click="ctx.irParaPagina(ctx.pagina.value - 1)" :disabled="ctx.pagina.value <= 1" class="pag-btn">‹</button>
                <span class="text-[11px] font-bold text-secondary/60">{{ ctx.pagina.value }} / {{ ctx.totalPaginas.value }}</span>
                <button @click="ctx.irParaPagina(ctx.pagina.value + 1)" :disabled="ctx.pagina.value >= ctx.totalPaginas.value" class="pag-btn">›</button>
            </div>
        </template>

        <!-- VISÃO: BLOCOS -->
        <template v-else>
            <div v-if="ctx.loadingBlocos.value" class="py-16 flex items-center justify-center">
                <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-if="ctx.blocos.value.length === 0" class="col-span-full empty-state">
                    <div class="empty-icon-wrap">
                        <Icon name="ph:folder-simple-dashed-duotone" class="w-8 h-8 text-secondary/40" />
                    </div>
                    <p class="text-sm font-bold text-secondary/60">Nenhum bloco criado</p>
                    <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Clique em "Novo Bloco" para começar</p>
                </div>

                <div v-for="b in ctx.blocos.value" :key="b.id" class="item-card" :class="{ 'item-card--expanded': ctx.expandedBlocoId.value === b.id }">
                    <div class="item-accent-bar" :style="b.cor_ident ? { background: b.cor_ident } : undefined" />
                    <div class="item-card-inner">
                        <div class="item-card-header">
                            <div class="item-avatar" :style="b.cor_ident ? { background: b.cor_ident + '22', borderColor: b.cor_ident + '44', color: b.cor_ident } : {}">{{ (b.titulo || "?").charAt(0).toUpperCase() }}</div>
                            <div class="item-card-actions" @click.stop>
                                <button @click="ctx.toggleExpandir(b.id)" class="action-btn" title="Ver conteúdos">
                                    <Icon name="ph:caret-down-bold" class="w-3.5 h-3.5 transition-transform duration-150" :class="{ 'rotate-180': ctx.expandedBlocoId.value === b.id }" />
                                </button>
                                <button @click="ctx.openEditarBloco(b)" class="action-btn action-edit" title="Editar">
                                    <Icon name="ph:pencil-simple-bold" class="w-3.5 h-3.5" />
                                </button>
                                <button @click="ctx.confirmDelete(b.id, 'bloco')" class="action-btn action-delete" title="Excluir">
                                    <Icon name="ph:trash-bold" class="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <p class="item-titulo">{{ b.titulo }}</p>
                        <p v-if="b.descricao" class="item-desc">{{ b.descricao.replace(/<[^>]*>/g, '').substring(0, 100) }}</p>
                        <div class="item-footer"><span class="item-badge">{{ b.qtd_itens }} conteúdo(s)</span></div>
                        <div v-if="ctx.expandedBlocoId.value === b.id" class="item-expand-list">
                            <div v-if="ctx.loadingConteudosDoBloco.value" class="flex items-center gap-2 py-3">
                                <div class="w-4 h-4 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" /><span class="text-[10px] font-bold text-secondary/50">Carregando...</span>
                            </div>
                            <div v-else-if="ctx.conteudosDoBloco.value.length === 0" class="item-expand-empty">Nenhum conteúdo neste bloco</div>
                            <div v-for="item in ctx.conteudosDoBloco.value" :key="item.id" class="item-expand-row">
                                <span class="item-tipo-badge mini" :class="'tipo--' + item.tipo">{{ item.tipo }}</span>
                                <span class="item-expand-title">{{ item.titulo }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Modais -->
        <ModalProgAtividadesConteudo v-model="ctx.showModalConteudo.value"
            :isEdit="ctx.isEditConteudo.value" :initialData="ctx.editConteudoData.value"
            :onSave="ctx.handleSaveConteudo" :blocosDisponiveis="ctx.blocosDisponiveis.value"
            v-model:blocosSelecionados="ctx.blocosSelecionados.value"
            v-model:abaAtiva="ctx.modalAbaAtiva.value"
            :getEntidadeId="() => core.getEntidadeAtivaId()"
            @saved="ctx.fetchConteudos()"
        />
        <ModalProgAtividadesBloco v-model="ctx.showModalBloco.value"
            :isEdit="ctx.isEditBloco.value" :initialData="ctx.editBlocoData.value"
            :onSave="ctx.handleSaveBloco" @saved="ctx.fetchBlocos()"
        />
        <GlobalModalConfirmacao v-model="ctx.showConfirmDelete.value"
            title="Excluir"
            :message="ctx.deleteTargetType.value === 'conteudo' ? 'Este conteúdo será removido de todos os blocos associados.' : 'Os conteúdos dentro deste bloco não serão excluídos.'"
            type="danger" confirmText="Excluir" :loading="ctx.isDeleting.value"
            @confirm="ctx.handleDelete()"
        />
    </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useProgAtividadesCore } from "~/composables/programacao_atividades/useProgAtividadesCore";
import { useProgAtividadesRepositorio } from "~/composables/programacao_atividades/useProgAtividadesRepositorio";
import { useToast } from "~/composables/useToast";
import ModalProgAtividadesConteudo from "~/components/programacao_atividades/ModalProgAtividadesConteudo.vue";
import ModalProgAtividadesBloco from "~/components/programacao_atividades/ModalProgAtividadesBloco.vue";

const core = useProgAtividadesCore();
const toast = useToast();

const ctx = useProgAtividadesRepositorio({
    getEntidadeAtivaId: () => core.getEntidadeAtivaId(),
    garantirEntidade: () => core.garantirEntidade(),
    toast,
});

const tiposFiltro = [
    { value: "todos", label: "Todos" },
    { value: "material", label: "Material" },
    { value: "atividade", label: "Atividade" },
    { value: "avaliacao", label: "Questionário" },
];

function filtrarPorTipo(valor: string | null) {
    ctx.filtroTipo.value = valor === "todos" ? null : valor;
}

onMounted(() => { ctx.fetchConteudos(); ctx.fetchBlocos(); });
</script>

<style scoped>
.sub-tab-link { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-secondary); opacity: 0.7; background: transparent; border: none; padding: 0 0 12px 0; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; margin-bottom: -1px; }
.sub-tab-link:hover { opacity: 1; color: var(--color-text); }
.sub-tab-link--active { color: var(--color-primary); border-bottom-color: var(--color-primary); opacity: 1; }
.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; padding: 10px 14px; background: var(--color-secondary-surface); border: 1px solid var(--color-divider); border-radius: 12px; flex-shrink: 0; }
.busca-input { width: 100%; padding: 9px 14px 9px 36px; border-radius: 10px; border: 1px solid var(--field-border); background: var(--field-bg); color: var(--field-text); font-size: 12px; font-weight: 700; transition: all 0.15s; outline: none; }
.busca-input:focus { border-color: rgba(139,92,246,0.35); background: rgba(139,92,246,0.04); }
.busca-input::placeholder { color: var(--color-secondary); opacity: 0.4; }
.filtro-chip { padding: 5px 12px; border-radius: 7px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); cursor: pointer; transition: all 0.15s; }
.filtro-chip:hover { color: var(--color-text); background: var(--color-secondary-surface-hover); }
.filtro-chip--active { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.25); color: var(--color-primary); }
.item-card { position: relative; background: var(--color-secondary-surface); border: 1px solid var(--color-divider); border-radius: 14px; overflow: hidden; cursor: pointer; transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
.item-card:hover { border-color: rgba(139, 92, 246, 0.28); transform: translateY(-2px); background: var(--color-secondary-surface-hover); }
.item-card--expanded { border-color: rgba(139, 92, 246, 0.3); }
.item-accent-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--color-primary); opacity: 0; transition: opacity 0.2s ease; }
.item-card:hover .item-accent-bar { opacity: 1; }
.item-card-inner { padding: 16px 18px 14px 20px; display: flex; flex-direction: column; gap: 8px; }
.item-card-header { display: flex; align-items: center; gap: 8px; }
.item-card-actions { margin-left: auto; display: flex; gap: 6px; opacity: 0; transition: opacity 0.15s ease; }
.item-card:hover .item-card-actions { opacity: 1; }
.action-btn { width: 28px; height: 28px; border-radius: 8px; border: none; background: var(--color-secondary-surface-hover); color: var(--color-secondary); font-size: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.action-edit:hover { background: rgba(139,92,246,0.18); color: var(--color-primary); }
.action-delete:hover { background: rgba(239,68,68,0.15); color: #ef4444; }
.item-avatar { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); color: var(--color-primary); font-size: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
.item-tipo-badge { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 6px; flex-shrink: 0; }
.item-tipo-badge.mini { font-size: 8px; padding: 2px 7px; }
.tipo--material { background: rgba(59,130,246,0.12); color: #3b82f6; }
.tipo--atividade { background: rgba(245,158,11,0.12); color: #f59e0b; }
.tipo--avaliacao { background: rgba(139,92,246,0.12); color: var(--color-primary); }
.item-titulo { font-size: 13px; font-weight: 900; color: var(--color-text); line-height: 1.3; }
.item-desc { font-size: 11px; font-weight: 600; color: var(--color-secondary); opacity: 0.6; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-meta { display: flex; align-items: center; gap: 10px; }
.item-meta-autor { font-size: 10px; font-weight: 600; color: var(--color-primary); opacity: 0.8; }
.item-meta-data { font-size: 10px; font-weight: 600; color: var(--color-secondary); opacity: 0.5; }
.item-blocos { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.item-blocos-label { font-size: 9px; font-weight: 800; color: var(--color-secondary); opacity: 0.5; text-transform: uppercase; letter-spacing: 0.05em; }
.item-bloco-tag { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: rgba(139,92,246,0.08); color: var(--color-primary); border: 1px solid rgba(139,92,246,0.15); }
.item-footer { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.item-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 8px; border-radius: 6px; background: var(--color-secondary-surface-hover); color: var(--color-secondary); border: 1px solid var(--color-divider); }
.item-expand-list { margin-top: 4px; border-top: 1px solid var(--color-divider); padding-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.item-expand-empty { font-size: 11px; font-weight: 700; color: var(--color-secondary); opacity: 0.5; padding: 12px 0; text-align: center; }
.item-expand-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; background: var(--color-secondary-surface); transition: background 0.15s; }
.item-expand-row:hover { background: var(--color-secondary-surface-hover); }
.item-expand-title { font-size: 11px; font-weight: 700; color: var(--color-text); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 24px; background: var(--color-secondary-surface); border-radius: 14px; border: 1px dashed var(--color-divider); text-align: center; }
.empty-icon-wrap { width: 56px; height: 56px; border-radius: 16px; background: rgba(139,92,246,0.07); border: 1px solid rgba(139,92,246,0.14); color: var(--color-primary); opacity: 0.6; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.pag-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
.pag-btn:hover:not(:disabled) { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.25); color: var(--color-primary); }
.pag-btn:disabled { opacity: 0.3; cursor: default; }
.rotate-180 { transform: rotate(180deg); }
</style>
