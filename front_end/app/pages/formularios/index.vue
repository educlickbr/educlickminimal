<script setup lang="ts">
definePageMeta({ layout: "wide" });

import { useFormulariosCore } from "~/composables/formularios/useFormulariosCore";
import { useFormulariosPerguntas } from "~/composables/formularios/useFormulariosPerguntas";
import { useToast } from "~/composables/useToast";

const tabs = [
    { key: "perguntas", label: "Banco de Perguntas" },
    { key: "configuracoes", label: "Formulários" },
];
const route = useRoute();
const router = useRouter();
const initialTab =
    typeof route.query.tab === "string" &&
    tabs.some((t) => t.key === route.query.tab)
        ? route.query.tab
        : "perguntas";
const activeTab = ref(initialTab);
function setActiveTab(k: string) {
    activeTab.value = k;
    router.replace({ query: { ...route.query, tab: k } });
}

const core = useFormulariosCore();
const idEntidade = computed(() => core.getEntidadeAtivaId());
const toast = useToast();

// ── Perguntas (compartilhado entre as duas tabs) ────────
const perguntasCtx = useFormulariosPerguntas({
    garantirEntidade: core.garantirEntidade,
    toast,
});

const tabConfigRef = ref<any>(null);

onMounted(async () => {
    const q = typeof route.query.tab === "string" ? route.query.tab : null;
    if (q && tabs.some((t) => t.key === q)) activeTab.value = q;
    await perguntasCtx.fetchPerguntas();
    if (activeTab.value === "configuracoes") await tabConfigRef.value?.init();
});

watch(activeTab, async (val) => {
    await perguntasCtx.fetchPerguntas();
    if (val === "configuracoes") await tabConfigRef.value?.init();
});
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
            <button
                v-if="activeTab === 'perguntas'"
                @click="perguntasCtx.openNova()"
                class="ds-btn-primary"
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Nova Pergunta
            </button>
            <button
                v-if="activeTab === 'configuracoes'"
                @click="tabConfigRef?.novoFormulario()"
                class="ds-btn-primary"
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Novo Formulário
            </button>
        </div>

        <div>
            <FormulariosTabPerguntas
                v-if="activeTab === 'perguntas'"
                :perguntasCtx="perguntasCtx"
                :idEntidade="idEntidade"
            />
            <FormulariosTabConfiguracoes
                v-if="activeTab === 'configuracoes'"
                ref="tabConfigRef"
                :perguntasCtx="perguntasCtx"
                :idEntidade="idEntidade"
            />
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
