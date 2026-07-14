<script setup lang="ts">
import { ref } from "vue";
import { formatDate } from "~/utils/date";

const props = defineProps<{
  edital: any;
  downloadFile: (item: any) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: "edit", edital: any): void;
  (e: "add-etapa", edital: any): void;
  (e: "edit-etapa", etapa: any, editalId: string): void;
}>();

// Expand/collapse
const expandedEditalId = ref<string | null>(null);

const getEditalId = (edital: any) =>
  String(edital?.id ?? edital?.id_edital ?? "");

const isExpanded = (edital: any) => {
  const id = getEditalId(edital);
  return !!id && expandedEditalId.value === id;
};

const toggleExpand = (edital: any) => {
  const id = getEditalId(edital);
  if (!id) return;
  expandedEditalId.value = expandedEditalId.value === id ? null : id;
};

// Etapas helpers
const getSortedEtapas = (edital: any) => {
  if (!edital.etapas) return [];
  return [...edital.etapas].sort(
    (a: any, b: any) => (a.ordem || 0) - (b.ordem || 0),
  );
};

const getEtapaStatus = (etapa: any) => {
  const now = new Date();
  const start = new Date(etapa.data_inicio);
  const end = new Date(etapa.data_fim);
  if (now < start)
    return { label: "Em Breve", color: "text-yellow-400", bg: "bg-yellow-400/10" };
  if (now > end)
    return { label: "Encerrado", color: "text-red-400", bg: "bg-red-400/10" };
  return { label: "Aberto", color: "text-green-400", bg: "bg-green-400/10" };
};
</script>

<template>
  <div
    class="bg-[#16161E] border border-white/5 rounded-lg transition-all hover:border-primary/20 group"
  >
    <!-- Top: Main Info -->
    <div
      class="p-4 md:p-6 flex flex-col md:flex-row gap-1 md:gap-4 md:items-start justify-between cursor-pointer relative"
      @click="toggleExpand(edital)"
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
            >
              {{ edital.ano_semestre }}
            </span>
            <span
              v-if="!edital.is_publicado"
              class="text-[10px] bg-gray-500/20 text-gray-400 px-2 rounded text-xs font-bold uppercase"
            >
              Rascunho
            </span>
            <span
              v-if="edital.is_publicado && edital.publicado_em && new Date(edital.publicado_em) > new Date()"
              class="text-[10px] bg-blue-500/20 text-blue-400 px-2 rounded text-xs font-bold uppercase"
            >
              Agendado
            </span>
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
            <span v-if="edital.exibir_periodo">
              {{ formatDate(edital.data_inicio) }} -
              {{ formatDate(edital.data_fim) }}
            </span>
            <span v-else class="text-secondary/50 italic">Oculto</span>
          </div>
        </div>

        <div class="flex items-center gap-2" @click.stop>
          <button
            @click="emit('edit', edital)"
            class="p-2 hover:bg-white/5 rounded-md text-secondary hover:text-primary transition-colors border border-transparent hover:border-white/5"
            title="Editar Edital"
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
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              ></path>
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              ></path>
            </svg>
          </button>
          <div class="w-px h-6 bg-white/5 mx-1"></div>
          <button
            class="p-2 text-secondary transition-transform duration-300 hover:text-white"
            :class="isExpanded(edital) ? 'rotate-180' : ''"
            @click.stop="toggleExpand(edital)"
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
      v-show="isExpanded(edital)"
      class="border-t border-white/5 bg-black/20 p-5 animate-in slide-in-from-top-2 duration-200"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-bold text-white flex items-center gap-2">
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
        <button
          @click.stop="emit('add-etapa', edital)"
          class="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
        >
          <svg
            class="w-3 h-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nova Etapa
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="etapa in getSortedEtapas(edital)"
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
                <span
                  v-if="!etapa.is_publicado"
                  class="text-[9px] bg-gray-500/20 text-gray-400 px-1 rounded uppercase"
                >
                  Rascunho
                </span>
              </div>
              <p class="text-[10px] text-secondary">
                <span v-if="etapa.exibir_periodo">
                  {{ formatDate(etapa.data_inicio) }} -
                  {{ formatDate(etapa.data_fim) }}
                </span>
                <span v-else class="italic opacity-50">
                  Período não exibido
                </span>
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

            <button
              @click.stop="emit('edit-etapa', etapa, edital.id)"
              class="text-secondary hover:text-white p-1 rounded hover:bg-white/5 opacity-0 group-hover/item:opacity-100 transition-all"
            >
              <svg
                class="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div
          v-if="!edital.etapas || edital.etapas.length === 0"
          class="text-center py-4 text-xs text-secondary/40 italic"
        >
          Nenhuma etapa cadastrada.
        </div>
      </div>
    </div>
  </div>
</template>
