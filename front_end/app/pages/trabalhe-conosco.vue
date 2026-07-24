<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

const user = useSupabaseUser();

definePageMeta({ layout: false });

const loading = ref(true);
const enviando = ref(false);
const enviado = ref(false);
const errorMsg = ref("");
const editais = ref<any[]>([]);
const inscricoes = ref<Set<string>>(new Set());

const BRAZIL_TIME_ZONE = "America/Sao_Paulo";
const fallbackId = "00ca60ea-6667-482d-8a96-09b877707b08";
const idEntidade = computed(
    () => (useRoute().query.id_entidade as string) || fallbackId,
);

// ── Formulário ────────────────────────────────────────────
const form = ref({
    nome: "",
    email: "",
    telefone: "",
    minibio: "",
    id_edital: "",
});

const arquivoCurriculo = ref<File | null>(null);

async function fetchEditais() {
    try {
        const res = (await $fetch("/api/public/editais-docentes", {
            params: { id_entidade: idEntidade.value },
        })) as any;
        if (res?.success) editais.value = res.itens || [];
    } catch (e) {
        console.error("Erro ao carregar editais:", e);
    }
}

async function fetchInscricoes() {
    if (!user.value?.email) {
        loading.value = false;
        return;
    }
    try {
        const res = (await $fetch("/api/public/verificar-inscricoes", {
            params: { email: user.value.email },
        })) as any;
        if (res?.success && res.ids) {
            inscricoes.value = new Set(res.ids);
        }
    } catch (e) {
        console.error("Erro ao carregar inscrições:", e);
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await Promise.all([fetchEditais(), fetchInscricoes()]);
});

async function handleUpload(): Promise<string | null> {
    if (!arquivoCurriculo.value) return null;

    const formData = new FormData();
    formData.append("file", arquivoCurriculo.value);
    formData.append("id_entidade", idEntidade.value);

    try {
        const res = (await $fetch("/api/r2/upload", {
            method: "POST",
            body: formData,
        })) as any;
        return res?.id || null;
    } catch {
        errorMsg.value = "Erro ao fazer upload do currículo.";
        return null;
    }
}

async function handleSubmit() {
    errorMsg.value = "";
    enviando.value = true;

    // Validação
    if (!form.value.nome.trim()) {
        errorMsg.value = "Nome é obrigatório.";
        enviando.value = false;
        return;
    }
    if (!form.value.email.trim()) {
        errorMsg.value = "Email é obrigatório.";
        enviando.value = false;
        return;
    }

    // Upload do currículo
    const idCurriculo = await handleUpload();
    if (arquivoCurriculo.value && !idCurriculo) {
        enviando.value = false;
        return;
    }

    // Envio dos dados (via endpoint público)
    try {
        const res = (await $fetch("/api/public/enviar-curriculo", {
            method: "POST",
            body: {
                id_entidade: idEntidade.value,
                nome: form.value.nome.trim(),
                email: form.value.email.trim(),
                telefone: form.value.telefone.trim() || null,
                minibio: form.value.minibio.trim() || null,
                id_curriculo: idCurriculo,
                id_edital: form.value.id_edital || null,
            },
        })) as any;

        if (res?.success) {
            enviado.value = true;
        } else {
            errorMsg.value = "Erro ao enviar currículo. Tente novamente.";
        }
    } catch {
        errorMsg.value = "Erro ao enviar currículo. Tente novamente.";
    } finally {
        enviando.value = false;
    }
}

function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length && target.files[0]) {
        arquivoCurriculo.value = target.files[0];
    }
}

