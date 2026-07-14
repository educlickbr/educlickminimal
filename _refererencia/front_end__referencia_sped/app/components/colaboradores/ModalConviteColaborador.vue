<script setup lang="ts">
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";
import BaseSelect from "~/components/BaseSelect.vue";

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits(["close", "invite-sent"]);
const { showToast } = useToast();
const client = useSupabaseClient();

const email = ref("");
const isLoading = ref(false);
const checkStatus = ref<
    | "idle"
    | "checking"
    | "exists_full"
    | "exists_auth_only"
    | "exists_data_only"
    | "new"
>("idle");
const userData = ref<any>(null);

// New User / Sync Fields
const nome = ref("");
const sobrenome = ref("");
const selectedRole = ref("");
const roles = ref<any[]>([]);
const isFetchingRoles = ref(false);

watch(
    () => props.isOpen,
    (val) => {
        if (val) {
            email.value = "";
            checkStatus.value = "idle";
            userData.value = null;
            nome.value = "";
            sobrenome.value = "";
            selectedRole.value = "";
        }
    },
);

const fetchRoles = async () => {
    if (roles.value.length > 0) return;
    isFetchingRoles.value = true;
    try {
        const { data, error } = await (client.rpc as any)("nxt_get_papeis");
        if (error) throw error;
        const excludedRoles = ["estudante", "candidato", "admin"];
        roles.value = (data || []).filter(
            (r: any) => !excludedRoles.includes(r.nome?.toLowerCase()),
        );
    } catch (e) {
        console.error("Erro ao buscar papeis:", e);
    } finally {
        isFetchingRoles.value = false;
    }
};

watch(checkStatus, (newVal) => {
    if (newVal === "new" || newVal === "exists_auth_only") {
        fetchRoles();
    }
});

const handleBlur = async () => {
    if (!email.value || checkStatus.value === "checking") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return;

    isLoading.value = true;
    checkStatus.value = "checking";

    try {
        const data: any = await ofetch("/api/colaboradores/invite-check", {
            method: "POST",
            body: { email: email.value },
        });

        checkStatus.value = data.status;
        userData.value = data.userData;
    } catch (e) {
        console.error(e);
        showToast("Erro ao verificar email", { type: "error" });
        checkStatus.value = "idle";
    } finally {
        isLoading.value = false;
    }
};

const sendInvite = async () => {
    if (["new", "exists_auth_only"].includes(checkStatus.value)) {
        if (!nome.value || !sobrenome.value || !selectedRole.value) {
            showToast("Preencha Nome, Sobrenome e Papel para convidar.", {
                type: "info",
            });
            return;
        }
    }

    isLoading.value = true;
    try {
        await ofetch("/api/colaboradores/send-invite", {
            method: "POST",
            body: {
                email: email.value,
                create_record: ["new", "exists_auth_only"].includes(
                    checkStatus.value,
                ),
                nome: nome.value,
                sobrenome: sobrenome.value,
                papel_id: selectedRole.value,
                user_id:
                    checkStatus.value === "exists_data_only"
                        ? userData.value?.user_id
                        : null,
            },
        });
        showToast("Convite enviado com sucesso!", { type: "success" });
        emit("invite-sent");
        emit("close");
    } catch (e) {
        console.error(e);
        showToast("Erro ao enviar convite", { type: "error" });
    } finally {
        isLoading.value = false;
    }
};

const syncUser = async () => {
    sendInvite();
};
</script>

