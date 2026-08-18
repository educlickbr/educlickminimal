<template>
  <div class="flex flex-col h-full p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-black text-white/90">Meus Cursos</h1>
        <span class="text-[10px] font-black text-secondary/30 uppercase tracking-widest">
          {{ loading ? '...' : pedidos.length + ' curso(s)' }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
    </div>

    <div v-else-if="pedidos.length === 0" class="flex-1 flex flex-col items-center justify-center gap-3">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="text-white/20">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <p class="text-sm font-bold text-white/30">Nenhum curso adquirido</p>
      <NuxtLink to="/oferta" class="text-[10px] font-bold text-primary hover:text-primary/80">Ver cursos disponíveis</NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button v-for="ped in pedidos" :key="ped.id"
        @click="entrarNoCurso(ped)"
        :class="['curso-card', ped.status === 'concluido' ? 'curso-card--clickable' : 'curso-card--bloqueado']"
      >
        <div class="h-1 bg-gradient-to-r from-primary to-purple-500" />
        <div class="p-6 text-left flex-1">
          <p class="text-lg font-black mb-1">{{ ped.programa_descricao || ped.nome_curso }}</p>
          <p v-if="ped.nome_curto" class="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-3">{{ ped.nome_curto }}</p>
          <div class="flex items-center gap-2 mb-4">
            <span :class="['badge', ped.status === 'concluido' ? 'badge--ativo' : 'badge--inativo']">
              {{ ped.status === 'concluido' ? '✅ Ativo' : '⏳ Pendente' }}
            </span>
            <span v-if="ped.valor_pago_centavos > 0" class="text-[10px] text-secondary/50">
              Pago: R$ {{ (ped.valor_pago_centavos / 100).toFixed(2).replace('.', ',') }}
            </span>
          </div>
          <p class="text-[10px] text-secondary/30">
            {{ new Date(ped.criado_em).toLocaleDateString('pt-BR') }}
          </p>
        </div>
        <div v-if="ped.status === 'concluido'" class="flex items-center pr-5">
          <span class="text-[10px] font-black text-primary/70 uppercase tracking-widest">Abrir</span>
          <svg class="ml-1 text-primary/60" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useAppStore } from "~~/stores/app"

definePageMeta({ layout: "base" })

const store = useAppStore()
const pedidos = ref<any[]>([])
const loading = ref(true)

function entrarNoCurso(ped: any) {
  if (ped.status !== "concluido") return
  navigateTo("/minhas_atividades")
}

onMounted(async () => {
  if (!store.initialized) await store.initSession()
  loading.value = true
  try {
    const id_entidade = store.entidades?.find((e: any) =>
      Array.isArray(e.produtos) && e.produtos.some((p: any) => p.slug === "academico")
    )?.id || store.entidades?.[0]?.id

    if (!id_entidade) return

    // Buscar pedidos concluídos do usuário logado
    const res = await $fetch("/api/comercial/pedidos", {
      params: { id_entidade, status: "concluido", page: 1, limit: 50 },
    }) as any
    pedidos.value = Array.isArray(res?.itens) ? res.itens : []
  } catch { /* ignora */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.badge {
  display: inline-flex; align-items: center;
  font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
  padding: 3px 8px; border-radius: 20px;
}
.badge--ativo { background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); color: #34d399; }
.badge--inativo { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); }
.curso-card { background: #0f0f17; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; overflow: hidden; display: flex; width: 100%; text-align: left; transition: all 0.2s; cursor: default; }
.curso-card--clickable { cursor: pointer; }
.curso-card--clickable:hover { border-color: rgba(139,92,246,0.3); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
.curso-card--bloqueado { opacity: 0.65; }
</style>
