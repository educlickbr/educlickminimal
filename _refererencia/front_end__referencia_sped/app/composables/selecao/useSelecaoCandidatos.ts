import { $fetch as ofetch } from "ofetch";

export interface FetchCandidatosParams {
    idTurma: string | null;
    tipoCandidatura: string;
    busca: string | null;
    extraFilters: Array<{ id_pergunta: string; resposta: string }>;
    pcd: string | null;
    laudo: boolean | null;
    dataInscricaoInicio: string | null;
    dataInscricaoFim: string | null;
    page: number;
    limit: number;
    sortBy: string;
    sortDirection: string;
}

export function useSelecaoCandidatos() {
    const candidatos = ref<any[]>([]);
    const pagination = ref({
        pagina_atual: 1,
        qtd_paginas: 0,
        qtd_total: 0,
    });
    const dashboardStats = ref<Record<string, any> | undefined>(undefined);
    const isLoading = ref(false);

    const fetchCandidatos = async (params: FetchCandidatosParams) => {
        if (!params.idTurma) {
            candidatos.value = [];
            dashboardStats.value = undefined;
            return;
        }

        isLoading.value = true;
        try {
            const commonParams = {
                id_turma: params.idTurma,
                tipo_candidatura: params.tipoCandidatura,
                busca: params.busca,
                filtros: JSON.stringify(params.extraFilters),
                pcd: params.pcd,
                laudo: params.laudo,
                data_inscricao_inicio: params.dataInscricaoInicio,
                data_inscricao_fim: params.dataInscricaoFim,
            };

            const [response, statsResponse] = await Promise.all([
                ofetch("/api/selecao/candidatos", {
                    params: {
                        ...commonParams,
                        pagina: params.page,
                        limite: params.limit,
                        ordenar_por: params.sortBy,
                        ordenar_como: params.sortDirection,
                    },
                }),
                ofetch("/api/selecao/stats", {
                    params: commonParams,
                }),
            ]);

            const result = response as any;
            candidatos.value = result.itens || [];
            dashboardStats.value = (statsResponse as any) || undefined;
            pagination.value = {
                pagina_atual: result.pagina_atual,
                qtd_paginas: result.qtd_paginas,
                qtd_total: result.qtd_total,
            };
        } catch (e) {
            console.error("Error fetching candidates:", e);
            dashboardStats.value = undefined;
        } finally {
            isLoading.value = false;
        }
    };

    return { candidatos, pagination, dashboardStats, isLoading, fetchCandidatos };
}
