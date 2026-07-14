<script setup lang="ts">
import { formatDate } from "~/utils/date";

const props = defineProps<{
    inscricao: any;
    hashBase: string;
}>();

const emit = defineEmits<{
    (e: "details", inscricao: any): void;
}>();

const statusClass = (status: string) => {
    switch (status) {
        case "Aguardando":
            return "bg-yellow-400/10 text-yellow-400";
        case "Em Análise":
            return "bg-blue-400/10 text-blue-400";
        case "Aprovado":
            return "bg-green-400/10 text-green-400";
        case "Reprovado":
            return "bg-red-400/10 text-red-400";
        default:
            return "bg-white/5 text-secondary";
    }
};
</script>

<template>
    <div
        class="bg-[#16161E] border border-white/5 rounded-xl flex md:overflow-visible overflow-hidden hover:border-primary/30 transition-colors group relative min-h-[160px]"
    >
        <!-- LEFT: Photo Column -->
        <div
            class="w-24 md:w-32 relative flex-shrink-0 bg-white/5 border-r border-white/5 flex flex-col group/photo"
        >
            <div class="relative flex-1 w-full rounded-tl-xl md:rounded-tl-lg">
                <img
                    v-if="inscricao.imagem_user && hashBase"
                    :src="hashBase + inscricao.imagem_user"
                    class="absolute inset-0 w-full h-full object-cover transition-all duration-300 z-10 rounded-tl-xl md:rounded-tl-lg group-hover/photo:scale-[1.8] group-hover/photo:translate-x-16 group-hover/photo:translate-y-16 group-hover/photo:shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover/photo:rounded-lg group-hover/photo:z-50"
                    alt="Foto"
                    @error="(e: any) => (e.target.style.display = 'none')"
                />
                <div
                    v-else
                    class="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-secondary bg-black/20 rounded-tl-xl md:rounded-tl-lg"
                >
                    <span class="text-2xl mb-1"
                        >{{ inscricao.nome?.charAt(0)
                        }}{{ inscricao.sobrenome?.charAt(0) }}</span
                    >
                    <span class="text-[9px] opacity-50">Sem Foto</span>
                </div>
            </div>
            <!-- Status Badge -->
            <div
                class="w-full py-1 flex items-center justify-center gap-1.5 border-t border-white/5"
                :class="statusClass(inscricao.status)"
            >
                <span
                    class="text-[8px] font-black uppercase tracking-wider"
                    >{{ inscricao.status }}</span
                >
            </div>
        </div>

        <!-- RIGHT: Info + Actions -->
        <div
            class="flex-1 p-3 flex flex-col justify-between min-w-0 z-10 gap-3 relative"
        >
            <!-- Semester Count -->
            <div
                class="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10"
            >
                <span class="text-[10px] font-bold text-white">
                    {{ inscricao.qtd_semestres_cursados || 1 }}º
                </span>
                <span
                    class="text-[9px] font-bold text-secondary uppercase tracking-wider"
                    >Sem.</span
                >
            </div>

            <!-- Info -->
            <div class="space-y-1">
                <div class="pr-20">
                    <h5
                        class="text-sm font-bold text-white truncate leading-tight"
                        :title="inscricao.nome + ' ' + inscricao.sobrenome"
                    >
                        {{ inscricao.nome }} {{ inscricao.sobrenome }}
                    </h5>
                    <p class="text-[10px] text-secondary truncate">
                        {{ inscricao.email }}
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5">
                    <div class="col-span-2">
                        <p
                            class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                        >
                            Curso
                        </p>
                        <p
                            class="text-[10px] text-white font-medium truncate"
                            :title="inscricao.nome_curso"
                        >
                            {{ inscricao.nome_curso }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                        >
                            Turno
                        </p>
                        <p class="text-[10px] text-white font-medium">
                            {{ inscricao.turno }}
                        </p>
                    </div>
                    <div>
                        <p
                            class="text-[9px] text-secondary uppercase tracking-wider font-bold mb-0.5"
                        >
                            RA
                        </p>
                        <p class="text-[10px] text-white font-medium font-mono">
                            {{ inscricao.ra || "---" }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Bottom: Actions -->
            <div
                class="flex items-center justify-start mt-1 pt-2 border-t border-white/5"
            >
                <div class="flex items-center gap-1">
                    <button
                        @click="emit('details', inscricao)"
                        class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-secondary hover:text-white transition-colors border border-transparent hover:border-white/5"
                    >
                        Ver Detalhes
                    </button>
                </div>
                <div class="ml-auto text-[9px] text-secondary/40">
                    Enviado em {{ formatDate(inscricao.criado_em) }}
                </div>
            </div>
        </div>
    </div>
</template>