<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        >
            <div
                class="absolute inset-0 bg-black/80 backdrop-blur-sm"
                @click="$emit('close')"
            ></div>

            <div
                class="relative w-full max-w-4xl md:w-[90vw] bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl flex flex-col h-auto max-h-[90vh]"
            >
                <div
                    class="flex items-center justify-between p-8 border-b border-white/5 bg-[#16161E] rounded-t-xl shrink-0"
                >
                    <h3
                        class="text-lg font-black text-white uppercase tracking-wider flex items-center gap-3"
                    >
                        <span
                            class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary"
                        >
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                ></path>
                            </svg>
                        </span>
                        Convidar Usuário
                    </h3>
                    <button
                        @click="$emit('close')"
                        class="text-white/40 hover:text-white transition-colors"
                    >
                        <svg
                            class="w-6 h-6"
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
                    </button>
                </div>

                <div
                    class="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-[500px] pb-48"
                >
                    <div class="space-y-3">
                        <label
                            class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                        >
                            E-mail do Usuário
                        </label>
                        <div class="relative">
                            <input
                                v-model="email"
                                @blur="handleBlur"
                                type="email"
                                placeholder="Digite o e-mail..."
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                            />
                            <div
                                v-if="isLoading && checkStatus === 'checking'"
                                class="absolute right-3 top-3"
                            >
                                <svg
                                    class="animate-spin h-5 w-5 text-primary"
                                    xmlns="http://www.w3.org/2000/svg"
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
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="
                            checkStatus !== 'idle' && checkStatus !== 'checking'
                        "
                        class="rounded-lg p-6 border transition-all animate-fade-in"
                        :class="{
                            'bg-green-500/10 border-green-500/20':
                                checkStatus === 'exists_full',
                            'bg-primary/10 border-primary/20':
                                checkStatus !== 'exists_full',
                        }"
                    >
                        <!-- Exists Full -->
                        <div
                            v-if="checkStatus === 'exists_full'"
                            class="flex items-center justify-between"
                        >
                            <div>
                                <p
                                    class="text-xs text-green-400 font-bold mb-1 capitalize"
                                >
                                    {{
                                        userData?.status_name ||
                                        "Usuário encontrado"
                                    }}
                                </p>
                                <p class="text-[11px] text-white/80">
                                    {{ userData?.nome || "" }}
                                    {{ userData?.sobrenome || "" }}
                                </p>
                                <p
                                    class="text-[10px] text-white/50 uppercase mt-1 font-bold"
                                >
                                    {{ userData?.papel_nome || "---" }}
                                </p>
                            </div>
                        </div>

                        <!-- Exists Auth Only -->
                        <div
                            v-else-if="checkStatus === 'exists_auth_only'"
                            class="flex flex-col gap-4"
                        >
                            <div class="flex items-center justify-between">
                                <div>
                                    <p
                                        class="text-sm text-primary font-bold mb-1"
                                    >
                                        Usuário possui conta, mas não possui
                                        dados de colaborador
                                    </p>
                                    <p
                                        class="text-xs text-secondary leading-relaxed"
                                    >
                                        Preencha os dados abaixo para criar o
                                        perfil de colaborador e enviar o
                                        convite.
                                    </p>
                                </div>
                            </div>
                            <div
                                class="grid grid-cols-2 gap-6 pt-6 border-t border-white/5"
                            >
                                <div class="col-span-1 space-y-2">
                                    <label
                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                        >Nome</label
                                    >
                                    <input
                                        v-model="nome"
                                        type="text"
                                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                                        placeholder="Ex: João"
                                    />
                                </div>
                                <div class="col-span-1 space-y-2">
                                    <label
                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                        >Sobrenome</label
                                    >
                                    <input
                                        v-model="sobrenome"
                                        type="text"
                                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                                        placeholder="Ex: Silva"
                                    />
                                </div>
                                <div class="col-span-2 space-y-2 relative z-50">
                                    <label
                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                        >Papel</label
                                    >
                                    <BaseSelect
                                        v-model="selectedRole"
                                        :options="roles"
                                        value-field="id"
                                        label-field="nome"
                                        placeholder="Selecione o papel..."
                                        :disabled="isFetchingRoles"
                                    />
                                </div>
                                <div class="col-span-2 mt-4">
                                    <button
                                        @click="sendInvite"
                                        class="px-6 py-3 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        {{
                                            isLoading
                                                ? "Enviando..."
                                                : "Criar Perfil e Enviar Convite"
                                        }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Exists Data Only -->
                        <div
                            v-else-if="checkStatus === 'exists_data_only'"
                            class="flex items-center justify-between"
                        >
                            <div class="space-y-1">
                                <p class="text-sm text-primary font-bold">
                                    Usuário possui dados, mas não possui conta
                                    de acesso
                                </p>
                                <p class="text-base text-white/90 font-medium">
                                    {{ userData?.nome }}
                                    {{ userData?.sobrenome }}
                                </p>
                                <p class="text-xs text-secondary">
                                    {{ userData?.email || email }}
                                </p>
                            </div>
                            <button
                                @click="syncUser"
                                class="px-6 py-3 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-lg whitespace-nowrap"
                            >
                                {{
                                    isLoading
                                        ? "Sincronizando..."
                                        : "Sincronizar e Convidar"
                                }}
                            </button>
                        </div>

                        <!-- New -->
                        <div
                            v-else-if="checkStatus === 'new'"
                            class="flex flex-col gap-6"
                        >
                            <div class="flex items-center justify-between">
                                <div>
                                    <p
                                        class="text-sm text-primary font-bold mb-1"
                                    >
                                        Novo usuário
                                    </p>
                                    <p
                                        class="text-xs text-secondary leading-relaxed"
                                    >
                                        Preencha os dados para criar o perfil e
                                        enviar o convite.
                                    </p>
                                </div>
                            </div>
                            <div
                                class="grid grid-cols-2 gap-6 pt-6 border-t border-white/5"
                            >
                                <div class="col-span-1 space-y-2">
                                    <label
                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                        >Nome</label
                                    >
                                    <input
                                        v-model="nome"
                                        type="text"
                                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                                        placeholder="Ex: João"
                                    />
                                </div>
                                <div class="col-span-1 space-y-2">
                                    <label
                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                        >Sobrenome</label
                                    >
                                    <input
                                        v-model="sobrenome"
                                        type="text"
                                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                                        placeholder="Ex: Silva"
                                    />
                                </div>
                                <div class="col-span-2 space-y-2 relative z-50">
                                    <label
                                        class="text-[10px] font-bold text-secondary uppercase tracking-wider"
                                        >Papel</label
                                    >
                                    <BaseSelect
                                        v-model="selectedRole"
                                        :options="roles"
                                        value-field="id"
                                        label-field="nome"
                                        placeholder="Selecione o papel..."
                                        :disabled="isFetchingRoles"
                                    />
                                </div>
                                <div class="col-span-2 mt-4 pb-4">
                                    <button
                                        @click="sendInvite"
                                        class="px-6 py-3 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        {{
                                            isLoading
                                                ? "Enviando..."
                                                : "Criar Perfil e Enviar Convite"
                                        }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="p-8 border-t border-white/5 bg-[#16161E] flex justify-end rounded-b-xl shrink-0 z-40 relative"
                >
                    <button
                        @click="$emit('close')"
                        class="px-6 py-3 bg-white/5 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}
.animate-fade-in {
    animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
