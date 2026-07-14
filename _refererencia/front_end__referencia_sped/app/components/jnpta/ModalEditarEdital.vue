<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm"
            @click.self="$emit('close')"
        >
            <div
                class="bg-[#1A1A24] border-none md:border md:border-white/10 rounded-none md:rounded-lg w-full md:max-w-6xl overflow-hidden shadow-none md:shadow-2xl transform transition-all h-full md:h-auto max-h-full md:max-h-[85vh] flex flex-col"
            >
                <!-- Header -->
                <div
                    class="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0"
                >
                    <div class="flex flex-col gap-1">
                        <span
                            class="text-[10px] uppercase font-bold tracking-wider text-primary"
                            >Jornada Paulista</span
                        >
                        <h2 class="text-xl font-bold text-white">
                            Editar Edital
                        </h2>
                    </div>
                    <button
                        @click="$emit('close')"
                        class="text-secondary hover:text-white transition-colors"
                    >
                        <svg
                            class="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <!-- Body -->
                <div
                    class="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar grow"
                >
                    <!-- Form fields -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Título do Edital</label
                            >
                            <input
                                v-model="editandoEdital.edital_titulo"
                                type="text"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Ano/Semestre</label
                            >
                            <select
                                v-model="editandoEdital.ano_semestre"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            >
                                <option :value="getAnoSemestre(undefined, -1)">
                                    {{ getAnoSemestre(undefined, -1) }}
                                    (Anterior)
                                </option>
                                <option :value="getAnoSemestre()">
                                    {{ getAnoSemestre() }} (Atual)
                                </option>
                                <option :value="getAnoSemestre(undefined, 1)">
                                    {{ getAnoSemestre(undefined, 1) }} (Próximo)
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Tempo</label
                            >
                            <select
                                v-model="editandoEdital.qual_tempo"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            >
                                <option value="primeiro_tempo">
                                    Primeiro Tempo
                                </option>
                                <option value="segundo_tempo">
                                    Segundo Tempo
                                </option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Descrição</label
                            >
                            <textarea
                                v-model="editandoEdital.edital_descricao"
                                rows="3"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            ></textarea>
                        </div>
                        <div class="md:col-span-2">
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block"
                                >Arquivo do Edital</label
                            >

                            <input
                                ref="localEditFileInput"
                                type="file"
                                accept="application/pdf,image/jpeg,image/jpg,image/png"
                                class="hidden"
                                @change="onEditFileChange"
                            />

                            <div
                                @click="localEditFileInput?.click()"
                                @drop.prevent="onEditDrop"
                                @dragover.prevent="editDragging = true"
                                @dragleave.prevent="editDragging = false"
                                class="relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200"
                                :class="[
                                    editDragging
                                        ? 'border-primary bg-primary/5'
                                        : 'border-secondary/20 hover:border-secondary/40',
                                    editFile || editandoEdital.arquivo_edital
                                        ? 'bg-background'
                                        : 'bg-background/50',
                                ]"
                            >
                                <div
                                    v-if="
                                        !editFile &&
                                        !editandoEdital.arquivo_edital
                                    "
                                    class="flex flex-col items-center justify-center py-8 px-4"
                                >
                                    <svg
                                        class="w-10 h-10 mb-3 text-secondary opacity-50"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    <p class="text-sm text-secondary mb-1">
                                        Clique ou arraste o arquivo aqui
                                    </p>
                                    <p class="text-xs text-secondary/60">
                                        PDF, JPG, JPEG ou PNG
                                    </p>
                                </div>

                                <div
                                    v-else-if="
                                        !editFile &&
                                        editandoEdital.arquivo_edital
                                    "
                                    class="flex items-center justify-between py-4 px-4"
                                >
                                    <div class="flex items-center gap-3">
                                        <svg
                                            class="w-8 h-8 text-primary"
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
                                        <div>
                                            <p
                                                class="text-sm font-medium text-white"
                                            >
                                                {{
                                                    editandoEdital.arquivo_edital
                                                }}
                                            </p>
                                            <p class="text-xs text-secondary">
                                                Clique para substituir
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    v-else
                                    class="flex items-center justify-between py-4 px-4"
                                >
                                    <div class="flex items-center gap-3">
                                        <svg
                                            class="w-8 h-8 text-green-500"
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
                                        <div>
                                            <p
                                                class="text-sm font-medium text-white"
                                            >
                                                {{ editFile?.name }}
                                            </p>
                                            <p class="text-xs text-secondary">
                                                {{
                                                    (
                                                        (editFile?.size || 0) /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)
                                                }}
                                                MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        @click.stop="removeEditFile"
                                        class="text-secondary hover:text-red-500 transition-colors"
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
                                                stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <p
                                v-if="editErrorMsg"
                                class="text-xs text-red-500 mt-2"
                            >
                                {{ editErrorMsg }}
                            </p>
                        </div>
                        <div>
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Data de Início</label
                            >
                            <input
                                v-model="editandoEdital.dt_inicio"
                                type="datetime-local"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label
                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >Data de Término</label
                            >
                            <input
                                v-model="editandoEdital.dt_fim"
                                type="datetime-local"
                                class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                            />
                        </div>
                        <div class="md:col-span-2 flex items-center gap-2">
                            <input
                                id="publicado-edit-modal"
                                v-model="editandoEdital.publicado"
                                type="checkbox"
                                class="w-4 h-4"
                            />
                            <label
                                for="publicado-edit-modal"
                                class="text-xs font-bold text-secondary"
                                >Publicado</label
                            >
                        </div>
                    </div>

                    <!-- Atividades section (only for primeiro_tempo) -->
                    <div
                        v-if="editandoEdital.qual_tempo === 'primeiro_tempo'"
                        class="border-t border-white/5 pt-5 space-y-4"
                    >
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p
                                    class="text-xs font-bold text-secondary uppercase tracking-wider"
                                >
                                    Programação do Primeiro Tempo
                                </p>
                                <h3 class="text-base font-bold text-white mt-1">
                                    Atividades e opções por profissional
                                </h3>
                                <p class="text-xs text-secondary mt-1">
                                    Cadastre a atividade e, dentro dela, as
                                    opções com nome do profissional, dia e
                                    horário.
                                </p>
                            </div>
                            <div
                                v-if="loadingAtividades"
                                class="text-xs text-secondary"
                            >
                                Carregando...
                            </div>
                        </div>

                        <div
                            v-if="
                                !loadingAtividades &&
                                atividadesEdital.length === 0
                            "
                            class="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-secondary"
                        >
                            Nenhuma atividade cadastrada para este edital ainda.
                        </div>

                        <div
                            v-for="atividade in atividadesEdital"
                            :key="atividade.id"
                            class="rounded-lg border border-white/5 bg-[#16161E] overflow-hidden"
                        >
                            <div class="p-4 space-y-4">
                                <div
                                    class="flex items-start justify-between gap-4"
                                >
                                    <div class="min-w-0 flex-1">
                                        <p class="text-white font-bold">
                                            {{
                                                atividade.atividade_nome ||
                                                "Nova atividade"
                                            }}
                                        </p>
                                        <p
                                            class="text-[11px] text-secondary mt-1 line-clamp-2"
                                        >
                                            {{
                                                atividade.descricao ||
                                                "Sem descrição"
                                            }}
                                        </p>
                                        <div
                                            class="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-secondary/80"
                                        >
                                            <span
                                                >Duração:
                                                {{
                                                    atividade.duracao_minutos ??
                                                    "-"
                                                }}
                                                min</span
                                            >
                                            <span
                                                >Ordem:
                                                {{ atividade.ordem ?? 0 }}</span
                                            >
                                            <span
                                                >Perguntas:
                                                {{
                                                    atividade.tem_perguntas
                                                        ? "Sim"
                                                        : "Não"
                                                }}</span
                                            >
                                        </div>
                                    </div>
                                    <div
                                        class="flex items-center gap-2 shrink-0 self-start"
                                    >
                                        <button
                                            v-if="atividade.expanded"
                                            type="button"
                                            @click="
                                                $emit(
                                                    'handleSalvarAtividade',
                                                    atividade,
                                                )
                                            "
                                            :disabled="
                                                savingAtividadeId ===
                                                atividade.id
                                            "
                                            class="w-8 h-8 inline-flex items-center justify-center rounded-md border border-secondary/20 bg-background text-secondary hover:text-white disabled:opacity-60"
                                            title="Salvar atividade"
                                        >
                                            <svg
                                                class="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            @click="
                                                $emit(
                                                    'handleExcluirAtividade',
                                                    atividade,
                                                )
                                            "
                                            :disabled="
                                                deletingAtividadeId ===
                                                atividade.id
                                            "
                                            class="w-8 h-8 inline-flex items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-red-300 hover:text-red-200 disabled:opacity-60"
                                            title="Excluir atividade"
                                        >
                                            <svg
                                                class="w-4 h-4"
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
                                        <button
                                            type="button"
                                            @click="
                                                $emit(
                                                    'toggleAtividade',
                                                    atividade.id,
                                                )
                                            "
                                            class="w-8 h-8 inline-flex items-center justify-center rounded-md border border-secondary/20 bg-background text-secondary hover:text-white"
                                            :title="
                                                atividade.expanded
                                                    ? 'Ocultar detalhes'
                                                    : 'Abrir detalhes'
                                            "
                                        >
                                            <svg
                                                v-if="atividade.expanded"
                                                class="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M5 15l7-7 7 7"
                                                />
                                            </svg>
                                            <svg
                                                v-else
                                                class="w-4 h-4"
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

                                <div
                                    v-if="atividade.expanded"
                                    class="grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-white/5 pt-4"
                                >
                                    <div class="md:col-span-2">
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Nome da atividade</label
                                        >
                                        <input
                                            v-model="atividade.atividade_nome"
                                            type="text"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Duração (min)</label
                                        >
                                        <input
                                            v-model.number="
                                                atividade.duracao_minutos
                                            "
                                            type="number"
                                            min="0"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Ordem</label
                                        >
                                        <input
                                            v-model.number="atividade.ordem"
                                            type="number"
                                            min="0"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        />
                                    </div>
                                    <div class="md:col-span-4">
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Descrição</label
                                        >
                                        <textarea
                                            v-model="atividade.descricao"
                                            rows="2"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Tem perguntas?</label
                                        >
                                        <select
                                            v-model="atividade.tem_perguntas"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        >
                                            <option :value="false">Não</option>
                                            <option :value="true">Sim</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Perguntas da atividade -->
                            <div
                                v-if="atividade.expanded"
                                class="p-4 space-y-4 bg-background/20"
                            >
                                <div
                                    v-if="atividade.tem_perguntas"
                                    class="rounded-lg border border-white/5 bg-background/40 p-4 space-y-4"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <p
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                        >
                                            Perguntas da atividade
                                        </p>
                                        <button
                                            type="button"
                                            @click="
                                                $emit(
                                                    'togglePerguntasAtividade',
                                                    atividade.id,
                                                )
                                            "
                                            class="w-8 h-8 inline-flex items-center justify-center rounded-md border border-secondary/20 bg-background text-secondary hover:text-white"
                                            :title="
                                                atividade.perguntasExpanded
                                                    ? 'Ocultar perguntas'
                                                    : 'Abrir perguntas'
                                            "
                                        >
                                            <svg
                                                v-if="
                                                    atividade.perguntasExpanded
                                                "
                                                class="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M5 15l7-7 7 7"
                                                />
                                            </svg>
                                            <svg
                                                v-else
                                                class="w-4 h-4"
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

                                    <template
                                        v-if="atividade.perguntasExpanded"
                                    >
                                        <div
                                            v-if="!atividade.perguntasLoaded"
                                            class="text-xs text-secondary"
                                        >
                                            Carregando perguntas...
                                        </div>

                                        <div
                                            v-else-if="
                                                atividade.perguntas &&
                                                atividade.perguntas.length > 0
                                            "
                                            class="space-y-3"
                                        >
                                            <div
                                                v-for="pergunta in atividade.perguntas"
                                                :key="pergunta.id"
                                                class="rounded-lg border border-white/5 bg-background/70 p-4 space-y-3"
                                            >
                                                <div
                                                    class="flex items-start justify-between gap-3"
                                                >
                                                    <div class="min-w-0 flex-1">
                                                        <p
                                                            class="text-xs font-bold text-white truncate"
                                                        >
                                                            {{
                                                                pergunta.pergunta ||
                                                                "Nova pergunta"
                                                            }}
                                                        </p>
                                                        <div
                                                            class="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-secondary/80"
                                                        >
                                                            <span
                                                                >Tipo:
                                                                {{
                                                                    pergunta.tipo_resposta
                                                                }}</span
                                                            >
                                                            <span
                                                                >Ordem:
                                                                {{
                                                                    pergunta.ordem ??
                                                                    0
                                                                }}</span
                                                            >
                                                            <span>{{
                                                                pergunta.obrigatoria
                                                                    ? "Obrigatória"
                                                                    : "Opcional"
                                                            }}</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        class="flex items-center gap-2 shrink-0 self-start"
                                                    >
                                                        <button
                                                            type="button"
                                                            @click="
                                                                $emit(
                                                                    'handleSalvarPerguntaAtividade',
                                                                    pergunta,
                                                                )
                                                            "
                                                            :disabled="
                                                                savingPerguntaId ===
                                                                pergunta.id
                                                            "
                                                            class="w-8 h-8 inline-flex items-center justify-center rounded-md border border-secondary/20 bg-background text-secondary hover:text-white disabled:opacity-60"
                                                            title="Salvar pergunta"
                                                        >
                                                            <svg
                                                                class="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                    stroke-width="2"
                                                                    d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            @click="
                                                                $emit(
                                                                    'handleExcluirPerguntaAtividade',
                                                                    atividade,
                                                                    pergunta,
                                                                )
                                                            "
                                                            :disabled="
                                                                deletingPerguntaId ===
                                                                pergunta.id
                                                            "
                                                            class="w-8 h-8 inline-flex items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-red-300 hover:text-red-200 disabled:opacity-60"
                                                            title="Excluir pergunta"
                                                        >
                                                            <svg
                                                                class="w-4 h-4"
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

                                                <div
                                                    class="grid grid-cols-1 md:grid-cols-6 gap-3 border-t border-white/5 pt-3"
                                                >
                                                    <div class="md:col-span-3">
                                                        <label
                                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                                            >Pergunta</label
                                                        >
                                                        <input
                                                            v-model="
                                                                pergunta.pergunta
                                                            "
                                                            type="text"
                                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                                            >Tipo</label
                                                        >
                                                        <select
                                                            v-model="
                                                                pergunta.tipo_resposta
                                                            "
                                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                                        >
                                                            <option
                                                                value="texto_curto"
                                                            >
                                                                Texto curto
                                                            </option>
                                                            <option
                                                                value="texto_longo"
                                                            >
                                                                Texto longo
                                                            </option>
                                                            <option
                                                                value="sim_nao"
                                                            >
                                                                Sim / Não
                                                            </option>
                                                            <option
                                                                value="multipla_escolha"
                                                            >
                                                                Múltipla escolha
                                                            </option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                                            >Ordem</label
                                                        >
                                                        <input
                                                            v-model.number="
                                                                pergunta.ordem
                                                            "
                                                            type="number"
                                                            min="0"
                                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                                        />
                                                    </div>
                                                    <div class="flex items-end">
                                                        <label
                                                            class="inline-flex items-center gap-2 text-xs text-secondary"
                                                        >
                                                            <input
                                                                v-model="
                                                                    pergunta.obrigatoria
                                                                "
                                                                type="checkbox"
                                                                class="rounded border-secondary/20 bg-background text-primary focus:ring-primary/40"
                                                            />
                                                            Obrigatória
                                                        </label>
                                                    </div>
                                                </div>

                                                <!-- Opções para múltipla escolha -->
                                                <div
                                                    v-if="
                                                        pergunta.tipo_resposta ===
                                                        'multipla_escolha'
                                                    "
                                                    class="border-t border-white/5 pt-3 space-y-2"
                                                >
                                                    <div
                                                        class="flex items-center justify-between mb-1"
                                                    >
                                                        <p
                                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                                        >
                                                            Opções de escolha
                                                        </p>
                                                        <button
                                                            type="button"
                                                            @click="
                                                                toggleNovaOpcaoForm(
                                                                    pergunta.id!,
                                                                )
                                                            "
                                                            class="w-6 h-6 inline-flex items-center justify-center rounded-md border border-primary/30 bg-primary text-white hover:bg-primary-hover"
                                                            title="Adicionar opção"
                                                        >
                                                            <svg
                                                                class="w-3 h-3"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                    stroke-width="2"
                                                                    d="M12 4v16m8-8H4"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <div
                                                        v-if="
                                                            !pergunta.opcoes ||
                                                            pergunta.opcoes
                                                                .length === 0
                                                        "
                                                        class="text-[11px] text-secondary/50 italic"
                                                    >
                                                        Nenhuma opção
                                                        cadastrada.
                                                    </div>

                                                    <div
                                                        v-for="opcao in pergunta.opcoes"
                                                        :key="opcao.id"
                                                        class="flex items-center gap-2"
                                                    >
                                                        <input
                                                            v-model="
                                                                opcao.label
                                                            "
                                                            type="text"
                                                            class="flex-1 bg-background border border-secondary/10 rounded-md px-3 py-2 text-xs text-white"
                                                            placeholder="Texto da opção"
                                                        />
                                                        <input
                                                            v-model.number="
                                                                opcao.ordem
                                                            "
                                                            type="number"
                                                            min="0"
                                                            class="w-16 bg-background border border-secondary/10 rounded-md px-2 py-2 text-xs text-white"
                                                            placeholder="Ordem"
                                                        />
                                                        <button
                                                            type="button"
                                                            @click="
                                                                $emit(
                                                                    'handleExcluirOpcaoPergunta',
                                                                    pergunta,
                                                                    opcao,
                                                                )
                                                            "
                                                            :disabled="
                                                                deletingOpcaoId ===
                                                                opcao.id
                                                            "
                                                            class="w-7 h-7 inline-flex items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-red-300 hover:text-red-200 disabled:opacity-60"
                                                            title="Excluir opção"
                                                        >
                                                            <svg
                                                                class="w-3 h-3"
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
                                                        <button
                                                            type="button"
                                                            @click="
                                                                $emit(
                                                                    'handleSalvarOpcaoPergunta',
                                                                    opcao,
                                                                )
                                                            "
                                                            :disabled="
                                                                savingOpcaoId ===
                                                                opcao.id
                                                            "
                                                            class="w-7 h-7 inline-flex items-center justify-center rounded-md border border-secondary/20 bg-background text-secondary hover:text-white disabled:opacity-60"
                                                            title="Salvar opção"
                                                        >
                                                            <svg
                                                                class="w-3 h-3"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                    stroke-width="2"
                                                                    d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <div
                                                        v-if="
                                                            showNovaOpcaoFormPorPergunta[
                                                                pergunta.id!
                                                            ]
                                                        "
                                                        class="flex items-center gap-2 pt-1"
                                                    >
                                                        <input
                                                            v-model="
                                                                getNovaOpcao(
                                                                    pergunta.id!,
                                                                ).label
                                                            "
                                                            type="text"
                                                            class="flex-1 bg-background border border-dashed border-white/20 rounded-md px-3 py-2 text-xs text-white"
                                                            placeholder="Nova opção..."
                                                        />
                                                        <input
                                                            v-model.number="
                                                                getNovaOpcao(
                                                                    pergunta.id!,
                                                                ).ordem
                                                            "
                                                            type="number"
                                                            min="0"
                                                            class="w-16 bg-background border border-dashed border-white/20 rounded-md px-2 py-2 text-xs text-white"
                                                            placeholder="0"
                                                        />
                                                        <button
                                                            type="button"
                                                            @click="
                                                                $emit(
                                                                    'handleCriarOpcaoPergunta',
                                                                    pergunta,
                                                                )
                                                            "
                                                            :disabled="
                                                                savingOpcaoId ===
                                                                `new-${pergunta.id}`
                                                            "
                                                            class="bg-primary hover:bg-primary-hover text-white font-bold py-1.5 px-3 rounded-md text-[10px] uppercase tracking-wider disabled:opacity-60"
                                                        >
                                                            {{
                                                                savingOpcaoId ===
                                                                `new-${pergunta.id}`
                                                                    ? "..."
                                                                    : "Adicionar"
                                                            }}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Botão adicionar pergunta -->
                                        <div class="pt-1">
                                            <button
                                                type="button"
                                                @click="
                                                    $emit(
                                                        'toggleNovaPerguntaForm',
                                                        atividade.id,
                                                    )
                                                "
                                                class="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-md text-[10px] uppercase tracking-wider transition-colors shadow-lg shadow-primary/20"
                                            >
                                                {{
                                                    showNovaPerguntaFormPorAtividade[
                                                        atividade.id
                                                    ]
                                                        ? "Cancelar nova pergunta"
                                                        : "Adicionar pergunta"
                                                }}
                                            </button>
                                        </div>

                                        <!-- Formulário nova pergunta -->
                                        <div
                                            v-if="
                                                showNovaPerguntaFormPorAtividade[
                                                    atividade.id
                                                ]
                                            "
                                            class="rounded-lg border border-dashed border-white/10 p-4 space-y-3"
                                        >
                                            <p
                                                class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >
                                                Nova pergunta da atividade
                                            </p>
                                            <div
                                                class="grid grid-cols-1 md:grid-cols-6 gap-3"
                                            >
                                                <div class="md:col-span-3">
                                                    <label
                                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                                        >Pergunta</label
                                                    >
                                                    <input
                                                        v-model="
                                                            getNovaPergunta(
                                                                atividade.id,
                                                            ).pergunta
                                                        "
                                                        type="text"
                                                        class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                                        >Tipo</label
                                                    >
                                                    <select
                                                        v-model="
                                                            getNovaPergunta(
                                                                atividade.id,
                                                            ).tipo_resposta
                                                        "
                                                        class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                                    >
                                                        <option
                                                            value="texto_curto"
                                                        >
                                                            Texto curto
                                                        </option>
                                                        <option
                                                            value="texto_longo"
                                                        >
                                                            Texto longo
                                                        </option>
                                                        <option value="sim_nao">
                                                            Sim / Não
                                                        </option>
                                                        <option
                                                            value="multipla_escolha"
                                                        >
                                                            Múltipla escolha
                                                        </option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label
                                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                                        >Ordem</label
                                                    >
                                                    <input
                                                        v-model.number="
                                                            getNovaPergunta(
                                                                atividade.id,
                                                            ).ordem
                                                        "
                                                        type="number"
                                                        min="0"
                                                        class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                                    />
                                                </div>
                                                <div class="flex items-end">
                                                    <label
                                                        class="inline-flex items-center gap-2 text-xs text-secondary"
                                                    >
                                                        <input
                                                            v-model="
                                                                getNovaPergunta(
                                                                    atividade.id,
                                                                ).obrigatoria
                                                            "
                                                            type="checkbox"
                                                            class="rounded border-secondary/20 bg-background text-primary focus:ring-primary/40"
                                                        />
                                                        Obrigatória
                                                    </label>
                                                </div>
                                                <div
                                                    class="md:col-span-6 flex items-end justify-end"
                                                >
                                                    <button
                                                        type="button"
                                                        @click="
                                                            $emit(
                                                                'handleCriarPerguntaAtividade',
                                                                atividade,
                                                            )
                                                        "
                                                        :disabled="
                                                            savingPerguntaId ===
                                                            `new-${atividade.id}`
                                                        "
                                                        class="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-4 rounded-md text-[10px] uppercase tracking-wider disabled:opacity-60 transition-colors shadow-lg shadow-primary/20"
                                                    >
                                                        {{
                                                            savingPerguntaId ===
                                                            `new-${atividade.id}`
                                                                ? "Salvando..."
                                                                : "Salvar pergunta"
                                                        }}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <!-- Botão adicionar atividade + formulário -->
                        <div class="pt-1 space-y-3">
                            <button
                                type="button"
                                @click="
                                    $emit(
                                        'toggleNovaAtividadeForm',
                                        !showNovaAtividadeForm,
                                    )
                                "
                                class="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-4 rounded-md text-xs uppercase tracking-wider transition-colors shadow-lg shadow-primary/20"
                            >
                                {{
                                    showNovaAtividadeForm
                                        ? "Cancelar nova atividade"
                                        : "Adicionar atividade"
                                }}
                            </button>

                            <div
                                v-if="showNovaAtividadeForm"
                                class="rounded-lg border border-white/5 bg-background/40 p-4 space-y-4"
                            >
                                <div
                                    class="grid grid-cols-1 md:grid-cols-4 gap-3"
                                >
                                    <div class="md:col-span-2">
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Nome</label
                                        >
                                        <input
                                            v-model="
                                                novaAtividade.atividade_nome
                                            "
                                            type="text"
                                            placeholder="Ex.: Masterclass"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Duração (min)</label
                                        >
                                        <input
                                            v-model.number="
                                                novaAtividade.duracao_minutos
                                            "
                                            type="number"
                                            min="0"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Ordem</label
                                        >
                                        <input
                                            v-model.number="novaAtividade.ordem"
                                            type="number"
                                            min="0"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        />
                                    </div>
                                    <div class="md:col-span-4">
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Descrição</label
                                        >
                                        <textarea
                                            v-model="novaAtividade.descricao"
                                            rows="2"
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label
                                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                            >Tem perguntas?</label
                                        >
                                        <select
                                            v-model="
                                                novaAtividade.tem_perguntas
                                            "
                                            class="w-full bg-background border border-secondary/10 rounded-md px-4 py-3 mt-1 text-sm text-white"
                                        >
                                            <option :value="false">Não</option>
                                            <option :value="true">Sim</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="flex justify-end">
                                    <button
                                        type="button"
                                        @click="$emit('handleCriarAtividade')"
                                        :disabled="criandoAtividade"
                                        class="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-4 rounded-md text-xs uppercase tracking-wider disabled:opacity-60 transition-colors shadow-lg shadow-primary/20"
                                    >
                                        {{
                                            criandoAtividade
                                                ? "Salvando..."
                                                : "Salvar atividade"
                                        }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="p-4 md:p-6 border-t border-white/5 flex justify-end gap-3 shrink-0"
                >
                    <button
                        @click="$emit('close')"
                        class="bg-background border border-secondary/10 text-secondary hover:text-white font-bold py-2.5 px-5 rounded-md text-xs uppercase tracking-wider transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        @click="$emit('save')"
                        :disabled="isUpdating"
                        class="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-5 rounded-md text-xs uppercase tracking-wider disabled:opacity-60 transition-colors shadow-lg shadow-primary/20"
                    >
                        {{ isUpdating ? "Salvando..." : "Salvar Alterações" }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
type OpcaoPergunta = {
    id?: string;
    label: string;
    ordem: number;
    ativo?: boolean;
};

type TipoResposta =
    | "texto_curto"
    | "texto_longo"
    | "sim_nao"
    | "multipla_escolha";

type PerguntaAtividade = {
    id?: string;
    pergunta: string;
    tipo_resposta: TipoResposta;
    obrigatoria: boolean;
    ordem: number;
    ativo?: boolean;
    opcoes?: OpcaoPergunta[];
    opcoesLoaded?: boolean;
};

type AtividadeEdital = {
    id: string;
    atividade_nome: string;
    duracao_minutos: number | null;
    descricao: string | null;
    tem_perguntas: boolean;
    ativo?: boolean;
    ordem: number;
    perguntas?: PerguntaAtividade[];
    perguntasLoaded?: boolean;
    expanded?: boolean;
    perguntasExpanded?: boolean;
};

type JnptaTempo = "primeiro_tempo" | "segundo_tempo";

const props = defineProps<{
    isOpen: boolean;
    editandoEdital: {
        edital_titulo: string;
        edital_descricao: string;
        arquivo_edital: string;
        ano_semestre: string;
        qual_tempo: JnptaTempo;
        dt_inicio: string;
        dt_fim: string;
        publicado: boolean;
    };
    editFile: File | null;
    editDragging: boolean;
    isUpdating: boolean;
    isDeletingEdital: string | null;
    editErrorMsg: string | null;
    getAnoSemestre: (ano?: number, offset?: number) => string;

    // Atividades
    loadingAtividades: boolean;
    savingAtividadeId: string | null;
    deletingAtividadeId: string | null;
    savingPerguntaId: string | null;
    deletingPerguntaId: string | null;
    savingOpcaoId: string | null;
    deletingOpcaoId: string | null;
    criandoAtividade: boolean;
    atividadesEdital: AtividadeEdital[];
    novaAtividade: {
        atividade_nome: string;
        duracao_minutos: number | null;
        descricao: string;
        ordem: number;
        tem_perguntas: boolean;
    };
    showNovaAtividadeForm: boolean;
    novaPerguntaPorAtividade: Record<string, PerguntaAtividade>;
    showNovaPerguntaFormPorAtividade: Record<string, boolean>;
    novaOpcaoPorPergunta: Record<string, OpcaoPergunta>;
    showNovaOpcaoFormPorPergunta: Record<string, boolean>;
}>();

const emit = defineEmits<{
    close: [];
    save: [];
    "update:editFile": [value: File | null];
    "update:editDragging": [value: boolean];

    // Ações de atividades
    toggleAtividade: [id: string];
    handleSalvarAtividade: [atividade: AtividadeEdital];
    handleExcluirAtividade: [atividade: AtividadeEdital];
    handleCriarAtividade: [];
    toggleNovaPerguntaForm: [atividadeId: string];
    toggleNovaAtividadeForm: [visible: boolean];

    // Ações de perguntas
    togglePerguntasAtividade: [id: string];
    handleSalvarPerguntaAtividade: [pergunta: PerguntaAtividade];
    handleExcluirPerguntaAtividade: [
        atividade: AtividadeEdital,
        pergunta: PerguntaAtividade,
    ];
    handleCriarPerguntaAtividade: [atividade: AtividadeEdital];

    // Ações de opções
    handleCriarOpcaoPergunta: [pergunta: PerguntaAtividade];
    handleSalvarOpcaoPergunta: [opcao: OpcaoPergunta];
    handleExcluirOpcaoPergunta: [
        pergunta: PerguntaAtividade,
        opcao: OpcaoPergunta,
    ];
    toggleNovaOpcaoForm: [perguntaId: string];

    // Upload / file handling
    handleEditDrop: [event: DragEvent];
    handleEditFileChange: [event: Event];
    removeEditFile: [];

    // Helpers
    ensureNovaOpcao: [perguntaId: string];
    ensureNovaPergunta: [atividadeId: string];
}>();

const localEditFileInput = ref<HTMLInputElement | null>(null);

const editDragging = computed({
    get: () => props.editDragging,
    set: (val: boolean) => emit("update:editDragging", val),
});

function onEditDrop(event: DragEvent) {
    emit("handleEditDrop", event);
}

function onEditFileChange(event: Event) {
    emit("handleEditFileChange", event);
}

function removeEditFile() {
    emit("removeEditFile");
}

function toggleNovaOpcaoForm(perguntaId: string) {
    emit("toggleNovaOpcaoForm", perguntaId);
}

function getNovaOpcao(perguntaId: string): OpcaoPergunta {
    return (
        props.novaOpcaoPorPergunta[perguntaId] || {
            label: "",
            ordem: 0,
        }
    );
}

function getNovaPergunta(atividadeId: string): PerguntaAtividade {
    return (
        props.novaPerguntaPorAtividade[atividadeId] || {
            pergunta: "",
            tipo_resposta: "texto_curto" as TipoResposta,
            obrigatoria: false,
            ordem: 0,
        }
    );
}
</script>
