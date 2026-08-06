<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";

const props = defineProps<{
	modelValue: any;
	options: any[];
	placeholder?: string;
	labelKey?: string;
	valueKey?: string;
	selectedLabelKey?: string;
	disabled?: boolean;
	searchable?: boolean;
	searchPlaceholder?: string;
	searching?: boolean;
	onSearch?: (val: string) => void;
}>();

const emit = defineEmits<{
	(e: "update:modelValue", value: any): void;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");

const getLabel = (option: any): string => {
	if (typeof option === "string") return option;
	return option[props.labelKey || "nome"] || "";
};

const getSelectedLabelRaw = (option: any): string => {
	if (typeof option === "string") return option;
	return option[props.selectedLabelKey || props.labelKey || "nome"] || "";
};

const getValue = (option: any): any => {
	if (typeof option === "string") return option;
	return option[props.valueKey || "id"];
};

const selectedLabel = computed(() => {
	if (!props.modelValue) return props.placeholder || "Selecione...";
	const selected = props.options.find((o) => getValue(o) === props.modelValue);
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

const handleClickOutside = (e: MouseEvent) => {
	if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
		isOpen.value = false;
		searchQuery.value = "";
	}
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
	<div ref="containerRef" class="relative w-full">
		<!-- Trigger Button -->
		<button
			type="button"
			:disabled="disabled"
			class="w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-left flex items-center justify-between gap-2 transition-all"
			:class="[
				!modelValue
					? 'text-white/30'
					: 'text-[var(--field-text)]',
				isOpen
					? 'border-[var(--field-border-focus)] shadow-[var(--field-shadow-focus)]'
					: 'border-[var(--field-border)]',
				disabled
					? 'opacity-50 cursor-not-allowed'
					: 'hover:bg-[var(--field-bg-hover)] cursor-pointer',
				'bg-[var(--field-bg-select)] border',
			]"
			@click="toggle"
		>
			<span class="truncate">{{ selectedLabel }}</span>
			<svg
				class="w-4 h-4 text-secondary/60 shrink-0 transition-transform duration-200"
				:class="isOpen ? 'rotate-180' : ''"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
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
				class="absolute z-50 w-full mt-1.5 bg-[#1A1A24] border border-white/10 rounded-xl shadow-xl overflow-hidden"
			>
				<!-- Search input -->
				<div v-if="searchable" class="p-2 border-b border-white/5">
					<div class="relative">
						<svg
							class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/50"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<input
							ref="searchInput"
							type="text"
							:value="searchQuery"
							@input="onSearchInput"
							:placeholder="searchPlaceholder || 'Buscar...'"
							class="w-full bg-[#0f0f15] rounded-lg pl-8 pr-8 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-primary/50 border border-white/5"
							@click.stop
						/>
						<svg
							v-if="searching"
							class="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin h-3.5 w-3.5 text-primary"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
						<button
							v-else-if="searchQuery"
							@click.stop="searchQuery = ''; props.onSearch?.('')"
							class="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-white transition-colors"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Options list -->
				<div class="max-h-56 overflow-y-auto custom-scrollbar">
					<ul class="py-1">
						<li
							v-if="options.length === 0"
							class="px-4 py-3 text-sm text-secondary italic text-center"
						>
							{{ searchQuery.length >= 2 ? "Nenhum resultado encontrado" : "Nenhuma opção" }}
						</li>
						<li
							v-for="option in options"
							:key="getValue(option)"
							@click="select(option)"
							class="px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-between group"
							:class="[
								modelValue === getValue(option)
									? 'bg-primary/20 text-primary'
									: 'text-white/80 hover:bg-primary/10 hover:text-white',
							]"
						>
							<span>{{ getLabel(option) }}</span>
							<svg
								v-if="modelValue === getValue(option)"
								class="w-4 h-4 text-primary shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
							</svg>
						</li>
					</ul>
				</div>
			</div>
		</transition>
	</div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
</style>
