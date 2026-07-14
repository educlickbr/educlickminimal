import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";
import { decorateStudentNames } from "../../../utils/student_name";

export function useCarometroAlunos() {
    const alunos = ref<any[]>([]);
    const isLoadingAlunos = ref(false);
    const limit = 20;
    const pagination = ref({
        pagina_atual: 1,
        qtd_paginas: 0,
        qtd_total: 0,
    });

    const fetchAlunos = async (
        page = 1,
        params: {
            anoSemestre: string;
            id_turma?: string | null;
            area?: string | null;
            turno?: string | null;
            busca?: string | null;
        },
    ) => {
        isLoadingAlunos.value = true;
        try {
            const data: any = await ofetch("/api/matriculas/alunos", {
                params: {
                    ano_semestre: params.anoSemestre,
                    id_turma: params.id_turma || null,
                    area: !params.id_turma ? params.area || null : null,
                    turno: !params.id_turma ? params.turno || null : null,
                    busca: params.busca || null,
                    status: "Ativa",
                    page,
                    limit,
                },
            });

            alunos.value = decorateStudentNames(data.alunos || []);
            if (data.paginacao) {
                pagination.value = {
                    pagina_atual: data.paginacao.pagina_atual,
                    qtd_paginas: data.paginacao.qtd_paginas,
                    qtd_total: data.paginacao.qtd_total,
                };
            } else {
                pagination.value = {
                    pagina_atual: page,
                    qtd_paginas: Math.ceil(
                        (data.total || alunos.value.length) / limit,
                    ),
                    qtd_total: data.total || alunos.value.length,
                };
            }
        } catch (e) {
            console.error("Erro ao buscar alunos:", e);
            alunos.value = [];
        } finally {
            isLoadingAlunos.value = false;
        }
    };

    return {
        alunos,
        isLoadingAlunos,
        pagination,
        limit,
        fetchAlunos,
    };
}
