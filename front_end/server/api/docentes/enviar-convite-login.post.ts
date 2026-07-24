import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/enviar-convite-login
 * Body: { id_docente, email, nome }
 *
 * Envia convite por email para o docente criar sua conta.
 * O email e nome vêm do frontend (já carregados via RPC).
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const config = useRuntimeConfig();

    if (!body.id_docente || !body.email) {
        throw createError({ statusCode: 400, message: "id_docente e email são obrigatórios." });
    }

    const webhookUrl = config.powerAutomateConvite;
    if (!webhookUrl) {
        return { success: false, message: "Webhook não configurado (POWER_AUTOMATE_CONVITE)." };
    }

    const origin = getRequestProtocol(event) + "://" + getRequestHost(event);

    await $fetch(webhookUrl, {
        method: "POST",
        body: {
            email: body.email,
            nome: body.nome || "",
            link: `${origin}/auth/login`,
        },
    });

    return { success: true, message: "Convite enviado com sucesso!" };
});
