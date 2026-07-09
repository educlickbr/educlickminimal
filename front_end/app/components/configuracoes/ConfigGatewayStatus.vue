<template>
  <div class="bg-[#0f0f17] border border-white/5 rounded-xl overflow-hidden">
    <div class="h-1" :class="conectado ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'" />

    <div class="p-8">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="conectado ? 'bg-green-500/10' : 'bg-amber-500/10'">
          <svg v-if="conectado" width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-green-400">
            <path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-amber-400">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-black text-white/90">Stripe</h2>
          <p class="text-xs text-secondary/50">{{ conectado ? `Conectado (${ambiente})` : "Não conectado" }}</p>
        </div>
      </div>

      <div v-if="conectado" class="space-y-3 mb-6">
        <div class="flex items-center justify-between py-2 px-4 rounded-lg bg-white/[0.02] border border-white/5">
          <span class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Conta</span>
          <span class="text-xs font-bold text-white/70 font-mono">{{ contaId }}</span>
        </div>
        <div class="flex items-center justify-between py-2 px-4 rounded-lg bg-white/[0.02] border border-white/5">
          <span class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Ambiente</span>
          <span :class="['text-xs font-bold uppercase', ambiente === 'testes' ? 'text-amber-400' : 'text-green-400']">{{ ambiente }}</span>
        </div>
      </div>

      <div v-if="!conectado" class="mb-6">
        <p class="text-xs text-secondary/50 leading-relaxed">
          Conecte sua conta Stripe para receber pagamentos das matrículas e vendas realizadas na plataforma.
        </p>
      </div>

      <button
        v-if="!conectado"
        :disabled="conectando"
        @click="$emit('conectar')"
        class="w-full py-3 rounded-xl bg-[#635bff] text-white text-xs font-black uppercase tracking-widest hover:bg-[#544de0] transition-all shadow-lg shadow-[#635bff]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <svg v-if="conectando" class="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="32" stroke-dashoffset="32" /></svg>
        {{ conectando ? "Conectando..." : "Conectar Stripe" }}
      </button>

      <button
        v-else
        @click="$emit('reconectar')"
        class="w-full py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 text-xs font-bold uppercase tracking-widest hover:text-white/80 hover:border-white/20 transition-all"
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
