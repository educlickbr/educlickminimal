<script setup lang="ts">
defineProps<{
    busca: string;
    idTurma: string;
    status: string;
    turmas: any[];
    statusOptions: string[];
}>();

const emit = defineEmits<{
    (e: "update:busca", value: string): void;
    (e: "update:idTurma", value: string): void;
    (e: "update:status", value: string): void;
    (e: "search"): void;
    (e: "filter-change"): void;
}>();
</script>

<template>
    <div class="flex flex-col lg:flex-row gap-4 lg:items-end">
        <div class="relative w-full lg:w-64">
            <input
                :value="busca"
                @input="emit('update:busca', ($event.target as HTMLInputElement).value); emit('search')"
                type="text"
                placeholder="Buscar aluno (Nome, RA, Email)..."
                class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pl-3 outline-none"
            />
        </div>

        <div class="relative w-full lg:w-56">
            <select
                :value="idTurma"
                @change="emit('update:idTurma', ($event.target as HTMLSelectElement).value); emit('filter-change')"
                class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"
            >
                <option value="">Todas as turmas regulares</option>
                <option
                    v-for="turma in turmas"
                    :key="turma.id"
                    :value="turma.id"
                >
                    {{
                        turma.nome_curso_turno ||
                        turma.nome_curso ||
                        turma.nome_turma ||
                        turma.id
                    }}
                </option>
            </select>
        </div>

        <div class="relative w-full lg:w-56">
            <select
                :value="status"
                @change="emit('update:status', ($event.target as HTMLSelectElement).value); emit('filter-change')"
                class="w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"
            >
                <option
                    v-for="option in statusOptions"
                    :key="option"
                    :value="option"
                >
                    {{ option }}
                </option>
            </select>
        </div>
    </div>
</template>
