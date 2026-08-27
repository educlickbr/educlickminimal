<template>
    <div class="flex flex-col gap-4">
        <!-- Sem programa selecionado -->
        <div v-if="!ctx.programaSelecionado.value" class="flex flex-col gap-3">
            <div class="dash-card">
                <span class="dash-title">
                    <Icon name="ph:lightbulb-bold" class="dash-title-ico w-3.5 h-3.5" />
                    Minhas Atividades
                </span>
                <p class="dash-text">Entre em um curso para ver o resumo das suas atividades, prazos e instruções.</p>
            </div>
        </div>

        <!-- Contexto do curso -->
        <template v-else>
            <!-- Instruções -->
            <div class="dash-card">
                <span class="dash-title">
                    <Icon name="ph:info-bold" class="dash-title-ico w-3.5 h-3.5" />
                    Como funciona
                </span>
                <ul class="dash-list">
                    <li><b>Material</b> — abra o arquivo/link e ele marca como concluído.</li>
                    <li><b>Atividade</b> — responda e clique em <b>Entregar</b>; pode salvar rascunho antes.</li>
                    <li><b>Avaliação</b> — inicie, responda e finalize; o timer mostra o prazo.</li>
                    <li>Fora do prazo o conteúdo fica <b>bloqueado</b> com aviso.</li>
                </ul>
            </div>

            <!-- Por tipo -->
            <div class="dash-card">
                <span class="dash-title">
                    <Icon name="ph:squares-four-bold" class="dash-title-ico w-3.5 h-3.5" />
                    Por tipo
                </span>
                <div class="dash-btns">
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroTipo.value === 'material' }" @click="ctx.toggleFiltroTipo('material')">
                        <span class="dash-dot dash-dot--material" /> Materiais
                        <span class="dash-count">{{ ctx.resumo.value.por_tipo.material }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroTipo.value === 'atividade' }" @click="ctx.toggleFiltroTipo('atividade')">
                        <span class="dash-dot dash-dot--atividade" /> Atividades
                        <span class="dash-count">{{ ctx.resumo.value.por_tipo.atividade }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroTipo.value === 'avaliacao' }" @click="ctx.toggleFiltroTipo('avaliacao')">
                        <span class="dash-dot dash-dot--avaliacao" /> Avaliações
                        <span class="dash-count">{{ ctx.resumo.value.por_tipo.avaliacao }}</span>
                    </button>
                </div>
            </div>

            <!-- Status -->
            <div class="dash-card">
                <span class="dash-title">
                    <Icon name="ph:chart-bar-bold" class="dash-title-ico w-3.5 h-3.5" />
                    Status
                </span>
                <div class="dash-btns dash-btns--grid">
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'concluidos' }" @click="ctx.toggleFiltroStatus('concluidos')">
                        <Icon name="ph:check-bold" class="dash-ico w-3 h-3" />
                        Concluídos <span class="dash-count">{{ ctx.resumo.value.por_status.concluidos }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'pendentes' }" @click="ctx.toggleFiltroStatus('pendentes')">
                        <Icon name="ph:clock-bold" class="dash-ico w-3 h-3" />
                        Pendentes <span class="dash-count">{{ ctx.resumo.value.por_status.pendentes }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'prazos' }" @click="ctx.toggleFiltroStatus('prazos')">
                        <Icon name="ph:hourglass-medium-bold" class="dash-ico w-3 h-3" />
                        Prazo ≤7d <span class="dash-count">{{ ctx.resumo.value.por_status.prazos }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'rascunhos' }" @click="ctx.toggleFiltroStatus('rascunhos')">
                        <Icon name="ph:pencil-simple-line-bold" class="dash-ico w-3 h-3" />
                        Rascunhos <span class="dash-count">{{ ctx.resumo.value.por_status.rascunhos }}</span>
                    </button>
                </div>
                <div v-if="ctx.resumo.value.por_status.agendados || ctx.resumo.value.por_status.encerrados" class="dash-obs">
                    <span v-if="ctx.resumo.value.por_status.agendados">
                        <Icon name="ph:calendar-blank-bold" class="w-3 h-3 text-secondary/60" />
                        {{ ctx.resumo.value.por_status.agendados }} agendado(s)
                    </span>
                    <span v-if="ctx.resumo.value.por_status.encerrados">
                        <Icon name="ph:x-circle-bold" class="w-3 h-3 text-secondary/60" />
                        {{ ctx.resumo.value.por_status.encerrados }} encerrado(s)
                    </span>
                </div>
            </div>

            <!-- Por escopo -->
            <div v-if="ctx.resumo.value.por_escopo.length > 0" class="dash-card">
                <span class="dash-title">
                    <Icon name="ph:folder-open-bold" class="dash-title-ico w-3.5 h-3.5" />
                    Por escopo
                </span>
                <div class="dash-btns">
                    <button v-for="e in ctx.resumo.value.por_escopo" :key="e.chave" class="dash-escopo" @click="ctx.irParaEscopo(e.chave)">
                        <span class="dash-escopo-nome">{{ e.nome }}</span>
                        <span class="dash-count">{{ e.total }}</span>
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useMinhasAtividades } from "~/composables/programacao_atividades/useMinhasAtividades";

defineProps<{
    ctx: ReturnType<typeof useMinhasAtividades>;
}>();
</script>

<style scoped>
.dash-card {
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 14px;
    padding: 12px 14px;
}
.dash-title {
    font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--color-secondary); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
}
.dash-title-ico { color: var(--color-primary); flex-shrink: 0; }
.dash-text { font-size: 11px; font-weight: 600; color: var(--color-secondary); line-height: 1.5; }
.dash-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.dash-list li { font-size: 10.5px; font-weight: 600; color: var(--color-secondary); line-height: 1.45; }
.dash-list b { color: var(--color-text); }
.dash-btns { display: flex; flex-direction: column; gap: 5px; }
.dash-btns--grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.dash-btn {
    display: flex; align-items: center; gap: 6px; width: 100%; padding: 7px 10px;
    border-radius: 8px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface);
    color: var(--color-secondary); font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.15s; text-align: left;
}
.dash-btn:hover { border-color: rgba(139,92,246,0.3); color: var(--color-text); background: var(--color-secondary-surface-hover); }
.dash-btn--on { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.12); color: var(--color-primary); }
.dash-ico { flex-shrink: 0; color: var(--color-primary); }
.dash-btn--on .dash-ico { color: var(--color-primary); }
.dash-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dash-dot--material { background: #3b82f6; }
.dash-dot--atividade { background: #10b981; }
.dash-dot--avaliacao { background: #f59e0b; }
.dash-count { margin-left: auto; font-size: 9px; font-weight: 900; color: var(--color-secondary); background: var(--color-secondary-surface-hover); padding: 1px 7px; border-radius: 6px; flex-shrink: 0; }
.dash-btn--on .dash-count { color: var(--color-primary); background: rgba(139,92,246,0.18); }
.dash-obs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; padding-top: 7px; border-top: 1px dashed var(--color-divider); font-size: 9.5px; font-weight: 700; color: var(--color-secondary); }
.dash-obs span { display: inline-flex; align-items: center; gap: 4px; }
.dash-escopo { display: flex; align-items: center; gap: 7px; width: 100%; padding: 6px 10px; border-radius: 8px; border: none; background: transparent; color: var(--color-secondary); font-size: 10.5px; font-weight: 700; cursor: pointer; transition: all 0.15s; text-align: left; }
.dash-escopo:hover { background: var(--color-secondary-surface-hover); color: var(--color-text); }
.dash-escopo-nome { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
