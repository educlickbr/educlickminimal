<template>
  <div
    class="bg-[#16161E] border border-white/5 rounded-xl p-4 transition-colors hover:border-white/10"
  >
    <div class="flex flex-col gap-1 mb-2">
      <div class="flex items-center gap-2 mb-1">
        <span
          class="text-xs font-bold px-2 py-0.5 rounded border"
          :class="getStatusBadge(item.status)"
          >{{ item.status }}</span
        >
        <span class="text-xs text-secondary">{{
          formatDate(item.criado_em)
        }}</span>
      </div>
      <h4 class="font-bold text-white text-lg">
        {{ item.cod_turma }} - {{ item.nome_curso }}
      </h4>
      <p class="text-sm text-secondary">
        De
        <span class="text-white">{{
          formatDate(item.data_inicio_janela)
        }}</span>
        até
        <span class="text-white">{{
          formatDate(item.data_fim_janela)
        }}</span>
      </p>
    </div>

    <p
      class="text-sm text-white/80 mt-2 bg-white/5 p-3 rounded-lg italic border border-white/5"
    >
      "{{ item.texto }}"
    </p>

    <!-- Motivo da reprovação -->
    <div
      v-if="
        item.status === 'Reprovado' &&
        item.avaliacao_submissao
      "
      class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-3"
    >
      <span
        class="block text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1"
        >Motivo da reprovação</span
      >
      <p class="text-sm text-white/80">
        {{ item.avaliacao_submissao }}
      </p>
    </div>

    <!-- Action Bar -->
    <div
      class="flex flex-wrap items-center gap-6 mt-4 pt-3 border-t border-white/5"
    >
      <button
        v-if="item.arquivo"
        @click="openAttachment(item.arquivo)"
        class="text-sm font-bold text-primary flex items-center gap-2 hover:underline cursor-pointer bg-transparent border-0 p-0 transition-opacity hover:opacity-80"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          ></path>
        </svg>
        Arquivo anexado
      </button>
      <button
        v-if="item.caminho_ficha"
        @click="openAttachment(item.caminho_ficha)"
        class="text-sm font-bold text-green-500 flex items-center gap-2 hover:underline cursor-pointer bg-transparent border-0 p-0 transition-opacity hover:opacity-80"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        Ficha Justificativa
      </button>

      <button
        v-if="item.status === 'Aguardando'"
        @click="$emit('delete', item.id, item.status)"
        class="text-red-500 hover:text-red-400 text-sm font-bold flex items-center gap-2 px-0 py-0 bg-transparent border-0 transition-opacity hover:opacity-80 ml-auto md:ml-0"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Cancelar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  item: any
  formatDate: (date: string) => string
  getStatusBadge: (status: string) => string
  openAttachment: (path: string) => void
}>()

defineEmits<{
  delete: [id: string, status?: string]
}>()
</script>
