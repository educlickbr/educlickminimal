import { $fetch as ofetch } from "ofetch";

export function useMatriculasTurmas() {
    const turmas = ref<any[]>([]);
    const isLoading = ref(false);

    const fetchTurmas = async (anoSemestre: string, turno?: string, area?: string) => {
        isLoading.value = true;
        try {
            const data: any = await ofetch("/api/matriculas/turmas", {
                params: {
                    ano_semestre: anoSemestre,
                    turno: turno || null,
                    area: area || null,
                },
            });
            turmas.value = data.turmas || [];
        } catch (e) {
            console.error("Erro ao buscar turmas:", e);
        } finally {
            isLoading.value = false;
        }
    };

    return { turmas, isLoading, fetchTurmas };
}
