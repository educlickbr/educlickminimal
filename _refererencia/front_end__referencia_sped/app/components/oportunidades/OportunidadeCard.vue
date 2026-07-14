<script setup lang="ts">
import { formatDate } from "~/utils/date";

defineProps<{
  oportunidade: any;
  downloadFile: (item: any) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: "edit", item: any): void;
  (e: "delete", item: any): void;
}>();
</script>

<template>
  <div
    class="bg-[#16161E] border border-white/5 rounded-lg transition-all hover:border-primary/20 group"
  >
    <div
      class="p-4 md:p-6 flex flex-col md:flex-row gap-1 md:gap-4 md:items-start justify-between relative"
    >
      <div class="flex items-start gap-4 flex-1">
        <!-- Icons -->
        <div class="flex flex-col gap-2 shrink-0">
          <button
            v-if="oportunidade.arquivo_url"
            @click.stop="downloadFile(oportunidade)"
            class="text-primary hover:text-white transition-all hover:scale-110 shrink-0 opacity-80 group-hover:opacity-100"
            title="Ver Arquivo"
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
            v-if="oportunidade.link"
            :href="oportunidade.link"
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
              {{ oportunidade.ano_semestre }}
            </span>
            <span
              v-if="!oportunidade.is_publicado"
              class="text-[10px] bg-gray-500/20 text-gray-400 px-2 rounded text-xs font-bold uppercase"
            >
              Rascunho
            </span>
            <span
              v-if="oportunidade.is_publicado && oportunidade.publicado_em && new Date(oportunidade.publicado_em) > new Date()"
              class="text-[10px] bg-blue-500/20 text-blue-400 px-2 rounded text-xs font-bold uppercase"
            >
              Agendado
            </span>
          </div>
          <h3
            class="text-base md:text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug"
          >
            {{ oportunidade.titulo }}
          </h3>
          <p
            class="text-xs md:text-sm text-secondary line-clamp-3 max-w-2xl whitespace-pre-line"
          >
            {{ oportunidade.descricao }}
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
            <span v-if="oportunidade.exibir_periodo">
              {{ formatDate(oportunidade.data_inicio) }} -
              {{ formatDate(oportunidade.data_fim) }}
            </span>
            <span v-else class="text-secondary/50 italic">Oculto</span>
          </div>
        </div>

        <div class="flex items-center gap-2" @click.stop>
          <button
            @click="emit('edit', oportunidade)"
            class="p-2 hover:bg-white/5 rounded-md text-secondary hover:text-primary transition-colors border border-transparent hover:border-white/5"
            title="Editar"
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

          <button
            @click="emit('delete', oportunidade)"
            class="p-2 hover:bg-red-500/10 rounded-md text-secondary hover:text-red-400 transition-colors border border-transparent hover:border-red-500/10"
            title="Excluir"
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
                d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
