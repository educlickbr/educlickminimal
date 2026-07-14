<template>
    <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4"
    >
        <div
            class="absolute inset-0 bg-black/80 backdrop-blur-sm"
            @click="$emit('close')"
        ></div>

        <div
            class="relative bg-[#1a1b26] w-full h-full md:h-auto md:max-w-xl rounded-none md:rounded-xl border-none md:border md:border-white/10 shadow-none md:shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col"
        >
            <!-- Header -->
            <div
                class="flex justify-between items-center p-4 md:p-6 border-b border-white/5 shrink-0"
            >
                <h3 class="text-lg font-bold text-white">Inscrição de Bolsa</h3>
                <button
                    @click="$emit('close')"
                    class="text-secondary hover:text-white transition-colors"
                >
                    <svg
                        class="w-6 h-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        ></path>
                    </svg>
                </button>
            </div>

            <!-- Body -->
            <div
                class="p-4 md:p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar"
            >
                <div class="space-y-4">
                    <!-- CadÚnico Upload -->
                    <div>
                        <p
                            class="text-xs font-bold text-white uppercase tracking-wider mb-3"
                        >
                            CadÚnico
                        </p>
                        <label class="block relative group cursor-pointer">
                            <div
                                class="border-2 border-dashed border-white/10 rounded-lg p-8 flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 transition-colors bg-white/5"
                            >
                                <input
                                    type="file"
                                    @change="$emit('file-upload', $event)"
                                    class="absolute inset-0 opacity-0 cursor-pointer"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <svg
                                    v-if="!file"
                                    class="w-8 h-8 text-secondary group-hover:text-primary transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    ></path>
                                </svg>
                                <svg
                                    v-else
                                    class="w-8 h-8 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    ></path>
                                </svg>
                                <span
                                    class="text-xs text-secondary font-bold group-hover:text-white transition-colors text-center"
                                >
                                    {{
                                        file
                                            ? file.name
                                            : "Clique para enviar CadÚnico (PDF/Img)"
                                    }}
                                </span>
                            </div>
                        </label>
                    </div>

                    <!-- Dados Bancários -->
                    <div class="space-y-3">
                        <p
                            class="text-xs font-bold text-white uppercase tracking-wider"
                        >
                            Dados Bancários
                        </p>

                        <!-- Pix Warning -->
                        <p
                            class="text-xs text-secondary/60 leading-relaxed bg-amber-500/5 border border-amber-500/10 rounded-lg p-3"
                        >
                            É obrigatório que a chave PIX cadastrada seja o CPF
                            do próprio estudante, vinculada a uma conta bancária
                            de sua titularidade.
                        </p>

                        <!-- CPF + Chave PIX (row) -->
                        <div class="grid grid-cols-2 gap-3">
                            <!-- CPF -->
                            <div>
                                <label class="block text-xs text-secondary mb-1"
                                    >CPF</label
                                >
                                <div class="relative">
                                    <input
                                        type="text"
                                        :value="cpf"
                                        @input="
                                            $emit(
                                                'update:cpf',
                                                formatCPF(
                                                    (
                                                        $event.target as HTMLInputElement
                                                    ).value,
                                                ),
                                            )
                                        "
                                        inputmode="numeric"
                                        placeholder="000.000.000-00"
                                        maxlength="14"
                                        class="w-full bg-white/5 border rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-secondary/50 outline-none transition-colors pr-8"
                                        :class="
                                            cpf && !cpfValido
                                                ? 'border-red-500/50 focus:border-red-500'
                                                : 'border-white/10 focus:border-primary/50'
                                        "
                                    />
                                    <!-- CPF status icon -->
                                    <div
                                        v-if="
                                            cpf &&
                                            cpf.replace(/\D/g, '').length >= 11
                                        "
                                        class="absolute right-2.5 top-1/2 -translate-y-1/2"
                                    >
                                        <svg
                                            v-if="cpfValido"
                                            class="w-4 h-4 text-green-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M5 13l4 4L19 7"
                                            ></path>
                                        </svg>
                                        <svg
                                            v-else
                                            class="w-4 h-4 text-red-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            ></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <!-- Chave PIX (CPF) -->
                            <div>
                                <label class="block text-xs text-secondary mb-1"
                                    >Chave PIX (CPF)</label
                                >
                                <div class="relative">
                                    <input
                                        type="text"
                                        :value="chavePix"
                                        @input="
                                            $emit(
                                                'update:chavePix',
                                                formatCPF(
                                                    (
                                                        $event.target as HTMLInputElement
                                                    ).value,
                                                ),
                                            )
                                        "
                                        @blur="
                                            $emit(
                                                'update:chavePix',
                                                (
                                                    $event.target as HTMLInputElement
                                                ).value.replace(/\D/g, ''),
                                            )
                                        "
                                        inputmode="numeric"
                                        placeholder="Mesmo CPF informado acima"
                                        maxlength="14"
                                        class="w-full bg-white/5 border rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-secondary/50 outline-none transition-colors pr-8"
                                        :class="
                                            chavePix && !chavePixValido
                                                ? 'border-red-500/50 focus:border-red-500'
                                                : chavePix &&
                                                    chavePixValido &&
                                                    !cpfsIguais
                                                  ? 'border-amber-500/50 focus:border-amber-500'
                                                  : 'border-white/10 focus:border-primary/50'
                                        "
                                    />
                                    <!-- Status icon -->
                                    <div
                                        v-if="
                                            chavePix &&
                                            chavePix.replace(/\D/g, '')
                                                .length >= 11 &&
                                            cpfsPreenchidos
                                        "
                                        class="absolute right-2.5 top-1/2 -translate-y-1/2"
                                    >
                                        <!-- Valid + equal -->
                                        <svg
                                            v-if="chavePixValido && cpfsIguais"
                                            class="w-4 h-4 text-green-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M5 13l4 4L19 7"
                                            ></path>
                                        </svg>
                                        <!-- Valid but different -->
                                        <svg
                                            v-else-if="
                                                chavePixValido && !cpfsIguais
                                            "
                                            class="w-4 h-4 text-amber-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M12 9v2m0 4h.01M12 3L3 21h18L12 3z"
                                            ></path>
                                        </svg>
                                        <!-- Invalid -->
                                        <svg
                                            v-else
                                            class="w-4 h-4 text-red-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            ></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- CPF mismatch warning -->
                        <p
                            v-if="cpfsPreenchidos && !cpfsIguais"
                            class="text-xs text-amber-400/80 leading-relaxed bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5"
                        >
                            Os CPFs informados não conferem. Verifique se a
                            chave PIX é exatamente o mesmo CPF do campo acima.
                        </p>

                        <!-- Banco + Agência (row) -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs text-secondary mb-1"
                                    >Banco</label
                                >
                                <input
                                    type="text"
                                    :value="banco"
                                    @input="
                                        $emit(
                                            'update:banco',
                                            ($event.target as HTMLInputElement)
                                                .value,
                                        )
                                    "
                                    placeholder="Ex: 001"
                                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label class="block text-xs text-secondary mb-1"
                                    >Agência</label
                                >
                                <input
                                    type="text"
                                    :value="agencia"
                                    @input="
                                        $emit(
                                            'update:agencia',
                                            ($event.target as HTMLInputElement)
                                                .value,
                                        )
                                    "
                                    placeholder="0000-0"
                                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>

                        <!-- Tipo Conta + Conta (row) -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs text-secondary mb-1"
                                    >Tipo de Conta</label
                                >
                                <select
                                    :value="tipoConta"
                                    @change="
                                        $emit(
                                            'update:tipoConta',
                                            ($event.target as HTMLSelectElement)
                                                .value,
                                        )
                                    "
                                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                                >
                                    <option
                                        value=""
                                        disabled
                                        class="bg-[#1a1b26]"
                                    >
                                        Selecione
                                    </option>
                                    <option
                                        value="Conta Corrente"
                                        class="bg-[#1a1b26]"
                                    >
                                        Conta Corrente
                                    </option>
                                    <option
                                        value="Conta Poupança"
                                        class="bg-[#1a1b26]"
                                    >
                                        Conta Poupança
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-secondary mb-1"
                                    >Conta</label
                                >
                                <input
                                    type="text"
                                    :value="conta"
                                    @input="
                                        $emit(
                                            'update:conta',
                                            ($event.target as HTMLInputElement)
                                                .value,
                                        )
                                    "
                                    placeholder="00000-0"
                                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Aceite Toggle -->
                    <div
                        class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none group"
                        :class="
                            aceite
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                        "
                        @click="$emit('update:aceite', !aceite)"
                    >
                        <div
                            class="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
                            :class="aceite ? 'bg-primary' : 'bg-gray-600'"
                        >
                            <div
                                class="absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm"
                                :class="aceite ? 'translate-x-4' : ''"
                            ></div>
                        </div>
                        <span
                            class="text-xs text-secondary group-hover:text-white transition-colors leading-relaxed"
                        >
                            Li e declaro que estou de acordo com os termos do
                            edital deste processo seletivo.
                        </span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="flex gap-2 justify-end p-4 md:p-6 border-t border-white/5 bg-[#1a1b26] shrink-0"
            >
                <button
                    @click="$emit('close')"
                    class="hidden md:block px-4 py-2 text-xs font-bold text-secondary hover:text-white transition-colors"
                >
                    Cancelar
                </button>
                <button
                    @click="$emit('submit')"
                    :disabled="isSubmitting || !isFormValid"
                    class="w-full md:w-auto justify-center px-6 py-3 md:py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                    <span
                        v-if="isSubmitting"
                        class="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"
                    ></span>
                    {{ statusText }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatCPF, isValidCPF } from "~/utils/cpf";

