<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    students: any[];
    loading: boolean;
    aulaSelecionada: 'aula_1' | 'aula_2' | 'aula_3' | 'aula_4';
    showRelatorioBolsistas?: boolean;
}>();

const emit = defineEmits<{
    (e: 'open-relatorio-bolsistas'): void;
}>();

// --- 1. Enrollment Stats ---
const enrollmentStats = computed(() => {
    const total = props.students.length;
    const counts: Record<string, number> = {
        'Ativa': 0,
        'Cancelada': 0,
        'Trancamento': 0,
        'Anulada': 0
    };

    props.students.forEach(s => {
        const status = s.status_matricula || 'Outros';
        if (counts[status] !== undefined) {
            counts[status]++;
        } else {
            // Group others if needed, or just add key
            counts[status] = (counts[status] || 0) + 1;
        }
    });

    return {
        total,
        counts
    };
});

// --- 2. Attendance Stats (Chart) ---
const attendanceStats = computed(() => {
    const total = props.students.length;
    
    // Key mapping to match possible values in DB (lowercase usually)
    // present, falta, justificado, abono, null
    const counts = {
        'Pendente': 0,
        'Presente': 0,
        'Falta': 0,
        'Justificado': 0,
        'Abono': 0
    };

    props.students.forEach(s => {
        // Determine which period suffix to check (p1, p2, etc)
        // map 'aula_1' -> 'diario_p1'
        const keyMap: Record<string, string> = {
            'aula_1': 'diario_p1',
            'aula_2': 'diario_p2',
            'aula_3': 'diario_p3',
            'aula_4': 'diario_p4'
        };
        const selectedKey = props.aulaSelecionada as string;
        const field = keyMap[selectedKey] || '';
        const raw = (s as any)[field];
        const val = typeof raw === 'string' ? raw.toLowerCase() : '';

        if (!val) {
            counts['Pendente']++;
        } else if (val === 'presente' || val === 'p') {
            counts['Presente']++;
        } else if (val === 'falta' || val === 'f' || val === 'ausente') {
            counts['Falta']++;
        } else if (val === 'justificado' || val === 'justificada' || val === 'j') {
            counts['Justificado']++;
        } else if (val === 'abono' || val === 'abonada' || val === 'a') {
            counts['Abono']++;
        } else {
            // Default fallback
            counts['Pendente']++;
        }
    });

    // Calculate percentages for bars
    return Object.entries(counts).map(([label, count]) => ({
        label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        colorClass: getColorClass(label)
    }));
});

const getColorClass = (label: string) => {
    switch(label) {
        case 'Presente': return 'bg-emerald-500';
        case 'Falta': return 'bg-red-500';
        case 'Justificado': return 'bg-blue-500';
        case 'Abono': return 'bg-purple-500';
        default: return 'bg-yellow-500'; // Pendente
    }
};

</script>

<template>
    <div class="space-y-6">

        <button
            v-if="showRelatorioBolsistas"
            @click="emit('open-relatorio-bolsistas')"
            class="w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group"
        >
            <div class="flex flex-col items-start">
                <span>Relatório Bolsistas</span>
                <span class="text-[10px] text-secondary-500">Frequência e faltas por bolsista</span>
            </div>
            <svg class="w-4 h-4 text-primary opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </button>
        
        <!-- 1. Instructions Legend -->
        <div class="bg-[#16161E] border border-white/5 rounded-lg p-4">
            <h4 class="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Legenda de Ações
            </h4>
            <div class="space-y-2">
                <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded flex items-center justify-center text-xs font-black bg-emerald-500 text-white shadow-sm">P</span>
                    <span class="text-xs text-secondary">Presente</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded flex items-center justify-center text-xs font-black bg-red-500 text-white shadow-sm">F</span>
                    <span class="text-xs text-secondary">Falta</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded flex items-center justify-center text-xs font-black bg-blue-500 text-white shadow-sm">J</span>
                    <span class="text-xs text-secondary">Justificar Falta</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded flex items-center justify-center text-xs font-black bg-purple-500 text-white shadow-sm">A</span>
                    <span class="text-xs text-secondary">Abonar Falta</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="px-2 h-5 rounded flex items-center justify-center text-[9px] font-bold bg-yellow-500 text-black shadow-sm uppercase">RELAT.</span>
                    <span class="text-xs text-secondary">Ver Relatório do Aluno</span>
                </div>
            </div>
        </div>

        <!-- 2. Enrollment Stats -->
        <div class="bg-[#16161E] border border-white/5 rounded-lg p-4">
            <h4 class="text-xs font-bold text-white mb-3 uppercase tracking-wider">Situação da Turma</h4>
            
            <div class="grid grid-cols-2 gap-3 mb-4">
                <!-- Total -->
                <div class="bg-white/5 rounded p-2 text-center border border-white/5">
                    <span class="block text-[10px] text-secondary uppercase tracking-tight font-bold">Total Alunos</span>
                    <span class="block text-xl font-bold text-white">{{ enrollmentStats.total }}</span>
                </div>
                <!-- Ativos -->
                <div class="bg-emerald-500/10 rounded p-2 text-center border border-emerald-500/20">
                    <span class="block text-[10px] text-emerald-500 uppercase tracking-tight font-bold">Ativos</span>
                    <span class="block text-xl font-bold text-emerald-400">{{ enrollmentStats.counts['Ativa'] || 0 }}</span>
                </div>
            </div>

            <!-- Other Statuses (if specific ones requested) -->
            <div class="space-y-1">
                 <div class="flex justify-between text-[10px] text-secondary">
                    <span>Cancelados</span>
                    <span class="font-bold text-white">{{ enrollmentStats.counts['Cancelada'] || 0 }}</span>
                </div>
                 <div class="flex justify-between text-[10px] text-secondary">
                    <span>Trancados</span>
                    <span class="font-bold text-white">{{ enrollmentStats.counts['Trancamento'] || 0 }}</span>
                </div>
                 <div class="flex justify-between text-[10px] text-secondary">
                    <span>Anulados</span>
                    <span class="font-bold text-white">{{ enrollmentStats.counts['Anulada'] || 0 }}</span>
                </div>
            </div>
        </div>

        <!-- 3. Attendance Chart (Reactive to Aula) -->
        <div class="bg-[#16161E] border border-white/5 rounded-lg p-4">
            <h4 class="text-xs font-bold text-white mb-3 uppercase tracking-wider">
                Frequência - {{ aulaSelecionada.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) }}
            </h4>
            
            <div v-if="loading" class="py-8 flex justify-center">
                 <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
            
            <div v-else class="space-y-3">
                <div v-for="item in attendanceStats" :key="item.label" class="space-y-1">
                    <div class="flex justify-between text-[10px]">
                        <span class="text-gray-400 font-medium">{{ item.label }}</span>
                        <span class="text-white font-bold">{{ item.count }}</span>
                    </div>
                    <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            class="h-full rounded-full transition-all duration-500 ease-out"
                            :class="item.colorClass"
                            :style="{ width: item.percentage + '%' }"
                        ></div>
                    </div>
                </div>
            </div>
            
            <p v-if="!loading && enrollmentStats.total === 0" class="text-[10px] text-secondary text-center mt-2 italic">
                Nenhum dado para exibir.
            </p>
        </div>

    </div>
</template>
