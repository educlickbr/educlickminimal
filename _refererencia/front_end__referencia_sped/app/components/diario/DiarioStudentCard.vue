<script setup lang="ts">
import { computed } from "vue";
import { buildProtectedFileUrl } from "~/utils/protected-file-url";

const props = defineProps<{
    student: any;
    aulaSelecionada: string;
    isRegulares: boolean;
    hashBase: string;
    savingAttendance: Record<
        string,
        { status: "saving" | "saved"; timestamp?: Date }
    >;
    getDiarioProperty: (aula: string) => string;
}>();

const emit = defineEmits<{
    (e: "presenca", student: any): void;
    (e: "falta", student: any): void;
    (e: "justificativa", student: any): void;
    (e: "abono", student: any): void;
    (e: "report", student: any): void;
    (e: "delete", student: any): void;
}>();

const statusProp = computed(() =>
    props.getDiarioProperty(props.aulaSelecionada),
);
const current = computed(
    () => props.student[statusProp.value]?.toLowerCase?.() || null,
);
const isActive = props.student.status_matricula === "Ativa";
const hasRecord = computed(() => !!props.student[statusProp.value]);

const statusClass = computed(() => {
    if (!current.value)
        return "text-yellow-500 border-yellow-500/20 bg-yellow-500/10";
    if (current.value === "presente")
        return "text-emerald-500 border-emerald-500/20 bg-emerald-500/10";
    if (["ausente", "falta"].includes(current.value))
        return "text-red-500 border-red-500/20 bg-red-500/10";
    if (
        ["justificado", "abono", "justificada", "abonada"].includes(
            current.value,
        )
    )
        return "text-blue-500 border-blue-500/20 bg-blue-500/10";
    return "text-yellow-500 border-yellow-500/20 bg-yellow-500/10";
});

const statusLabel = computed(() => {
    return props.student[statusProp.value] || "PENDENTE";
});

const saving = computed(
    () => props.savingAttendance[props.student.id_matricula],
);
</script>

