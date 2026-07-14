import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);

    const idEntrega = String(body?.id_entrega || '').trim();
    const respostaAluno = body?.resposta_aluno != null ? String(body.resposta_aluno) : null;
    const arquivoEntrega = body?.arquivo_entrega != null ? String(body.arquivo_entrega).trim() : null;

    if (!idEntrega) {
        throw createError({ statusCode: 400, statusMessage: 'Parâmetro obrigatório ausente: id_entrega.' });
    }

    if (!respostaAluno?.trim() && !arquivoEntrega) {
        throw createError({ statusCode: 400, statusMessage: 'Envie ao menos uma resposta de texto ou um arquivo.' });
    }

    const { data, error } = await (client.rpc as any)('avl_aluno_enviar_entrega_atividade', {
        p_id_entrega: idEntrega,
        p_resposta_aluno: respostaAluno || null,
        p_arquivo_entrega: arquivoEntrega || null,
    });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    const row = Array.isArray(data) ? data[0] : data;

    return {
        ok: true,
        id_entrega: row?.id_entrega ?? idEntrega,
        status_avaliacao: row?.status_avaliacao ?? 'Entregue',
        entregue_em: row?.entregue_em ?? null,
    };
});
