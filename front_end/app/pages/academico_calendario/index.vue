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
    <div class="page-wrap flex flex-col">
        <div class="page-top-row shrink-0">
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

            <div class="flex items-center gap-3">
                <select
                    v-if="activeTab !== 'calendario'"
                    v-model="selectedYear"
                    class="px-3 py-2 rounded-xl text-xs font-bold bg-field-bg border border-field-border text-field-text outline-none focus:border-primary/40"
                >
                    <option v-for="y in availableYears" :key="y" :value="y">
                        {{ y }}
                    </option>
                </select>
                <button
                    v-if="activeTab === 'feriados'"
                    @click="feriadosCtx.openNovo()"
                    class="ds-btn-primary"
                >
                    <Icon name="ph:plus-bold" class="w-3.5 h-3.5" />
                    <span>Novo Feriado</span>
                </button>
                <button
                    v-if="activeTab === 'eventos'"
                    @click="eventosCtx.openNovo()"
                    class="ds-btn-primary"
                >
                    <Icon name="ph:plus-bold" class="w-3.5 h-3.5" />
                    <span>Novo Evento</span>
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
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
                :idEntidade="idEntidade"
            />
        </div>
    </div>
</template>

<style scoped>
.page-wrap {
    padding: 0.25rem 1.5rem 1rem;
    height: 100%;
}
.page-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 1rem;
}
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.12); border-radius: 4px; }
</style>
