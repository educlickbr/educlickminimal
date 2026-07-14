import { serverSupabaseClient } from '#supabase/server';

const getFirstQueryValue = (value: string | string[] | undefined): string | null => {
    if (Array.isArray(value)) {
        return value[0] || null;
    }
    return value || null;
};

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    const id_matricula = getFirstQueryValue(query.id_matricula as string | string[] | undefined);
    const id_aluno = getFirstQueryValue(query.id_aluno as string | string[] | undefined);
    const id_turma = getFirstQueryValue(query.id_turma as string | string[] | undefined);

    if (!id_matricula && (!id_aluno || !id_turma)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'id_matricula is required, or id_aluno and id_turma for legacy fallback'
        });
    }

    if (id_matricula) {
        const { data, error } = await (client.rpc as any)('nxt_get_faltas_matricula', {
            p_id_matricula: id_matricula,
            p_id_aluno: null,
            p_id_turma: null
        });

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message
            });
        }

        return data;
    }

    const { data, error } = await (client.rpc as any)('nxt_get_faltas_matricula', {
        p_id_matricula: null,
        p_id_aluno: id_aluno,
        p_id_turma: id_turma
    });

    if (error && id_aluno && id_turma) {
        const { data: legacyData, error: legacyError } = await (client.rpc as any)('nxt_get_faltas_aluno_turma', {
            p_id_aluno: id_aluno,
            p_id_turma: id_turma
        });

        if (legacyError) {
            throw createError({
                statusCode: 500,
                statusMessage: legacyError.message
            });
        }

        return legacyData;
    }

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data;
});
