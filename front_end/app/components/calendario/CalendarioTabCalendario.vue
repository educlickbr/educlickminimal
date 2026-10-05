<template>
    <div class="flex flex-col gap-6">
        <!-- Program selector -->
        <div class="flex flex-col md:flex-row md:items-center gap-4">
            <div class="flex-1 flex flex-col gap-1.5">
                <label
                    class="text-[10px] font-black text-secondary/60 uppercase tracking-[0.18em]"
                    >Oferta / Programa</label
                >
                <BaseSelect
                    v-model="ctx.selectedProgramaId.value"
                    :options="programasSelectOptions"
                    labelKey="label"
                    valueKey="value"
                    :searchable="true"
                    searchPlaceholder="Pesquisar programa ou oferta..."
                    placeholder="— Selecione um Programa / Oferta —"
                    @update:modelValue="ctx.onProgramaChange"
                />
            </div>
            <div
                v-if="ctx.selectedProgramaId.value"
                class="flex items-center gap-3 shrink-0"
            >
                <button
                    @click="ctx.goToToday"
                    class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-div-15 border border-divider text-secondary hover:text-text hover:bg-div-30 transition-all"
                >
                    Hoje
                </button>
                <div
                    class="flex items-center p-1 bg-div-15 rounded-lg border border-divider"
                >
                    <button
                        @click="ctx.viewMode.value = 'mensal'"
                        class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                        :class="
                            ctx.viewMode.value === 'mensal'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-secondary/60 hover:text-text'
                        "
                    >
                        Mensal
                    </button>
                    <button
                        @click="ctx.viewMode.value = 'semanal'"
                        class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                        :class="
                            ctx.viewMode.value === 'semanal'
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-secondary/60 hover:text-text'
                        "
                    >
                        Semanal
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div
            v-if="ctx.loadingProgramas.value"
            class="py-12 flex flex-col items-center justify-center gap-3"
        >
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest"
                >Carregando programas...</span
            >
        </div>
        <div
            v-else-if="ctx.programas.value.length === 0"
            class="empty-state mt-4"
        >
            <Icon
                name="ph:folder-simple-dashed-duotone"
                class="w-10 h-10 text-secondary/30"
            />
            <p class="text-sm font-bold text-secondary/60 mt-2">
                Nenhum programa encontrado
            </p>
            <p class="text-xs text-secondary/40">
                Vá para a aba de Ofertas para criar seu primeiro programa.
            </p>
        </div>
        <div v-else-if="!ctx.selectedProgramaId.value" class="empty-state mt-4">
            <Icon
                name="ph:calendar-dots-duotone"
                class="w-10 h-10 text-primary/50"
            />
            <p class="text-sm font-bold text-secondary/60 mt-2">
                Selecione um programa acima
            </p>
            <p class="text-xs text-secondary/40">
                O calendário consolidado de aulas será exibido aqui.
            </p>
        </div>
        <div
            v-else-if="ctx.loading.value"
            class="py-12 flex flex-col items-center justify-center gap-3"
        >
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/50 uppercase tracking-widest"
                >Carregando calendário...</span
            >
        </div>
        <div
            v-else-if="ctx.calendarEvents.value.length === 0"
            class="empty-state mt-4"
        >
            <Icon
                name="ph:calendar-blank-duotone"
                class="w-10 h-10 text-secondary/30"
            />
            <p class="text-sm font-bold text-secondary/60 mt-2">
                Nenhum encontro agendado
            </p>
            <p class="text-xs text-secondary/40">
                Este programa ainda não tem ciclos com calendário gerado.
            </p>
        </div>

        <!-- MENSAL -->
        <div v-else-if="ctx.viewMode.value === 'mensal'" class="w-full">
            <div class="flex items-center justify-between mb-4">
                <button
                    @click="ctx.prevMonth()"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-div-15 border border-divider hover:bg-div-30 text-secondary hover:text-text transition-all"
                >
                    <Icon name="ph:caret-left-bold" class="w-4 h-4" />
                </button>
                <h3
                    class="text-sm font-black text-text uppercase tracking-widest"
                >
                    {{ ctx.calMonthLabel.value }}
                </h3>
                <button
                    @click="ctx.nextMonth()"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-div-15 border border-divider hover:bg-div-30 text-secondary hover:text-text transition-all"
                >
                    <Icon name="ph:caret-right-bold" class="w-4 h-4" />
                </button>
            </div>
            <div class="rounded-xl border border-divider">
                <div
                    class="grid grid-cols-7 bg-div-15 border-b border-divider rounded-t-xl overflow-hidden"
                >
                    <div
                        v-for="d in ctx.CAL_DAYS"
                        :key="d"
                        class="py-2 text-center"
                    >
                        <span
                            class="text-[9px] font-black text-secondary/60 uppercase tracking-[0.18em]"
                            >{{ d }}</span
                        >
                    </div>
                </div>
                <div
                    v-for="(week, wi) in ctx.calMonthGrid.value"
                    :key="wi"
                    class="grid grid-cols-7 relative hover:z-30"
                    :class="
                        Number(wi) < ctx.calMonthGrid.value.length - 1
                            ? 'border-b border-divider'
                            : ''
                    "
                >
                    <div
                        v-for="cell in week"
                        :key="cell.dateStr"
                        class="min-h-[110px] p-2 border-r border-divider last:border-r-0 flex flex-col gap-1 transition-colors relative hover:z-40"
                        :class="[
                            !cell.isCurrentMonth ? 'opacity-40' : '',
                            cell.isToday ? 'bg-primary/5' : '',
                            ctx.dragTargetDate.value === cell.dateStr &&
                            ctx.draggingItem.value
                                ? (
                                      ctx.eventsMap.value[cell.dateStr] || []
                                  ).some((e: any) => e._tipo === 'feriado')
                                    ? 'ring-2 ring-inset ring-red-500/30 bg-red-500/5'
                                    : 'ring-2 ring-inset ring-primary/30 bg-primary/8'
                                : '',
                        ]"
                        @dragover.prevent="
                            ctx.dragTargetDate.value = cell.dateStr
                        "
                        @dragleave="ctx.dragTargetDate.value = null"
                        @drop.prevent="ctx.onDrop(cell.dateStr)"
                    >
                        <div class="flex justify-end mb-1">
                            <span
                                class="w-6 h-6 flex items-center justify-center rounded text-xs font-bold leading-none"
                                :class="
                                    cell.isToday
                                        ? 'bg-primary text-white'
                                        : 'text-text'
                                "
                                >{{ cell.day }}</span
                            >
                        </div>
                        <template v-for="item in cell.events" :key="item.id">
                            <div
                                v-if="item._tipo === 'aula'"
                                draggable="true"
                                @dragstart="ctx.onDragStart(item)"
                                @dragend="ctx.onDragEnd"
                                @click="ctx.openAulaModal(item)"
                                class="group relative rounded-lg flex flex-col cursor-pointer select-none transition-all duration-150 hover:shadow-md hover:scale-[1.015] hover:z-50"
                                :class="[
                                    ctx.draggingItem.value?.id === item.id ? 'opacity-40 scale-95' : '',
                                    item.status === 'cancelada'
                                        ? 'bg-secondary/8 border border-dashed border-divider hover:ring-1 hover:ring-secondary/20'
                                        : item.status === 'reagendada'
                                          ? 'bg-emerald-500/10 border border-emerald-500/20 hover:ring-1 hover:ring-emerald-500/40'
                                          : 'bg-primary/10 border border-primary/20 hover:ring-1 hover:ring-primary/40',
                                ]"
                            >
                                <!-- Barra lateral de status -->
                                <div class="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
                                    :class="item.status === 'cancelada' ? 'bg-secondary/30' : item.status === 'reagendada' ? 'bg-emerald-500' : 'bg-primary'"
                                ></div>

                                <div class="pl-3 pr-2 pt-1.5 pb-1.5 flex flex-col gap-0.5 overflow-hidden">
                                    <!-- Horário + badges -->
                                    <div class="flex items-center justify-between gap-1">
                                        <div class="flex items-center gap-1">
                                            <svg class="w-2.5 h-2.5 flex-shrink-0" :class="item.status === 'cancelada' ? 'text-secondary/40' : item.status === 'reagendada' ? 'text-emerald-500/70' : 'text-primary/60'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            <span class="text-[10px] font-black tabular-nums leading-none"
                                                :class="item.status === 'cancelada' ? 'text-secondary/50 line-through' : item.status === 'reagendada' ? 'text-emerald-500' : 'text-primary'"
                                            >{{ item.hora_ini }}–{{ item.hora_fim }}</span>
                                        </div>
                                        <div class="flex items-center gap-0.5">
                                            <span v-if="item.sub_turma" class="px-1 py-0.5 rounded bg-primary/20 text-[7px] font-black text-primary border border-primary/30 leading-none">T.{{ item.sub_turma }}</span>
                                            <span v-if="item.status === 'cancelada'" class="px-1 py-0.5 rounded bg-secondary/15 text-[7px] font-black uppercase text-secondary/60 tracking-wider leading-none">Canc.</span>
                                            <span v-if="item.status === 'reagendada'" class="px-1 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[7px] font-black uppercase text-emerald-600 tracking-wider leading-none">Rep.</span>
                                        </div>
                                    </div>

                                    <!-- Componente / Ciclo -->
                                    <p class="text-[10px] font-bold leading-tight line-clamp-2"
                                        :class="item.status === 'cancelada' ? 'text-secondary/50 line-through' : 'text-text'"
                                    >{{ item.nome_componente || item.ciclo_desc }}</p>

                                    <!-- Docente -->
                                    <div v-if="item.nome_docente" class="flex items-center gap-1 mt-0.5">
                                        <svg class="w-2.5 h-2.5 flex-shrink-0 text-secondary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        <span class="text-[9px] font-semibold text-secondary/60 truncate">{{ item.nome_docente }}</span>
                                    </div>
                                </div>

                                <!-- Popover Flutuante no Hover (Inteligente: abre para baixo na 1ª semana, para cima nas demais) -->
                                <div
                                    class="pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out absolute z-[100] left-1/2 -translate-x-1/2 w-64 p-3 bg-[#161622] border border-primary/30 rounded-xl shadow-2xl backdrop-blur-xl flex flex-col gap-2 text-xs text-text"
                                    :class="Number(wi) === 0 ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]'"
                                >
                                    <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
                                        <span class="font-black text-primary text-[11px] tabular-nums tracking-wide flex items-center gap-1">
                                            <svg class="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            {{ item.hora_ini }} – {{ item.hora_fim }}
                                        </span>
                                        <span
                                            class="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider"
                                            :class="item.status === 'cancelada' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : item.status === 'reagendada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary/20 text-primary border border-primary/30'"
                                        >
                                            {{ item.status }}
                                        </span>
                                    </div>

                                    <div class="flex flex-col gap-0.5">
                                        <span class="text-[8px] font-black text-secondary/60 uppercase tracking-widest">Componente</span>
                                        <p class="font-bold text-text text-[11px] leading-snug">{{ item.nome_componente || item.ciclo_desc }}</p>
                                    </div>

                                    <div v-if="item.nome_docente" class="flex flex-col gap-0.5">
                                        <span class="text-[8px] font-black text-secondary/60 uppercase tracking-widest">Professor</span>
                                        <p class="text-[10px] font-semibold text-secondary flex items-center gap-1">
                                            <svg class="w-3 h-3 text-secondary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                            {{ item.nome_docente }}
                                            <span v-if="item.is_docente_override" class="text-amber-400 font-bold text-[8px] bg-amber-500/10 px-1 rounded border border-amber-500/20">(Substituto)</span>
                                        </p>
                                    </div>

                                    <div v-if="item.sub_turma" class="flex items-center gap-1 text-[10px] font-bold text-primary">
                                        <span>Turma {{ item.sub_turma }}</span>
                                    </div>

                                    <div v-if="item.observacao" class="flex flex-col gap-0.5 border-t border-white/5 pt-1">
                                        <span class="text-[8px] font-black text-secondary/60 uppercase tracking-widest">Plano / Obs</span>
                                        <p class="text-[9px] italic text-secondary/80 line-clamp-2">"{{ item.observacao }}"</p>
                                    </div>

                                    <div class="mt-0.5 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] font-black uppercase text-primary/70 tracking-wider">
                                        <span>💡 Clique para editar</span>
                                        <span v-if="item.status === 'reagendada'" class="text-emerald-400">Reposição</span>
                                    </div>
                                </div>
                            </div>
                            <div v-else-if="item._tipo === 'feriado'" class="relative rounded-lg overflow-hidden bg-red-500/10 border border-red-500/20 pl-3 pr-2 py-1.5">
                                <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 rounded-l-lg"></div>
                                <div class="flex items-center gap-1">
                                    <svg class="w-2.5 h-2.5 flex-shrink-0 text-red-500/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    <p class="text-[9px] font-black text-red-500 leading-tight truncate">{{ item.nome }}</p>
                                </div>
                            </div>
                            <div v-else-if="item._tipo === 'evento'" class="relative rounded-lg overflow-hidden bg-amber-500/10 border border-amber-500/20 pl-3 pr-2 py-1.5">
                                <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-lg"></div>
                                <div class="flex items-center gap-1">
                                    <svg class="w-2.5 h-2.5 flex-shrink-0 text-amber-500/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <p class="text-[9px] font-black text-amber-500 leading-tight truncate">{{ item.nome_evento }}</p>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <!-- SEMANAL -->
        <div v-else class="w-full">
            <div class="flex items-center justify-between mb-4">
                <button
                    @click="ctx.prevWeek()"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-div-15 border border-divider hover:bg-div-30 text-secondary hover:text-text transition-all"
                >
                    <Icon name="ph:caret-left-bold" class="w-4 h-4" />
                </button>
                <h3
                    class="text-sm font-black text-text uppercase tracking-widest"
                >
                    {{ ctx.calWeekLabel.value }}
                </h3>
                <button
                    @click="ctx.nextWeek()"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-div-15 border border-divider hover:bg-div-30 text-secondary hover:text-text transition-all"
                >
                    <Icon name="ph:caret-right-bold" class="w-4 h-4" />
                </button>
            </div>
            <div class="rounded-xl border border-divider overflow-hidden">
                <div
                    class="grid grid-cols-7 bg-div-15 border-b border-divider"
                >
                    <div
                        v-for="day in ctx.calWeekDays.value"
                        :key="day.dateStr"
                        class="py-3 text-center border-r border-divider last:border-r-0"
                        :class="day.isToday ? 'bg-primary/10' : ''"
                    >
                        <p
                            class="text-[9px] font-black uppercase tracking-[0.18em]"
                            :class="
                                day.isToday
                                    ? 'text-primary'
                                    : 'text-secondary/60'
                            "
                        >
                            {{ day.label }}
                        </p>
                        <span
                            class="mt-1 mx-auto flex items-center justify-center w-6 h-6 rounded text-sm font-black"
                            :class="
                                day.isToday
                                    ? 'bg-primary text-white'
                                    : 'text-text'
                            "
                            >{{ day.dayNum }}</span
                        >
                    </div>
                </div>
                <div class="grid grid-cols-7">
                    <div
                        v-for="day in ctx.calWeekDays.value"
                        :key="day.dateStr + '_events'"
                        class="min-h-[250px] p-2 flex flex-col gap-2 border-r border-divider last:border-r-0 transition-colors relative hover:z-40"
                        :class="[
                            day.isToday ? 'bg-primary/5' : '',
                            ctx.dragTargetDate.value === day.dateStr &&
                            ctx.draggingItem.value
                                ? (ctx.eventsMap.value[day.dateStr] || []).some(
                                      (e: any) => e._tipo === 'feriado',
                                  )
                                    ? 'ring-2 ring-inset ring-red-500/30 bg-red-500/5'
                                    : 'ring-2 ring-inset ring-primary/30 bg-primary/8'
                                : '',
                        ]"
                        @dragover.prevent="
                            ctx.dragTargetDate.value = day.dateStr
                        "
                        @dragleave="ctx.dragTargetDate.value = null"
                        @drop.prevent="ctx.onDrop(day.dateStr)"
                    >
                        <div
                            v-if="day.events.length === 0"
                            class="flex-1 flex items-center justify-center"
                        >
                            <span class="text-[9px] text-secondary/30 font-bold"
                                >—</span
                            >
                        </div>
                        <template v-for="(item, idx) in day.events" :key="item.id">
                            <div
                                v-if="item._tipo === 'aula'"
                                draggable="true"
                                @dragstart="ctx.onDragStart(item)"
                                @dragend="ctx.onDragEnd"
                                @click="ctx.openAulaModal(item)"
                                class="group relative rounded-lg flex flex-col cursor-pointer select-none transition-all duration-150 hover:shadow-md hover:scale-[1.01] hover:z-50"
                                :class="[
                                    ctx.draggingItem.value?.id === item.id ? 'opacity-40 scale-95' : '',
                                    item.status === 'cancelada'
                                        ? 'bg-secondary/8 border border-dashed border-divider hover:ring-1 hover:ring-secondary/20'
                                        : item.status === 'reagendada'
                                          ? 'bg-emerald-500/10 border border-emerald-500/20 hover:ring-1 hover:ring-emerald-500/40'
                                          : 'bg-primary/10 border border-primary/20 hover:ring-1 hover:ring-primary/40',
                                ]"
                            >
                                <!-- Barra lateral de status -->
                                <div class="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
                                    :class="item.status === 'cancelada' ? 'bg-secondary/30' : item.status === 'reagendada' ? 'bg-emerald-500' : 'bg-primary'"
                                ></div>

                                <div class="pl-3.5 pr-2.5 pt-2 pb-2 flex flex-col gap-1 overflow-hidden">
                                    <!-- Horário + badges -->
                                    <div class="flex items-center justify-between gap-1">
                                        <div class="flex items-center gap-1.5">
                                            <svg class="w-3 h-3 flex-shrink-0" :class="item.status === 'cancelada' ? 'text-secondary/40' : item.status === 'reagendada' ? 'text-emerald-500/70' : 'text-primary/60'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            <span class="text-[11px] font-black tabular-nums leading-none"
                                                :class="item.status === 'cancelada' ? 'text-secondary/50 line-through' : item.status === 'reagendada' ? 'text-emerald-500' : 'text-primary'"
                                            >{{ item.hora_ini }} – {{ item.hora_fim }}</span>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <span v-if="item.sub_turma" class="px-1.5 py-0.5 rounded bg-primary/20 text-[8px] font-black text-primary border border-primary/30 leading-none">Turma {{ item.sub_turma }}</span>
                                            <span v-if="item.status === 'cancelada'" class="px-1.5 py-0.5 rounded bg-secondary/15 text-[8px] font-black uppercase text-secondary/60 tracking-wider leading-none">Canc.</span>
                                            <span v-if="item.status === 'reagendada'"
                                                :title="`Reposição de ${ctx.getOrigemDataText(item.id_aula_origem)}`"
                                                class="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-[8px] font-black uppercase text-emerald-600 tracking-wider leading-none cursor-help"
                                            >Rep.</span>
                                        </div>
                                    </div>

                                    <!-- Componente / Ciclo -->
                                    <p class="text-[11px] font-bold leading-snug line-clamp-2"
                                        :class="item.status === 'cancelada' ? 'text-secondary/50 line-through' : 'text-text'"
                                    >{{ item.nome_componente || item.ciclo_desc }}</p>

                                    <!-- Docente -->
                                    <div v-if="item.nome_docente" class="flex items-center gap-1.5 mt-0.5">
                                        <svg class="w-3 h-3 flex-shrink-0 text-secondary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        <span class="text-[10px] font-semibold text-secondary/60 truncate">{{ item.nome_docente }}</span>
                                    </div>
                                </div>

                                <!-- Popover Flutuante no Hover (Inteligente) -->
                                <div
                                    class="pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out absolute z-[100] left-1/2 -translate-x-1/2 w-64 p-3.5 bg-[#161622] border border-primary/30 rounded-xl shadow-2xl backdrop-blur-xl flex flex-col gap-2 text-xs text-text"
                                    :class="idx === 0 ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]'"
                                >
                                    <div class="flex items-center justify-between border-b border-white/10 pb-2">
                                        <span class="font-black text-primary text-xs tabular-nums tracking-wide flex items-center gap-1.5">
                                            <svg class="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            {{ item.hora_ini }} – {{ item.hora_fim }}
                                        </span>
                                        <span
                                            class="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider"
                                            :class="item.status === 'cancelada' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : item.status === 'reagendada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary/20 text-primary border border-primary/30'"
                                        >
                                            {{ item.status }}
                                        </span>
                                    </div>

                                    <div class="flex flex-col gap-0.5">
                                        <span class="text-[9px] font-black text-secondary/60 uppercase tracking-widest">Componente</span>
                                        <p class="font-bold text-text text-xs leading-snug">{{ item.nome_componente || item.ciclo_desc }}</p>
                                    </div>

                                    <div v-if="item.nome_docente" class="flex flex-col gap-0.5">
                                        <span class="text-[9px] font-black text-secondary/60 uppercase tracking-widest">Professor</span>
                                        <p class="text-xs font-semibold text-secondary flex items-center gap-1">
                                            <svg class="w-3.5 h-3.5 text-secondary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                            {{ item.nome_docente }}
                                            <span v-if="item.is_docente_override" class="text-amber-400 font-bold text-[8px] bg-amber-500/10 px-1 rounded border border-amber-500/20">(Substituto)</span>
                                        </p>
                                    </div>

                                    <div v-if="item.sub_turma" class="flex items-center gap-1 text-xs font-bold text-primary">
                                        <span>Turma {{ item.sub_turma }}</span>
                                    </div>

                                    <div v-if="item.observacao" class="flex flex-col gap-0.5 border-t border-white/5 pt-1.5">
                                        <span class="text-[9px] font-black text-secondary/60 uppercase tracking-widest">Plano / Obs</span>
                                        <p class="text-[10px] italic text-secondary/80 line-clamp-3">"{{ item.observacao }}"</p>
                                    </div>

                                    <div class="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] font-black uppercase text-primary/70 tracking-wider">
                                        <span>💡 Clique para editar</span>
                                        <span v-if="item.status === 'reagendada'" class="text-emerald-400">Reposição</span>
                                    </div>
                                </div>
                            </div>
                            <div v-else-if="item._tipo === 'feriado'" class="relative rounded-lg overflow-hidden bg-red-500/10 border border-red-500/20 pl-3.5 pr-2.5 py-2">
                                <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 rounded-l-lg"></div>
                                <div class="flex items-center gap-1.5">
                                    <svg class="w-3 h-3 flex-shrink-0 text-red-500/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    <p class="text-[10px] font-black text-red-500 leading-tight truncate">{{ item.nome }}</p>
                                </div>
                            </div>
                            <div v-else-if="item._tipo === 'evento'" class="relative rounded-lg overflow-hidden bg-amber-500/10 border border-amber-500/20 pl-3.5 pr-2.5 py-2">
                                <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-lg"></div>
                                <div class="flex items-center gap-1.5">
                                    <svg class="w-3 h-3 flex-shrink-0 text-amber-500/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <p class="text-[10px] font-black text-amber-500 leading-tight truncate">{{ item.nome_evento }}</p>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <CalendarioModalAula
            v-if="ctx.showAulaModal.value"
            v-model="ctx.showAulaModal.value"
            :aulaData="ctx.selectedAulaData.value"
            :idEntidade="idEntidade"
            :onSaveDetails="ctx.atualizarDetalhesAula"
            :onDividirAula="ctx.dividirAula"
            :onCancelarAula="ctx.handleCancelarAula"
            @saved="ctx.fetchCalendarEvents"
        />

        <GlobalModalConfirmacao
            v-model="ctx.showConfirm.value"
            :title="ctx.confirmConfig.value.title"
            :message="ctx.confirmConfig.value.message"
            :type="ctx.confirmConfig.value.type"
            confirmText="Confirmar"
            @confirm="ctx.confirmConfig.value.onConfirm()"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseSelect from "~/components/global/BaseSelect.vue";

const props = defineProps<{ ctx: any; idEntidade?: any }>();

const programasSelectOptions = computed(() => {
    return (props.ctx.programas.value || []).map((p: any) => ({
        value: p.id,
        label: p.ano_semestre
            ? `${p.descricao} (${p.ano_semestre})`
            : p.descricao,
    }));
});
</script>

<style scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
}
</style>
