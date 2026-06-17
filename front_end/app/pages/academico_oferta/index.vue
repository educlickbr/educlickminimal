<script setup lang="ts">
definePageMeta({ layout: "base" });

import { useOfertaCore } from "~/composables/academico_oferta/useOfertaCore";

// ── Navegação (fica na página) ──────────────────────────
const tabs = [
    { key: "areas", label: "Áreas" },
    { key: "componentes", label: "Componentes" },
    { key: "modulos", label: "Módulos" },
    { key: "cursos", label: "Cursos" },
    { key: "ciclos", label: "Ciclos" },
    { key: "programas", label: "Programas" },
];
const route = useRoute();
const router = useRouter();
const activeTab = ref("areas");

function setActiveTab(tabKey: string) {
    activeTab.value = tabKey;
    router.replace({ query: { ...route.query, tab: tabKey } });
}

// ── Core ─────────────────────────────────────────────────
const core = useOfertaCore();
const idEntidade = computed(() => core.getEntidadeAtivaId());

// ── Ref da tab de áreas ─────────────────────────────────
const tabAreasRef = ref<any>(null);

// ── Init / Watch ─────────────────────────────────────────
onMounted(async () => {
    const tabFromQuery =
        typeof route.query.tab === "string" ? route.query.tab : null;
    if (tabFromQuery && tabs.some((t) => t.key === tabFromQuery)) {
        activeTab.value = tabFromQuery;
    }
    if (activeTab.value === "areas") {
        await tabAreasRef.value?.fetchAreas();
    }
});

watch(activeTab, async (val) => {
    if (val === "areas") {
        await tabAreasRef.value?.fetchAreas();
    }
    // outras tabs serão implementadas nos próximos passos
});
</script>

<template>
    <div class="page-wrap">
        <div class="page-top-row">
            <nav class="tabs-nav">
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    @click="setActiveTab(tab.key)"
                    class="tab-btn"
                    :class="{ 'tab-btn--active': activeTab === tab.key }"
                >
                    {{ tab.label }}
                </button>
            </nav>

            <button
                v-if="activeTab === 'areas'"
                @click="tabAreasRef?.openNova()"
                class="add-btn"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                >
                    <path
                        d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"
                    />
                </svg>
                Nova Área
            </button>
        </div>

        <div>
            <!-- ✅ Tab Áreas — migrada -->
            <OfertaTabAreas
                v-if="activeTab === 'areas'"
                ref="tabAreasRef"
                :idEntidade="idEntidade"
            />

            <!-- ⚠️ Placeholders para próximas migrações -->
            <div
                v-if="activeTab === 'componentes'"
                class="py-16 text-center text-secondary/40 text-xs uppercase tracking-widest"
            >
                Componentes — em breve
            </div>
            <div
                v-if="activeTab === 'modulos'"
                class="py-16 text-center text-secondary/40 text-xs uppercase tracking-widest"
            >
                Módulos — em breve
            </div>
            <div
                v-if="activeTab === 'cursos'"
                class="py-16 text-center text-secondary/40 text-xs uppercase tracking-widest"
            >
                Cursos — em breve
            </div>
            <div
                v-if="activeTab === 'ciclos'"
                class="py-16 text-center text-secondary/40 text-xs uppercase tracking-widest"
            >
                Ciclos — em breve
            </div>
            <div
                v-if="activeTab === 'programas'"
                class="py-16 text-center text-secondary/40 text-xs uppercase tracking-widest"
            >
                Programas — em breve
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
}
.page-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
}
.tabs-nav {
    display: flex;
    gap: 0.25rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 0.75rem;
    padding: 0.25rem;
}
.tab-btn {
    padding: 0.5rem 1.25rem;
    border-radius: 0.625rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.3);
    transition: all 0.15s;
    border: none;
    background: none;
    cursor: pointer;
}
.tab-btn:hover {
    color: rgba(255, 255, 255, 0.7);
}
.tab-btn--active {
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
}
.add-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.625rem;
    background: rgba(139, 92, 246, 0.1);
    color: #a78bfa;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.15s;
    border: none;
    cursor: pointer;
}
.add-btn:hover {
    background: rgba(139, 92, 246, 0.2);
}
</style>
