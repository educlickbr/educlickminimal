<script setup lang="ts">
import { formatDate } from '@/utils/date'

interface Edital {
  id_edital: string
  edital_titulo: string
  edital_descricao?: string
  dt_inicio: string
  dt_fim: string
  arquivo_edital?: string
}

const props = defineProps<{
  edital: Edital
  jnptaBlocked: boolean
  hasDraft: boolean
  loadingElegibilidadeJnpta: boolean
}>()

const emit = defineEmits<{
  inscrever: [edital: Edital]
  openEdital: [arquivo: string]
}>()
</script>

<template>
  <div
    class="bg-background rounded-xl shadow-sm border border-secondary/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col min-h-[660px]"
  >
    <!-- Header with gradient -->
    <div
      class="relative h-36 overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary to-primary-hover"
    >
      <div class="relative z-10 flex flex-col items-center justify-center">
        <img
          src="https://spedppull.b-cdn.net/site/logosp.png"
          alt="JNPTA"
          class="h-16 w-auto object-contain drop-shadow-md brightness-0 invert"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 md:p-7 flex flex-col flex-1 gap-6">
      <!-- Title -->
      <h3
        class="text-lg md:text-xl font-black text-text leading-snug group-hover:text-primary transition-colors line-clamp-4 min-h-[5.75rem] break-words"
      >
        {{ edital.edital_titulo }}
      </h3>

      <!-- Description -->
      <p
        v-if="edital.edital_descricao"
        class="text-sm text-secondary leading-relaxed line-clamp-4 break-words"
      >
        {{ edital.edital_descricao }}
      </p>

      <!-- Info Blocks -->
      <div
        class="bg-div-15/50 border border-secondary/5 rounded-lg p-5 space-y-4"
      >
        <!-- Período de Inscrição -->
        <div class="flex items-start gap-2">
          <div class="w-full">
            <div class="flex items-center gap-1.5 mb-0.5">
              <div
                class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
              >
                <svg
                  class="w-3.5 h-3.5 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <p
                class="text-[10px] uppercase font-black tracking-wider text-secondary/60"
              >
                Período de Inscrição
              </p>
            </div>
            <p
              class="text-sm font-bold text-text bg-background border border-secondary/5 px-2 py-1 rounded-md inline-block"
            >
              {{ formatDate(edital.dt_inicio, "dd/MM/yy HH:mm") }} a
              {{ formatDate(edital.dt_fim, "dd/MM/yy HH:mm") }}
            </p>
          </div>
        </div>

        <!-- Separator -->
        <div class="h-px bg-secondary/10 w-full"></div>

        <!-- Ver Edital Link -->
        <div
          v-if="edital.arquivo_edital"
          class="flex items-center gap-3"
        >
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <button
            @click="emit('openEdital', edital.arquivo_edital)"
            class="text-sm font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-2"
          >
            Ver Edital Completo
            <svg
              class="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- CTA Button -->
      <p
        v-if="jnptaBlocked"
        class="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2"
      >
        Você já possui inscrição enviada para este edital.
      </p>
      <p
        v-else-if="hasDraft"
        class="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2"
      >
        Você possui rascunho salvo. Clique para continuar de onde parou.
      </p>
      <button
        @click="emit('inscrever', edital)"
        :disabled="jnptaBlocked || loadingElegibilidadeJnpta"
        class="w-full text-white font-black py-4 rounded-xl text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-auto"
        :class="jnptaBlocked
          ? 'bg-zinc-600 cursor-not-allowed opacity-70 shadow-none'
          : 'bg-primary shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-primary/30 hover:-translate-y-0.5'"
      >
        {{ jnptaBlocked ? "Inscrição já enviada" : hasDraft ? "Continuar inscrição" : "Inscrever-se na Jornada" }}
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
