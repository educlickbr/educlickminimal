import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useReservasDashboard() {
  const stats = ref<any>(null);
  const weeklySchedule = ref<any[]>([]);
  const recentActivity = ref<any[]>([]);
  const isLoading = ref(false);

  const fetchDashboard = async () => {
    isLoading.value = true;
    try {
      const [s, w, a] = await Promise.all([
        ofetch("/api/producao/dashboard/stats"),
        ofetch("/api/producao/dashboard/weekly"),
        ofetch("/api/producao/dashboard/activity"),
      ]);
      stats.value = s;
      weeklySchedule.value = w || [];
      recentActivity.value = a || [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    stats,
    weeklySchedule,
    recentActivity,
    isLoading,
    fetchDashboard,
  };
}
