import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const client = await serverSupabaseClient(event);

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da turma é obrigatório'
        });
    }

    const { data, error } = await client
        .from('turmas')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    if (!data) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Turma não encontrada'
        });
    }

    return data;
});
