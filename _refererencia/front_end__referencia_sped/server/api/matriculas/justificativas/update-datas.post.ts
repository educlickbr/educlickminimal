import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await client.auth.getUser();

    if (!user.data.user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const body = await readBody(event);
    const { id, data_inicio_janela, data_fim_janela } = body;

    if (!id || !data_inicio_janela || !data_fim_janela) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing required fields: id, data_inicio_janela, data_fim_janela",
        });
    }

    const { error } = await (client.rpc as any)("nxt_justificativa_update_datas", {
        p_id: id,
        p_data_inicio_janela: data_inicio_janela,
        p_data_fim_janela: data_fim_janela,
        p_user_id: user.data.user.id,
    });

    if (error) {
        console.error("Error updating justificativa datas:", error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }

    return { success: true };
});
