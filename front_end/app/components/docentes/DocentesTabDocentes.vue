<script setup lang="ts">
import { ref } from "vue";
import type { UseDocentesListaReturn } from "~/composables/docentes/useDocentesLista";

const props = defineProps<{
    ctx: UseDocentesListaReturn;
    idEntidade: string;
}>();

const emit = defineEmits<{
    (e: "novo-docente"): void;
    (e: "editar-docente", docente: any): void;
    (e: "editar-vinculos", docente: any): void;
}>();

// ── Código de verificação ───────────────────────────
const showCodigoModal = ref(false);
const codigoGerado = ref("");
const codigoExpira = ref("");
const codigoDocenteNome = ref("");
const generatingCodigo = ref(false);
const codigoError = ref("");

async function gerarCodigo(docente: any) {
    generatingCodigo.value = true;
    codigoError.value = "";
    codigoDocenteNome.value = docente.nome_completo;
    try {
        const res = (await $fetch("/api/docentes/gerar-codigo", {
            method: "POST",
            body: { id_user_expandido: docente.id_user_expandido },
        })) as any;
        if (res?.success) {
            codigoGerado.value = res.codigo;
            codigoExpira.value = res.expira_em || "30 min";
            showCodigoModal.value = true;
        } else {
            codigoError.value = res?.message || "Erro ao gerar código.";
        }
    } catch (e: any) {
        codigoError.value = e?.message || "Erro ao gerar código.";
    } finally {
        generatingCodigo.value = false;
    }
}

// ── Link de autocadastro ────────────────────────────
const showLinkModal = ref(false);
const generatedLink = ref("");
const generatingLink = ref(false);
const linkError = ref("");
const linkCopied = ref(false);
const linkConviteId = ref("");
const linkEmail = ref("");
const linkNome = ref("");
const showLinkForm = ref(false);
const sendingInvite = ref(false);
const inviteSent = ref(false);

// ── Convidar docente p/ login ─────────────────────────
const convidando = ref<string | null>(null);

async function convidarDocente(docente: any) {
    convidando.value = docente.id;
    try {
        const res = (await $fetch("/api/docentes/enviar-convite-login", {
            method: "POST",
            body: {
                id_docente: docente.id,
                email: docente.email,
                nome: docente.nome_completo,
            },
        })) as any;
        if (res?.success) {
            // Feedback: toast simples
            console.log("Convite enviado para", docente.email);
        }
    } catch {
        // silent
    } finally {
        convidando.value = null;
    }
}

async function gerarLink() {
    linkEmail.value = "";
    linkNome.value = "";
    showLinkForm.value = true;
}

async function confirmarGerarLink() {
    generatingLink.value = true;
    linkError.value = "";
    linkCopied.value = false;
    inviteSent.value = false;
    try {
        const res = (await $fetch("/api/docentes/gerar-convite", {
            method: "POST",
            body: {
                id_entidade: props.idEntidade,
                email: linkEmail.value.trim() || null,
            },
        })) as any;
        if (res?.success) {
            const origin = window.location.origin;
            generatedLink.value = `${origin}/cadastro-docente/${res.token}`;
            linkConviteId.value = res.id;

            // Se tiver email, já envia o link automaticamente
            if (linkEmail.value.trim()) {
                try {
                    await $fetch("/api/docentes/enviar-convite", {
                        method: "POST",
                        body: {
                            email: linkEmail.value,
                            nome: linkNome.value || "",
                            link: generatedLink.value,
                            token: res.token,
                        },
                    });
                    inviteSent.value = true;
                } catch {
                    // webhook pode falhar, mas o link foi gerado
                }
            }

            showLinkForm.value = false;
            showLinkModal.value = true;
        } else {
            linkError.value = "Erro ao gerar link.";
        }
    } catch (e: any) {
        linkError.value = e?.message || "Erro ao gerar link.";
    } finally {
        generatingLink.value = false;
    }
}

