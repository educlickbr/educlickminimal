import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

// Composable: estado e fetch de estatísticas do dashboard de bolsas
export function useBolsasStats() {
  const dashboardStats = ref<Record<string, any> | undefined>(undefined);

  const fetchStats = async (anoSemestre: string) => {
    try {
      const data: any = await ofetch("/api/bolsas/admin/stats", {
        query: { ano_semestre: anoSemestre },
      });
      dashboardStats.value = data;
    } catch (e) {
      console.error("Erro ao buscar estatísticas:", e);
    }
  };

  return { dashboardStats, fetchStats };
}
