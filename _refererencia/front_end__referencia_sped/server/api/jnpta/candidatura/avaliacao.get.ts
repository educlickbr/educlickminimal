import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

const firstQueryValue = (value: unknown): string | null => {
    if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === "string" ? first : null;
    }
    return typeof value === "string" ? value : null;
};

const parseBoolQuery = (value: unknown, defaultValue = false): boolean => {
    const raw = firstQueryValue(value);
    if (raw == null) return defaultValue;
    const normalized = raw.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    return defaultValue;
};

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const query = getQuery(event);
    const status = firstQueryValue(query.status);
    const qualTempo = firstQueryValue(query.qual_tempo);
    const anoSemestre = firstQueryValue(query.ano_semestre);
    const includeRascunhos = parseBoolQuery(query.include_rascunhos, false);

    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc("nxt_jnpta_listar_candidaturas_avaliacao", {
            p_status: status,
            p_qual_tempo: qualTempo,
            p_include_rascunhos: includeRascunhos,
            p_ano_semestre: anoSemestre,
        }) as any;

        if (error) {
            console.error("Error listing candidaturas avaliacao:", error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || "Failed to list candidaturas",
            });
        }

        const candidaturas = Array.isArray(data) ? data : [];

        return {
            ok: true,
            candidaturas,
        };
    } catch (err: any) {
        console.error("Unexpected error listing candidaturas avaliacao:", err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || "Internal server error",
        });
    }
});
