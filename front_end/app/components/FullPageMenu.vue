<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isStatic: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(["close"])
const router = useRouter()
import { useAppStore } from '../../stores/app'
const store = useAppStore() // Assuming useAppStore has auth info
const route = useRoute()

// Active Route Helper
const isActive = (path) => {
    return route.path === path || route.path.startsWith(path + '/')
}

// Navigation Helper
const handleNavigation = (path) => {
  if (!path) return
  router.push(path)
  emit("close")
}

// Close Helper
const closeMenu = () => {
  emit("close")
}

// User Info Helpers
const userName = computed(() => {
  if (store.nome) return store.nome
  if (store.user && store.user.email) return store.user.email.split('@')[0]
  return 'Convidado'
})

const userInitial = computed(() => {
  return userName.value ? userName.value.charAt(0).toUpperCase() : 'C'
})
</script>

<template>
  <div
    class="fixed inset-0 z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-background flex flex-col font-sans p-4 gap-4"
    :class="isOpen ? 'translate-x-0' : 'translate-x-[102%]'"
  >
    <!-- 1. Header -->
    <header class="bg-transparent md:bg-div-15 px-1 py-2 md:px-4 md:py-3 rounded-lg flex items-center justify-between shadow-none md:shadow-sm border-0 md:border border-secondary/5 shrink-0">
      <div class="flex items-center gap-3">
        <div class="hidden md:flex w-8 h-8 rounded bg-primary/10 text-primary items-center justify-center font-bold text-sm border border-primary/10 shadow-sm overflow-hidden relative">
           <img 
              v-if="store.imagem_user && store.hash_base" 
              :src="store.hash_base + store.imagem_user" 
              class="w-full h-full object-cover absolute inset-0"
              alt="Foto"
           />
           <span v-else>{{ userInitial }}</span>
        </div>
        <div class="flex flex-col leading-none gap-0.5">
          <h2 class="text-[12px] md:text-xs font-black text-text uppercase tracking-[0.2em] leading-none">
            Olá, {{ userName.split(' ')[0] }}
          </h2>
          <p class="text-[10px] md:text-[10px] text-secondary font-bold opacity-80 leading-none">Menu Principal</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Close Button -->
        <button
          v-if="!isStatic"
          @click="closeMenu"
          class="p-2 text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </header>

    <!-- 2. Scrollable Content Area -->
    <main class="flex-1 overflow-y-auto px-2 space-y-8 max-w-7xl mx-auto w-full custom-scrollbar">
      
      <!-- Menu Grid Structure -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-8">
        
        <!-- ISLAND: Acadêmico -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 px-1">
             <div class="w-2 h-2 rounded-full bg-violet-500/80 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
             <h3 class="text-xs font-black text-secondary tracking-[0.2em] uppercase">Acadêmico</h3>
          </div>
          
          <div class="bg-div-15 border border-secondary/5 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <button @click="handleNavigation('/academico_oferta')" class="menu-item group" :class="isActive('/academico_oferta') ? 'bg-violet-500/5' : ''">
              <div class="menu-icon bg-violet-500/10 text-violet-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              </div>
              <div class="flex flex-col text-left">
                <span class="text-sm font-bold transition-colors" :class="isActive('/academico_oferta') ? 'text-violet-500' : 'text-text group-hover:text-violet-500'">Oferta de Cursos</span>
              </div>
            </button>
            <button @click="handleNavigation('/formularios')" class="menu-item group disabled:opacity-50">
              <div class="menu-icon bg-violet-500/5 text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-violet-500 transition-colors">Formulários Programas</span></div>
            </button>
            <button @click="handleNavigation('/processos')" class="menu-item group" :class="isActive('/processos') ? 'bg-violet-500/5' : ''">
              <div class="menu-icon bg-violet-500/10 text-violet-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div class="flex flex-col text-left">
                <span class="text-sm font-bold transition-colors" :class="isActive('/processos') ? 'text-violet-500' : 'text-text group-hover:text-violet-500'">Processos</span>
              </div>
            </button>
            <button @click="handleNavigation('/matriculas')" class="menu-item group disabled:opacity-50">
              <div class="menu-icon bg-violet-500/5 text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-violet-500 transition-colors">Matrículas</span></div>
            </button>
            <button @click="handleNavigation('/academico_calendario')" class="menu-item group" :class="isActive('/academico_calendario') ? 'bg-violet-500/5' : ''">
              <div class="menu-icon bg-violet-500/10 text-violet-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div class="flex flex-col text-left">
                <span class="text-sm font-bold transition-colors" :class="isActive('/academico_calendario') ? 'text-violet-500' : 'text-text group-hover:text-violet-500'">Calendário Escolar</span>
              </div>
            </button>
            <button @click="handleNavigation('/calendario_salas')" class="menu-item group disabled:opacity-50">
              <div class="menu-icon bg-violet-500/5 text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-violet-500 transition-colors">Calendário de Salas</span></div>
            </button>
            <button @click="handleNavigation('/atribuicao')" class="menu-item group disabled:opacity-50">
              <div class="menu-icon bg-violet-500/5 text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-violet-500 transition-colors">Atribuição</span></div>
            </button>
            <button @click="handleNavigation('/programacao_atividades')" class="menu-item group" :class="isActive('/programacao_atividades') ? 'bg-violet-500/5' : ''">
              <div class="menu-icon bg-violet-500/10 text-violet-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div class="flex flex-col text-left">
                <span class="text-sm font-bold transition-colors" :class="isActive('/programacao_atividades') ? 'text-violet-500' : 'text-text group-hover:text-violet-500'">Programação Atividades</span>
              </div>
            </button>
            <button @click="handleNavigation('/avaliacoes')" class="menu-item group disabled:opacity-50">
              <div class="menu-icon bg-violet-500/5 text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-violet-500 transition-colors">Avaliações</span></div>
            </button>
            <button @click="handleNavigation('/diario_classe')" class="menu-item group disabled:opacity-50">
              <div class="menu-icon bg-violet-500/5 text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-violet-500 transition-colors">Diário de Classe</span></div>
            </button>
          </div>
        </div>

        <!-- ISLAND: Comercial -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 px-1">
             <div class="w-2 h-2 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
             <h3 class="text-xs font-black text-secondary tracking-[0.2em] uppercase">Comercial</h3>
          </div>
          
          <div class="bg-div-15 border border-secondary/5 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <button @click="handleNavigation('/produtos')" class="menu-item group">
              <div class="menu-icon bg-emerald-500/5 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-emerald-500 transition-colors">Produtos</span></div>
            </button>
            <button @click="handleNavigation('/vendas')" class="menu-item group">
              <div class="menu-icon bg-emerald-500/5 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-emerald-500 transition-colors">Vendas</span></div>
            </button>
            <button @click="handleNavigation('/dashboard_vendas')" class="menu-item group">
              <div class="menu-icon bg-emerald-500/5 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-emerald-500 transition-colors">Dashboard</span></div>
            </button>
          </div>
        </div>

        <!-- ISLAND: Portal do Aluno -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 px-1">
             <div class="w-2 h-2 rounded-full bg-sky-500/80 shadow-[0_0_8px_rgba(14,165,233,0.6)]"></div>
             <h3 class="text-xs font-black text-secondary tracking-[0.2em] uppercase">Portal do Aluno</h3>
          </div>
          
          <div class="bg-div-15 border border-secondary/5 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <button @click="handleNavigation('/meus_processos')" class="menu-item group">
              <div class="menu-icon bg-sky-500/10 text-sky-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-sky-500 transition-colors">Meus Processos</span></div>
            </button>
            <button @click="handleNavigation('/minhas_atividades')" class="menu-item group">
              <div class="menu-icon bg-sky-500/5 text-sky-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-sky-500 transition-colors">Minhas Atividades</span></div>
            </button>
            <button @click="handleNavigation('/certificados')" class="menu-item group disabled:opacity-50">
              <div class="menu-icon bg-sky-500/5 text-sky-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 8.5V12a10 10 0 1 1-20 0V8.5"></path><path d="M22 8.5C22 10.43 17.52 12 12 12S2 10.43 2 8.5"></path><path d="M2 8.5C2 6.57 6.48 5 12 5s10 1.57 10 3.5"></path></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-sky-500 transition-colors">Meus Certificados</span></div>
            </button>
            <button @click="handleNavigation('/gestao_faltas')" class="menu-item group disabled:opacity-50">
              <div class="menu-icon bg-sky-500/5 text-sky-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="9" y1="16" x2="15" y2="16"></line><line x1="12" y1="13" x2="12" y2="19"></line></svg>
              </div>
              <div class="flex flex-col text-left"><span class="text-sm font-bold text-text group-hover:text-sky-500 transition-colors">Gestão de Faltas</span></div>
            </button>
          </div>
        </div>

      </div>
    </main>

    <!-- 3. Footer -->
    <footer class="p-6 text-center border-t border-secondary/5">
      <p class="text-[10px] text-secondary/30 font-black tracking-[0.3em] uppercase">EDUCLICK :: MIN</p>
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
