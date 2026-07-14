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
    const { id_turma, tipo_candidatura, tipo_processo } = body;

    if (!id_turma) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing ID Turma",
        });
    }

    const client = await serverSupabaseClient(event);
    const authId = user.id || (user as any).sub;

    try {
        // 1. Get user_expandido_id
        const { data: profileData, error: profileError } =
            await (client.rpc as any)("get_user_expandido", {
                p_auth_id: authId,
            });

        if (profileError || !profileData?.user_expandido_id) {
            throw createError({
                statusCode: 404,
                statusMessage: "User profile not found",
            });
        }

        const userExpandidoId = profileData.user_expandido_id;

        // 2. Route to appropriate RPC based on tipo_processo
        let result: any;
        let rpcError: any;

        if (tipo_processo === "matricula") {
            // Direct enrollment: call criar_matricula_unica
            const response = await (client.rpc as any)(
                "criar_matricula_unica",
                {
                    p_id_user_expandido: userExpandidoId,
                    p_id_turma: id_turma,
                },
            );
            result = response.data;
            rpcError = response.error;
        } else {
            // Selective process (default): call criar_processo_unico
            const response = await (client.rpc as any)(
                "criar_processo_unico",
                {
                    p_id_user_expandido: userExpandidoId,
                    p_id_candidatura: id_turma,
                    p_tipo_candidatura: tipo_candidatura || "estudante",
                    p_tipo_processo: tipo_processo || "seletivo",
                },
            );
            result = response.data;
            rpcError = response.error;
        }

        if (rpcError) {
            throw createError({
                statusCode: 500,
                statusMessage: "Error creating enrollment record",
                data: rpcError,
            });
        }

        return result;
    } catch (err: any) {
        console.error("Error in /api/inscricao/submit:", err);
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || "Internal Server Error",
            data: err.data,
        });
    }
});
