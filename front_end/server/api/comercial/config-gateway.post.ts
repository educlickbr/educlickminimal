import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const body = await readBody(event);

  const { id_entidade, stripe_account_id, is_sandbox, usuario_id } = body || {};

  if (!id_entidade) {
    throw createError({
      statusCode: 400,
      message: "id_entidade é obrigatório",
    });
  }

  const { data, error } = (await client
    .from("com_config_gateway")
    .upsert(
      {
        id_entidade,
        gateway_name: "stripe",
        is_sandbox: is_sandbox ?? true,
        stripe_account_id: stripe_account_id || null,
        criado_por: usuario_id || null,
        modificado_por: usuario_id || null,
        modificado_em: new Date().toISOString(),
      } as any,
      { onConflict: "id_entidade" },
    )
    .select()
    .single()) as any;

  if (error) throw createError({ statusCode: 500, message: error.message });
  return { success: true, data };
});
