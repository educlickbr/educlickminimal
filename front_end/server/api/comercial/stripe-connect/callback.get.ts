import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const client = await serverSupabaseClient(event);

  const code = typeof query.code === "string" ? query.code : undefined;
  const state = typeof query.state === "string" ? query.state : undefined;

  if (!code || !state) {
    throw createError({
      statusCode: 400,
      message: "code e state são obrigatórios",
    });
  }

  let id_entidade = "";
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    id_entidade = decoded.id_entidade;
  } catch {
    throw createError({ statusCode: 400, message: "state inválido" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const clientId = process.env.STRIPE_CLIENT_ID;

  const response = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId || "",
      client_secret: secretKey || "",
      code,
    }),
  });

  const token = await response.json();
  if (!token.stripe_user_id) {
    throw createError({
      statusCode: 500,
      message: token.error_description || "Erro ao conectar conta Stripe",
    });
  }

  await client.from("com_config_gateway").upsert(
    {
      id_entidade,
      gateway_name: "stripe",
      is_sandbox: secretKey?.startsWith("sk_test_") ?? true,
      stripe_account_id: token.stripe_user_id,
      modificado_em: new Date().toISOString(),
    } as any,
    { onConflict: "id_entidade" },
  );

  const proto = getRequestProtocol(event);
  const host = getRequestHost(event);
  return sendRedirect(
    event,
    `${proto}://${host}/configuracoes/pagamento?stripe=connected`,
  );
});
