<template>
    <div class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-panel">
            <div class="modal-accent-bar" />
            <div class="modal-header">
                <div class="modal-header-icon">💰</div>
                <div class="modal-header-text">
                    <h3 class="modal-title">
                        {{ oferta ? "Editar Oferta" : "Nova Oferta" }}
                    </h3>
                    <p class="modal-subtitle">
                        {{
                            oferta
                                ? "Altere os dados da oferta"
                                : "Configure preço, parcelamento e vigência"
                        }}
                    </p>
                </div>
                <button class="modal-close-btn" @click="$emit('close')">
                    ✕
                </button>
            </div>

            <div class="modal-body">
                <div v-if="errorMessage" class="modal-error">
                    {{ errorMessage }}
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-field">
                        <label class="form-label"
                            >Slug <span class="text-red-400">*</span></label
                        >
                        <input
                            v-model="form.slug"
                            type="text"
                            class="form-input"
                            placeholder="promocao-relampago"
                        />
                    </div>
                    <div class="form-field">
                        <label class="form-label">Nome Curto</label>
                        <input
                            v-model="form.nome_curto"
                            type="text"
                            class="form-input"
                            placeholder="Black Friday 2026"
                            @input="autoSlug"
                        />
                    </div>
                </div>

                <div class="form-field">
                    <label class="form-label"
                        >Valor (R$) <span class="text-red-400">*</span></label
                    >
                    <input
                        v-model="valorReais"
                        type="text"
                        class="form-input"
                        placeholder="0 = Grátis | 399,00 = R$ 399,00"
                        @input="onValorInput"
                    />
                </div>

                <div class="form-field">
                    <label class="form-label">Tipo de Pagamento</label>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            :class="[
                                'toggle-card',
                                {
                                    'toggle-card--active':
                                        form.tipo_pagamento === 'unico',
                                },
                            ]"
                            @click="form.tipo_pagamento = 'unico'"
                        >
                            <span>💳</span>
                            <span class="text-[10px] font-bold uppercase"
                                >Pagamento Único</span
                            >
                        </button>
                        <button
                            type="button"
                            :class="[
                                'toggle-card',
                                {
                                    'toggle-card--active':
                                        form.tipo_pagamento === 'recorrente',
                                },
                            ]"
                            @click="form.tipo_pagamento = 'recorrente'"
                        >
                            <span>🔄</span>
                            <span class="text-[10px] font-bold uppercase"
                                >Recorrente</span
                            >
                        </button>
                    </div>
                </div>

                <div v-if="form.tipo_pagamento === 'unico'" class="form-field">
                    <label class="form-label">Parcelamento Máximo</label>
                    <select
                        v-model.number="form.parcelamento_maximo"
                        class="form-input"
                    >
                        <option :value="1">À vista</option>
                        <option :value="2">2x</option>
                        <option :value="3">3x</option>
                        <option :value="4">4x</option>
                        <option :value="6">6x</option>
                        <option :value="12">12x</option>
                    </select>
                </div>

                <div
                    v-if="form.tipo_pagamento === 'recorrente'"
                    class="grid grid-cols-2 gap-4"
                >
                    <div class="form-field">
                        <label class="form-label">Período</label>
                        <select
                            v-model="form.recorrencia_periodo"
                            class="form-input"
                        >
                            <option value="mensal">Mensal</option>
                            <option value="anual">Anual</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label class="form-label">Intervalo</label>
                        <select
                            v-model.number="form.recorrencia_intervalo"
                            class="form-input"
                        >
                            <option :value="1">A cada 1</option>
                            <option :value="3">A cada 3</option>
                            <option :value="6">A cada 6</option>
                            <option :value="12">A cada 12</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-field">
                        <label class="form-label">Disponível a partir de</label>
                        <input
                            v-model="form.disponivel_a_partir_de"
                            type="datetime-local"
                            class="form-input"
                        />
                    </div>
                    <div class="form-field">
                        <label class="form-label">Disponível até</label>
                        <input
                            v-model="form.disponivel_ate"
                            type="datetime-local"
                            class="form-input"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-field">
                        <label class="form-label">Visibilidade</label>
                        <select v-model="form.visibilidade" class="form-input">
                            <option value="publica">Pública</option>
                            <option value="oculta">Oculta (link direto)</option>
                        </select>
                    </div>
                    <div class="form-field pt-6">
                        <label class="form-checkbox">
                            <input v-model="form.is_ativa" type="checkbox" />
                            <span>Oferta ativa</span>
                        </label>
                    </div>
                </div>

                <div class="form-field">
                    <label class="form-checkbox">
                        <input
                            v-model="form.exige_elegibilidade"
                            type="checkbox"
                            @change="carregarElegiveis"
                        />
                        <span>Exige elegibilidade (só CPFs autorizados)</span>
                    </label>
                </div>

                <div v-if="form.exige_elegibilidade" class="elegiveis-section">
                    <div class="flex items-center justify-between mb-2">
                        <span
                            class="text-[9px] font-bold uppercase text-white/35"
                            >Autorizados ({{ elegiveis.length }})</span
                        >
                        <button
                            v-if="!showAddElegivel"
                            class="text-[10px] font-bold text-primary hover:text-primary/80"
                            @click="showAddElegivel = true"
                        >
                            + Adicionar
                        </button>
                    </div>

                    <div
                        v-if="showAddElegivel"
                        class="flex flex-col gap-2 mb-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]"
                    >
                        <input
                            v-model="novoCpf"
                            type="text"
                            class="form-input"
                            placeholder="CPF * (só números)"
                        />
                        <div class="flex gap-2">
                            <button
                                class="text-[10px] font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-lg hover:bg-primary/20"
                                :disabled="!novoCpf.trim()"
                                @click="adicionarElegivel"
                            >
                                Salvar
                            </button>
                            <button
                                class="text-[10px] font-bold text-white/30 hover:text-white/60"
                                @click="
                                    showAddElegivel = false;
                                    novoCpf = '';
                                "
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>

                    <div
                        v-if="carregandoElegiveis"
                        class="flex justify-center py-3"
                    >
                        <div
                            class="w-4 h-4 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
                        />
                    </div>

                    <div
                        v-for="eleg in elegiveis"
                        :key="eleg.id"
                        class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04] mt-1"
                    >
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-white/70">{{
                                eleg.cpf
                            }}</span>
                            <span
                                v-if="eleg.utilizado_em"
                                class="badge badge--inativo"
                                >Usado</span
                            >
                        </div>
                        <button
                            class="text-[10px] text-red-400/50 hover:text-red-400"
                            @click="removerElegivel(eleg.id)"
                        >
                            ✕
                        </button>
                    </div>

                    <div
                        v-if="elegiveis.length === 0 && !carregandoElegiveis"
                        class="text-[10px] text-white/20 text-center py-3"
                    >
                        Nenhum CPF autorizado.
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="modal-btn-cancel" @click="$emit('close')">
                    Cancelar
                </button>
                <button
                    class="modal-btn-save"
                    :disabled="!canSave || saving"
                    @click="handleSave"
                >
                    {{
                        saving
                            ? "Salvando..."
                            : oferta
                              ? "Salvar"
                              : "Criar Oferta"
                    }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useAppStore } from "~~/stores/app";
