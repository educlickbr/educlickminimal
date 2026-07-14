<template>
    <div
        class="bg-[#0f0f15] border border-white/5 hover:border-white/10 rounded-xl px-4 py-4 flex items-center gap-5 group transition-all relative overflow-hidden"
    >
        <!-- Icon -->
        <div class="shrink-0">
            <a
                v-if="hashBaseLocal && doc.arquivo"
                :href="hashBaseLocal + doc.arquivo"
                target="_blank"
                class="text-primary/80 hover:text-primary transition-colors flex items-center justify-center hover:scale-110 active:scale-95"
                title="Visualizar documento"
            >
                <svg
                    class="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            </a>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
            <h3
                class="font-bold text-white text-base group-hover:text-primary transition-colors truncate"
                :title="doc.nome_documento"
            >
                {{ doc.nome_documento }}
            </h3>
            <p
                v-if="doc.descricao"
                class="text-sm text-secondary/70 line-clamp-1 mt-0.5"
                :title="doc.descricao"
            >
                {{ doc.descricao }}
            </p>
            <div class="flex flex-wrap items-center gap-2 mt-2">
                <span
                    v-if="doc.escopo === 'geral'"
                    class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300"
                >
                    GERAL
                </span>
                <span
                    v-else-if="doc.area"
                    class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary"
                >
                    ÁREA: {{ doc.area }}
                </span>
                <span
                    v-else-if="doc.turma"
                    class="text-[9px] font-bold text-white/70 bg-white/5 px-2 py-0.5 rounded border border-white/10 truncate max-w-[250px]"
                    :title="doc.turma.nome_curso"
                >
                    TURMA: {{ doc.turma.nome_curso }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    doc: any;
    hashBaseLocal: string | null;
}>();
</script>
