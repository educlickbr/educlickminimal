<template>
    <div>
        <!-- ── VISTA LISTA ── -->
        <div v-if="formView === 'list'" class="flex flex-col gap-6">
            <div
                v-if="listaCtx.loading.value"
                class="py-16 flex flex-col items-center justify-center gap-3"
            >
                <div
                    class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
                />
                <span
                    class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                    >Carregando formulários...</span
                >
            </div>

            <div
                v-else-if="listaCtx.formulariosSalvos.value.length === 0"
                class="empty-state"
            >
                <div class="empty-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                    >
                        <path
                            d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160Zm40,164.69H56V40h88V88a8,8,0,0,0,8,8h48Z"
                        />
                    </svg>
                </div>
                <p class="empty-title">Nenhum formulário configurado</p>
                <p class="empty-subtitle">
                    Crie seu primeiro formulário para configurar os campos de
                    inscrição.
                </p>
                <button @click="novoFormulario" class="empty-cta mt-4">
                    Criar Primeiro Formulário
                </button>
            </div>

            <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                <div
                    v-for="(f, idx) in listaCtx.formulariosSalvos.value"
                    :key="idx"
                    class="form-card group"
                    @click="abrirFormulario(f)"
                >
                    <div class="form-card-accent" />
                    <div class="form-card-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                        >
                            <path
                                d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160Zm40,164.69H56V40h88V88a8,8,0,0,0,8,8h48ZM136,136a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h32A8,8,0,0,1,136,136Zm32,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z"
                            />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-black text-white truncate">
                            {{ f.contexto_nome || "Sem nome" }}
                        </p>
                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                            <span class="form-badge form-badge--scope">{{
                                f.contexto_tipo === "area" ? "Área" : "Programa"
                            }}</span>
                            <span class="form-badge form-badge--proc">{{
                                labelTipoProc[f.tipo_proc] || f.tipo_proc
                            }}</span>
                            <span class="form-badge form-badge--cand">{{
                                labelTipoCand[f.tipo_cand] || f.tipo_cand
                            }}</span>
                        </div>
                        <p
                            class="text-[9px] text-secondary/40 mt-2 font-semibold"
                        >
                            {{ f.total_campos }} campo{{
                                f.total_campos !== 1 ? "s" : ""
                            }}
                        </p>
                    </div>
                    <div
                        class="form-card-arrow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                        >
                            <path
                                d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── VISTA BUILDER ── -->
        <div v-else>
            <div class="form-breadcrumb mb-5">
                <button @click="voltarParaLista" class="form-breadcrumb-back">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                    >
                        <path
                            d="M228,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-16.97,16.98l-72-72a12,12,0,0,1,0-16.98l72-72a12,12,0,0,1,16.97,16.98L69,116H216A12,12,0,0,1,228,128Z"
                        />
                    </svg>
                    Formulários
                </button>
                <span class="form-breadcrumb-sep">/</span>
                <span class="text-xs font-bold text-primary/80"
                    >Novo Formulário</span
                >
            </div>

            <div class="builder-layout">
                <!-- Sidebar -->
                <div class="builder-sidebar">
                    <h4
                        class="text-xs font-black uppercase tracking-widest text-primary/90 mb-4"
                    >
                        Banco de Perguntas
                    </h4>
                    <div
                        class="text-[10px] text-secondary/50 mb-4 font-semibold pb-4 border-b border-white/5"
                    >
                        Arraste os campos abaixo para o quadro ao lado.
                    </div>
                    <div
                        class="flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[70vh] pr-2 pb-2"
                    >
                        <div
                            v-for="p in perguntasCtx.perguntas.value"
                            :key="p.id"
                            class="draggable-field"
                            draggable="true"
                            @dragstart="builderCtx.onDragStart($event, p.id)"
                        >
                            <div class="opacity-50">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    viewBox="0 0 256 256"
                                >
                                    <path
                                        d="M104,64A16,16,0,1,1,88,48,16,16,0,0,1,104,64Zm56-16a16,16,0,1,0,16,16A16,16,0,0,0,160,48ZM88,112a16,16,0,1,0,16,16A16,16,0,0,0,88,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,160,112ZM88,184a16,16,0,1,0,16,16A16,16,0,0,0,88,184Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,160,184Z"
                                    />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-0.5">
                                    <p
                                        class="text-xs font-bold text-white truncate"
                                    >
                                        {{ p.label }}
                                    </p>
                                    <span
                                        v-if="p.global"
                                        class="flex-shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                        >Global</span
                                    >
                                </div>
                                <p
                                    class="text-[9px] text-primary font-medium uppercase tracking-wider"
                                >
                                    {{
                                        core.getTipoPerguntaLabel(
                                            p.tipo_pergunta,
                                        )
                                    }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main -->
                <div class="builder-main">
                    <div
                        class="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-5 mb-6"
                    >
                        <div class="flex items-center justify-between mb-4">
                            <h4
                                class="text-[11px] font-black uppercase tracking-widest text-primary m-0 flex items-center gap-2"
                            >
                                Destino do Formulário
                            </h4>
                            <button
                                @click="builderCtx.saveFormConfig"
                                :disabled="builderCtx.savingBuilder.value"
                                class="px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] border border-[rgba(139,92,246,0.4)] text-white text-[11px] font-black uppercase tracking-widest hover:from-[#6d28d9] hover:to-[#7c3aed] hover:shadow-lg hover:shadow-[rgba(139,92,246,0.45)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            >
                                {{
                                    builderCtx.savingBuilder.value
                                        ? "Salvando..."
                                        : "Salvar Layout"
                                }}
                            </button>
                        </div>
                        <div class="flex flex-wrap gap-6 items-end">
                            <div class="flex-1 min-w-[200px]">
                                <label
                                    class="block text-[10px] font-bold text-secondary/60 mb-1.5 uppercase"
                                    >Atrelar ao escopo:</label
                                >
                                <select
                                    v-model="builderCtx.contextType.value"
                                    class="w-full text-sm p-2.5 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white"
                                >
                                    <option value="area">
                                        Área Generalista
                                    </option>
                                    <option value="programa">
                                        Programa Específico
                                    </option>
                                </select>
                            </div>
                            <div class="flex-1 min-w-[200px]">
                                <label
                                    class="block text-[10px] font-bold text-secondary/60 mb-1.5 uppercase"
                                    >Selecione:</label
                                >
                                <select
                                    v-model="builderCtx.selectedContextId.value"
                                    class="w-full text-sm p-2.5 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white"
                                >
                                    <option value="" disabled>
                                        Selecione...
                                    </option>
                                    <template
                                        v-if="
                                            builderCtx.contextType.value ===
                                            'area'
                                        "
                                    >
                                        <option
                                            v-for="a in listaCtx.areas.value"
                                            :key="a.id"
                                            :value="a.id"
                                        >
                                            {{ a.nome_area }}
                                        </option>
                                    </template>
                                    <template v-else>
                                        <option
                                            v-for="p in listaCtx.programas
                                                .value"
                                            :key="p.id"
                                            :value="p.id"
                                        >
                                            {{ p.descricao }}
                                        </option>
                                    </template>
                                </select>
                            </div>
                            <div class="flex-1 min-w-[200px]">
                                <label
                                    class="block text-[10px] font-bold text-secondary/60 mb-1.5 uppercase"
                                    >Tipo de Processo:</label
                                >
                                <select
                                    v-model="builderCtx.selectedTipoProc.value"
                                    class="w-full text-sm p-2.5 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white"
                                >
                                    <option value="matricula">Matrícula</option>
                                    <option value="seletivo">
                                        Processo Seletivo
                                    </option>
                                </select>
                            </div>
                            <div class="flex-1 min-w-[200px]">
                                <label
                                    class="block text-[10px] font-bold text-secondary/60 mb-1.5 uppercase"
                                    >Tipo de Candidato:</label
                                >
                                <select
                                    v-model="builderCtx.selectedTipoCand.value"
                                    class="w-full text-sm p-2.5 rounded-lg bg-[var(--field-bg)] border border-[var(--field-border)] text-white"
                                >
                                    <option value="estudante">Estudante</option>
                                    <option value="docente">Docente</option>
                                    <option value="externo">Externo</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Blocos tabs -->
                    <div
                        class="flex gap-4 mb-4 overflow-x-auto pb-2 scrollbar-hide items-center"
                    >
                        <button
                            v-for="(bloco, idx) in builderCtx.builderBlocos
                                .value"
                            :key="idx"
                            @click="
                                builderCtx.activeBuilderBlocoIndex.value = idx
                            "
                            class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border flex items-center gap-3"
                            :class="
                                builderCtx.activeBuilderBlocoIndex.value === idx
                                    ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white'
                                    : 'bg-white/5 border-white/5 text-secondary hover:text-white'
                            "
                        >
                            {{ bloco }}
                            <span
                                v-if="
                                    builderCtx.activeBuilderBlocoIndex.value ===
                                        idx &&
                                    builderCtx.builderBlocos.value.length > 1
                                "
                                @click.stop="builderCtx.removerBlocoAtual"
                                class="hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity"
                                title="Remover Bloco"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    fill="currentColor"
                                    viewBox="0 0 256 256"
                                >
                                    <path
                                        d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66a8,8,0,0,1,11.32-11.32L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"
                                    />
                                </svg>
                            </span>
                        </button>
                        <button
                            @click="builderCtx.abrirModalNovoBloco"
                            class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                            >
                                <path
                                    d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"
                                />
                            </svg>
                            Novo Bloco
                        </button>
                    </div>

                    <!-- Canvas -->
                    <div
                        class="canvas-grid"
                        @dragover.prevent=""
                        @drop="builderCtx.onDrop"
                        :class="{
                            'canvas-empty':
                                builderCtx.builderItems.value.length === 0,
                        }"
                    >
                        <div
                            v-if="builderCtx.loadingBuilder.value"
                            class="col-span-full flex justify-center py-10 opacity-50"
                        >
                            Carregando...
                        </div>

                        <template
                            v-if="
                                builderCtx.activeBuilderBlocoIndex.value === 0
                            "
                        >
                            <div
                                v-for="(base, bidx) in baseItems"
                                :key="'base-' + bidx"
                                class="canvas-item locked"
                                style="grid-column: span 2 / span 2"
                            >
                                <div class="canvas-item-inner">
                                    <div class="flex-1 min-w-0">
                                        <div
                                            class="text-[10px] uppercase font-black text-white/50 tracking-wider mb-1 flex items-center gap-2"
                                        >
                                            {{ base.label }}
                                            <span
                                                class="bg-white/5 text-white/40 border border-white/10 px-1.5 py-0.5 rounded flex items-center gap-1 text-[8px]"
                                                >🔒 Fixo</span
                                            >
                                        </div>
                                        <div
                                            class="h-8 rounded bg-white/5 border border-white/5 w-full flex items-center px-3 text-xs text-white/30 truncate"
                                        >
                                            Padrão do sistema
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template
                            v-for="(item, idx) in builderCtx.currentBlocoItems
                                .value"
                            :key="idx"
                        >
                            <div
                                class="canvas-item group"
                                :class="{
                                    'canvas-item--drag-top':
                                        builderCtx.dragOverCanvasIndex.value ===
                                            idx &&
                                        builderCtx.dragOverZone.value === 'top',
                                    'canvas-item--drag-bottom':
                                        builderCtx.dragOverCanvasIndex.value ===
                                            idx &&
                                        builderCtx.dragOverZone.value ===
                                            'bottom',
                                    'canvas-item--drag-over':
                                        builderCtx.dragOverCanvasIndex.value ===
                                            idx &&
                                        builderCtx.dragOverZone.value ===
                                            'over',
                                    'canvas-item--split-left':
                                        builderCtx.dragOverCanvasIndex.value ===
                                            idx &&
                                        builderCtx.dragOverZone.value ===
                                            'split-left',
                                    'canvas-item--split-right':
                                        builderCtx.dragOverCanvasIndex.value ===
                                            idx &&
                                        builderCtx.dragOverZone.value ===
                                            'split-right',
                                }"
                                :style="{
                                    gridColumn:
                                        item.largura === '2'
                                            ? 'span 2 / span 2'
                                            : 'span 1 / span 1',
                                }"
                                draggable="true"
                                @dragstart="
                                    builderCtx.onCanvasDragStart($event, idx)
                                "
                                @dragover="
                                    builderCtx.onCanvasDragOver($event, idx)
                                "
                                @dragleave="builderCtx.onCanvasDragLeave"
                                @drop.stop="
                                    builderCtx.onCanvasItemDrop($event, idx)
                                "
                            >
                                <div class="canvas-item-inner">
                                    <div
                                        class="drag-handle opacity-0 group-hover:opacity-40 mr-3 flex-shrink-0 cursor-grab"
                                        title="Arraste para reordenar"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            viewBox="0 0 256 256"
                                        >
                                            <path
                                                d="M104,64A16,16,0,1,1,88,48,16,16,0,0,1,104,64Zm56-16a16,16,0,1,0,16,16A16,16,0,0,0,160,48ZM88,112a16,16,0,1,0,16,16A16,16,0,0,0,88,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,160,112ZM88,184a16,16,0,1,0,16,16A16,16,0,0,0,88,184Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,160,184Z"
                                            />
                                        </svg>
                                    </div>
                                    <div class="flex-1 mr-4 min-w-0">
                                        <div
                                            class="text-[10px] uppercase font-black text-primary/80 tracking-wider mb-1 flex items-center gap-2"
                                        >
                                            {{ item.label }}
                                            <span
                                                class="bg-primary/20 px-1.5 py-0.5 rounded text-[8px]"
                                                >{{
                                                    core.getTipoPerguntaLabel(
                                                        item.tipo_pergunta,
                                                    )
                                                }}</span
                                            >
                                            <!-- Obrigatório badge -->
                                            <span
                                                v-if="item.obrigatorio"
                                                class="text-amber-400 text-[8px] font-black"
                                                title="Campo obrigatório"
                                                >*</span
                                            >
                                        </div>
                                        <div
                                            class="h-8 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] w-full flex items-center px-3 text-xs text-white/30 truncate"
                                        >
                                            {{
                                                item.placeholder ||
                                                "Preencha aqui..."
                                            }}
                                        </div>
                                    </div>
                                    <div
                                        class="flex flex-col items-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <div class="canvas-actions">
                                            <button
                                                type="button"
                                                @click.prevent.stop="
                                                    builderCtx.toggleObrigatorio(
                                                        idx,
                                                    )
                                                "
                                                class="action-btn"
                                                :class="
                                                    item.obrigatorio
                                                        ? 'text-amber-400'
                                                        : ''
                                                "
                                                title="Obrigatório"
                                            >
                                                *
                                            </button>
                                            <button
                                                type="button"
                                                @click.prevent.stop="
                                                    builderCtx.toggleLargura(
                                                        idx,
                                                    )
                                                "
                                                class="action-btn action-sizing"
                                                title="Alternar largura"
                                            >
                                                ⬌
                                            </button>
                                            <button
                                                @click="
                                                    builderCtx.removeBuilderItem(
                                                        idx,
                                                    )
                                                "
                                                class="action-btn action-remove"
                                                title="Remover"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                        <div
                                            v-if="
                                                builderCtx.builderBlocos.value
                                                    .length > 1
                                            "
                                            class="relative w-20"
                                            title="Mudar bloco"
                                        >
                                            <select
                                                @change="
                                                    builderCtx.mudarBlocoItem(
                                                        idx,
                                                        $event,
                                                    )
                                                "
                                                class="w-full h-5 rounded bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-widest text-primary/80 pl-1.5 pr-4 appearance-none cursor-pointer"
                                            >
                                                <option
                                                    value=""
                                                    disabled
                                                    selected
                                                >
                                                    Bloco...
                                                </option>
                                                <option
                                                    v-for="b in builderCtx.builderBlocos.value.filter(
                                                        (bl) =>
                                                            bl !==
                                                            builderCtx
                                                                .currentBloco
                                                                .value,
                                                    )"
                                                    :key="b"
                                                    :value="b"
                                                >
                                                    {{ b }}
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                v-if="builderCtx.isOrphaned(idx)"
                                class="drop-slot"
                                :class="{
                                    'drop-slot--active':
                                        builderCtx.dragOverSlotIdx.value ===
                                        idx,
                                }"
                                @dragover="
                                    builderCtx.onSlotDragOver($event, idx)
                                "
                                @dragleave="builderCtx.onSlotDragLeave"
                                @drop.stop="builderCtx.onSlotDrop($event, idx)"
                            >
                                <span
                                    class="text-[10px] font-black uppercase tracking-widest"
                                    >Soltar aqui</span
                                >
                            </div>
                        </template>

                        <div
                            v-if="builderCtx.builderItems.value.length === 0"
                            style="grid-column: span 2 / span 2"
                            class="py-10 flex text-center flex-col items-center justify-center border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl bg-white/5"
                        >
                            <span
                                class="text-[11px] font-bold text-white/50 uppercase tracking-widest"
                                >Arraste os campos para cá</span
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Novo Bloco -->
            <div
                v-if="builderCtx.showModalBloco.value"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
                <div
                    class="bg-background border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
                >
                    <div class="p-6">
                        <h3
                            class="text-lg font-black text-white mb-2 tracking-tight"
                        >
                            Novo Bloco
                        </h3>
                        <p class="text-xs text-secondary/60 mb-6 font-semibold">
                            Agrupe perguntas em seções lógicas.
                        </p>
                        <input
                            v-model="builderCtx.novoBlocoNome.value"
                            placeholder="Ex: Dados Pessoais"
                            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 text-white"
                            @keyup.enter="builderCtx.confirmarNovoBloco"
                        />
                        <div class="flex items-center gap-3">
                            <button
                                @click="builderCtx.showModalBloco.value = false"
                                class="flex-1 px-4 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                @click="builderCtx.confirmarNovoBloco"
                                class="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest"
                            >
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
    useFormulariosLista,
    labelTipoProc,
    labelTipoCand,
} from "~/composables/formularios/useFormulariosLista";
import { useFormulariosBuilder } from "~/composables/formularios/useFormulariosBuilder";
import { useFormulariosCore } from "~/composables/formularios/useFormulariosCore";
import { useToast } from "~/composables/useToast";
import type { Pergunta } from "~/composables/formularios/useFormulariosPerguntas";
import type { Ref } from "vue";

