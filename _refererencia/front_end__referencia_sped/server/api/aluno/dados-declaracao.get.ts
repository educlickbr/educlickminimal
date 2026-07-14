import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const { id_user_expandido } = query;

    if (!id_user_expandido) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID do usuário expandido é obrigatório.',
        });
    }

    const client = await serverSupabaseClient(event);

    // Call the RPC function
    const { data, error } = await client.rpc('nxt_get_dados_declaracao', {
        p_id_user_expandido: id_user_expandido,
        // Hardcoded Question ID for CPF as per user request context
        p_id_pergunta_cpf: '20467206-19d9-4bb9-8a54-e6625f101282'
    } as any);

    if (error) {
        console.error('Erro ao buscar dados da declaração (RPC):', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar dados do aluno.',
        });
    }

    // RPC returns an array of rows, we need the first one (should be single row based on logic)
    const result = (data && Array.isArray(data) && (data as any[]).length > 0) ? (data as any[])[0] : { cpf: null, ra: null };

    // Provide defaults if null
    return {
        cpf: result.cpf || '000.000.000-00',
        ra: result.ra || 'RA não encontrado'
    };
});
