<script setup lang="ts">
definePageMeta({ layout: "base" });

import OfertaTabAreas from "~/components/academico_oferta/OfertaTabAreas.vue";
import OfertaTabComponentes from "~/components/academico_oferta/OfertaTabComponentes.vue";
import OfertaTabModulos from "~/components/academico_oferta/OfertaTabModulos.vue";
import OfertaTabCursos from "~/components/academico_oferta/OfertaTabCursos.vue";
import OfertaTabCiclos from "~/components/academico_oferta/OfertaTabCiclos.vue";
import OfertaTabProgramas from "~/components/academico_oferta/OfertaTabProgramas.vue";

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
const initialTab =
    typeof route.query.tab === "string" &&
    tabs.some((t) => t.key === route.query.tab)
        ? route.query.tab
        : "areas";
const activeTab = ref(initialTab);
function setActiveTab(k: string) {
    activeTab.value = k;
    router.replace({ query: { ...route.query, tab: k } });
}
</script>

<template>
    <div class="page-wrap">
        <div class="page-top-row">
            <nav class="ds-tabs-nav">
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    @click="setActiveTab(tab.key)"
                    :class="[
                        'ds-tab-btn',
                        activeTab === tab.key ? 'ds-tab-btn--active' : '',
                    ]"
                >
                    {{ tab.label }}
                </button>
            </nav>
        </div>
        <div>
            <OfertaTabAreas v-if="activeTab === 'areas'" />
            <OfertaTabComponentes v-if="activeTab === 'componentes'" />
            <OfertaTabModulos v-if="activeTab === 'modulos'" />
            <OfertaTabCursos v-if="activeTab === 'cursos'" />
            <OfertaTabCiclos v-if="activeTab === 'ciclos'" />
            <OfertaTabProgramas v-if="activeTab === 'programas'" />
        </div>
    </div>
</template>

<style scoped>
.page-wrap {
    padding: 1rem 1.5rem;
    min-height: 100vh;
}
.page-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
}
</style>
