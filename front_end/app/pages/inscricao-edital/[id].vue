<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { buscarCEP, mascaraCEP, CEP_DEPENDENT_FIELDS } from "~/utils/viacep";
import { validarCPF } from "~/utils/cpf";

definePageMeta({ layout: false });

const route = useRoute();
const editalId = route.params.id as string;
const supabase = useSupabaseClient();

// ── Etapas ────────────────────────────────────────────────
type Etapa = "auth" | "criar-conta" | "loading" | "form" | "sucesso" | "erro" | "ja-inscrito";
const etapa = ref<Etapa>("auth");
const errorMsg = ref("");

// ── Dados do edital ──────────────────────────────────────
const edital = ref<any>(null);
const perguntas = ref<any[]>([]);
const respostas = ref<Record<string, string>>({});

const jaInscrito = ref<any>(null);

const fallbackId = "00ca60ea-6667-482d-8a96-09b877707b08";
const idEntidade = computed(() => (route.query.id_entidade as string) || fallbackId);

let userExpandidoId = "";
let userEmail = "";

// ═══════════════════════════════════════════════════════════
// ETAPA 1: AUTH
// ═══════════════════════════════════════════════════════════
const authEmail = ref("");
const authPassword = ref("");
const authConfirmarSenha = ref("");
const showPassword = ref(false);
const showPasswordCriar = ref(false);
const showConfirmarSenha = ref(false);
const authNome = ref("");
const podeCriarConta = ref(false);

async function verificarEmail() {
    if (!authEmail.value.trim()) return;
    try {
        const res = await $fetch("/api/auth/verificar-email", {
            params: { email: authEmail.value.trim() },
        }) as any;
        if (res?.pode_criar_conta) {
            podeCriarConta.value = true;
            userExpandidoId = res.id_user_expandido;
            authNome.value = res.nome || "";
        } else if (res?.existe) {
            podeCriarConta.value = false;
        } else {
            // Email não existe — vai criar conta nova
            podeCriarConta.value = true;
            userExpandidoId = "";
        }
    } catch { /* silent */ }
}

async function fazerLogin() {
    etapa.value = "loading";
    errorMsg.value = "";
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: authEmail.value.trim(),
            password: authPassword.value,
        });
        if (error) throw error;
        userEmail = authEmail.value.trim();
        await carregarForm();
    } catch (e: any) {
        errorMsg.value = e.message || "Erro ao fazer login.";
        etapa.value = "auth";
    }
}

async function criarConta() {
    if (!authNome.value.trim()) { errorMsg.value = "Nome é obrigatório."; return; }
    if (authPassword.value.length < 6) { errorMsg.value = "Senha deve ter no mínimo 6 caracteres."; return; }
    if (authPassword.value !== authConfirmarSenha.value) { errorMsg.value = "Senhas não conferem."; return; }

    etapa.value = "loading";
    errorMsg.value = "";
    try {
        errorMsg.value = "Criando conta...";

        // Tenta criar conta
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: authEmail.value.trim(),
            password: authPassword.value,
            options: { data: { nome: authNome.value.trim() } },
        });

        let authUserId: string | undefined;

        if (signUpError) {
            // Se já existe, tenta login para obter o ID
            if (signUpError.message?.includes("already exists") || signUpError.message?.includes("User already registered")) {
                errorMsg.value = "Conta já existe. Fazendo login...";
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email: authEmail.value.trim(),
                    password: authPassword.value,
                });
                if (loginError) throw new Error("Email já cadastrado. Faça login com sua senha.");
                authUserId = loginData?.user?.id;
            } else {
                throw signUpError;
            }
        } else {
            authUserId = authData?.user?.id;
        }

        if (!authUserId) throw new Error("Erro ao obter ID do usuário.");

        errorMsg.value = "Vinculando conta...";

        // Vincula auth user ao user_expandido (cria se não existir)
        await $fetch("/api/auth/vincular-conta", {
            method: "POST",
            body: {
                id_user_expandido: userExpandidoId || "",  // BFF cria se vazio
                id_user: authUserId,
                email: authEmail.value.trim(),
                nome: authNome.value.trim(),
            },
        }).catch((err) => {
            console.warn("[vincular] Falha no vínculo:", err.message);
        });

        // Garante sessão (força refresh para pegar o papel)
        await supabase.auth.refreshSession();

        errorMsg.value = "Carregando formulário...";
        userEmail = authEmail.value.trim();
        userExpandidoId = userExpandidoId || authUserId;
        await carregarForm();
    } catch (e: any) {
        console.error("[criarConta] Erro:", e?.message || e);
        errorMsg.value = e.message || "Erro ao criar conta.";
        // Só volta para auth se ainda estiver em loading (não sobrescreve erro do form)
        if (etapa.value === "loading") {
            etapa.value = "auth";
        }
    }
}

