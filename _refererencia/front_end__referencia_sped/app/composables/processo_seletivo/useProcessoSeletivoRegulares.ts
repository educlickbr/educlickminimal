import { $fetch as ofetch } from "ofetch";
import type { MappedCourse } from "./useProcessoSeletivoCursos";

export function useProcessoSeletivoRegulares() {
    const user = useSupabaseUser();

    const anosSemestresBloqueados = ref<string[]>([]);
    const loadingElegibilidadeRegulares = ref(false);

    const normalizeAnoSemestre = (v: unknown) =>
        String(v ?? "").trim().toLowerCase();

    const anosSemestresBloqueadosSet = computed(() => {
        return new Set(
            anosSemestresBloqueados.value.map(normalizeAnoSemestre),
        );
    });

    const isRegularBlocked = (course: MappedCourse) => {
        const isRegulares =
            normalizeAnoSemestre(course.category) === "regulares";
        if (!isRegulares) return false;
        return anosSemestresBloqueadosSet.value.has(
            normalizeAnoSemestre(course.anoSemestre),
        );
    };

    const isRegularCourse = (course: MappedCourse) => {
        return normalizeAnoSemestre(course.category) === "regulares";
    };

    const getRegularBlockMessage = (anoSemestre: string) => {
        const periodo = String(anoSemestre || "").trim() || "selecionado";
        return `CPF ou login já possui inscrição em Regulares para o período ${periodo}.`;
    };

    const fetchElegibilidadeRegulares = async () => {
        if (!user.value) {
            anosSemestresBloqueados.value = [];
            return;
        }

        loadingElegibilidadeRegulares.value = true;
        try {
            const url: string = "/api/inscricao/elegibilidade-regulares";
            const data = await ofetch<any>(url);
            anosSemestresBloqueados.value = Array.isArray(
                data?.anos_semestres_bloqueados,
            )
                ? data.anos_semestres_bloqueados
                : [];
        } catch (e) {
            console.error("Erro ao buscar elegibilidade de Regulares:", e);
            anosSemestresBloqueados.value = [];
        } finally {
            loadingElegibilidadeRegulares.value = false;
        }
    };

    return {
        anosSemestresBloqueados,
        loadingElegibilidadeRegulares,
        anosSemestresBloqueadosSet,
        isRegularBlocked,
        isRegularCourse,
        getRegularBlockMessage,
        fetchElegibilidadeRegulares,
    };
}
