import { ref } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";
import { useAppStore } from "~/stores/app";

// Composable: estado e fetch de inscrições + exportação Excel
export function useBolsasInscricoes() {
  const toast = useToast();
  const store = useAppStore();

  const inscricoes = ref<any[]>([]);
  const isLoadingInscricoes = ref(false);
  const searchBusca = ref("");
  const page = ref(1);
  const totalPages = ref(1);
  const limit = 20;
  const isExcelLoading = ref(false);
  let searchTimeout: any = null;

  const fetchInscricoes = async (
    anoSemestre: string,
    editalIdFilter: string | null = null,
  ) => {
    isLoadingInscricoes.value = true;
    try {
      await store.refreshHash();
      const data = (await ofetch("/api/bolsas/admin/inscricoes", {
        query: {
          ano_semestre: anoSemestre,
          id_edital: editalIdFilter,
          busca: searchBusca.value,
          page: page.value,
          limit: limit,
        },
      })) as any;
      inscricoes.value = data.inscricoes || [];
      totalPages.value = data.pages || 1;
    } catch (e: any) {
      console.error(e);
      toast.showToast("Erro ao carregar inscrições.", { type: "error" });
    } finally {
      isLoadingInscricoes.value = false;
    }
  };

  const debouncedSearch = (anoSemestre: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      page.value = 1;
      fetchInscricoes(anoSemestre);
    }, 500);
  };

  const changePage = (newPage: number, anoSemestre: string) => {
    page.value = newPage;
    fetchInscricoes(anoSemestre);
  };

  const handleExcelExport = async (anoSemestre: string) => {
    isExcelLoading.value = true;
    try {
      const data: any = await ofetch("/api/bolsas/admin/exportar-excel", {
        query: { ano_semestre: anoSemestre },
      });

      if (!data || !data.data || data.data.length === 0) {
        toast.showToast("Nenhum dado encontrado para exportação.", {
          type: "info",
        });
        return;
      }

      if (!import.meta.client) return;
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Bolsas");

      const columns = [
        {
          header: "Semestre do Aluno",
          key: "qtd_semestres_cursados",
          width: 15,
        },
        { header: "Nome Completo", key: "nome_completo", width: 30 },
        { header: "Email", key: "email", width: 30 },
        { header: "RA", key: "ra", width: 15 },
        { header: "Edital", key: "edital", width: 30 },
        { header: "Área", key: "area", width: 20 },
        { header: "Curso", key: "curso", width: 30 },
        { header: "Turma", key: "turma", width: 30 },
        { header: "Turno", key: "turno", width: 15 },
        { header: "Data Submissão", key: "data_submissao", width: 20 },
        { header: "Status", key: "status", width: 15 },
      ];

      const dynamicCols = (data.dynamic_columns || []).map((q: any) => ({
        header: q.label,
        key: q.pergunta ?? q.label,
        width: 30,
      }));
      worksheet.columns = [...columns, ...dynamicCols];

      const rows = data.data.map((item: any) => {
        const flatRow: any = {
          qtd_semestres_cursados: item["Semestre do Aluno"],
          nome_completo: item["Nome Completo"],
          email: item["Email"],
          ra: item["RA"],
          edital: item["Edital"],
          area: item["Área"],
          curso: item["Curso"],
          turma: item["Turma"],
          turno: item["Turno"],
          data_submissao: item["Data Submissão"],
          status: item["Status"],
        };
        (data.dynamic_columns || []).forEach((q: any) => {
          const key = q.pergunta ?? q.label;
          flatRow[key] = item.respostas?.[key] ?? "";
        });
        return flatRow;
      });
      worksheet.addRows(rows);

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFfd0054" },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      if (import.meta.client) {
        const FileSaverModule = await import("file-saver");
        const { saveAs } = FileSaverModule;
        saveAs(blob, `Bolsas_${anoSemestre}.xlsx`);
      }

      toast.showToast("Download do Excel iniciado!", { type: "success" });
    } catch (e: any) {
      console.error("Erro ao exportar excel:", e);
      toast.showToast(e.message || "Erro ao exportar dados.", {
        type: "error",
      });
    } finally {
      isExcelLoading.value = false;
    }
  };

  return {
    inscricoes,
    isLoadingInscricoes,
    searchBusca,
    page,
    totalPages,
    isExcelLoading,
    fetchInscricoes,
    debouncedSearch,
    changePage,
    handleExcelExport,
  };
}
