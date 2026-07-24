import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/public/verificar-inscricoes?email=X
 *
 * Retorna os IDs dos editais onde o email já está inscrito.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const email = (query.email as string || "").trim().toLowerCase();

    if (!email) {
        return { success: true, ids: [], inscricoes: [] };
    }

    // Busca user_expandido via RPC SECURITY DEFINER
    const { data: ue } = await (client as any).rpc("auth_verificar_email", {
        p_email: email,
    });

    if (!ue?.id_user_expandido) {
        return { success: true, ids: [], inscricoes: [] };
    }

    // Busca inscrições com data
    const { data: inscricoes, error } = await (client as any)
        .from("aca_edital_docente_inscricao")
        .select("id_edital, criado_em")
        .eq("id_candidato", ue.id_user_expandido);

    if (error) {
        return { success: true, ids: [], inscricoes: [] };
    }

    const ids = (inscricoes || []).map((i: any) => i.id_edital);

    // Mapa edital_id → criado_em
    const dataMap: Record<string, string> = {};
    (inscricoes || []).forEach((insc: any) => {
        dataMap[insc.id_edital] = insc.criado_em;
    });

    return { success: true, ids, inscricoes: dataMap };
});
