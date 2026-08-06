<template>
    <div class="conteudo-row" :class="{ 'row--off': !item.ativo, 'row--destaque': item.destaque }">
        
        <button v-if="item.id_arquivo" @click="abrirArquivo(item.id_arquivo)" class="file-btn" title="Abrir arquivo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        </button>
        <div v-else class="file-placeholder" />

        <div class="info-container">
            <span class="titulo" :class="{ 'destaque': item.destaque }">{{ item.titulo || item.conteudo_titulo }}</span>
            <div class="tags-container">
                <span class="tipo" :class="'tipo--' + item.tipo">{{ item.tipo }}</span>
                <span v-if="item.herdado" class="badge">Distribuição</span>
            </div>
        </div>

        <button @click="$emit('toggle')" class="toggle-switch-btn" :class="item.ativo ? 'on' : 'off'">
            <span class="toggle-label">{{ item.ativo ? 'Ativo' : 'Desativado' }}</span>
            <div class="toggle-track">
                <div class="toggle-thumb" />
            </div>
        </button>

        <button @click="$emit('destaque')" class="star-btn" :title="item.destaque ? 'Remover destaque' : 'Destacar'">
            <svg v-if="item.destaque" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    item: any;
}>();

defineEmits<{
    toggle: [];
    destaque: [];
}>();

async function abrirArquivo(id: string) {
    try {
        const res = (await $fetch("/api/r2/sign", { params: { id } })) as any;
        if (res?.signedUrl) window.open(res.signedUrl, "_blank");
    } catch (e) {
        console.error("Erro ao abrir arquivo", e);
    }
}
</script>

<style scoped>
.conteudo-row { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; transition: all 0.2s ease; border: 1px solid rgba(255,255,255,0.02); background: rgba(255,255,255,0.015); margin: 2px 0; }
.conteudo-row:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); }
.row--off { opacity: 0.5; filter: grayscale(40%); }
.row--destaque { background: rgba(245,158,11,0.04); border-color: rgba(245,158,11,0.15); }

.info-container { display: flex; flex-direction: column; flex: 1; overflow: hidden; gap: 3px; justify-content: center; }
.tags-container { display: flex; align-items: center; gap: 6px; }
.file-placeholder { width: 22px; height: 22px; flex-shrink: 0; }

/* Switch Toggle */
.toggle-switch-btn { display: flex; align-items: center; gap: 6px; border: none; background: transparent; cursor: pointer; padding: 0; margin-left: auto; margin-right: 4px; }
.toggle-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.25); transition: color 0.15s; }
.toggle-switch-btn.on .toggle-label { color: #8b5cf6; }
.toggle-track { width: 24px; height: 14px; border-radius: 7px; background: rgba(255,255,255,0.1); position: relative; transition: all 0.2s; }
.toggle-switch-btn.on .toggle-track { background: #8b5cf6; }
.toggle-thumb { width: 10px; height: 10px; border-radius: 5px; background: white; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; }
.toggle-switch-btn.on .toggle-thumb { transform: translateX(10px); }
.tipo { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; }
.tipo--material { background: rgba(59,130,246,0.12); color: #93c5fd; }
.tipo--atividade { background: rgba(245,158,11,0.12); color: #fcd34d; }
.tipo--avaliacao { background: rgba(139,92,246,0.12); color: #c4b5fd; }
.titulo { font-size: 11px; font-weight: 700; color: rgba(232,230,240,0.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.titulo.destaque { color: #fcd34d; font-weight: 800; }
.file-btn { width: 22px; height: 22px; flex-shrink: 0; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: rgba(255,255,255,0.15); transition: all 0.15s; }
.file-btn:hover { color: #60a5fa; background: rgba(96,165,250,0.1); }
.star-btn { width: 22px; height: 22px; flex-shrink: 0; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: rgba(255,255,255,0.15); transition: all 0.15s; }
.star-btn:hover { color: #f59e0b; background: rgba(245,158,11,0.1); }
.badge { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 7px; border-radius: 4px; background: rgba(59,130,246,0.08); color: rgba(59,130,246,0.5); flex-shrink: 0; }
</style>
