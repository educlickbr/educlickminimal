<script setup lang="ts">
definePageMeta({ layout: "base" });

import { useMeusProcessos } from "~/composables/meus-processos/useMeusProcessos";

const ctx = useMeusProcessos();

// Modal de Detalhes (reaproveitado de processos)
const showDetalhes = ref(false);
const detalhesId = ref<string | null>(null);

function verDetalhes(id: string) {
    detalhesId.value = id;
    showDetalhes.value = true;
}

onMounted(() => {
    ctx.fetchInscricoes();
});

/** Gera array de páginas para a navegação (igual a Processos) */
const paginasVisiveis = computed(() => {
    const t = ctx.totalPaginas.value;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);

    const atual = ctx.pagina.value;
    const ps = new Set<number>();
    // primeiras 3
    for (let i = 1; i <= 3; i++) ps.add(i);
    // últimas 2
    for (let i = t - 1; i <= t; i++) ps.add(i);
    // entorno da atual
    for (let i = atual - 1; i <= atual + 1; i++) {
        if (i >= 1 && i <= t) ps.add(i);
    }
    const sorted = [...ps].sort((a, b) => a - b);

    // injeta -1 onde há salto
    const result: number[] = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) result.push(-1);
        result.push(sorted[i]!);
    }
    return result;
});
</script>

