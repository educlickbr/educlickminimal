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

    const client = await serverSupabaseClient(event);
    const authId = user.id || (user as any).sub;

    try {
        const { data, error } = await (client.rpc as any)(
            "nxt_get_elegibilidade_seletivo_regulares_por_cpf_v2",
            { p_auth_user_id: authId },
        );

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: "Erro ao avaliar elegibilidade para Regulares.",
                data: error,
            });
        }

        const payload = (data || {}) as {
            ok?: boolean;
            cpf_encontrado?: boolean;
            cpf_normalizado?: string | null;
            anos_semestres_bloqueados?: string[];
        };

        return {
            ok: payload.ok ?? true,
            cpf_encontrado: payload.cpf_encontrado ?? false,
            cpf_normalizado: payload.cpf_normalizado ?? null,
            anos_semestres_bloqueados: Array.isArray(payload.anos_semestres_bloqueados)
                ? payload.anos_semestres_bloqueados
                : [],
        };
    } catch (err: any) {
        console.error("Error in /api/inscricao/elegibilidade-regulares:", err);
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || "Internal Server Error",
            data: err.data,
        });
    }
});
