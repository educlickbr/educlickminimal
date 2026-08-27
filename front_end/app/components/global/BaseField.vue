<script setup lang="ts">
/**
 * Campo de formulário padrão do design system (theme-aware).
 * Usa tokens --field-* para fundo/borda/texto, garantindo visual correto
 * no escuro e no claro (borda visível, sem "branco sobre branco").
 *
 * Uso:
 *   <BaseField v-model="nome" label="Nome" placeholder="..." />
 *   <BaseField v-model="x" label="Texto" type="textarea" />
 *   <BaseField v-model="y" label="Opção" type="select" :options="[{v:'a',l:'A'}]" />
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
    defineProps<{
        modelValue?: any;
        label?: string;
        required?: boolean;
        optional?: boolean;
        // discriminador de campo: "input" (nativo, aceita type de input) | "textarea" | "select";
        // se for outro valor (date/number/time/datetime-local), vira type nativo do input
        type?: string;
        // apenas p/ type="select"
        options?: { value: any; label: string }[] | any[];
        optionValueKey?: string;
        optionLabelKey?: string;
        // rótulo da opção vazia/placeholder do select (ex.: "Selecione...");
        // se vazio, não insere opção vazia. O `placeholder` via $attrs também é aceito.
        emptyLabel?: string;
    }>(),
    {
        label: "",
        required: false,
        optional: false,
        type: "input",
        options: () => [],
        optionValueKey: "value",
        optionLabelKey: "label",
        emptyLabel: "",
    },
);

const emit = defineEmits<{
    (e: "update:modelValue", value: any): void;
}>();

function onInput(e: Event) {
    emit("update:modelValue", (e.target as HTMLInputElement).value);
}
function onTextarea(e: Event) {
    emit("update:modelValue", (e.target as HTMLTextAreaElement).value);
}
function onSelect(e: Event) {
    emit("update:modelValue", (e.target as HTMLSelectElement).value);
}
function getOptionValue(o: any): any {
    return typeof o === "object" ? o[props.optionValueKey] : o;
}
function getOptionLabel(o: any): string {
    if (typeof o === "string") return o;
    return o[props.optionLabelKey] ?? "";
}

/**
 * Rótulo da opção vazia do select. Prioridade: prop `emptyLabel`;
 * se não vier, usa o `placeholder` passado via $attrs (compat).
 * Vazio (falsy) -> não renderiza opção vazia.
 */
const emptyOptionLabel = computed<string>(() => {
    if (props.emptyLabel) return props.emptyLabel;
    const ph = (getCurrentInstance()?.attrs as any)?.placeholder;
    return typeof ph === "string" ? ph : "";
});
</script>

<template>
    <div class="flex flex-col gap-2">
        <label v-if="label" class="flex items-center gap-1.5">
            <span class="text-[10px] font-black text-secondary/70 uppercase tracking-widest">
                {{ label }}
            </span>
            <span v-if="required" class="text-[11px] font-black" style="color: var(--color-primary)">
                *
            </span>
            <span
                v-if="optional"
                class="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
                style="background: var(--color-secondary-surface); border: 1px solid var(--field-border); color: var(--color-secondary)"
            >
                opcional
            </span>
        </label>

        <textarea
            v-if="type === 'textarea'"
            :value="modelValue"
            @input="onTextarea"
            v-bind="$attrs"
            rows="3"
            class="base-field"
        ></textarea>

        <select
            v-else-if="type === 'select'"
            :value="modelValue"
            @change="onSelect"
            v-bind="$attrs"
            class="base-field"
        >
            <option
                v-if="emptyOptionLabel"
                value=""
                :disabled="!!required"
            >
                {{ emptyOptionLabel }}
            </option>
            <option v-for="o in options" :key="getOptionValue(o)" :value="getOptionValue(o)">
                {{ getOptionLabel(o) }}
            </option>
        </select>

        <!-- Campo display/calculado (readonly) -->
        <div
            v-else-if="type === 'display'"
            class="base-field display-field"
        >
            {{ modelValue }}
        </div>

        <!-- Input nativo (default) — type pode ser text/number/date/time/etc. -->
        <input
            v-else
            :value="modelValue"
            @input="onInput"
            v-bind="$attrs"
            :type="type === 'input' || !type ? 'text' : type"
            class="base-field"
        />
    </div>
</template>

<style scoped>
.base-field {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--field-border);
    background: var(--field-bg);
    color: var(--field-text);
    font-size: 13px;
    font-weight: 500;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
    font-family: inherit;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
}
.base-field::placeholder {
    color: var(--field-placeholder);
}
.base-field:hover {
    background: var(--field-bg-hover);
}
.base-field:focus {
    border-color: var(--field-border-focus);
    box-shadow: var(--field-shadow-focus);
}
.base-field:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}
textarea.base-field {
    resize: none;
    line-height: 1.6;
}
.base-field.display-field {
    cursor: not-allowed;
    background: var(--field-bg);
    color: var(--color-primary);
    font-weight: 900;
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: center;
}
.base-field.display-field:hover {
    background: var(--field-bg);
}
</style>
