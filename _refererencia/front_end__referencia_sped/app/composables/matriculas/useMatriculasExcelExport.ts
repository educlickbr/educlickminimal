import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

export function useMatriculasExcelExport() {
  const { showToast } = useToast();
  const isExcelLoading = ref(false);

  const exportExcel = async (anoSemestre: string, area: string) => {
    isExcelLoading.value = true;
    try {
      const data: any = await ofetch("/api/matriculas/exportar-excel", {
        params: { ano_semestre: anoSemestre, area: area || null },
      });

      if (!data || !data.data || data.data.length === 0) {
        showToast("Nenhum dado encontrado para exportação.", { type: "info" });
        return;
      }

      if (!import.meta.client) return;
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Matrículas");

      const columns = [
        {
          header: "Semestre do Aluno",
          key: "qtd_semestres_cursados",
          width: 15,
        },
        { header: "Nome Completo", key: "nome_completo", width: 30 },
        { header: "Email", key: "email", width: 30 },
        { header: "Área", key: "area", width: 20 },
        { header: "Curso", key: "curso", width: 30 },
        { header: "Turma", key: "turma", width: 30 },
        { header: "Turno", key: "turno", width: 15 },
        { header: "Data Matrícula", key: "data_matricula", width: 20 },
        { header: "Status", key: "status_matricula", width: 15 },
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
          area: item["Área"],
          curso: item["Curso"],
          turma: item["Turma"],
          turno: item["Turno"],
          data_matricula: item["Data Matrícula"],
          status_matricula: item["Status Matrícula"],
        };
        (data.dynamic_columns || []).forEach((q: any) => {
          flatRow[q.pergunta ?? q.label] =
            item.respostas?.[q.pergunta ?? q.label] ?? "";
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
        FileSaverModule.saveAs(blob, `Matriculas_${anoSemestre}.xlsx`);
      }

      showToast("Download do Excel iniciado!", { type: "success" });
    } catch (e: any) {
      console.error("Erro ao exportar excel:", e);
      showToast(e.message || "Erro ao exportar dados.", { type: "error" });
    } finally {
      isExcelLoading.value = false;
    }
  };

  return { isExcelLoading, exportExcel };
}
