<template>
  <div
    class="bg-[#16161E] border border-white/5 rounded-lg transition-all hover:border-primary/20 group"
  >
    <!-- Top: Main Info -->
    <div
      class="p-4 md:p-6 flex flex-col md:flex-row gap-1 md:gap-4 md:items-start justify-between cursor-pointer relative"
      @click="toggleExpand(edital.id)"
    >
      <div class="flex items-start gap-4 flex-1">
        <!-- Icons Column -->
        <div class="flex flex-col gap-2 shrink-0">
          <button
            v-if="edital.arquivo_url"
            @click.stop="downloadFile(edital)"
            class="text-primary hover:text-white transition-all hover:scale-110 shrink-0 opacity-80 group-hover:opacity-100"
            title="Ver Edital"
          >
            <svg
              class="w-8 h-8"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              ></path>
            </svg>
          </button>
          <a
            v-if="edital.link"
            :href="edital.link"
            target="_blank"
            @click.stop
            class="text-blue-400 hover:text-white transition-all hover:scale-110 shrink-0 opacity-80 group-hover:opacity-100"
            title="Acessar Link Externo"
          >
            <svg
              class="w-8 h-8"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              ></path>
            </svg>
          </a>
        </div>

        <div class="space-y-1 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="text-[10px] font-black text-secondary/50 uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded bg-white/5"
              >{{ edital.ano_semestre }}</span
            >
          </div>
          <h3
            class="text-base md:text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug"
          >
            {{ edital.titulo }}
          </h3>
          <p class="text-xs md:text-sm text-secondary line-clamp-2 max-w-2xl">
            {{ edital.descricao }}
          </p>
        </div>
      </div>

      <div
        class="flex items-center gap-4 md:gap-6 shrink-0 justify-end w-full md:w-auto mt-0"
      >
        <div class="text-right hidden md:block">
          <div
            class="text-[10px] text-secondary font-bold uppercase tracking-wider mb-0.5 opacity-50"
          >
            Período
          </div>
          <div class="text-xs text-white font-medium">
            <span v-if="edital.exibir_periodo"
              >{{ formatDate(edital.data_inicio) }} -
              {{ formatDate(edital.data_fim) }}</span
            >
            <span v-else class="text-secondary/50 italic">Oculto</span>
          </div>
        </div>

        <div class="flex items-center gap-2" @click.stop>
          <button
            class="p-2 text-secondary transition-transform duration-300 hover:text-white"
            :class="isExpanded ? 'rotate-180' : ''"
            @click="toggleExpand(edital.id)"
          >
            <svg
              class="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom: Etapas (Expanded) -->
    <div
      v-show="isExpanded"
      class="border-t border-white/5 bg-black/20 p-5 animate-in slide-in-from-top-2 duration-200"
    >
      <div class="flex items-center justify-between mb-4">
        <h4
          class="text-sm font-bold text-white flex items-center gap-2"
        >
          <svg
            class="w-4 h-4 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            ></path>
          </svg>
          Etapas do Processo
        </h4>
      </div>

      <div class="space-y-2">
        <div
          v-for="etapa in sortedEtapas"
          :key="etapa.id"
          class="flex items-center justify-between bg-[#1f2029] p-3 rounded-lg border border-white/5 hover:border-white/10 group/item transition-colors"
        >
          <div class="flex items-start gap-4">
            <!-- Icons Block -->
            <div class="flex flex-col items-center gap-2 mt-0.5 shrink-0">
              <button
                v-if="etapa.arquivo_url"
                @click.stop="downloadFile(etapa)"
                class="text-primary hover:text-primary-hover transition-transform hover:scale-110 p-1"
                title="Baixar Arquivo"
              >
                <svg
                  class="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ></path>
                </svg>
              </button>
              <a
                v-if="etapa.link"
                :href="etapa.link"
                target="_blank"
                @click.stop
                class="text-blue-400 hover:text-white transition-transform hover:scale-110 p-1"
                title="Link Externo"
              >
                <svg
                  class="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  ></path>
                </svg>
              </a>
            </div>

            <!-- Main Content -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <div
                  class="w-6 h-6 rounded-full bg-white/5 text-secondary text-xs font-bold flex items-center justify-center border border-white/5 shrink-0"
                >
                  {{ etapa.ordem }}
                </div>
                <h5 class="text-sm font-bold text-white">
                  {{ etapa.titulo }}
                </h5>
              </div>
              <p class="text-[10px] text-secondary">
                <span v-if="etapa.exibir_periodo"
                  >{{ formatDate(etapa.data_inicio) }} -
                  {{ formatDate(etapa.data_fim) }}</span
                >
                <span v-else class="italic opacity-50"
                  >Período não exibido</span
                >
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
              :class="getEtapaStatus(etapa).bg + ' ' + getEtapaStatus(etapa).color"
            >
              {{ getEtapaStatus(etapa).label }}
            </span>
          </div>
        </div>

        <div
          v-if="!edital.etapas || edital.etapas.length === 0"
          class="text-center py-4 text-xs text-secondary/40 italic"
        >
          Nenhuma etapa publicada.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  edital: any
  isExpanded: boolean
  formatDate: (date: string) => string
  getEtapaStatus: (etapa: any) => { label: string; color: string; bg: string }
  getSortedEtapas: (edital: any) => any[]
  toggleExpand: (id: string) => void
  downloadFile: (item: any) => void
}>()

const sortedEtapas = computed(() => {
  return props.getSortedEtapas(props.edital)
})
</script>