const props = defineProps<{
    perguntasCtx: { perguntas: Ref<Pergunta[]> };
    idEntidade: string | null;
}>();

const emit = defineEmits<{ (e: "dataChanged"): void }>();

const formView = ref<"list" | "builder">("list");
const toast = useToast();
const core = useFormulariosCore();

const listaCtx = useFormulariosLista({
    garantirEntidade: core.garantirEntidade,
});
const builderCtx = useFormulariosBuilder({
    getEntidadeAtivaId: core.getEntidadeAtivaId,
    garantirEntidade: core.garantirEntidade,
    perguntas: props.perguntasCtx.perguntas,
    toast,
    fetchFormulariosSalvos: listaCtx.fetchFormulariosSalvos,
});

const baseItems = [
    {
        label: "Nome Completo",
        tipo_pergunta: "text",
        largura: "2",
        isLocked: true,
    },
    { label: "E-mail", tipo_pergunta: "email", largura: "2", isLocked: true },
];

function novoFormulario() {
    builderCtx.novoFormulario();
    formView.value = "builder";
}

function abrirFormulario(f: any) {
    builderCtx.abrirFormulario(
        f,
        listaCtx.areas.value,
        listaCtx.programas.value,
    );
    formView.value = "builder";
}

function voltarParaLista() {
    formView.value = "list";
    listaCtx.fetchFormulariosSalvos();
}