onMounted(() => {
    fetchEditais();
});
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-primary/30">
        <!-- Header -->
        <header
            class="sticky top-0 z-50 bg-[#0f0f17]/80 backdrop-blur-md border-b border-white/5 px-6 py-4"
        >
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20"
                    >
                        <Icon
                            name="ph:graduation-cap-fill"
                            class="w-5 h-5 text-white"
                        />
                    </div>
                    <div class="flex flex-col leading-none">
                        <span
                            class="text-xs font-black text-text uppercase tracking-[0.2em]"
                        >
                            EduClick
                        </span>
                        <span
                            class="text-[9px] text-secondary/40 font-bold uppercase tracking-[0.2em]"
                        >
                            Trabalhe Conosco
                        </span>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <NuxtLink
                        to="/"
                        class="text-xs font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors"
                    >
                        Início
                    </NuxtLink>
                    <NuxtLink
                        to="/oferta"
                        class="text-xs font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors"
                    >
                        Cursos
                    </NuxtLink>
                </div>
            </div>
        </header>

        <!-- Hero -->
        <section class="relative overflow-hidden">
            <div
                class="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full"
            />
            <div
                class="relative max-w-5xl mx-auto px-6 py-20 text-center"
            >
                <h1
                    class="text-4xl md:text-5xl font-black mb-4 tracking-tight"
                >
                    Trabalhe Conosco
                </h1>
                <p class="text-lg text-secondary/80 max-w-2xl mx-auto font-medium">
                    Faça parte do nosso time de educadores. Envie seu currículo
                    e participe dos processos seletivos abertos.
                </p>
            </div>
        </section>

        <!-- Conteúdo Principal -->
        <main class="max-w-5xl mx-auto px-6 pb-20 space-y-12">
            <!-- Loading -->
            <div
                v-if="loading"
                class="flex items-center justify-center py-16"
            >
                <div
                    class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
                />
            </div>

            <template v-else>
                <!-- Editais Abertos -->
                <section v-if="editais.length > 0">
                    <h2
                        class="text-xl font-black mb-6 tracking-tight flex items-center gap-3"
                    >
                        <Icon
                            name="ph:clipboard-text-light"
                            class="w-6 h-6 text-primary"
                        />
                        Editais Abertos
                    </h2>
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <div
                            v-for="edital in editais"
                            :key="edital.id"
                            class="group relative bg-[#0f0f17] border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:translate-y-[-4px] shadow-xl hover:shadow-primary/5 flex flex-col p-6"
                        >
                            <div
                                class="h-1 bg-gradient-to-r from-primary to-purple-500 opacity-30 group-hover:opacity-100 absolute top-0 left-0 right-0 transition-opacity"
                            />
                            <div class="flex flex-col gap-3">
                                <div class="flex items-start justify-between gap-4">
                                    <h3
                                        class="text-lg font-black text-text"
                                    >
                                        {{ edital.nome }}
                                    </h3>
                                    <span
                                        class="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest shrink-0"
                                    >
                                        Aberto
                                    </span>
                                </div>
                                <p
                                    v-if="edital.descricao"
                                    class="text-sm text-secondary/60"
                                >
                                    {{ edital.descricao }}
                                </p>
                                <div
                                    class="flex items-center gap-2 text-[10px] text-secondary/40 font-bold uppercase tracking-wider"
                                >
                                    <Icon
                                        name="ph:calendar-light"
                                        class="w-4 h-4"
                                    />
                                    {{ new Date(edital.data_ini + "T00:00:00").toLocaleDateString("pt-BR") }}
                                    —
                                    {{ new Date(edital.data_fim + "T00:00:00").toLocaleDateString("pt-BR") }}
                                </div>
                                <template v-if="inscricoes.has(edital.id)">
                                    <span class="w-full mt-2 px-8 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest inline-block text-center cursor-default">
                                        <Icon name="ph:check-circle-bold" class="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                                        Inscrito
                                    </span>
                                </template>
                                <NuxtLink v-else
                                    :to="`/inscricao-edital/${edital.id}`"
                                    class="w-full mt-2 px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 inline-block text-center"
                                >
                                    Inscrever-se
                                </NuxtLink>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Formulário de Envio -->
                <section>
                    <div
                        class="bg-[#0f0f17] border border-white/5 rounded-xl p-8"
                    >
                        <div class="flex items-center gap-3 mb-8">
                            <Icon
                                name="ph:envelope-light"
                                class="w-6 h-6 text-primary"
                            />
                            <h2 class="text-xl font-black tracking-tight">
                                Envio de Currículo
                            </h2>
                        </div>

                        <!-- Sucesso -->
                        <div
                            v-if="enviado"
                            class="flex flex-col items-center justify-center py-12 text-center"
                        >
                            <div
                                class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4"
                            >
                                <Icon
                                    name="ph:check-circle-bold"
                                    class="w-8 h-8 text-emerald-400"
                                />
                            </div>
                            <h3
                                class="text-lg font-black text-emerald-400 mb-2"
                            >
                                Currículo Recebido!
                            </h3>
                            <p class="text-secondary/60 max-w-md">
                                Obrigado pelo interesse! Entraremos em contato
                                se houver uma oportunidade compatível com seu
                                perfil.
                            </p>
                        </div>

                        <!-- Formulário -->
                        <form
                            v-else
                            @submit.prevent="handleSubmit"
                            class="grid grid-cols-1 md:grid-cols-2 gap-5"
                        >
                            <!-- Nome -->
                            <div class="flex flex-col gap-1.5">
                                <label
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60"
                                >
                                    Nome completo *
                                </label>
                                <input
                                    v-model="form.nome"
                                    type="text"
                                    placeholder="Seu nome"
                                    class="field-input"
                                    required
                                />
                            </div>

                            <!-- Email -->
                            <div class="flex flex-col gap-1.5">
                                <label
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60"
                                >
                                    Email *
                                </label>
                                <input
                                    v-model="form.email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    class="field-input"
                                    required
                                />
                            </div>

                            <!-- Telefone -->
                            <div class="flex flex-col gap-1.5">
                                <label
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60"
                                >
                                    Telefone
                                </label>
                                <input
                                    v-model="form.telefone"
                                    type="tel"
                                    placeholder="(11) 99999-8888"
                                    class="field-input"
                                />
                            </div>

                            <!-- Edital (opcional) -->
                            <div
                                v-if="editais.length > 0"
                                class="flex flex-col gap-1.5"
                            >
                                <label
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60"
                                >
                                    Vincular a Edital (opcional)
                                </label>
                                <select
                                    v-model="form.id_edital"
                                    class="field-input"
                                >
                                    <option value="">
                                        Sem edital
                                    </option>
                                    <option
                                        v-for="e in editais"
                                        :key="e.id"
                                        :value="e.id"
                                    >
                                        {{ e.nome }}
                                    </option>
                                </select>
                            </div>

                            <!-- Mini bio (full width) -->
                            <div
                                class="flex flex-col gap-1.5 md:col-span-2"
                            >
                                <label
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60"
                                >
                                    Mini bio / Quem é você?
                                </label>
                                <textarea
                                    v-model="form.minibio"
                                    placeholder="Conte um pouco sobre sua formação, experiência e áreas de interesse..."
                                    rows="3"
                                    class="field-input resize-none"
                                />
                            </div>

                            <!-- Upload Currículo -->
                            <div
                                class="flex flex-col gap-1.5 md:col-span-2"
                            >
                                <label
                                    class="text-[10px] font-black uppercase tracking-widest text-secondary/60"
                                >
                                    Currículo (PDF, DOC)
                                </label>
                                <label
                                    class="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.03] cursor-pointer hover:border-primary/30 hover:bg-white/[0.06] transition-all"
                                >
                                    <Icon
                                        name="ph:upload-light"
                                        class="w-5 h-5 text-secondary/40"
                                    />
                                    <span
                                        class="text-xs font-bold"
                                        :class="
                                            arquivoCurriculo
                                                ? 'text-primary'
                                                : 'text-secondary/40'
                                        "
                                    >
                                        {{
                                            arquivoCurriculo
                                                ? arquivoCurriculo.name
                                                : "Clique para selecionar um arquivo"
                                        }}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        class="hidden"
                                        @change="handleFileChange"
                                    />
                                </label>
                            </div>

                            <!-- Erro -->
                            <div
                                v-if="errorMsg"
                                class="md:col-span-2 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                            >
                                {{ errorMsg }}
                            </div>

                            <!-- Submit -->
                            <div class="md:col-span-2 pt-2">
                                <button
                                    type="submit"
                                    :disabled="enviando"
                                    class="w-full md:w-auto px-10 py-3.5 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <div
                                        v-if="enviando"
                                        class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                    />
                                    <Icon
                                        v-else
                                        name="ph:paper-plane-right-bold"
                                        class="w-4 h-4"
                                    />
                                    <span>Enviar Currículo</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </template>
        </main>

        <!-- Footer -->
        <footer
            class="border-t border-white/5 py-8 text-center"
        >
            <p
                class="text-[10px] text-secondary/30 font-black tracking-[0.3em] uppercase"
            >
                EduClick :: Min
            </p>
        </footer>
    </div>
</template>

<style scoped>
.field-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 9px;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 700;
    color: rgba(232, 230, 240, 0.9);
    outline: none;
    transition: all 0.15s ease;
}
.field-input:focus {
    border-color: rgba(139, 92, 246, 0.45);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.field-input::placeholder {
    color: rgba(255, 255, 255, 0.22);
}
select.field-input {
    background-color: #16161e;
}
</style>