// ═══════════════════════════════════════════════════════════
// ETAPA 2: FORMULÁRIO
// ═══════════════════════════════════════════════════════════
async function carregarForm() {
    errorMsg.value = "";
    try {
        // Carrega edital
        const resEditais = await $fetch("/api/public/editais-docentes", {
            params: { id_entidade: idEntidade.value },
        }) as any;
        const ed = (resEditais?.itens || []).find((e: any) => e.id === editalId);
        if (!ed) { errorMsg.value = "Edital não encontrado."; etapa.value = "erro"; return; }
        edital.value = ed;

        // Carrega form config (autenticado agora)
        if (ed.id_form_config) {
            const resForm = await $fetch("/api/formularios/form_config", {
                params: {
                    id_entidade: idEntidade.value,
                    area_id: null,
                    programa_id: null,
                    escopo: "global",
                    tipo_proc: "seletivo",
                    tipo_cand: "docente",
                },
            }) as any;

            if (resForm?.success) {
                console.log("[carregarForm] itens da RPC:", JSON.stringify(resForm.itens, null, 2));

                const sysQuestions = [
                    { pergunta_id: "sys-nome", label: "Nome", tipo_pergunta: "text", largura: "1", obrigatorio: true, placeholder: "Seu nome", disabled: true },
                    { pergunta_id: "sys-email", label: "E-mail", tipo_pergunta: "email", largura: "1", obrigatorio: true, disabled: true, placeholder: userEmail },
                ];

                // Remove perguntas duplicadas — por ID, label OU tipo
                const sysKeys = sysQuestions.map(q => q.pergunta_id);
                const sysLabels = sysQuestions.map(q => q.label.toLowerCase());
                const seenKeys = new Set<string>();
                const seenTipoLabel = new Set<string>();

                const itensFiltrados = (resForm.itens || []).filter((item: any) => {
                    const key = item.pergunta_id || item.id;
                    const label = (item.pergunta_label || item.label || "").toLowerCase();
                    const tipo = item.pergunta_tipo || item.tipo_pergunta || "";
                    const tipoLabelKey = `${tipo}::${label}`;

                    // Pula sys-*
                    if (sysKeys.includes(key)) return false;
                    if (sysLabels.includes(label)) return false;

                    // Pula se já viu este pergunta_id
                    if (seenKeys.has(key)) return false;
                    seenKeys.add(key);

                    // Pula se já viu mesma combinação tipo+label
                    if (seenTipoLabel.has(tipoLabelKey)) return false;
                    seenTipoLabel.add(tipoLabelKey);

                    return true;
                });

                console.log("[carregarForm] itens filtrados:", itensFiltrados.length, "sys:", sysQuestions.length);

                perguntas.value = [...sysQuestions, ...itensFiltrados];

                // Garantia: remove qualquer duplicata remanescente por pergunta_id
                const uniqueKeys = new Set<string>();
                perguntas.value = perguntas.value.filter((p: any) => {
                    const key = p.pergunta_id || p.id;
                    if (uniqueKeys.has(key)) return false;
                    uniqueKeys.add(key);
                    return true;
                });

                console.log("[carregarForm] total perguntas:", perguntas.value.length, "itens:", JSON.stringify(perguntas.value.map((p: any) => ({ id: p.pergunta_id || p.id, label: p.pergunta_label || p.label }))));

                // DEBUG DETALHADO
                console.log("===== PERGUNTAS FINAIS =====");
                perguntas.value.forEach((p: any, i: number) => {
                    console.log(`[${i}] id=${p.pergunta_id || p.id} label=${p.pergunta_label || p.label} tipo=${p.pergunta_tipo || p.tipo_pergunta} disabled=${p.disabled}`);
                });
                console.log("============================");

                // Preenche nome e email
                respostas.value["sys-nome"] = authNome.value || "";
                respostas.value["sys-email"] = userEmail;
            }
        }
        etapa.value = "form";
    } catch (e: any) {
        console.error("[carregarForm] Erro:", e?.message || e, e?.stack || "");
        errorMsg.value = e.message || "Erro ao carregar formulário.";
        etapa.value = "erro";
    }
}

