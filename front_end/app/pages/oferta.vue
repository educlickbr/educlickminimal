<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

definePageMeta({ layout: false });

const route = useRoute();
const user = useSupabaseUser();
const loading = ref(true);
const programas = ref<any[]>([]);
const areas = ref<any[]>([]);
const ofertas = ref<any[]>([]);
const activeArea = ref<string | null>(null);
const inscritos = ref<Record<string, boolean>>({});
const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

const fallbackId = "00ca60ea-6667-482d-8a96-09b877707b08";
const idEntidade = computed(
    () => (route.query.id_entidade as string) || fallbackId,
);

async function fetchData() {
    loading.value = true;
    try {
        const results = await Promise.allSettled([
            $fetch("/api/public/programas", {
                params: { id_entidade: idEntidade.value },
            }),
            $fetch("/api/public/areas", {
                params: { id_entidade: idEntidade.value },
            }),
            $fetch("/api/public/ofertas", {
                params: { id_entidade: idEntidade.value },
            }),
        ]);

        const [progResult, areaResult, ofertasResult] = results;

        const progData = (
            progResult.status === "fulfilled" ? progResult.value : null
        ) as any;
        if (progData?.success) programas.value = progData.itens || [];

        const areaData = (
            areaResult.status === "fulfilled" ? areaResult.value : null
        ) as any;
        if (areaData?.success) areas.value = areaData.itens || [];

        const ofertaData = (
            ofertasResult.status === "fulfilled" ? ofertasResult.value : null
        ) as any;
        if (ofertaData?.success) ofertas.value = ofertaData.itens || [];
        else if (ofertasResult.status === "rejected") {
            console.warn(
                "Ofertas não disponíveis:",
                (ofertasResult as any).reason,
            );
        }

        if (user.value && programas.value.length > 0) {
            await verificarInscricoes();
        }
    } catch (e) {
        console.error("Erro ao carregar dados públicos:", e);
    } finally {
        loading.value = false;
    }
}

async function verificarInscricoes() {
    try {
        const ids = programas.value
            .map((p) => p.id_processo_seletivo)
            .filter(Boolean);
        if (ids.length === 0) return;
        const res = (await $fetch("/api/form/inscricoes-lote", {
            method: "POST",
            body: { ids_processos: ids },
        })) as any;
        if (res?.success && res.inscritos) inscritos.value = res.inscritos;
    } catch {
        /* silent */
    }
}

const ofertasPorPrograma = computed(() => {
    const map: Record<string, any> = {};
    for (const of of ofertas.value) {
        map[of.programa_id] = of;
    }
    return map;
});

const filteredProgramas = computed(() => {
    if (!activeArea.value) return programas.value;
    return programas.value.filter((p) => p.id_area === activeArea.value);
});

function getFormUrl(prog: any) {
    // Se o programa exige processo seletivo, vai pro formulário
    if (prog.exige_processo_seletivo) {
        const path = `/form/seletivo/estudante/${prog.id_area || "0"}/${prog.id}`;
        const query = prog.id_processo_seletivo
            ? `?id_processo_seletivo=${prog.id_processo_seletivo}`
            : "";
        const fullUrl = `${path}${query}`;
        if (!user.value) return `/login?redirectTo=${encodeURIComponent(fullUrl)}`;
        return fullUrl;
    }

    // Sem processo seletivo: matrícula direta → vai pro checkout
    const oferta = ofertasPorPrograma.value[prog.id]
    if (oferta?.slug) {
        const path = `/checkout/${oferta.slug}`
        if (!user.value) return `/login?redirectTo=${encodeURIComponent(path)}`
        return path
    }

    // Fallback: se não tem oferta nem processo, vai pro formulário genérico
    const path = `/form/seletivo/estudante/${prog.id_area || "0"}/${prog.id}`
    if (!user.value) return `/login?redirectTo=${encodeURIComponent(path)}`
    return path
}

