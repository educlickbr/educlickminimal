<script setup lang="ts">
import { formatDate } from "@/utils/date";
import type { MappedCourse } from "@/composables/processo_seletivo/useProcessoSeletivoCursos";

defineOptions({
    inheritAttrs: false,
});

const props = defineProps<{
    course: MappedCourse;
    selectedCategory: string;
    regularBlocked: boolean;
    loadingElegibilidadeRegulares: boolean;
}>();

const emit = defineEmits<{
    enroll: [course: MappedCourse];
}>();
</script>

<template>
    <div
        class="bg-background rounded-xl shadow-sm border border-secondary/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
    >
        <!-- Image Header -->
        <div
            class="relative h-32 overflow-hidden flex items-center justify-center p-4 bg-[#D60956]"
        >
            <div
                class="absolute inset-0 bg-gradient-to-br from-[#D60956] to-[#C40E53] z-0"
            ></div>
            <div
                class="relative z-10 flex flex-col items-center justify-center"
            >
                <img
                    :src="course.image"
                    :alt="course.title"
                    class="h-16 w-auto object-contain drop-shadow-md brightness-0 invert"
                />
            </div>
        </div>

        <!-- Content -->
        <div class="p-6 flex flex-col flex-1 gap-5">
            <!-- Title -->
            <h3
                class="text-lg font-black text-text leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]"
            >
                {{ course.title }}
            </h3>

            <!-- Info Blocks -->
            <div
                class="bg-div-15/50 border border-secondary/5 rounded-lg p-5 space-y-4"
            >
                <!-- Inscricao -->
                <div class="flex items-start gap-3">
                    <div
                        class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                    >
                        <svg
                            class="w-4 h-4 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                            ></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="w-full">
                        <p
                            class="text-[10px] uppercase font-black tracking-wider text-secondary/60 mb-0.5"
                        >
                            Período de Inscrição
                        </p>
                        <p
                            class="text-sm font-bold text-text bg-background border border-secondary/5 px-2 py-1 rounded-md inline-block"
                        >
                            {{ formatDate(course.rawDates.start, "dd/MM") }} a
                            {{ formatDate(course.rawDates.end, "dd/MM/yy") }}
                        </p>
                    </div>
                </div>

                <!-- Período do Curso / Módulo -->
                <div class="flex items-start gap-3">
                    <div
                        class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0"
                    >
                        <svg
                            class="w-4 h-4 text-secondary"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                            ></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="w-full">
                        <p
                            class="text-[10px] uppercase font-black tracking-wider text-secondary/60 mb-0.5"
                        >
                            {{
                                selectedCategory === "regulares"
                                    ? "Período do Módulo"
                                    : "Período do Curso"
                            }}
                        </p>
                        <p
                            class="text-sm font-bold text-secondary bg-background border border-secondary/5 px-2 py-1 rounded-md inline-block"
                        >
                            {{
                                course.rawDates.startCourse
                                    ? formatDate(
                                          course.rawDates.startCourse,
                                          "dd/MM",
                                      )
                                    : "--"
                            }}
                            a
                            {{
                                course.rawDates.endCourse
                                    ? formatDate(
                                          course.rawDates.endCourse,
                                          "dd/MM/yy",
                                      )
                                    : "--"
                            }}
                        </p>
                        <p
                            v-if="selectedCategory === 'regulares'"
                            class="text-xs font-bold text-secondary/80 mt-2"
                        >
                            Duração do Curso: 2 Anos
                        </p>
                    </div>
                </div>

                <!-- Separator -->
                <div class="h-px bg-secondary/10 w-full"></div>

                <!-- Aulas (Dias) -->
                <div class="flex items-start gap-3">
                    <div
                        class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                    >
                        <svg
                            class="w-4 h-4 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                    </div>
                    <div class="w-full">
                        <p
                            class="text-[10px] uppercase font-black tracking-wider text-secondary/60 mb-1"
                        >
                            Dias de Aula
                        </p>
                        <div class="flex flex-wrap gap-1">
                            <span
                                v-for="day in course.weekDays"
                                :key="day"
                                class="text-[10px] font-bold text-secondary bg-background border border-secondary/10 px-2 py-1 rounded shadow-sm uppercase"
                            >
                                {{ day }}
                            </span>
                            <span
                                v-if="course.weekDays.length === 0"
                                class="text-[10px] text-secondary italic"
                                >A definir</span
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Stats -->
            <div class="flex items-center gap-3 mt-auto">
                <div
                    class="flex-1 flex items-center justify-center gap-2 bg-div-15 rounded-xl py-3 text-xs font-bold text-secondary border border-secondary/5"
                >
                    <svg
                        class="w-4 h-4 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {{ course.hours }} Horas
                </div>
                <div
                    class="flex-1 flex items-center justify-center gap-2 bg-div-15 rounded-xl py-3 text-xs font-bold text-secondary border border-secondary/5"
                >
                    <svg
                        class="w-4 h-4 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
                        ></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {{ course.mode }}
                </div>
            </div>

            <!-- CTA Button -->
            <p
                v-if="regularBlocked"
                class="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2"
            >
                CPF ou login já possui inscrição em Regulares para
                {{ course.anoSemestre }}.
            </p>
            <button
                @click="emit('enroll', course)"
                :disabled="regularBlocked || loadingElegibilidadeRegulares"
                class="w-full text-white font-black py-4 rounded-xl text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                :class="
                    regularBlocked
                        ? 'bg-zinc-600 cursor-not-allowed opacity-70 shadow-none'
                        : 'bg-primary shadow-primary/20 hover:bg-[#b81151] hover:shadow-primary/30 hover:-translate-y-0.5 group-hover:animate-pulse'
                "
            >
                {{ regularBlocked ? "Indisponível" : "Inscrever-se" }}
                <svg
                    class="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </button>
        </div>
    </div>
</template>
