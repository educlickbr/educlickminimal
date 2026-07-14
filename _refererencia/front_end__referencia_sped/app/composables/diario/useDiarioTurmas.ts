import { ref, computed } from "vue";
import { $fetch as ofetch } from "ofetch";

export function useDiarioTurmas() {
    const semestres = ["25Is", "25IIs", "26Is", "26IIs", "27Is", "27IIs"];
    const turmas = ref<any[]>([]);
    const qtdPeriodos = ref<number>(1);

    const turmaOptions = computed(() => {
        return turmas.value.map((t: any) => {
            const maxLen = 30;
            const nomeTruncado =
                t.nome_curso.length > maxLen
                    ? t.nome_curso.substring(0, maxLen) + "..."
                    : t.nome_curso;

            return {
                id: t.id,
                label: `${t.nome_curso} (${t.cod_turma})`,
                labelShort: nomeTruncado,
                obj: t,
            };
        });
    });

    const fetchTurmas = async (anoSemestre: string, area: string) => {
        if (!area) return;
        try {
            const data: any = await ofetch("/api/cursos-turmas/turmas", {
                params: {
                    ano_semestre: anoSemestre,
                    area,
                },
            });

            if (data && data.itens) {
                turmas.value = data.itens.filter(
                    (t: any) =>
                        t.area_curso?.toLowerCase() === area?.toLowerCase(),
                );
            }
        } catch (e) {
            console.error("Error fetching turmas", e);
        }
    };

    const getFirstTurmaId = (): string | null => {
        return turmas.value.length > 0 ? turmas.value[0].id : null;
    };

    const getPeriodosPorTurma = (turmaId: string | null, isEspecializacao: boolean): number => {
        if (isEspecializacao) return 4;
        if (!turmaId) return 1;
        const turma = turmas.value.find((t: any) => t.id === turmaId);
        return turma?.qtd_periodos || 1;
    };

    return {
        semestres,
        turmas,
        turmaOptions,
        qtdPeriodos,
        fetchTurmas,
        getFirstTurmaId,
        getPeriodosPorTurma,
    };
}
