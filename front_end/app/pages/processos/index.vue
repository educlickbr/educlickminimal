<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppStore } from "~~/stores/app";
import { useProcessosCore } from "~/composables/processos/useProcessosCore";
import { useProcessos } from "~/composables/processos/useProcessos";

definePageMeta({ layout: "base" });

const store = useAppStore();
const core = useProcessosCore();
const ctx = useProcessos(core.idEntidade);

// Modal de detalhes
const showModalDetalhes = ref(false);
const selectedInscricaoId = ref("");

function abrirDetalhes(id: string) {
    selectedInscricaoId.value = id;
    showModalDetalhes.value = true;
}

// Modal de avaliação
const showModalAvaliar = ref(false);
const avaliarInscricaoId = ref("");
const avaliarInscricaoData = ref<any>({});

function abrirAvaliar(id: string, dados: any) {
    avaliarInscricaoId.value = id;
    avaliarInscricaoData.value = dados;
    showModalAvaliar.value = true;
}

function onAvaliado(dados: { campo: string; valor: string }) {
    // Atualiza o item na lista de inscrições (reatividade instantânea)
    const item = ctx.inscricoes.value.find(
        (i: any) => i.id === avaliarInscricaoId.value,
    );
    if (item) {
        (item as any)[dados.campo] = dados.valor;
    }
}

onMounted(async () => {
    if (!store.initialized) await store.initSession();
    await core.fetchAreas();

    const q = useRoute().query.tab as string | undefined;
    if (q && (q === "todas" || core.areas.value.some((a: any) => a.id === q))) {
        core.activeTab.value = q;
    }
});
</script>

<template>
    <div class="page-wrap flex flex-col">
        <div class="page-top-row shrink-0">
            <div class="flex items-center gap-4">
                <h1
                    class="text-xl font-black text-white uppercase tracking-widest"
                >
                    Processos Seletivos
                </h1>
                <span
                    class="text-[10px] font-bold text-secondary/40 uppercase tracking-wider"
                >
                    {{ core.areas.value.length }} área(s)
                </span>
            </div>
        </div>

        <!-- Loading áreas -->
        <div
            v-if="core.loadingAreas.value"
            class="py-16 flex flex-col items-center justify-center gap-4"
        >
            <div
                class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
            >
                Carregando áreas...
            </span>
        </div>

        <!-- Vazio -->
        <div v-else-if="core.areas.value.length === 0" class="empty-state">
            <Icon
                name="ph:buildings-light"
                class="w-16 h-16 text-secondary/20 mb-4"
            />
            <p class="text-sm font-bold text-white/40 mb-2">
                Nenhuma área cadastrada
            </p>
            <p class="text-xs text-secondary/40">
                Cadastre áreas acadêmicas para configurar processos seletivos.
            </p>
        </div>

        <!-- Conteúdo -->
        <ProcessosTabInscritos
            v-else
            :areas="core.areas.value"
            :activeTab="core.activeTab.value"
            :setActiveTab="core.setActiveTab"
            :ctx="ctx"
            @verDetalhes="abrirDetalhes"
            @avaliar="abrirAvaliar"
        />
    </div>

    <ProcessosModalDetalhes
        v-model="showModalDetalhes"
        :idInscricao="selectedInscricaoId"
    />

    <ProcessosModalAvaliar
        v-model="showModalAvaliar"
        :idInscricao="avaliarInscricaoId"
        :inscricaoData="avaliarInscricaoData"
        @avaliado="onAvaliado"
    />
</template>

<style scoped>
.page-wrap {
    padding: 1rem 1.5rem;
    height: 100%;
}

.page-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

/* ── Tabs ── */
.tabs-bar {
    overflow-x: auto;
    padding-bottom: 0.5rem;
}

.tabs-nav {
    display: flex;
    gap: 0.25rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 0.75rem;
    padding: 0.25rem;
    width: fit-content;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.625rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.3);
    transition: all 0.15s;
    border: none;
    background: none;
    cursor: pointer;
    white-space: nowrap;
}

.tab-btn:hover {
    color: rgba(255, 255, 255, 0.7);
}

.tab-btn--active {
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
}

.tab-badge {
    font-size: 0.6rem;
    font-weight: 800;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.35);
}

.tab-btn--active .tab-badge {
    background: rgba(139, 92, 246, 0.2);
    color: #c4b5fd;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    background: rgba(255, 255, 255, 0.015);
    border: 2px dashed rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
}

select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1em 1em;
    padding-right: 2rem;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
</style>
