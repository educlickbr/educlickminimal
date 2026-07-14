import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const supabase = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Não autorizado' });
    }

    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID da avaliação não fornecido' });
    }

    // Exclui a avaliação do banco de dados (o Cascade do PG se encarrega dos filhos vinculados)
    const { error } = await supabase
        .from('avl_avaliacao')
        .delete()
        .eq('id', id);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return { success: true, message: 'Avaliação excluída com sucesso.' };
});
