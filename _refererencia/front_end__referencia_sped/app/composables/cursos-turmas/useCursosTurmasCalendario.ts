import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useCursosTurmasCalendario() {
    const events = ref<any[]>([]);
    const isLoading = ref(false);
    const selectedTurmaId = ref<string | null>(null);
    const turmas = ref<{ id: string; label: string; labelShort: string }[]>([]);

    const fetchEvents = async () => {
        if (!selectedTurmaId.value) return;
        isLoading.value = true;
        try {
            const data: any = await ofetch("/api/cursos-turmas/calendario", {
                params: { id_turma: selectedTurmaId.value },
            });
            events.value = data || [];
        } catch (e: any) {
            console.error("Error fetching calendar:", e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    const initTurmas = async (params: { area: string | null }) => {
        isLoading.value = true;
        try {
            const data: any = await ofetch("/api/cursos-turmas/turmas", {
                params: {
                    limite: 100,
                    area: params.area,
                },
            });

            if (data && data.itens) {
                const maxLen = 50;
                turmas.value = data.itens.map((t: any) => {
                    const nomeTruncado =
                        t.nome_curso.length > maxLen
                            ? t.nome_curso.substring(0, maxLen) + "..."
                            : t.nome_curso;
                    return {
                        id: t.id,
                        label: `${t.nome_curso} (${t.cod_turma})`,
                        labelShort: nomeTruncado,
                    };
                });

                const current = turmas.value.find(
                    (t) => t.id === selectedTurmaId.value,
                );
                if (!current) {
                    if (turmas.value.length > 0) {
                        selectedTurmaId.value = turmas.value[0].id;
                    } else {
                        selectedTurmaId.value = null;
                        events.value = [];
                    }
                }
            } else {
                turmas.value = [];
                selectedTurmaId.value = null;
                events.value = [];
            }
        } catch (e) {
            console.error(e);
            turmas.value = [];
        } finally {
            isLoading.value = false;
        }

        if (selectedTurmaId.value) {
            await fetchEvents();
        }
    };

    return {
        events,
        isLoading,
        selectedTurmaId,
        turmas,
        fetchEvents,
        initTurmas,
    };
}
