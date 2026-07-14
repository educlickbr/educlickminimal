import { $fetch as ofetch } from "ofetch";

export function useMeusProcessos() {
    const processos = ref<any[]>([]);
    const jornadas = ref<any[]>([]);
    const isLoading = ref(false);

    const fetchProcessos = async () => {
        isLoading.value = true;
        try {
            const [processosData, jornadasData] = await Promise.all([
                ofetch("/api/aluno/processos"),
                ofetch("/api/aluno/jnpta"),
            ]);

            processos.value = (processosData as any[]) || [];
            jornadas.value = (jornadasData as any[]) || [];
        } catch (e: any) {
            console.error("Error loading processes:", e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    return { processos, jornadas, isLoading, fetchProcessos };
}