import { fromInputToIso, toInputDateTimeLocal } from "~/utils/date";

const props = defineProps<{
    produtoId: string;
    oferta?: any | null;
    onSave: (data: any) => Promise<boolean>;
}>();

defineEmits<{ close: [] }>();

const store = useAppStore();
const saving = ref(false);
const errorMessage = ref("");
const valorReais = ref("");

const elegiveis = ref<any[]>([]);
const carregandoElegiveis = ref(false);
const showAddElegivel = ref(false);
const novoCpf = ref("");

const form = reactive({
    id: null as string | null,
    slug: "",
    nome_curto: "",
    valor_centavos: 0,
    tipo_pagamento: "unico" as string,
    parcelamento_maximo: 1,
    recorrencia_periodo: "mensal",
    recorrencia_intervalo: 1,
    disponivel_a_partir_de: "" as string | null,
    disponivel_ate: "" as string | null,
    visibilidade: "publica",
    exige_elegibilidade: false,
    is_ativa: true,
});

onMounted(() => {
    if (props.oferta) {
        form.id = props.oferta.id;
        form.slug = props.oferta.slug || "";
        form.nome_curto = props.oferta.nome_curto || "";
        form.valor_centavos = props.oferta.valor_centavos ?? 0;
        form.tipo_pagamento = props.oferta.tipo_pagamento || "unico";
        form.parcelamento_maximo = props.oferta.parcelamento_maximo ?? 1;
        form.recorrencia_periodo = props.oferta.recorrencia_periodo || "mensal";
        form.recorrencia_intervalo = props.oferta.recorrencia_intervalo ?? 1;
        form.disponivel_a_partir_de = toInputDateTimeLocal(
            props.oferta.disponivel_a_partir_de,
        );
        form.disponivel_ate = toInputDateTimeLocal(props.oferta.disponivel_ate);
        form.visibilidade = props.oferta.visibilidade || "publica";
        form.exige_elegibilidade = props.oferta.exige_elegibilidade ?? false;
        form.is_ativa = props.oferta.is_ativa !== false;
        valorReais.value = centavosParaReais(props.oferta.valor_centavos ?? 0);
        if (form.exige_elegibilidade) carregarElegiveis();
    } else {
        valorReais.value = "0";
    }
});

function centavosParaReais(centavos: number): string {
    if (centavos === 0) return "0";
    return (centavos / 100).toFixed(2).replace(".", ",");
}

function reaisParaCentavos(valor: string): number {
    const normalizado = valor.trim().replace(",", ".");
    const parsed = parseFloat(normalizado);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100);
}

function onValorInput() {
    form.valor_centavos = reaisParaCentavos(valorReais.value);
}

function autoSlug() {
    if (!form.slug && form.nome_curto) {
        form.slug = form.nome_curto
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }
}

const canSave = computed(
    () => form.slug.trim().length > 0 && form.valor_centavos >= 0,
);

