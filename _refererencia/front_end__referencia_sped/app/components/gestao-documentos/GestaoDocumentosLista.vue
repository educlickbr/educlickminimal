<script setup lang="ts">
defineProps<{
  isLoading: boolean;
  documentos: any[];
  pagination: { pagina_atual: number; qtd_paginas: number; total: number };
  hashBaseLocal: string | null;
  areaLabel: (area: string | null) => string;
  areaBadgeClass: (area: string | null) => string;
  formatDate: (iso: string | null) => string;
}>();

const emit = defineEmits<{
  openEdit: [doc: any];
  openDelete: [doc: any];
  openPhotoModal: [doc: any];
  'fetch-page': [page: number];
}>();
</script>

<template>
  <div class="space-y-4">
    <!-- Loading -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20"
    >
      <svg
        class="animate-spin h-8 w-8 text-primary mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p class="text-sm text-secondary">
        Carregando documentos...
      </p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="documentos.length === 0"
      class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
    >
      <svg
        class="w-16 h-16 text-secondary/40 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p class="text-white font-medium">
        Nenhum documento encontrado
      </p>
      <p class="text-xs text-secondary mt-1">
        Adicione um documento ou ajuste os filtros.
      </p>
    </div>

    <!-- Cards List -->
    <div v-else class="space-y-3">
      <div
        v-for="doc in documentos"
        :key="doc.id"
        class="bg-[#0f0f15] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-4 group transition-all relative overflow-hidden"
      >
        <!-- Left: File Icon -->
        <div class="shrink-0">
          <a
            v-if="doc.arquivo && hashBaseLocal"
            :href="hashBaseLocal + doc.arquivo"
            target="_blank"
            class="text-primary/60 hover:text-primary transition-colors flex items-center justify-center"
            title="Baixar/Visualizar Documento"
            @click.stop
          >
            <svg
              class="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </a>
          <div
            v-else
            class="text-white/10 flex items-center justify-center"
            title="Sem arquivo"
          >
            <svg
              class="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <!-- Center: Info -->
        <div class="flex-1 min-w-0">
          <!-- Badges -->
          <div
            class="flex flex-wrap items-center gap-1.5 mb-1"
          >
            <span
              v-if="doc.escopo === 'geral'"
              class="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none bg-sky-500/10 text-sky-300 border-sky-500/20"
            >
              Geral
            </span>
            <span
              class="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none"
              :class="
                doc.publicado
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-secondary border-white/10'
              "
            >
              {{
                doc.publicado ? "Publicado" : "Rascunho"
              }}
            </span>
            <span
              v-if="doc.escopo === 'area' && doc.area"
              class="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none"
              :class="areaBadgeClass(doc.area)"
            >
              {{ areaLabel(doc.area) }}
            </span>
            <span
              v-else-if="doc.turma"
              class="text-[8px] font-bold text-white/70 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 leading-none truncate max-w-[180px]"
              :title="doc.turma.nome_curso"
            >
              {{ doc.turma.nome_curso }}
              <span class="opacity-60">{{
                doc.turma.cod_turma
              }}</span>
            </span>
          </div>
          <!-- Title -->
          <p
            class="font-semibold text-white text-sm group-hover:text-primary transition-colors truncate"
            :title="doc.nome_documento"
          >
            {{ doc.nome_documento }}
          </p>
          <p
            v-if="doc.descricao"
            class="text-[11px] text-secondary/70 truncate mt-0.5"
            :title="doc.descricao"
          >
            {{ doc.descricao }}
          </p>
        </div>

        <!-- Right: periodo + actions -->
        <div class="shrink-0 flex flex-col items-end gap-2">
          <div class="text-right hidden sm:block">
            <p
              class="text-[8px] font-bold text-secondary uppercase tracking-wider"
            >
              Período
            </p>
            <p
              class="text-[11px] text-white font-medium whitespace-nowrap"
            >
              {{ formatDate(doc.vigencia_ini) }} &ndash;
              {{ formatDate(doc.vigencia_fim) }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="emit('openEdit', doc)"
              class="p-1.5 rounded-lg text-secondary hover:text-primary bg-white/5 hover:bg-white/10 transition-colors"
              title="Editar"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              @click="emit('openDelete', doc)"
              class="p-1.5 rounded-lg text-secondary hover:text-red-400 bg-white/5 hover:bg-white/10 transition-colors"
              title="Remover"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination.qtd_paginas > 1"
      class="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5"
    >
      <span class="text-xs text-secondary order-2 md:order-1">
        Página
        <span class="text-white font-medium">{{
          pagination.pagina_atual
        }}</span>
        de
        <span class="text-white font-medium">{{
          pagination.qtd_paginas
        }}</span>
        &nbsp;·&nbsp; Total:
        <span class="text-white font-medium">{{
          pagination.total
        }}</span>
      </span>
      <div class="flex gap-2 order-1 md:order-2">
        <button
          @click="emit('fetch-page', pagination.pagina_atual - 1)"
          :disabled="pagination.pagina_atual === 1"
          class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          @click="emit('fetch-page', pagination.pagina_atual + 1)"
          :disabled="
            pagination.pagina_atual >=
            pagination.qtd_paginas
          "
          class="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>
