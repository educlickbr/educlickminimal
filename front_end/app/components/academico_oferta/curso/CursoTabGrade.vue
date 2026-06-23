<template>
    <div class="flex flex-col gap-6">
        <div
            v-if="!savedCursoId"
            class="py-12 text-center bg-white/[0.02] rounded-xl border-2 border-dashed border-white/10"
        >
            <Icon
                name="ph:info-duotone"
                class="w-10 h-10 text-secondary/20 mx-auto mb-3"
            />
            <p class="text-xs text-secondary/60 font-medium">
                Salve o curso primeiro para gerenciar a grade curricular.
            </p>
        </div>
        <div v-else class="flex flex-col gap-6">
            <div
                class="p-5 rounded-xl border border-primary/10 bg-primary/5 flex flex-col gap-4"
            >
                <h4
                    class="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2"
                >
                    <Icon name="ph:plus-circle-bold" /> Adicionar Módulo à Grade
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="flex flex-col gap-1.5 md:col-span-3">
                        <label
                            class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1"
                            >Módulo Acadêmico</label
                        >
                        <select
                            v-model="formCM.id_modulo"
                            class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"
                        >
                            <option :value="null" disabled>
                                Selecione um módulo disponível...
                            </option>
                            <option
                                v-for="m in modulosDisponiveis"
                                :key="m.id"
                                :value="m.id"
                            >
                                {{ m.nome_modulo }}
                            </option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label
                            class="text-[9px] font-black text-secondary/60 uppercase tracking-widest px-1"
                            >Ordem (Posição)</label
                        ><input
                            type="number"
                            v-model="formCM.ordem"
                            class="w-full px-3 py-2.5 rounded-lg border border-secondary/10 bg-background text-xs font-bold text-primary outline-none"
                        />
                    </div>
                </div>
                <div class="flex justify-end">
                    <button
                        @click="$emit('addModulo')"
                        :disabled="loadingCM || !formCM.id_modulo"
                        class="px-6 py-1.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all"
                    >
                        {{ loadingCM ? "Vinculando..." : "Vincular Módulo" }}
                    </button>
                </div>
            </div>
            <div class="flex flex-col gap-3">
                <p
                    class="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1"
                >
                    Módulos na Grade Curricular ({{ modulosDoCurso.length }})
                </p>
                <div
                    v-if="loadingModulosCurso"
                    class="py-4 flex justify-center"
                >
                    <div
                        class="w-5 h-5 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
                    ></div>
                </div>
                <p
                    v-else-if="modulosDoCurso.length === 0"
                    class="py-8 text-center text-[10px] text-secondary/30 uppercase font-bold tracking-widest bg-white/[0.02] rounded-lg border border-white/5"
                >
                    Nenhum módulo vinculado a este curso.
                </p>
                <div
                    v-for="mc in modulosDoCurso"
                    :key="mc.id_modulo"
                    class="flex items-center gap-0 rounded-lg border border-white/5 bg-white/[0.03] group hover:border-primary/20 transition-all overflow-hidden"
                >
                    <div
                        class="w-10 shrink-0 h-full flex items-center justify-center bg-white/[0.02] border-r border-white/5"
                    >
                        <span
                            class="text-[10px] font-black text-secondary/30 tabular-nums"
                            >{{ mc.ordem ?? 0 }}</span
                        >
                    </div>
                    <div class="flex-1 min-w-0 px-4 py-3">
                        <p class="text-xs font-black text-primary truncate">
                            {{ mc.nome_modulo }}
                        </p>
                        <div class="flex items-center gap-3 mt-0.5">
                            <p
                                v-if="mc.carga_horaria"
                                class="text-[9px] text-secondary/40 font-bold"
                            >
                                Carga: {{ mc.carga_horaria }} min
                            </p>
                            <p
                                class="text-[9px] text-secondary/30 font-bold italic truncate"
                            >
                                {{
                                    mc.descricao
                                        ?.replace(/<[^>]*>/g, "")
                                        .substring(0, 80)
                                }}...
                            </p>
                        </div>
                    </div>
                    <button
                        @click="$emit('removeModulo', mc.id_modulo)"
                        class="w-11 h-full flex items-center justify-center text-secondary/30 hover:text-red-400 hover:bg-red-500/5 transition-all border-l border-secondary/5"
                        title="Remover da Grade"
                        style="min-height: 48px"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                        >
                            <path
                                d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"
                            ></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    savedCursoId: string | null;
    formCM: { id_modulo: string | null; ordem: number };
    modulosDisponiveis: { id: string; nome_modulo: string }[];
    modulosDoCurso: any[];
    loadingModulosCurso: boolean;
    loadingCM: boolean;
}>();
defineEmits<{ addModulo: []; removeModulo: [id_modulo: string] }>();
</script>
