<template>
  <div class="bg-secondary-surface border border-divider rounded-xl overflow-hidden shadow-sm">
    <div class="h-1" :class="conectado ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'" />

    <div class="p-6 md:p-8">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center border" :class="conectado ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'">
          <Icon v-if="conectado" name="ph:check-circle-bold" class="w-6 h-6" />
          <Icon v-else name="ph:warning-circle-bold" class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-lg font-black text-text">Stripe</h2>
          <p class="text-xs text-secondary/70 font-semibold">{{ conectado ? `Conectado (${ambiente})` : "Não conectado" }}</p>
        </div>
      </div>

      <div v-if="conectado" class="space-y-3 mb-6">
        <div class="flex items-center justify-between py-2.5 px-4 rounded-lg bg-div-15 border border-divider">
          <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Conta</span>
          <span class="text-xs font-mono font-bold text-text">{{ contaId }}</span>
        </div>
        <div class="flex items-center justify-between py-2.5 px-4 rounded-lg bg-div-15 border border-divider">
          <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Ambiente</span>
          <span :class="['text-xs font-black uppercase tracking-wider', ambiente === 'testes' ? 'text-amber-500' : 'text-emerald-500']">{{ ambiente }}</span>
        </div>
      </div>

      <div v-if="!conectado" class="mb-6">
        <p class="text-xs text-secondary/70 leading-relaxed font-medium">
          Conecte sua conta Stripe para receber pagamentos das matrículas e vendas realizadas na plataforma.
        </p>
      </div>

      <button
        v-if="!conectado"
        :disabled="conectando"
        @click="$emit('conectar')"
        class="w-full py-3 rounded-xl bg-[#635bff] text-white text-xs font-black uppercase tracking-widest hover:bg-[#544de0] transition-all shadow-lg shadow-[#635bff]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <div v-if="conectando" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        {{ conectando ? "Conectando..." : "Conectar Stripe" }}
      </button>

      <button
        v-else
        @click="$emit('reconectar')"
        class="w-full py-3 rounded-xl bg-secondary-surface-hover border border-divider text-secondary text-xs font-black uppercase tracking-widest hover:text-text transition-all"
      >
        Reconectar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  conectado: boolean
  conectando: boolean
  ambiente: string
  contaId: string | null
}>()

defineEmits<{
  conectar: []
  reconectar: []
}>()
</script>

<style scoped>
.gateway-card {
  display: block;
}
</style>

