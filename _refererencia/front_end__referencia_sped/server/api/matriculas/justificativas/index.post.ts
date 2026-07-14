
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await client.auth.getUser();

    if (!user.data.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const body = await readBody(event);

    const { data, error } = await (client.rpc as any)('nxt_justificativa_upsert', {
        p_id_aluno: body.id_aluno,
        p_id_turma: body.id_turma,
        p_texto: body.texto,
        p_escopo: body.escopo,
        p_nome_exibicao_tipo: body.nome_exibicao_tipo || null,
        p_nome_exibicao: body.nome_exibicao || null,
        p_data_inicio_janela: body.data_inicio_janela,
        p_data_fim_janela: body.data_fim_janela,
        p_arquivo: body.arquivo || null,
        p_caminho_ficha: body.caminho_ficha || null,
        p_aceite_termo_justificativa: !!body.aceite_termo_justificativa,
        p_id: body.id || null
    });

    if (error) {
        console.error('Error upserting justificativa:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    return { id: data };
});
