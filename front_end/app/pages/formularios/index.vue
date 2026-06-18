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
            <button
                v-if="activeTab === 'perguntas'"
                @click="perguntasCtx.openNova()"
                class="add-btn"
            >
                + Nova Pergunta
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
