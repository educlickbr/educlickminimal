<script setup lang="ts">
definePageMeta({
    layout: 'base'
})

import { useAppStore } from '../../stores/app'
const store = useAppStore()
</script>

<template>
  <div class="flex flex-col gap-6">
    
    <!-- Welcome Header -->
    <div class="bg-div-15 rounded-xl p-6 border border-secondary/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h1 class="text-xl font-black text-white uppercase tracking-widest">
                Bem-vindo ao EduClick
            </h1>
            <p class="text-xs font-bold text-secondary/60 mt-1 uppercase tracking-wider">
                Sua plataforma de gestão educacional
            </p>
        </div>
        
        <div v-if="store.user" class="flex gap-4">
            <button @click="store.logout()" class="bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-lg transition-all">
                Sair
            </button>
        </div>
    </div>

    <!-- User Info Card (Confirmation that login worked) -->
    <div v-if="store.user" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Profile Card -->
        <div class="bg-div-15 p-6 rounded-xl border border-secondary/5">
             <h2 class="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Seu Perfil</h2>
             <div class="space-y-2 text-sm">
                <p><span class="text-secondary font-bold">Nome:</span> {{ store.nome || 'Não definido' }} {{ store.sobrenome || '' }}</p>
                <p><span class="text-secondary font-bold">Email:</span> {{ store.user.email }}</p>
                <p><span class="text-secondary font-bold">ID:</span> {{ store.user_expandido_id || '...' }}</p>
             </div>
        </div>
    </div>
    <div v-else class="text-center p-12 opacity-50">
        <p>Você não está logado.</p>
    </div>

  </div>
</template>
