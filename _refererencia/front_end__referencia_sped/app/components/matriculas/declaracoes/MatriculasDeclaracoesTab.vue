<script setup lang="ts">
import { formatDate as formatDateSP } from "~/utils/date";

const props = defineProps<{
  declaracoes: any[];
  isLoading: boolean;
  editingDeclarationDateId: string | null;
  savingDeclarationDateId: string | null;
  declarationDateDrafts: Record<string, string>;
}>();

const emit = defineEmits<{
  openStatusModalForDeclaration: [item: any];
  openDeclarationNameChoiceModal: [item: any, action: "print" | "public"];
  openDeclarationDateEditor: [item: any];
  cancelDeclarationDateEdit: [idDeclaracao: string];
  saveDeclarationMatriculaDate: [item: any];
  restoreDeclarationMatriculaDate: [item: any];
}>();

const formatDate = (dateString: string) => {
  if (!dateString) return "--";
  return formatDateSP(dateString) || "--";
};
</script>

<template>
  <div class="space-y-4">
    <!-- Loading State -->
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
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p class="text-sm text-secondary">
        Carregando declarações...
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="declaracoes.length === 0"
      class="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-xl"
    >
      <div class="text-4xl mb-4 text-secondary/50">
        <svg
          class="w-16 h-16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
      </div>
      <p class="text-white font-medium">
        Nenhuma declaração encontrada
      </p>
      <p class="text-xs text-secondary mt-1">
        Verifique os filtros.
      </p>
    </div>

    <!-- Lista de Declarações -->
    <div v-else class="space-y-3">
      <div
        v-for="item in declaracoes"
        :key="item.id_declaracao"
        class="bg-[#16161E] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-6 relative"
      >
        <!-- Left Block: Status & Date -->
        <div
          class="flex items-start gap-3 w-full md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4"
        >
          <div
            class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0"
          >
            <svg
              class="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
          </div>
          <div class="min-w-0">
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 inline-block"
              :class="{
                'bg-green-500/20 text-green-400':
                  item.aprovado === true,
                'bg-red-500/20 text-red-400':
                  item.aprovado === false,
                'bg-yellow-500/20 text-yellow-400':
                  item.aprovado === null ||
                  item.aprovado === undefined,
              }"
            >
              {{
                item.aprovado === true
                  ? "Aprovado"
                  : item.aprovado === false
                    ? "Reprovado"
                    : "Pendente"
              }}
            </span>
            <p class="text-xs text-secondary truncate">
              {{ formatDate(item.criado_em) }}
            </p>
          </div>
        </div>

        <!-- Middle Block: Turma Info -->
        <div class="flex-1 min-w-0 space-y-1">
          <h4 class="font-bold text-white text-base">
            {{
              item.nome_aluno || "Aluno não identificado"
            }}
          </h4>
          <p class="text-sm text-secondary font-medium">
            {{ item.cod_turma }} - {{ item.nome_curso }}
          </p>
          <p class="text-[10px] text-secondary/60">
            {{ item.ano_semestre }} | {{ item.turno }} |
            {{ item.area_curso }}
          </p>
          <div class="pt-2 flex flex-wrap items-center gap-2">
            <span class="text-[11px] text-white/80">
              Data matrícula:
              <span class="font-mono text-white">{{
                formatDate(item.dt_matricula)
              }}</span>
            </span>
            <span
              v-if="item.data_matricula_modificada"
              class="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20"
            >
              Ajustada
            </span>
            <span
              v-if="
                item.data_matricula_modificada &&
                item.dt_matricula_original
              "
              class="inline-flex items-center gap-1.5 text-[10px] text-secondary"
            >
              <span
                >Original:
                {{
                  formatDate(
                    item.dt_matricula_original,
                  )
                }}</span
              >
              <button
                @click="
                  emit('restoreDeclarationMatriculaDate', item)
                "
                :disabled="
                  savingDeclarationDateId ===
                  item.id_declaracao
                "
                class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/10 hover:bg-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed text-amber-200 border border-amber-500/20 transition-colors"
                title="Restaurar data original da matrícula"
              >
                <svg
                  v-if="
                    savingDeclarationDateId !==
                    item.id_declaracao
                  "
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h4l3-3m0 0l-3-3m3 3H7a4 4 0 00-4 4v1m18 2h-4l-3 3m0 0l3 3m-3-3h3a4 4 0 004-4v-1"
                  ></path>
                </svg>
                <svg
                  v-else
                  class="w-3 h-3 animate-spin"
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
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </button>
            </span>
          </div>
          <div
            v-if="
              editingDeclarationDateId ===
              item.id_declaracao
            "
            class="pt-3 flex flex-col sm:flex-row sm:items-center gap-2"
          >
            <input
              v-model="
                declarationDateDrafts[
                  item.id_declaracao
                ]
              "
              type="date"
              class="w-full sm:w-auto min-w-[180px] bg-[#0f0f15] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <button
              @click="emit('saveDeclarationMatriculaDate', item)"
              :disabled="
                savingDeclarationDateId ===
                item.id_declaracao
              "
              class="px-3 py-2 bg-primary/15 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-primary rounded transition-colors border border-primary/20"
            >
              {{
                savingDeclarationDateId ===
                item.id_declaracao
                  ? "Salvando..."
                  : "Salvar data"
              }}
            </button>
            <button
              @click="
                emit('cancelDeclarationDateEdit', item.id_declaracao)
              "
              :disabled="
                savingDeclarationDateId ===
                item.id_declaracao
              "
              class="px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white rounded transition-colors border border-white/10"
            >
              Cancelar
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="flex flex-wrap items-center gap-2 self-start md:self-center"
        >
          <button
            @click="
              emit('openDeclarationNameChoiceModal', item, 'public')
            "
            :disabled="item.aprovado !== true"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :title="
              item.aprovado === true
                ? 'Abrir Página Pública'
                : 'Disponível somente para declarações aprovadas'
            "
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5zm12 1h1m2 0h1m-5 2h5m-3-3v5"
              />
            </svg>
          </button>
          <button
            @click="
              emit('openDeclarationNameChoiceModal', item, 'print')
            "
            class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors"
            title="Imprimir / Baixar PDF"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z"
              />
            </svg>
          </button>

          <!-- Status Management Button -->
          <button
            @click="emit('openStatusModalForDeclaration', item)"
            class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-white rounded transition-colors flex items-center gap-1.5 border border-white/10"
            title="Gerenciar Status (Aprovar/Reprovar)"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            Status
          </button>

          <button
            @click="
              editingDeclarationDateId ===
              item.id_declaracao
                ? emit('cancelDeclarationDateEdit', item.id_declaracao)
                : emit('openDeclarationDateEditor', item)
            "
            :disabled="
              savingDeclarationDateId ===
              item.id_declaracao
            "
            class="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white rounded transition-colors border border-white/10 flex items-center gap-1.5"
            title="Ajustar data de matrícula usada na declaração"
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
                d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
              ></path>
            </svg>
            {{
              editingDeclarationDateId ===
              item.id_declaracao
                ? "Fechar data"
                : "Ajustar data"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
