<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal-panel modal-panel--lg">
      <!-- Accent top bar -->
      <div class="modal-accent-bar"></div>
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Z"/></svg>
        </div>
        <div class="modal-header-text">
          <h3 class="modal-title">{{ isEdit ? 'Editar' : 'Programar' }} Ciclo</h3>
          <p class="modal-subtitle">Alocação Temporal do Módulo</p>
        </div>
        <button @click="$emit('update:modelValue', false)" class="modal-close-btn">&times;</button>
      </div>

      <!-- Tabs Navigation -->
      <div class="modal-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="['modal-tab-btn', activeTab === tab.key ? 'modal-tab-btn--active' : '']"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'programacao' && (diasSemana.length > 0 || diasExtras.length > 0)" class="modal-tab-badge">{{ diasSemana.length + diasExtras.length }}</span>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">

        <!-- TAB: GERAL -->
        <div v-if="activeTab === 'geral'" class="flex flex-col gap-6">
          <div class="grid grid-cols-1 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Módulo Acadêmico (Obrigatório)</label>
              <select 
                v-model="formGeral.id_modulo"
                class="w-full px-4 py-3 rounded-lg border border-secondary/10 text-sm font-bold text-primary outline-none"
                :disabled="isEdit"
              >
                <option :value="null" disabled>Selecione um Módulo</option>
                <option v-for="m in modulos" :key="m.id" :value="m.id">{{ m.nome_modulo }} ({{ formatCarga(m.carga_horaria) }})</option>
              </select>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Data de Início</label>
            <input 
              type="date"
              v-model="formGeral.data_ini"
              class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
            />
            <p class="text-[9px] text-secondary/40 px-1 italic">Obs: A data de fim será gerada automaticamente com base na carga horária e na configuração dos dias.</p>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Observação do Ciclo</label>
            <input 
              v-model="formGeral.descricao" 
              placeholder="Ex: Turma A - Manhã"
              class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
            />
          </div>
        </div>

        <!-- TAB: PROGRAMAÇÃO (CONSOLIDADA) -->
        <div v-if="activeTab === 'programacao'" class="flex flex-col gap-8">
          
          <!-- 1. Dias Regulares -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between px-1">
               <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Icon name="ph:calendar-bold" class="w-13 h-13" />
                1. Grade Semanal Regular
              </h4>
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
                <button @click="addDiaSemana" class="px-6 py-2.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                  Adicionar
                </button>
              </div>

              <!-- Listagem Horizontal de Dias Semanais -->
              <div v-if="diasSemana.length > 0" class="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
                <div v-for="(d, idx) in diasSemana" :key="idx" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-primary/20 shadow-sm">
                  <span class="text-[10px] font-black text-primary">{{ getDowLabel(d.dia_sem).substring(0,3).toUpperCase() }}</span>
                  <span class="text-[9px] font-bold text-secondary/60 tabular-nums">{{ d.hora_ini }}-{{ d.hora_fim }}</span>
                  <button @click="removeDiaSemana(idx)" class="text-secondary/40 hover:text-red-500 ml-1">
                    <Icon name="ph:x-bold" class="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Botão Simular e Feedback de Carga -->
          <div class="flex flex-col gap-4 py-4 border-y border-secondary/5">
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <h4 class="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">2. Verificação de Carga Horária</h4>
                <p class="text-[9px] text-secondary/40 font-bold uppercase tracking-widest leading-relaxed">O calendário só poderá ser gravado se o saldo for zero.</p>
              </div>
              <button 
                @click="simularCalendario" 
                :disabled="loadingSimulacao || diasSemana.length === 0" 
                class="px-8 py-3 rounded-lg bg-div-10 hover:bg-primary hover:text-white transition-all text-xs font-black uppercase tracking-widest disabled:opacity-30 flex items-center gap-2 border border-secondary/10"
                :title="diasSemana.length === 0 ? 'Adicione ao menos um dia regular acima' : ''"
              >
                <Icon v-if="loadingSimulacao" name="ph:circle-notched-bold" class="animate-spin" />
                {{ loadingSimulacao ? 'Calculando...' : 'Simular Cronograma' }}
              </button>
            </div>

            <!-- Dashboard de Simulação -->
            <div v-if="simulacaoData && simulacaoData.success" class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="p-3 rounded-xl border border-secondary/10 bg-div-5 flex flex-col items-center">
                <span class="text-[8px] font-black text-secondary/40 uppercase tracking-tighter">Encontros</span>
                <span class="text-lg font-black text-primary">{{ simulacaoData.dias_gerados?.length || 0 }}</span>
              </div>
              <div class="p-3 rounded-xl border border-secondary/10 bg-div-5 flex flex-col items-center">
                <span class="text-[8px] font-black text-secondary/40 uppercase tracking-tighter">Início / Fim</span>
                <span class="text-[10px] font-bold text-primary tabular-nums">{{ formatDateShort(formGeral.data_ini) }} - {{ formatDateShort(simulacaoData.data_fim) }}</span>
              </div>
              <div class="md:col-span-2 p-3 rounded-xl flex items-center justify-center gap-4 transition-all" 
                :class="simulacaoData.saldo_minutos === 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'"
              >
                <div class="flex flex-col items-center">
                  <span class="text-[8px] font-black uppercase tracking-tighter" :class="simulacaoData.saldo_minutos === 0 ? 'text-green-500' : 'text-red-500'">Status da Carga</span>
                  <span class="text-xs font-black uppercase tabular-nums" :class="simulacaoData.saldo_minutos === 0 ? 'text-green-500' : 'text-red-500'">
                    {{ simulacaoData.saldo_minutos === 0 ? 'GRADE COMPLETA (OK)' : (simulacaoData.saldo_minutos > 0 ? `FALTA ${formatCarga(simulacaoData.saldo_minutos)}` : `EXCEDE ${formatCarga(Math.abs(simulacaoData.saldo_minutos))}`) }}
                  </span>
                </div>
                <Icon v-if="simulacaoData.saldo_minutos === 0" name="ph:check-circle-fill" class="text-green-500 w-6 h-6" />
                <Icon v-else name="ph:warning-circle-fill" class="text-red-500 w-6 h-6 animate-pulse" />
              </div>
            </div>
            
            <!-- Erro de Simulação -->
            <div v-if="simulacaoData && !simulacaoData.success" class="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
              Erro: {{ simulacaoData.message }}
            </div>
          </div>

          <!-- 3. Dias Extras / Ajustes (Aparece se houver erro ou para manual) -->
          <div v-if="simulacaoData" class="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
            <div class="flex items-center justify-between px-1">
              <h4 class="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Icon name="ph:calendar-plus-bold" />
                3. Ajustes de Reposição / Inclusões Extras
              </h4>
               <span v-if="diasExtras.length > 0" class="text-[9px] font-bold text-secondary/40 uppercase">{{ diasExtras.length }} inclusões</span>
            </div>

            <div class="p-5 rounded-xl border border-orange-500/10 bg-orange-500/5 flex flex-col gap-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div class="flex flex-col gap-1.5 md:col-span-1">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Data</label>
                  <input type="date" v-model="formExtra.data" class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none" />
                </div>
                <div class="flex flex-col gap-1.5 md:col-span-1">
                  <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Horário</label>
                   <div class="flex items-center gap-1">
                    <input type="time" v-model="formExtra.hora_ini" class="w-full px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-[11px] font-bold text-primary outline-none" />
                    <span class="text-secondary/20">-</span>
                    <input type="time" v-model="formExtra.hora_fim" class="w-full px-2 py-2.5 rounded-lg border border-secondary/10 bg-background text-[11px] font-bold text-primary outline-none" />
                  </div>
                </div>
                <div class="flex flex-col gap-1.5 md:col-span-2">
                   <div class="flex items-end gap-2">
                    <div class="flex-1 flex flex-col gap-1.5">
                      <label class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1">Motivo</label>
                      <input type="text" v-model="formExtra.observacoes" placeholder="Ex: Reposição feriado" class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none" />
                    </div>
                    <button @click="addDiaExtra" class="px-4 py-2.5 rounded bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 h-full">Incluir</button>
                  </div>
                </div>
              </div>

              <!-- Listagem de Extras -->
               <div v-if="diasExtras.length > 0" class="flex flex-wrap gap-2 pt-2 border-t border-orange-500/10">
                <div v-for="(d, idx) in diasExtras" :key="idx" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-orange-500/20 shadow-sm">
                  <span class="text-[10px] font-black text-orange-500 tabular-nums">{{ formatDateShort(d.data) }}</span>
                  <span class="text-[9px] font-bold text-secondary/60">{{ d.hora_ini }}-{{ d.hora_fim }}</span>
                  <button @click="removeDiaExtra(idx)" class="text-secondary/40 hover:text-red-500 ml-1">
                    <Icon name="ph:x-bold" class="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Tabela de Conferência Final (Se houver simulação) -->
          <div v-if="simulacaoData && simulacaoData.success" class="flex flex-col gap-4 animate-in fade-in duration-500">
             <h4 class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Icon name="ph:list-checks-bold" />
              4. Cronograma Detalhado Gerado
            </h4>
            <div class="max-h-64 overflow-y-auto custom-scrollbar border border-secondary/10 rounded-xl bg-div-5 flex flex-col divide-y divide-secondary/5">
              <div v-for="(dia, i) in (simulacaoData.dias_gerados || [])" :key="i" class="flex items-center px-4 py-2.5 hover:bg-div-10 transition-colors">
                <div class="w-8 shrink-0 font-black text-[9px] text-secondary/25">#{{ Number(i) + 1 }}</div>
                <div class="w-24 shrink-0 flex flex-col">
                  <span class="text-[11px] font-black text-primary tabular-nums">{{ formatDateShort(dia.data) }}</span>
                  <span class="text-[8px] font-bold text-secondary/30 uppercase">{{ getDowLabel(new Date(dia.data + 'T12:00:00').getDay()).substring(0,3) }}</span>
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter" :class="dia.tipo === 'regular' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'">{{ dia.tipo }}</span>
                    <span class="text-[10px] font-bold text-secondary/80 truncate">{{ dia.observacao }}</span>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                   <p class="text-[10px] font-black text-primary tabular-nums">{{ dia.hora_ini }} <span class="text-secondary/30">-</span> {{ dia.hora_fim }}</p>
                   <p class="text-[8px] font-bold text-secondary/40 uppercase tracking-tighter">{{ formatCarga(dia.duracao_minutos) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="modal-footer" style="justify-content: space-between;">
        <p v-if="!isValidForSave" class="text-[10px] font-bold text-red-400 uppercase tracking-widest">Rode a simulação e zere o saldo para salvar.</p>
        <div v-else></div>
        <div style="display:flex;gap:10px;">
          <button @click="$emit('update:modelValue', false)" class="modal-btn-cancel">Cancelar / Fechar</button>
          <button @click="handleSaveFinal" :disabled="loading || !isValidForSave" class="modal-btn-save">
            {{ loading ? 'Processando...' : 'Gravar Ciclo e Calendário' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  modelValue: boolean
  isEdit?: boolean
  cicloId?: string | null
  idModulo?: string | null
  nomeModulo?: string
  idEntidade?: string | null
  initialData?: any | null
  modulos?: any[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const store = useAppStore()
const toast = useToast()
const loading = ref(false)

const tabs = [
  { key: 'geral', label: 'Dados Iniciais' },
  { key: 'programacao', label: 'Programação do Ciclo' }
]
const activeTab = ref('geral')

const DOW_OPTIONS = [
  { val: 0, label: 'Domingo' },
  { val: 1, label: 'Segunda-feira' },
  { val: 2, label: 'Terça-feira' },
  { val: 3, label: 'Quarta-feira' },
  { val: 4, label: 'Quinta-feira' },
  { val: 5, label: 'Sexta-feira' },
  { val: 6, label: 'Sábado' },
]

function formatCarga(minutos: any) {
  const min = parseInt(minutos) || 0
  if (min === 0) return '00:00'
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function getDowLabel(val: number) {
  return DOW_OPTIONS.find(d => d.val === val)?.label || ''
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------
const formGeral = reactive({
  id_modulo: null as string | null,
  data_ini: '',
  descricao: ''
})

const diasSemana = ref<any[]>([])
const formSemana = reactive({
  dia_sem: null as number | null,
  hora_ini: '',
  hora_fim: ''
})

const diasExtras = ref<any[]>([])
const formExtra = reactive({
  data: '',
  hora_ini: '',
  hora_fim: '',
  observacoes: ''
})

const simulacaoData = ref<any>(null)
const loadingSimulacao = ref(false)

// ------------------------------------------------------------
// ACTIONS -> SEMANA
// ------------------------------------------------------------
function addDiaSemana() {
  if (formSemana.dia_sem === null || !formSemana.hora_ini || !formSemana.hora_fim) {
    return toast.showToast('Preencha os campos de horário e dia', { type: 'error' })
  }
  // Verifica conflito de dia
  if (diasSemana.value.some(d => d.dia_sem === formSemana.dia_sem)) {
    return toast.showToast('Esse dia da semana já tem uma regra cadastrada', { type: 'error' })
  }
  
  diasSemana.value.push({
    dia_sem: formSemana.dia_sem,
    hora_ini: formSemana.hora_ini,
    hora_fim: formSemana.hora_fim,
    dia_sem_txt: getDowLabel(formSemana.dia_sem)
  })
  
  // Limpa campos
  formSemana.dia_sem = null
  formSemana.hora_ini = ''
  formSemana.hora_fim = ''
  
  invalidateSimulacao()
}

function removeDiaSemana(idx: number) {
  diasSemana.value.splice(idx, 1)
  invalidateSimulacao()
}

// ------------------------------------------------------------
// ACTIONS -> EXTRAS
// ------------------------------------------------------------
function addDiaExtra() {
  if (!formExtra.data || !formExtra.hora_ini || !formExtra.hora_fim) {
    return toast.showToast('Data e horários obrigatórios', { type: 'error' })
  }
  
  diasExtras.value.push({ ...formExtra })
  
  formExtra.data = ''
  formExtra.hora_ini = ''
  formExtra.hora_fim = ''
  formExtra.observacoes = ''
  
  invalidateSimulacao()
}

function removeDiaExtra(idx: number) {
  diasExtras.value.splice(idx, 1)
  invalidateSimulacao()
}

function invalidateSimulacao() {
  simulacaoData.value = null
}

// ------------------------------------------------------------
// ACTIONS -> API SIMULAÇÃO
// ------------------------------------------------------------
const isValidForSave = computed(() => {
  return simulacaoData.value?.success && simulacaoData.value?.saldo_minutos === 0
})

async function simularCalendario() {
  const finalModuloId = formGeral.id_modulo || props.idModulo
  if (!finalModuloId) {
    activeTab.value = 'geral'
    return toast.showToast('Selecione primeiro o Módulo na aba anterior.', { type: 'error' })
  }

  if (!formGeral.data_ini) {
    activeTab.value = 'geral'
    return toast.showToast('Preencha a Data de Início na aba anterior.', { type: 'error' })
  }

  if (diasSemana.value.length === 0) {
    return toast.showToast('Adicione ao menos um Dia Semanal Regular.', { type: 'error' })
  }

  loadingSimulacao.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    
    const res = await $fetch('/api/ciclos/simular', {
      method: 'POST',
      body: {
        id_entidade,
        id_modulo: formGeral.id_modulo || props.idModulo,
        data_inicio: formGeral.data_ini,
        dias_semana: diasSemana.value,
        dias_extras: diasExtras.value
      }
    }) as any
    
    simulacaoData.value = res
    if (!res?.success) toast.showToast(res?.message || 'Erro na simulação', { type: 'error' })
    
  } catch(e: any) {
    toast.showToast(e.message, { type: 'error' })
    simulacaoData.value = { success: false, message: e.message }
  } finally {
    loadingSimulacao.value = false
  }
}

// ------------------------------------------------------------
// ACTIONS -> SAVE FINAL
// ------------------------------------------------------------
async function fetchDiasConfig(id_ciclo: string) {
  try {
    const resSem = await $fetch('/api/ciclo_dia_semana', { params: { id_ciclo } }) as any
    if (resSem?.success) diasSemana.value = resSem.itens || []
    
    const resExt = await $fetch('/api/ciclo_dia_extra', { params: { id_ciclo } }) as any
    if (resExt?.success) diasExtras.value = resExt.itens || []
  } catch(e){
    console.error(e)
  }
}

async function handleSaveFinal() {
  if (!isValidForSave.value) return
  const finalModuloId = formGeral.id_modulo || props.idModulo
  if (!finalModuloId) {
    activeTab.value = 'geral'
    return toast.showToast('Selecione um módulo', { type: 'error' })
  }

  loading.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    
    // 1. UPDATE/INSERT CICLO
    const cicloRes = await $fetch('/api/ciclos', {
      method: 'POST',
      body: {
        id: props.cicloId,
        id_entidade,
        id_modulo: finalModuloId,
        descricao: formGeral.descricao,
        data_ini: formGeral.data_ini,
        data_fim: simulacaoData.value.data_fim,
        usuario_id: store.user_expandido_id
      }
    }) as any
    
    if (!cicloRes?.success || !cicloRes.id) throw new Error(cicloRes?.message || 'Erro ao gravar base do ciclo')
    
    const the_ciclo_id = cicloRes.id

    // 2. GRAVAR REGRAS SEMANAIS
    await $fetch('/api/ciclo_dia_semana', {
      method: 'POST',
      body: {
        id_ciclo: the_ciclo_id,
        dias: diasSemana.value,
        id_entidade,
        usuario_id: store.user_expandido_id
      }
    })
    
    // 3. GRAVAR EXTRAS
    await $fetch('/api/ciclo_dia_extra', {
      method: 'POST',
      body: {
        id_ciclo: the_ciclo_id,
        dias: diasExtras.value,
        id_entidade,
        usuario_id: store.user_expandido_id
      }
    })
    
    // 4. GRAVAR CALENDARIO DEFINITIVO (RPC)
    const gerarRes = await $fetch('/api/ciclos/gerar', {
      method: 'POST',
      body: {
        id_ciclo: the_ciclo_id,
        id_entidade,
        usuario_id: store.user_expandido_id
      }
    }) as any
    
    if (gerarRes?.success) {
      toast.showToast('Ciclo e Calendário gerados com sucesso!', { type: 'success' })
      emit('saved')
      emit('update:modelValue', false)
    } else {
      throw new Error(gerarRes?.message || 'Erro na transação final de calendário')
    }

  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    activeTab.value = 'geral'
    simulacaoData.value = null
    
    if (props.initialData && props.cicloId) {
      formGeral.id_modulo = props.initialData.id_modulo || props.idModulo || null
      formGeral.data_ini = props.initialData.data_ini || ''
      formGeral.descricao = props.initialData.descricao || ''
      await fetchDiasConfig(props.cicloId)
    } else {
      formGeral.id_modulo = props.idModulo || null
      formGeral.data_ini = ''
      formGeral.descricao = ''
      diasSemana.value = []
      diasExtras.value = []
    }
  }
}, { immediate: true })

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

/* ── Form fields: violet-dark tone ── */
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
textarea {
  background: var(--field-bg) !important;
  border-color: var(--field-border) !important;
  color: var(--field-text) !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
}
select {
  background: var(--field-bg-select) !important;
  border-color: var(--field-border) !important;
  color: var(--field-text) !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
}
select option { background: var(--field-bg-option) !important; color: var(--field-text) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"])::placeholder,
textarea::placeholder { color: var(--field-placeholder) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):hover,
textarea:hover { background: var(--field-bg-hover) !important; }
select:hover { background: var(--field-bg-select-hover) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus,
select:focus, textarea:focus {
  border-color: var(--field-border-focus) !important;
  box-shadow: var(--field-shadow-focus) !important;
  outline: none !important;
}

/* ── Premium modal primitives ── */
.modal-overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);padding:16px;animation:fadeIn 0.15s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal-panel{position:relative;background:#0f0f17;border:1px solid rgba(139,92,246,0.18);border-radius:16px;width:100%;max-width:680px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(139,92,246,0.1);animation:slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1);}
.modal-panel--lg{max-width:960px;max-height:92vh;}
@keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.modal-accent-bar{height:3px;background:linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed);flex-shrink:0;}
.modal-header{display:flex;align-items:center;gap:14px;padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;}
.modal-header-icon{width:40px;height:40px;border-radius:10px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.2);color:#a78bfa;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.modal-header-text{flex:1;}
.modal-title{font-size:13px;font-weight:800;color:#e8e6f0;letter-spacing:0.01em;}
.modal-subtitle{font-size:10px;font-weight:700;color:rgba(139,92,246,0.55);text-transform:uppercase;letter-spacing:0.1em;margin-top:2px;}
.modal-close-btn{width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;}
.modal-close-btn:hover{background:rgba(255,255,255,0.1);color:#fff;}
.modal-tabs{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);padding:0 20px;flex-shrink:0;overflow-x:auto;}
.modal-tab-btn{padding:12px 16px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.3);background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all 0.15s ease;display:flex;align-items:center;gap:6px;white-space:nowrap;}
.modal-tab-btn:hover{color:rgba(255,255,255,0.6);}
.modal-tab-btn--active{color:#a78bfa;border-bottom-color:#8b5cf6;}
.modal-tab-badge{font-size:9px;font-weight:900;background:rgba(139,92,246,0.18);color:#a78bfa;padding:1px 6px;border-radius:999px;}
.modal-footer{display:flex;align-items:center;gap:10px;padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);flex-shrink:0;}
.modal-btn-cancel{padding:10px 22px;border-radius:9px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.45);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;transition:all 0.15s ease;}
.modal-btn-cancel:hover{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);}
.modal-btn-save{padding:10px 28px;border-radius:9px;border:none;background:linear-gradient(135deg,#7c3aed,#8b5cf6);color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;transition:all 0.15s ease;box-shadow:0 4px 14px rgba(139,92,246,0.35);display:flex;align-items:center;gap:6px;}
.modal-btn-save:hover{background:linear-gradient(135deg,#6d28d9,#7c3aed);box-shadow:0 6px 20px rgba(139,92,246,0.5);}
.modal-btn-save:disabled{opacity:0.5;cursor:not-allowed;}
</style>
