import { $fetch as ofetch } from "ofetch";

export function useSelecaoTurmas() {
    const turmas = ref<any[]>([]);
    const isLoading = ref(false);

    const fetchTurmas = async (pArea: string, pAnoSemestre: string) => {
        isLoading.value = true;
        try {
            const data = await ofetch("/api/selecao/turmas", {
                params: {
                    p_area: pArea,
                    p_ano_semestre: pAnoSemestre,
                },
            });

            const raw = data as any;
            turmas.value = [
                ...(raw.em_andamento || []),
                ...(raw.encerrados || []),
            ];
        } catch (e) {
            console.error(e);
        } finally {
            isLoading.value = false;
        }
    };

    return { turmas, isLoading, fetchTurmas };
}
