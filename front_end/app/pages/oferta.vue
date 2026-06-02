<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: false // Vamos usar um cabeçalho customizado para a página pública
})

const route = useRoute()
const loading = ref(true)
const programas = ref<any[]>([])
const areas = ref<any[]>([])
const activeArea = ref<string | null>(null)

// Captura o ID da entidade via query param ou usa o fallback solicitado
const fallbackId = '00ca60ea-6667-482d-8a96-09b877707b08'
const idEntidade = computed(() => (route.query.id_entidade as string) || fallbackId)

async function fetchData() {
  loading.value = true
  try {
    const [progRes, areaRes] = await Promise.all([
      $fetch('/api/public/programas', { params: { id_entidade: idEntidade.value } }),
      $fetch('/api/public/areas', { params: { id_entidade: idEntidade.value } })
    ]) as any

    if (progRes.success) programas.value = progRes.itens
    if (areaRes.success) areas.value = areaRes.itens
  } catch (e) {
    console.error('Erro ao carregar dados públicos:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const filteredProgramas = computed(() => {
  if (!activeArea.value) return programas.value
  return programas.value.filter(p => p.id_area === activeArea.value)
})

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch (e) {
    return dateStr
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-primary/30">
    
    <!-- Custom Public Header -->
    <header class="sticky top-0 z-50 bg-[#0f0f17]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
          <Icon name="ph:graduation-cap-fill" class="w-6 h-6 text-white" />
        </div>
        <div class="flex flex-col leading-tight">
          <span class="text-sm font-black uppercase tracking-[0.2em] text-primary">EduClick</span>
          <span class="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Portal de Ofertas</span>
        </div>
      </div>

      <nav class="hidden md:flex items-center gap-8">
        <a href="#" class="text-xs font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors">Início</a>
        <a href="#" class="text-xs font-bold uppercase tracking-widest text-primary transition-colors border-b-2 border-primary pb-1">Programas</a>
        <a href="#" class="text-xs font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors">Sobre</a>
      </nav>

      <button class="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
        Área do Aluno
      </button>
    </header>

    <!-- Hero Section -->
    <section class="relative py-20 px-6 overflow-hidden">
      <!-- Background Glows -->
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full"></div>

      <div class="max-w-6xl mx-auto relative z-10 text-center">
        <span class="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 animate-bounce">
          Inscrições Abertas
        </span>
        <h1 class="text-4xl md:text-6xl font-black mb-6 tracking-tight">
          Sua Jornada de <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Conhecimento</span> Começa Aqui.
        </h1>
        <p class="text-lg text-secondary max-w-2xl mx-auto leading-relaxed opacity-80">
          Explore nossos programas acadêmicos e trilhas de formação. Processos seletivos simplificados para você dar o próximo passo na sua carreira.
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 pb-20">
      
      <!-- Filters -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div class="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            @click="activeArea = null"
            class="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            :class="!activeArea ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-white'"
          >
            Todos
          </button>
          <button 
            v-for="area in areas" 
            :key="area.id"
            @click="activeArea = area.id"
            class="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
            :class="activeArea === area.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-white'"
          >
            {{ area.nome_area }}
          </button>
        </div>

        <div class="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-40">
          Exibindo {{ filteredProgramas.length }} ofertas disponíveis
        </div>
      </div>

      <!-- Grid -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="i in 6" :key="i" class="h-[400px] rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
      </div>

      <div v-else-if="filteredProgramas.length === 0" class="py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
        <Icon name="ph:folder-open-light" class="w-16 h-16 text-secondary/20 mb-4" />
        <p class="text-secondary font-bold">Nenhum programa encontrado para este filtro.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        <div 
          v-for="prog in filteredProgramas" 
          :key="prog.id"
          class="group relative bg-[#0f0f17] border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:translate-y-[-4px] shadow-xl hover:shadow-primary/5 flex flex-col"
        >
          <!-- Accent Bar -->
          <div class="h-1 bg-gradient-to-r from-primary to-purple-500 opacity-30 group-hover:opacity-100 transition-opacity"></div>

          <div class="p-8 flex-1 flex flex-col">
            <!-- Header: Area + Workload -->
            <div class="flex items-center justify-between mb-6">
              <span class="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">
                {{ prog.nome_area || 'Educação' }}
              </span>
              <div class="flex items-center gap-1.5 text-secondary/60">
                <Icon name="ph:clock-bold" class="w-3.5 h-3.5" />
                <span class="text-[10px] font-bold">{{ prog.carga_horaria_total_horas }}h Totais</span>
              </div>
            </div>

            <!-- Title -->
            <h3 class="text-xl font-black mb-3 leading-tight group-hover:text-primary transition-colors">
              {{ prog.nome_display }}
            </h3>
            <p class="text-xs text-secondary leading-relaxed line-clamp-2 mb-6 opacity-70">
              {{ prog.descricao || 'Conheça os detalhes deste programa acadêmico e inscreva-se agora.' }}
            </p>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-4 mb-8">
              <div class="flex flex-col gap-1">
                <span class="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Início das Aulas</span>
                <span class="text-xs font-bold text-white/90">{{ formatDate(prog.data_inicio_aula) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Inscrições Até</span>
                <span class="text-xs font-bold text-orange-400">{{ formatDate(prog.processo_seletivo_fim) }}</span>
              </div>
            </div>

            <!-- Enrollment Banner -->
            <div class="mt-auto p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                <Icon name="ph:user-plus-bold" class="w-4 h-4" />
              </div>
              <div class="flex flex-col">
                <span class="text-[8px] font-black text-secondary/40 uppercase tracking-widest">Matrículas</span>
                <span class="text-[10px] font-bold text-green-500/80">A partir de {{ formatDate(prog.matricula_inicio) }}</span>
              </div>
            </div>
          </div>

          <!-- Footer Action -->
          <div class="p-6 bg-white/[0.02] border-t border-white/5">
            <NuxtLink 
              :to="`/form/seletivo/estudante/${prog.id_area || '0'}/${prog.id}`"
              class="w-full py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 block text-center"
            >
              Acessar
            </NuxtLink>
          </div>
        </div>

      </div>
    </main>

    <!-- Footer -->
    <footer class="py-12 border-t border-white/5 text-center bg-[#0a0a0c]">
      <div class="flex items-center justify-center gap-3 mb-6">
        <Icon name="ph:graduation-cap-fill" class="w-6 h-6 text-primary" />
        <span class="text-sm font-black uppercase tracking-[0.3em] text-white">EduClick</span>
      </div>
      <p class="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] opacity-40">
        © {{ new Date().getFullYear() }} — Todos os direitos reservados
      </p>
    </footer>

  </div>
</template>


