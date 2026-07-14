import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

const firstQueryValue = (value: unknown): string | null => {
    if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === "string" ? first : null;
    }
    return typeof value === "string" ? value : null;
};

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const query = getQuery(event);
    const idEdital = firstQueryValue(query.id_edital);

    const client = await serverSupabaseClient(event);

    const rpcName = idEdital
        ? "nxt_jnpta_dashboard_editais_por_edital"
        : "nxt_jnpta_dashboard_editais_ultimo_publicado";

    const rpcParams = idEdital ? { p_id_edital: idEdital } : {};

    const { data, error } = await (client.rpc as any)(rpcName, rpcParams);

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Erro ao carregar dashboard de editais",
        });
    }

    return {
        ok: true,
        dashboard: data || {
            ok: true,
            id_edital: null,
            edital_titulo: null,
            total_inscricoes: 0,
            por_dia: [],
        },
    };
});
