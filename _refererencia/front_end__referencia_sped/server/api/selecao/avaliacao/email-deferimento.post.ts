import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

const RESPOSTA_DEFERIDA = 'Inscrição Deferida';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const body = await readBody(event);
    const {
        id_user_expandido,
        id_processo,
        deferimento,
        email_aluno,
        nome_curso
    } = body || {};

    if (!id_user_expandido || !id_processo) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields'
        });
    }

    if (deferimento !== RESPOSTA_DEFERIDA) {
        return { success: false, message: 'Sem envio para este deferimento' };
    }

    const client = await serverSupabaseClient(event);

    let resolvedEmail = email_aluno || null;

    if (!resolvedEmail) {
        const { data: aluno, error: alunoError } = await client
            .from('user_expandido')
            .select('email')
            .eq('id', id_user_expandido)
            .single();

        if (alunoError) {
            console.error('Erro ao carregar dados do aluno para email de deferimento:', alunoError);
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao preparar envio do email'
            });
        }

        if (!resolvedEmail) {
            const alunoData = aluno as any;
            resolvedEmail = alunoData?.email || null;
        }
    }

    if (!resolvedEmail) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Aluno sem email cadastrado'
        });
    }

    const config = useRuntimeConfig();
    const webhookUrl = config.powerAutomateJustificativaWebhook;

    if (!webhookUrl) {
        console.error('Missing POWER_AUTOMATE_JUSTIFICATIVA_WEBHOOK env var');
        throw createError({
            statusCode: 500,
            statusMessage: 'Webhook not configured'
        });
    }

    const payload = {
        tipo: 'deferimento_inscricao_regulares',
        processo_id: id_processo,
        aluno_id: id_user_expandido,
        aluno: 'Candidato(a)',
        email: resolvedEmail,
        curso: nome_curso || 'Regulares',
        assunto: 'Confirmação de inscrição',
        saudacao: 'Olá candidato(a),',
        mensagem: 'Sua inscrição foi deferida. Fique atento aos seus e-mails que encaminharemos os próximos passos',
        data_envio: new Date().toISOString()
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Power Automate Error (deferimento):', response.status, text);
            throw createError({
                statusCode: 502,
                statusMessage: 'Erro no serviço externo de email'
            });
        }

        return {
            success: true,
            email_enviado_para: resolvedEmail
        };
    } catch (err: any) {
        if (err?.statusCode) {
            throw err;
        }

        console.error('Erro ao enviar email de deferimento:', err);
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha ao enviar email de deferimento'
        });
    }
});