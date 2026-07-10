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
export default defineEventHandler(async (event) => {
    const { personName, companyName, email, message } = await readBody(event);

    // Validação básica
    if (!personName || !companyName || !email || !message) {
        throw createError({
            statusCode: 400,
            message: "Todos os campos são obrigatórios.",
        });
    }

    const url = process.env.ODOO_URL;
    const db = process.env.ODOO_DB;
    const username = process.env.ODOO_EMAIL;
    const password = process.env.ODOO_API_KEY;

    if (!url || !db || !username || !password) {
        console.error("[odoo-lead] Credenciais ausentes no .env");
        throw createError({
            statusCode: 500,
            message: "Erro de configuração do CRM.",
        });
    }

    const rpc = async (method: string, params: unknown[]) => {
        const res = await $fetch<{ result?: unknown; error?: { message?: string } }>(
            `${url}/jsonrpc`,
            {
                method: "POST",
                body: {
                    jsonrpc: "2.0",
                    method,
                    params,
                    id: Math.floor(Math.random() * 100000),
                },
            },
        );
        if (res.error) throw new Error(res.error.message ?? "Erro na API do Odoo");
        return res.result;
    };

    try {
        // 1. Autentica
        const uid = await rpc("authenticate", [db, username, password, {}]);
        if (!uid || typeof uid !== "number") {
            throw new Error("Falha na autenticação com o Odoo");
        }

        // 2. Cria o lead (crm.lead)
        const leadId = await rpc("execute_kw", [
            db,
            uid,
            password,
            "crm.lead",
            "create",
            [
                {
                    name: `[Educlick] ${companyName} — ${personName}`,
                    contact_name: personName,
                    partner_name: companyName,
                    email_from: email,
                    description: message,
                    team_id: false, // fallback para equipe padrão
                },
            ],
        ]);

        console.log(`[odoo-lead] Lead criado: ${leadId}`);

        return { success: true, leadId };
    } catch (err) {
        console.error("[odoo-lead] Erro:", err);
        throw createError({
            statusCode: 500,
            message: "Não foi possível enviar o contato. Tente novamente mais tarde.",
        });
    }
});
