/**
 * useCalendarioCalendario
 * Calendário dinâmico com DnD, programas, views mensal/semanal.
 */
import { ref, computed } from "vue";

const CAL_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const todayUTCStr = new Date().toISOString().slice(0, 10);

export function useCalendarioCalendario(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  toast: {
    showToast: (
      msg: string,
      opts?: { duration?: number; type?: "info" | "error" | "success" },
    ) => void;
  };
}) {
  const programas = ref<any[]>([]);
  const loadingProgramas = ref(false);
  const selectedProgramaId = ref<string | null>(null);
  const selectedPrograma = ref<any>(null);
  const calendarEvents = ref<any[]>([]);
  const loading = ref(false);
  const viewMode = ref<"mensal" | "semanal">("mensal");
  const calCurrentDate = ref(new Date());

  // DnD
  const draggingItem = ref<any>(null);
  const dragTargetDate = ref<string | null>(null);

  // Confirm
  const showConfirm = ref(false);
  const confirmConfig = ref({
    title: "",
    message: "",
    type: "danger" as "danger" | "warning",
    onConfirm: () => {},
  });

  // ── Programs ──
  async function fetchProgramas() {
    loadingProgramas.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/programas", {
        params: { id_entidade, limit: 100 },
      })) as any;
      if (Array.isArray(res?.itens)) programas.value = res.itens;
      else if (res?.success && Array.isArray(res?.itens))
        programas.value = res.itens;
    } catch (e: any) {
      deps.toast.showToast("Erro ao buscar programas", { type: "error" });
    } finally {
      loadingProgramas.value = false;
    }
  }

  async function onProgramaChange() {
    const id = selectedProgramaId.value;
    if (!id) return;
    selectedPrograma.value =
      programas.value.find((x: any) => x.id === id) || null;
    calendarEvents.value = [];
    await fetchCalendarEvents();
  }

  async function fetchCalendarEvents() {
    if (!selectedProgramaId.value) return;
    loading.value = true;
    try {
      const id_entidade = deps.getEntidadeAtivaId();
      const res = (await $fetch("/api/programas/calendario", {
        params: { id_entidade, id_programa: selectedProgramaId.value },
      })) as any;
      if (res?.success) calendarEvents.value = res.itens || [];
    } catch (e: any) {
      deps.toast.showToast("Erro ao buscar calendário", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function clearSelection() {
    selectedProgramaId.value = null;
    selectedPrograma.value = null;
    calendarEvents.value = [];
  }

  // ── Drag & Drop ──
  function onDragStart(item: any) {
    draggingItem.value = item;
  }
  function onDragEnd() {
    draggingItem.value = null;
    dragTargetDate.value = null;
  }

  async function onDrop(newDate: string) {
    if (!draggingItem.value) return;
    if (newDate === draggingItem.value.data) {
      onDragEnd();
      return;
    }
    const hasFeriado = (eventsMap.value[newDate] || []).some(
      (e: any) => e._tipo === "feriado",
    );
    if (hasFeriado) {
      deps.toast.showToast("Não é possível mover para um feriado", {
        type: "error",
      });
      onDragEnd();
      return;
    }
    if (draggingItem.value.status === "cancelada")
      await reagendarAulaCancelada(draggingItem.value, newDate);
    else await moveAula(draggingItem.value.id, newDate);
  }

  async function moveAula(idAula: string, newDate: string) {
    const item = calendarEvents.value.find((e: any) => e.id === idAula);
    const oldDate = item?.data;
    if (item) item.data = newDate;
    try {
      const res = (await $fetch("/api/programas/aula", {
        method: "PATCH",
        body: {
          id: idAula,
          nova_data: newDate,
          id_entidade: deps.getEntidadeAtivaId(),
          action: "mover",
        },
      })) as any;
      if (!res?.success) throw new Error(res?.message || "Erro");
      deps.toast.showToast("Aula movida com sucesso", { type: "success" });
    } catch (e: any) {
      if (item && oldDate) item.data = oldDate;
      deps.toast.showToast("Erro: " + e.message, { type: "error" });
    } finally {
      onDragEnd();
    }
  }

  async function reagendarAulaCancelada(itemOrigem: any, newDate: string) {
    try {
      const res = (await $fetch("/api/programas/aula", {
        method: "PATCH",
        body: {
          id: itemOrigem.id,
          nova_data: newDate,
          id_entidade: deps.getEntidadeAtivaId(),
          action: "reagendar",
        },
      })) as any;
      if (!res?.success) throw new Error(res?.message || "Erro");
      calendarEvents.value.push({
        ...itemOrigem,
        id: res.novo_id,
        data: newDate,
        status: "reagendada",
        id_aula_origem: itemOrigem.id,
      });
      deps.toast.showToast("Reposição agendada", { type: "success" });
    } catch (e: any) {
      deps.toast.showToast("Erro: " + e.message, { type: "error" });
    } finally {
      onDragEnd();
    }
  }

  function handleCancelarAula(item: any) {
    confirmConfig.value = {
      title: "Cancelar Aula",
      message: "Tem certeza que deseja cancelar esta aula?",
      type: "danger",
      onConfirm: () => confirmCancelarAula(item.id),
    };
    showConfirm.value = true;
  }

  async function confirmCancelarAula(idAula: string) {
    const item = calendarEvents.value.find((e: any) => e.id === idAula);
    const oldStatus = item?.status;
    if (item) item.status = "cancelada";
    try {
      const res = (await $fetch("/api/programas/aula", {
        method: "PATCH",
        body: {
          id: idAula,
          id_entidade: deps.getEntidadeAtivaId(),
          action: "cancelar",
        },
      })) as any;
      if (!res?.success) throw new Error(res?.message || "Erro");
      deps.toast.showToast("Aula cancelada.", { type: "success" });
    } catch (e: any) {
      if (item && oldStatus) item.status = oldStatus;
      deps.toast.showToast("Erro: " + e.message, { type: "error" });
    }
  }

  function getOrigemDataText(idOrigem: string) {
    const o = calendarEvents.value.find((e: any) => e.id === idOrigem);
    return o?.data ? o.data.split("-").reverse().join("/") : "";
  }

  // ── Computed ──
  const eventsMap = computed(() => {
    const map: Record<string, any[]> = {};
    calendarEvents.value.forEach((item) => {
      if (item.data) {
        if (!map[item.data]) map[item.data] = [];
        map[item.data]!.push(item);
      }
    });
    return map;
  });

  const calMonthGrid = computed(() => {
    const base = calCurrentDate.value;
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    let curr = new Date(Date.UTC(year, month, 1 - firstDay.getUTCDay()));
    const weeks: any[][] = [];
    while (true) {
      const week: any[] = [];
      for (let d = 0; d < 7; d++) {
        const ds = curr.toISOString().slice(0, 10);
        week.push({
          dateStr: ds,
          day: curr.getUTCDate(),
          isCurrentMonth: curr.getUTCMonth() === month,
          isToday: ds === todayUTCStr,
          events: eventsMap.value[ds] || [],
        });
        curr = new Date(
          Date.UTC(
            curr.getUTCFullYear(),
            curr.getUTCMonth(),
            curr.getUTCDate() + 1,
          ),
        );
      }
      weeks.push(week);
      if (curr > lastDay && weeks.length >= 4) break;
      if (weeks.length >= 6) break;
    }
    return weeks;
  });

  const calMonthLabel = computed(() =>
    calCurrentDate.value
      .toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
      .replace(/^./, (s) => s.toUpperCase()),
  );
  const calWeekDays = computed(() => {
    const base = calCurrentDate.value;
    const dow = base.getUTCDay();
    let ws = new Date(
      Date.UTC(
        base.getUTCFullYear(),
        base.getUTCMonth(),
        base.getUTCDate() - dow,
      ),
    );
    return Array.from({ length: 7 }, (_, d) => {
      const ds = ws.toISOString().slice(0, 10);
      const day = ws.getUTCDate();
      const ms = ws
        .toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })
        .replace(".", "");
      ws = new Date(
        Date.UTC(ws.getUTCFullYear(), ws.getUTCMonth(), ws.getUTCDate() + 1),
      );
      return {
        dateStr: ds,
        label: CAL_DAYS[d],
        dayNum: day,
        monthShort: ms,
        isToday: ds === todayUTCStr,
        events: eventsMap.value[ds] || [],
      };
    });
  });
  const calWeekLabel = computed(() => {
    const s = calWeekDays.value[0];
    const e = calWeekDays.value[6];
    if (!s || !e) return "";
    return `${s.dayNum} – ${e.dayNum} de ${s.monthShort.charAt(0).toUpperCase() + s.monthShort.slice(1)} ${calCurrentDate.value.getUTCFullYear()}`;
  });

  function prevMonth() {
    const d = new Date(calCurrentDate.value);
    d.setUTCMonth(d.getUTCMonth() - 1);
    calCurrentDate.value = d;
  }
  function nextMonth() {
    const d = new Date(calCurrentDate.value);
    d.setUTCMonth(d.getUTCMonth() + 1);
    calCurrentDate.value = d;
  }
  function prevWeek() {
    const d = new Date(calCurrentDate.value);
    d.setUTCDate(d.getUTCDate() - 7);
    calCurrentDate.value = d;
  }
  function nextWeek() {
    const d = new Date(calCurrentDate.value);
    d.setUTCDate(d.getUTCDate() + 7);
    calCurrentDate.value = d;
  }
  function goToToday() {
    calCurrentDate.value = new Date();
  }

  return {
    programas,
    loadingProgramas,
    selectedProgramaId,
    selectedPrograma,
    calendarEvents,
    loading,
    viewMode,
    calCurrentDate,
    calMonthGrid,
    calMonthLabel,
    calWeekDays,
    calWeekLabel,
    eventsMap,
    CAL_DAYS,
    draggingItem,
    dragTargetDate,
    showConfirm,
    confirmConfig,
    fetchProgramas,
    onProgramaChange,
    fetchCalendarEvents,
    clearSelection,
    onDragStart,
    onDragEnd,
    onDrop,
    handleCancelarAula,
    getOrigemDataText,
    prevMonth,
    nextMonth,
    prevWeek,
    nextWeek,
    goToToday,
  };
}
