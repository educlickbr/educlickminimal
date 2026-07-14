import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

export function usePainelExport() {
  const { showToast } = useToast();
  const isExcelLoading = ref(false);

  const handleExcelExport = async (
    anoSemestre: string,
    area: string,
    currentAreaLabel: string,
  ) => {
    if (!import.meta.client) return;

    isExcelLoading.value = true;
    try {
      const { default: ExcelJS } = await import("exceljs");
      const data: any = await ofetch("/api/selecao/exportar-excel", {
        params: {
          ano_semestre: anoSemestre,
          area,
          tipo_candidatura: "estudante",
        },
      });

      if (!data || !data.data || data.data.length === 0) {
        showToast("Nenhum dado encontrado para exportação.", {
          type: "info",
        });
        return;
      }

      // --- EXCEL GENERATION ---
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Candidatos");

      // 1. Define Columns
      const columns = [
        { header: "Nome Completo", key: "nome_completo", width: 30 },
        { header: "Email", key: "email", width: 30 },
        { header: "Curso", key: "curso", width: 30 },
        { header: "Turma", key: "turma", width: 30 },
        { header: "Turno", key: "turno", width: 15 },
        { header: "Data Inscrição", key: "data_inscricao", width: 20 },
        { header: "Status", key: "status", width: 15 },
      ];

      // Dynamic Columns (Questions)
      const dynamicCols = (data.dynamic_columns || []).map((q: any) => ({
        header: q.label,
        key: q.pergunta ?? q.label,
        width: 30,
      }));

      worksheet.columns = [...columns, ...dynamicCols];

      // 2. Add Rows
      const rows = data.data.map((item: any) => {
        const flatRow: any = {
          nome_completo: item["Nome Completo"],
          email: item["Email"],
          curso: item["Curso"],
          turma: item["Turma"],
          turno: item["Turno"],
          data_inscricao: item["Data Inscrição"],
          status: item["Status"],
        };

        (data.dynamic_columns || []).forEach((q: any) => {
          const key = q.pergunta ?? q.label;
          flatRow[key] = item.respostas?.[key] ?? "";
        });

        return flatRow;
      });

      worksheet.addRows(rows);

      // 3. Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFfd0054" },
      };

      // 4. Generate & Save
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Dynamic import for client-side
      if (import.meta.client) {
        const FileSaverModule = await import("file-saver");
        const { saveAs } = FileSaverModule;
        saveAs(blob, `Candidatos_${currentAreaLabel}_${anoSemestre}.xlsx`);
      }

      showToast("Download do Excel iniciado!", { type: "success" });
    } catch (e: any) {
      console.error("Erro ao exportar excel:", e);
      showToast(e.message || "Erro ao exportar dados.", { type: "error" });
    } finally {
      isExcelLoading.value = false;
    }
  };

  return { isExcelLoading, handleExcelExport };
}
