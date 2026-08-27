<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const cicloId = computed(() => route.params.id as string);

const loading = ref(true);
const error = ref<string | null>(null);
const ciclo = ref<any>(null);
const aulas = ref<any[]>([]);

onMounted(async () => {
    if (!cicloId.value) return;
    try {
        const res = (await $fetch("/api/public/calendario/ciclo", {
            params: { id_ciclo: cicloId.value },
        })) as any;

        if (res?.success) {
            ciclo.value = res.ciclo;
            aulas.value = res.aulas || [];
        } else {
            error.value = res?.message || "Erro ao carregar calendário público.";
        }
    } catch (e: any) {
        error.value = e.message || "Erro de conexão.";
    } finally {
        loading.value = false;
    }
});

function formatDate(dateStr?: string) {
    if (!dateStr) return "-";
    return dateStr.split("-").reverse().join("/");
}
</script>

<template>
    <div class="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
        <div class="max-w-4xl mx-auto flex flex-col gap-6">
            <!-- Top Logo & Header -->
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Icon name="ph:calendar-blank-bold" class="w-6 h-6" />
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-white">EduClick</h1>
                        <p class="text-xs text-slate-400">Calendário Público de Turma</p>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="py-20 flex flex-col items-center justify-center gap-3">
                <div class="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <span class="text-xs font-bold text-slate-400">Carregando calendário...</span>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                <p class="text-sm font-bold text-red-400">{{ error }}</p>
            </div>

            <!-- Content -->
            <div v-else class="flex flex-col gap-6">
                <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white">{{ ciclo?.descricao || 'Turma / Ciclo' }}</h2>
                        <p class="text-xs text-purple-400 font-mono mt-1">Ano/Semestre: {{ ciclo?.ano_semestre || '-' }}</p>
                    </div>
                    <span class="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 self-start md:self-auto">
                        {{ aulas.length }} encontros agendados
                    </span>
                </div>

                <!-- Aulas Table / Cards -->
                <div class="grid grid-cols-1 gap-3">
                    <div
                        v-for="aula in aulas"
                        :key="aula.id"
                        class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-purple-500/30 transition-all"
                    >
                        <div class="flex items-center gap-4">
                            <div class="flex flex-col items-center justify-center p-2 min-w-[3.8rem] rounded-xl bg-slate-800/60 border border-slate-700/50">
                                <span class="text-[10px] font-bold text-purple-400 uppercase">{{ formatDate(aula.data) }}</span>
                                <span class="text-xs font-mono font-bold text-slate-300 mt-0.5">{{ aula.hora_ini }}</span>
                            </div>
                            <div class="flex flex-col gap-0.5">
                                <h4 class="text-sm font-bold text-slate-200">
                                    {{ aula.componente || 'Aula Presencial' }}
                                    <span v-if="aula.sub_turma" class="ml-2 text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                        Turma {{ aula.sub_turma }}
                                    </span>
                                </h4>
                                <p class="text-xs text-slate-400">
                                    Prof: <span class="text-slate-300 font-medium">{{ aula.docente || 'Não atribuído' }}</span>
                                </p>
                            </div>
                        </div>
                        <div>
                            <span
                                class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                :class="aula.status === 'cancelada' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'"
                            >
                                {{ aula.status === 'cancelada' ? 'Cancelada' : 'Confirmada' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