<template>
    <div class="flex flex-col h-full">
        <!-- Cabeçalho -->
        <div class="flex items-center justify-between mb-6 shrink-0">
            <div>
                <h2 class="text-xl font-black tracking-tight">
                    Minhas Inscrições
                </h2>
                <p class="text-[11px] text-secondary/60 font-bold mt-1">
                    Acompanhe o status das suas inscrições em processos
                    seletivos
                </p>
            </div>
            <NuxtLink
                to="/oferta"
                class="px-5 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
                Ver Cursos
            </NuxtLink>
        </div>

        <!-- Loading -->
        <div
            v-if="ctx.isLoading.value"
            class="flex-1 flex items-center justify-center"
        >
            <div
                class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
        </div>

        <!-- Empty -->
        <div
            v-else-if="ctx.inscricoes.value.length === 0"
            class="flex-1 flex items-center justify-center"
        >
            <div
                class="text-center py-20 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl max-w-md mx-auto w-full"
            >
                <Icon
                    name="ph:folder-open-light"
                    class="w-16 h-16 text-secondary/20 mx-auto mb-4"
                />
                <p class="text-sm font-bold text-secondary/60">
                    Nenhuma inscrição encontrada
                </p>
                <p class="text-[11px] text-secondary/40 mt-2">
                    Você ainda não se inscreveu em nenhum processo seletivo.
                </p>
                <NuxtLink
                    to="/oferta"
                    class="inline-block mt-6 px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all"
                >
                    Ver cursos disponíveis
                </NuxtLink>
            </div>
        </div>

        <!-- Cards -->
        <template v-else>
            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                <div
                    v-for="insc in ctx.inscricoes.value"
                    :key="insc.id_inscricao"
                    class="group bg-[#0f0f17] border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                >
                    <!-- Info Column -->
                    <div class="flex-1 min-w-0">
                        <!-- Badges de área + ano/semestre -->
                        <div class="flex items-center gap-2 mb-2">
                            <span
                                v-if="insc.nome_area"
                                class="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest"
                            >
                                {{ insc.nome_area }}
                            </span>
                            <span
                                v-if="insc.ano_semestre"
                                class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-secondary text-[9px] font-bold uppercase tracking-wider"
                            >
                                {{ ctx.formatarAnoSemestre(insc.ano_semestre) }}
                            </span>
                            <span
                                v-if="insc.turno"
                                class="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest"
                            >
                                {{ insc.turno }}
                            </span>
                        </div>

                        <!-- Nome do curso -->
                        <h3
                            class="text-sm font-bold text-white leading-tight group-hover:text-primary transition-colors"
                        >
                            {{ insc.nome_curso || insc.nome_processo }}
                        </h3>
                        <p class="text-[10px] text-secondary/50 mt-1">
                            Inscrito em
                            {{ ctx.formatarData(insc.data_inscricao) }}
                        </p>

                        <!-- Badges de status -->
                        <div class="flex items-center gap-2 mt-3">
                            <span
                                class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                                :class="{
                                    'bg-amber-500/10 border-amber-500/20 text-amber-400':
                                        insc.status_dados === 'pendente',
                                    'bg-green-500/10 border-green-500/20 text-green-400':
                                        insc.status_dados === 'aprovado',
                                    'bg-red-500/10 border-red-500/20 text-red-400':
                                        insc.status_dados === 'reprovado',
                                }"
                            >
                                {{
                                    insc.status_dados === "aprovado"
                                        ? "✓"
                                        : insc.status_dados === "reprovado"
                                          ? "✕"
                                          : "○"
                                }}
                                Dados
                            </span>
                            <span
                                class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                                :class="{
                                    'bg-amber-500/10 border-amber-500/20 text-amber-400':
                                        insc.status_documentacao === 'pendente',
                                    'bg-green-500/10 border-green-500/20 text-green-400':
                                        insc.status_documentacao === 'aprovado',
                                    'bg-red-500/10 border-red-500/20 text-red-400':
                                        insc.status_documentacao ===
                                        'reprovado',
                                }"
                            >
                                {{
                                    insc.status_documentacao === "aprovado"
                                        ? "✓"
                                        : insc.status_documentacao ===
                                            "reprovado"
                                          ? "✕"
                                          : "○"
                                }}
                                Docs
                            </span>
                            <span
                                class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                                :class="{
                                    'bg-amber-500/10 border-amber-500/20 text-amber-400':
                                        insc.status_candidatura === 'pendente',
                                    'bg-green-500/10 border-green-500/20 text-green-400':
                                        insc.status_candidatura === 'aprovado',
                                    'bg-red-500/10 border-red-500/20 text-red-400':
                                        insc.status_candidatura === 'reprovado',
                                }"
                            >
                                {{
                                    insc.status_candidatura === "aprovado"
                                        ? "✓"
                                        : insc.status_candidatura ===
                                            "reprovado"
                                          ? "✕"
                                          : "○"
                                }}
                                Candidatura
                            </span>
                        </div>
                    </div>

                    <!-- Action Column -->
                    <div class="flex items-center gap-2 shrink-0">
                        <button
                            @click="verDetalhes(insc.id_inscricao)"
                            class="px-5 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-white hover:bg-white/5 transition-all"
                        >
                            Detalhes
                        </button>
                        <button
                            class="px-5 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 opacity-40 cursor-not-allowed"
                            disabled
                            title="Em breve"
                        >
                            Matricular
                        </button>
                    </div>
                </div>
            </div>

            <!-- Paginação -->
            <div
                v-if="ctx.total.value > 20"
                class="shrink-0 flex items-center justify-center gap-1 pt-4 border-t border-white/5 mt-4"
            >
                <button
                    :disabled="ctx.pagina.value === 1"
                    @click="ctx.irParaPagina(ctx.pagina.value - 1)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    ‹
                </button>
                <template v-for="p in paginasVisiveis" :key="p">
                    <span
                        v-if="p === -1"
                        class="text-secondary/30 text-[10px] px-1"
                        >...</span
                    >
                    <button
                        v-else
                        @click="ctx.irParaPagina(p)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all"
                        :class="
                            p === ctx.pagina.value
                                ? 'bg-primary text-white'
                                : 'text-secondary hover:text-white hover:bg-white/5'
                        "
                    >
                        {{ p }}
                    </button>
                </template>
                <button
                    :disabled="ctx.pagina.value >= ctx.totalPaginas.value"
                    @click="ctx.irParaPagina(ctx.pagina.value + 1)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                    ›
                </button>
            </div>
        </template>

        <!-- Modal Detalhes (reaproveitado) -->
        <ProcessosModalDetalhes
            v-model="showDetalhes"
            :idInscricao="detalhesId || ''"
        />
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
</style>
