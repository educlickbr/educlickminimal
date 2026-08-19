<template>
    <div class="flex flex-col gap-4">
        <!-- Sem programa selecionado -->
        <div v-if="!ctx.programaSelecionado.value" class="flex flex-col gap-3">
            <div class="dash-card">
                <span class="dash-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dash-title-ico"><path d="M9 18h6M10 21h4"></path><path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z"></path></svg>
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dash-title-ico"><path d="M9 18h6M10 21h4"></path><path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z"></path></svg>
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dash-title-ico"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"></path><path d="M3 8l9 5 9-5"></path><path d="M12 13v8"></path></svg>
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dash-title-ico"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    Status
                </span>
                <div class="dash-btns dash-btns--grid">
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'concluidos' }" @click="ctx.toggleFiltroStatus('concluidos')">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="dash-ico"><path d="M20 6L9 17l-5-5"></path></svg>
                        Concluídos <span class="dash-count">{{ ctx.resumo.value.por_status.concluidos }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'pendentes' }" @click="ctx.toggleFiltroStatus('pendentes')">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dash-ico"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Pendentes <span class="dash-count">{{ ctx.resumo.value.por_status.pendentes }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'prazos' }" @click="ctx.toggleFiltroStatus('prazos')">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dash-ico"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M5 3L2 6"></path><path d="M22 6l-3-3"></path></svg>
                        Prazo ≤7d <span class="dash-count">{{ ctx.resumo.value.por_status.prazos }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroStatus.value === 'rascunhos' }" @click="ctx.toggleFiltroStatus('rascunhos')">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dash-ico"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        Rascunhos <span class="dash-count">{{ ctx.resumo.value.por_status.rascunhos }}</span>
                    </button>
                </div>
                <div v-if="ctx.resumo.value.por_status.agendados || ctx.resumo.value.por_status.encerrados" class="dash-obs">
                    <span v-if="ctx.resumo.value.por_status.agendados">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {{ ctx.resumo.value.por_status.agendados }} agendado(s)
                    </span>
                    <span v-if="ctx.resumo.value.por_status.encerrados">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                        {{ ctx.resumo.value.por_status.encerrados }} encerrado(s)
                    </span>
                </div>
            </div>

            <!-- Por escopo -->
            <div v-if="ctx.resumo.value.por_escopo.length > 0" class="dash-card">
                <span class="dash-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dash-title-ico"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
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
.dash-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 12px 14px; }
.dash-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.dash-title-ico { color: #c4b5fd; flex-shrink: 0; }
.dash-text { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); line-height: 1.5; }
.dash-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.dash-list li { font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,0.45); line-height: 1.45; }
.dash-list b { color: rgba(255,255,255,0.75); }
.dash-btns { display: flex; flex-direction: column; gap: 5px; }
.dash-btns--grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.dash-btn { display: flex; align-items: center; gap: 6px; width: 100%; padding: 7px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.15s; text-align: left; }
.dash-btn:hover { border-color: rgba(139,92,246,0.3); color: rgba(255,255,255,0.8); }
.dash-btn--on { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.08); color: #c4b5fd; }
.dash-ico { flex-shrink: 0; color: #a78bfa; }
.dash-btn--on .dash-ico { color: #c4b5fd; }
.dash-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dash-dot--material { background: #93c5fd; }
.dash-dot--atividade { background: #6ee7b7; }
.dash-dot--avaliacao { background: #fdba74; }
.dash-count { margin-left: auto; font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.05); padding: 1px 7px; border-radius: 6px; flex-shrink: 0; }
.dash-btn--on .dash-count { color: #c4b5fd; background: rgba(139,92,246,0.15); }
.dash-obs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; padding-top: 7px; border-top: 1px dashed rgba(255,255,255,0.06); font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,0.3); }
.dash-obs span { display: inline-flex; align-items: center; gap: 4px; }
.dash-escopo { display: flex; align-items: center; gap: 7px; width: 100%; padding: 6px 10px; border-radius: 8px; border: none; background: transparent; color: rgba(255,255,255,0.5); font-size: 10.5px; font-weight: 700; cursor: pointer; transition: all 0.15s; text-align: left; }
.dash-escopo:hover { background: rgba(139,92,246,0.06); color: rgba(255,255,255,0.85); }
.dash-escopo-nome { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
