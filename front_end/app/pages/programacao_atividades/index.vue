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
                <nav class="ds-tabs-nav">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        @click="setActiveTab(tab.key)"
                        class="ds-tab-btn"
                        :class="{ 'ds-tab-btn--active': activeTab === tab.key }"
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
    padding: 0.25rem 1.5rem 1rem;
}

.page-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
}

/* Sidebar placeholder */
.dash-card {
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 14px;
    padding: 14px 16px;
}
.dash-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-secondary); opacity: 0.8; display: block; margin-bottom: 8px; }
.dash-text { font-size: 10.5px; font-weight: 600; color: var(--color-secondary); opacity: 0.7; line-height: 1.55; }
.dash-text b { color: var(--color-text); }
</style>