function toIso(dateStr: string | null): string | null {
    return fromInputToIso(dateStr);
}

async function carregarElegiveis() {
    if (!form.exige_elegibilidade || !props.oferta?.id) return;
    carregandoElegiveis.value = true;
    try {
        const id_entidade =
            store.entidades?.[0]?.id || (store as any).company?.id;
        if (!id_entidade) return;
        const res = (await $fetch("/api/comercial/oferta-elegivel", {
            params: { id_entidade, id_oferta: props.oferta.id },
        })) as any;
        elegiveis.value = Array.isArray(res?.itens) ? res.itens : [];
    } catch {
        elegiveis.value = [];
    } finally {
        carregandoElegiveis.value = false;
    }
}

async function adicionarElegivel() {
    const id_entidade = store.entidades?.[0]?.id || (store as any).company?.id;
    if (!id_entidade || !props.oferta?.id || !novoCpf.value.trim()) return;
    try {
        const res = (await $fetch("/api/comercial/oferta-elegivel", {
            method: "POST",
            body: {
                id_entidade,
                id_oferta: props.oferta.id,
                cpf: novoCpf.value.trim(),
                usuario_id: store.user_expandido_id,
            },
        })) as any;
        if (res?.success) {
            await carregarElegiveis();
            novoCpf.value = "";
            showAddElegivel.value = false;
        }
    } catch {}
}

async function removerElegivel(id: string) {
    const id_entidade = store.entidades?.[0]?.id || (store as any).company?.id;
    if (!id_entidade) return;
    try {
        const res = (await $fetch("/api/comercial/oferta-elegivel", {
            method: "DELETE",
            body: { id, id_entidade },
        })) as any;
        if (res?.success)
            elegiveis.value = elegiveis.value.filter((e: any) => e.id !== id);
    } catch {}
}

async function handleSave() {
    errorMessage.value = "";
    if (!form.slug.trim()) {
        errorMessage.value = "Slug é obrigatório.";
        return;
    }

    saving.value = true;
    const ok = await props.onSave({
        id: form.id,
        id_produto: props.produtoId,
        slug: form.slug.trim(),
        nome_curto: form.nome_curto.trim() || null,
        valor_centavos: form.valor_centavos,
        tipo_pagamento: form.tipo_pagamento,
        parcelamento_maximo: form.parcelamento_maximo,
        recorrencia_periodo:
            form.tipo_pagamento === "recorrente"
                ? form.recorrencia_periodo
                : null,
        recorrencia_intervalo:
            form.tipo_pagamento === "recorrente"
                ? form.recorrencia_intervalo
                : 1,
        disponivel_a_partir_de: toIso(form.disponivel_a_partir_de),
        disponivel_ate: toIso(form.disponivel_ate),
        visibilidade: form.visibilidade,
        exige_elegibilidade: form.exige_elegibilidade,
        is_ativa: form.is_ativa,
    });
    saving.value = false;
    if (!ok) errorMessage.value = "Erro ao salvar. Verifique os dados.";
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.modal-panel {
    background: #13131a;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}
.modal-accent-bar {
    height: 3px;
    border-radius: 20px 20px 0 0;
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
    flex-shrink: 0;
}
.modal-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 20px 24px 0;
    flex-shrink: 0;
}
.modal-header-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
    background: rgba(139, 92, 246, 0.12);
    color: #a78bfa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}
.modal-header-text {
    flex: 1;
}
.modal-title {
    font-size: 15px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.92);
}
.modal-subtitle {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 2px;
}
.modal-close-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.3);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
}
.modal-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}
.modal-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
}
.modal-error {
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
    font-size: 11px;
    font-weight: 700;
}
.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.form-label {
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(255, 255, 255, 0.35);
}
.form-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(232, 230, 240, 0.9);
    font-size: 13px;
    font-weight: 700;
    outline: none;
    transition: border-color 0.15s ease;
    font-family: inherit;
    box-sizing: border-box;
}
.form-input:focus {
    border-color: rgba(139, 92, 246, 0.45);
}
.form-input::placeholder {
    color: rgba(255, 255, 255, 0.15);
    font-weight: 600;
}
.form-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
}
.form-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    accent-color: #8b5cf6;
}
.toggle-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.025);
    cursor: pointer;
    transition: all 0.15s ease;
}
.toggle-card:hover {
    border-color: rgba(139, 92, 246, 0.3);
}
.toggle-card--active {
    border-color: rgba(139, 92, 246, 0.4);
    background: rgba(139, 92, 246, 0.06);
}
.grid.grid-cols-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px 20px;
    flex-shrink: 0;
}
.modal-btn-cancel {
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.15s;
}
.modal-btn-cancel:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
}
.modal-btn-save {
    padding: 10px 24px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
    border: 1px solid rgba(139, 92, 246, 0.4);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
}
.modal-btn-save:hover {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
}
.modal-btn-save:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.badge {
    display: inline-flex;
    align-items: center;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 2px 6px;
    border-radius: 20px;
}
.badge--inativo {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.3);
}
</style>
