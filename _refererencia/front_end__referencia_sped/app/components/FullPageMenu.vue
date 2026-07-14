<script setup>
const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false,
    },
    disableClose: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["close"]);
const router = useRouter();
// ... existing code ...

// Go to template and find close button:
// <div class="flex items-center gap-2">
//    <button v-if="!disableClose" @click="closeMenu" ...>

const store = useAppStore(); // Assuming useAppStore has auth info
const route = useRoute();
import { usePermissionsStore } from "~/stores/permissions";
const permissions = usePermissionsStore();
// Load permissions when menu opens might be too late for v-if rendering?
// Middleware loads it globally, so it should be ready or loading.
// But forcing a fetch on mount/setup is good practice.
onMounted(() => {
    permissions.fetchPermissions();
});

// Active Route Helper
const isActive = (path) => {
    return route.path === path || route.path.startsWith(path + "/");
};

// Navigation Helper
const handleNavigation = (path) => {
    if (!path) return;
    router.push(path);
    if (!props.disableClose) {
        emit("close");
    }
};

// Close Helper
const closeMenu = () => {
    if (!props.disableClose) {
        emit("close");
    }
};

// User Info Helpers
const userName = computed(() => {
    if (store.nome) return store.nome;
    if (store.user && store.user.email) return store.user.email.split("@")[0];
    return "Convidado";
});

const userInitial = computed(() => {
    return userName.value ? userName.value.charAt(0).toUpperCase() : "C";
});

// Logout
const handleLogout = async () => {
    await store.logout();
    // Force hard reload to clear all state/cache
    window.location.href = "/login";
};
</script>

