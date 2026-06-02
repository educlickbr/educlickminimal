const fs = require('fs');
const file = 'app/pages/academico_calendario.vue';
let content = fs.readFileSync(file, 'utf8');

// 1. Update timelineMonths computed property
content = content.replace(/const timelineMonths = computed\(\(\) => \{[\s\S]*?return months\n\}\)/, `const timelineMonths = computed(() => {
    const rawItems = activeTab.value === 'feriados' ? feriados.value : (activeTab.value === 'eventos' ? eventos.value : [])
    if (rawItems.length === 0) return []

    const currentYear = new Date().getUTCFullYear()
    let minYear = currentYear
    let maxYear = currentYear

    const allEntries: any[] = []

    rawItems.forEach(item => {
        if (activeTab.value === 'eventos') {
            const start = new Date(item.data_inicio + 'T12:00:00')
            const end = new Date(item.data_fim + 'T12:00:00')
            let curr = new Date(start)
            let isFirstDay = true
            let safeCounter = 0
            while (curr <= end && safeCounter < 366) {
                 const entryDate = curr.toISOString()
                 allEntries.push({
                     ...item,
                     isEvento: true,
                     uniqueKey: \`\${item.id}_\${entryDate}\`,
                     displayDate: entryDate,
                     displayName: item.nome_evento,
                     isFirstDay: isFirstDay,
                     originalStart: item.data_inicio
                 })
                 curr.setDate(curr.getDate() + 1)
                 isFirstDay = false
                 safeCounter++
            }
        } else {
            const entryDate = new Date(item.data + 'T12:00:00').toISOString()
            allEntries.push({
                ...item,
                isFeriado: true,
                uniqueKey: \`\${item.id}_\${entryDate}\`,
                displayDate: entryDate,
                displayName: item.nome,
                isFirstDay: true,
                originalStart: item.data
            })
        }
    })

    if (allEntries.length > 0) {
        const years = allEntries.map(e => new Date(e.displayDate).getUTCFullYear())
        minYear = Math.min(minYear, ...years)
        maxYear = Math.max(maxYear, ...years)
    }

    const months = []
    for (let y = minYear; y <= maxYear; y++) {
        for (let m = 0; m < 12; m++) {
            const date = new Date(Date.UTC(y, m, 1))
            const key = date.toISOString().slice(0, 7)
            
            const monthEntries = allEntries.filter(e => e.displayDate.startsWith(key))
            if (monthEntries.length === 0 && key !== new Date().toISOString().slice(0, 7)) continue

            monthEntries.sort((a, b) => new Date(a.displayDate).getTime() - new Date(b.displayDate).getTime())

            months.push({
                key,
                monthName: date.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' }),
                year: y,
                events: monthEntries,
                isCurrent: key === new Date().toISOString().slice(0, 7)
            })
        }
    }
    return months
})

function toggleAllMonths() {
    const monthsKeys = timelineMonths.value.map(m => m.key)
    const allExpanded = monthsKeys.every(k => expandedMonths.value[k])
    
    if (allExpanded) {
        expandedMonths.value = {}
    } else {
        const newExpanded: any = {}
        monthsKeys.forEach(k => newExpanded[k] = true)
        expandedMonths.value = newExpanded
    }
}

function handleAddInMonth(monthKey: string) {
    if (activeTab.value === 'feriados') {
        feriadoEditData.value = { data: \`\${monthKey}-01\` }
        isEditFeriado.value = false
        showModalFeriado.value = true
    } else {
        eventoEditData.value = { data_inicio: \`\${monthKey}-01\` }
        isEditEvento.value = false
        showModalEvento.value = true
    }
}`);


