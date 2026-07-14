import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        return { user: null, profile: null, role: null };
    }

    const client = await serverSupabaseClient(event);
    const userId = user.id || (user as any).sub;

    const appMeta = (user as any)?.app_metadata || {};
    const userMeta = (user as any)?.user_metadata || {};
    const resolvedCompanyId =
        appMeta.empresa_id || appMeta.id_empresa || appMeta.company_id || appMeta?.empresa?.id ||
        userMeta.empresa_id || userMeta.id_empresa || userMeta.company_id || userMeta?.empresa?.id ||
        null;

    try {
        // 1. Fetch signed URL hash from Edge Function 'hash_app'
        const { data: hashData } = await client.functions.invoke("hash_app", {
            body: {
                user_id: userId,
                path: "/usr/",
            },
        });

        // 2. Fetch Expanded Profile Data from DB
        // Using userId explicitly to ensure we don't send undefined
        const { data: profileData, error: rpcError } =
            await (client.rpc as any)(
                "get_user_expandido",
                {
                    p_auth_id: userId,
                },
            );

        if (rpcError) {
            console.error("RPC Error in /api/me:", rpcError);
        }

        const expanded = (profileData as any) || {};

        return {
            user: user,
            hash_base: hashData?.url || null,
            // Expanded fields
            user_expandido_id: expanded.user_expandido_id || null,
            nome: expanded.nome || null,
            sobrenome: expanded.sobrenome || null,
            imagem_user: expanded.imagem_user || null,
            eixo: expanded.eixo || null,
            // Debugging
            _rpc_error: rpcError || null,
            _debug_user_id_used: userId,
            _debug_raw_profile: profileData || null,
            // Original fields
            profile: null,
            role: expanded.papel_id
                ? {
                    papel_id: expanded.papel_id,
                    nome: expanded.papel,
                }
                : null,
            company: resolvedCompanyId ? { empresa_id: String(resolvedCompanyId) } : null,
        };
    } catch (err) {
        console.error("General error in /api/me:", err);
        return {
            user: user,
            hash_base: null,
            error: true,
            _debug_error_msg: (err as any).message,
        };
    }
});
