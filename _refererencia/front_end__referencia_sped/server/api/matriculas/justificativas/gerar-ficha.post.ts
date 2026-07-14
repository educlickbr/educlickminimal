import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const body = await readBody(event);
    const {
        id_user_expandido,
        id_turma,
        texto,
        data_inicio_janela,
        data_fim_janela,
        assinatura_base64,
        nome_exibicao,
        escopo = 'atestado'
    } = body;

    if (!id_user_expandido || !id_turma || !assinatura_base64) {
        throw createError({ statusCode: 400, statusMessage: 'Campos obrigatorios faltando (id_user_expandido, id_turma, assinatura_base64)' });
    }

    const client = await serverSupabaseClient(event);

    const { data: contextData, error: contextError } = await (client.rpc as any)('nxt_justificativa_get_print_context', {
        p_id_aluno: id_user_expandido,
        p_id_turma: id_turma
    });

    if (contextError || !contextData || contextData.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Contexto de impressao nao encontrado' });
    }

    const ctx = contextData[0];
    const nomeAluno = (nome_exibicao || 'ALUNO').toUpperCase();

    const formatDatePtBR = (isoString: string) => {
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        } catch {
            return isoString;
        }
    };

    const today = new Date().toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'America/Sao_Paulo'
    });
    const formattedRange = `${formatDatePtBR(data_inicio_janela)} a ${formatDatePtBR(data_fim_janela)}`;
    const isAtestado = escopo === 'atestado';

    const tituloDoc = isAtestado
        ? 'FORMULÁRIO DE ENVIO DE ATESTADO MÉDICO – CURSOS REGULARES'
        : 'FORMULÁRIO DE SOLICITAÇÃO DE JUSTIFICATIVA DE FALTAS – CURSOS REGULARES';

    const descricaoAcao = isAtestado
        ? 'declaro o envio de atestado médico referente à falta'
        : 'justifico a minha falta';

    const textoBox = texto
        ? `<div class="texto-box">${texto.toUpperCase()}</div>`
        : '';

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>${tituloDoc}</title>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; font-family: Arial, sans-serif; color: #000; -webkit-print-color-adjust: exact; }
        @page { size: A4; margin: 0; }
        html, body { margin: 0; padding: 0; width: 210mm; }
        .content-wrapper { padding: 25mm 20mm; width: 100%; }
        .header { text-align: center; margin-bottom: 40px; text-transform: uppercase; font-weight: bold; }
        .header h1 { font-size: 16px; margin: 5px 0; }
        .header h2 { font-size: 14px; margin: 5px 0; }
        .header h3 { font-size: 14px; margin: 20px 0 5px; text-decoration: underline; text-underline-offset: 4px; }
        .content { margin-bottom: 30px; font-size: 12px; line-height: 1.6; }
        .content p { margin-bottom: 10px; }
        .texto-box {
            margin: 12px 0; font-weight: bold; text-transform: uppercase;
            border: 1px solid #000; padding: 15px; min-height: 60px;
            font-size: 10px; line-height: 1.3;
        }
        .signature-section { margin-top: 40px; text-align: center; }
        .sig-img-wrap { height: 55px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 4px; }
        .sig-img-wrap img { max-height: 50px; }
        .line { border-top: 1px solid #000; width: 300px; margin: 0 auto 5px; }
        .signature-label { font-size: 12px; font-weight: bold; }
        .nota { margin-top: 30px; font-size: 10px; color: #555; border-top: 1px dashed #999; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="content-wrapper">
        <div class="header">
            <h1>SÃO PAULO ESCOLA DE DANÇA</h1>
            <h2>CENTRO DE FORMAÇÃO EM ARTES COREOGRÁFICAS</h2>
            <h3>${tituloDoc}</h3>
        </div>
        <div class="content">
            <p>
                Eu <strong>${nomeAluno}</strong>, inscrito(a) no
                RG <strong>${ctx.rg || 'RG não informado'}</strong> e
                CPF <strong>${ctx.cpf || 'CPF não informado'}</strong>,
                ${descricaoAcao} no Curso Regular de <strong>${ctx.nome_curso || ''}</strong>,
                turno <strong>${ctx.turno || 'Não informado'}</strong>,
                módulo <strong>${ctx.modulo || 1}</strong>,
                vinculado aos Cursos Regulares da São Paulo Escola de Dança –
                Centro de Formação em Artes Coreográficas.
            </p>
            ${textoBox}
            <p><strong>Período da falta:</strong> ${formattedRange}</p>
        </div>
        <div class="signature-section">
            <div class="sig-img-wrap">
                <img src="${assinatura_base64}" alt="Assinatura do Estudante" />
            </div>
            <div class="line"></div>
            <p class="signature-label">Assinatura do Estudante</p>
            <p>São Paulo, ${today}</p>
        </div>
        ${isAtestado ? `<div class="nota">Documento gerado automaticamente ao envio do atestado. Somente para uso interno da coordenação.</div>` : ''}
    </div>
</body>
</html>`;

    const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
    const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const REGION = process.env.BUNNY_REGION || 'br';

    if (!STORAGE_ZONE_NAME || !ACCESS_KEY) {
        throw createError({ statusCode: 500, statusMessage: 'Server misconfiguration: Storage keys missing' });
    }

    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const fileName = `ficha_${escopo}_${Date.now()}_${randomSuffix}.html`;
    const encodedFileName = encodeURIComponent(fileName);
    const bunnyUrl = `https://${REGION}.storage.bunnycdn.com/${STORAGE_ZONE_NAME}/secretaria/${encodedFileName}`;
    const htmlBuffer = Buffer.from(html, 'utf-8');

    try {
        const bunnyRes = await fetch(bunnyUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': ACCESS_KEY,
                'Content-Type': 'text/html; charset=utf-8'
            },
            body: htmlBuffer
        });

        if (!bunnyRes.ok) {
            const errorText = await bunnyRes.text();
            throw new Error(`Bunny Storage Error: ${errorText}`);
        }
    } catch (err: any) {
        throw createError({ statusCode: 502, statusMessage: `Upload Service Failed: ${err.message}` });
    }

    return {
        success: true,
        caminho_ficha: `secretaria/${encodedFileName}`
    };
});
