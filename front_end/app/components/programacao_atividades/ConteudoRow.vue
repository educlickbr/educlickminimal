<template>
    <div class="conteudo-row" :class="{ 'row--off': !item.ativo, 'row--destaque': item.destaque }">
        
        <button v-if="item.id_arquivo" @click="abrirArquivo(item.id_arquivo)" class="file-btn" title="Abrir arquivo">
            <Icon name="ph:file-arrow-down-bold" class="w-3.5 h-3.5" />
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
            <Icon v-if="item.destaque" name="ph:star-fill" class="w-3.5 h-3.5 text-amber-500" />
            <Icon v-else name="ph:star-bold" class="w-3.5 h-3.5" />
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
.conteudo-row { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; transition: all 0.2s ease; border: 1px solid var(--color-divider); background: var(--color-secondary-surface); margin: 2px 0; }
.conteudo-row:hover { background: var(--color-secondary-surface-hover); border-color: rgba(139,92,246,0.2); }
.row--off { opacity: 0.5; filter: grayscale(40%); }
.row--destaque { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.25); }

.info-container { display: flex; flex-direction: column; flex: 1; overflow: hidden; gap: 3px; justify-content: center; }
.tags-container { display: flex; align-items: center; gap: 6px; }
.file-placeholder { width: 22px; height: 22px; flex-shrink: 0; }

.toggle-switch-btn { display: flex; align-items: center; gap: 6px; border: none; background: transparent; cursor: pointer; padding: 0; margin-left: auto; margin-right: 4px; }
.toggle-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-secondary); opacity: 0.6; transition: color 0.15s; }
.toggle-switch-btn.on .toggle-label { color: var(--color-primary); opacity: 1; }
.toggle-track { width: 24px; height: 14px; border-radius: 7px; background: var(--color-divider); position: relative; transition: all 0.2s; }
.toggle-switch-btn.on .toggle-track { background: #8b5cf6; }
.toggle-thumb { width: 10px; height: 10px; border-radius: 5px; background: white; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; }
.toggle-switch-btn.on .toggle-thumb { transform: translateX(10px); }
.tipo { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; }
.tipo--material { background: rgba(59,130,246,0.12); color: #3b82f6; }
.tipo--atividade { background: rgba(245,158,11,0.12); color: #f59e0b; }
.tipo--avaliacao { background: rgba(139,92,246,0.12); color: var(--color-primary); }
.titulo { font-size: 11px; font-weight: 700; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.titulo.destaque { color: #f59e0b; font-weight: 800; }
.file-btn { width: 22px; height: 22px; flex-shrink: 0; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: var(--color-secondary); transition: all 0.15s; }
.file-btn:hover { color: #3b82f6; background: rgba(59,130,246,0.1); }
.star-btn { width: 22px; height: 22px; flex-shrink: 0; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: var(--color-secondary); transition: all 0.15s; }
.star-btn:hover { color: #f59e0b; background: rgba(245,158,11,0.1); }
.badge { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 7px; border-radius: 4px; background: rgba(59,130,246,0.08); color: #3b82f6; flex-shrink: 0; }
</style>
