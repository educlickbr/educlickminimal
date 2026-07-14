import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const idCandidatura = getRouterParam(event, "id_candidatura");
    if (!idCandidatura) {
        throw createError({ statusCode: 400, statusMessage: "Missing id_candidatura" });
    }

    const body = await readBody(event);
    const aceite_termos = body?.aceite_termos;

    if (typeof aceite_termos !== 'boolean') {
        throw createError({ statusCode: 400, statusMessage: "Missing required field: aceite_termos" });
    }

    const client = await serverSupabaseClient(event);

    try {
        const { data, error } = await (client.rpc as any)(
            "nxt_jnpta_finalizar_candidatura",
            {
                p_id_candidatura: idCandidatura,
                p_aceite_termos:  aceite_termos,
            }
        );

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message || "Erro ao finalizar candidatura" });
        }

        if (!data?.ok) {
            throw createError({ statusCode: 400, statusMessage: data?.erro || "Não foi possível finalizar candidatura" });
        }

        // Compatibilidade: em ambientes com RPC legado a finalização pode atualizar apenas
        // a coluna situacao. Forçamos o status canônico para evitar candidatura em rascunho.
        const nowIso = new Date().toISOString();
        const { error: syncStatusError } = await (client as any)
            .from("jnpta_candidaturas")
            .update({
                status: "enviada",
                aceite_termos: true,
                updated_at: nowIso,
            })
            .eq("id", idCandidatura)
            .select("id")
            .single();

        if (syncStatusError) {
            throw createError({
                statusCode: 500,
                statusMessage: syncStatusError.message || "Finalização concluída sem sincronizar status da candidatura",
            });
        }

        return {
            ok: true,
            status: 'enviada'
        };
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
