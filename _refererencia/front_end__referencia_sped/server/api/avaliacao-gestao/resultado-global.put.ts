import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const client = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Não autorizado' });
    }

    // Determina o que mudou
    const p_aprovar_coordenador = body.aprovado_coordenador === undefined ? null : body.aprovado_coordenador;
    const p_aprovar_pedagogo    = body.aprovado_pedagogo    === undefined ? null : body.aprovado_pedagogo;
    const p_publicado           = body.publicado           === undefined ? null : body.publicado;

    const { data: upsertData, error }: any = await client.rpc("avl_upsert_resultado_global", {
        p_id_avaliacao: body.id_avaliacao,
        p_id_aluno: body.id_aluno,
        p_comentario: body.comentario ?? null,
        p_publicado,
        p_aprovar_coordenador,
        p_aprovar_pedagogo,
    } as any);

    if (error) {
        console.error('[resultado-global] RPC avl_upsert_resultado_global error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    // Busca os dados atualizados nativamente pelo Supabase com os dados de usuários aninhados
    const { data: globalData } = await client.from("avl_resultado_global")
        .select(`
            *,
            user_coordenador:user_expandido!avl_resultado_global_aprovado_coordenador_fkey(id, nome, sobrenome, email),
            user_pedagogo:user_expandido!avl_resultado_global_aprovado_pedagogo_fkey(id, nome, sobrenome, email)
        `)
        .eq("id_avaliacao", body.id_avaliacao)
        .eq("id_aluno", body.id_aluno)
        .single();

    return globalData || upsertData;
});
