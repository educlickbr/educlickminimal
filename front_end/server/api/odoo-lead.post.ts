/**
 * BFF: cria um lead (oportunidade) no Odoo via JSON-RPC.
 *
 * Endpoint: POST /api/odoo-lead
 * Body: { personName, companyName, email, message }
 *
 * Variáveis de ambiente (.env):
 *   ODOO_URL         — URL do servidor Odoo (ex: https://ktaz.odoo.com)
 *   ODOO_DB          — Nome do database
 *   ODOO_EMAIL       — Email do usuário da API
 *   ODOO_API_KEY     — API key do Odoo
 */

type JsonRpcResult<T> = {
    result?: T;
    error?: {
        message?: string;
        data?: { message?: string };
    };
};

const callOdoo = async <T>(odooUrl: string, payload: Record<string, unknown>) => {
    const baseUrl = odooUrl.replace(/\/+$/, "");
    const url = `${baseUrl}/jsonrpc`;

    const response = await $fetch<JsonRpcResult<T>>(url, {
        method: "POST",
        body: {
            jsonrpc: "2.0",
            method: "call",
            id: Date.now(),
            params: payload,
        },
    });

    if (response.error) {
        throw new Error(
            response.error.data?.message ??
                response.error.message ??
                "Erro de integração com o Odoo.",
        );
    }

    if (typeof response.result === "undefined") {
        throw new Error("Resposta inválida do Odoo.");
    }

    return response.result;
};

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        personName?: string;
        companyName?: string;
        email?: string;
        message?: string;
    }>(event);

    const personName = body.personName?.trim();
    const companyName = body.companyName?.trim();
    const email = body.email?.trim();
    const message = body.message?.trim();

    if (!personName || !companyName || !email || !message) {
        throw createError({
            statusCode: 400,
            message: "Preencha nome, empresa, e-mail e descrição.",
        });
    }

    const odooUrl = process.env.ODOO_URL?.trim();
    const odooDb = process.env.ODOO_DB?.trim();
    const odooEmail = process.env.ODOO_EMAIL?.trim();
    const odooApiKey = process.env.ODOO_API_KEY?.trim();

    console.log("[odoo-lead] env vars loaded:", {
        url: odooUrl,
        db: odooDb,
        email: odooEmail,
        keyLen: odooApiKey?.length,
    });

    if (!odooUrl || !odooDb || !odooEmail || !odooApiKey) {
        throw createError({
            statusCode: 500,
            message: "Configuração do Odoo não encontrada no ambiente.",
        });
    }

    try {
        // 1. Autentica no Odoo
        const uid = await callOdoo<number>(odooUrl, {
            service: "common",
            method: "authenticate",
            args: [odooDb, odooEmail, odooApiKey, {}],
        });

        console.log("[odoo-lead] authenticate uid:", uid);

        if (!uid) {
            throw new Error("Falha na autenticação com o Odoo.");
        }

        // 2. Cria o lead (crm.lead)
        const leadId = await callOdoo<number>(odooUrl, {
            service: "object",
            method: "execute_kw",
            args: [
                odooDb,
                uid,
                odooApiKey,
                "crm.lead",
                "create",
                [
                    {
                        name: companyName,
                        contact_name: personName,
                        email_from: email,
                        description: message,
                    },
                ],
            ],
        });

        console.log("[odoo-lead] lead criado:", leadId);

        return {
            ok: true,
            leadId,
        };
    } catch (error) {
        console.log("[odoo-lead] error:", error);
        throw createError({
            statusCode: 502,
            message:
                (error as { message?: string }).message ??
                "Não foi possível criar o lead no Odoo.",
        });
    }
});
