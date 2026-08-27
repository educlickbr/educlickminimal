<script setup lang="ts">
/**
 * LandingCursos.vue - Vitrine Dinâmica de Cursos & Ofertas da ENSI
 *
 * Busca dinamicamente os programas, áreas e ofertas do BFF público (/api/public/*),
 * com filtro por área, suporte a paginação/setas (máx. 4 cursos por visualização)
 * e redirecionamento de "Saiba mais" para /oferta.
 */
const loading = ref(true);
const programas = ref<any[]>([]);
const areas = ref<any[]>([]);
const ofertas = ref<any[]>([]);
const activeArea = ref<string | null>(null);

const currentPage = ref(0);
const PAGE_SIZE = 4;
const idEntidadeResolved = ref<string | null>(null);

const scrollToContato = () => {
    if (!import.meta.client) return;
    const el = document.getElementById("contato");
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
};

async function fetchCursosData() {
    loading.value = true;
    try {
        const { aplicarTemaDaEntidadePublica } = useTemaEntidade();
        const resTema = await aplicarTemaDaEntidadePublica();
        
        let idEnt = resTema.success ? resTema.entidade?.id : null;
        if (!idEnt) {
            // fallback se não resolvido
            idEnt = "00ca60ea-6667-482d-8a96-09b877707b08";
        }
        idEntidadeResolved.value = idEnt;

        const results = await Promise.allSettled([
            $fetch("/api/public/programas", { params: { id_entidade: idEnt } }),
            $fetch("/api/public/areas", { params: { id_entidade: idEnt } }),
            $fetch("/api/public/ofertas", { params: { id_entidade: idEnt } }),
        ]);

        const [progRes, areaRes, ofertaRes] = results;

        if (progRes.status === "fulfilled" && (progRes.value as any)?.success) {
            programas.value = (progRes.value as any).itens || [];
        }

        if (areaRes.status === "fulfilled" && (areaRes.value as any)?.success) {
            areas.value = (areaRes.value as any).itens || [];
        }

        if (ofertaRes.status === "fulfilled") {
            const val = ofertaRes.value as any;
            if (Array.isArray(val)) {
                ofertas.value = val;
            } else if (val?.success && Array.isArray(val.itens)) {
                ofertas.value = val.itens;
            }
        }
    } catch (err) {
        console.error("[LandingCursos] Erro ao carregar ofertas públicas:", err);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchCursosData();
});

const ofertasPorPrograma = computed(() => {
    const map: Record<string, any> = {};
    for (const of of ofertas.value) {
        if (of.programa_id) map[of.programa_id] = of;
    }
    return map;
});

const filteredProgramas = computed(() => {
    if (!activeArea.value) return programas.value;
    return programas.value.filter((p) => p.id_area === activeArea.value);
});

const totalPages = computed(() => {
    return Math.ceil(filteredProgramas.value.length / PAGE_SIZE) || 1;
});

const displayedProgramas = computed(() => {
    const start = currentPage.value * PAGE_SIZE;
    return filteredProgramas.value.slice(start, start + PAGE_SIZE);
});

function selectArea(areaId: string | null) {
    activeArea.value = areaId;
    currentPage.value = 0;
}

function prevPage() {
    if (currentPage.value > 0) {
        currentPage.value--;
    }
}

function nextPage() {
    if (currentPage.value < totalPages.value - 1) {
        currentPage.value++;
    }
}