// ── Valor hora/aula ────────────────────────────────
const editandoValor = ref<string | null>(null);
const editValorInput = ref("");

function formatarValor(centavos: number | null) {
    if (centavos === null || centavos === undefined) return "—";
    return (centavos / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function iniciarEdicaoValor(docente: any) {
    editandoValor.value = docente.id;
    editValorInput.value = docente.valor_hora_aula
        ? (docente.valor_hora_aula / 100).toFixed(2).replace(".", ",")
        : "";
}

async function salvarValor(docenteId: string) {
    const valorStr = editValorInput.value.replace(/[^\d,]/g, "").replace(",", ".");
    const valorCentavos = Math.round(parseFloat(valorStr || "0") * 100);
    editandoValor.value = null;

    try {
        const res = (await $fetch("/api/docentes/valor-hora-aula", {
            method: "POST",
            body: { id: docenteId, valor: valorCentavos },
        })) as any;
        if (res?.success) {
            const item = props.ctx.docentes.value.find((d: any) => d.id === docenteId);
            if (item) item.valor_hora_aula = valorCentavos;
        }
    } catch (e) {
        console.error("Erro ao salvar valor:", e);
    }
}



function copiarLink() {
    if (generatedLink.value) {
        navigator.clipboard.writeText(generatedLink.value);
        linkCopied.value = true;
        setTimeout(() => (linkCopied.value = false), 2000);
    }
}

// ── Busca com debounce ─────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onBuscaInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        props.ctx.filtroBusca.value = value;
        props.ctx.pagina.value = 1;
        props.ctx.fetchDocentes();
    }, 400);
}

async function handleToggle(docente: any) {
    await props.ctx.toggleDocente(docente.id, !docente.ativo);
}

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR");
}

onMounted(() => {
    props.ctx.fetchDocentes();
});
</script>

