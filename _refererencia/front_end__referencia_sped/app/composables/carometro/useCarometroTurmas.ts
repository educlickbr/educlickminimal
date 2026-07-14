import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useCarometroTurmas() {
    const turmas = ref<any[]>([]);
    const isLoading = ref(false);
    const dashboardStats = ref<Record<string, any> | undefined>(undefined);

    const fetchTurmas = async (params: {
        anoSemestre: string;
        turno?: string | null;
        area?: string | null;
    }) => {
        isLoading.value = true;
        try {
            const data: any = await ofetch("/api/matriculas/turmas", {
                params: {
                    ano_semestre: params.anoSemestre,
                    turno: params.turno || null,
                    area: params.area || null,
                },
            });
            turmas.value = data.turmas || [];
        } catch (e) {
            console.error("Erro ao buscar turmas:", e);
            turmas.value = [];
        } finally {
            isLoading.value = false;
        }
    };

    const fetchStats = async (params: {
        anoSemestre: string;
        id_turma?: string | null;
        area?: string | null;
        turno?: string | null;
        busca?: string | null;
    }) => {
        try {
            const data: any = await ofetch("/api/matriculas/stats", {
                params: {
                    ano_semestre: params.anoSemestre,
                    id_turma: params.id_turma || null,
                    area: !params.id_turma ? params.area || null : null,
                    turno: !params.id_turma ? params.turno || null : null,
                    busca: params.busca || null,
                    status: "Ativa",
                },
            });
            dashboardStats.value = data;
        } catch (e) {
            console.error("Erro ao buscar estatísticas:", e);
        }
    };

    return {
        turmas,
        isLoading,
        dashboardStats,
        fetchTurmas,
        fetchStats,
    };
}
