<template>
    <div
        class="bg-div-15 border border-white/5 rounded overflow-hidden transition-all duration-300"
        :class="
            isExpanded
                ? 'ring-1 ring-primary/20 bg-[#16161E]'
                : 'hover:border-white/10 hover:bg-[#16161E]'
        "
    >
        <!-- Header Card -->
        <div
            class="p-4 md:p-5 flex items-center justify-between cursor-pointer group"
            @click="$emit('toggle', avaliacao.id_avaliacao)"
        >
            <div class="flex-1 min-w-0 pr-4">
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border text-primary border-primary/20 bg-primary/5"
                    >
                        {{ avaliacao.ano_semestre }}
                    </span>
                    <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border text-white/50 border-white/10 bg-white/5"
                    >
                        {{ avaliacao.etapa }}
                    </span>
                </div>
                <h2
                    class="text-lg md:text-xl font-bold text-white/90 leading-tight truncate-multiline"
                >
                    {{ avaliacao.curso_nome }}
                </h2>
                <p class="text-xs text-secondary mt-1">
                    Turma: {{ avaliacao.turma_nome }}
                </p>
            </div>

            <div class="flex-shrink-0 flex items-center gap-4">
                <!-- Badges on closed card -->
                <div
                    class="hidden sm:flex items-center gap-2 flex-wrap justify-end"
                    v-if="!isExpanded"
                >
                    <span
                        v-if="avaliacao.conceito_geral"
                        translate="no"
                        class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border shadow-sm"
                        :class="
                            conceitoClass[avaliacao.conceito_geral] ||
                            'text-white/50 border-white/10 bg-white/5'
                        "
                    >
                        {{
                            conceitoLabel[avaliacao.conceito_geral] ||
                            avaliacao.conceito_geral
                        }}
                    </span>

                    <!-- Atividade button -->
                    <button
                        v-if="
                            avaliacao.atividade_associada &&
                            (avaliacao.atividade_associada.status_avaliacao ===
                                'Pendente' ||
                                avaliacao.atividade_associada
                                    .status_avaliacao === 'Reprovado')
                        "
                        type="button"
                        @click.stop="$emit('open-atividade', avaliacao)"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors"
                        :class="
                            avaliacao.atividade_associada.status_avaliacao ===
                            'Pendente'
                                ? 'bg-amber-500 hover:bg-amber-400 text-black animate-pulse'
                                : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300'
                        "
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <span
                            v-if="
                                avaliacao.atividade_associada
                                    .status_avaliacao === 'Pendente'
                            "
                            >Entregar atividade</span
                        >
                        <span v-else>Reenviar atividade</span>
                    </button>

                    <!-- Entregue badge -->
                    <template
                        v-if="
                            avaliacao.atividade_associada &&
                            avaliacao.atividade_associada.status_avaliacao ===
                                'Entregue'
                        "
                    >
                        <button
                            type="button"
                            @click.stop="$emit('open-atividade', avaliacao)"
                            class="w-7 h-7 flex items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors"
                            title="Ver atividade"
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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </button>
                        <span
                            class="px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider border-blue-500/25 bg-blue-500/10 text-blue-300"
                        >
                            Atividade entregue
                        </span>
                    </template>
                </div>

                <div class="flex items-center gap-2">
                    <button
                        @click.stop="
                            $emit('open-name-choice', avaliacao, 'public')
                        "
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors"
                        :class="
                            !(
                                avaliacao.token_publico &&
                                avaliacao.acesso_publico_ativo
                            )
                                ? 'opacity-70'
                                : ''
                        "
                        title="Abrir Página Pública"
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
                        @click.stop="
                            $emit('open-name-choice', avaliacao, 'print')
                        "
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors"
                        title="Imprimir Avaliação"
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
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                            />
                        </svg>
                    </button>
                    <button
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary group-hover:bg-primary group-hover:text-white transition-colors"
                    >
                        <svg
                            class="w-5 h-5 transition-transform duration-300"
                            :class="{ 'rotate-180': isExpanded }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Corpo Expandido -->
        <Transition name="slide-down">
            <div
                v-if="isExpanded"
                class="border-t border-white/5 bg-black/20 p-4 md:p-6"
            >
                <!-- Critérios -->
                <div
                    v-if="avaliacao.criterios && avaliacao.criterios.length > 0"
                    class="mb-6"
                >
                    <h3
                        translate="no"
                        class="text-xs font-black text-secondary tracking-[0.2em] uppercase mb-4"
                    >
                        Notas por Critério
                    </h3>
                    <div class="space-y-2">
                        <div
                            v-for="criterio in avaliacao.criterios"
                            :key="criterio.id_criterio"
                            class="flex items-center justify-between bg-[#1f2029] p-3 rounded-lg border border-white/5"
                        >
                            <span class="text-sm text-white/80 pr-4">{{
                                criterio.criterio
                            }}</span>
                            <span
                                translate="no"
                                class="px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider border shrink-0"
                                :class="
                                    conceitoClass[criterio.conceito || ''] ||
                                    'text-white/30 border-white/10 bg-white/5'
                                "
                            >
                                {{
                                    conceitoLabel[criterio.conceito || ""] ||
                                    criterio.conceito ||
                                    "---"
                                }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Comentário + Avaliadores/Validadores -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div
                        v-if="avaliacao.comentario"
                        class="bg-[#1f2029] border border-white/5 rounded-lg p-4"
                    >
                        <h3
                            class="text-xs font-black text-secondary tracking-[0.2em] uppercase mb-2"
                        >
                            Comentário
                        </h3>
                        <p
                            class="text-sm text-white/80 leading-relaxed whitespace-pre-line"
                        >
                            {{ avaliacao.comentario }}
                        </p>
                    </div>
                    <div
                        class="bg-[#1f2029] border border-white/5 rounded-lg p-4"
                        :class="avaliacao.comentario ? '' : 'md:col-start-1'"
                    >
                        <h3
                            class="text-xs font-black text-secondary tracking-[0.2em] uppercase mb-3"
                        >
                            Avaliadores
                        </h3>
                        <div class="space-y-1 text-sm">
                            <p v-if="avaliacao.avaliadores?.[0]">
                                <span class="text-secondary">Avaliador 1:</span>
                                {{ getNomeAvaliador(avaliacao.avaliadores[0]) }}
                            </p>
                            <p v-if="avaliacao.avaliadores?.[1]">
                                <span class="text-secondary">Avaliador 2:</span>
                                {{ getNomeAvaliador(avaliacao.avaliadores[1]) }}
                            </p>
                        </div>
                        <h3
                            class="text-xs font-black text-secondary tracking-[0.2em] uppercase mb-3 mt-4"
                        >
                            Validação
                        </h3>
                        <div class="space-y-1 text-sm">
                            <p>
                                <span class="text-secondary">Coordenador:</span>
                                {{
                                    getNomeCompleto(
                                        avaliacao.validadores?.coordenador,
                                    )
                                }}
                            </p>
                            <p>
                                <span class="text-secondary">Pedagogo:</span>
                                {{
                                    getNomeCompleto(
                                        avaliacao.validadores?.pedagogo,
                                    )
                                }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- QR Code -->
                <div
                    v-if="avaliacao.token_validacao_publica"
                    class="bg-[#1f2029] border border-white/5 rounded-lg p-4 mb-6"
                >
                    <h3
                        class="text-xs font-black text-secondary tracking-[0.2em] uppercase mb-3"
                    >
                        Validação Eletrônica
                    </h3>
                    <div class="flex items-start gap-4">
                        <img
                            :src="
                                getPublicQrcodeUrl(
                                    avaliacao,
                                    'registro',
                                    420,
                                ) || undefined
                            "
                            alt="QR Code da avaliação pública"
                            class="w-20 h-20 rounded-lg border border-white/10 bg-white cursor-pointer"
                            @click="
                                $emit('open-name-choice', avaliacao, 'public')
                            "
                        />
                        <div class="text-sm text-secondary space-y-1">
                            <p>
                                <span class="text-white/80"
                                    >Página Pública:</span
                                >
                                <a
                                    :href="
                                        getPublicAvaliacaoUrl(
                                            avaliacao,
                                            'registro',
                                        ) || undefined
                                    "
                                    target="_blank"
                                    class="text-primary hover:text-white transition-colors ml-1"
                                >
                                    abrir
                                </a>
                            </p>
                            <p class="text-xs text-secondary/60">
                                QR Code e link público para validação do
                                documento.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Atividade Associada -->
                <div
                    v-if="avaliacao.atividade_associada"
                    class="bg-[#1f2029] border border-white/5 rounded-lg p-4"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0 flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                            >
                                <svg
                                    class="w-5 h-5 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-white">
                                    {{ avaliacao.atividade_associada.titulo }}
                                </p>
                                <p
                                    v-if="
                                        avaliacao.atividade_associada.enunciado
                                    "
                                    class="text-xs text-secondary mt-0.5 line-clamp-2"
                                >
                                    {{
                                        avaliacao.atividade_associada.enunciado
                                    }}
                                </p>
                                <p class="text-[10px] text-secondary mt-1">
                                    Status:
                                    <span
                                        class="font-bold"
                                        :class="{
                                            'text-green-400':
                                                avaliacao.atividade_associada
                                                    .status_avaliacao ===
                                                'Entregue',
                                            'text-amber-400':
                                                avaliacao.atividade_associada
                                                    .status_avaliacao ===
                                                'Pendente',
                                            'text-red-400':
                                                avaliacao.atividade_associada
                                                    .status_avaliacao ===
                                                'Reprovado',
                                        }"
                                    >
                                        {{
                                            avaliacao.atividade_associada
                                                .status_avaliacao
                                        }}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            @click.stop="$emit('open-atividade', avaliacao)"
                            class="shrink-0 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors"
                        >
                            <span
                                v-if="
                                    avaliacao.atividade_associada
                                        .status_avaliacao === 'Pendente' ||
                                    avaliacao.atividade_associada
                                        .status_avaliacao === 'Reprovado'
                                "
                            >
                                {{
                                    avaliacao.atividade_associada
                                        .status_avaliacao === "Pendente"
                                        ? "Entregar"
                                        : "Reenviar"
                                }}
                            </span>
                            <span v-else>Ver</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { AvaliacaoAluno } from "~/composables/avaliacoes-alunos/useAvaliacoesAlunosLista";

defineProps<{
    avaliacao: AvaliacaoAluno;
    isExpanded: boolean;
    conceitoLabel: Record<string, string>;
    conceitoClass: Record<string, string>;
    getNomeCompleto: (pessoa?: any) => string;
    getNomeAvaliador: (avaliador?: any) => string;
    getPublicQrcodeUrl: (...args: any[]) => string | null;
    getPublicAvaliacaoUrl: (...args: any[]) => string | null;
}>();

defineEmits<{
    toggle: [id: string];
    "open-atividade": [avl: AvaliacaoAluno];
    "open-name-choice": [avl: AvaliacaoAluno, action: "print" | "public"];
}>();
</script>
