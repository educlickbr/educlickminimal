<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal-panel modal-panel--lg">
      <!-- Accent top bar -->
      <div class="modal-accent-bar"></div>
      
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-header-icon">
          <Icon name="ph:books-bold" class="w-5 h-5" />
        </div>
        <div class="modal-header-text">
          <h3 class="modal-title">{{ isEdit ? 'Editar' : 'Nova' }} Oferta Acadêmica (Programa)</h3>
          <p class="modal-subtitle">Agrupamento de Ciclos para Oferta</p>
        </div>
        <button @click="$emit('update:modelValue', false)" class="modal-close-btn">&times;</button>
      </div>

      <!-- Steps Header (Wizard) -->
      <div class="modal-tabs flex gap-8 items-center px-6 py-4 bg-background">
        <div 
          v-for="(step, idx) in steps" 
          :key="step.key"
          class="flex items-center gap-3 transition-opacity duration-300"
          :class="activeStep >= idx ? 'opacity-100' : 'opacity-30'"
        >
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2"
               :class="activeStep === idx ? 'border-primary text-primary bg-primary/10' : (activeStep > idx ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-secondary/40 text-secondary/40')">
            <Icon v-if="activeStep > idx" name="ph:check-bold" />
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span class="text-xs font-bold uppercase tracking-widest" :class="activeStep >= idx ? 'text-primary' : 'text-secondary/40'">{{ step.label }}</span>
          <Icon v-if="idx < steps.length - 1" name="ph:caret-right-bold" class="w-3 h-3 text-secondary/20 ml-4" />
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-background">
        
        <!-- STEP 1: Origem -->
        <div v-if="!isEdit && activeStep === 0" class="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div class="flex flex-col gap-2 mb-2">
            <h4 class="text-sm font-black text-primary uppercase tracking-widest">Qual a base desta oferta?</h4>
            <p class="text-xs text-secondary/60">Escolha se deseja ofertar um Curso completo ou apenas um Módulo/Ciclo avulso.</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Opt: Curso -->
            <button 
              @click="setOrigem('curso')"
              class="flex flex-col items-start text-left p-6 rounded-xl border-2 transition-all relative overflow-hidden group"
              :class="form.origem === 'curso' ? 'border-primary bg-primary/5' : 'border-secondary/10 bg-div-5 hover:border-primary/50'"
            >
              <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                   :class="form.origem === 'curso' ? 'bg-primary/20 text-primary' : 'bg-secondary/10 text-secondary/40 group-hover:text-primary'">
                <Icon name="ph:graduation-cap-bold" class="w-6 h-6" />
              </div>
              <h5 class="text-sm font-black text-primary mb-1 uppercase tracking-widest">A partir de um Curso</h5>
              <p class="text-[11px] text-secondary/60 leading-relaxed">Analisa a matriz do curso e agrupa múltiplos ciclos numa trilha completa de formação.</p>
              <div v-if="form.origem === 'curso'" class="absolute top-4 right-4 text-primary">
                <Icon name="ph:check-circle-fill" class="w-6 h-6" />
              </div>
            </button>

            <!-- Opt: Ciclo -->
            <button 
              @click="setOrigem('ciclo')"
              class="flex flex-col items-start text-left p-6 rounded-xl border-2 transition-all relative overflow-hidden group"
              :class="form.origem === 'ciclo' ? 'border-orange-500 bg-orange-500/5' : 'border-secondary/10 bg-div-5 hover:border-orange-500/50'"
            >
              <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                   :class="form.origem === 'ciclo' ? 'bg-orange-500/20 text-orange-500' : 'bg-secondary/10 text-secondary/40 group-hover:text-orange-500'">
                <Icon name="ph:books-bold" class="w-6 h-6" />
              </div>
              <h5 class="text-sm font-black text-orange-500 mb-1 uppercase tracking-widest">A partir de Ciclos</h5>
              <p class="text-[11px] text-secondary/60 leading-relaxed">Ideal para ofertas avulsas, cursos rápidos ou extensões que dependam da escolha livre de ciclos programados.</p>
              <div v-if="form.origem === 'ciclo'" class="absolute top-4 right-4 text-orange-500">
                <Icon name="ph:check-circle-fill" class="w-6 h-6" />
              </div>
            </button>
          </div>
        </div>

        <!-- STEP 2: Seleção -->
        <div v-if="activeStep === 1" class="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
          <template v-if="form.origem === 'curso'">
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Selecione o Curso Base</label>
              <select 
                v-model="form.id_curso"
                @change="fetchCursoCiclos"
                class="w-full px-4 py-3 rounded-lg border border-secondary/10 text-sm font-bold text-primary outline-none"
              >
                <option :value="null" disabled>Selecione um Curso</option>
                <option v-for="c in listCursos" :key="c.id" :value="c.id">{{ c.nome_curso }}</option>
              </select>
            </div>
          </template>

          <template v-if="form.origem === 'ciclo'">
             <!-- Remoção do seletor de módulo. Ciclos serão listados diretamente. -->
          </template>

          <!-- Listagem de Ciclos Encontrados -->
          <div v-if="loadingCiclos" class="py-8 flex flex-col items-center justify-center text-secondary/40">
            <Icon name="ph:circle-notched-bold" class="w-8 h-8 animate-spin mb-2" />
            <span class="text-[10px] uppercase font-bold tracking-widest">Buscando ciclos disponíveis...</span>
          </div>

          <div v-else-if="ciclosEncontrados.length > 0" class="flex flex-col gap-4 mt-2">
            <h4 class="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Icon name="ph:calendar-check-bold" class="w-4 h-4 text-green-500" />
              Ciclos Disponíveis Encontrados
            </h4>
            <div class="grid grid-cols-1 gap-3">
              <label 
                v-for="ciclo in ciclosEncontrados" :key="ciclo.id"
                class="flex flex-col p-4 rounded-xl border border-secondary/10 bg-div-5 hover:bg-div-10 cursor-pointer transition-colors relative"
              >
                <div class="flex items-start gap-4">
                  <div class="pt-1">
                    <input 
                      type="checkbox" 
                      :value="ciclo.id" 
                      v-model="form.ciclos_selecionados" 
                      class="w-4 h-4 rounded border-secondary/30 text-primary focus:ring-primary/20"
                    />
                  </div>
                  <div class="flex flex-col gap-1 w-full relative">
                    <p class="text-xs font-black text-primary">{{ ciclo.modulo_nome }}</p>
                    <p class="text-[10px] font-bold text-secondary/60">{{ ciclo.descricao || 'Sem descrição' }}</p>
                    <div class="flex items-center gap-4 mt-2 pt-2 border-t border-secondary/5 text-[9px] font-bold uppercase tracking-widest text-secondary/40">
                      <span class="flex items-center gap-1"><Icon name="ph:calendar-bold" /> {{ formatDateShort(ciclo.data_ini) }} até {{ formatDateShort(ciclo.data_fim) }}</span>
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <!-- Alerta se o curso estiver incompleto -->
            <div v-if="form.origem === 'curso' && modulosPendentesCurso.length > 0" class="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
               <Icon name="ph:warning-circle-fill" class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
               <div class="flex flex-col gap-1">
                 <span class="text-xs font-black text-orange-500 uppercase tracking-widest">Matriz Incompleta</span>
                 <p class="text-[10px] text-orange-500/80 leading-relaxed">Existem módulos deste curso que não possuem nenhum ciclo disponível programado. Você pode continuar com os que estão aí, mas a oferta gerada não cobrirá a matriz por inteiro.</p>
               </div>
            </div>
          </div>
          <div v-else-if="(form.origem === 'curso' && form.id_curso) || (form.origem === 'ciclo')" class="py-8 text-center text-secondary/50 text-xs font-bold uppercase tracking-widest bg-div-5 rounded-xl border border-secondary/10 border-dashed">
            Nenhum ciclo programado foi encontrado.<br/>Vá para o calendário e agende um ciclo primeiro.
          </div>
        </div>

        <!-- STEP 3: Processos Seletivos -->
        <div v-if="activeStep === 2" class="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div class="flex flex-col gap-2">
            <h4 class="text-sm font-black text-primary uppercase tracking-widest">Processos Seletivos</h4>
            <p class="text-xs text-secondary/60">Cadastre uma ou mais janelas de seleção. Os períodos não podem se sobrepor.</p>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-secondary/50 uppercase tracking-widest">
              {{ form.processos.length }} processo(s) configurado(s)
            </span>
            <button
              @click="addProcessoCard"
              :disabled="!canAddProcesso"
              class="px-3 py-2 rounded-lg border border-primary/20 bg-primary/10 text-[10px] font-black text-primary uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Novo Processo
            </button>
          </div>

          <div class="flex flex-col gap-4">
            <div
              v-for="(processo, idx) in form.processos"
              :key="processo.id || idx"
              class="flex flex-col gap-4 p-5 rounded-xl border border-secondary/10 bg-div-5"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon name="ph:files-bold" class="w-4 h-4" />
                  </div>
                  <h5 class="text-xs font-black text-primary uppercase tracking-widest">
                    Processo {{ idx + 1 }}
                  </h5>
                </div>
                <button
                  v-if="form.processos.length > 1"
                  @click="removeProcessoCard(idx)"
                  class="w-7 h-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  title="Remover processo"
                >
                  <Icon name="ph:trash-bold" class="w-3.5 h-3.5" />
                </button>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1">Nome do Processo</label>
                <input
                  type="text"
                  v-model="processo.nome_processo"
                  placeholder="Ex: Vestibular 2026/1"
                  class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-primary bg-background outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="flex flex-col gap-4">
                  <div class="flex items-center gap-3 mb-1">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon name="ph:calendar-check-bold" class="w-5 h-5" />
                    </div>
                    <h6 class="text-[10px] font-black text-primary uppercase tracking-widest">Processo Seletivo</h6>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1">Início</label>
                    <input
                      type="datetime-local"
                      v-model="processo.data_inicio"
                      class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-primary bg-background outline-none focus:border-primary/40 transition-colors"
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1">Fim</label>
                    <input
                      type="datetime-local"
                      v-model="processo.data_fim"
                      class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-primary bg-background outline-none focus:border-primary/40 transition-colors"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-4">
                  <div class="flex items-center gap-3 mb-1">
                    <div class="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                      <Icon name="ph:user-plus-bold" class="w-5 h-5" />
                    </div>
                    <h6 class="text-[10px] font-black text-green-500 uppercase tracking-widest">Matrícula (Opcional)</h6>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1">Início</label>
                    <input
                      type="datetime-local"
                      v-model="processo.matricula_inicio"
                      class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-green-500 bg-background outline-none focus:border-green-500/40 transition-colors"
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-black text-secondary/50 uppercase tracking-widest px-1">Fim</label>
                    <input
                      type="datetime-local"
                      v-model="processo.matricula_fim"
                      class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 text-xs font-bold text-green-500 bg-background outline-none focus:border-green-500/40 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="processosValidationMessage" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
            <Icon name="ph:warning-octagon-fill" class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p class="text-[10px] text-red-500/90 leading-relaxed">{{ processosValidationMessage }}</p>
          </div>

          <div v-else class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 items-start">
            <Icon name="ph:check-circle-fill" class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p class="text-[10px] text-emerald-500/90 leading-relaxed">
              Regra ativa: um novo processo só pode iniciar quando o anterior terminar (sem overlap).
            </p>
          </div>
        </div>

        <!-- STEP 4: Configuração Final ou "isEdit" -->
        <div v-if="activeStep === 3" class="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
          
          <div v-if="temOverlapping" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start mb-2">
            <Icon name="ph:warning-octagon-fill" class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div class="flex flex-col gap-1">
              <span class="text-xs font-black text-red-500 uppercase tracking-widest">Aviso de Calendário</span>
              <p class="text-[10px] text-red-500/80 leading-relaxed">Foram selecionados ciclos que ocorrem numa mesma faixa de datas. Verifique se o agrupamento em uma única oferta não gerará choque de horários caso o aluno opte por eles simultaneamente.</p>
            </div>
          </div>

          <!-- Modos de Unificação (Apenas se + de 1 ciclo for selecionado no create) -->
          <div v-if="!isEdit && form.ciclos_selecionados.length > 1" class="flex flex-col gap-3">
             <h4 class="text-[10px] font-black text-primary uppercase tracking-widest">Estratégia de Agrupamento</h4>
             <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer"
                       :class="form.estrategia === 'unica' ? 'border-primary bg-primary/5' : 'border-secondary/10 bg-div-5 hover:border-primary/30'">
                  <input type="radio" v-model="form.estrategia" value="unica" class="sr-only" />
                  <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                       :class="form.estrategia === 'unica' ? 'border-primary' : 'border-secondary/40'">
                    <div v-if="form.estrategia === 'unica'" class="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs font-black text-primary uppercase tracking-widest">Oferta Única Integrada</span>
                    <span class="text-[9px] text-secondary/60">Gera 1 Programa englobando todos os ciclos selecionados.</span>
                  </div>
                </label>

                <label class="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer"
                       :class="form.estrategia === 'separada' ? 'border-orange-500 bg-orange-500/5' : 'border-secondary/10 bg-div-5 hover:border-orange-500/30'">
                  <input type="radio" v-model="form.estrategia" value="separada" class="sr-only" />
                  <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                       :class="form.estrategia === 'separada' ? 'border-orange-500' : 'border-secondary/40'">
                    <div v-if="form.estrategia === 'separada'" class="w-2 h-2 rounded-full bg-orange-500"></div>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs font-black text-orange-500 uppercase tracking-widest">Ofertas Múltiplas</span>
                    <span class="text-[9px] text-secondary/60">Gera {{ form.ciclos_selecionados.length }} Programas distintos, um para cada ciclo.</span>
                  </div>
                </label>
             </div>
          </div>

          <!-- Dados do Programa -->
          <div class="flex flex-col gap-4 mt-2">
            <h4 class="text-[10px] font-black text-primary uppercase tracking-widest border-b border-secondary/10 pb-2">Identificação Visual</h4>
            
            <div v-if="isEdit" class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Curso Vinculado</label>
              <select 
                v-model="form.id_curso"
                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary opacity-50 outline-none"
                disabled
              >
                <option :value="null" disabled>Nenhum curso selecionado (Ciclo Isolado)</option>
                <option v-for="c in listCursos" :key="c.id" :value="c.id">{{ c.nome_curso }}</option>
              </select>
            </div>

            <!-- Área Acadêmica -->
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Área Acadêmica</label>
              
              <div v-if="form.origem === 'curso'" class="px-4 py-3 rounded-lg border border-secondary/10 bg-div-5 text-sm font-bold text-primary opacity-60">
                Herdada automaticamente do curso vinculado
              </div>
              
              <select 
                v-else
                v-model="form.id_area"
                class="w-full px-4 py-3 rounded-lg border border-secondary/10 text-sm font-bold text-primary outline-none focus:border-primary/50"
              >
                <option :value="null" disabled>Selecione a área para esta oferta</option>
                <option v-for="a in listAreas" :key="a.id" :value="a.id">{{ a.nome_area }}</option>
              </select>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">
                {{ form.estrategia === 'separada' && form.ciclos_selecionados.length > 1 && !isEdit ? 'Nomes Acadêmicos das Ofertas' : 'Nome Acadêmico da Oferta / Programa' }}
              </label>
              
              <!-- Múltiplos inputs para estratégia separada -->
              <div v-if="form.estrategia === 'separada' && form.ciclos_selecionados.length > 1 && !isEdit" class="flex flex-col gap-3">
                <div v-for="cId in form.ciclos_selecionados" :key="cId" class="flex flex-col gap-1 p-3 rounded-lg border border-secondary/10 bg-div-5">
                  <span class="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                    <Icon name="ph:arrow-elbow-down-right-bold" /> {{ ciclosEncontrados.find(c => c.id === cId)?.modulo_nome || 'Módulo' }}
                  </span>
                  <input 
                    type="text"
                    v-model="form.descricoes_multiplas[cId]"
                    class="w-full px-3 py-2 rounded border border-secondary/10 bg-background text-xs font-bold text-primary focus:border-orange-500/50 transition-all outline-none"
                  />
                </div>
              </div>

              <!-- Input Único -->
              <input 
                v-else
                type="text"
                v-model="form.descricao"
                placeholder="Ex: Formação Fullstack - 2026.1"
                class="w-full px-4 py-3 rounded-lg border border-secondary/10 bg-background text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none"
              />
            </div>
          </div>

        </div>

      </div>

      <!-- Footer navigation -->
      <div class="modal-footer" style="justify-content: space-between;">
        <button 
          v-if="activeStep > (isEdit ? 1 : 0)"
          @click="activeStep--" 
          class="modal-btn-cancel"
        >
          Voltar
        </button>
        <button 
          v-else
          @click="$emit('update:modelValue', false)" 
          class="modal-btn-cancel"
        >
          Cancelar
        </button>

        <button 
          v-if="activeStep < steps.length - 1"
          @click="nextStep" 
          :disabled="!canProceed"
          class="modal-btn-save"
        >
          Avançar Etapa
        </button>
        <button 
          v-else
          @click="handleSave" 
          :disabled="loading || !canSave"
          class="modal-btn-save"
        >
          <Icon v-if="loading" name="ph:circle-notched-bold" class="animate-spin mr-1" />
          {{ loading ? 'Salvando...' : 'Salvar Programa' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useAppStore } from '../../stores/app'
import { useToast } from '~/composables/useToast'

type ProcessoForm = {
  id: string | null
  nome_processo: string
  data_inicio: string | null
  data_fim: string | null
  matricula_inicio: string | null
  matricula_fim: string | null
}

function createEmptyProcesso(ordem: number): ProcessoForm {
  return {
    id: null,
    nome_processo: `Processo ${ordem}`,
    data_inicio: null,
    data_fim: null,
    matricula_inicio: null,
    matricula_fim: null
  }
}

const props = defineProps<{
  modelValue: boolean
  isEdit?: boolean
  programaId?: string | null
  initialData?: any | null
  idEntidade?: string | null
  cursos?: any[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const store = useAppStore()
const toast = useToast()
const loading = ref(false)

const steps = [
  { key: 'origem', label: 'Origem' },
  { key: 'selecao', label: 'Ciclos' },
  { key: 'processos', label: 'Processos' },
  { key: 'resumo', label: 'Conclusão' }
]
const activeStep = ref(0)

const form = reactive({
  origem: null as 'curso' | 'ciclo' | null,
  id_curso: null as string | null,
  id_modulo: null as string | null,
  id_area: null as string | null,
  ciclos_selecionados: [] as string[],
  estrategia: 'unica' as 'unica' | 'separada',
  descricao: '',
  descricoes_multiplas: {} as Record<string, string>,
  processos: [createEmptyProcesso(1)] as ProcessoForm[],
})

// Dados carregados da base
const listCursos = ref<any[]>([])
const listModulos = ref<any[]>([])
const listAreas = ref<any[]>([])
const loadingCiclos = ref(false)
const ciclosEncontrados = ref<any[]>([])
const modulosPendentesCurso = ref<string[]>([])
const temOverlapping = ref(false)

// Init fetch
async function fetchBaseLists() {
  const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
  if (!id_entidade) return
  
  // Se a parent já passar cursos, usamos diretamente, senão faz fetch
  if (props.cursos && props.cursos.length > 0) {
    listCursos.value = props.cursos
  } else {
    try {
      const resCur = await $fetch('/api/cursos', { params: { id_entidade, _t: Date.now() } }) as any
      if (resCur?.success) listCursos.value = resCur.itens
    } catch(e) {
      console.error(e)
    }
  }

  try {
    const resMod = await $fetch('/api/modulos', { params: { id_entidade, _t: Date.now() } }) as any
    if (resMod?.success) listModulos.value = resMod.itens
  } catch(e) {
    console.error(e)
  }

  try {
    const resArea = await $fetch('/api/areas', { params: { id_entidade, _t: Date.now() } }) as any
    if (resArea?.success) listAreas.value = resArea.itens || []
  } catch(e) {
    console.error(e)
  }
}

// Logic Origem
function setOrigem(val: 'curso' | 'ciclo') {
  form.origem = val
  form.id_curso = null
  form.id_modulo = null
  form.id_area = null
  form.ciclos_selecionados = []
  ciclosEncontrados.value = []
  modulosPendentesCurso.value = []
  
  if (val === 'ciclo') {
    fetchAllCiclos()
  }
}

// Logic fetching cycles based on origim
async function fetchCursoCiclos() {
  if (!form.id_curso) return
  loadingCiclos.value = true
  ciclosEncontrados.value = []
  form.ciclos_selecionados = []
  modulosPendentesCurso.value = []
  
  try {
     const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
     const res = await $fetch('/api/programas/buscar_ciclos_curso', {
       params: { id_curso: form.id_curso, id_entidade }
     }) as any
     
     if (res?.success) {
       ciclosEncontrados.value = res.ciclos
       modulosPendentesCurso.value = res.modulos_ausentes || []
     }
  } catch(e) {
    console.error(e)
  } finally {
    loadingCiclos.value = false
  }
}

async function fetchAllCiclos() {
  loadingCiclos.value = true
  ciclosEncontrados.value = []
  form.ciclos_selecionados = []
  
  try {
     const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
     const res = await $fetch('/api/ciclos', {
       params: { id_entidade }
     }) as any
     
     if (res?.success && res.itens) {
       ciclosEncontrados.value = res.itens.map((c:any) => ({
         ...c,
         modulo_nome: listModulos.value.find(m => m.id === c.id_modulo)?.nome_modulo || c.aca_modulo?.nome_modulo || 'Módulo'
       }))
     }
  } catch(e) {
    console.error(e)
  } finally {
    loadingCiclos.value = false
  }
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return '-'
  try {
     const d = new Date(dateStr)
     if (isNaN(d.getTime())) return dateStr
     return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  } catch { return dateStr }
}

function formatToLocal(isoStr: string | null) {
  if (!isoStr) return null
  const date = new Date(isoStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toDateMs(dateStr: string | null): number | null {
  if (!dateStr) return null
  const ms = new Date(dateStr).getTime()
  return Number.isNaN(ms) ? null : ms
}

function toIso(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const canAddProcesso = computed(() => {
  return form.processos.every((p) => Boolean(p.data_inicio && p.data_fim))
})

function addProcessoCard() {
  if (!canAddProcesso.value) return
  form.processos.push(createEmptyProcesso(form.processos.length + 1))
}

function removeProcessoCard(index: number) {
  if (form.processos.length <= 1) return
  form.processos.splice(index, 1)
}

const processosValidationMessage = computed(() => {
  if (!form.processos.length) return 'Adicione ao menos um processo seletivo.'

  for (let i = 0; i < form.processos.length; i++) {
    const processo = form.processos[i]
    const nome = processo.nome_processo?.trim()
    const inicioMs = toDateMs(processo.data_inicio)
    const fimMs = toDateMs(processo.data_fim)
    const matriculaInicioMs = toDateMs(processo.matricula_inicio)
    const matriculaFimMs = toDateMs(processo.matricula_fim)

    if (!nome) return `Informe o nome do processo ${i + 1}.`
    if (inicioMs === null || fimMs === null) return `Informe início e fim do processo ${i + 1}.`
    if (fimMs < inicioMs) return `No processo ${i + 1}, a data final deve ser maior ou igual à inicial.`
    if (matriculaInicioMs !== null && matriculaFimMs !== null && matriculaFimMs < matriculaInicioMs) {
      return `No processo ${i + 1}, o período de matrícula está inválido.`
    }
  }

  const ordenados = [...form.processos]
    .map((processo, idx) => ({
      idx,
      inicioMs: toDateMs(processo.data_inicio) as number,
      fimMs: toDateMs(processo.data_fim) as number
    }))
    .sort((a, b) => a.inicioMs - b.inicioMs)

  for (let i = 1; i < ordenados.length; i++) {
    const anterior = ordenados[i - 1]
    const atual = ordenados[i]
    if (atual.inicioMs < anterior.fimMs) {
      return 'Os processos não podem ter overlap. Um novo processo só pode iniciar quando o anterior terminar.'
    }
  }

  return null
})

const canProceed = computed(() => {
  if (activeStep.value === 0) return form.origem !== null
  if (activeStep.value === 1) return form.ciclos_selecionados.length > 0
  if (activeStep.value === 2) return processosValidationMessage.value === null
  return true
})

const canSave = computed(() => {
  if (form.origem === 'ciclo' && !form.id_area) return false
  if (processosValidationMessage.value !== null) return false
  
  if (props.isEdit) return form.descricao.trim().length > 0
  if (form.estrategia === 'separada' && form.ciclos_selecionados.length > 1) {
    return form.ciclos_selecionados.length > 0 && form.ciclos_selecionados.every(cId => form.descricoes_multiplas[cId] && form.descricoes_multiplas[cId].trim().length > 0)
  }
  return form.descricao.trim().length > 0 && form.ciclos_selecionados.length > 0
})

function nextStep() {
  if (!canProceed.value) return
  if (activeStep.value === 1) {
    checkOverlapping()
    // Sugerir nomes caso esteja indo para a etapa 3 em modo separado
    if (form.estrategia === 'separada' && !props.isEdit) {
      const cursoBase = listCursos.value.find(c => c.id === form.id_curso)
      form.ciclos_selecionados.forEach(cId => {
        if (!form.descricoes_multiplas[cId]) {
          const cicloObj = ciclosEncontrados.value.find(c => c.id === cId)
          if (cicloObj) {
            const nomeCursoStr = cursoBase ? `${cursoBase.nome_curso} - ` : ''
            const anoSemestreStr = cicloObj.ano_semestre ? `${cicloObj.ano_semestre} - ` : ''
            const moduloStr = cicloObj.modulo_nome || 'Módulo'
            form.descricoes_multiplas[cId] = `${nomeCursoStr}${anoSemestreStr}${moduloStr}`
          }
        }
      })
    }
  }
  activeStep.value++
}

function checkOverlapping() {
  if (form.ciclos_selecionados.length <= 1) {
    temOverlapping.value = false
    return
  }
  const selected = ciclosEncontrados.value.filter(c => form.ciclos_selecionados.includes(c.id))
  temOverlapping.value = false
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const d1Ini = new Date(selected[i].data_ini).getTime()
      const d1Fim = new Date(selected[i].data_fim).getTime()
      const d2Ini = new Date(selected[j].data_ini).getTime()
      const d2Fim = new Date(selected[j].data_fim).getTime()
      
      if (d1Ini <= d2Fim && d1Fim >= d2Ini) {
        temOverlapping.value = true
        return
      }
    }
  }
}

async function handleSave() {
  if (!canSave.value) return
  
  loading.value = true
  try {
    const id_entidade = props.idEntidade || (store as any).entidades?.[0]?.id || (store as any).company?.id
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')

    const processosPayload = form.processos.map((processo, idx) => ({
      id: processo.id || null,
      nome_processo: processo.nome_processo?.trim() || `Processo ${idx + 1}`,
      data_inicio: toIso(processo.data_inicio),
      data_fim: toIso(processo.data_fim),
      matricula_inicio: toIso(processo.matricula_inicio),
      matricula_fim: toIso(processo.matricula_fim)
    }))

    const processosOrdenados = [...processosPayload].sort((a, b) => {
      const aMs = a.data_inicio ? new Date(a.data_inicio).getTime() : 0
      const bMs = b.data_inicio ? new Date(b.data_inicio).getTime() : 0
      return aMs - bMs
    })

    const processoInicial = processosOrdenados[0] || null
    const processoFinal = processosOrdenados[processosOrdenados.length - 1] || null
    
    // In edit mode we update the text and the ciclos relations
    if (props.isEdit) {
       const res = await $fetch('/api/programas', {
        method: 'POST',
        body: {
          id: props.programaId,
          id_entidade,
          id_curso: form.id_curso || null,
          id_area: form.id_area || null,
          descricao: form.descricao,
          ciclos: form.ciclos_selecionados,
          usuario_id: store.user_expandido_id,
          processo_seletivo_inicio: processoInicial?.data_inicio || null,
          processo_seletivo_fim: processoFinal?.data_fim || null,
          matricula_inicio: processoInicial?.matricula_inicio || null,
          matricula_fim: processoFinal?.matricula_fim || null,
          processos: processosPayload
        }
      }) as any
      if (res?.success) {
        toast.showToast('Programa salvo com sucesso!', { type: 'success' })
        emit('saved')
        emit('update:modelValue', false)
      } else {
        throw new Error(res?.message || 'Erro ao editar.')
      }
      return
    }
    
    // Create mode (could be 1 or many depending on strategy)
    const payload = {
      id_entidade,
      id_curso: form.origem === 'curso' ? form.id_curso : null,
      id_area: form.origem === 'ciclo' ? form.id_area : null,
      descricao: form.descricao,
      ciclos: form.ciclos_selecionados,
      estrategia: form.estrategia, // 'unica' | 'separada'
      descricoes: form.estrategia === 'separada' ? form.descricoes_multiplas : undefined,
      usuario_id: store.user_expandido_id,
      processo_seletivo_inicio: processoInicial?.data_inicio || null,
      processo_seletivo_fim: processoFinal?.data_fim || null,
      matricula_inicio: processoInicial?.matricula_inicio || null,
      matricula_fim: processoFinal?.matricula_fim || null,
      processos: processosPayload
    }
    
    const res = await $fetch('/api/programas/criar_com_ciclos', {
      method: 'POST',
      body: payload
    }) as any
    
    if (res?.success) {
      toast.showToast('Programa(s) criado(s) com sucesso.', { type: 'success' })
      emit('saved')
      emit('update:modelValue', false)
    } else {
      throw new Error(res?.message || 'Erro ao gerar programa.')
    }
  } catch(e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    fetchBaseLists()
    if (props.isEdit && props.initialData) {
      activeStep.value = 1 // Pula direto para a seleção de ciclos no modo de edição
      form.descricao = props.initialData.descricao || ''
      form.id_area = props.initialData.id_area || null
      form.processos = [createEmptyProcesso(1)]
      
      try {
        const [resCiclos, resProcessos] = await Promise.all([
          $fetch('/api/programas/ciclos', { params: { id_programa: props.programaId } }) as any,
          $fetch('/api/programas/processos', { params: { id_programa: props.programaId } }) as any
        ])

        if (resCiclos?.success) {
          const loadedCiclos = resCiclos.ciclos || []
          
          if (props.initialData.id_curso) {
            form.origem = 'curso'
            form.id_curso = props.initialData.id_curso
            await fetchCursoCiclos()
            form.ciclos_selecionados = loadedCiclos
          } else {
            form.origem = 'ciclo'
            form.id_modulo = resCiclos.id_modulo || null
            await fetchAllCiclos()
            form.ciclos_selecionados = loadedCiclos
          }
        }

        if (resProcessos?.success && Array.isArray(resProcessos.itens) && resProcessos.itens.length > 0) {
          form.processos = resProcessos.itens.map((p: any, idx: number) => ({
            id: p.id || null,
            nome_processo: p.nome_processo || `Processo ${idx + 1}`,
            data_inicio: formatToLocal(p.data_inicio),
            data_fim: formatToLocal(p.data_fim),
            matricula_inicio: formatToLocal(p.matricula_inicio),
            matricula_fim: formatToLocal(p.matricula_fim)
          }))
        } else {
          const fallback = createEmptyProcesso(1)
          fallback.nome_processo = props.initialData.descricao ? `${props.initialData.descricao} - Processo` : 'Processo Seletivo'
          fallback.data_inicio = formatToLocal(props.initialData.processo_seletivo_inicio)
          fallback.data_fim = formatToLocal(props.initialData.processo_seletivo_fim)
          fallback.matricula_inicio = formatToLocal(props.initialData.matricula_inicio)
          fallback.matricula_fim = formatToLocal(props.initialData.matricula_fim)
          form.processos = [fallback]
        }
      } catch (e) {
        console.error('Erro ao buscar ciclos atrelados ao programa', e)
      }
    } else {
      activeStep.value = 0
      form.origem = null
      form.id_curso = null
      form.id_modulo = null
      form.id_area = null
      form.ciclos_selecionados = []
      form.estrategia = 'unica'
      form.descricao = ''
      form.descricoes_multiplas = {}
      form.processos = [createEmptyProcesso(1)]
      ciclosEncontrados.value = []
    }
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea {
  background-color: var(--field-bg) !important;
  border-color: var(--field-border) !important;
  color: var(--field-text) !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
}
select {
  background-color: var(--field-bg) !important;
  border-color: var(--field-border) !important;
  color: var(--field-text) !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
  background-position: right 1rem center !important;
  background-repeat: no-repeat !important;
  background-size: 1.2em 1.2em !important;
  padding-right: 2.5rem !important;
}
input:not([type="checkbox"]):not([type="radio"]):not([type="range"])::placeholder, textarea::placeholder { color: var(--field-placeholder) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):hover, textarea:hover { background-color: var(--field-bg-hover) !important; }
select:hover { background-color: var(--field-bg-hover) !important; }
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus, textarea:focus {
  border-color: var(--field-border-focus) !important;
  box-shadow: var(--field-shadow-focus) !important;
  outline: none !important;
}
select:focus {
  border-color: var(--field-border-focus) !important;
  box-shadow: var(--field-shadow-focus) !important;
  outline: none !important;
}
select option { background: var(--field-bg-option) !important; color: var(--field-text) !important; }

.modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.85); padding: 16px; animation: fadeIn 0.15s ease; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.modal-panel { position: relative; background: #0f0f17; border: 1px solid rgba(139,92,246,0.18); border-radius: 16px; width: 100%; max-width: 680px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1); animation: slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1); }
.modal-panel--lg { max-width: 800px; max-height: 90vh; }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
.modal-accent-bar { height: 3px; background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed); flex-shrink: 0; }
.modal-header { display: flex; align-items: center; gap: 14px; padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.modal-header-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.2); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal-header-text { flex: 1; }
.modal-title { font-size: 13px; font-weight: 800; color: #e8e6f0; letter-spacing: 0.01em; }
.modal-subtitle { font-size: 10px; font-weight: 700; color: rgba(139,92,246,0.55); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
.modal-close-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
.modal-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.modal-footer { display: flex; align-items: center; gap: 10px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2); flex-shrink: 0; }
.modal-btn-cancel { padding: 10px 22px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s ease; }
.modal-btn-cancel:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.modal-btn-save { padding: 10px 28px; border-radius: 9px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 4px 14px rgba(139,92,246,0.35); display: flex; align-items: center; gap: 6px; }
.modal-btn-save:hover { background: linear-gradient(135deg, #6d28d9, #7c3aed); box-shadow: 0 6px 20px rgba(139,92,246,0.5); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
