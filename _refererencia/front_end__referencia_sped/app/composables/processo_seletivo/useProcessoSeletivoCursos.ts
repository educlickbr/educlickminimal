import { $fetch as ofetch } from "ofetch";

export type FilterRole = "estudante" | "docente";
export type FilterCategory =
  | "extensao"
  | "regulares"
  | "cursos_livres"
  | "jornada_paulista";

export interface MappedCourse {
  id: string;
  title: string;
  description: string;
  hours: number | string;
  mode: string;
  image: string;
  role: FilterRole;
  category: string;
  anoSemestre: string;
  rawDates: {
    start: string;
    end: string;
    startCourse: string;
    endCourse: string;
  };
  weekDays: string[];
}

export function useProcessoSeletivoCursos(
  selectedRole: Ref<FilterRole>,
  selectedCategory: Ref<FilterCategory>,
  searchQuery: Ref<string>,
) {
  const data = ref<any>(null);
  const pending = ref(true);
  const error = ref<any>(null);

  const fetchData = async () => {
    pending.value = true;
    error.value = null;
    try {
      const url: string = "/api/cursos/disponiveis";
      data.value = await ofetch(url, {
        params: {
          tipo_candidatura: selectedRole.value,
        },
      });
    } catch (e) {
      console.error("Erro ao buscar cursos:", e);
      error.value = e;
      data.value = null;
    } finally {
      pending.value = false;
    }
  };

  // Fetch on mount and refetch when role changes (Estudante ↔ Docente)
  watch(selectedRole, fetchData, { immediate: true });

  const refresh = () => fetchData();

  // --- Computed: Mapeamento e Filtragem ---
  const filteredCourses = computed<MappedCourse[]>(() => {
    const items = data.value?.items || [];

    // 1. Mapeamento
    const mapped: MappedCourse[] = items.map((curso: any): MappedCourse => {
      const isDocente = selectedRole.value === "docente";
      const rawStart = isDocente
        ? curso.dt_ini_inscri_docente || curso.dt_ini_inscri
        : curso.dt_ini_inscri;
      const rawEnd = isDocente
        ? curso.dt_fim_inscri_docente || curso.dt_fim_inscri
        : curso.dt_fim_inscri;

      const areaNormalized = (curso.area_curso_int || "").toLowerCase();

      let daysArray: string[] = [];
      if (Array.isArray(curso.dias_semana_array)) {
        daysArray = curso.dias_semana_array;
      } else if (typeof curso.dias_semana === "string") {
        daysArray = [curso.dias_semana];
      } else if (curso.dias_semana_str) {
        daysArray = [curso.dias_semana_str];
      }

      return {
        id: String(curso.id_turma || curso.id),
        title: curso.nome_curso,
        description: curso.descricao_resumida || curso.nome_curso,
        hours: curso.qtd_horas_total || "--",
        mode: curso.turno || "Presencial",
        image: "https://spedppull.b-cdn.net/site/logosp.png",
        role: selectedRole.value,
        category: areaNormalized,
        anoSemestre: String(curso.ano_semestre || ""),
        rawDates: {
          start: rawStart,
          end: rawEnd,
          startCourse: curso.dt_ini_curso,
          endCourse: curso.dt_fim_curso,
        },
        weekDays: daysArray,
      };
    });

    // 2. Filtragem
    return mapped.filter((c: MappedCourse) => {
      const areaCurso = c.category;
      const areaFiltro = selectedCategory.value.toLowerCase();

      let categoryMatch = false;
      if (areaFiltro === "cursos_livres" && areaCurso.includes("livre")) {
        categoryMatch = true;
      } else if (areaCurso === areaFiltro) {
        categoryMatch = true;
      } else if (areaCurso.includes(areaFiltro)) {
        categoryMatch = true;
      }

      if (!categoryMatch) return false;

      if (
        searchQuery.value &&
        !c.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
        return false;

      return true;
    });
  });

  return {
    data,
    pending,
    error,
    refresh,
    filteredCourses,
  };
}
