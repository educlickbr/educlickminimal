<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppStore } from "~~/stores/app";
import { useDocentesCore } from "~/composables/docentes/useDocentesCore";
import { useDocentesEditais } from "~/composables/docentes/useDocentesEditais";
import { useDocentesSelecao } from "~/composables/docentes/useDocentesSelecao";
import { useDocentesLista } from "~/composables/docentes/useDocentesLista";
import { useDocentesCurriculos } from "~/composables/docentes/useDocentesCurriculos";

import DocentesTabEditais from "~/components/docentes/DocentesTabEditais.vue";
import DocentesTabSelecao from "~/components/docentes/DocentesTabSelecao.vue";
import DocentesTabDocentes from "~/components/docentes/DocentesTabDocentes.vue";
import DocentesTabCurriculos from "~/components/docentes/DocentesTabCurriculos.vue";
import ModalEdital from "~/components/docentes/ModalEdital.vue";
import ModalDocente from "~/components/docentes/ModalDocente.vue";
import ModalVinculosDocente from "~/components/docentes/ModalVinculosDocente.vue";
import ModalAvaliarCandidato from "~/components/docentes/ModalAvaliarCandidato.vue";

definePageMeta({ layout: "base" });

const store = useAppStore();
const core = useDocentesCore();

// ── Composables de cada aba ──────────────────────────────
const editaisCtx = useDocentesEditais(core.idEntidade);
const selecaoCtx = useDocentesSelecao(core.idEntidade);
const listaCtx = useDocentesLista(core.idEntidade);
const curriculosCtx = useDocentesCurriculos(core.idEntidade);

// ── Modal: Edital ────────────────────────────────────────
const showModalEdital = ref(false);
const editalEditando = ref<any>(null);

function abrirNovoEdital() {
    editalEditando.value = null;
    showModalEdital.value = true;
}

function abrirEditarEdital(edital: any) {
    editalEditando.value = edital;
    showModalEdital.value = true;
}

async function salvarEdital(dados: any): Promise<boolean> {
    if (editalEditando.value?.id) dados.id = editalEditando.value.id;
    return await editaisCtx.salvarEdital(dados);
}

// ── Modal: Docente ───────────────────────────────────────
const showModalDocente = ref(false);

// ── Modal: Vínculos ──────────────────────────────────────
const showModalVinculos = ref(false);
const docenteVinculos = ref<any>(null);
const vinculosCarregados = ref<any[]>([]);

async function abrirVinculos(docente: any) {
    docenteVinculos.value = docente;
    const vinculos = await listaCtx.fetchVinculos(docente.id);
    vinculosCarregados.value = vinculos;
    showModalVinculos.value = true;
}

async function salvarVinculos(idDocente: string, vinculos: any[]): Promise<boolean> {
    return await listaCtx.salvarVinculos(idDocente, vinculos);
}

// ── Modal: Avaliar Candidato ─────────────────────────────
const showModalAvaliar = ref(false);
const inscricaoAvaliar = ref<any>(null);

function abrirAvaliar(inscricao: any) {
    inscricaoAvaliar.value = inscricao;
    showModalAvaliar.value = true;
}

onMounted(async () => {
    if (!store.initialized) await store.initSession();
    // Carrega dados da aba inicial
    if (core.activeTab.value === "editais") await editaisCtx.fetchEditais();
    if (core.activeTab.value === "selecao") {
        await selecaoCtx.fetchEditaisDropdown();
        if (selecaoCtx.editalSelecionado.value) await selecaoCtx.fetchInscricoes();
    }
    if (core.activeTab.value === "docentes") {
        await listaCtx.fetchDocentes();
        await listaCtx.fetchComponentes();
    }
    if (core.activeTab.value === "curriculos") await curriculosCtx.fetchPropostas();
});

// Recarrega dados ao trocar de aba
watch(core.activeTab, async (tab) => {
    if (tab === "editais") await editaisCtx.fetchEditais();
    if (tab === "selecao") {
        await selecaoCtx.fetchEditaisDropdown();
        if (selecaoCtx.editalSelecionado.value) await selecaoCtx.fetchInscricoes();
    }
    if (tab === "docentes") {
        await listaCtx.fetchDocentes();
        await listaCtx.fetchComponentes();
    }
    if (tab === "curriculos") await curriculosCtx.fetchPropostas();
});
</script>

<template>
    <div class="page-wrap flex flex-col">
        <!-- Tabs -->
        <div class="page-top-row shrink-0">
            <div class="tabs-nav">
                <button
                    v-for="tab in core.TABS"
                    :key="tab.id"
                    @click="core.setActiveTab(tab.id)"
                    class="tab-btn"
                    :class="{ 'tab-btn--active': core.activeTab.value === tab.id }"
                >
                    {{ tab.label }}
                </button>
            </div>
        </div>

        <!-- Conteúdo por aba -->
        <div class="flex-1 overflow-hidden">
            <DocentesTabEditais
                v-if="core.activeTab.value === 'editais'"
                :ctx="editaisCtx"
                @novo-edital="abrirNovoEdital"
                @editar-edital="abrirEditarEdital"
            />
            <DocentesTabSelecao
                v-if="core.activeTab.value === 'selecao'"
                :ctx="selecaoCtx"
                @avaliar="abrirAvaliar"
            />
            <DocentesTabDocentes
                v-if="core.activeTab.value === 'docentes'"
                :ctx="listaCtx"
                :idEntidade="core.idEntidade()"
                @novo-docente="showModalDocente = true"
                @editar-vinculos="abrirVinculos"
            />
            <DocentesTabCurriculos
                v-if="core.activeTab.value === 'curriculos'"
                :ctx="curriculosCtx"
            />
        </div>
    </div>

    <!-- Modais -->
    <ModalEdital
        v-model="showModalEdital"
        :edital="editalEditando"
        :onSave="salvarEdital"
    />

    <ModalDocente
        v-model="showModalDocente"
        :idEntidade="core.idEntidade()"
        :onSave="async (idUserExpandido: string) => { await listaCtx.fetchDocentes(); return true; }"
    />

    <ModalVinculosDocente
        v-model="showModalVinculos"
        :docente="docenteVinculos"
        :componentesDisponiveis="listaCtx.componentesDisponiveis.value"
        :vinculosAtuais="vinculosCarregados"
        :onSave="salvarVinculos"
    />

    <ModalAvaliarCandidato
        v-model="showModalAvaliar"
        :inscricao="inscricaoAvaliar"
        :onAvaliar="selecaoCtx.avaliarInscricao"
    />
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

/* Tabs navigation */
.tabs-nav {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    padding: 4px;
}

.tab-btn {
    padding: 8px 20px;
    border-radius: 9px;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: rgba(140, 135, 141, 0.4);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
}

.tab-btn:hover {
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.04);
}

.tab-btn--active {
    color: #a78bfa;
    background: rgba(139, 92, 246, 0.15);
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.08);
}
</style>
