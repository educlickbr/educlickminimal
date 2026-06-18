/**
 * useCalendarioFeriados
 * CRUD de feriados e recessos + timeline em árvore.
 */
import { ref, computed } from "vue";

export function useCalendarioFeriados(deps: {
  getEntidadeAtivaId: () => string | null;
  toast: {
    showToast: (
      msg: string,
      opts?: { duration?: number; type?: "info" | "error" | "success" },
    ) => void;
  };
  selectedYear: () => number;
}) {
  const feriados = ref<any[]>([]);
  const loading = ref(false);
  const expandedMonths = ref<Record<string, boolean>>({});

  const showModal = ref(false);
  const isEdit = ref(false);
  const editData = ref<any>(null);
  const showConfirm = ref(false);
  const confirmTarget = ref<any>(null);

  async function fetchFeriados() {
    loading.value = true;
    try {
      const res = (await $fetch("/api/calendario/feriados", {
        params: {
          id_entidade: deps.getEntidadeAtivaId(),
          ano: deps.selectedYear(),
        },
      })) as any;
      if (res?.success) {
        feriados.value = res.itens || [];
        if (Object.keys(expandedMonths.value).length === 0) {
          expandedMonths.value[new Date().toISOString().slice(0, 7)] = true;
        }
      }
    } catch (e: any) {
      deps.toast.showToast("Erro ao buscar feriados", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  // ── Timeline / Árvore ──
  const timelineMonths = computed(() => {
    const rawItems = feriados.value;
    let minYear = deps.selectedYear();
    let maxYear = deps.selectedYear();

    const allEntries: any[] = [];
    rawItems.forEach((item) => {
      const entryDate = new Date(item.data + "T12:00:00").toISOString();
      allEntries.push({
        ...item,
        isFeriado: true,
        uniqueKey: `${item.id}_${entryDate}`,
        displayDate: entryDate,
        displayName: item.nome,
        isFirstDay: true,
        originalStart: item.data,
      });
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

  function toggleMonth(key?: string) {
    if (key) expandedMonths.value[key] = !expandedMonths.value[key];
  }
  function toggleAllMonths(monthKeys: string[]) {
    const allExpanded = monthKeys.every((k) => expandedMonths.value[k]);
    expandedMonths.value = allExpanded
      ? {}
      : Object.fromEntries(monthKeys.map((k) => [k, true]));
  }

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
    fetchFeriados();
    showModal.value = false;
  }
  function confirmDelete(item: any) {
    confirmTarget.value = item;
    showConfirm.value = true;
  }

  async function deleteFeriado() {
    if (!confirmTarget.value) return;
    try {
      const res = (await $fetch("/api/calendario/feriados", {
        method: "DELETE",
        body: { id: confirmTarget.value.id },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Feriado excluído!", { type: "success" });
        fetchFeriados();
      }
    } catch (e: any) {
      deps.toast.showToast("Erro ao excluir feriado", { type: "error" });
    } finally {
      showConfirm.value = false;
      confirmTarget.value = null;
    }
  }

  return {
    feriados,
    loading,
    expandedMonths,
    timelineMonths,
    showModal,
    isEdit,
    editData,
    showConfirm,
    confirmTarget,
    fetchFeriados,
    openNovo,
    openEditar,
    handleSaved,
    confirmDelete,
    deleteFeriado,
    toggleMonth,
    toggleAllMonths,
  };
}