function formatValor(centavos: number): string {
    if (!centavos || centavos <= 0) return "Grátis";
    return `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;
}
</script>

<template>
    <section id="cursos" class="py-20 md:py-28 px-5 md:px-16 bg-background relative border-t border-divider">
        <div class="max-w-6xl mx-auto space-y-10">
            
            <!-- Cabeçalho da Seção -->
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div class="space-y-3 max-w-2xl">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md inline-block">
                        Cursos & Ofertas
                    </span>
                    <h2 class="text-3xl md:text-4xl font-black text-text tracking-tight">
                        Formação continuada e especializada na área da saúde
                    </h2>
                </div>
                <div class="flex items-center gap-3 self-start md:self-auto">
                    <button
                        @click="scrollToContato"
                        class="bg-div-15 border border-divider text-text hover:border-primary/40 font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all cursor-pointer"
                    >
                        Falar com Consultor
                    </button>
                </div>
            </div>

            <!-- Seletor de Áreas (Navegação por Abas/Pills) + Controles de Navegação por Setas -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 pb-4 border-b border-divider">
                
                <!-- Pills das Áreas -->
                <div class="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
                    <button
                        @click="selectArea(null)"
                        :class="[
                            'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shrink-0 cursor-pointer',
                            !activeArea
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                : 'bg-div-15 text-secondary border-divider hover:text-text hover:border-primary/30'
                        ]"
                    >
                        Todas as Áreas
                    </button>
                    <button
                        v-for="a in areas"
                        :key="a.id"
                        @click="selectArea(a.id)"
                        :class="[
                            'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shrink-0 cursor-pointer',
                            activeArea === a.id
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                : 'bg-div-15 text-secondary border-divider hover:text-text hover:border-primary/30'
                        ]"
                    >
                        {{ a.nome_area }}
                    </button>
                </div>

                <!-- Setas de Avançar/Voltar caso tenha mais de 4 cursos -->
                <div v-if="filteredProgramas.length > PAGE_SIZE" class="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span class="text-[10px] font-black uppercase tracking-widest text-secondary">
                        Página {{ currentPage + 1 }} de {{ totalPages }}
                    </span>
                    <div class="flex items-center gap-1">
                        <button
                            @click="prevPage"
                            :disabled="currentPage === 0"
                            class="w-9 h-9 rounded-xl bg-div-15 border border-divider flex items-center justify-center text-text hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Página anterior"
                        >
                            <Icon name="ph:caret-left-bold" class="w-4 h-4 text-primary" />
                        </button>
                        <button
                            @click="nextPage"
                            :disabled="currentPage >= totalPages - 1"
                            class="w-9 h-9 rounded-xl bg-div-15 border border-divider flex items-center justify-center text-text hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Próxima página"
                        >
                            <Icon name="ph:caret-right-bold" class="w-4 h-4 text-primary" />
                        </button>
                    </div>
                </div>

            </div>

            <!-- Estado de Carregamento (Skeleton) -->
            <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div v-for="i in 4" :key="i" class="bg-div-15 border border-divider rounded-2xl h-64 animate-pulse"></div>
            </div>

            <!-- Estado Vazio (Sem ofertas de curso no momento) -->
            <div
                v-else-if="filteredProgramas.length === 0"
                class="bg-div-15 border border-divider rounded-3xl p-12 text-center space-y-4 my-6"
            >
                <div class="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                    <Icon name="ph:folder-open-light" class="w-8 h-8" />
                </div>
                <h3 class="text-xl font-black text-text">Sem ofertas de curso no momento</h3>
                <p class="text-xs font-bold text-secondary max-w-md mx-auto">
                    Não encontramos turmas abertas para a área selecionada. Tente selecionar outra área ou volte mais tarde.
                </p>
                <button
                    v-if="activeArea"
                    @click="selectArea(null)"
                    class="text-xs font-black uppercase tracking-wider text-primary hover:underline pt-2 cursor-pointer"
                >
                    Ver todas as áreas
                </button>
            </div>

            <!-- Grid Dinâmico de Cursos (Formato ENSI Card) -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    v-for="prog in displayedProgramas"
                    :key="prog.id_processo_seletivo || prog.id"
                    class="bg-div-15 border border-divider rounded-2xl p-7 hover:border-primary/40 transition-all flex flex-col justify-between space-y-6 group shadow-sm"
                >
                    <div class="space-y-4">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                            <span class="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                                {{ prog.nome_area || 'Saúde Integrada' }}
                            </span>
                            <span
                                v-if="ofertasPorPrograma[prog.id]"
                                :class="[
                                    'text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border',
                                    ofertasPorPrograma[prog.id].valor_centavos > 0
                                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                        : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                ]"
                            >
                                {{ formatValor(ofertasPorPrograma[prog.id].valor_centavos) }}
                            </span>
                            <span v-else class="text-[9px] font-black uppercase tracking-widest text-secondary/60 bg-div-30 border border-divider px-3 py-1.5 rounded-full">
                                Inscrições Abertas
                            </span>
                        </div>

                        <h3 class="text-xl font-black text-text group-hover:text-primary transition-colors leading-snug">
                            {{ prog.nome_display || prog.nome }}
                        </h3>

                        <p class="text-xs font-bold text-secondary/80 leading-relaxed line-clamp-2">
                            {{ prog.descricao || 'Capacitação completa e atualizada com o corpo docente da ENSI.' }}
                        </p>
                    </div>

                    <div class="pt-5 border-t border-divider flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3 text-[10px] font-bold text-secondary">
                            <span class="flex items-center gap-1.5">
                                <Icon name="ph:clock-bold" class="w-3.5 h-3.5 text-primary" />
                                {{ prog.carga_horaria_total_horas ? prog.carga_horaria_total_horas + 'h' : 'Carga Completa' }}
                            </span>
                            <span>•</span>
                            <span class="flex items-center gap-1.5">
                                <Icon name="ph:monitor-bold" class="w-3.5 h-3.5 text-primary" />
                                Presencial / EAD
                            </span>
                        </div>

                        <!-- Botão Saiba Mais -> Direciona para a página /oferta -->
                        <NuxtLink
                            :to="`/oferta`"
                            class="text-xs font-black uppercase tracking-wider text-primary hover:text-text transition-colors flex items-center gap-1 shrink-0"
                        >
                            <span>Saiba Mais</span>
                            <Icon name="ph:caret-right-bold" class="w-4 h-4" />
                        </NuxtLink>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
    display: none;
}
.scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
