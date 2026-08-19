<script setup lang="ts">
import { useProgAtividadesCore } from "~/composables/programacao_atividades/useProgAtividadesCore";
import { useProgAtividadesCurriculo } from "~/composables/programacao_atividades/useProgAtividadesCurriculo";
import { useToast } from "~/composables/useToast";
import ProgAtividadesTabRepositorio from "~/components/programacao_atividades/ProgAtividadesTabRepositorio.vue";
import ProgAtividadesTabDistribuicao from "~/components/programacao_atividades/ProgAtividadesTabDistribuicao.vue";
import ProgAtividadesTabCurriculo from "~/components/programacao_atividades/ProgAtividadesTabCurriculo.vue";
import ProgAtividadesCurriculoSidebar from "~/components/programacao_atividades/ProgAtividadesCurriculoSidebar.vue";

const tabs = [
    { key: "repositorio", label: "Repositório" },
    { key: "distribuicao", label: "Distribuição" },
    { key: "curriculo", label: "Currículo" },
];

const route = useRoute();
const router = useRouter();
const initialTab =
    typeof route.query.tab === "string" &&
    tabs.some((t) => t.key === route.query.tab)
        ? route.query.tab
        : "repositorio";
const activeTab = ref(initialTab);

function setActiveTab(k: string) {
    activeTab.value = k;
    router.replace({ query: { ...route.query, tab: k } });
}

// Contexto do Currículo compartilhado entre a aba e o sidebar
const core = useProgAtividadesCore();
const toast = useToast();

const ctxCurriculo = useProgAtividadesCurriculo({
    getEntidadeAtivaId: () => core.getEntidadeAtivaId(),
    garantirEntidade: () => core.garantirEntidade(),
    toast,
});
</script>

<template>
    <NuxtLayout name="base">
        <!-- Quadrante direito reservado no layout base -->
        <template #sidebar>
            <ProgAtividadesCurriculoSidebar v-if="activeTab === 'curriculo'" :ctx="ctxCurriculo" />
            <div v-else class="flex flex-col gap-3">
                <div class="dash-card">
                    <span class="dash-title">💡 Programação de Atividades</span>
                    <p class="dash-text">
                        <b>Repositório</b> — cadastre conteúdos e blocos.<br />
                        <b>Distribuição</b> — associe a áreas, cursos, módulos e componentes (blueprint).<br />
                        <b>Currículo</b> — monte o programa com visibilidade, prazos e destaques.
                    </p>
                </div>
            </div>
        </template>

        <div class="page-wrap">


            <!-- Tabs -->
            <div class="page-top-row">
                <nav class="tabs-nav">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        @click="setActiveTab(tab.key)"
                        :class="[
                            'tab-btn',
                            activeTab === tab.key ? 'tab-btn--active' : '',
                        ]"
                    >
                        {{ tab.label }}
                    </button>
                </nav>
            </div>

            <div>
                <ProgAtividadesTabRepositorio v-if="activeTab === 'repositorio'" />
                <ProgAtividadesTabDistribuicao v-if="activeTab === 'distribuicao'" />
                <ProgAtividadesTabCurriculo v-if="activeTab === 'curriculo'" :ctx="ctxCurriculo" />
            </div>
        </div>
    </NuxtLayout>
</template>

<style scoped>
.page-wrap {
    padding: 1.5rem 1.75rem;
    min-height: 100vh;
}



/* ── Tabs ─────────────────────────────────── */
.page-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}
.tabs-nav {
    display: flex;
    gap: 4px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 4px;
}
.tab-btn {
    padding: 7px 20px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.28);
    transition: all 0.15s;
    border: none;
    background: none;
    cursor: pointer;
}
.tab-btn:hover {
    color: rgba(255, 255, 255, 0.55);
    background: rgba(255, 255, 255, 0.04);
}
.tab-btn--active {
    background: rgba(139, 92, 246, 0.14);
    color: #c4b5fd;
}

/* Sidebar placeholder */
.dash-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 12px 14px; }
.dash-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); display: block; margin-bottom: 8px; }
.dash-text { font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,0.45); line-height: 1.55; }
.dash-text b { color: rgba(255,255,255,0.75); }
</style>
