import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/docentes/enviar-convite
 * Body: { email, nome, link, token }
 *
 * Dispara webhook do Power Automate para enviar o link
 * de autocadastro por email. Apenas envia — não marca
 * nada no banco (isso é para o Fluxo B futuro).
 *
 * O convite é marcado como usado quando o docente
 * completa o cadastro (RPC aca_completar_cadastro_docente).
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const config = useRuntimeConfig();

    if (!body.email) {
        throw createError({
            statusCode: 400,
            message: "email é obrigatório.",
        });
    }

    // Dispara webhook (fire-and-forget)
    const webhookUrl = config.powerAutomateLinkWebhook;
    if (webhookUrl) {
        $fetch(webhookUrl, {
            method: "POST",
            body: {
                email: body.email,
                nome: body.nome || "",
                link: body.link,
                token: body.token,
            },
        }).catch((err) => {
            console.warn("[Power Automate] Falha ao disparar webhook:", err.message);
        });
    }

    return { success: true };
});