// ═══════════════════════════════════════════════════════════
// SUBMISSÃO
// ═══════════════════════════════════════════════════════════
const submitting = ref(false);
const cpfError = ref("");
const currentFileId = ref<string | null>(null);
const fileInputEl = ref<HTMLInputElement | null>(null);

function onFileTrigger(p: any) {
    currentFileId.value = p.pergunta_id || p.id;
    fileInputEl.value?.click();
}

function onFileChange(e: Event) {
    const id = currentFileId.value;
    if (!id) return;
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        respostas.value[id] = file.name;
    }
    target.value = "";
    currentFileId.value = null;
}

function validarCpfInline() {
    const cpfPergunta = perguntas.value.find(
        (p: any) => (p.pergunta_tipo || p.tipo_pergunta) === "cpf",
    );
    if (!cpfPergunta) return;
    const valor = respostas.value[cpfPergunta.pergunta_id || cpfPergunta.id];
    if (!valor || valor.replace(/\D/g, "").length < 11) {
        cpfError.value = "";
        return;
    }
    cpfError.value = validarCPF(valor) ? "" : "CPF inválido";
}

async function handleSubmit() {
    submitting.value = true;
    errorMsg.value = "";

    // Valida CPF antes de enviar
    const cpfPergunta = perguntas.value.find(
        (p: any) => (p.pergunta_tipo || p.tipo_pergunta) === "cpf",
    );
    if (cpfPergunta) {
        const cpfValor = respostas.value[cpfPergunta.pergunta_id || cpfPergunta.id];
        if (cpfValor && !validarCPF(cpfValor)) {
            errorMsg.value = "CPF inválido. Verifique o número informado.";
            cpfError.value = "CPF inválido";
            submitting.value = false;
            return;
        }
    }

    try {
        const res = await $fetch("/api/public/inscrever-edital", {
            method: "POST",
            body: {
                id_edital: editalId,
                id_entidade: idEntidade.value,
                respostas: respostas.value,
            },
        }) as any;
        if (res?.success) {
            etapa.value = "sucesso";
        } else {
            errorMsg.value = res?.message || "Erro ao inscrever.";
        }
    } catch (e: any) {
        errorMsg.value = e.message || "Erro ao inscrever.";
    } finally {
        submitting.value = false;
    }
}

