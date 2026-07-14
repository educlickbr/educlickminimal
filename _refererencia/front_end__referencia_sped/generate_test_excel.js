const ExcelJS = require('exceljs');

async function testExport() {
    console.log("Fetching from localhost:3001...");
    const response = await fetch("http://localhost:3001/api/selecao/exportar-excel?ano_semestre=26Is&area=extensao&tipo_candidatura=estudante");
    const payload = await response.json();
    
    const data = payload;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidatos');

    const columns = [
        { header: 'Nome Completo', width: 30 },
        { header: 'Email', width: 30 },
        { header: 'Curso', width: 30 },
        { header: 'Turma', width: 30 },
        { header: 'Turno', width: 15 },
        { header: 'Data Inscrição', width: 20 },
        { header: 'Status', width: 15 },
    ];

    const dynamicCols = (data.dynamic_columns || []).map((q) => ({
        header: q.label,
        width: 30
    }));

    worksheet.columns = [...columns, ...dynamicCols];

    const rows = data.data.map((item) => {
        const rowValues = [
            item['Nome Completo'],
            item['Email'],
            item['Curso'],
            item['Turma'],
            item['Turno'],
            item['Data Inscrição'],
            item['Status']
        ];

        (data.dynamic_columns || []).forEach((q) => {
            rowValues.push((item.respostas || {})[q.id] || '');
        });
        
        return rowValues;
    });

    worksheet.addRows(rows);

    await workbook.xlsx.writeFile('test_output.xlsx');
    console.log("Excel file written to test_output.xlsx");
}

testExport();
