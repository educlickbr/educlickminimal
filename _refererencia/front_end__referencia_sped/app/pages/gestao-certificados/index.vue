<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import GestaoCertificadosModelosTab from "../../components/gestao-certificados/GestaoCertificadosModelosTab.vue";
import GestaoCertificadosEmissaoTab from "../../components/gestao-certificados/GestaoCertificadosEmissaoTab.vue";
import ParametrizacaoCertificadoModal from "../../components/gestao-certificados/ParametrizacaoCertificadoModal.vue";
import {
    getAnoSemestre,
    getAnoSemestreList,
} from "../../../utils/ano_semestre";
import { useToast } from "../../../composables/useToast";
import { ref } from "vue";

definePageMeta({ layout: "base" });

useHead({
    title: "Certificados | SPEDigital",
    htmlAttrs: { translate: "no", class: "notranslate" },
    bodyAttrs: { class: "notranslate" },
});

interface CursoCard {
    id: string;
    nome_curso: string;
    cod_curso: string | null;
    area: string;
    area_int: string;
    modalidade: string | null;
    descricao: string | null;
    certificado_texto_institucional: string | null;
    certificado_nome_coordenador: string | null;
    certificado_nome_docente: string | null;
    certificado_nome_curador: string | null;
    certificado_carga_horaria_exibida: string | null;
    qtd_modulos: number | null;
    qtd_aulas_modulo: number | null;
    qtd_periodos: number | null;
    qtd_minutos_periodo: number | null;
    qtd_minutos_total: number | null;
    status: boolean;
}

const abaAtiva = ref<"modelos" | "certificados">("modelos");
const { showToast } = useToast();

// ── Estado do Modal de Parametrização ──────────────────────
const cursoParametrizando = ref<CursoCard | null>(null);
const modalAberto = ref(false);
const modalReadOnly = ref(false);
const previewAluno = ref<{
    nome?: string | null;
    sobrenome?: string | null;
} | null>(null);
const previewTurma = ref<{
    dt_ini_curso?: string | null;
    dt_fim_curso?: string | null;
} | null>(null);
const previewAlunoCertificadoId = ref<string | null>(null);

const abrirParametrizacao = (curso: CursoCard) => {
    modalReadOnly.value = false;
    previewAluno.value = null;
    previewTurma.value = null;
    cursoParametrizando.value = curso;
    modalAberto.value = true;
};

const handlePreview = (aluno: any) => {
    modalReadOnly.value = true;
    previewAlunoCertificadoId.value = aluno.id_certificado_emitido;
    previewAluno.value = { nome: aluno.nome, sobrenome: aluno.sobrenome };
    previewTurma.value = {
        dt_ini_curso: aluno.dt_ini_curso_contexto,
        dt_fim_curso: aluno.dt_fim_curso_contexto,
    };
    cursoParametrizando.value = {
        id: aluno.id_curso,
        nome_curso: aluno.nome_curso,
        cod_curso: aluno.cod_curso,
        area:
            aluno.area_curso === "extensao"
                ? "Extensão"
                : aluno.area_curso === "cursos_livres"
                  ? "Cursos Livres"
                  : aluno.area_curso === "regulares"
                    ? "Regulares"
                    : aluno.area_curso,
        area_int: aluno.area_curso,
        modalidade: aluno.modalidade,
        descricao: aluno.descricao_curso,
        certificado_texto_institucional: aluno.certificado_texto_institucional,
        certificado_nome_coordenador: aluno.certificado_nome_coordenador,
        certificado_nome_docente: aluno.certificado_nome_docente,
        certificado_nome_curador: aluno.certificado_nome_curador,
        certificado_carga_horaria_exibida:
            aluno.certificado_carga_horaria_exibida,
        qtd_modulos: aluno.qtd_modulos,
        qtd_aulas_modulo: aluno.qtd_aulas_modulo,
        qtd_periodos: aluno.qtd_periodos,
        qtd_minutos_periodo: aluno.qtd_minutos_periodo,
        qtd_minutos_total: aluno.qtd_minutos_total,
        status: true,
    };
    modalAberto.value = true;
};

const salvarParametrizacao = async (dados: any) => {
    try {
        await ofetch("/api/gestao-certificados/parametrizacao", {
            method: "POST",
            body: {
                id_curso: dados.cursoId,
                texto_institucional: dados.textoInstitucional,
                nome_coordenador: dados.nomeCoordenador,
                nome_docente: dados.nomeDocente,
                nome_curador: dados.nomeCurador,
                carga_horaria_exibida: dados.cargaHoraria,
                descricao: dados.descricaoHtml,
            },
        });
        showToast("Parametrização salva com sucesso.", { type: "success" });
        fecharModal();
    } catch (error: any) {
        showToast(
            error?.data?.statusMessage ||
                error?.message ||
                "Erro ao salvar parametrização.",
            { type: "error" },
        );
    }
};

const fecharModal = () => {
    modalAberto.value = false;
    cursoParametrizando.value = null;
    previewAluno.value = null;
    previewTurma.value = null;
    previewAlunoCertificadoId.value = null;
    modalReadOnly.value = false;
};
</script>

<template>
    <div
        translate="no"
        class="notranslate h-full w-full flex flex-col font-sans bg-transparent"
    >
        <main class="flex-1 overflow-y-auto space-y-4 w-full">
            <section
                class="bg-transparent md:bg-div-15 rounded-none md:rounded p-0 md:p-8 flex-1 w-full"
            >
                <div
                    class="flex items-center gap-6 border-b border-secondary/10 w-full pb-1 overflow-x-auto no-scrollbar mb-6"
                >
                    <button
                        @click="abaAtiva = 'modelos'"
                        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                        :class="
                            abaAtiva === 'modelos'
                                ? 'text-primary'
                                : 'text-secondary hover:text-white'
                        "
                    >
                        Modelos
                        <span
                            v-if="abaAtiva === 'modelos'"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        />
                    </button>
                    <button
                        @click="abaAtiva = 'certificados'"
                        class="text-sm font-bold pb-2 relative transition-colors whitespace-nowrap"
                        :class="
                            abaAtiva === 'certificados'
                                ? 'text-primary'
                                : 'text-secondary hover:text-white'
                        "
                    >
                        Certificados
                        <span
                            v-if="abaAtiva === 'certificados'"
                            class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"
                        />
                    </button>
                </div>

                <div class="space-y-4">
                    <div v-if="abaAtiva === 'modelos'">
                        <GestaoCertificadosModelosTab
                            @parametrizar="abrirParametrizacao"
                        />
                    </div>

                    <div v-else>
                        <GestaoCertificadosEmissaoTab
                            @preview="handlePreview"
                        />
                    </div>
                </div>
            </section>
        </main>
    </div>

    <ParametrizacaoCertificadoModal
        :show="modalAberto"
        :curso="cursoParametrizando"
        :id-certificado-emitido="previewAlunoCertificadoId"
        :preview-aluno="previewAluno"
        :preview-turma="previewTurma"
        :read-only="modalReadOnly"
        @close="fecharModal"
        @salvar="salvarParametrizacao"
    />
</template>