<template>
    <div
        class="bg-[#16161E] border border-white/5 rounded-xl flex md:overflow-visible overflow-hidden transition-colors group relative min-h-[160px] h-auto"
        :class="
            isActive
                ? 'hover:border-primary/30'
                : 'opacity-50 grayscale-[0.8] hover:border-white/10'
        "
    >
        <!-- Left: Photo + Status Column -->
        <div
            class="w-24 md:w-32 relative flex-shrink-0 bg-white/5 border-r border-white/5 flex flex-col"
        >
            <div class="relative flex-1 w-full rounded-tl-xl md:rounded-tl-lg">
                <img
                    v-if="student.foto_user && hashBase"
                    :src="
                        buildProtectedFileUrl(
                            hashBase,
                            student.foto_user,
                            'secretaria',
                        )
                    "
                    class="absolute inset-0 w-full h-full object-cover transition-all duration-300 z-10 rounded-tl-xl md:rounded-tl-lg"
                    alt="Foto"
                    @error="(e: any) => (e.target.style.display = 'none')"
                />
                <div
                    v-else
                    class="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-secondary bg-black/20 rounded-tl-xl md:rounded-tl-lg"
                >
                    <span class="text-2xl mb-1">{{
                        student.name_display?.fallbackInitial
                    }}</span>
                    <span class="text-[9px] opacity-50">Sem Foto</span>
                </div>
            </div>

            <!-- Status Badge -->
            <div
                class="w-full py-1 flex items-center justify-center gap-1.5 border-t"
                :class="{
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500':
                        isActive,
                    'bg-red-500/10 border-red-500/20 text-red-500': !isActive,
                }"
            >
                <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="isActive ? 'bg-emerald-500' : 'bg-red-500'"
                ></span>
                <span class="text-[8px] font-black uppercase tracking-wider">{{
                    student.status_matricula
                }}</span>
            </div>
        </div>

        <!-- Right: Info + Actions -->
        <div
            class="flex-1 p-3 flex flex-col justify-between min-w-0 z-10 gap-3 relative"
        >
            <!-- Top Info Block -->
            <div class="space-y-1 relative h-full">
                <div class="w-full space-y-0.5">
                    <h5
                        class="text-sm font-bold text-white truncate leading-tight"
                        :title="student.name_display?.primaryName"
                    >
                        {{ student.name_display?.primaryName }}
                    </h5>
                    <p class="text-[10px] text-secondary truncate">
                        {{ student.name_display?.secondaryText }}
                    </p>
                    <p
                        v-if="student.nome_artistico"
                        class="text-[10px] text-secondary truncate font-italic"
                    >
                        Nome Artístico: {{ student.nome_artistico }}
                    </p>
                    <p class="text-[10px] text-secondary/60 truncate font-mono">
                        RA: {{ student.ra || student.ra_legado || "-" }}
                    </p>
                    <div
                        v-if="isRegulares && student.tem_bolsa_ativa"
                        class="pt-1"
                    >
                        <span
                            class="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500/15 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/30"
                        >
                            Bolsista
                        </span>
                    </div>
                </div>

                <!-- Status Badge + Report Button -->
                <div class="pt-4 flex justify-between items-end">
                    <button
                        @click="emit('report', student)"
                        class="px-3 h-6 rounded flex items-center justify-center text-[9px] font-bold uppercase tracking-wider transition-all border bg-yellow-500 border-yellow-500 text-black hover:bg-yellow-400 active:scale-95 shadow-lg shadow-yellow-900/20"
                        title="Relatório de Faltas"
                    >
                        RELAT.
                    </button>

                    <div class="flex items-center gap-2">
                        <div
                            class="px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border shadow-sm backdrop-blur-sm"
                            :class="statusClass"
                        >
                            {{ statusLabel }}
                        </div>

                        <button
                            v-if="isActive"
                            @click="emit('delete', student)"
                            :disabled="!hasRecord"
                            class="w-7 h-7 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-red-400"
                            :title="
                                hasRecord
                                    ? 'Apagar registro desta aula'
                                    : 'Sem registro para apagar nesta aula'
                            "
                        >
                            <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Bottom: Attendance Actions OR Warning -->
            <div
                class="flex items-center justify-between mt-1 pt-2 border-t border-white/5 min-h-[36px]"
            >
                <!-- Inactive Warning -->
                <div
                    v-if="!isActive"
                    class="w-full flex items-center justify-center gap-2 text-red-400 opacity-80"
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                    </svg>
                    <span class="text-[10px] font-bold uppercase tracking-wider"
                        >Aluno não possui matrícula ativa</span
                    >
                </div>

                <!-- Actions (Active Only) -->
                <template v-else>
                    <!-- Saving State -->
                    <div
                        v-if="saving?.status === 'saving'"
                        class="w-full flex items-center justify-center gap-2 text-primary"
                    >
                        <svg
                            class="w-4 h-4 animate-spin"
                            fill="none"
                            stroke="currentColor"
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
                        <span
                            class="text-[10px] font-bold uppercase tracking-wider"
                            >Aguardando...</span
                        >
                    </div>

                    <!-- Saved State -->
                    <div
                        v-else-if="saving?.status === 'saved'"
                        class="w-full flex items-center justify-center gap-2 text-success"
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
                                d="M5 13l4 4L19 7"
                            ></path>
                        </svg>
                        <span
                            class="text-[10px] font-bold uppercase tracking-wider"
                        >
                            Salvo às
                            {{
                                saving?.timestamp?.toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                            }}
                        </span>
                    </div>

                    <!-- Normal State - Buttons -->
                    <div
                        v-else
                        class="flex items-center gap-2 w-full justify-between"
                    >
                        <button
                            @click="emit('presenca', student)"
                            class="flex-1 h-9 rounded flex items-center justify-center text-sm font-black transition-all border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-900/20"
                            title="Presença"
                        >
                            P
                        </button>
                        <button
                            @click="emit('falta', student)"
                            class="flex-1 h-9 rounded flex items-center justify-center text-sm font-black transition-all border border-red-600 bg-red-600 text-white hover:bg-red-500 active:scale-95 shadow-lg shadow-red-900/20"
                            title="Falta"
                        >
                            F
                        </button>
                        <button
                            @click="emit('justificativa', student)"
                            class="flex-1 h-9 rounded flex items-center justify-center text-sm font-black transition-all border border-blue-600 bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-900/20"
                            title="Justificativa"
                        >
                            J
                        </button>
                        <button
                            @click="emit('abono', student)"
                            class="flex-1 h-9 rounded flex items-center justify-center text-sm font-black transition-all border border-purple-600 bg-purple-600 text-white hover:bg-purple-500 active:scale-95 shadow-lg shadow-purple-900/20"
                            title="Abono"
                        >
                            A
                        </button>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
