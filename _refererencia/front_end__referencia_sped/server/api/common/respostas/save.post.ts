import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const body = await readBody(event);
    const {
        p_id_turma,
        p_id_pergunta,
        p_resposta,
        p_user_expandido_id
    } = body;

    // We can add logic here to verify if the user has permission to edit another user's data
    // For now, assuming if they can hit this internal API with an auth session, they are authorized
    // (Actual permission checks usually happen in middleware or RLS, but here we are using RPC with SECURITY DEFINER usually, or relying on application logic)

    const client = await serverSupabaseClient(event);
    const authUserId = user.id;

    try {
        const p_respostas = [
            {
                id_pergunta: p_id_pergunta,
                resposta: p_resposta !== undefined && p_resposta !== null ? String(p_resposta) : "",
                nome_arquivo_original: "",
            },
        ];

        // If p_user_expandido_id is provided, use it. Otherwise, rely on auth ID.
        // However, nxt_salvar_respostas_usuario logic:
        // IF p_user_expandido_id IS NOT NULL THEN ...
        // ELSIF p_id_usuario IS NOT NULL THEN ...

        let p_id_usuario_arg = null;

        if (!p_user_expandido_id) {
            p_id_usuario_arg = authUserId;
        }

        const { data, error } = await (client as any).rpc(
            "nxt_salvar_respostas_usuario",
            {
                p_id_usuario: p_id_usuario_arg,
                p_respostas: p_respostas,
                p_id_turma: p_id_turma || null,
                p_user_expandido_id: p_user_expandido_id || null,
            },
        );

        if (error) {
            console.error("RPC Error:", error);
            throw error;
        }

        // The RPC returns a JSONB object with { sucesso: boolean, mensagem: string }
        if (data && data.sucesso === false) {
            throw new Error(data.mensagem || 'Erro desconhecido ao salvar.');
        }

        return { success: true, data };
    } catch (err: any) {
        console.error("Save Answer Error:", err);
        throw createError({
            statusCode: 500,
            statusMessage: "Erro ao salvar resposta",
            data: err.message || err,
        });
    }
});