// ── CEP ───────────────────────────────────────────────────
function mascaraCpf(v: string) {
    return v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
const cepPreencheu = ref(false);
async function onCepInput(perguntaId: string, valor: string) {
    const mascarado = mascaraCEP(valor);
    respostas.value[perguntaId] = mascarado;
    if (mascarado.replace(/\D/g, "").length === 8) {
        const endereco = await buscarCEP(mascarado);
        if (endereco && !endereco.erro) {
            cepPreencheu.value = true;
            Object.entries({ endereco: endereco.logradouro, bairro: endereco.bairro, cidade: endereco.localidade, estado: endereco.uf })
                .forEach(([nomeInterno, valor]) => {
                    const pergunta = perguntas.value.find((p: any) => (p.pergunta_nome_interno || p.nome_interno) === nomeInterno);
                    if (pergunta) respostas.value[pergunta.pergunta_id || pergunta.id] = valor;
                });
        }
    }
}
function isEnderecoDisabled(p: any): boolean {
    return cepPreencheu.value && CEP_DEPENDENT_FIELDS.includes(p.pergunta_nome_interno || p.nome_interno || "");
}

onMounted(async () => {
    // Carrega edital info básica
    $fetch("/api/public/editais-docentes", { params: { id_entidade: idEntidade.value } })
        .then((res: any) => {
            const ed = (res?.itens || []).find((e: any) => e.id === editalId);
            if (ed) edital.value = ed;
        })
        .catch(() => {});

    // Verifica se já está logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    userEmail = user.email;
    authEmail.value = user.email;
    authNome.value = user.user_metadata?.nome || "";
    userExpandidoId = user.id;

    // Verifica se já está inscrito neste edital
    try {
        const resInscricao = await $fetch("/api/public/verificar-inscricoes", {
            params: { email: user.email },
        });
        const data = resInscricao as any;
        if (data?.success && data.ids?.includes(editalId)) {
            jaInscrito.value = {
                criado_em: data.inscricoes?.[editalId] || null,
            };
            etapa.value = "ja-inscrito";
            return;
        }
    } catch { /* silent */ }

    // Não está inscrito → carrega form
    etapa.value = "loading";
    await carregarForm();
});

async function logout() {
    await supabase.auth.signOut();
    etapa.value = "auth";
    authEmail.value = "";
    authPassword.value = "";
    authNome.value = "";
    podeCriarConta.value = false;
    userExpandidoId = "";
    userEmail = "";
    edital.value = null;
    perguntas.value = [];
}
</script>

<template>
    <div class="min-h-screen bg-[#0a0a0c] text-white font-sans">
        <header class="sticky top-0 z-50 bg-[#0f0f17]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
            <div class="max-w-3xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Icon name="ph:graduation-cap-fill" class="w-5 h-5 text-white" />
                    </div>
                    <span class="text-xs font-black text-text uppercase tracking-[0.2em]">EduClick</span>
                </div>
                <div class="flex items-center gap-3">
                    <button v-if="etapa === 'form'" @click="logout"
                        class="text-xs font-bold uppercase tracking-widest text-secondary/40 hover:text-red-400 transition-colors flex items-center gap-1.5">
                        <Icon name="ph:sign-out-light" class="w-4 h-4" />
                        Sair
                    </button>
                    <NuxtLink to="/trabalhe-conosco" class="text-xs font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors">Voltar</NuxtLink>
                </div>
            </div>
        </header>

        <main class="max-w-3xl mx-auto px-6 py-12">
            <div class="bg-[#0f0f17] border border-white/5 rounded-xl p-8">
                <div class="mb-6">
                    <h1 class="text-xl font-black">{{ edital?.nome || "Inscrição" }}</h1>
                    <p v-if="edital?.descricao" class="text-sm text-secondary/60 mt-1">{{ edital.descricao }}</p>
                </div>

                <!-- ETAPA: AUTH / LOGIN -->
                <div v-if="etapa === 'auth'" class="space-y-4 max-w-md mx-auto">
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">E-mail</label>
                        <input v-model="authEmail" type="email" placeholder="seu@email.com"
                            @blur="verificarEmail"
                            class="field-input mt-1" />
                    </div>

                    <div v-if="!podeCriarConta && authEmail">
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Senha</label>
                        <div class="relative mt-1">
                            <input v-model="authPassword" :type="showPassword ? 'text' : 'password'" placeholder="Sua senha"
                                @keyup.enter="fazerLogin" class="field-input pr-10" />
                            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-white transition-colors">
                                <Icon :name="showPassword ? 'ph:eye-closed-light' : 'ph:eye-light'" class="w-4 h-4" />
                            </button>
                        </div>
                        <button @click="fazerLogin" class="w-full mt-4 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                            Entrar e Inscrever-se
                        </button>
                    </div>

                    <div v-if="podeCriarConta && authEmail" class="space-y-3">
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Nome completo</label>
                            <input v-model="authNome" type="text" placeholder="Seu nome" class="field-input mt-1" />
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Senha</label>
                            <div class="relative mt-1">
                                <input v-model="authPassword" :type="showPasswordCriar ? 'text' : 'password'" placeholder="Mínimo 6 caracteres" class="field-input pr-10" />
                                <button type="button" @click="showPasswordCriar = !showPasswordCriar" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-white transition-colors">
                                    <Icon :name="showPasswordCriar ? 'ph:eye-closed-light' : 'ph:eye-light'" class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Confirmar senha</label>
                            <div class="relative mt-1">
                                <input v-model="authConfirmarSenha" :type="showConfirmarSenha ? 'text' : 'password'" placeholder="Repita a senha" class="field-input pr-10" />
                                <button type="button" @click="showConfirmarSenha = !showConfirmarSenha" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-white transition-colors">
                                    <Icon :name="showConfirmarSenha ? 'ph:eye-closed-light' : 'ph:eye-light'" class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <button @click="criarConta" class="w-full mt-2 py-3 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                            Criar Conta e Inscrever-se
                        </button>
                    </div>

                    <div v-if="errorMsg" class="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{{ errorMsg }}</div>
                </div>

                <!-- ETAPA: LOADING -->
                <div v-else-if="etapa === 'loading'" class="flex flex-col items-center justify-center py-12 gap-4">
                    <div class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
                    <span class="text-xs font-bold text-secondary/60">{{ errorMsg || "Carregando..." }}</span>
                </div>

                <!-- ETAPA: FORMULÁRIO -->
                <div v-else-if="etapa === 'form'" class="space-y-6">
                    <form @submit.prevent="handleSubmit">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                            <div v-for="p in perguntas" :key="p.pergunta_id || p.id"
                                :style="{ gridColumn: 'span ' + (p.largura || '1') }"
                                class="flex flex-col gap-1.5">
                                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                                    {{ p.pergunta_label || p.label }}
                                    <span v-if="p.obrigatorio" class="text-primary ml-1">*</span>
                                </label>

                            <template v-if="['text','email'].includes(p.pergunta_tipo || p.tipo_pergunta)">
                                <input v-model="respostas[p.pergunta_id || p.id]"
                                    :type="(p.pergunta_tipo || p.tipo_pergunta) === 'email' ? 'email' : 'text'"
                                    :disabled="p.disabled"
                                    :placeholder="p.pergunta_placeholder || p.placeholder"
                                    class="field-input disabled:opacity-40" />
                            </template>

                            <template v-else-if="(p.pergunta_tipo || p.tipo_pergunta) === 'cpf'">
                                <input
                                    :value="mascaraCpf(respostas[p.pergunta_id || p.id] || '')"
                                    @input="respostas[p.pergunta_id || p.id] = mascaraCpf(($event.target as HTMLInputElement).value); validarCpfInline()"
                                    type="text" maxlength="14" placeholder="000.000.000-00" class="field-input" />
                                <span v-if="cpfError" class="text-[10px] font-bold text-red-400 mt-1">{{ cpfError }}</span>
                            </template>

                            <input v-else-if="(p.pergunta_tipo || p.tipo_pergunta) === 'cep'"
                                :value="respostas[p.pergunta_id || p.id] || ''"
                                @input="onCepInput(p.pergunta_id || p.id, ($event.target as HTMLInputElement).value)"
                                type="text" maxlength="9" placeholder="00000-000" class="field-input" />

                            <input v-else-if="(p.pergunta_tipo || p.tipo_pergunta) === 'endereco'"
                                v-model="respostas[p.pergunta_id || p.id]"
                                type="text" :disabled="isEnderecoDisabled(p)"
                                :placeholder="p.pergunta_placeholder || p.placeholder"
                                class="field-input disabled:opacity-40 disabled:cursor-not-allowed" />

                            <textarea v-else-if="(p.pergunta_tipo || p.tipo_pergunta) === 'textarea'"
                                v-model="respostas[p.pergunta_id || p.id]"
                                :placeholder="p.pergunta_placeholder || p.placeholder"
                                rows="3" class="field-input resize-none"></textarea>

                            <input v-else-if="['data','date'].includes(p.pergunta_tipo || p.tipo_pergunta)"
                                v-model="respostas[p.pergunta_id || p.id]" type="date" class="field-input" />

                            <select v-else-if="(p.pergunta_tipo || p.tipo_pergunta) === 'select'"
                                v-model="respostas[p.pergunta_id || p.id]" class="field-input">
                                <option value="">Selecione...</option>
                                <option v-for="opt in (p.pergunta_opcoes || p.opcoes || [])" :key="opt.v || opt" :value="opt.v || opt">{{ opt.l || opt }}</option>
                            </select>

                            <div v-else-if="['file','foto'].includes(p.pergunta_tipo || p.tipo_pergunta)"
                                @click="onFileTrigger(p)"
                                class="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-xl px-4 cursor-pointer hover:border-primary/30 transition-all"
                                style="height: 36px">
                                <span class="text-xs text-secondary/40 truncate mr-2">
                                    {{ respostas[p.pergunta_id || p.id] || p.pergunta_placeholder || p.placeholder || 'Anexar arquivo' }}
                                </span>
                                <Icon name="ph:upload-simple-light" class="w-4 h-4 text-secondary/40 flex-shrink-0" />
                            </div>

                            <input v-else v-model="respostas[p.pergunta_id || p.id]" type="text" class="field-input" />
                            </div>
                        </div>

                        <div v-if="errorMsg" class="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mb-6">{{ errorMsg }}</div>

                        <input ref="fileInputEl" type="file" class="hidden" @change="onFileChange" />

                        <button type="submit" :disabled="submitting"
                            class="w-full py-4 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                            <div v-if="submitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Enviar Inscrição</span>
                        </button>
                    </form>
                </div>

                <!-- ETAPA: JA INSCRITO -->
                <div v-else-if="etapa === 'ja-inscrito'" class="text-center py-12">
                    <div class="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <Icon name="ph:check-circle-bold" class="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 class="text-2xl font-black mb-3">Inscrição já realizada!</h2>
                    <p class="text-secondary/60">
                        Você já está inscrito no edital <strong>{{ edital?.nome }}</strong>.
                    </p>
                    <p v-if="jaInscrito?.criado_em" class="text-xs text-secondary/40 mt-2">
                        Inscrição enviada em {{ new Date(jaInscrito.criado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) }}
                    </p>
                    <NuxtLink to="/trabalhe-conosco" class="inline-block mt-8 px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">Voltar</NuxtLink>
                </div>

                <!-- ETAPA: SUCESSO -->
                <div v-else-if="etapa === 'sucesso'" class="text-center py-12">
                    <div class="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <Icon name="ph:check-circle-bold" class="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 class="text-2xl font-black mb-3">Inscrição Realizada!</h2>
                    <p class="text-secondary/60">Sua inscrição no edital <strong>{{ edital?.nome }}</strong> foi recebida.</p>
                    <NuxtLink to="/trabalhe-conosco" class="inline-block mt-8 px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">Voltar</NuxtLink>
                </div>

                <!-- ETAPA: ERRO -->
                <div v-else-if="etapa === 'erro'" class="py-8">
                    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                        <Icon name="ph:warning-circle-bold" class="w-10 h-10 text-red-400 mx-auto mb-4" />
                        <p class="text-sm font-bold text-red-400">{{ errorMsg || "Erro ao carregar o formulário." }}</p>
                    </div>
                </div>

            </div>
        </main>
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
.field-input:focus { border-color: rgba(139, 92, 246, 0.45); box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
.field-input::placeholder { color: rgba(255, 255, 255, 0.22); }
select.field-input { background-color: #16161e; }
</style>
