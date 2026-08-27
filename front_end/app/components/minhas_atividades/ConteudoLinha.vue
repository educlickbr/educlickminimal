<template>
    <button @click="$emit('select')" class="conteudo-linha" :class="{ 'linha--ativa': ativo, 'linha--off': !disponivel(item) }">
        <span class="tipo" :class="'tipo--' + item.tipo">{{ tipoLabel[item.tipo] || item.tipo }}</span>
        <span class="titulo">{{ item.titulo }}</span>

        <!-- Badges de status -->
        <div class="badges">
            <span v-if="item.concluido" class="badge badge--ok" title="Concluído">✓</span>
            <span v-if="item.status_visibilidade === 'agendado'" class="badge badge--agendado"
                :title="'Disponível a partir de ' + formatData(item.data_disponivel)">⏰</span>
            <span v-if="item.status_visibilidade === 'prazo_encerrado'" class="badge badge--prazo" title="Prazo encerrado">✕</span>
            <span v-if="item.atividade_status === 'rascunho'" class="badge badge--rascunho" title="Rascunho salvo">R</span>
            <span v-if="item.atividade_status === 'entregue' || item.avaliacao_status === 'entregue'" class="badge badge--entregue" title="Entregue">E</span>
            <span v-if="temNota(item)" class="badge badge--nota" :title="tooltipNota(item)">{{ notaExibida(item) }}</span>
        </div>
    </button>
</template>

<script setup lang="ts">
defineProps<{
    item: any;
    ativo?: boolean;
}>();

defineEmits<{
    select: [];
}>();

const tipoLabel: Record<string, string> = {
    material: "Mat",
    atividade: "Atv",
    avaliacao: "Ava",
};

function disponivel(item: any): boolean {
    return item.status_visibilidade === "disponivel";
}

function temNota(item: any): boolean {
    return (item.atividade_nota !== null && item.atividade_nota !== undefined)
        || (item.avaliacao_nota !== null && item.avaliacao_nota !== undefined);
}

function notaExibida(item: any): string {
    const n = item.atividade_nota ?? item.avaliacao_nota;
    return n !== null && n !== undefined ? String(n) : "";
}

function formatData(d: string | null): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function tooltipNota(item: any): string {
    const n = item.atividade_nota ?? item.avaliacao_nota;
    const c = item.atividade_comentario ?? item.avaliacao_comentario;
    const corrigidoEm = item.atividade_corrigido_em ?? item.avaliacao_corrigido_em;
    const corrigidoPor = item.atividade_corrigido_por_nome ?? item.avaliacao_corrigido_por_nome;
    let t = "Nota: " + n;
    if (corrigidoPor || corrigidoEm) {
        t += " · Corrigido" + (corrigidoPor ? " por " + corrigidoPor : "") + (corrigidoEm ? " em " + formatData(corrigidoEm) : "");
    }
    if (c) t += "\nComentário: " + c;
    return t;
}
</script>

<style scoped>
.conteudo-linha {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 10px;
    border-radius: 8px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: all 0.15s ease; text-align: left;
}
.conteudo-linha:hover { background: var(--color-secondary-surface-hover); }
.linha--ativa { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.25); }
.linha--off { opacity: 0.5; }

.tipo { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; }
.tipo--material { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.tipo--atividade { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.tipo--avaliacao { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }

.titulo { font-size: 11px; font-weight: 700; color: var(--color-text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.badges { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.badge { font-size: 8px; font-weight: 900; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.badge--ok { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.badge--agendado { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.badge--prazo { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.badge--rascunho { background: var(--color-secondary-surface-hover); color: var(--color-secondary); font-size: 7px; border: 1px solid var(--color-divider); }
.badge--entregue { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.badge--nota { background: rgba(139, 92, 246, 0.15); color: var(--color-primary); width: auto; padding: 0 5px; border-radius: 6px; }
</style>
