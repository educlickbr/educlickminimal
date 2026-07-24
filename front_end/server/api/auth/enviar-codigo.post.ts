import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/auth/enviar-codigo
 * Body: { id_user_expandido, email, nome }
 *
 * Gera código de verificação e dispara webhook
 * Power Automate para enviar o código por email.
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const config = useRuntimeConfig();

    if (!body.id_user_expandido || !body.email) {
        throw createError({ statusCode: 400, message: "Dados incompletos." });
    }

    // Gera código
    const { data, error } = await (client as any).rpc("aca_gerar_codigo_verificacao", {
        p_id_user_expandido: body.id_user_expandido,
    });

    if (error) {
        throw createError({ statusCode: 500, message: error.message });
    }

    const rpcResult = data as any;

    // Dispara webhook
    const webhookUrl = config.powerAutomateTokenCadastro;
    if (webhookUrl && rpcResult?.codigo) {
        $fetch(webhookUrl, {
            method: "POST",
            body: {
                email: body.email,
                nome: body.nome || "",
                codigo: rpcResult.codigo,
            },
        }).catch((err) => {
            console.warn("[Power Automate] Falha webhook token:", err.message);
        });
    }

    return { success: true, message: "Código enviado para o email." };
});
