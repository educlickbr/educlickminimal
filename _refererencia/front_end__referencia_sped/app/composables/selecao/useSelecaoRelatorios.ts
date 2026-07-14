import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";

// --- Format helpers ---
const escapeHtml = (value: string) => {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const formatDatePtBr = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

// --- HTML Report Builder ---
const buildWeeklyReportHtml = (report: any) => {
    const weeks = report?.weeks || [];
    const summaryByWeek = report?.summary?.by_week || [];
    const summaryByTurma = report?.summary?.by_turma || [];
    const totalGeralPeriodo = report?.summary?.total_geral_periodo || 0;
    const generatedAt = new Date(
        report?.generated_at || Date.now(),
    ).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const weekPages = weeks
        .map((week: any) => {
            const totals = week?.totals || {};
            const rows = week?.rows || [];

            const rowsHtml = rows
                .map(
                    (row: any) => `
            <tr>
                <td class="left">${escapeHtml(row.nome_turma || "Turma sem nome")}</td>
                <td>${row.seg || 0}</td>
                <td>${row.ter || 0}</td>
                <td>${row.qua || 0}</td>
                <td>${row.qui || 0}</td>
                <td>${row.sex || 0}</td>
                <td>${row.sab || 0}</td>
                <td>${row.dom || 0}</td>
                <td class="total">${row.total_semana || 0}</td>
            </tr>
        `,
                )
                .join("");

            return `
            <section class="page">
                <header class="header">
                    <h1>Relatório Semanal de Inscrições</h1>
                    <div class="sub">Semana ${week.week_iso || "?"}/${week.week_year || "?"} — ${formatDatePtBr(week.week_start)} a ${formatDatePtBr(week.week_end)}</div>
                    <div class="sub">Gerado em ${generatedAt}</div>
                </header>
                <table class="table" role="table">
                    <thead>
                        <tr>
                            <th class="left">Turma</th>
                            <th>SEG</th><th>TER</th><th>QUA</th><th>QUI</th><th>SEX</th><th>SÁB</th><th>DOM</th>
                            <th class="total">Total</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td class="left"><strong>TOTAL SEMANA</strong></td>
                            <td>${totals.seg || 0}</td><td>${totals.ter || 0}</td><td>${totals.qua || 0}</td>
                            <td>${totals.qui || 0}</td><td>${totals.sex || 0}</td><td>${totals.sab || 0}</td>
                            <td>${totals.dom || 0}</td>
                            <td class="total"><strong>${totals.total || 0}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </section>
        `;
        })
        .join("");

    const summaryWeeksRows = summaryByWeek
        .map(
            (week: any) => `
        <tr>
            <td>Semana ${week.week_iso}/${week.week_year}</td>
            <td>${formatDatePtBr(week.week_start)} a ${formatDatePtBr(week.week_end)}</td>
            <td class="total">${week.total_semana || 0}</td>
        </tr>
    `,
        )
        .join("");

    const summaryTurmasRows = summaryByTurma
        .map(
            (item: any) => `
        <tr>
            <td class="left">${escapeHtml(item.nome_turma || "Turma sem nome")}</td>
            <td class="total">${item.total_periodo || 0}</td>
        </tr>
    `,
        )
        .join("");

    const summaryPage = `
        <section class="page summary-page">
            <header class="header">
                <h1>Resumo do Período</h1>
                <div class="sub">Total de inscrições no período: <strong>${totalGeralPeriodo}</strong></div>
                <div class="sub">Gerado em ${generatedAt}</div>
            </header>
            <h2>Por Semana</h2>
            <table class="table" role="table">
                <thead><tr><th>Semana</th><th>Período</th><th class="total">Inscrições</th></tr></thead>
                <tbody>${summaryWeeksRows}</tbody>
            </table>
            <h2>Por Turma</h2>
            <table class="table" role="table">
                <thead><tr><th class="left">Turma</th><th class="total">Total</th></tr></thead>
                <tbody>${summaryTurmasRows}</tbody>
            </table>
        </section>
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Relatório Semanal de Inscrições</title></head>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #111; background: #fff; }
            .page { padding: 20px 30px; page-break-after: always; }
            .summary-page { page-break-after: auto; }
            .header { margin-bottom: 24px; border-bottom: 3px solid #fd0054; padding-bottom: 12px; }
            .header h1 { font-size: 22px; color: #fd0054; }
            .sub { font-size: 12px; color: #555; margin-top: 4px; }
            h2 { font-size: 16px; color: #333; margin: 20px 0 10px; }
            .table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; }
            .table th { background: #111; color: #fff; padding: 6px 4px; text-align: center; font-weight: 600; }
            .table td { padding: 5px 4px; text-align: center; border-bottom: 1px solid #ddd; }
            .table .left { text-align: left; }
            .table .total { font-weight: 700; }
            .table tfoot td { border-top: 2px solid #111; background: #f5f5f5; }
            @media print { .page { page-break-after: always; } .summary-page { page-break-after: auto; } }
        </style>
        <body>${weekPages}${summaryPage}</body>
        </html>
    `;
};

const printHtmlReport = (htmlContent: string) => {
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
        position: "fixed",
        right: "0",
        bottom: "0",
        width: "0",
        height: "0",
        border: "0",
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.write(htmlContent);
    doc.close();

    const printNow = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1000);
    };

    const images = doc.images;
    if (images.length > 0) {
        let loaded = 0;
        const onLoad = () => {
            loaded++;
            if (loaded >= images.length) printNow();
        };
        for (const img of images) {
            if (img.complete) loaded++;
            else img.addEventListener("load", onLoad, { once: true });
        }
        if (loaded >= images.length) printNow();
    } else {
        printNow();
    }
};