<template>
    <div
        translate="no"
        class="fixed inset-0 z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-background flex flex-col font-sans p-4 gap-4"
        :data-translate="'no'"
        :class="isOpen || disableClose ? 'translate-x-0' : 'translate-x-[102%]'"
    >
        <!-- 1. Header -->
        <!--
       LAYOUT HEADER (MOBILE VS DESKTOP):
       - Padding Vertical (Top/Bottom): py-2 (Mobile) | md:py-3 (Desktop)
       - Padding Horizontal (Left/Right): px-2 (Mobile) | md:px-4 (Desktop)
       - Background: bg-transparent (Mobile) | md:bg-div-15 (Desktop)
    -->
        <header
            class="bg-transparent md:bg-div-15 px-1 py-2 md:px-4 md:py-3 rounded-lg flex items-center justify-between shadow-none md:shadow-sm border-0 md:border border-secondary/5 shrink-0"
        >
            <div class="flex items-center gap-3">
                <div
                    class="hidden md:flex w-8 h-8 rounded bg-primary/10 text-primary items-center justify-center font-bold text-sm border border-primary/10 shadow-sm overflow-hidden relative"
                >
                    <img
                        v-if="store.imagem_user && store.hash_base"
                        :src="store.hash_base + store.imagem_user"
                        class="w-full h-full object-cover absolute inset-0"
                        alt="Foto"
                    />
                    <span v-else>{{ userInitial }}</span>
                </div>
                <div class="flex flex-col leading-none gap-0.5">
                    <!--
             FONTS & TEXT (MOBILE VS DESKTOP):
             - Título Tamanho: text-[10px] (Mobile) | md:text-xs (Desktop)
             - Subtítulo Tamanho: text-[9px] (Mobile) | md:text-[10px] (Desktop)
          -->
                    <h2
                        translate="no"
                        class="text-[12px] md:text-xs font-black text-text uppercase tracking-[0.2em] leading-none"
                    >
                        Olá, {{ userName.split(" ")[0] }}
                    </h2>
                    <p
                        translate="no"
                        class="text-[10px] md:text-[10px] text-secondary font-bold opacity-80 leading-none"
                    >
                        Menu Principal
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- Logout Button -->
                <button
                    @click="handleLogout"
                    class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors border border-red-500/10"
                >
                    <span translate="no">Sair</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                        ></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>

                <!-- Close Button -->
                <button
                    v-if="!disableClose"
                    @click="closeMenu"
                    class="p-2 text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </header>

        <!-- 2. Scrollable Content Area -->
        <main
            class="flex-1 overflow-y-auto px-2 space-y-8 max-w-7xl mx-auto w-full custom-scrollbar"
        >
            <div class="flex flex-col md:flex-row gap-4">
                <!-- LEFT COLUMN -->
                <div class="flex-1 space-y-4">
                    <!-- ISLAND: Processo Seletivo -->
                    <div
                        class="space-y-4"
                        v-if="permissions.can('ilha_processo_seletivo')"
                    >
                        <div class="flex items-center gap-2 px-1">
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-violet-500/60"
                            ></div>
                            <h3
                                class="text-xs font-black text-secondary tracking-[0.2em] uppercase"
                            >
                                Processo Seletivo
                            </h3>
                        </div>

                        <div
                            class="bg-div-15 border border-secondary/10 rounded-xl overflow-hidden shadow-sm"
                        >
                            <!-- Processos Abertos -->
                            <button
                                v-if="permissions.can('btn_processos_abertos')"
                                @click="handleNavigation('/processo_seletivo')"
                                class="menu-item group"
                                :class="
                                    isActive('/processo_seletivo')
                                        ? 'bg-violet-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-violet-500/10 text-violet-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <line
                                            x1="16"
                                            y1="2"
                                            x2="16"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="8"
                                            y1="2"
                                            x2="8"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="10"
                                            x2="21"
                                            y2="10"
                                        ></line>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/processo_seletivo')
                                                ? 'text-violet-500'
                                                : 'text-text group-hover:text-violet-500'
                                        "
                                        >Processos Abertos</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Inscreva-se em cursos</span
                                    >
                                </div>
                            </button>

                            <!-- Seleção Estudantes -->
                            <button
                                v-if="permissions.can('btn_selecao_estudante')"
                                @click="
                                    handleNavigation(
                                        '/selecao/estudante/extensao',
                                    )
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/selecao/estudante')
                                        ? 'bg-violet-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-violet-500/10 text-violet-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                                        ></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path
                                            d="M23 21v-2a4 4 0 0 0-3-3.87"
                                        ></path>
                                        <path
                                            d="M16 3.13a4 4 0 0 1 0 7.75"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/selecao/estudante')
                                                ? 'text-violet-500'
                                                : 'text-text group-hover:text-violet-500'
                                        "
                                        >Seleção Estudantes</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Candidatos a cursos</span
                                    >
                                </div>
                            </button>

                            <!-- Seleção Docentes -->
                            <button
                                v-if="permissions.can('btn_selecao_docente')"
                                @click="
                                    handleNavigation(
                                        '/selecao/docente/extensao',
                                    )
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/selecao/docente')
                                        ? 'bg-violet-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-violet-500/10 text-violet-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M12 14l9-5-9-5-9 5 9 5z"
                                        ></path>
                                        <path
                                            d="M12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z"
                                        ></path>
                                        <path d="M12 14v7"></path>
                                        <path d="M12 14v7"></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/selecao/docente')
                                                ? 'text-violet-500'
                                                : 'text-text group-hover:text-violet-500'
                                        "
                                        >Seleção Docentes</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Candidatos a vagas docentes</span
                                    >
                                </div>
                            </button>

                            <!-- Meus Processos -->
                            <button
                                v-if="permissions.can('btn_meus_processos')"
                                @click="handleNavigation('/meus-processos')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/meus-processos')
                                        ? 'bg-violet-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-violet-500/10 text-violet-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                        ></path>
                                        <polyline
                                            points="14 2 14 8 20 8"
                                        ></polyline>
                                        <line
                                            x1="16"
                                            y1="13"
                                            x2="8"
                                            y2="13"
                                        ></line>
                                        <line
                                            x1="16"
                                            y1="17"
                                            x2="8"
                                            y2="17"
                                        ></line>
                                        <polyline
                                            points="10 9 9 9 8 9"
                                        ></polyline>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/meus-processos')
                                                ? 'text-violet-500'
                                                : 'text-text group-hover:text-violet-500'
                                        "
                                        >Meus Processos</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Acompanhe suas inscrições</span
                                    >
                                </div>
                            </button>

                            <!-- Painel Seleção -->
                            <button
                                v-if="permissions.can('btn_painel_selecao')"
                                @click="handleNavigation('/selecao/painel')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/selecao/painel')
                                        ? 'bg-violet-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-violet-500/10 text-violet-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="2"
                                            y="3"
                                            width="20"
                                            height="14"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <line
                                            x1="8"
                                            y1="21"
                                            x2="16"
                                            y2="21"
                                        ></line>
                                        <line
                                            x1="12"
                                            y1="17"
                                            x2="12"
                                            y2="21"
                                        ></line>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/selecao/painel')
                                                ? 'text-violet-500'
                                                : 'text-text group-hover:text-violet-500'
                                        "
                                        >Painel de Seleção</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Dashboard administrativo</span
                                    >
                                </div>
                            </button>

                            <!-- Seleção Jornadas -->
                            <button
                                v-if="permissions.can('btn_meus_grupos_jnpta')"
                                @click="
                                    handleNavigation('/jnpta?tab=inscricoes')
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/jnpta') ? 'bg-violet-500/5' : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-violet-500/10 text-violet-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                                        ></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path
                                            d="M23 21v-2a4 4 0 0 0-3-3.87"
                                        ></path>
                                        <path
                                            d="M16 3.13a4 4 0 0 1 0 7.75"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/jnpta')
                                                ? 'text-violet-500'
                                                : 'text-text group-hover:text-violet-500'
                                        "
                                        >Seleção Jornadas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Candidatos e avaliação</span
                                    >
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- ISLAND: Vida Acadêmica -->
                    <div
                        class="space-y-4"
                        v-if="permissions.can('ilha_vida_academica')"
                    >
                        <div class="flex items-center gap-2 px-1">
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-rose-500/60"
                            ></div>
                            <h3
                                class="text-xs font-black text-secondary tracking-[0.2em] uppercase"
                            >
                                Vida Acadêmica
                            </h3>
                        </div>

                        <div
                            class="bg-div-15 border border-secondary/10 rounded-xl overflow-hidden shadow-sm"
                        >
                            <!-- Gestão de Faltas -->
                            <button
                                v-if="permissions.can('btn_gestao_faltas')"
                                @click="handleNavigation('/gestao-faltas')"
                                class="menu-item group"
                                :class="
                                    isActive('/gestao-faltas')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <line
                                            x1="16"
                                            y1="2"
                                            x2="16"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="8"
                                            y1="2"
                                            x2="8"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="10"
                                            x2="21"
                                            y2="10"
                                        ></line>
                                        <path d="M10 14h4"></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/gestao-faltas')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Gestão de Faltas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Histórico de presença</span
                                    >
                                </div>
                            </button>

                            <!-- Meus Dados -->
                            <button
                                v-if="permissions.can('btn_meus_dados')"
                                @click="handleNavigation('/meus-dados')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/meus-dados')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                                        ></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/meus-dados')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Meus Dados</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Seus dados cadastrais</span
                                    >
                                </div>
                            </button>

                            <!-- Editais -->
                            <button
                                v-if="permissions.can('btn_editais')"
                                @click="handleNavigation('/editais-abertos')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/editais-abertos')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                        ></path>
                                        <polyline
                                            points="14 2 14 8 20 8"
                                        ></polyline>
                                        <line
                                            x1="16"
                                            y1="13"
                                            x2="8"
                                            y2="13"
                                        ></line>
                                        <line
                                            x1="16"
                                            y1="17"
                                            x2="8"
                                            y2="17"
                                        ></line>
                                        <polyline
                                            points="10 9 9 9 8 9"
                                        ></polyline>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/editais-abertos')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Editais</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Documentos e regras</span
                                    >
                                </div>
                            </button>

                            <!-- Eventos -->
                            <button
                                v-if="permissions.can('btn_eventos')"
                                @click="handleNavigation('/aluno/eventos')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/aluno/eventos')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <line
                                            x1="16"
                                            y1="2"
                                            x2="16"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="8"
                                            y1="2"
                                            x2="8"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="10"
                                            x2="21"
                                            y2="10"
                                        ></line>
                                        <path d="M8 14h.01"></path>
                                        <path d="M12 14h.01"></path>
                                        <path d="M16 14h.01"></path>
                                        <path d="M8 18h.01"></path>
                                        <path d="M12 18h.01"></path>
                                        <path d="M16 18h.01"></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/aluno/eventos')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Eventos</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Calendário acadêmico</span
                                    >
                                </div>
                            </button>

                            <!-- Oportunidades -->
                            <button
                                v-if="permissions.can('btn_oportunidades')"
                                @click="
                                    handleNavigation('/oportunidades-abertas')
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/oportunidades-abertas')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line
                                            x1="2"
                                            y1="12"
                                            x2="22"
                                            y2="12"
                                        ></line>
                                        <path
                                            d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/oportunidades-abertas')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Oportunidades</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Vagas e estágios</span
                                    >
                                </div>
                            </button>

                            <!-- Bolsa de Estudos -->
                            <button
                                v-if="permissions.can('btn_bolsa_estudos')"
                                @click="handleNavigation('/bolsas-inscricoes')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/bolsas-inscricoes')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/bolsas-inscricoes')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Bolsas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Benefícios e auxílios</span
                                    >
                                </div>
                            </button>

                            <!-- Declarações -->
                            <button
                                v-if="permissions.can('btn_declaracoes')"
                                @click="handleNavigation('/declaracoes-alunos')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/declaracoes-alunos')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                        ></path>
                                        <polyline
                                            points="14 2 14 8 20 8"
                                        ></polyline>
                                        <line
                                            x1="16"
                                            y1="13"
                                            x2="8"
                                            y2="13"
                                        ></line>
                                        <line
                                            x1="16"
                                            y1="17"
                                            x2="8"
                                            y2="17"
                                        ></line>
                                        <polyline
                                            points="10 9 9 9 8 9"
                                        ></polyline>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/declaracoes-alunos')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Declarações</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Histórico e solicitações</span
                                    >
                                </div>
                            </button>

                            <!-- Avaliações -->
                            <button
                                v-if="permissions.can('btn_avaliacoes_aluno')"
                                @click="handleNavigation('/avaliacoes-alunos')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/avaliacoes-alunos')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <polygon
                                            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                                        ></polygon>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/avaliacoes-alunos')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Minhas Avaliações</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Notas e pareceres</span
                                    >
                                </div>
                            </button>

                            <!-- Meus Certificados -->
                            <button
                                v-if="permissions.can('btn_meus_certificados')"
                                @click="handleNavigation('/meus-certificados')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/meus-certificados')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M9 12l2 2 4-4"></path>
                                        <path
                                            d="M21 12c.552 0 1 .449 1 1v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7c0-.551.448-1 1-1"
                                        ></path>
                                        <path
                                            d="M16 5V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2"
                                        ></path>
                                        <rect
                                            x="6"
                                            y="5"
                                            width="12"
                                            height="6"
                                            rx="1"
                                        ></rect>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/meus-certificados')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Meus Certificados</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Histórico e validação</span
                                    >
                                </div>
                            </button>

                            <!-- Documentos Curso -->
                            <button
                                v-if="permissions.can('btn_documentos_curso')"
                                @click="
                                    handleNavigation('/documentos-academico')
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/documentos-academico')
                                        ? 'bg-rose-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-rose-500/10 text-rose-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                                        ></path>
                                        <path
                                            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/documentos-academico')
                                                ? 'text-rose-500'
                                                : 'text-text group-hover:text-rose-500'
                                        "
                                        >Documentos Curso</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Editais, manuais e arquivos</span
                                    >
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- ISLAND: Educacional -->
                    <div
                        class="space-y-4"
                        v-if="permissions.can('ilha_educacional')"
                    >
                        <div class="flex items-center gap-2 px-1">
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-orange-500/60"
                            ></div>
                            <h3
                                class="text-xs font-black text-secondary tracking-[0.2em] uppercase"
                            >
                                Educacional
                            </h3>
                        </div>

                        <div
                            class="bg-div-15 border border-secondary/10 rounded-xl overflow-hidden shadow-sm"
                        >
                            <!-- Matrículas -->
                            <button
                                v-if="permissions.can('btn_matriculas')"
                                @click="handleNavigation('/matriculas')"
                                class="menu-item group"
                                :class="
                                    isActive('/matriculas')
                                        ? 'bg-orange-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-orange-500/10 text-orange-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                                        ></path>
                                        <path
                                            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/matriculas')
                                                ? 'text-orange-500'
                                                : 'text-text group-hover:text-orange-500'
                                        "
                                        >Matrículas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Gestão de matrículas</span
                                    >
                                </div>
                            </button>

                            <!-- Avaliação -->
                            <button
                                v-if="permissions.can('btn_avaliacao')"
                                @click="handleNavigation('/avaliacao-gestao')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/avaliacao-gestao')
                                        ? 'bg-orange-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-orange-500/10 text-orange-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M12 20h9"></path>
                                        <path
                                            d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/avaliacao-gestao')
                                                ? 'text-orange-500'
                                                : 'text-text group-hover:text-orange-500'
                                        "
                                        >Avaliação</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Lançamento de conceitos</span
                                    >
                                </div>
                            </button>

                            <!-- Certificados -->
                            <button
                                v-if="permissions.can('btn_certificados')"
                                @click="
                                    handleNavigation('/gestao-certificados')
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/gestao-certificados')
                                        ? 'bg-orange-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-orange-500/10 text-orange-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M12 2l2.09 4.26L19 7l-3.45 3.36.82 4.74L12 12.77 7.63 15.1l.82-4.74L5 7l4.91-.74L12 2z"
                                        ></path>
                                        <path
                                            d="M7 13.5V22l5-3 5 3v-8.5"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/gestao-certificados')
                                                ? 'text-orange-500'
                                                : 'text-text group-hover:text-orange-500'
                                        "
                                        >Certificados</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Modelos e emissões</span
                                    >
                                </div>
                            </button>

                            <!-- Carômetro -->
                            <button
                                v-if="permissions.can('btn_carometro')"
                                @click="handleNavigation('/carometro')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/carometro')
                                        ? 'bg-orange-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-orange-500/10 text-orange-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="3"
                                            y="3"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <circle
                                            cx="8.5"
                                            cy="8.5"
                                            r="1.5"
                                        ></circle>
                                        <polyline
                                            points="21 15 16 10 5 21"
                                        ></polyline>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/carometro')
                                                ? 'text-orange-500'
                                                : 'text-text group-hover:text-orange-500'
                                        "
                                        >Carômetro</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Visualização de turmas</span
                                    >
                                </div>
                            </button>

                            <!-- Cursos e Turmas -->
                            <button
                                v-if="permissions.can('btn_cursos_turmas')"
                                @click="handleNavigation('/cursos-turmas')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/cursos-turmas')
                                        ? 'bg-orange-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-orange-500/10 text-orange-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <line
                                            x1="12"
                                            y1="5"
                                            x2="12"
                                            y2="19"
                                        ></line>
                                        <line
                                            x1="5"
                                            y1="12"
                                            x2="19"
                                            y2="12"
                                        ></line>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/cursos-turmas')
                                                ? 'text-orange-500'
                                                : 'text-text group-hover:text-orange-500'
                                        "
                                        >Cursos e Turmas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Gestão acadêmica</span
                                    >
                                </div>
                            </button>

                            <!-- Colaboradores -->
                            <button
                                v-if="
                                    permissions.can(
                                        'btn_secretaria_colaboradores',
                                    )
                                "
                                @click="handleNavigation('/colaboradores')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/colaboradores')
                                        ? 'bg-orange-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-orange-500/10 text-orange-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                                        ></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path
                                            d="M23 21v-2a4 4 0 0 0-3-3.87"
                                        ></path>
                                        <path
                                            d="M16 3.13a4 4 0 0 1 0 7.75"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/colaboradores')
                                                ? 'text-orange-500'
                                                : 'text-text group-hover:text-orange-500'
                                        "
                                        >Colaboradores</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Gestão de equipe</span
                                    >
                                </div>
                            </button>

                            <!-- Criar Documentos Curso -->
                            <button
                                v-if="
                                    permissions.can(
                                        'btn_criar_documentos_curso',
                                    )
                                "
                                @click="handleNavigation('/gestao-documentos')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/gestao-documentos')
                                        ? 'bg-orange-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-orange-500/10 text-orange-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                        ></path>
                                        <polyline
                                            points="14 2 14 8 20 8"
                                        ></polyline>
                                        <line
                                            x1="12"
                                            y1="18"
                                            x2="12"
                                            y2="12"
                                        ></line>
                                        <line
                                            x1="9"
                                            y1="15"
                                            x2="15"
                                            y2="15"
                                        ></line>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/gestao-documentos')
                                                ? 'text-orange-500'
                                                : 'text-text group-hover:text-orange-500'
                                        "
                                        >Criar Documentos</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Áreas e Turmas</span
                                    >
                                </div>
                            </button>

                            <button
                                v-if="permissions.can('btn_meus_grupos_jnpta')"
                                @click="handleNavigation('/jnpta?tab=editais')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/jnpta') ? 'bg-orange-500/5' : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-orange-500/10 text-orange-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                                        ></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path
                                            d="M23 21v-2a4 4 0 0 0-3-3.87"
                                        ></path>
                                        <path
                                            d="M16 3.13a4 4 0 0 1 0 7.75"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/jnpta')
                                                ? 'text-orange-500'
                                                : 'text-text group-hover:text-orange-500'
                                        "
                                        >Jornadas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Editais e selecionados</span
                                    >
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN -->
                <div class="flex-1 space-y-4">
                    <!-- ISLAND: Produção -->
                    <div
                        class="space-y-4"
                        v-if="permissions.can('ilha_producao')"
                    >
                        <div class="flex items-center gap-2 px-1">
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-emerald-500/60"
                            ></div>
                            <h3
                                class="text-xs font-black text-secondary tracking-[0.2em] uppercase"
                            >
                                Produção
                            </h3>
                        </div>

                        <div
                            class="bg-div-15 border border-secondary/10 rounded-xl overflow-hidden shadow-sm"
                        >
                            <!-- Calendário de Salas -->
                            <button
                                v-if="permissions.can('btn_calendario_salas')"
                                @click="handleNavigation('/calendario-salas')"
                                class="menu-item group"
                                :class="
                                    isActive('/calendario-salas')
                                        ? 'bg-emerald-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon"
                                    :class="
                                        isActive('/calendario-salas')
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                    "
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <line
                                            x1="16"
                                            y1="2"
                                            x2="16"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="8"
                                            y1="2"
                                            x2="8"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="10"
                                            x2="21"
                                            y2="10"
                                        ></line>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/calendario-salas')
                                                ? 'text-emerald-500'
                                                : 'text-text group-hover:text-emerald-500'
                                        "
                                        >Calendário de Salas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Agendamento</span
                                    >
                                </div>
                            </button>

                            <!-- Gestão de Estoque -->
                            <button
                                v-if="permissions.can('btn_estoque')"
                                @click="handleNavigation('/estoque')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/estoque')
                                        ? 'bg-emerald-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon"
                                    :class="
                                        isActive('/estoque')
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                    "
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                                        ></path>
                                        <line
                                            x1="7"
                                            y1="7"
                                            x2="7.01"
                                            y2="7"
                                        ></line>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/estoque')
                                                ? 'text-emerald-500'
                                                : 'text-text group-hover:text-emerald-500'
                                        "
                                        >Gestão de Estoque</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Kits, Produtos e Estoque</span
                                    >
                                </div>
                            </button>

                            <!-- Salas -->
                            <button
                                v-if="permissions.can('btn_salas')"
                                @click="handleNavigation('/salas')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/salas') ? 'bg-emerald-500/5' : ''
                                "
                            >
                                <div
                                    class="menu-icon"
                                    :class="
                                        isActive('/salas')
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                    "
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="3"
                                            y="3"
                                            width="7"
                                            height="7"
                                        ></rect>
                                        <rect
                                            x="14"
                                            y="3"
                                            width="7"
                                            height="7"
                                        ></rect>
                                        <rect
                                            x="14"
                                            y="14"
                                            width="7"
                                            height="7"
                                        ></rect>
                                        <rect
                                            x="3"
                                            y="14"
                                            width="7"
                                            height="7"
                                        ></rect>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/salas')
                                                ? 'text-emerald-500'
                                                : 'text-text group-hover:text-emerald-500'
                                        "
                                        >Salas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Gestão de espaços</span
                                    >
                                </div>
                            </button>

                            <!-- Reservas -->
                            <button
                                v-if="permissions.can('btn_reservas')"
                                @click="handleNavigation('/reservas')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/reservas')
                                        ? 'bg-emerald-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon"
                                    :class="
                                        isActive('/reservas')
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                    "
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                                        ></path>
                                        <rect
                                            x="8"
                                            y="2"
                                            width="8"
                                            height="4"
                                            rx="1"
                                            ry="1"
                                        ></rect>
                                        <path d="M12 11h4"></path>
                                        <path d="M12 16h4"></path>
                                        <path d="M8 11h.01"></path>
                                        <path d="M8 16h.01"></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/reservas')
                                                ? 'text-emerald-500'
                                                : 'text-text group-hover:text-emerald-500'
                                        "
                                        >Reservas</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Gerenciar solicitações</span
                                    >
                                </div>
                            </button>

                            <!-- Reservas Colaboradores -->
                            <button
                                v-if="
                                    permissions.can(
                                        'btn_reservas_colaboradores',
                                    )
                                "
                                @click="
                                    handleNavigation('/reservas-colaborador')
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/reservas-colaborador')
                                        ? 'bg-emerald-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon"
                                    :class="
                                        isActive('/reservas-colaborador')
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-emerald-500/10 text-emerald-500'
                                    "
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                                        ></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path
                                            d="M23 21v-2a4 4 0 0 0-3-3.87"
                                        ></path>
                                        <path
                                            d="M16 3.13a4 4 0 0 1 0 7.75"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/reservas-colaborador')
                                                ? 'text-emerald-500'
                                                : 'text-text group-hover:text-emerald-500'
                                        "
                                        >Reservas Colaboradores</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Por usuário</span
                                    >
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- ISLAND: Projetos e Oportunidades -->
                    <div
                        class="space-y-4"
                        v-if="permissions.can('ilha_projetos_oportunidades')"
                    >
                        <div class="flex items-center gap-2 px-1">
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-cyan-500/60"
                            ></div>
                            <h3
                                class="text-xs font-black text-secondary tracking-[0.2em] uppercase"
                            >
                                Projetos e Oportunidades
                            </h3>
                        </div>

                        <div
                            class="bg-div-15 border border-secondary/10 rounded-xl overflow-hidden shadow-sm"
                        >
                            <!-- Bolsa Oportunidade -->
                            <button
                                v-if="permissions.can('btn_bolsa_oportunidade')"
                                @click="handleNavigation('/bolsas')"
                                class="menu-item group"
                                :class="
                                    isActive('/bolsas') ? 'bg-cyan-500/5' : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-cyan-500/10 text-cyan-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/bolsas')
                                                ? 'text-cyan-500'
                                                : 'text-text group-hover:text-cyan-500'
                                        "
                                        >Bolsa Oportunidade</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Gestão de bolsas</span
                                    >
                                </div>
                            </button>

                            <!-- Editais -->
                            <button
                                v-if="permissions.can('btn_editais_admin')"
                                @click="handleNavigation('/editais')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/editais') ? 'bg-cyan-500/5' : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-cyan-500/10 text-cyan-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                        ></path>
                                        <polyline
                                            points="14 2 14 8 20 8"
                                        ></polyline>
                                        <line
                                            x1="16"
                                            y1="13"
                                            x2="8"
                                            y2="13"
                                        ></line>
                                        <line
                                            x1="16"
                                            y1="17"
                                            x2="8"
                                            y2="17"
                                        ></line>
                                        <polyline
                                            points="10 9 9 9 8 9"
                                        ></polyline>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/editais')
                                                ? 'text-cyan-500'
                                                : 'text-text group-hover:text-cyan-500'
                                        "
                                        >Editais</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Gerenciar editais</span
                                    >
                                </div>
                            </button>

                            <!-- Oportunidades -->
                            <button
                                v-if="
                                    permissions.can('btn_oportunidades_admin')
                                "
                                @click="handleNavigation('/oportunidades')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/oportunidades')
                                        ? 'bg-cyan-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-cyan-500/10 text-cyan-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line
                                            x1="2"
                                            y1="12"
                                            x2="22"
                                            y2="12"
                                        ></line>
                                        <path
                                            d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/oportunidades')
                                                ? 'text-cyan-500'
                                                : 'text-text group-hover:text-cyan-500'
                                        "
                                        >Oportunidades</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Vagas e estágios</span
                                    >
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- ISLAND: Diário de Classe -->
                    <div
                        class="space-y-4"
                        v-if="permissions.can('ilha_diario_classe')"
                    >
                        <div class="flex items-center gap-2 px-1">
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-blue-500/60"
                            ></div>
                            <h3
                                class="text-xs font-black text-secondary tracking-[0.2em] uppercase"
                            >
                                Diário de Classe
                            </h3>
                        </div>

                        <div
                            class="bg-div-15 border border-secondary/10 rounded-xl overflow-hidden shadow-sm"
                        >
                            <!-- Diário Extensão -->
                            <button
                                v-if="permissions.can('btn_diario_extensao')"
                                @click="handleNavigation('/diario/extensao')"
                                class="menu-item group"
                                :class="
                                    isActive('/diario/extensao')
                                        ? 'bg-blue-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-blue-500/10 text-blue-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                        ></path>
                                        <polyline
                                            points="14 2 14 8 20 8"
                                        ></polyline>
                                        <line
                                            x1="16"
                                            y1="13"
                                            x2="8"
                                            y2="13"
                                        ></line>
                                        <line
                                            x1="16"
                                            y1="17"
                                            x2="8"
                                            y2="17"
                                        ></line>
                                        <polyline
                                            points="10 9 9 9 8 9"
                                        ></polyline>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/diario/extensao')
                                                ? 'text-blue-500'
                                                : 'text-text group-hover:text-blue-500'
                                        "
                                        >Diário Extensão</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Frequência e conteúdo</span
                                    >
                                </div>
                            </button>

                            <!-- Diário Regulares -->
                            <button
                                v-if="permissions.can('btn_diario_regulares')"
                                @click="handleNavigation('/diario/regulares')"
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/diario/regulares')
                                        ? 'bg-blue-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-blue-500/10 text-blue-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                                        ></path>
                                        <path
                                            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/diario/regulares')
                                                ? 'text-blue-500'
                                                : 'text-text group-hover:text-blue-500'
                                        "
                                        >Diário Regulares</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Acompanhamento regular</span
                                    >
                                </div>
                            </button>

                            <!-- Diário Cursos Livres -->
                            <button
                                v-if="
                                    permissions.can('btn_diario_cursos_livres')
                                "
                                @click="
                                    handleNavigation('/diario/cursos_livres')
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/diario/cursos_livres')
                                        ? 'bg-blue-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-blue-500/10 text-blue-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line
                                            x1="12"
                                            y1="16"
                                            x2="12"
                                            y2="12"
                                        ></line>
                                        <line
                                            x1="12"
                                            y1="8"
                                            x2="12.01"
                                            y2="8"
                                        ></line>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/diario/cursos_livres')
                                                ? 'text-blue-500'
                                                : 'text-text group-hover:text-blue-500'
                                        "
                                        >Diário Cursos Livres</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Cursos de curta duração</span
                                    >
                                </div>
                            </button>

                            <!-- Diário Especialização -->
                            <button
                                v-if="
                                    permissions.can('btn_diario_especializacao')
                                "
                                @click="
                                    handleNavigation('/diario/especializacao')
                                "
                                class="menu-item group border-t border-secondary/5"
                                :class="
                                    isActive('/diario/especializacao')
                                        ? 'bg-blue-500/5'
                                        : ''
                                "
                            >
                                <div
                                    class="menu-icon bg-blue-500/10 text-blue-500"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                        ></path>
                                    </svg>
                                </div>
                                <div class="flex flex-col text-left">
                                    <span
                                        class="text-sm font-bold transition-colors"
                                        :class="
                                            isActive('/diario/especializacao')
                                                ? 'text-blue-500'
                                                : 'text-text group-hover:text-blue-500'
                                        "
                                        >Diário Especialização</span
                                    >
                                    <span
                                        class="text-[10px] text-secondary font-medium"
                                        >Cursos de especialização</span
                                    >
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 3. Footer -->
        <footer class="p-6 text-center border-t border-secondary/5">
            <p
                class="text-[10px] text-secondary/30 font-black tracking-[0.3em] uppercase"
            >
                SPEDIGITAL :: NAV
            </p>
        </footer>
    </div>
</template>

<style scoped>
.menu-item {
    @apply w-full flex items-center gap-3 p-3 transition-all duration-200 hover:bg-div-30 active:scale-[0.99];
}

.menu-icon {
    @apply w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(var(--color-secondary-rgb), 0.1);
    border-radius: 10px;
}
</style>
