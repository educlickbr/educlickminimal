<template>
    <div class="flex flex-col gap-6">
        <!-- Program selector -->
        <div class="flex flex-col md:flex-row md:items-center gap-4">
            <div class="flex-1 flex flex-col gap-1.5">
                <label
                    class="text-[10px] font-black text-secondary/60 uppercase tracking-[0.18em]"
                    >Oferta / Programa</label
                >
                <div class="relative">
                    <select
                        v-model="ctx.selectedProgramaId.value"
                        @change="ctx.onProgramaChange"
                        class="w-full px-4 py-3 rounded-xl border border-field-border bg-field-bg text-sm font-bold text-field-text outline-none appearance-none cursor-pointer transition-all hover:border-primary/30 focus:border-primary/50"
                    >
                        <option :value="null" disabled>
                            — Selecione um Programa —
                        </option>
                        <option
                            v-for="p in ctx.programas.value"
                            :key="p.id"
                            :value="p.id"
                        >
                            {{ p.descricao }}
                        </option>
                    </select>
                    <div
                        class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40"
                    >
                        <Icon name="ph:caret-down-bold" class="w-4 h-4" />
                    </div>
                </div>
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
            <div class="rounded-xl border border-divider overflow-hidden">
                <div
                    class="grid grid-cols-7 bg-div-15 border-b border-divider"
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
                    class="grid grid-cols-7"
                    :class="
                        Number(wi) < ctx.calMonthGrid.value.length - 1
                            ? 'border-b border-divider'
                            : ''
                    "
                >
                    <div
                        v-for="cell in week"
                        :key="cell.dateStr"
                        class="min-h-[110px] p-2 border-r border-divider last:border-r-0 flex flex-col gap-1 transition-colors"
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
                                class="px-2 py-1.5 rounded-lg flex flex-col gap-1 cursor-pointer hover:border-primary/50 transition-all select-none"
                                :class="[
                                    ctx.draggingItem.value?.id === item.id
                                        ? 'opacity-40 scale-95'
                                        : '',
                                    item.status === 'cancelada'
                                        ? 'bg-secondary/10 border border-dashed border-divider'
                                        : item.status === 'reagendada'
                                          ? 'bg-emerald-500/15 border border-emerald-500/25'
                                          : 'bg-primary/15 border border-primary/25',
                                ]"
                            >
                                <div
                                    class="flex items-center justify-between gap-1"
                                >
                                    <Icon
                                        name="ph:dots-six-vertical-bold"
                                        class="w-3 h-3 flex-shrink-0"
                                        :class="
                                            item.status === 'cancelada'
                                                ? 'text-secondary/40'
                                                : 'text-primary/40'
                                        "
                                    />
                                    <p
                                        class="text-[10px] font-black leading-tight flex-1"
                                        :class="[
                                            item.status === 'cancelada'
                                                ? 'text-secondary/50 line-through'
                                                : item.status === 'reagendada'
                                                  ? 'text-emerald-500'
                                                  : 'text-primary',
                                        ]"
                                    >
                                        {{ item.hora_ini }} –
                                        {{ item.hora_fim }}
                                    </p>
                                    <span
                                        v-if="item.sub_turma"
                                        class="px-1 py-0.5 rounded bg-primary/20 text-[7px] font-black text-primary border border-primary/30"
                                        >T.{{ item.sub_turma }}</span
                                    >
                                    <span
                                        v-if="item.status === 'cancelada'"
                                        class="px-1 py-0.5 rounded bg-secondary/10 text-[7px] font-black uppercase text-secondary/60 tracking-wider"
                                        >Canc.</span
                                    >
                                </div>
                                <p
                                    class="text-[9px] font-bold leading-tight line-clamp-2"
                                    :class="
                                        item.status === 'cancelada'
                                            ? 'text-secondary/60'
                                            : 'text-text'
                                    "
                                >
                                    {{ item.nome_componente || item.ciclo_desc }}
                                </p>
                                <p
                                    v-if="item.nome_docente"
                                    class="text-[8px] font-semibold text-secondary/60 truncate"
                                >
                                    👨‍🏫 {{ item.nome_docente }}
                                </p>
                                <div class="mt-0.5 flex items-center gap-1">
                                    <button
                                        v-if="item.status !== 'cancelada'"
                                        @click.stop="
                                            ctx.handleCancelarAula(item)
                                        "
                                        class="self-start px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors leading-none"
                                    >
                                        Cancelar
                                    </button>
                                    <span
                                        v-if="item.status === 'reagendada'"
                                        :title="`Reposição de ${ctx.getOrigemDataText(item.id_aula_origem)}`"
                                        class="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-600 tracking-wider leading-none cursor-help"
                                        >REP.</span
                                    >
                                </div>
                            </div>
                            <div
                                v-else-if="item._tipo === 'feriado'"
                                class="px-2 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20"
                            >
                                <p
                                    class="text-[9px] font-black text-red-500 leading-tight"
                                >
                                    🛑 {{ item.nome }}
                                </p>
                            </div>
                            <div
                                v-else-if="item._tipo === 'evento'"
                                class="px-2 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20"
                            >
                                <p
                                    class="text-[9px] font-black text-amber-500 leading-tight"
                                >
                                    📅 {{ item.nome_evento }}
                                </p>
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
                        class="min-h-[250px] p-2 flex flex-col gap-2 border-r border-divider last:border-r-0 transition-colors"
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
                        <template v-for="item in day.events" :key="item.id">
                            <div
                                v-if="item._tipo === 'aula'"
                                draggable="true"
                                @dragstart="ctx.onDragStart(item)"
                                @dragend="ctx.onDragEnd"
                                @click="ctx.openAulaModal(item)"
                                class="p-3 rounded-lg flex flex-col gap-1.5 cursor-pointer hover:border-primary/50 transition-all select-none"
                                :class="[
                                    ctx.draggingItem.value?.id === item.id
                                        ? 'opacity-40 scale-95'
                                        : '',
                                    item.status === 'cancelada'
                                        ? 'bg-secondary/10 border border-dashed border-divider'
                                        : item.status === 'reagendada'
                                          ? 'bg-emerald-500/12 border border-emerald-500/25'
                                          : 'bg-primary/12 border border-primary/25',
                                ]"
                            >
                                <div
                                    class="flex items-center gap-1.5"
                                    :class="
                                        item.status === 'cancelada'
                                            ? 'text-secondary/40'
                                            : 'text-primary/50'
                                    "
                                >
                                    <Icon
                                        name="ph:dots-six-vertical-bold"
                                        class="w-3.5 h-3.5 flex-shrink-0"
                                    />
                                    <span
                                        class="text-[11px] font-black tabular-nums"
                                        :class="[
                                            item.status === 'cancelada'
                                                ? 'text-secondary/50 line-through'
                                                : item.status === 'reagendada'
                                                  ? 'text-emerald-500'
                                                  : 'text-primary',
                                        ]"
                                        >{{ item.hora_ini }} –
                                        {{ item.hora_fim }}</span
                                    >
                                    <span
                                        v-if="item.sub_turma"
                                        class="ml-auto px-1.5 py-0.5 rounded bg-primary/20 text-[8px] font-black text-primary border border-primary/30"
                                        >Turma {{ item.sub_turma }}</span
                                    >
                                    <span
                                        v-if="item.status === 'cancelada'"
                                        class="ml-auto px-1.5 py-0.5 rounded bg-secondary/10 text-[8px] font-black uppercase text-secondary/60 tracking-wider"
                                        >Canc.</span
                                    >
                                </div>
                                <p
                                    class="text-[10px] font-bold leading-snug line-clamp-2"
                                    :class="
                                        item.status === 'cancelada'
                                            ? 'text-secondary/60'
                                            : 'text-text'
                                    "
                                >
                                    {{ item.nome_componente || item.ciclo_desc }}
                                </p>
                                <p
                                    v-if="item.nome_docente"
                                    class="text-[9px] font-semibold text-secondary/60 truncate"
                                >
                                    👨‍🏫 {{ item.nome_docente }}
                                </p>
                                <div class="mt-1 flex items-center gap-1.5">
                                    <button
                                        v-if="item.status !== 'cancelada'"
                                        @click.stop="
                                            ctx.handleCancelarAula(item)
                                        "
                                        class="self-start px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors leading-none"
                                    >
                                        Cancelar
                                    </button>
                                    <span
                                        v-if="item.status === 'reagendada'"
                                        :title="`Reposição de ${ctx.getOrigemDataText(item.id_aula_origem)}`"
                                        class="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-600 tracking-wider leading-none cursor-help"
                                        >REP.</span
                                    >
                                </div>
                            </div>
                            <div
                                v-else-if="item._tipo === 'feriado'"
                                class="px-2 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20"
                            >
                                <p
                                    class="text-[9px] font-black text-red-500 leading-tight"
                                >
                                    🛑 {{ item.nome }}
                                </p>
                            </div>
                            <div
                                v-else-if="item._tipo === 'evento'"
                                class="px-2 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20"
                            >
                                <p
                                    class="text-[9px] font-black text-amber-500 leading-tight"
                                >
                                    📅 {{ item.nome_evento }}
                                </p>
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
const props = defineProps<{ ctx: any; idEntidade?: any }>();
</script>

<style scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
}
</style>
