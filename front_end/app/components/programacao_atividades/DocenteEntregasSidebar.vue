<template>
    <div class="flex flex-col gap-4">
        <!-- Intro -->
        <div class="dash-card">
            <span class="dash-title">
                <Icon name="ph:chalkboard-teacher-bold" class="w-3.5 h-3.5 text-primary shrink-0" />
                Portal Docente
            </span>
            <p class="dash-text">Corrija as entregas das atividades e avaliações. Você corrige o que criou; conteúdos dos programas que leciona aparecem em modo somente leitura.</p>
        </div>

        <!-- Como funciona -->
        <div class="dash-card">
            <span class="dash-title">
                <Icon name="ph:lightbulb-bold" class="w-3.5 h-3.5 text-primary shrink-0" />
                Como funciona
            </span>
            <ul class="dash-list">
                <li><b>Conteúdos</b> — atividades/avaliações com entregas; pendentes primeiro.</li>
                <li><b>Aluno</b> — clique na entrega e veja a resposta (e o gabarito, em avaliações).</li>
                <li><b>Correção</b> — nota + comentário. Só o criador do conteúdo corrige.</li>
                <li>🔒 <b>Somente leitura</b> — conteúdos do programa que você leciona, sem nota.</li>
            </ul>
        </div>

        <!-- Resumo -->
        <div class="dash-card">
            <span class="dash-title">
                <Icon name="ph:chart-line-up-bold" class="w-3.5 h-3.5 text-primary shrink-0" />
                Resumo
            </span>
            <div class="dash-btns">
                <div class="dash-linha">
                    <span class="dash-dot dash-dot--conteudo" /> Conteúdos com entregas
                    <span class="dash-count">{{ ctx.resumo.value.conteudos }}</span>
                </div>
                <div class="dash-linha">
                    <span class="dash-dot dash-dot--pend" /> Entregas pendentes
                    <span class="dash-count">{{ ctx.resumo.value.pendentes }}</span>
                </div>
                <div class="dash-linha">
                    <span class="dash-dot dash-dot--ok" /> Corrigidas
                    <span class="dash-count">{{ ctx.resumo.value.corrigidas }}</span>
                </div>
            </div>
            <div class="dash-progress">
                <div class="dash-progress-bar" :style="{ width: pctCorrigido + '%' }" />
            </div>
            <span class="dash-obs">{{ pctCorrigido }}% das entregas corrigidas</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDocenteEntregas } from "~/composables/programacao_atividades/useDocenteEntregas";

const props = defineProps<{
    ctx: ReturnType<typeof useDocenteEntregas>;
}>();

const pctCorrigido = computed(() => {
    const total = props.ctx.resumo.value.corrigidas + props.ctx.resumo.value.pendentes;
    if (total === 0) return 0;
    return Math.round((props.ctx.resumo.value.corrigidas / total) * 100);
});
</script>

<style scoped>
.dash-card { background: var(--color-secondary-surface); border: 1px solid var(--color-divider); border-radius: 14px; padding: 12px 14px; }
.dash-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-secondary); opacity: 0.8; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.dash-text { font-size: 11px; font-weight: 600; color: var(--color-secondary); opacity: 0.7; line-height: 1.5; }
.dash-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.dash-list li { font-size: 10.5px; font-weight: 600; color: var(--color-secondary); opacity: 0.75; line-height: 1.45; }
.dash-list b { color: var(--color-text); }
.dash-btns { display: flex; flex-direction: column; gap: 5px; }
.dash-linha { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); color: var(--color-secondary); font-size: 10px; font-weight: 700; }
.dash-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dash-dot--conteudo { background: var(--color-primary); }
.dash-dot--pend { background: #f59e0b; }
.dash-dot--ok { background: #10b981; }
.dash-count { margin-left: auto; font-size: 9px; font-weight: 800; color: var(--color-secondary); opacity: 0.6; background: var(--color-secondary-surface-hover); padding: 1px 7px; border-radius: 6px; flex-shrink: 0; }
.dash-progress { height: 4px; border-radius: 2px; background: var(--color-divider); margin-top: 10px; overflow: hidden; }
.dash-progress-bar { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #7c3aed, #a78bfa); transition: width 0.3s ease; }
.dash-obs { display: block; margin-top: 6px; font-size: 9.5px; font-weight: 700; color: var(--color-secondary); opacity: 0.6; }
</style>
