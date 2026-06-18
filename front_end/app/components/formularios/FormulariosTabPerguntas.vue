<template>
    <div class="flex flex-col gap-6">
        <div
            v-if="perguntasCtx.loading.value"
            class="py-16 flex flex-col items-center justify-center gap-3"
        >
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
            <span
                class="text-[10px] font-black text-secondary/30 uppercase tracking-widest"
                >Carregando perguntas...</span
            >
        </div>
        <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <div
                v-if="perguntasCtx.perguntas.value.length === 0"
                class="col-span-full empty-state"
            >
                <div class="empty-icon">
                    <Icon name="ph:question-bold" class="w-8 h-8" />
                </div>
                <p class="empty-title">Nenhuma pergunta cadastrada</p>
                <p class="empty-subtitle">
                    Crie perguntas para serem usadas na configuração dos seus
                    formulários.
                </p>
                <button @click="perguntasCtx.openNova" class="empty-cta mt-4">
                    Cadastrar Primeira Pergunta
                </button>
            </div>
            <div
                v-for="p in perguntasCtx.perguntas.value"
                :key="p.id"
                class="comp-card group"
            >
                <div class="comp-card-accent" />
                <div class="comp-avatar">
                    {{ (p.label || "?").charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                        <p class="text-xs font-black text-primary truncate">
                            {{ p.label }}
                        </p>
                        <span
                            v-if="p.global"
                            class="flex-shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            >Global</span
                        >
                    </div>
                    <p
                        class="text-[9px] text-secondary/40 font-medium truncate"
                    >
                        {{ p.nome_interno }} - {{ p.tipo_pergunta }}
                    </p>
                </div>
                <div class="comp-actions group-hover:opacity-100">
                    <button
                        v-if="!p.global"
                        @click="perguntasCtx.openEditar(p)"
                        class="comp-action-btn comp-action-edit"
                        title="Editar"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                        >
                            <path
                                d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63Z"
                            />
                        </svg>
                    </button>
                    <button
                        v-if="!p.global"
                        @click="perguntasCtx.handleDelete(p.id)"
                        class="comp-action-btn comp-action-delete"
                        title="Excluir"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                        >
                            <path
                                d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <FormulariosModalPergunta
            v-if="perguntasCtx.showModal.value"
            v-model="perguntasCtx.showModal.value"
            :isEdit="perguntasCtx.isEdit.value"
            :initialData="perguntasCtx.editData.value"
            :idEntidade="idEntidade"
            :onSave="perguntasCtx.handleSave"
            @saved="perguntasCtx.handleSaved"
        />
    </div>
</template>

<script setup lang="ts">
import type { useFormulariosPerguntas } from "~/composables/formularios/useFormulariosPerguntas";

defineProps<{
    perguntasCtx: ReturnType<typeof useFormulariosPerguntas>;
    idEntidade: string | null;
}>();
</script>

<style scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
}
.empty-icon {
    color: rgba(139, 92, 246, 0.5);
    margin-bottom: 16px;
}
.empty-title {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
}
.empty-subtitle {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
}
.empty-cta {
    margin-top: 16px;
    padding: 8px 16px;
    background: rgba(139, 92, 246, 0.15);
    color: #c4b5fd;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    cursor: pointer;
}
.comp-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 12px;
    transition: all 0.2s;
}
.comp-card:hover {
    border-color: rgba(139, 92, 246, 0.3);
    transform: translateX(2px);
}
.comp-card-accent {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #8b5cf6;
    opacity: 0;
    transition: opacity 0.2s ease;
}
.comp-card:hover .comp-card-accent {
    opacity: 1;
}
.comp-avatar {
    background: rgba(139, 92, 246, 0.1);
    color: #a78bfa;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
}
.comp-actions {
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.2s ease;
}
.group:hover .comp-actions {
    opacity: 1;
}
.comp-action-btn {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.5);
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
}
.comp-action-edit:hover {
    background: rgba(139, 92, 246, 0.15);
    color: #c4b5fd;
}
.comp-action-delete:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
}
</style>
