const ExcelJS = require('exceljs');

async function testExport() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test');

    const columns = [
        { header: 'Nome Completo', key: 'nome_completo', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
    ];

    const dynamicCols = [
        { header: 'RG', key: 'rg', width: 30 },
        { header: 'CEP', key: 'cep', width: 30 },
        { header: 'PCD', key: 'pcd', width: 30 }
    ];

    worksheet.columns = [...columns, ...dynamicCols];

    const data = {
        "Nome Completo": "ADRIANA HOLTZ",
        "Email": "holtzadriana@gmail.com",
        "respostas": {
            "rg": "19236341-4",
            "cep": "05008-001",
            "pcd": "Não"
        }
    };

    const flatRow = {
        nome_completo: data['Nome Completo'],
        email: data['Email'],
        ...data.respostas
    };

    worksheet.addRows([flatRow]);
    
    // Check if the first row actually got populated
    const row = worksheet.getRow(2); // Row 1 is header, Row 2 is data
    console.log("Values inside row:", row.values);
}

testExport();
