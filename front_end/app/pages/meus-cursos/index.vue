<template>
  <div class="flex flex-col h-full p-6">
    <!-- Top bar: apenas contador sem título redundante -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
        {{ loading ? 'Carregando...' : pedidos.length + ' curso(s) adquirido(s)' }}
      </span>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin" />
    </div>

    <div v-else-if="pedidos.length === 0" class="flex-1 flex flex-col items-center justify-center gap-3 empty-state p-8">
      <Icon name="ph:books-bold" class="w-8 h-8 text-secondary/30" />
      <p class="text-sm font-bold text-text/80">Nenhum curso adquirido</p>
      <NuxtLink to="/oferta" class="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
        Ver cursos disponíveis
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button v-for="ped in pedidos" :key="ped.id"
        @click="entrarNoCurso(ped)"
        :class="['curso-card', ped.status === 'concluido' ? 'curso-card--clickable' : 'curso-card--bloqueado']"
      >
        <div class="h-1 bg-primary" />
        <div class="p-6 text-left flex-1 flex flex-col">
          <p class="text-base font-black text-text mb-1">{{ ped.programa_descricao || ped.nome_curso }}</p>
          <p v-if="ped.nome_curto" class="text-[10px] font-black text-primary uppercase tracking-widest mb-3">{{ ped.nome_curto }}</p>
          <div class="flex items-center gap-2 mb-4 mt-auto">
            <span :class="['badge', ped.status === 'concluido' ? 'badge--ativo' : 'badge--inativo']">
              {{ ped.status === 'concluido' ? '✅ Ativo' : '⏳ Pendente' }}
            </span>
            <span v-if="ped.valor_pago_centavos > 0" class="text-[10px] font-semibold text-secondary/60">
              Pago: R$ {{ (ped.valor_pago_centavos / 100).toFixed(2).replace('.', ',') }}
            </span>
          </div>
          <p class="text-[10px] font-semibold text-secondary/50">
            Adquirido em {{ new Date(ped.criado_em).toLocaleDateString('pt-BR') }}
          </p>
        </div>
        <div v-if="ped.status === 'concluido'" class="flex items-center pr-5">
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Abrir</span>
          <Icon name="ph:caret-right-bold" class="ml-1 text-primary w-3.5 h-3.5" />
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
.empty-state {
  background: var(--color-secondary-surface);
  border-radius: 14px;
  border: 1px dashed var(--color-divider);
}

.badge {
  display: inline-flex; align-items: center;
  font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
  padding: 3px 8px; border-radius: 20px;
}
.badge--ativo { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; }
.badge--inativo { background: var(--color-secondary-surface-hover); border: 1px solid var(--color-divider); color: var(--color-secondary); }

.curso-card {
  background: var(--color-secondary-surface);
  border: 1px solid var(--color-divider);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;
  cursor: default;
}
.curso-card--clickable { cursor: pointer; }
.curso-card--clickable:hover {
  background: var(--color-secondary-surface-hover);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.curso-card--bloqueado { opacity: 0.6; }
</style>
