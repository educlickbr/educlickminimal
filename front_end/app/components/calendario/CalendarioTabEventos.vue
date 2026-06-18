<template>
    <div class="flex flex-col gap-6">
        <div v-if="ctx.loading.value" class="flex justify-center p-8">
            <div
                class="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"
            />
        </div>

        <div v-else class="relative px-2 md:px-0">
            <div class="flex justify-end mb-4">
                <button
                    @click="ctx.toggleAllMonths(monthKeys)"
                    class="p-2 text-secondary hover:text-primary transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-div-10 rounded-lg hover:bg-div-30"
                >
                    <Icon
                        name="ph:arrows-out-line-vertical-duotone"
                        class="w-4 h-4"
                    />
                    <span>{{ allExpanded ? "Recolher" : "Expandir" }}</span>
                </button>
            </div>

            <div
                class="absolute left-0 md:left-1/2 top-10 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent z-0"
            ></div>

            <div class="flex flex-col gap-8 relative z-10">
                <div
                    v-for="month in timelineMonths"
                    :key="month.key"
                    class="group relative flex flex-col"
                    :class="{
                        'opacity-60 hover:opacity-100 transition-opacity':
                            month.events.length === 0 &&
                            !ctx.expandedMonths.value[month.key] &&
                            !month.isCurrent,
                    }"
                >
                    <div
                        @click.stop="ctx.toggleMonth(month.key)"
                        class="absolute left-[-9.5px] md:left-1/2 md:-ml-[10px] top-5 w-5 h-5 rounded-full transition-all duration-300 z-20 flex items-center justify-center cursor-pointer hover:scale-125 hover:bg-primary hover:border-primary hover:text-white group/node"
                        :class="[
                            month.events.length > 0
                                ? 'bg-primary shadow-[0_0_10px_rgba(139,92,246,0.3)] border border-primary text-white'
                                : 'bg-background border-2 border-secondary/30 text-secondary/30',
                            month.isCurrent
                                ? 'scale-110 bg-primary shadow-[0_0_15px_rgba(139,92,246,0.8)] border border-primary text-white'
                                : '',
                        ]"
                    >
                        <Icon name="ph:plus-bold" class="w-2.5 h-2.5" />
                    </div>

                    <div
                        class="w-full md:w-[calc(50%-2rem)] mb-2 md:mb-0 transition-all duration-300 relative select-none"
                        :class="[
                            isOddMonth(month.key)
                                ? 'md:mr-auto text-left'
                                : 'md:ml-auto text-left',
                        ]"
                    >
                        <div
                            class="hidden md:block absolute top-[1.6rem] w-[2rem] h-px bg-secondary/10 z-0"
                            :class="
                                isOddMonth(month.key)
                                    ? '-right-[2rem]'
                                    : '-left-[2rem]'
                            "
                        ></div>
                        <div
                            class="rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all hover:bg-div-15 relative z-10 bg-background md:bg-transparent"
                            @click="ctx.toggleMonth(month.key)"
                        >
                            <div class="flex items-center gap-4 flex-1">
                                <div class="flex flex-col">
                                    <h3
                                        class="text-xl font-bold capitalize leading-tight"
                                        :class="
                                            month.isCurrent
                                                ? 'text-primary'
                                                : 'text-white'
                                        "
                                    >
                                        {{ month.monthName }}
                                    </h3>
                                    <span
                                        class="text-[10px] font-black tracking-widest text-secondary/50"
                                        >{{ month.year }}</span
                                    >
                                </div>
                                <div
                                    v-if="month.events.length > 0"
                                    class="px-2 py-0.5 rounded text-[10px] font-bold"
                                    :class="
                                        month.isCurrent
                                            ? 'bg-primary text-white'
                                            : 'bg-div-30 text-secondary'
                                    "
                                >
                                    {{ month.events.length }}
                                </div>
                            </div>
                            <Icon
                                :name="
                                    ctx.expandedMonths.value[month.key]
                                        ? 'ph:caret-up-bold'
                                        : 'ph:caret-down-bold'
                                "
                                class="w-4 h-4 text-secondary/40 transition-transform duration-300"
                            />
                        </div>
                    </div>

                    <div
                        v-show="ctx.expandedMonths.value[month.key]"
                        class="flex flex-col gap-3 mt-2 w-full md:w-[calc(50%-2rem)]"
                        :class="[
                            isOddMonth(month.key) ? 'md:mr-auto' : 'md:ml-auto',
                        ]"
                    >
                        <div
                            v-if="month.events.length === 0"
                            class="w-full p-4 opacity-50 text-xs italic text-secondary text-center md:text-left"
                        >
                            Nenhum evento neste mês — use o + para adicionar
                        </div>
                        <div
                            v-for="evt in month.events"
                            :key="evt.uniqueKey"
                            class="comp-card group/card overflow-hidden hover:-translate-y-0.5"
                        >
                            <div class="comp-card-accent"></div>
                            <div
                                class="hidden md:block absolute top-1/2 w-[2rem] h-px bg-secondary/10"
                                :class="
                                    isOddMonth(month.key)
                                        ? '-right-[2rem]'
                                        : '-left-[2rem]'
                                "
                            ></div>
                            <div
                                class="flex items-center gap-4 w-full relative z-10"
                            >
                                <div
                                    class="flex flex-col items-center justify-center bg-div-15 rounded p-1.5 min-w-[3.2rem] border border-secondary/5"
                                >
                                    <span
                                        class="text-[9px] font-black uppercase text-secondary tracking-widest"
                                        >{{ getWeekDay(evt.displayDate) }}</span
                                    >
                                    <span
                                        class="text-lg font-bold text-primary leading-none"
                                        >{{ getDay(evt.displayDate) }}</span
                                    >
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4
                                        class="text-sm font-bold truncate text-white"
                                    >
                                        {{ evt.displayName }}
                                    </h4>
                                    <div
                                        class="flex flex-wrap items-center gap-2 mt-1"
                                    >
                                        <span
                                            v-if="!evt.isFirstDay"
                                            class="text-[8px] font-bold text-secondary/50 uppercase tracking-widest italic"
                                            >Continuação</span
                                        >
                                        <span
                                            v-if="evt.isFirstDay"
                                            class="text-[8px] font-black text-secondary/40 bg-secondary/5 px-1.5 py-0.5 rounded"
                                            >{{ formatDate(evt.data_inicio) }} →
                                            {{ formatDate(evt.data_fim) }}</span
                                        >
                                    </div>
                                </div>
                                <div
                                    class="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                >
                                    <button
                                        @click="ctx.openEditar(evt)"
                                        class="comp-action-btn comp-action-edit"
                                    >
                                        <Icon
                                            name="ph:pencil-simple-bold"
                                            class="w-4 h-4"
                                        />
                                    </button>
                                    <button
                                        @click="ctx.confirmDelete(evt)"
                                        class="comp-action-btn comp-action-delete"
                                    >
                                        <Icon
                                            name="ph:trash-bold"
                                            class="w-4 h-4"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <CalendarioModalEvento
            v-if="ctx.showModal.value"
            v-model="ctx.showModal.value"
            :isEdit="ctx.isEdit.value"
            :initialData="ctx.editData.value"
            :idEntidade="idEntidade"
            @saved="ctx.handleSaved"
        />
        <GlobalModalConfirmacao
            v-model="ctx.showConfirm.value"
            title="Excluir Evento"
            :message="
                ctx.confirmTarget.value
                    ? `Excluir ${ctx.confirmTarget.value.nome_evento}?`
                    : ''
            "
            type="danger"
            confirmText="Excluir"
            @confirm="ctx.deleteEvento"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ ctx: any; idEntidade: any }>();
