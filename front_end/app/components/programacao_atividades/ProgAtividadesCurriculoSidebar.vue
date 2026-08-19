<template>
    <div class="flex flex-col gap-4">
        <!-- Sem programa selecionado -->
        <div v-if="!ctx.programaSelecionado.value" class="flex flex-col gap-3">
            <div class="dash-card">
                <span class="dash-title">🧭 Currículo</span>
                <p class="dash-text">Selecione um programa para ver o resumo do currículo, escopos e estado das associações.</p>
            </div>
        </div>

        <!-- Programa selecionado -->
        <template v-else>
            <!-- Como usar -->
            <div class="dash-card">
                <span class="dash-title">🧭 Como usar</span>
                <ul class="dash-list">
                    <li><b>Radio</b> — associa o conteúdo ao escopo alvo (cria a linha no currículo).</li>
                    <li><b>Toggle</b> — Visível/Oculto: o aluno vê ou não.</li>
                    <li><b>⚙️</b> — disponibilidade, prazo, duração e tentativas.</li>
                    <li>Sem linha = herdado = visível para o aluno.</li>
                </ul>
            </div>

            <!-- Escopos -->
            <div class="dash-card">
                <span class="dash-title">📐 Escopos do programa</span>
                <div class="dash-btns">
                    <button v-if="ctx.resumoCurriculo.value.escopos.componentes" class="dash-btn" @click="ctx.irParaPasta('componentes')">
                        📁 Componentes <span class="dash-count">{{ ctx.resumoCurriculo.value.escopos.componentes }}</span>
                    </button>
                    <button v-if="ctx.resumoCurriculo.value.escopos.modulos" class="dash-btn" @click="ctx.irParaPasta('modulos')">
                        📁 Módulos/Ciclos <span class="dash-count">{{ ctx.resumoCurriculo.value.escopos.modulos }}</span>
                    </button>
                    <button v-if="ctx.resumoCurriculo.value.escopos.aulas" class="dash-btn" @click="ctx.irParaPasta('modulos')">
                        📅 Aulas <span class="dash-count">{{ ctx.resumoCurriculo.value.escopos.aulas }}</span>
                    </button>
                </div>
            </div>

            <!-- Estado do currículo -->
            <div class="dash-card">
                <span class="dash-title">📊 Estado do currículo</span>
                <div class="dash-btns">
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroEstado.value === 'associados' }" @click="ctx.toggleFiltroEstado('associados')">
                        🔗 Associados <span class="dash-count">{{ ctx.resumoCurriculo.value.repositorio.associados }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroEstado.value === 'livres' }" @click="ctx.toggleFiltroEstado('livres')">
                        🔓 Não associados <span class="dash-count">{{ ctx.resumoCurriculo.value.repositorio.livres }}</span>
                    </button>
                    <button class="dash-btn" :class="{ 'dash-btn--on': ctx.filtroEstado.value === 'ocultos' }" @click="ctx.toggleFiltroEstado('ocultos')">
                        🙈 Ocultos <span class="dash-count">{{ ctx.resumoCurriculo.value.repositorio.ocultos }}</span>
                    </button>
                </div>
                <div v-if="ctx.filtroEstado.value" class="dash-obs">
                    <button @click="ctx.toggleFiltroEstado(ctx.filtroEstado.value)" class="dash-limpar">✕ Limpar filtro</button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useProgAtividadesCurriculo } from "~/composables/programacao_atividades/useProgAtividadesCurriculo";

defineProps<{
    ctx: ReturnType<typeof useProgAtividadesCurriculo>;
}>();
</script>

<style scoped>
.dash-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 12px 14px; }
.dash-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); display: block; margin-bottom: 8px; }
.dash-text { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); line-height: 1.5; }
.dash-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.dash-list li { font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,0.45); line-height: 1.45; }
.dash-list b { color: rgba(255,255,255,0.75); }
.dash-btns { display: flex; flex-direction: column; gap: 5px; }
.dash-btn { display: flex; align-items: center; gap: 6px; width: 100%; padding: 7px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.15s; text-align: left; }
.dash-btn:hover { border-color: rgba(139,92,246,0.3); color: rgba(255,255,255,0.8); }
.dash-btn--on { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.08); color: #c4b5fd; }
.dash-count { margin-left: auto; font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.05); padding: 1px 7px; border-radius: 6px; flex-shrink: 0; }
.dash-btn--on .dash-count { color: #c4b5fd; background: rgba(139,92,246,0.15); }
.dash-obs { display: flex; align-items: center; gap: 6px; margin-top: 7px; padding-top: 7px; border-top: 1px dashed rgba(255,255,255,0.06); }
.dash-limpar { background: none; border: none; padding: 0; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(251,113,133,0.7); cursor: pointer; transition: all 0.15s; }
.dash-limpar:hover { color: #fda4af; }
</style>
