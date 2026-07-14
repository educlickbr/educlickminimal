import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const body = await readBody(event);
    const { nome, data_reuniao, id_edital } = body;

    if (!nome || !data_reuniao || !id_edital) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campos obrigatórios: nome, data_reuniao e id_edital',
        });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await (client.from('bolsa_reunioes') as any)
        .insert({
            nome,
            data_reuniao,
            id_edital,
            criado_por: user.id,
        })
        .select('id, nome, data_reuniao, id_edital, criado_em')
        .single();

    if (error) {
        console.error('Error creating bolsa reuniao:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return data;
});