const props = defineProps<{
    show: boolean;
    selectedEdital: any;
    file: File | null;
    aceite: boolean;
    cpf: string;
    banco: string;
    agencia: string;
    tipoConta: string;
    conta: string;
    chavePix: string;
    isSubmitting: boolean;
    statusText: string;
    isFormValid: boolean;
}>();

const cpfValido = computed(() => isValidCPF(props.cpf));

const chavePixValido = computed(() => isValidCPF(props.chavePix));

// CPF puro (só dígitos) para comparação
const cpfPuro = computed(() => (props.cpf || "").replace(/\D/g, ""));
const chavePixPuro = computed(() => (props.chavePix || "").replace(/\D/g, ""));

// Ambos os CPFs estão com 11 dígitos?
const cpfsPreenchidos = computed(
    () => cpfPuro.value.length >= 11 && chavePixPuro.value.length >= 11,
);

// CPFs são iguais (apenas dígitos)?
const cpfsIguais = computed(
    () => cpfsPreenchidos.value && cpfPuro.value === chavePixPuro.value,
);

defineEmits<{
    close: [];
    "file-upload": [event: Event];
    "update:aceite": [value: boolean];
    "update:cpf": [value: string];
    "update:banco": [value: string];
    "update:agencia": [value: string];
    "update:tipoConta": [value: string];
    "update:conta": [value: string];
    "update:chavePix": [value: string];
    submit: [];
}>();
</script>