defineExpose({
    init: async () => {
        await listaCtx.fetchContexts();
        await listaCtx.fetchFormulariosSalvos();
    },
});
</script>

<style scoped>
.builder-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 1.5rem;
    align-items: start;
}
.builder-sidebar {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1rem;
    padding: 1.25rem;
}
.draggable-field {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.625rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    cursor: grab;
    transition: all 0.15s;
}
.draggable-field:hover {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.2);
}
.builder-main {
    min-width: 0;
}
.canvas-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}
.canvas-item {
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.15s;
}
.canvas-item:hover {
    background: rgba(255, 255, 255, 0.04);
}
.canvas-item.locked {
    opacity: 0.5;
    pointer-events: none;
}
.canvas-item-inner {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
}
.canvas-actions {
    display: flex;
    gap: 0.25rem;
}
.action-btn {
    padding: 0.25rem 0.375rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    background: none;
    color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    font-size: 11px;
}
.action-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}
.action-remove:hover {
    color: #ef4444;
}
.drop-slot {
    padding: 1rem;
    border: 2px dashed rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}
.drop-slot--active {
    border-color: rgba(139, 92, 246, 0.5);
    background: rgba(139, 92, 246, 0.05);
    color: #a78bfa;
}
.canvas-item--drag-top {
    border-top: 2px solid #a78bfa;
}
.canvas-item--drag-bottom {
    border-bottom: 2px solid #a78bfa;
}
.canvas-item--drag-over {
    border-color: #a78bfa;
}
.canvas-item--split-left::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #a78bfa;
    border-radius: 3px 0 0 3px;
}
.canvas-item--split-right::after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #a78bfa;
    border-radius: 0 3px 3px 0;
}
.form-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
}
.form-card:hover {
    background: rgba(139, 92, 246, 0.06);
    border-color: rgba(139, 92, 246, 0.15);
    transform: translateY(-1px);
}
.form-card-accent {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #a78bfa, transparent);
    opacity: 0;
    transition: opacity 0.3s;
}
.form-card:hover .form-card-accent {
    opacity: 1;
}
.form-card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.625rem;
    background: rgba(139, 92, 246, 0.08);
    color: #a78bfa;
    flex-shrink: 0;
}
.form-badge {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
}
.form-badge--scope {
    background: rgba(59, 130, 246, 0.12);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.2);
}
.form-badge--proc {
    background: rgba(16, 185, 129, 0.12);
    color: #6ee7b7;
    border: 1px solid rgba(16, 185, 129, 0.2);
}
.form-badge--cand {
    background: rgba(245, 158, 11, 0.12);
    color: #fcd34d;
    border: 1px solid rgba(245, 158, 11, 0.2);
}
.form-breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.form-breadcrumb-back {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.4);
    background: none;
    border: none;
    cursor: pointer;
}
.form-breadcrumb-back:hover {
    color: #a78bfa;
}
.form-breadcrumb-sep {
    color: rgba(255, 255, 255, 0.2);
}
.empty-state,
.empty-icon,
.empty-title,
.empty-subtitle,
.empty-cta {
    text-align: center;
}
.empty-title {
    font-size: 1rem;
    font-weight: 800;
    color: white;
    margin: 0.5rem 0 0.25rem;
}
.empty-subtitle {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
}
.empty-cta {
    padding: 0.5rem 1.25rem;
    border-radius: 0.625rem;
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    margin-top: 1rem;
}
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
