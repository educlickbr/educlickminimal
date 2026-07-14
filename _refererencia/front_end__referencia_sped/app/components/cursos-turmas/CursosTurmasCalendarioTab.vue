<script setup lang="ts">
import BaseSelect from "../BaseSelect.vue";
import CalendarioTurma from "./CalendarioTurma.vue";

const props = defineProps<{
    events: any[];
    isLoading: boolean;
    calendarArea: string | null;
    anoSemestre: string;
    semesterOptions: { label: string; value: string }[];
    areaOptions: { label: string; value: string | null }[];
    calendarTurmas: { id: string; label: string; labelShort: string }[];
    selectedCalendarTurmaId: string | null;
}>();

const emit = defineEmits<{
    "update:calendarArea": [value: string | null];
    "update:anoSemestre": [value: string];
    "update:selectedCalendarTurmaId": [value: string | null];
    refresh: [];
}>();
</script>

<template>
    <div>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
            <div class="md:col-span-3">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Semestre</label
                >
                <BaseSelect
                    :model-value="anoSemestre"
                    :options="semesterOptions"
                    label-key="label"
                    value-key="value"
                    placeholder="Selecione"
                    @update:model-value="emit('update:anoSemestre', $event)"
                />
            </div>
            <div class="md:col-span-3">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Área</label
                >
                <BaseSelect
                    :model-value="calendarArea"
                    :options="areaOptions"
                    label-key="label"
                    value-key="value"
                    placeholder="Todas as Áreas"
                    @update:model-value="emit('update:calendarArea', $event)"
                />
            </div>
            <div class="md:col-span-6">
                <label
                    class="block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"
                    >Selecione a Turma</label
                >
                <BaseSelect
                    :model-value="selectedCalendarTurmaId"
                    :options="calendarTurmas"
                    label-key="label"
                    value-key="id"
                    selected-label-key="labelShort"
                    placeholder="Selecione uma turma para visualizar o calendário"
                    :disabled="calendarTurmas.length === 0"
                    @update:model-value="
                        emit('update:selectedCalendarTurmaId', $event)
                    "
                />
            </div>
        </div>

        <div
            v-if="isLoading && !events.length"
            class="flex justify-center py-20"
        >
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"
            ></div>
        </div>

        <div v-else class="bg-[#0f0f15] border border-white/5 rounded-xl p-6">
            <CalendarioTurma
                :events="events"
                :turmaId="selectedCalendarTurmaId"
                @refresh="emit('refresh')"
            />
        </div>
    </div>
</template>
