import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    // Critérios
    const { data: criterios, error } = await client.rpc("avl_get_conceitos_aluno", {
        p_id_avaliacao: String(query.id_avaliacao),
        p_id_aluno: String(query.id_aluno),
    } as any);

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    // Resultado Global
    const { data: globalData } = await client.from("avl_resultado_global")
        .select(`comentario, publicado, aprovado_coordenador, aprovado_pedagogo,
            user_coordenador:user_expandido!avl_resultado_global_aprovado_coordenador_fkey(id, nome, sobrenome, email),
            user_pedagogo:user_expandido!avl_resultado_global_aprovado_pedagogo_fkey(id, nome, sobrenome, email)`)
        .eq("id_avaliacao", String(query.id_avaliacao))
        .eq("id_aluno", String(query.id_aluno))
        .single();

    return {
        criterios: criterios || [],
        global: globalData || { comentario: null, publicado: false, aprovado_coordenador: null, aprovado_pedagogo: null, user_coordenador: null, user_pedagogo: null }
    };
});
