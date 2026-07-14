<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";

const props = defineProps<{
    modelValue: any;
    options: any[]; // Array of strings or objects { id: '...', nome: '...' }
    placeholder?: string;
    labelKey?: string; // Key to display in dropdown (default: 'nome')
    valueKey?: string; // Key for value (default: 'id')
    selectedLabelKey?: string;
    disabled?: boolean;
    // Searchable mode
    searchable?: boolean;
    searchPlaceholder?: string;
    searching?: boolean; // external loading indicator
    onSearch?: (val: string) => void; // called on input, debounce handled by parent
}>();

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");

const getLabel = (option: any) => {
    if (typeof option === "string") return option;
    return option[props.labelKey || "nome"];
};

const getSelectedLabelRaw = (option: any) => {
    if (typeof option === "string") return option;
    return option[props.selectedLabelKey || props.labelKey || "nome"];
};

const getValue = (option: any) => {
    if (typeof option === "string") return option;
    return option[props.valueKey || "id"];
};

const selectedLabel = computed(() => {
    if (!props.modelValue) return props.placeholder || "Selecione...";
    const selected = props.options.find(
        (o) => getValue(o) === props.modelValue,
    );
    return selected
        ? getSelectedLabelRaw(selected)
        : props.placeholder || "Selecione...";
});

const toggle = () => {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
    if (isOpen.value && props.searchable) {
        nextTick(() => searchInput.value?.focus());
    }
};

const select = (option: any) => {
    emit("update:modelValue", getValue(option));
    isOpen.value = false;
    searchQuery.value = "";
};

const onSearchInput = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    searchQuery.value = val;
    props.onSearch?.(val);
};

const close = (e: MouseEvent) => {
    if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
        isOpen.value = false;
        searchQuery.value = "";
    }
};

onMounted(() => {
    document.addEventListener("click", close);
});
onUnmounted(() => {
    document.removeEventListener("click", close);
});
</script>

<template>
    <div class="relative w-full" ref="containerRef">
        <!-- Trigger -->
        <button
            type="button"
            @click="toggle"
            :disabled="disabled"
            class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between transition-colors focus:outline-none focus:border-primary"
            :class="[
                isOpen ? 'border-primary ring-1 ring-primary' : '',
                disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-white/20',
            ]"
        >
            <span :class="!modelValue ? 'text-secondary/30' : 'text-white'">
                {{ selectedLabel }}
            </span>
            <svg
                class="w-4 h-4 text-secondary transition-transform duration-200"
                :class="isOpen ? 'rotate-180' : ''"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </button>

        <!-- Dropdown -->
        <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
        >
            <div
                v-if="isOpen"
                class="absolute z-50 w-full mt-1 bg-[#1A1A24] border border-white/10 rounded-lg shadow-xl overflow-hidden"
            >
                <!-- Search input inside dropdown -->
                <div v-if="searchable" class="p-2 border-b border-white/5">
                    <div class="relative">
                        <svg
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/50"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            ref="searchInput"
                            type="text"
                            :value="searchQuery"
                            @input="onSearchInput"
                            :placeholder="searchPlaceholder || 'Buscar...'"
                            class="w-full bg-[#0f0f15] rounded-md pl-7 pr-8 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-primary/50"
                            @click.stop
                        />
                        <svg
                            v-if="searching"
                            class="absolute right-2 top-1/2 -translate-y-1/2 animate-spin h-3.5 w-3.5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        <button
                            v-else-if="searchQuery"
                            @click.stop="
                                () => {
                                    searchQuery = '';
                                    props.onSearch?.('');
                                }
                            "
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-white"
                        >
                            <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <p
                        v-if="searchQuery.length === 1"
                        class="text-[10px] text-secondary/40 mt-1 pl-1"
                    >
                        Digite mais uma letra para buscar...
                    </p>
                </div>

                <!-- Options list -->
                <div class="max-h-56 overflow-y-auto custom-scrollbar">
                    <ul class="py-1">
                        <li
                            v-if="options.length === 0"
                            class="px-4 py-2 text-sm text-secondary italic text-center"
                        >
                            {{
                                searchQuery.length >= 2
                                    ? "Nenhum curso encontrado"
                                    : "Nenhuma opção"
                            }}
                        </li>
                        <li
                            v-for="option in options"
                            :key="getValue(option)"
                            @click="select(option)"
                            class="px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between group"
                            :class="[
                                modelValue === getValue(option)
                                    ? 'bg-primary/20 text-primary font-bold'
                                    : 'text-white hover:bg-primary hover:text-white',
                            ]"
                        >
                            <span>{{ getLabel(option) }}</span>
                            <svg
                                v-if="modelValue === getValue(option)"
                                class="w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </li>
                    </ul>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #16161e;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #444;
}
</style>