function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    try {
        return new Intl.DateTimeFormat("pt-BR", {
            timeZone: BRAZIL_TIME_ZONE,
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

function formatValor(centavos: number): string {
    if (centavos <= 0) return "Grátis";
    return `R$ ${(centavos / 100).toFixed(2).replace(".", ",")}`;
}

onMounted(() => {
    fetchData();
});
</script>

<template>
    <div
        class="min-h-screen bg-[#0a0a0c] text-white font-sans overflow-x-hidden"
    >
        <header
            class="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5"
        >
            <div
                class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center"
                    >
                        <span class="text-white text-xs font-black">EC</span>
                    </div>
                    <div class="flex flex-col leading-tight">
                        <span class="text-sm font-black text-white"
                            >EduClick</span
                        >
                        <span
                            class="text-[8px] font-bold text-secondary/40 uppercase tracking-widest"
                            >Ensino que Transforma</span
                        >
                    </div>
                </div>
                <nav class="hidden md:flex items-center gap-8">
                    <NuxtLink
                        to="/"
                        class="text-xs font-bold text-secondary/50 hover:text-white transition-colors"
                        >Início</NuxtLink
                    >
                    <NuxtLink to="/oferta" class="text-xs font-bold text-white"
                        >Cursos</NuxtLink
                    >
                    <a
                        href="#sobre"
                        class="text-xs font-bold text-secondary/50 hover:text-white transition-colors"
                        >Sobre</a
                    >
                </nav>
                <NuxtLink
                    v-if="!user"
                    to="/login"
                    class="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                    >Entrar</NuxtLink
                >
                <NuxtLink
                    v-else
                    to="/meus-processos"
                    class="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                    >Meus Cursos</NuxtLink
                >
            </div>
        </header>

        <section class="relative py-20 px-6 overflow-hidden">
            <div
                class="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-30"
            />
            <div
                class="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
            />
            <div class="max-w-6xl mx-auto relative z-10 text-center">
                <span
                    class="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6"
                >
                    {{ areas.length }} Área(s) disponíveis
                </span>
                <h1 class="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                    Cursos e <span class="text-primary">Formações</span>
                </h1>
                <p
                    class="text-lg text-secondary/60 max-w-2xl mx-auto leading-relaxed"
                >
                    Escolha sua área, inscreva-se e transforme seu futuro com a
                    EduClick
                </p>
            </div>
        </section>

        <main class="max-w-7xl mx-auto px-6 pb-20">
            <div
                class="flex items-center justify-between mb-10 overflow-x-auto pb-2"
            >
                <div class="flex gap-2">
                    <button
                        @click="activeArea = null"
                        :class="[
                            'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border',
                            !activeArea
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                : 'bg-white/[0.04] text-secondary/50 border-white/5 hover:text-white hover:border-white/10',
                        ]"
                    >
                        Todas
                    </button>
                    <button
                        v-for="a in areas"
                        :key="a.id"
                        @click="activeArea = a.id"
                        :class="[
                            'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border',
                            activeArea === a.id
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                : 'bg-white/[0.04] text-secondary/50 border-white/5 hover:text-white hover:border-white/10',
                        ]"
                    >
                        {{ a.nome_area }}
                    </button>
                </div>
                <span
                    class="text-[10px] font-bold text-secondary/30 uppercase tracking-widest shrink-0 ml-4"
                    >{{ filteredProgramas.length }} programa(s)</span
                >
            </div>

            <div
                v-if="loading"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <div
                    v-for="i in 6"
                    :key="i"
                    class="bg-[#0f0f17] border border-white/5 rounded-xl h-[380px] animate-pulse"
                />
            </div>

            <div
                v-else-if="filteredProgramas.length === 0"
                class="text-center py-20"
            >
                <Icon
                    name="ph:folder-open-light"
                    class="w-16 h-16 text-secondary/20 mx-auto mb-4"
                />
                <p class="text-secondary font-bold">
                    Nenhum programa disponível no momento
                </p>
            </div>

            <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <div
                    v-for="prog in filteredProgramas"
                    :key="prog.id_processo_seletivo || prog.id"
                    class="group relative bg-[#0f0f17] border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:translate-y-[-4px] shadow-xl hover:shadow-primary/5 flex flex-col"
                >
                    <div
                        class="h-1 bg-gradient-to-r from-primary to-purple-500 opacity-30 group-hover:opacity-100 transition-opacity"
                    />

                    <div class="p-8 flex-1 flex flex-col">
                        <div class="flex items-center justify-between mb-6">
                            <span
                                class="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest"
                                >{{ prog.nome_area || "Educação" }}</span
                            >
                            <div class="flex items-center gap-2">
                                <span
                                    v-if="ofertasPorPrograma[prog.id]"
                                    :class="[
                                        'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest',
                                        ofertasPorPrograma[prog.id]
                                            .valor_centavos > 0
                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                            : 'bg-green-500/10 border border-green-500/20 text-green-400',
                                    ]"
                                >
                                    {{
                                        formatValor(
                                            ofertasPorPrograma[prog.id]
                                                .valor_centavos,
                                        )
                                    }}
                                </span>
                                <div
                                    class="flex items-center gap-1.5 text-secondary/60"
                                >
                                    <Icon
                                        name="ph:clock-bold"
                                        class="w-3.5 h-3.5"
                                    />
                                    <span class="text-[10px] font-bold"
                                        >{{
                                            prog.carga_horaria_total_horas
                                        }}h</span
                                    >
                                </div>
                            </div>
                        </div>

                        <h3
                            class="text-xl font-black mb-3 leading-tight group-hover:text-primary transition-colors"
                        >
                            {{ prog.nome_display }}
                        </h3>
                        <p
                            v-if="prog.nome_processo"
                            class="text-[10px] font-black text-primary/80 uppercase tracking-widest mb-3"
                        >
                            {{ prog.nome_processo }}
                        </p>
                        <p
                            class="text-xs text-secondary leading-relaxed line-clamp-2 mb-6 opacity-70"
                        >
                            {{
                                prog.descricao ||
                                "Conheça os detalhes deste programa acadêmico e inscreva-se agora."
                            }}
                        </p>

                        <div class="grid grid-cols-2 gap-4 mb-8">
                            <div class="flex flex-col gap-1">
                                <span
                                    class="text-[9px] font-black text-secondary/40 uppercase tracking-widest"
                                    >Início das Aulas</span
                                >
                                <span class="text-xs font-bold text-white/90">{{
                                    formatDate(prog.data_inicio_aula)
                                }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span
                                    class="text-[9px] font-black text-secondary/40 uppercase tracking-widest"
                                    >Inscrições Até</span
                                >
                                <span
                                    class="text-xs font-bold text-orange-400"
                                    >{{
                                        formatDate(prog.processo_seletivo_fim)
                                    }}</span
                                >
                            </div>
                        </div>

                        <div
                            class="mt-auto p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3"
                        >
                            <div
                                class="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0"
                            >
                                <Icon
                                    name="ph:user-plus-bold"
                                    class="w-4 h-4"
                                />
                            </div>
                            <div class="flex flex-col">
                                <span
                                    class="text-[8px] font-black text-secondary/40 uppercase tracking-widest"
                                    >Matrículas</span
                                >
                                <span
                                    class="text-[10px] font-bold text-green-500/80"
                                    >A partir de
                                    {{
                                        formatDate(prog.matricula_inicio)
                                    }}</span
                                >
                            </div>
                        </div>
                    </div>

                    <div class="p-6 bg-white/[0.02] border-t border-white/5">
                        <NuxtLink
                            v-if="!inscritos[prog.id_processo_seletivo]"
                            :to="getFormUrl(prog)"
                            class="w-full py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 block text-center"
                        >
                            {{ prog.exige_processo_seletivo ? 'Acessar' : ofertasPorPrograma[prog.id]?.valor_centavos > 0 ? 'Comprar' : 'Matricular' }}
                        </NuxtLink>
                        <div
                            v-else
                            class="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-default"
                        >
                            <Icon name="ph:seal-check-bold" class="w-4 h-4" />
                            Já Inscrito
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="py-12 border-t border-white/5 text-center bg-[#0a0a0c]">
            <div class="flex items-center justify-center gap-3 mb-6">
                <div
                    class="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center"
                >
                    <span class="text-white text-[8px] font-black">EC</span>
                </div>
                <span class="text-sm font-bold text-white">EduClick</span>
            </div>
            <p class="text-[10px] text-secondary/30">
                &copy; 2026 EduClick. Todos os direitos reservados.
            </p>
        </footer>
    </div>
</template>
