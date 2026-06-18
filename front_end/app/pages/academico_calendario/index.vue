<script setup lang="ts">
definePageMeta({ layout: "base" });

import { useCalendarioCore } from "~/composables/calendario/useCalendarioCore";
import { useCalendarioFeriados } from "~/composables/calendario/useCalendarioFeriados";
import { useCalendarioEventos } from "~/composables/calendario/useCalendarioEventos";
import { useCalendarioCalendario } from "~/composables/calendario/useCalendarioCalendario";
import { useToast } from "~/composables/useToast";

const tabs = [
    { key: "feriados", label: "Feriados" },
    { key: "eventos", label: "Eventos" },
    { key: "calendario", label: "Calendário" },
];
const route = useRoute();
const router = useRouter();
const initialTab =
    typeof route.query.tab === "string" &&
    tabs.some((t) => t.key === route.query.tab)
        ? route.query.tab
        : "feriados";
const activeTab = ref(initialTab);
function setActiveTab(k: string) {
    activeTab.value = k;
    router.replace({ query: { ...route.query, tab: k } });
}

const core = useCalendarioCore();
const idEntidade = computed(() => core.getEntidadeAtivaId());
const toast = useToast();

const selectedYear = ref(new Date().getUTCFullYear());
const currentYear = new Date().getUTCFullYear();
const availableYears = computed(() => [
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
]);

// ── Composables ─────────────────────────────────────────
const feriadosCtx = useCalendarioFeriados({
    getEntidadeAtivaId: core.getEntidadeAtivaId,
    toast,
    selectedYear: () => selectedYear.value,
});
const eventosCtx = useCalendarioEventos({
    getEntidadeAtivaId: core.getEntidadeAtivaId,
    toast,
    selectedYear: () => selectedYear.value,
});
const calendarioCtx = useCalendarioCalendario({
    getEntidadeAtivaId: core.getEntidadeAtivaId,
    garantirEntidade: core.garantirEntidade,
    toast,
});

// ── Init/Watch ──────────────────────────────────────────
onMounted(async () => {
    const q = typeof route.query.tab === "string" ? route.query.tab : null;
    if (q && tabs.some((t) => t.key === q)) activeTab.value = q;
    await loadTab(activeTab.value);
});

watch(activeTab, (val) => loadTab(val));

async function loadTab(tab: string) {
    if (tab === "feriados") await feriadosCtx.fetchFeriados();
    else if (tab === "eventos") await eventosCtx.fetchEventos();
    else if (tab === "calendario") await calendarioCtx.fetchProgramas();
}
</script>

<template>
    <div class="page-wrap">
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

            <div class="flex items-center gap-3">
                <select
                    v-if="activeTab !== 'calendario'"
                    v-model="selectedYear"
                    class="year-select"
                >
                    <option v-for="y in availableYears" :key="y" :value="y">
                        {{ y }}
                    </option>
                </select>
                <button
                    v-if="activeTab === 'feriados'"
                    @click="feriadosCtx.openNovo()"
                    class="add-btn"
                >
                    + Novo Feriado
                </button>
                <button
                    v-if="activeTab === 'eventos'"
                    @click="eventosCtx.openNovo()"
                    class="add-btn"
                >
                    + Novo Evento
                </button>
            </div>
        </div>

        <CalendarioTabFeriados
            v-if="activeTab === 'feriados'"
            :ctx="feriadosCtx"
            :idEntidade="idEntidade"
        />
        <CalendarioTabEventos
            v-if="activeTab === 'eventos'"
            :ctx="eventosCtx"
            :idEntidade="idEntidade"
        />
        <CalendarioTabCalendario
            v-if="activeTab === 'calendario'"
            :ctx="calendarioCtx"
        />
    </div>
</template>

<style scoped>
.page-wrap {
    padding: 1rem 1.5rem;
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
.year-select {
    padding: 0.4rem 0.75rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.7rem;
    font-weight: 700;
}
</style>
