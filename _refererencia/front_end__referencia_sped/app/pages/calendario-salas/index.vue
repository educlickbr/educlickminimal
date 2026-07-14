<script setup lang="ts">
import {
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    format,
    addDays,
} from "date-fns";
import { useCalendarioSalas } from "../../composables/calendario-salas/useCalendarioSalas";
import BaseSelect from "../../components/BaseSelect.vue";
import CalendarioGrid from "../../components/calendario-salas/CalendarioGrid.vue";
import ModalReservaSala from "../../components/calendario-salas/ModalReservaSala.vue";
import { useToast } from "../../../composables/useToast";

const { showToast } = useToast();
const {
    horarios,
    reservas,
    isLoading,
    availableSalas,
    fetchHorarios,
    fetchReservas,
    getReservaForSlot,
} = useCalendarioSalas();

// ── UI state ──────────────────────────────────────────────
const currentDate = ref(new Date());
const selectedSala = ref<string>("all");
const dateInput = ref<HTMLInputElement | null>(null);

const weekDays = computed(() => {
    const start = startOfWeek(currentDate.value, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
});

const filteredHorarios = computed(() => {
    if (selectedSala.value === "all") return horarios.value;
    return horarios.value.filter((h) => h.nome === selectedSala.value);
});

// ── Modal state ───────────────────────────────────────────
const showReservationModal = ref(false);
const selectedSlot = ref<any>(null);
const selectedDay = ref(new Date());
const selectedExistingReserva = ref<any>(null);

// ── Handlers ──────────────────────────────────────────────
const navigateWeek = (direction: "prev" | "next" | "today") => {
    if (direction === "today") currentDate.value = new Date();
    else if (direction === "next")
        currentDate.value = addWeeks(currentDate.value, 1);
    else currentDate.value = subWeeks(currentDate.value, 1);
};

const handleCellClick = (slot: any, day: Date) => {
    const reserva = getReservaForSlot(slot.id, day);

    selectedSlot.value = slot;
    selectedDay.value = day;
    selectedExistingReserva.value = reserva || null;
    showReservationModal.value = true;
};

// ── Lifecycle ─────────────────────────────────────────────
onMounted(async () => {
    try {
        await fetchHorarios();
    } catch (e: any) {
        showToast("Erro ao carregar horários: " + e.message, { type: "error" });
    }
    fetchReservasWrapper();
});

watch(currentDate, () => {
    fetchReservasWrapper();
});

const fetchReservasWrapper = () => {
    if (!weekDays.value.length) return;
    const start = format(weekDays.value[0]!, "yyyy-MM-dd");
    const end = format(weekDays.value[6]!, "yyyy-MM-dd");

    fetchReservas(start, end).catch((e: any) => {
        showToast("Erro ao carregar reservas: " + e.message, { type: "error" });
    });
};

definePageMeta({
    layout: false,
});
</script>

<template>
    <NuxtLayout name="base">
        <div
            class="bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full relative h-[calc(100vh-2rem)] flex flex-col"
        >
            <!-- HEADER -->
            <div
                class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0"
            >
                <div>
                    <h1 class="text-2xl font-bold text-white mb-2">
                        Calendário de Salas
                    </h1>
                    <p class="text-secondary text-sm">
                        Visualize e gerencie a ocupação das salas.
                    </p>
                </div>

                <div class="flex items-center gap-3 w-full md:w-auto">
                    <!-- Sala Filter -->
                    <div class="w-48">
                        <BaseSelect
                            v-model="selectedSala"
                            :options="[
                                { id: 'all', nome: 'Todas as Salas' },
                                ...availableSalas.map((s) => ({
                                    id: s,
                                    nome: s,
                                })),
                            ]"
                            labelKey="nome"
                            valueKey="id"
                            placeholder="Selecione a Sala"
                        />
                    </div>

                    <div class="h-8 w-px bg-white/10 mx-2"></div>

                    <!-- Date Picker -->
                    <div class="relative">
                        <input
                            ref="dateInput"
                            type="date"
                            :value="format(currentDate, 'yyyy-MM-dd')"
                            @input="
                                (e) =>
                                    (currentDate = new Date(
                                        (e.target as HTMLInputElement).value,
                                    ))
                            "
                            class="absolute inset-0 w-0 h-0 opacity-0"
                            style="visibility: hidden"
                        />
                        <button
                            @click="() => dateInput?.showPicker()"
                            class="bg-[#16161E] border border-white/10 rounded-lg px-4 py-2 text-xs font-bold text-white flex items-center gap-2 h-[42px] hover:border-primary/50 transition-colors w-full"
                        >
                            <svg
                                class="w-4 h-4 text-secondary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                ></path>
                            </svg>
                            <span>{{ format(currentDate, "dd/MM/yyyy") }}</span>
                        </button>
                    </div>

                    <!-- Navigation -->
                    <div
                        class="flex items-center bg-[#16161E] rounded-lg border border-white/10 h-[42px]"
                    >
                        <button
                            @click="navigateWeek('prev')"
                            class="px-3 text-secondary hover:text-white border-r border-white/10 h-full flex items-center transition-colors"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15 19l-7-7 7-7"
                                ></path>
                            </svg>
                        </button>
                        <button
                            @click="navigateWeek('today')"
                            class="px-4 text-xs font-bold text-white h-full flex items-center hover:bg-white/5 transition-colors uppercase tracking-wider"
                        >
                            Hoje
                        </button>
                        <button
                            @click="navigateWeek('next')"
                            class="px-3 text-secondary hover:text-white border-l border-white/10 h-full flex items-center transition-colors"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- CALENDAR GRID (componente) -->
            <CalendarioGrid
                :horarios="filteredHorarios"
                :week-days="weekDays"
                :reservas="reservas"
                :is-loading="isLoading"
                @cell-click="handleCellClick"
            />
        </div>
    </NuxtLayout>

    <ModalReservaSala
        :isOpen="showReservationModal"
        :slotData="selectedSlot"
        :day="selectedDay"
        :existingReserva="selectedExistingReserva"
        :allHorarios="horarios"
        :allReservas="reservas"
        @close="showReservationModal = false"
        @refresh="fetchReservasWrapper"
    />
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
