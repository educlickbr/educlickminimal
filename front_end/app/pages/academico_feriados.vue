<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-black text-primary uppercase tracking-widest">Feriados e Recessos</h1>
      <p class="text-xs font-bold text-secondary/60 uppercase tracking-widest">Datas de cancelamento de aulas</p>
    </header>

    <div class="bg-div-10 border border-secondary/10 rounded-2xl p-6 flex flex-col gap-6">
      <h2 class="text-sm font-black text-primary uppercase tracking-[0.2em]">Adicionar Feriado</h2>
      
      <form @submit.prevent="handleSave" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-background p-4 rounded-xl border border-secondary/5 shadow-inner">
        <div class="flex flex-col gap-1.5 md:col-span-1">
          <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Data</label>
          <input 
            type="date" 
            v-model="form.data" 
            required
            class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 bg-div-5 text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
          />
        </div>
        
        <div class="flex flex-col gap-1.5 md:col-span-2">
          <label class="text-[10px] font-black text-secondary/60 uppercase tracking-widest px-1">Nome/Motivo</label>
          <input 
            type="text" 
            v-model="form.nome" 
            placeholder="Ex: Feriado Nacional, Emenda..."
            required
            class="w-full px-4 py-2.5 rounded-lg border border-secondary/10 bg-div-5 text-sm font-bold text-primary focus:border-primary/50 transition-all outline-none" 
          />
        </div>

        <div class="flex items-center h-10 px-2 gap-2">
          <input type="checkbox" id="recorrente" v-model="form.recorrente" class="w-4 h-4 rounded text-primary bg-background border-secondary/30" />
          <label for="recorrente" class="text-xs font-bold text-secondary cursor-pointer uppercase tracking-widest">Anual?</label>
        </div>

        <div class="md:col-span-4 flex justify-end mt-2">
          <button 
            type="submit" 
            :disabled="loading"
            class="px-6 py-2.5 rounded-lg bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {{ loading ? 'Salvando...' : 'Adicionar Feriado' }}
          </button>
        </div>
      </form>

      <h2 class="text-sm font-black text-primary uppercase tracking-[0.2em] mt-4">Lista de Feriados</h2>
      
      <div v-if="loadingList" class="flex justify-center p-8">
        <div class="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
      
      <div v-else-if="feriados.length === 0" class="text-center py-12 bg-background rounded-xl border border-secondary/5">
        <Icon name="ph:calendar-blank-duotone" class="w-12 h-12 text-secondary/20 mx-auto mb-2" />
        <p class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Nenhum feriado cadastrado</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div 
          v-for="f in feriados" :key="f.id"
          class="bg-background rounded-xl p-4 border border-secondary/5 flex flex-col gap-2 relative group hover:border-primary/30 transition-all shadow-sm"
        >
          <div class="flex items-start justify-between">
            <span class="px-2 py-0.5 rounded text-[10px] font-black bg-primary/10 text-primary uppercase tracking-widest">
              {{ formatDateShort(f.data) }} {{ f.recorrente_anual ? '(Anual)' : '' }}
            </span>
            
            <button 
              @click="handleDelete(f.id)"
              v-if="f.id_entidade"
              class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-secondary/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
              title="Excluir"
            >
              <Icon name="ph:trash-bold" class="w-3.5 h-3.5" />
            </button>
          </div>
          
          <h3 class="text-xs font-bold text-secondary mt-1 max-w-[90%] truncate">{{ f.nome }}</h3>
          
          <div v-if="!f.id_entidade" class="absolute bottom-2 right-3">
            <span class="text-[8px] font-black text-orange-500/60 uppercase tracking-widest bg-orange-500/10 px-1.5 py-0.5 rounded">Global</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'base'
})

import { useAppStore } from '../../stores/app'
import { useToast } from '~/composables/useToast'

const store = useAppStore()
const toast = useToast()

const loading = ref(false)
const loadingList = ref(true)
const feriados = ref<any[]>([])

const form = reactive({
  data: '',
  nome: '',
  recorrente: false
})

function formatDateShort(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function getEntidadeAtivaId() {
  const entidades = store.entidades || []
  for (const ent of entidades) {
    if (ent.tipo === 'empresa' && Array.isArray(ent.produtos)) {
      if (ent.produtos.some((p: any) => p.slug === 'academico')) return ent.id
    }
  }
  return entidades[0]?.id || null
}

async function fetchFeriados() {
  loadingList.value = true
  try {
    const id_entidade = getEntidadeAtivaId()
    if (!id_entidade) return
    const res = await $fetch('/api/feriados', { params: { id_entidade } }) as any
    if (res?.success) feriados.value = res.itens
  } catch (e) {
    console.error(e)
  } finally {
    loadingList.value = false
  }
}

async function handleSave() {
  if (!form.data || !form.nome.trim()) return
  loading.value = true
  
  try {
    const id_entidade = getEntidadeAtivaId()
    if (!id_entidade) throw new Error('Entidade ativa não encontrada')
    
    const res = await $fetch('/api/feriados', {
      method: 'POST',
      body: {
        id_entidade,
        data: form.data,
        nome: form.nome,
        recorrente_anual: form.recorrente,
        usuario_id: store.user_expandido_id
      }
    }) as any
    
    if (res?.success) {
      toast.showToast('Feriado adicionado!', { type: 'success' })
      form.data = ''
      form.nome = ''
      form.recorrente = false
      await fetchFeriados()
    } else {
      throw new Error(res?.message || 'Erro ao salvar')
    }
  } catch (e: any) {
    toast.showToast(e.message, { type: 'error' })
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Deseja excluir este feriado?')) return
  try {
    const res = await $fetch('/api/feriados', {
      method: 'DELETE',
      body: { id }
    }) as any
    if (res?.success) {
      toast.showToast('Feriado excluído.', { type: 'success' })
      await fetchFeriados()
    } else throw new Error(res?.message)
  } catch(e: any) {
    toast.showToast(e.message, { type: 'error' })
  }
}

if (import.meta.client) {
  onMounted(async () => {
    if (!store.entidades?.length) await store.initSession()
    fetchFeriados()
  })
}
</script>
