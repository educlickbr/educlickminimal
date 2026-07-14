<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Gerenciar Status da Declaração',
  },
  studentName: {
    type: String,
    default: '',
  },
  currentStatus: {
    type: Boolean as PropType<boolean | null>,
    default: null, // null = Pendente, true = Aprovado, false = Reprovado
  },
  loading: {
      type: Boolean,
      default: false
  }
});

const emit = defineEmits(['close', 'update']);

const selectedAction = ref<boolean | null>(null);

// Initialize selected action when modal opens
watch(() => props.isOpen, (val) => {
    if (val) {
        selectedAction.value = props.currentStatus;
    }
});

const handleConfirm = () => {
    emit('update', selectedAction.value);
};

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
        class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        @click="!loading ? emit('close') : null"
    ></div>

    <!-- Modal Content -->
    <div class="bg-[#16161E] border border-white/10 rounded-xl w-full max-w-md p-6 relative z-10 shadow-2xl transform transition-all scale-100">
      
      <!-- Icon -->
      <div class="mb-4 flex justify-center">
          <div class="w-12 h-12 rounded-full bg-white/5 text-secondary flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
      </div>

      <h3 class="text-lg font-bold text-white text-center mb-1">{{ title }}</h3>
      <p v-if="studentName" class="text-xs text-secondary text-center mb-6">Aluno: {{ studentName }}</p>

      <!-- Action Selection -->
      <div class="space-y-3 mb-8">
          
          <!-- Aprovar -->
          <label 
            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5"
            :class="selectedAction === true ? 'border-green-500/50 bg-green-500/10' : 'border-white/10'"
          >
              <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div>
                      <p class="text-sm font-bold text-white">Aprovar</p>
                      <p class="text-[10px] text-secondary">Atestado válido e conferido.</p>
                  </div>
              </div>
              <input type="radio" :value="true" v-model="selectedAction" class="accent-green-500 w-4 h-4">
          </label>

          <!-- Reprovar -->
          <label 
            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5"
            :class="selectedAction === false ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'"
          >
              <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </div>
                  <div>
                      <p class="text-sm font-bold text-white">Reprovar</p>
                      <p class="text-[10px] text-secondary">Documento inválido ou ilegível.</p>
                  </div>
              </div>
              <input type="radio" :value="false" v-model="selectedAction" class="accent-red-500 w-4 h-4">
          </label>

          <!-- Pendente (Reset) -->
          <label 
            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5"
            :class="selectedAction === null ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10'"
          >
              <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                      <p class="text-sm font-bold text-white">Definir como Pendente</p>
                      <p class="text-[10px] text-secondary">Remover decisão anterior.</p>
                  </div>
              </div>
              <input type="radio" :value="null" v-model="selectedAction" class="accent-yellow-500 w-4 h-4">
          </label>

      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button 
          @click="emit('close')"
          :disabled="loading"
          class="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider text-secondary hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button 
          @click="handleConfirm"
          :disabled="loading"
          class="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="animate-spin w-3 h-3 border-2 border-white/20 border-t-white rounded-full"></span>
          Salvar
        </button>
      </div>
    </div>
  </div>
</template>
