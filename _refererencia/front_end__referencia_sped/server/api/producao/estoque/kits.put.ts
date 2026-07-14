import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const body = await readBody(event);

  if (!body || !body.id || !body.nome) {
    throw createError({
      statusCode: 400,
      message: "ID e nome do kit são obrigatórios",
    });
  }

  const { data, error } = await client.rpc("nxt_update_kit", {
    p_id: body.id,
    p_nome: body.nome,
  } as any);

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }

  return { success: true, kit: data };
});
