import { $fetch as ofetch } from "ofetch";

export function useMatriculasStats() {
    const dashboardStats = ref<Record<string, any> | undefined>(undefined);

    const fetchStats = async (anoSemestre: string, filters: {
        curso: string;
        area: string;
        turno: string;
        busca: string;
        status: string;
    }) => {
        try {
            const data: any = await ofetch("/api/matriculas/stats", {
                params: {
                    ano_semestre: anoSemestre,
                    id_turma: filters.curso || null,
                    area: !filters.curso ? filters.area || null : null,
                    turno: !filters.curso ? filters.turno || null : null,
                    busca: filters.busca || null,
                    status: filters.status || null,
                },
            });
            dashboardStats.value = data;
        } catch (e) {
            console.error("Erro ao buscar estatísticas:", e);
        }
    };

    return { dashboardStats, fetchStats };
}
