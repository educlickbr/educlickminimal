<script setup lang="ts">
import { ref } from "vue";
import { isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

const props = defineProps<{
  horarios: any[];
  weekDays: Date[];
  reservas: any[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: "cell-click", slot: any, day: Date): void;
}>();

const hoveredInfo = ref<any>(null);
const tooltipPos = ref({ x: 0, y: 0 });

const getReservaForSlot = (slotId: string, day: Date) => {
  const targetDate = formatInTimeZone(day, "America/Sao_Paulo", "yyyy-MM-dd");
  return props.reservas.find(
    (r) => r.sala_horario_id === slotId && r.data === targetDate
  );
};

const getBackgroundColor = (salaColor: string) => ({
  borderColor: salaColor,
  backgroundColor: `${salaColor}10`,
});

const handleMouseEnter = (event: MouseEvent, slot: any, day: Date) => {
  const reserva = getReservaForSlot(slot.id, day);
  if (!reserva) return;
  hoveredInfo.value = reserva;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  tooltipPos.value = { x: rect.right + 10, y: rect.top };
};

const handleMouseLeave = () => {
  hoveredInfo.value = null;
};
</script>

<template>
  <div
    class="flex-1 overflow-auto bg-[#16161E] border border-white/5 rounded-xl relative custom-scrollbar"
  >
    <!-- Date Headers Sticky -->
    <div
      class="border-b border-white/10 sticky top-0 bg-[#16161E] z-20 grid"
      style="grid-template-columns: 200px repeat(7, minmax(140px, 1fr))"
    >
      <div
        class="p-4 flex flex-col justify-center items-center border-r border-white/5 font-bold text-secondary text-xs bg-[#16161E] sticky left-0 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.5)]"
      >
        <span class="uppercase tracking-wider">Sala / Horário</span>
      </div>
      <div
        v-for="day in weekDays"
        :key="day.toString()"
        class="p-3 text-center border-r border-white/5 last:border-0 bg-[#16161E]"
        :class="isSameDay(day, new Date()) ? 'bg-primary/5' : ''"
      >
        <div class="text-[10px] uppercase font-bold text-secondary mb-1">
          {{ format(day, "EEE", { locale: ptBR }) }}
        </div>
        <div
          class="text-xl font-bold"
          :class="isSameDay(day, new Date()) ? 'text-primary' : 'text-white'"
        >
          {{ format(day, "dd/MM") }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !horarios.length" class="flex justify-center py-20">
      <svg
        class="animate-spin h-8 w-8 text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>

    <!-- Flat Rows -->
    <template v-else>
      <div
        v-for="slot in horarios"
        :key="slot.id"
        class="border-b border-white/5 hover:bg-white/[0.02] transition-colors grid"
        style="grid-template-columns: 200px repeat(7, minmax(140px, 1fr))"
      >
        <!-- Left Header (Sticky) -->
        <div
          class="sticky left-0 bg-[#16161E] border-r border-white/5 p-4 flex flex-col justify-center z-10 shadow-[4px_0_12px_rgba(0,0,0,0.2)] group"
          :style="{ borderLeft: `4px solid ${slot.cor}` }"
        >
          <span class="text-sm font-bold text-white mb-1">{{ slot.nome }}</span>
          <span class="text-xs font-medium text-secondary">{{
            slot.horario_total
          }}</span>
        </div>

        <!-- Days Cells -->
        <div
          v-for="day in weekDays"
          :key="slot.id + day.toString()"
          class="border-r border-white/5 last:border-0 p-1 min-h-[80px] relative"
          :style="{
            backgroundColor: getReservaForSlot(slot.id, day)
              ? ''
              : `${slot.cor}08`,
          }"
        >
          <button
            @click="emit('cell-click', slot, day)"
            @mouseenter="handleMouseEnter($event, slot, day)"
            @mouseleave="handleMouseLeave"
            class="w-full h-full rounded flex flex-col items-center justify-center p-2 transition-all hover:bg-white/10 relative group"
          >
            <template v-if="getReservaForSlot(slot.id, day)">
              <div
                class="absolute inset-1 rounded border-l-4 flex flex-col items-start justify-center px-3 shadow-lg z-0 overflow-hidden"
                :class="
                  getReservaForSlot(slot.id, day)?.tipo_calculado === 'turma'
                    ? 'bg-[#1A1B26]/90'
                    : 'bg-[#1A1B26]'
                "
                :style="
                  getReservaForSlot(slot.id, day)?.tipo_calculado === 'turma'
                    ? { borderLeftColor: '#4B5563' }
                    : {
                        borderLeftColor: slot.cor,
                        backgroundColor: slot.cor + '20',
                      }
                "
              >
                <span
                  class="text-xs font-bold w-full z-10 relative line-clamp-2 text-left text-white"
                >
                  {{
                    getReservaForSlot(slot.id, day)?.tipo_calculado === "turma"
                      ? getReservaForSlot(slot.id, day)?.turma_info_completa
                      : getReservaForSlot(slot.id, day)?.evento
                  }}
                </span>
                <span
                  class="text-[10px] text-left w-full truncate z-10 relative mt-0.5 text-secondary"
                >
                  {{ getReservaForSlot(slot.id, day)?.observacoes || "" }}
                </span>
              </div>
            </template>
            <template v-else>
              <span
                class="opacity-0 group-hover:opacity-100 text-secondary text-xs font-bold transition-opacity"
                >+</span
              >
            </template>
          </button>
        </div>
      </div>
    </template>
  </div>

  <!-- Tooltip -->
  <Teleport to="body">
    <div
      v-if="hoveredInfo"
      class="fixed z-50 bg-[#1A1B26] border border-white/10 rounded-xl shadow-2xl p-4 w-64 pointer-events-none transition-opacity duration-200"
      :style="{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }"
    >
      <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
        <div
          class="w-1.5 h-4 rounded"
          :class="
            hoveredInfo.tipo_calculado === 'turma'
              ? 'bg-[#4B5563]'
              : 'bg-primary'
          "
        ></div>
        <span
          class="text-xs font-bold text-white uppercase tracking-wider"
        >
          {{ hoveredInfo.tipo_calculado === "turma" ? "Turma" : "Evento" }}
        </span>
      </div>
      <h4 class="text-sm font-bold text-white mb-2 leading-tight">
        {{
          hoveredInfo.tipo_calculado === "turma"
            ? hoveredInfo.turma_info_completa
            : hoveredInfo.evento
        }}
      </h4>
      <div
        v-if="hoveredInfo.observacoes"
        class="text-xs text-secondary/80 bg-black/20 p-2 rounded-lg leading-relaxed"
      >
        {{ hoveredInfo.observacoes }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #16161e;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-corner {
  background: #16161e;
}
</style>