// Also add toggleAllMonths to exports if needed, but script setup does it automatically
// 2. We need to replace the HTML structure for `<main>` so that both Eventos and Feriados use the same timeline component.
const newMainContent = `
    <!-- Content Area -->
    <main class="min-h-[400px]">
      <div v-if="loading" class="py-16 flex flex-col items-center justify-center gap-3">
        <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"></div>
        <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Carregando...</span>
      </div>
      
      <!-- Unified Timeline for Feriados and Eventos -->
      <div v-else-if="activeTab === 'feriados' || activeTab === 'eventos'" class="relative w-full max-w-4xl mx-auto pl-4 md:pl-0 pt-4 pb-32">
        
        <!-- Empty State -->
        <div v-if="timelineMonths.length === 0 || timelineMonths.every(m => m.events.length === 0)" class="empty-state mt-8">
          <div class="empty-icon text-secondary">
            <Icon :name="activeTab === 'feriados' ? 'ph:calendar-x-duotone' : 'ph:star-duotone'" class="w-10 h-10" />
          </div>
          <p class="empty-title italic">Nenhum registro encontrado</p>
          <p class="empty-subtitle">Comece adicionando seu primeiro {{ activeTab === 'feriados' ? 'feriado' : 'evento' }}</p>
          <button @click="activeTab === 'feriados' ? openNovoFeriado() : openNovoEvento()" class="empty-cta group">
            <Icon name="ph:plus-bold" class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            Adicionar Registro
          </button>
        </div>

        <template v-else>
            <!-- Controls (Expand/Collapse) -->
            <div class="flex justify-end mb-4 relative z-20">
                <button 
                  @click="toggleAllMonths"
                  class="p-2 text-secondary hover:text-primary transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-div-10 rounded-lg hover:bg-div-30"
                >
                  <Icon name="ph:arrows-out-line-vertical-duotone" class="w-4 h-4" />
                  <span>Expandir / Recolher</span>
                </button>
            </div>

            <!-- Vertical Timeline Line -->
            <div class="absolute left-0 md:left-1/2 top-4 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent z-0"></div>

            <div class="flex flex-col gap-8 relative z-10">
                <!-- Month Group -->
                <div 
                    v-for="month in timelineMonths" 
                    :key="month.key"
                    class="group relative flex flex-col"
                    :class="{ 'opacity-60 hover:opacity-100 transition-opacity': month.events.length === 0 && !expandedMonths[month.key] && !month.isCurrent }"
                >
                    <!-- Timeline Node -->
                    <div 
                        class="absolute left-[-4.5px] md:left-1/2 md:-ml-[5px] top-6 w-[10px] h-[10px] rounded-full transition-all duration-300 z-20"
                        :class="[
                            month.events.length > 0 ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)] border border-primary' : 'bg-background border-2 border-secondary/30',
                            month.isCurrent ? 'scale-125 bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.8)] border border-primary' : ''
                        ]"
                    ></div>

                    <!-- Month Header Card -->
                    <div 
                        class="w-full md:w-[calc(50%-2rem)] mb-2 md:mb-0 transition-all duration-300 relative select-none"
                        :class="[parseInt(String(month.key).split('-')[1]) % 2 !== 0 ? 'md:mr-auto text-left' : 'md:ml-auto text-left']"
                    >   
                        <!-- Connection Line (Desktop) -->
                        <div class="hidden md:block absolute top-[1.6rem] w-[2rem] h-px bg-secondary/10 z-0"
                             :class="parseInt(String(month.key).split('-')[1]) % 2 !== 0 ? '-right-[2rem]' : '-left-[2rem]'"
                        ></div>

                        <div class="rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all hover:bg-div-15 relative z-10 group-hover:translate-x-1 md:group-hover:translate-x-0 bg-background md:bg-transparent"
                            @click="toggleMonth(month.key)">
                            <div class="flex items-center gap-4 flex-1">
                                <div class="flex flex-col">
                                    <h3 class="text-xl font-bold capitalize leading-tight transition-colors" :class="month.isCurrent ? 'text-primary' : 'text-text'">{{ month.monthName }}</h3>
                                    <span class="text-[10px] font-black tracking-widest text-secondary/50">{{ month.year }}</span>
                                </div>
                                <div v-if="month.events.length > 0" class="px-2 py-0.5 rounded text-[10px] font-bold"
                                    :class="month.isCurrent ? 'bg-primary text-white' : 'bg-div-30 text-secondary'">
                                    {{ month.events.length }}
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <!-- Quick Add Button -->
                                <button @click.stop="handleAddInMonth(month.key)"
                                        class="w-8 h-8 flex items-center justify-center rounded-full bg-div-30 text-secondary hover:bg-primary hover:text-white hover:scale-110 transition-all"
                                        title="Adicionar no mês">
                                    <Icon name="ph:plus-bold" class="w-4 h-4" />
                                </button>
                                
                                <Icon name="ph:caret-down-bold" class="w-4 h-4 text-secondary/30 transition-transform" :class="{ 'rotate-180': expandedMonths[month.key] }" />
                            </div>
                        </div>
                    </div>

                    <!-- Events List -->
                    <div 
                        v-show="expandedMonths[month.key]"
                        class="flex flex-col gap-3 mt-2 w-full md:w-[calc(50%-2rem)]"
                        :class="[parseInt(String(month.key).split('-')[1]) % 2 !== 0 ? 'md:mr-auto' : 'md:ml-auto']"
                    >
                        <div v-if="month.events.length === 0" class="w-full p-4 opacity-50 text-xs italic text-secondary text-center md:text-left transition-opacity">
                            Nenhum registro neste mês
                        </div>
                        <div 
                            v-for="evt in month.events" 
                            :key="evt.uniqueKey"
                            class="comp-card group/card overflow-hidden hover:-translate-y-0.5"
                        >   
                            <div class="comp-card-accent"></div>
                            
                            <!-- Connection Line for Cards (Desktop) -->
                            <div class="hidden md:block absolute top-1/2 w-[2rem] h-px bg-secondary/10"
                                :class="parseInt(String(month.key).split('-')[1]) % 2 !== 0 ? '-right-[2rem]' : '-left-[2rem]'"
                            ></div>

                            <div class="flex items-center gap-4 w-full relative z-10 bg-surface">
                                <!-- Date Badge -->
                                <div class="flex flex-col items-center justify-center bg-div-15 rounded p-1.5 min-w-[3.2rem] border border-secondary/5">
                                    <span class="text-[9px] font-black uppercase text-secondary tracking-widest">{{ getWeekDay(evt.displayDate) }}</span>
                                    <span class="text-lg font-bold text-primary leading-none">{{ getDay(evt.displayDate) }}</span>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <h4 class="text-sm font-bold truncate text-text">{{ evt.displayName }}</h4>
                                    <div class="flex flex-wrap items-center gap-2 mt-1">
                                        <span v-if="!evt.isFirstDay" class="text-[8px] font-bold text-secondary/50 uppercase tracking-widest italic">Continuação</span>
                                        <span v-if="evt.sobrescrever_calendario" class="item-badge bg-red-400/10 text-red-400 border border-red-400/20">Sobrepõe Aula</span>
                                        <span v-if="evt.recorrente_anual" class="item-badge bg-primary/10 text-primary border border-primary/20">Recorrente Anual</span>
                                        <span v-if="evt.is_global" class="item-badge bg-secondary/10 text-secondary border border-secondary/20"><Icon name="ph:globe-hemisphere-west-duotone" class="inline w-3 h-3 mr-0.5 -mt-0.5"/>Global</span>
                                    </div>
                                </div>

                                <div v-if="evt.isFirstDay" class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <button @click="evt.isEvento ? openEditarEvento(evt) : openEditarFeriado(evt)" class="comp-action-btn comp-action-edit">
                                        <Icon name="ph:pencil-simple-bold" class="w-4 h-4" />
                                    </button>
                                    <button @click="evt.isEvento ? confirmDeleteEvento(evt) : confirmDeleteFeriado(evt)" class="comp-action-btn comp-action-delete">
                                        <Icon name="ph:trash-bold" class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Bottom Hint -->
                <div class="flex justify-center mt-12 mb-8 opacity-50 relative z-20">
                    <p class="text-[10px] uppercase tracking-widest text-secondary font-bold">-- Fim do Cronograma --</p>
                </div>
            </div>
        </template>
      </div>

      <!-- Tab: Calendário (Placeholder) -->
      <div v-if="activeTab === 'calendario'">
        <div class="empty-state mt-8">
          <div class="empty-icon text-violet-400">
            <Icon name="ph:calendar-check-duotone" class="w-10 h-10" />
          </div>
          <p class="empty-title italic">Visão de Calendário</p>
          <p class="empty-subtitle">As aulas e encontros simulados dos ciclos serão exibidos aqui na atualização final</p>
        </div>
      </div>
    </main>
`;

content = content.replace(/<main class="min-h-\[400px\]">[\s\S]*?<\/main>/, newMainContent);

fs.writeFileSync(file, content, 'utf8');
