<template>
  <div class="flex flex-col gap-8">
    <!-- 1. Grade Semanal -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between px-1">
        <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2"><Icon name="ph:calendar-bold" /> 1. Grade Semanal Regular</h4>
        <span v-if="diasSemana.length > 0" class="text-[9px] font-bold text-secondary/40 uppercase">{{ diasSemana.length }} dias configurados</span>
      </div>
      <div class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="flex flex-col gap-1.5 md:col-span-2">
            <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Dia da Semana</label>
            <select v-model="formSemana.dia_sem" class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none">
              <option :value="null" disabled>Selecione...</option>
              <option v-for="d in DOW_OPTIONS" :key="d.val" :value="d.val">{{ d.label }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Horário</label>
            <div class="flex items-center gap-1">
              <input type="time" v-model="formSemana.hora_ini" class="w-full px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-[11px] font-bold text-primary outline-none" />
              <span class="text-secondary/20">-</span>
              <input type="time" v-model="formSemana.hora_fim" class="w-full px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-[11px] font-bold text-primary outline-none" />
            </div>
          </div>
          <button @click="$emit('addDiaSemana')" class="px-6 py-2.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">Adicionar</button>
        </div>
        <div v-if="diasSemana.length > 0" class="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
          <div v-for="(d, idx) in diasSemana" :key="idx" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-primary/20 shadow-sm">
            <span class="text-[10px] font-black text-primary">{{ getDowLabel(d.dia_sem).substring(0, 3).toUpperCase() }}</span>
            <span class="text-[9px] font-bold text-secondary/60 tabular-nums">{{ d.hora_ini }}-{{ d.hora_fim }}</span>
            <button @click="$emit('removeDiaSemana', idx)" class="text-secondary/40 hover:text-red-500 ml-1"><Icon name="ph:x-bold" class="w-2.5 h-2.5" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Simulação -->
    <div class="flex flex-col gap-4 py-4 border-y border-secondary/5">
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <h4 class="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">2. Verificação de Carga Horária</h4>
          <p class="text-[9px] text-secondary/40 font-bold uppercase tracking-widest leading-relaxed">O calendário só poderá ser gravado se o saldo for zero.</p>
        </div>
        <button @click="$emit('simularCalendario')" :disabled="loadingSimulacao || diasSemana.length === 0"
          class="px-8 py-3 rounded-lg bg-div-10 hover:bg-primary hover:text-white transition-all text-xs font-black uppercase tracking-widest disabled:opacity-30 flex items-center gap-2 border border-secondary/10">
          <Icon v-if="loadingSimulacao" name="ph:circle-notched-bold" class="animate-spin" />{{ loadingSimulacao ? "Calculando..." : "Simular Cronograma" }}
        </button>
      </div>
      <div v-if="simulacaoData && simulacaoData.success" class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="p-3 rounded-xl border border-secondary/10 bg-div-5 flex flex-col items-center">
          <span class="text-[8px] font-black text-secondary/40 uppercase tracking-tighter">Encontros</span>
          <span class="text-lg font-black text-primary">{{ simulacaoData.dias_gerados?.filter((d: any) => ["regular","extra"].includes(d.tipo)).length || 0 }}</span>
        </div>
        <div class="p-3 rounded-xl border border-secondary/10 bg-div-5 flex flex-col items-center">
          <span class="text-[8px] font-black text-secondary/40 uppercase tracking-tighter">Início / Fim</span>
          <span class="text-[10px] font-bold text-primary tabular-nums">{{ formatDateShort(dataIni) }} - {{ formatDateShort(simulacaoData.data_fim) }}</span>
        </div>
        <div class="md:col-span-2 p-3 rounded-xl flex items-center justify-center gap-4 transition-all"
          :class="simulacaoData.saldo_minutos === 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'">
          <div class="flex flex-col items-center">
            <span class="text-[8px] font-black uppercase tracking-tighter" :class="simulacaoData.saldo_minutos === 0 ? 'text-green-500' : 'text-red-500'">Status da Carga</span>
            <span class="text-xs font-black uppercase tabular-nums" :class="simulacaoData.saldo_minutos === 0 ? 'text-green-500' : 'text-red-500'">
              {{ simulacaoData.saldo_minutos === 0 ? "GRADE COMPLETA (OK)" : simulacaoData.saldo_minutos > 0 ? `FALTA ${formatCarga(simulacaoData.saldo_minutos)}` : `EXCEDE ${formatCarga(Math.abs(simulacaoData.saldo_minutos))}` }}
            </span>
          </div>
          <Icon v-if="simulacaoData.saldo_minutos === 0" name="ph:check-circle-fill" class="text-green-500 w-6 h-6" />
          <Icon v-else name="ph:warning-circle-fill" class="text-red-500 w-6 h-6 animate-pulse" />
        </div>
      </div>
      <div v-if="simulacaoData && !simulacaoData.success" class="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">Erro: {{ simulacaoData.message }}</div>
    </div>

    <!-- 3. Dias Extras -->
    <div v-if="simulacaoData" class="flex flex-col gap-4">
      <div class="flex items-center justify-between px-1">
        <h4 class="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2"><Icon name="ph:calendar-plus-bold" /> 3. Ajustes de Reposição / Inclusões Extras</h4>
        <span v-if="diasExtras.length > 0" class="text-[9px] font-bold text-secondary/40 uppercase">{{ diasExtras.length }} inclusões</span>
      </div>
      <div class="p-5 rounded-xl border border-orange-500/10 bg-orange-500/5 flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="flex flex-col gap-1.5 md:col-span-1"><label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Data</label><input type="date" v-model="formExtra.data" class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none" /></div>
          <div class="flex flex-col gap-1.5 md:col-span-1"><label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Horário</label><div class="flex items-center gap-1"><input type="time" v-model="formExtra.hora_ini" class="w-full px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-[11px] font-bold text-primary outline-none" /><span class="text-secondary/20">-</span><input type="time" v-model="formExtra.hora_fim" class="w-full px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-[11px] font-bold text-primary outline-none" /></div></div>
          <div class="flex flex-col gap-1.5 md:col-span-2"><div class="flex items-end gap-2"><div class="flex-1 flex flex-col gap-1.5"><label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Motivo</label><input type="text" v-model="formExtra.observacoes" placeholder="Ex: Reposição feriado" class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none" /></div><button @click="$emit('addDiaExtra')" class="px-4 py-2.5 rounded bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 h-full">Incluir</button></div></div>
        </div>
        <div v-if="diasExtras.length > 0" class="flex flex-wrap gap-2 pt-2 border-t border-orange-500/10">
          <div v-for="(d, idx) in diasExtras" :key="idx" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-orange-500/20 shadow-sm">
            <span class="text-[10px] font-black text-orange-500 tabular-nums">{{ formatDateShort(d.data) }}</span>
            <span class="text-[9px] font-bold text-secondary/60">{{ d.hora_ini }}-{{ d.hora_fim }}</span>
            <button @click="$emit('removeDiaExtra', idx)" class="text-secondary/40 hover:text-red-500 ml-1"><Icon name="ph:x-bold" class="w-2.5 h-2.5" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Cronograma -->
    <div v-if="simulacaoData && simulacaoData.success" class="flex flex-col gap-4">
      <h4 class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] flex items-center gap-2"><Icon name="ph:list-checks-bold" /> 4. Cronograma Detalhado Gerado</h4>
      <div class="max-h-64 overflow-y-auto custom-scrollbar border border-secondary/10 rounded-xl bg-div-5 flex flex-col divide-y divide-secondary/5">
        <div v-for="(dia, i) in simulacaoData.dias_gerados || []" :key="i" class="flex items-center px-4 py-2.5 hover:bg-div-10 transition-colors border-l-4"
          :class="{ 'border-primary/40': dia.tipo === 'regular', 'border-orange-500/40': dia.tipo === 'extra', 'border-red-500/40 bg-red-500/5': dia.tipo === 'feriado', 'border-amber-500/40 bg-amber-500/5': dia.tipo === 'evento' }">
          <div class="w-8 shrink-0 font-black text-[9px] text-secondary/25">
            <span v-if="['regular','extra'].includes(dia.tipo)">#{{ getAulaNumber(dia, i) }}</span>
            <Icon v-else-if="dia.tipo === 'feriado'" name="ph:calendar-x-bold" class="w-3 h-3 text-red-500/40" />
            <Icon v-else-if="dia.tipo === 'evento'" name="ph:warning-bold" class="w-3 h-3 text-amber-500/40" />
          </div>
          <div class="w-24 shrink-0 flex flex-col"><span class="text-[11px] font-black text-primary tabular-nums" :class="{ 'text-red-400': dia.tipo === 'feriado', 'text-amber-400': dia.tipo === 'evento' }">{{ formatDateShort(dia.data) }}</span><span class="text-[8px] font-bold text-secondary/30 uppercase">{{ getDowLabel(new Date(dia.data + "T12:00:00").getUTCDay()).substring(0, 3) }}</span></div>
          <div class="flex-1 flex flex-col min-w-0"><div class="flex items-center gap-1.5"><span class="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm" :class="{ 'bg-primary/10 text-primary': dia.tipo === 'regular', 'bg-orange-500/10 text-orange-500': dia.tipo === 'extra', 'bg-red-500/20 text-red-400 border border-red-500/30': dia.tipo === 'feriado', 'bg-amber-500/20 text-amber-400 border border-amber-500/30': dia.tipo === 'evento' }">{{ dia.tipo }}</span><span class="text-[10px] font-bold text-secondary/80 truncate">{{ dia.observacao }}</span></div></div>
          <div class="shrink-0 text-right">
            <template v-if="dia.hora_ini && dia.hora_fim"><p class="text-[10px] font-black text-primary tabular-nums">{{ dia.hora_ini }}<span class="text-secondary/30">-</span>{{ dia.hora_fim }}</p><p class="text-[8px] font-bold text-secondary/40 uppercase tracking-tighter">{{ formatCarga(dia.duracao_minutos) }}</p></template>
            <template v-else><p class="text-[10px] font-black italic text-secondary/40 uppercase tracking-widest">Suspenso</p></template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  diasSemana: any[]; formSemana: { dia_sem: number | null; hora_ini: string; hora_fim: string }; DOW_OPTIONS: { val: number; label: string }[];
  diasExtras: any[]; formExtra: { data: string; hora_ini: string; hora_fim: string; observacoes: string };
  simulacaoData: any; loadingSimulacao: boolean; dataIni: string;
  formatCarga: (minutos: any) => string; formatDateShort: (dateStr: string) => string;
  getDowLabel: (val: number) => string; getAulaNumber: (dia: any, index: number | string) => number;
}>();
defineEmits<{ addDiaSemana: []; removeDiaSemana: [index: number]; simularCalendario: []; addDiaExtra: []; removeDiaExtra: [index: number] }>();
</script>
