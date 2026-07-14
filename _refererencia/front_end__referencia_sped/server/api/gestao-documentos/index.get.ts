import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);

    const { data, error } = await (client.rpc as any)('nxt_get_documentos_curso', {
        p_area: query.area && query.area !== 'null' ? String(query.area) : null,
        p_id_turma: query.id_turma && query.id_turma !== 'null' ? String(query.id_turma) : null,
        p_publicado: query.publicado !== undefined && query.publicado !== null && query.publicado !== 'null' && query.publicado !== ''
            ? String(query.publicado) === 'true'
            : null,
        p_vigencia_ini: query.vigencia_ini && query.vigencia_ini !== 'null' ? String(query.vigencia_ini) : null,
        p_vigencia_fim: query.vigencia_fim && query.vigencia_fim !== 'null' ? String(query.vigencia_fim) : null,
        p_pagina: query.pagina ? parseInt(String(query.pagina)) : 1,
        p_limite: query.limite ? parseInt(String(query.limite)) : 20,
    });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
