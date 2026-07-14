import { ref, computed } from "vue";
import { $fetch as ofetch } from "ofetch";
import { formatInTimeZone } from "date-fns-tz";

export function useCalendarioSalas() {
  const horarios = ref<any[]>([]);
  const reservas = ref<any[]>([]);
  const isLoading = ref(false);

  const availableSalas = computed(() => {
    const unique = new Set(horarios.value.map((h) => h.nome));
    return Array.from(unique);
  });

  const fetchHorarios = async () => {
    const data = await ofetch("/api/producao/calendario/horarios");
    horarios.value = data || [];
  };

  const fetchReservas = async (start: string, end: string) => {
    isLoading.value = true;
    try {
      const data = await ofetch(
        `/api/producao/calendario/reservas?start=${start}&end=${end}`
      );
      reservas.value = data || [];
    } finally {
      isLoading.value = false;
    }
  };

  const getReservaForSlot = (slotId: string, day: Date) => {
    const targetDate = formatInTimeZone(
      day,
      "America/Sao_Paulo",
      "yyyy-MM-dd"
    );
    return reservas.value.find(
      (r) => r.sala_horario_id === slotId && r.data === targetDate
    );
  };

  return {
    horarios,
    reservas,
    isLoading,
    availableSalas,
    fetchHorarios,
    fetchReservas,
    getReservaForSlot,
  };
}
