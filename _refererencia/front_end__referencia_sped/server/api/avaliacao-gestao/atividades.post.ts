import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    const titulo = String(body?.titulo || '').trim();
    const enunciado = String(body?.enunciado || '').trim();
    const linkExterno = body?.link_externo ? String(body.link_externo).trim() : null;
    const idTurma = body?.id_turma ? String(body.id_turma).trim() : null;
    const arquivoApoio = body?.arquivo_apoio ? String(body.arquivo_apoio).trim() : null;

    if (!titulo || !enunciado) {
        throw createError({ statusCode: 400, statusMessage: 'Título e enunciado são obrigatórios.' });
    }

    const { data, error } = await (client.rpc as any)('avl_upsert_atividade_recuperacao', {
        p_id: null,
        p_titulo: titulo,
        p_enunciado: enunciado,
        p_link_externo: linkExterno,
        p_id_turma: idTurma || null,
        p_arquivo_apoio: arquivoApoio,
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return Array.isArray(data) ? (data[0] || null) : data;
});