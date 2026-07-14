import { ref, watch, onMounted } from "vue";
import { $fetch as ofetch } from "ofetch";

export interface CursoCard {
  id: string;
  nome_curso: string;
  cod_curso: string | null;
  area: string;
  area_int: string;
  modalidade: string | null;
  descricao: string | null;
  certificado_texto_institucional: string | null;
  certificado_nome_coordenador: string | null;
  certificado_nome_docente: string | null;
  certificado_nome_curador: string | null;
  certificado_carga_horaria_exibida: string | null;
  qtd_modulos: number | null;
  qtd_aulas_modulo: number | null;
  qtd_periodos: number | null;
  qtd_minutos_periodo: number | null;
  qtd_minutos_total: number | null;
  status: boolean;
}

export function useGestaoCertificadosModelos() {
  const isLoading = ref(false);
  const cursos = ref<CursoCard[]>([]);
  const pagination = ref({ pagina_atual: 1, qtd_paginas: 1, qtd_total: 0 });
  const filtros = ref({ search: "", area: null as string | null });

  const areaOptions = [
    { label: "Todas as Áreas", value: null },
    { label: "Extensão", value: "Extensão" },
    { label: "Regulares", value: "Regulares" },
    { label: "Cursos Livres", value: "Cursos Livres" },
    { label: "Especialização", value: "especializacao" },
  ];

  const formatHoras = (minutos?: number | null) => {
    if (!minutos || minutos <= 0) return "Carga não definida";
    if (minutos % 60 === 0) return `${minutos / 60}h`;
    return `${(minutos / 60).toFixed(1)}h`;
  };

  const formatModalidade = (modalidade?: string | null) => {
    if (!modalidade) return "Modalidade não definida";
    const texto = modalidade.replace(/_/g, " ");
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  const getAreaBadgeClass = (area: string) => {
    if (area === "Extensão")
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (area === "Regulares")
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (area === "Cursos Livres")
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-white/10 text-secondary border-white/15";
  };

  const fetchCursos = async () => {
    isLoading.value = true;
    try {
      const data: any = await ofetch("/api/cursos-turmas", {
        params: {
          area: filtros.value.area,
          nome: filtros.value.search || null,
          pagina: pagination.value.pagina_atual,
          limite: 12,
        },
      });
      cursos.value = (data?.itens || []) as CursoCard[];
      pagination.value = {
        pagina_atual: data?.pagina_atual || 1,
        qtd_paginas: data?.qtd_paginas || 1,
        qtd_total: data?.qtd_total || 0,
      };
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
      cursos.value = [];
      pagination.value = { pagina_atual: 1, qtd_paginas: 1, qtd_total: 0 };
    } finally {
      isLoading.value = false;
    }
  };

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  watch(
    () => filtros.value.search,
    () => {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        pagination.value.pagina_atual = 1;
        fetchCursos();
      }, 400);
    },
  );
  watch(
    () => filtros.value.area,
    () => {
      pagination.value.pagina_atual = 1;
      fetchCursos();
    },
  );

  onMounted(() => fetchCursos());

  return {
    isLoading,
    cursos,
    pagination,
    filtros,
    areaOptions,
    formatHoras,
    formatModalidade,
    getAreaBadgeClass,
    fetchCursos,
  };
}