<template>
    <div class="flex flex-col h-full">
        <!-- Header com botões -->
        <div class="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-3">
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                    Docentes cadastrados
                </span>
            </div>
            <div class="flex items-center gap-2">
                <button
                    @click="gerarLink"
                    :disabled="generatingLink"
                    class="px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-div-15 border border-divider text-secondary hover:text-text hover:bg-div-30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <div v-if="generatingLink" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <Icon v-else name="ph:link-light" class="w-3.5 h-3.5" />
                    Gerar Link
                </button>
                <button
                    @click="emit('novo-docente')"
                    class="ds-btn-primary"
                >
                    <Icon name="ph:user-plus-bold" class="w-3.5 h-3.5" />
                    Cadastrar
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
            <input
                type="text"
                placeholder="Buscar por nome ou email..."
                @input="onBuscaInput"
                class="filter-input"
            />

            <span class="filter-count">{{ ctx.total.value }} docente(s)</span>
        </div>

        <!-- Conteúdo scrollável -->
        <div class="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1 space-y-3">

            <!-- Loading -->
            <div
                v-if="ctx.loading.value"
                class="flex items-center justify-center py-16"
            >
                <div class="w-8 h-8 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
            </div>

            <!-- Empty -->
            <div
                v-else-if="ctx.docentes.value.length === 0"
                class="empty-state"
            >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="mb-3 text-secondary/40">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p class="text-sm font-bold text-secondary/60">Nenhum docente cadastrado</p>
                <p class="text-[10px] font-bold text-secondary/40 mt-1 uppercase tracking-widest">Cadastre docentes manualmente ou aguarde inscrições em editais</p>
            </div>

            <!-- Cards -->
            <template v-else>
                <div
                    v-for="docente in ctx.docentes.value"
                    :key="docente.id"
                    class="card-item"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <div class="card-avatar">
                                {{ (docente.nome_completo || "?")[0].toUpperCase() }}
                            </div>

                            <div class="flex flex-col gap-0.5 min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-bold text-text truncate">
                                        {{ docente.nome_completo || "—" }}
                                    </span>
                                    <span
                                        class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                                        :class="
                                            docente.ativo
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                : 'bg-div-15 border border-divider text-secondary'
                                        "
                                    >
                                        {{ docente.ativo ? '● Ativo' : '○ Inativo' }}
                                    </span>
                                    <span
                                        v-if="!docente.tem_conta"
                                        class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    >
                                        ○ Aguardando Conta
                                    </span>
                                </div>
                                <span class="text-[10px] text-secondary/60 truncate">
                                    {{ docente.email || "—" }}
                                </span>
                                <div class="flex items-center gap-2 mt-1 flex-wrap">
                                    <span class="text-[9px] text-secondary/50">
                                        Cadastro: {{ formatDate(docente.criado_em) }}
                                    </span>

                                    <!-- Valor Hora/Aula -->
                                    <span class="text-[9px] text-secondary/50">|</span>
                                    <div class="flex items-center gap-1">
                                        <span class="text-[9px] text-secondary/50 uppercase tracking-wider">
                                            Hora/aula:
                                        </span>
                                        <div v-if="editandoValor === docente.id" class="flex items-center gap-1">
                                            <input
                                                v-model="editValorInput"
                                                type="text"
                                                placeholder="0,00"
                                                class="w-16 bg-field-bg border border-field-border rounded px-1.5 py-0.5 text-[10px] font-bold text-text text-right outline-none focus:border-primary/40"
                                                @keyup.enter="salvarValor(docente.id)"
                                                @keyup.escape="editandoValor = null"
                                                @blur="salvarValor(docente.id)"
                                                ref="valorInput"
                                                autofocus
                                            />
                                        </div>
                                        <button
                                            v-else
                                            @click="iniciarEdicaoValor(docente)"
                                            class="text-[10px] font-bold text-primary hover:underline transition-all cursor-pointer bg-transparent border-none p-0"
                                            title="Clique para editar"
                                        >
                                            {{ formatarValor(docente.valor_hora_aula) }}
                                        </button>
                                    </div>

                                    <template v-if="docente.componentes?.length > 0">
                                        <span class="text-[9px] text-secondary/50">|</span>
                                        <span class="text-[9px] text-primary font-bold truncate max-w-[200px]">
                                            {{ docente.componentes.map((c: any) => c.nome_componente || c.nome || c).join(", ") }}
                                        </span>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <button
                                v-if="!docente.tem_conta"
                                @click="convidarDocente(docente)"
                                :disabled="convidando === docente.id"
                                class="card-btn-icon text-amber-400/60 hover:text-amber-400"
                                title="Enviar convite para criar conta"
                            >
                                <div v-if="convidando === docente.id" class="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                                <Icon v-else name="ph:envelope-light" class="w-4 h-4" />
                            </button>
                            <button
                                @click="emit('editar-docente', docente)"
                                class="card-btn-icon"
                                title="Editar dados"
                            >
                                <Icon name="ph:pencil-light" class="w-4 h-4" />
                            </button>
                            <button
                                @click="emit('editar-vinculos', docente)"
                                class="card-btn-icon"
                                title="Vínculos"
                            >
                                <Icon name="ph:link-light" class="w-4 h-4" />
                            </button>
                            <button
                                @click="handleToggle(docente)"
                                class="card-btn-icon"
                                :title="docente.ativo ? 'Desativar' : 'Ativar'"
                            >
                                <Icon :name="docente.ativo ? 'ph:prohibit-light' : 'ph:check-circle-light'" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Paginação -->
        <div
            v-if="ctx.totalPaginas.value > 1"
            class="flex items-center justify-center gap-2 shrink-0 pt-3 pb-1 border-t border-divider mt-3"
        >
            <button
                :disabled="ctx.pagina.value <= 1"
                @click="ctx.irParaPagina(ctx.pagina.value - 1); ctx.fetchDocentes()"
                class="paginate-btn"
            >
                Anterior
            </button>
            <span class="text-[10px] text-secondary/50 font-bold px-2">
                {{ ctx.pagina.value }} / {{ ctx.totalPaginas.value }}
            </span>
            <button
                :disabled="ctx.pagina.value >= ctx.totalPaginas.value"
                @click="ctx.irParaPagina(ctx.pagina.value + 1); ctx.fetchDocentes()"
                class="paginate-btn"
            >
                Próximo
            </button>
        </div>
    </div>

    <!-- Modal: Informar Email para Convite -->
    <div
        v-if="showLinkForm"
        class="ds-modal-overlay"
        @click.self="showLinkForm = false"
    >
        <div class="ds-modal-panel max-w-[420px]">
            <div class="ds-modal-accent-bar" />

            <div class="ds-modal-header">
                <div class="ds-modal-header-icon">
                    <Icon name="ph:envelope-light" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">Enviar Convite</h3>
                    <p class="ds-modal-subtitle">Informe os dados para enviar o link</p>
                </div>
                <button @click="showLinkForm = false" class="ds-modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="p-6 flex flex-col gap-4">
                <BaseField
                    v-model="linkEmail"
                    label="Email do docente"
                    type="email"
                    placeholder="docente@email.com"
                />
                <BaseField
                    v-model="linkNome"
                    label="Nome do docente"
                    placeholder="Nome completo"
                />
                <p class="text-[10px] text-secondary/50">
                    Se informar o email, o link será enviado automaticamente.
                    Se deixar em branco, só gera o link para copiar.
                </p>
                <div
                    v-if="linkError"
                    class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                >
                    {{ linkError }}
                </div>
            </div>

            <div class="ds-modal-footer">
                <button @click="showLinkForm = false" class="ds-btn-cancel">Cancelar</button>
                <button
                    @click="confirmarGerarLink"
                    :disabled="generatingLink"
                    class="ds-btn-save"
                >
                    <div v-if="generatingLink" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <Icon v-else name="ph:link-light" class="w-3.5 h-3.5" />
                    <span>Gerar Link{{ linkEmail.trim() ? ' e Enviar' : '' }}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Modal: Código de Verificação -->
    <div
        v-if="showCodigoModal"
        class="ds-modal-overlay"
        @click.self="showCodigoModal = false"
    >
        <div class="ds-modal-panel max-w-[400px]">
            <div class="ds-modal-accent-bar" />

            <div class="ds-modal-header">
                <div class="ds-modal-header-icon">
                    <Icon name="ph:shield-check-light" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">Código de Verificação</h3>
                    <p class="ds-modal-subtitle">{{ codigoDocenteNome }}</p>
                </div>
                <button @click="showCodigoModal = false" class="ds-modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="p-6 flex flex-col gap-4 text-center">
                <p class="text-xs text-secondary/60">
                    Informe este código ao docente. Ele expira às
                    <strong class="text-text">{{ codigoExpira }}</strong>.
                </p>

                <div class="py-4">
                    <span
                        class="text-4xl font-black tracking-[0.3em] text-primary select-all"
                        style="font-family: monospace;"
                    >
                        {{ codigoGerado }}
                    </span>
                </div>

                <div
                    v-if="codigoError"
                    class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                >
                    {{ codigoError }}
                </div>
            </div>

            <div class="ds-modal-footer justify-center">
                <button
                    @click="showCodigoModal = false"
                    class="ds-btn-cancel"
                >
                    Fechar
                </button>
            </div>
        </div>
    </div>

    <!-- Modal: Link de Autocadastro -->
    <div
        v-if="showLinkModal"
        class="ds-modal-overlay"
        @click.self="showLinkModal = false"
    >
        <div class="ds-modal-panel max-w-[480px]">
            <div class="ds-modal-accent-bar" />

            <div class="ds-modal-header">
                <div class="ds-modal-header-icon">
                    <Icon name="ph:link-light" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">Link de Autocadastro</h3>
                    <p class="ds-modal-subtitle">Compartilhe este link com o docente</p>
                </div>
                <button @click="showLinkModal = false" class="ds-modal-close-btn">
                    &times;
                </button>
            </div>

            <div class="p-6 flex flex-col gap-4">
                <p class="text-xs text-secondary/60">
                    O docente vai criar a própria conta preenchendo os dados
                    e definindo uma senha.
                </p>

                <div class="flex items-center gap-2 p-3 rounded-xl bg-div-15 border border-divider">
                    <input
                        :value="generatedLink"
                        readonly
                        class="flex-1 bg-transparent text-xs font-bold text-text outline-none border-none"
                        @click="($event.target as HTMLInputElement)?.select()"
                    />
                    <button
                        @click="copiarLink"
                        class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                        :class="linkCopied ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary hover:bg-primary/20'"
                    >
                        <Icon :name="linkCopied ? 'ph:check-bold' : 'ph:copy-light'" class="w-3.5 h-3.5" />
                        {{ linkCopied ? 'Copiado' : 'Copiar' }}
                    </button>
                </div>

                <div
                    v-if="linkError"
                    class="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                >
                    {{ linkError }}
                </div>
            </div>

            <div class="ds-modal-footer">
                <span
                    v-if="inviteSent"
                    class="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mr-auto"
                >
                    <Icon name="ph:check-circle-bold" class="w-4 h-4" />
                    Link enviado para {{ linkEmail }}
                </span>
                <span
                    v-else-if="linkEmail"
                    class="text-[10px] text-secondary/50 mr-auto"
                >
                    Link gerado (email não enviado)
                </span>
                <button
                    @click="showLinkModal = false"
                    class="ds-btn-cancel"
                >
                    Fechar
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ── Filter bar ───────────────────────────────────── */
.filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    padding: 10px 14px;
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 12px;
    flex-shrink: 0;
}
.filter-input {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--field-border);
    background: var(--field-bg);
    color: var(--field-text);
    outline: none;
    transition: border-color 0.15s;
    flex: 1;
    min-width: 200px;
}
.filter-input::placeholder {
    color: var(--color-secondary);
    opacity: 0.5;
    text-transform: none;
}
.filter-input:focus {
    border-color: rgba(139,92,246,0.35);
}
.filter-count {
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-secondary);
    opacity: 0.5;
    white-space: nowrap;
    margin-left: auto;
}

