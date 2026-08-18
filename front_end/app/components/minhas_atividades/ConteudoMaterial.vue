<template>
    <div class="flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar flex-1">
        <!-- Cabeçalho -->
        <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Material</span>
            <h2 class="text-lg font-black text-white/90">{{ item.titulo }}</h2>
            <p v-if="item.descricao" class="text-xs font-semibold text-white/40 leading-relaxed whitespace-pre-wrap">{{ item.descricao }}</p>
        </div>

        <!-- Status -->
        <div v-if="item.status_visibilidade !== 'disponivel' || item.concluido" class="flex gap-2 flex-wrap">
            <span v-if="item.status_visibilidade === 'agendado'" class="status-pill status--agendado">
                ⏰ Disponível a partir de {{ formatData(item.data_disponivel) }}
            </span>
            <span v-if="item.status_visibilidade === 'prazo_encerrado'" class="status-pill status--prazo">✕ Prazo encerrado</span>
            <span v-if="item.concluido" class="status-pill status--ok">✓ Concluído</span>
        </div>

        <!-- Arquivo -->
        <div v-if="item.id_arquivo" class="file-card">
            <div class="file-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
            </div>
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                <span class="text-xs font-bold text-white/75">Arquivo do material</span>
                <span class="text-[10px] font-semibold text-white/30">Clique para abrir em nova aba</span>
            </div>
            <button @click="abrirMaterial(item.id_arquivo)" class="open-btn">Abrir</button>
        </div>

        <!-- URL externa -->
        <div v-if="item.url" class="file-card">
            <div class="file-icon file-icon--url">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </div>
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                <span class="text-xs font-bold text-white/75">Link externo</span>
                <span class="text-[10px] font-semibold text-white/30 truncate">{{ item.url }}</span>
            </div>
            <a :href="item.url" target="_blank" rel="noopener" class="open-btn" @click="emit('aberto')">Abrir</a>
        </div>

        <!-- Vazio -->
        <div v-if="!item.id_arquivo && !item.url" class="flex-1 flex items-center justify-center">
            <p class="text-xs font-bold text-white/20">Este material não possui arquivo ou link</p>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    item: any;
    abrirArquivo: (id: string) => void;
}>();

const emit = defineEmits<{
    aberto: [];
}>();

function abrirMaterial(id: string) {
    emit("aberto");
    props.abrirArquivo(id);
}

function formatData(d: string | null): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
</script>

<style scoped>
.status-pill { font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 8px; }
.status--agendado { background: rgba(251,191,36,0.08); color: #fbbf24; border: 1px solid rgba(251,191,36,0.15); }
.status--prazo { background: rgba(239,68,68,0.08); color: #f87171; border: 1px solid rgba(239,68,68,0.15); }
.status--ok { background: rgba(52,211,153,0.08); color: #6ee7b7; border: 1px solid rgba(52,211,153,0.15); }

.file-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
.file-icon { width: 42px; height: 42px; border-radius: 11px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.16); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.file-icon--url { background: rgba(96,165,250,0.08); border-color: rgba(96,165,250,0.16); color: #93c5fd; }
.open-btn { padding: 8px 18px; border-radius: 9px; border: none; background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; box-shadow: 0 4px 14px rgba(139,92,246,0.3); flex-shrink: 0; text-decoration: none; }
.open-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,92,246,0.4); }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
</style>