const timelineMonths = computed(() => props.ctx.timelineMonths?.value || []);
const monthKeys = computed(() => timelineMonths.value.map((m: any) => m.key));
const allExpanded = computed(() =>
    monthKeys.value.every((k: string) => props.ctx.expandedMonths.value[k]),
);
function isOddMonth(key: string) {
    const parts = key.split("-");
    return parseInt(parts[1] || "0") % 2 !== 0;
}
function getDay(s: string) {
    return s ? new Date(s).getUTCDate() : "-";
}
function getWeekDay(s: string) {
    return s
        ? new Intl.DateTimeFormat("pt-BR", {
              weekday: "short",
              timeZone: "UTC",
          })
              .format(new Date(s))
              .toUpperCase()
              .slice(0, 3)
        : "-";
}
function formatDate(s: string) {
    return s ? s.split("-").reverse().join("/") : "-";
}
</script>

<style scoped>
.comp-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
}
.comp-card-accent {
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 20%;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: linear-gradient(180deg, #7c3aed, #a78bfa);
    opacity: 0;
    transition: opacity 0.2s;
}
.comp-card:hover .comp-card-accent {
    opacity: 1;
}
.comp-action-btn {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.5);
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
}
.comp-action-edit:hover {
    background: rgba(139, 92, 246, 0.15);
    color: #c4b5fd;
}
.comp-action-delete:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
}
</style>
