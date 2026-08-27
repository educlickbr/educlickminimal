<template>
    <div class="flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar flex-1">
        <!-- Cabeçalho -->
        <div class="flex flex-col gap-1">
            <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Material</span>
            <h2 class="text-lg font-black text-text">{{ item.titulo }}</h2>
            <p v-if="item.descricao" class="text-xs font-semibold text-secondary leading-relaxed whitespace-pre-wrap">{{ item.descricao }}</p>
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
                <Icon name="ph:file-text-bold" class="w-5 h-5 text-primary" />
            </div>
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                <span class="text-xs font-bold text-text">Arquivo do material</span>
                <span class="text-[10px] font-semibold text-secondary/60">Clique para abrir em nova aba</span>
            </div>
            <button @click="abrirMaterial(item.id_arquivo)" class="open-btn">Abrir</button>
        </div>

        <!-- URL externa -->
        <div v-if="item.url" class="file-card">
            <div class="file-icon file-icon--url">
                <Icon name="ph:arrow-square-out-bold" class="w-5 h-5 text-blue-500" />
            </div>
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                <span class="text-xs font-bold text-text">Link externo</span>
                <span class="text-[10px] font-semibold text-secondary/60 truncate">{{ item.url }}</span>
            </div>
            <a :href="item.url" target="_blank" rel="noopener" class="open-btn" @click="emit('aberto')">Abrir</a>
        </div>

        <!-- Vazio -->
        <div v-if="!item.id_arquivo && !item.url" class="flex-1 flex items-center justify-center">
            <p class="text-xs font-bold text-secondary/40">Este material não possui arquivo ou link</p>
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
.status--agendado { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.status--prazo { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
.status--ok { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }

.file-card {
    display: flex; align-items: center; gap: 14px; padding: 16px 18px;
    border-radius: 12px; border: 1px solid var(--color-divider); background: var(--color-secondary-surface);
}
.file-icon {
    width: 42px; height: 42px; border-radius: 11px;
    background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.file-icon--url { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.2); }
.open-btn {
    padding: 8px 18px; border-radius: 9px; border: none;
    background: var(--color-primary); color: white;
    font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; flex-shrink: 0; text-decoration: none;
}
.open-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(139,92,246,0.3); }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-divider); border-radius: 4px; }
</style>
