import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id_matricula, criado_por } = body;

    // Basic validation
    if (!id_matricula || !criado_por) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campos obrigatórios: id_matricula, criado_por.',
        });
    }

    const client = await serverSupabaseClient(event);

    // Insert into declaracoes table
    const { data, error } = await client
        .from('declaracoes')
        .insert({
            id_matricula,
            criado_por,
            data_declaracao: new Date().toISOString()
        } as any)
        .select()
        .single();

    if (error) {
        console.error('Erro ao solicitar declaração:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao processar solicitação de declaração.',
        });
    }

    return { success: true, data };
});
