<template>
    <div class="flex flex-col flex-1 min-h-0">
        <!-- Barra de filtros -->
        <div class="px-3 py-2.5 border-b border-divider bg-div-15 flex flex-col gap-2 shrink-0">
            <div class="flex items-center justify-between gap-2">
                <span class="flex items-center gap-1.5 text-[9px] font-black text-secondary/60 uppercase tracking-widest">
                    <Icon name="ph:users-three-duotone" class="w-3.5 h-3.5 text-primary shrink-0" />
                    Alunos com entrega
                </span>
                <span class="text-[9px] font-black text-secondary/60 bg-div-30 px-2 py-0.5 rounded-full border border-divider">{{ ctx.entregasExibidas.value.length }}</span>
            </div>
            <div class="relative">
                <Icon name="ph:magnifying-glass-light" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/40 pointer-events-none" />
                <input v-model="ctx.buscaAluno.value" type="text" placeholder="Buscar aluno..." class="busca-input" />
            </div>
            <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-bold text-secondary/60 uppercase tracking-widest">Status</span>
                <button class="pill" :class="{ 'pill--on': !ctx.soPendentesEntregas.value }" @click="ctx.soPendentesEntregas.value = false">Todas</button>
                <button class="pill" :class="{ 'pill--on': ctx.soPendentesEntregas.value }" @click="ctx.soPendentesEntregas.value = true">Pendentes</button>
            </div>
        </div>

        <!-- Lista -->
        <div class="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1">
            <div v-if="ctx.loadingEntregas.value" class="flex flex-col items-center justify-center py-16 gap-3">
                <div class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                <span class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">Carregando...</span>
            </div>
            <div v-else-if="ctx.entregasExibidas.value.length === 0" class="flex flex-col items-center justify-center py-16 gap-2">
                <Icon name="ph:user-dashed-duotone" class="w-7 h-7 text-secondary/40" />
                <p class="text-[11px] font-bold text-secondary/60">Nenhum aluno encontrado</p>
                <p class="text-[9px] font-bold text-secondary/40 uppercase tracking-widest">Ajuste a busca ou o filtro</p>
            </div>
            <template v-else>
                <button
                    v-for="e in ctx.entregasExibidas.value"
                    :key="e.id_submissao"
                    class="doc-row"
                    :class="{ 'doc-row--ativa': ctx.entregaSelecionada.value?.id_submissao === e.id_submissao }"
                    @click="ctx.selecionarEntrega(e)"
                >
                    <span class="avatar">{{ inicial(e.aluno_nome) }}</span>
                    <span class="doc-titulo">{{ e.aluno_nome }}</span>
                    <span v-if="e.tentativa > 1" class="badge-tentativa" title="Tentativa">T{{ e.tentativa }}</span>
                    <span v-if="e.nota !== null && e.nota !== undefined" class="badge-nota" :title="tooltipCorrigido(e)">{{ e.nota }}</span>
                    <span v-else class="badge-pendente" title="Aguardando correção">Pendente</span>
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

function inicial(nome: string): string {
    if (!nome) return "?";
    const partes = nome.trim().split(/\s+/);
    return (partes[0]?.[0] || "").toUpperCase();
}

function tooltipCorrigido(e: any): string {
    if (e.corrigido_em) {
        const d = new Date(e.corrigido_em);
        const data = d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        return "Corrigido" + (e.corrigido_por_nome ? " por " + e.corrigido_por_nome : "") + " em " + data;
    }
    return "Corrigido";
}
</script>

<style scoped>
.busca-input { width: 100%; padding: 7px 10px 7px 30px; border-radius: 8px; border: 1px solid var(--field-border); background: var(--field-bg); color: var(--field-text); font-size: 11px; font-weight: 600; outline: none; transition: all 0.15s; }
.busca-input:focus { border-color: rgba(139,92,246,0.35); }
.busca-input::placeholder { color: var(--color-secondary); opacity: 0.4; }

.pill { padding: 4px 10px; border-radius: 7px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; }
.pill:hover { color: var(--color-text); background: var(--color-secondary-surface-hover); }
.pill--on { border-color: rgba(139,92,246,0.45); background: rgba(139,92,246,0.1); color: var(--color-primary); }

.doc-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); cursor: pointer; transition: all 0.15s; text-align: left; }
.doc-row:hover { background: var(--color-secondary-surface-hover); border-color: rgba(139,92,246,0.2); }
.doc-row--ativa { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.3); }

.avatar { width: 26px; height: 26px; border-radius: 8px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; flex-shrink: 0; }

.doc-titulo { font-size: 11px; font-weight: 700; color: var(--color-text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.badge-tentativa { font-size: 8px; font-weight: 800; color: var(--color-secondary); opacity: 0.6; background: var(--color-secondary-surface-hover); padding: 2px 6px; border-radius: 5px; flex-shrink: 0; }
.badge-nota { font-size: 9px; font-weight: 900; color: #10b981; background: rgba(16,185,129,0.1); padding: 2px 7px; border-radius: 6px; flex-shrink: 0; }
.badge-pendente { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #f59e0b; background: rgba(245,158,11,0.1); padding: 2px 7px; border-radius: 6px; flex-shrink: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 4px; }
</style>
