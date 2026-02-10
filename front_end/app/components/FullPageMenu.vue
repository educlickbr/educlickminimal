<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["close"])
const router = useRouter()
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- ISLAND: Educacional -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 px-1">
             <div class="w-1.5 h-1.5 rounded-full bg-violet-500/60"></div>
             <h3 class="text-xs font-black text-secondary tracking-[0.2em] uppercase">Módulos</h3>
          </div>
          
          <div class="bg-div-15 border border-secondary/10 rounded-xl overflow-hidden shadow-sm">
            <!-- Example Item -->
            <button @click="handleNavigation('/')" class="menu-item group" :class="isActive('/') ? 'bg-violet-500/5' : ''">
              <div class="menu-icon bg-violet-500/10 text-violet-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <div class="flex flex-col text-left">
                <span class="text-sm font-bold transition-colors" :class="isActive('/') ? 'text-violet-500' : 'text-text group-hover:text-violet-500'">Início</span>
                <span class="text-[10px] text-secondary font-medium">Dashboard principal</span>
              </div>
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
