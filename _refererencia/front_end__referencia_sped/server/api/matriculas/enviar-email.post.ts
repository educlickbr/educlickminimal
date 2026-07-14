import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const body = await readBody(event);
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields'
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await client.functions.invoke("enviar_email_secretaria", {
            body: {
                emails: [to],
                mensagem_html: message,
                assunto_pa: subject
            },
        });

        if (error) {
            console.error("Edge Function Error:", error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Error executing edge function'
            });
        }

        return { success: true, data };

    } catch (err: any) {
        console.error("BFF Error:", err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal Server Error'
        });
    }
});
