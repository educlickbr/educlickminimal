import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);

    if (!body?.id_curso) {
        throw createError({
            statusCode: 400,
            statusMessage: 'id_curso é obrigatório'
        });
    }

    const { data: curso, error: cursoError } = await client
        .from('curso')
        .select('area')
        .eq('id', body.id_curso)
        .single();

    if (cursoError || !curso) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Curso não encontrado'
        });
    }

    const area = String(curso.area || '').toLowerCase();
    const nomeDocente = String(body.nome_docente || '').trim();
    const nomeCurador = String(body.nome_curador || '').trim();

    if (area === 'cursos_livres' && !nomeDocente) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Docente é obrigatório para Cursos Livres'
        });
    }

    if (area === 'extensao' && !nomeDocente) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Docente é obrigatório para Extensão'
        });
    }

    if (area === 'extensao' && !nomeCurador) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Curador(a) é obrigatório para Extensão'
        });
    }

    const { data, error } = await client.rpc('nxt_upsert_curso_certificado_parametrizacao', {
        p_id_curso: body.id_curso,
        p_texto_institucional: body.texto_institucional || null,
        p_nome_coordenador: body.nome_coordenador || null,
        p_nome_docente: body.nome_docente || null,
        p_nome_curador: body.nome_curador || null,
        p_carga_horaria_exibida: body.carga_horaria_exibida || null,
        p_descricao: body.descricao ?? null
    } as any);

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return data;
});
