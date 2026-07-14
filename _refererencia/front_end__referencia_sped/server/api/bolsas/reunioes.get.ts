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

    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    let builder = client
        .from('bolsa_reunioes')
        .select('id, nome, data_reuniao, criado_em, modificado_em, criado_por, modificado_por')
        .order('data_reuniao', { ascending: false });

    if (query.ano_semestre) {
        builder = builder; // placeholder for future semester scoping if needed
    }

    const { data, error } = await builder;

    if (error) {
        console.error('Error fetching bolsa reunioes:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return data || [];
});
