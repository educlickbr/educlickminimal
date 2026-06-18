/**
 * useCalendarioEventos
 * CRUD de eventos do calendário acadêmico.
 */
import { ref, computed } from "vue";

export function useCalendarioEventos(deps: {
  getEntidadeAtivaId: () => string | null;
  toast: {
    showToast: (
      msg: string,
      opts?: { duration?: number; type?: "info" | "error" | "success" },
    ) => void;
  };
  selectedYear: () => number;
}) {
  const eventos = ref<any[]>([]);
  const loading = ref(false);
  const expandedMonths = ref<Record<string, boolean>>({});

  const showModal = ref(false);
  const isEdit = ref(false);
  const editData = ref<any>(null);

  const showConfirm = ref(false);
  const confirmTarget = ref<any>(null);

  async function fetchEventos() {
    loading.value = true;
    try {
      const res = (await $fetch("/api/calendario/eventos", {
        params: {
          id_entidade: deps.getEntidadeAtivaId(),
          ano: deps.selectedYear(),
        },
      })) as any;
      if (res?.success) {
        eventos.value = res.itens || [];
        if (Object.keys(expandedMonths.value).length === 0) {
          expandedMonths.value[new Date().toISOString().slice(0, 7)] = true;
        }
      }
    } catch (e: any) {
      deps.toast.showToast("Erro ao buscar eventos", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  // ── Timeline / Árvore ──
  const timelineMonths = computed(() => {
    const rawItems = eventos.value;
    let minYear = deps.selectedYear();
    let maxYear = deps.selectedYear();
    const allEntries: any[] = [];
    rawItems.forEach((item) => {
      const start = new Date(item.data_inicio + "T12:00:00");
      const end = new Date(item.data_fim + "T12:00:00");
      let curr = new Date(start);
      let isFirstDay = true;
      let safeCounter = 0;
      while (curr <= end && safeCounter < 366) {
        const entryDate = curr.toISOString();
        allEntries.push({
          ...item,
          isEvento: true,
          uniqueKey: `${item.id}_${entryDate}`,
          displayDate: entryDate,
          displayName: item.nome_evento,
          isFirstDay,
          originalStart: item.data_inicio,
        });
        curr.setDate(curr.getDate() + 1);
        isFirstDay = false;
        safeCounter++;
      }
    });
    if (allEntries.length > 0) {
      const years = allEntries.map((e) =>
        new Date(e.displayDate).getUTCFullYear(),
      );
      minYear = Math.min(minYear, ...years);
      maxYear = Math.max(maxYear, ...years);
    }
    const months: any[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      for (let m = 0; m < 12; m++) {
        const date = new Date(Date.UTC(y, m, 1));
        const key = date.toISOString().slice(0, 7);
        const monthEntries = allEntries.filter((e) =>
          e.displayDate.startsWith(key),
        );
        monthEntries.sort(
          (a, b) =>
            new Date(a.displayDate).getTime() -
            new Date(b.displayDate).getTime(),
        );
        months.push({
          key,
          monthName: date.toLocaleDateString("pt-BR", {
            month: "long",
            timeZone: "UTC",
          }),
          year: y,
          events: monthEntries,
          isCurrent: key === new Date().toISOString().slice(0, 7),
        });
      }
    }
    return months;
  });

  // ── CRUD ──
  function openNovo() {
    isEdit.value = false;
    editData.value = null;
    showModal.value = true;
  }
  function openEditar(item: any) {
    isEdit.value = true;
    editData.value = item;
    showModal.value = true;
  }
  function handleSaved() {
    fetchEventos();
    showModal.value = false;
  }

  function confirmDelete(item: any) {
    confirmTarget.value = item;
    showConfirm.value = true;
  }

  async function deleteEvento() {
    if (!confirmTarget.value) return;
    try {
      const res = (await $fetch("/api/calendario/eventos", {
        method: "DELETE",
        body: { id: confirmTarget.value.id },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Evento excluído!", { type: "success" });
        fetchEventos();
      }
    } catch (e: any) {
      deps.toast.showToast("Erro ao excluir evento", { type: "error" });
    } finally {
      showConfirm.value = false;
      confirmTarget.value = null;
    }
  }

  function toggleMonth(key?: string) {
    if (key) expandedMonths.value[key] = !expandedMonths.value[key];
  }
  function toggleAllMonths(monthKeys: string[]) {
    const allExpanded = monthKeys.every((k) => expandedMonths.value[k]);
    expandedMonths.value = allExpanded
      ? {}
      : Object.fromEntries(monthKeys.map((k) => [k, true]));
  }

  return {
    eventos,
    loading,
    expandedMonths,
    timelineMonths,
    showModal,
    isEdit,
    editData,
    showConfirm,
    confirmTarget,
    fetchEventos,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    deleteEvento,
    toggleMonth,
    toggleAllMonths,
  };
}