/* ── Empty state ──────────────────────────────────── */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    background: var(--color-secondary-surface);
    border: 2px dashed var(--color-divider);
    border-radius: 1rem;
    text-align: center;
}

/* ── Card ──────────────────────────────────────────── */
.card-item {
    background: var(--color-secondary-surface);
    border: 1px solid var(--color-divider);
    border-radius: 14px;
    padding: 14px 16px;
    transition: all 0.15s ease;
}
.card-item:hover {
    border-color: rgba(139,92,246,0.3);
    background: var(--color-secondary-surface-hover);
    transform: translateX(2px);
}
.card-avatar {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    background: rgba(139,92,246,0.1);
    border: 1px solid rgba(139,92,246,0.2);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 14px;
    flex-shrink: 0;
}
.card-btn-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
}
.card-btn-icon:hover {
    background: var(--color-secondary-surface-hover);
    color: var(--color-text);
}

/* ── Paginação ────────────────────────────────────── */
.paginate-btn {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: transparent;
    border: 1px solid var(--color-divider);
    color: var(--color-secondary);
    cursor: pointer;
    transition: all 0.15s;
}
.paginate-btn:hover:not(:disabled) {
    background: var(--color-secondary-surface-hover);
    color: var(--color-text);
}
.paginate-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
}

/* ── Scrollbar ────────────────────────────────────── */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.12); border-radius: 4px; }
</style>
