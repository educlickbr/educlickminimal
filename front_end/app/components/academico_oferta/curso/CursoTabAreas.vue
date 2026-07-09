<template>
    <div class="flex flex-col gap-5">

        <!-- Form de criar/editar área -->
        <div class="area-form-card">
            <h4 class="area-form-title">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M7 4v6M4 7h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                {{ formArea.id ? "Editar Área" : "Nova Área Educacional" }}
            </h4>
            <div class="area-form-row">
                <div class="area-field">
                    <label class="area-label">Nome da Área</label>
                    <input
                        v-model="formArea.nome_area"
                        placeholder="Ex: Exatas, Saúde, Humanas..."
                        class="area-input"
                    />
                </div>
                <div class="area-form-actions">
                    <button
                        @click="$emit('saveArea')"
                        :disabled="loadingArea || !formArea.nome_area.trim()"
                        class="area-save-btn"
                    >
                        {{ loadingArea ? "Salvando..." : formArea.id ? "Atualizar" : "Criar Área" }}
                    </button>
                    <button
                        v-if="formArea.id"
                        @click="$emit('resetFormArea')"
                        class="area-cancel-btn"
                        title="Cancelar edição"
                    >
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Lista de áreas -->
        <div class="flex flex-col gap-2">
            <div class="area-list-header">
                <span>Áreas Cadastradas</span>
                <span class="area-list-count">{{ areasDisponiveis.length }}</span>
            </div>

            <div v-if="loadingListAreas" class="area-loading">
                <div class="area-spinner" />
            </div>

            <div
                v-else-if="areasDisponiveis.length === 0"
                class="area-empty"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="mb-2 text-white/15">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M12 8v4M12 16v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Nenhuma área cadastrada para esta entidade
            </div>

            <div
                v-for="a in areasDisponiveis"
                :key="a.id"
                class="area-row"
            >
                <div class="area-row-dot" />
                <span class="area-row-name">{{ a.nome_area }}</span>
                <div class="area-row-actions">
                    <button @click="$emit('editArea', a)" class="area-row-btn area-row-btn--edit" title="Editar">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button @click="$emit('deleteArea', a.id)" class="area-row-btn area-row-btn--delete" title="Excluir">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    formArea: { id: string | null; nome_area: string; descricao: string };
    areasDisponiveis: any[];
    loadingListAreas: boolean;
    loadingArea: boolean;
}>();
defineEmits<{
    saveArea: [];
    resetFormArea: [];
    editArea: [a: any];
    deleteArea: [id: string];
}>();
</script>

<style scoped>
/* ── Form card ───────────────────────────────────── */
.area-form-card {
    display: flex; flex-direction: column; gap: 14px;
    padding: 18px 20px; border-radius: 12px;
    background: rgba(139,92,246,0.04); border: 1px solid rgba(139,92,246,0.1);
}
.area-form-title {
    display: flex; align-items: center; gap: 7px;
    font-size: 10px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.14em; color: #a78bfa;
}
.area-form-row {
    display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;
}
.area-field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; }
.area-label {
    font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.14em; color: rgba(255,255,255,0.3);
}
.area-input {
    width: 100%; padding: 10px 12px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.04);
    color: rgba(232,230,240,0.9); font-size: 12px; font-weight: 700;
    outline: none; transition: border-color 0.15s;
}
.area-input:focus { border-color: rgba(139,92,246,0.45); }

.area-form-actions { display: flex; gap: 6px; flex-shrink: 0; }
.area-save-btn {
    padding: 10px 18px; border-radius: 9px; border: none;
    background: linear-gradient(135deg,#7c3aed,#8b5cf6);
    color: #fff; font-size: 10px; font-weight: 900;
    text-transform: uppercase; letter-spacing: 0.08em;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
    box-shadow: 0 3px 10px rgba(139,92,246,0.3);
}
.area-save-btn:hover { background: linear-gradient(135deg,#6d28d9,#7c3aed); }
.area-save-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.area-cancel-btn {
    width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
}
.area-cancel-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }

/* ── List ────────────────────────────────────────── */
.area-list-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 9px; font-weight: 900; text-transform: uppercase;
    letter-spacing: 0.14em; color: rgba(255,255,255,0.25);
    padding: 0 2px;
}
.area-list-count {
    padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 900;
    background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.15); color: #a78bfa;
}

.area-loading { display: flex; justify-content: center; padding: 20px; }
.area-spinner {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.06); border-top-color: #8b5cf6;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.area-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 32px 16px; border-radius: 10px;
    background: rgba(255,255,255,0.015); border: 1px dashed rgba(255,255,255,0.06);
    font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.2);
    text-align: center;
}

.area-row {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px; border-radius: 10px;
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
    transition: border-color 0.15s ease, background 0.15s ease;
}
.area-row:hover { border-color: rgba(139,92,246,0.18); background: rgba(139,92,246,0.03); }

.area-row-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    background: rgba(139,92,246,0.4);
}
.area-row-name {
    flex: 1; font-size: 12px; font-weight: 700; color: rgba(232,230,240,0.85);
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.area-row-actions { display: flex; gap: 4px; flex-shrink: 0; }
.area-row-btn {
    width: 26px; height: 26px; border-radius: 7px; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s;
    background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.25);
}
.area-row-btn--edit:hover  { background: rgba(139,92,246,0.15); color: #c4b5fd; }
.area-row-btn--delete:hover { background: rgba(239,68,68,0.12);  color: #f87171; }
</style>