// --- Composable ---
export function useSelecaoRelatorios() {
    const { showToast } = useToast();

    const fetchRelatorioSemanal = async (params: {
        ano_semestre: string;
        area: string;
        tipo_candidatura: string;
        id_turma: string | null;
    }) => {
        return (await ofetch("/api/selecao/relatorio-inscricoes-semanal", {
            params: {
                ano_semestre: params.ano_semestre,
                area: params.area,
                tipo_candidatura: params.tipo_candidatura,
                id_turma: params.id_turma,
            },
        })) as any;
    };

    const gerarRelatorioPdf = async (params: {
        ano_semestre: string;
        area: string;
        tipo_candidatura: string;
        id_turma: string | null;
    }) => {
        const report = await fetchRelatorioSemanal(params);
        const weeks = report?.weeks || [];
        if (!weeks.length) {
            showToast(
                "Nenhuma inscrição encontrada para gerar o relatório semanal.",
                { type: "info" },
            );
            return report;
        }
        const html = buildWeeklyReportHtml(report);
        printHtmlReport(html);
        showToast("Relatório semanal aberto para impressão em PDF.", {
            type: "success",
        });
        return report;
    };

    const exportarExcel = async (params: {
        ano_semestre: string;
        area: string;
        id_turma: string | null;
        tipo_candidatura: string;
        areaLabel: string;
        consolidado?: boolean;
    }) => {
        const { default: ExcelJS } = await import("exceljs");
        const FileSaverModule = await import("file-saver");
        const { saveAs } = FileSaverModule;

        const data: any = await ofetch("/api/selecao/exportar-excel", {
            params: {
                ano_semestre: params.ano_semestre,
                area: params.area,
                id_turma: params.id_turma,
                tipo_candidatura: params.tipo_candidatura,
            },
        });

        if (!data || !data.data || data.data.length === 0) {
            showToast("Nenhum dado encontrado para exportação.", {
                type: "info",
            });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Candidatos");

        const columns = [
            { header: "Nome Completo", key: "nome_completo", width: 30 },
            { header: "Email", key: "email", width: 30 },
            { header: "Curso", key: "curso", width: 30 },
            { header: "Turma", key: "turma", width: 30 },
            { header: "Turno", key: "turno", width: 15 },
            { header: "Data Inscrição", key: "data_inscricao", width: 20 },
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

        const sufixo = params.consolidado ? "_TodosCursos" : "";
        saveAs(
            blob,
            `Candidatos_${params.areaLabel}_${params.ano_semestre}${sufixo}.xlsx`,
        );

        showToast("Download do Excel iniciado!", { type: "success" });
    };

    return {
        fetchRelatorioSemanal,
        gerarRelatorioPdf,
        exportarExcel,
        buildWeeklyReportHtml,
        printHtmlReport,
    };
}
