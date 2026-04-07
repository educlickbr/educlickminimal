import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        return { user: null, profile: null, role: null };
    }

    const client = await serverSupabaseClient(event);
    const userId = user.id || (user as any).sub;

    try {
        // 1. Fetch signed URL hash from Edge Function 'hash_app'
        const { data: hashData } = await client.functions.invoke("hash_app", {
            body: {
                user_id: userId,
                path: "/usr/",
            },
        });

        // 2. Fetch Full Session Data from DB
        const { data: sessionData, error: rpcError } =
            await (client.rpc as any)(
                "nxt_get_user_session_v1",
                {
                    p_auth_id: userId,
                },
            );

        if (rpcError) {
            console.error("RPC Error in /api/me:", rpcError);
        }

        const session = (sessionData as any) || {};
        const usuario = session.usuario || {};

        // Limpeza radical: Uma única estrutura de verdade
        return {
            success: session.success || false,
            usuario: {
                id: usuario.id || null,
                id_auth: usuario.id_user || userId,
                email: usuario.email || user.email,
                nome_completo: usuario.nome_completo || null,
            },
            // Facilita o acesso direto no front-end para compatibilidade
            user_expandido_id: usuario.id || null,
            nome_completo: usuario.nome_completo || null,
            
            // Dados de acesso
            entidades: session.entidades || [],
            hash_base: hashData?.url || null,
        };
    } catch (err) {
        console.error("General error in /api/me:", err);
        return {
            success: false,
            error: (err as any).message,
        };
    }
});
