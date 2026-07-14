
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await client.auth.getUser();

    if (!user.data.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const body = await readBody(event);

    const { data, error } = await (client.rpc as any)('nxt_edt_edital_upsert', {
        p_id: body.id || null,
        p_ano_semestre: body.ano_semestre,
        p_titulo: body.titulo,
        p_descricao: body.descricao,
        p_arquivo_url: body.arquivo_url || null,
        p_link: body.link || null, // NEW
        p_data_inicio: body.data_inicio,
        p_data_fim: body.data_fim,
        p_exibir_periodo: body.exibir_periodo ?? true,
        p_is_publicado: body.is_publicado ?? false,
        p_publicado_em: body.publicado_em || null,
        p_desativado_em: body.desativado_em || null,
        p_user_id: user.data.user.id
    });

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return { id: data, message: 'Edital salvo com sucesso' };
});
