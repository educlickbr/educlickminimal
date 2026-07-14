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
    const qualTempo = firstQueryValue(query.qual_tempo) || "todos";
    const anoSemestre = firstQueryValue(query.ano_semestre);
    const includeRascunhos = parseBoolQuery(query.include_rascunhos, false);

    const client = await serverSupabaseClient(event);

    const commonParams = {
        p_ano_semestre: anoSemestre,
        p_qual_tempo: qualTempo,
        p_include_rascunhos: includeRascunhos,
    };

    const [primeiroResp, segundoResp] = await Promise.all([
        (client.rpc as any)("nxt_jnpta_dashboard_primeiro_tempo", commonParams),
        (client.rpc as any)("nxt_jnpta_dashboard_segundo_tempo", commonParams),
    ]);

    if (primeiroResp?.error) {
        throw createError({
            statusCode: 500,
            statusMessage: primeiroResp.error.message || "Erro ao carregar dashboard (primeiro tempo)",
        });
    }

    if (segundoResp?.error) {
        throw createError({
            statusCode: 500,
            statusMessage: segundoResp.error.message || "Erro ao carregar dashboard (segundo tempo)",
        });
    }

    const primeiroData = primeiroResp?.data || {};
    const segundoData = segundoResp?.data || {};

    return {
        ok: true,
        filtros: {
            qual_tempo: qualTempo,
            ano_semestre: anoSemestre,
            include_rascunhos: includeRascunhos,
        },
        total_inscricoes: Number(primeiroData?.total_inscricoes || segundoData?.total_inscricoes || 0),
        primeiro_tempo: {
            total_inscricoes: Number(primeiroData?.total_inscricoes || 0),
            atividade_opcoes: Array.isArray(primeiroData?.atividade_opcoes) ? primeiroData.atividade_opcoes : [],
        },
        segundo_tempo: {
            total_inscricoes: Number(segundoData?.total_inscricoes || 0),
            media_integrantes_por_grupo: Number(segundoData?.media_integrantes_por_grupo || 0),
            regioes_administrativas: Array.isArray(segundoData?.regioes_administrativas)
                ? segundoData.regioes_administrativas
                : [],
        },
    };
});
