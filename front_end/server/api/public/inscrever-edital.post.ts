import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

/**
 * POST /api/public/inscrever-edital
 * Body: { id_edital, id_entidade, respostas }
 *
 * Cria inscrição em edital para docente.
 * A validação de CPF duplicado é feita dentro da RPC.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);
    const body = await readBody(event);

    if (!body.id_edital || !body.id_entidade) {
        throw createError({ statusCode: 400, message: "Dados incompletos." });
    }

    // Verifica se o edital existe e está aberto
    // Usa RPC pública (SECURITY DEFINER) para não ser bloqueado por RLS
    const { data: edital } = await (client as any).rpc("aca_get_editais_publicos", {
        p_id_entidade: body.id_entidade,
    });

    const editalResult = edital as any;
    const editalData = (editalResult?.itens || []).find(
        (e: any) => e.id === body.id_edital,
    );

    if (!editalData) {
        throw createError({ statusCode: 404, message: "Edital não encontrado ou período de inscrição encerrado." });
    }

    // Extrai nome e email das respostas (sys-nome, sys-email)
    const respostas = body.respostas || {};
    const nome = respostas["sys-nome"] || "";
    const email = respostas["sys-email"] || "";

    if (!nome || !email) {
        throw createError({ statusCode: 400, message: "Nome e email são obrigatórios." });
    }

    // Chama RPC que já valida CPF duplicado internamente
    // Passa criado_por = auth user ID (null se não logado = fluxo público)
    const { data, error } = await (client as any).rpc("aca_inscrever_edital_publico", {
        p_id_edital: body.id_edital,
        p_id_entidade: body.id_entidade,
        p_nome: nome,
        p_email: email,
        p_respostas: respostas,
        p_criado_por: user?.id || null,
    });

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    return data;
});
