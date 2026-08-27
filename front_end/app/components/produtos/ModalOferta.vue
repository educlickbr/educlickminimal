<template>
    <div class="ds-modal-overlay" @click.self="$emit('close')">
        <div class="ds-modal-panel max-w-xl">
            <div class="ds-modal-accent-bar" />

            <!-- Header -->
            <div class="ds-modal-header">
                <div class="ds-modal-header-icon text-primary">
                    <Icon name="ph:currency-dollar-bold" class="w-5 h-5" />
                </div>
                <div class="flex flex-col gap-0.5 flex-1">
                    <h3 class="ds-modal-title">
                        {{ oferta ? "Editar Oferta" : "Nova Oferta" }}
                    </h3>
                    <p class="ds-modal-subtitle">
                        {{
                            oferta
                                ? "Altere os dados da oferta"
                                : "Configure preço, parcelamento e vigência"
                        }}
                    </p>
                </div>
                <button class="ds-modal-close-btn" @click="$emit('close')">
                    &times;
                </button>
            </div>

            <!-- Form Body -->
            <div class="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
                <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">
                    {{ errorMessage }}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BaseField
                        v-model="form.slug"
                        label="Slug"
                        required
                        placeholder="promocao-relampago"
                    />
                    <BaseField
                        v-model="form.nome_curto"
                        label="Nome Curto"
                        placeholder="Black Friday 2026"
                        @input="autoSlug"
                    />
                </div>

                <BaseField
                    v-model="valorReais"
                    label="Valor (R$)"
                    required
                    placeholder="0 = Grátis | 399,00 = R$ 399,00"
                    @input="onValorInput"
                />

                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">
                        Tipo de Pagamento
                    </label>
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
                            <Icon name="ph:credit-card-bold" class="w-4 h-4 text-primary" />
                            <span class="text-[10px] font-black uppercase tracking-wider text-text">Pagamento Único</span>
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
                            <Icon name="ph:arrows-clockwise-bold" class="w-4 h-4 text-primary" />
                            <span class="text-[10px] font-black uppercase tracking-wider text-text">Recorrente</span>
                        </button>
                    </div>
                </div>

                <div v-if="form.tipo_pagamento === 'unico'">
                    <BaseSelect
                        v-model="form.parcelamento_maximo"
                        label="Parcelamento Máximo"
                        :options="[
                            { id: 1, nome: 'À vista' },
                            { id: 2, nome: '2x' },
                            { id: 3, nome: '3x' },
                            { id: 4, nome: '4x' },
                            { id: 6, nome: '6x' },
                            { id: 12, nome: '12x' },
                        ]"
                    />
                </div>

                <div
                    v-if="form.tipo_pagamento === 'recorrente'"
                    class="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <BaseSelect
                        v-model="form.recorrencia_periodo"
                        label="Período"
                        :options="[
                            { id: 'mensal', nome: 'Mensal' },
                            { id: 'anual', nome: 'Anual' },
                        ]"
                    />
                    <BaseSelect
                        v-model="form.recorrencia_intervalo"
                        label="Intervalo"
                        :options="[
                            { id: 1, nome: 'A cada 1' },
                            { id: 3, nome: 'A cada 3' },
                            { id: 6, nome: 'A cada 6' },
                            { id: 12, nome: 'A cada 12' },
                        ]"
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BaseField
                        v-model="form.disponivel_a_partir_de"
                        label="Disponível a partir de"
                        type="datetime-local"
                    />
                    <BaseField
                        v-model="form.disponivel_ate"
                        label="Disponível até"
                        type="datetime-local"
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <BaseSelect
                        v-model="form.visibilidade"
                        label="Visibilidade"
                        :options="[
                            { id: 'publica', nome: 'Pública' },
                            { id: 'oculta', nome: 'Oculta (link direto)' },
                        ]"
                    />
                    <div class="flex items-center gap-3 p-3 bg-div-15 border border-divider rounded-xl mt-4">
                        <input
                            v-model="form.is_ativa"
                            type="checkbox"
                            id="chk-oferta-ativa"
                            class="accent-primary w-4 h-4 cursor-pointer"
                        />
                        <label for="chk-oferta-ativa" class="text-xs font-bold text-text cursor-pointer select-none">
                            Oferta ativa
                        </label>
                    </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-div-15 border border-divider rounded-xl">
                    <input
                        v-model="form.exige_elegibilidade"
                        type="checkbox"
                        id="chk-elegivel"
                        class="accent-primary w-4 h-4 cursor-pointer"
                        @change="carregarElegiveis"
                    />
                    <label for="chk-elegivel" class="text-xs font-bold text-text cursor-pointer select-none">
                        Exige elegibilidade (só CPFs autorizados)
                    </label>
                </div>

                <div v-if="form.exige_elegibilidade" class="p-4 bg-div-15 border border-divider rounded-xl flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                            Autorizados ({{ elegiveis.length }})
                        </span>
                        <button
                            v-if="!showAddElegivel"
                            class="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                            @click="showAddElegivel = true"
                        >
                            + Adicionar
                        </button>
                    </div>

                    <div
                        v-if="showAddElegivel"
                        class="flex flex-col gap-2 p-3 bg-secondary-surface rounded-xl border border-divider"
                    >
                        <BaseField
                            v-model="novoCpf"
                            placeholder="CPF * (só números)"
                        />
                        <div class="flex gap-2 justify-end">
                            <button
                                class="text-[10px] font-bold text-secondary/60 hover:text-text px-3 py-1.5"
                                @click="
                                    showAddElegivel = false;
                                    novoCpf = '';
                                "
                            >
                                Cancelar
                            </button>
                            <button
                                class="ds-btn-save !px-3 !py-1.5 !text-[10px]"
                                :disabled="!novoCpf.trim()"
                                @click="adicionarElegivel"
                            >
                                Salvar
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
                        class="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary-surface border border-divider"
                    >
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-mono font-bold text-text">{{
                                eleg.cpf
                            }}</span>
                            <span
                                v-if="eleg.utilizado_em"
                                class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-div-30 border border-divider text-secondary"
                                >Usado</span
                            >
                        </div>
                        <button
                            class="text-[10px] text-red-500/60 hover:text-red-500 font-bold"
                            @click="removerElegivel(eleg.id)"
                        >
                            &times;
                        </button>
                    </div>

                    <div
                        v-if="elegiveis.length === 0 && !carregandoElegiveis"
                        class="text-[10px] font-bold text-secondary/40 text-center py-2"
                    >
                        Nenhum CPF autorizado.
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="ds-modal-footer">
                <button class="ds-btn-cancel" @click="$emit('close')">
                    Cancelar
                </button>
                <button
                    class="ds-btn-save"
                    :disabled="!canSave || saving"
                    @click="handleSave"
                >
                    <div v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{{
                        saving
                            ? "Salvando..."
                            : oferta
                              ? "Salvar"
                              : "Criar Oferta"
                    }}</span>
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
.toggle-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--color-divider);
    background: var(--color-secondary-surface);
    cursor: pointer;
    transition: all 0.15s ease;
}
.toggle-card:hover {
    border-color: rgba(139, 92, 246, 0.3);
    background: var(--color-secondary-surface-hover);
}
.toggle-card--active {
    border-color: var(--color-primary);
    background: rgba(139, 92, 246, 0.08);
}
</style>
