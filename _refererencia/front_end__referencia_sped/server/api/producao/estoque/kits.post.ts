import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const body = await readBody(event);

  if (!body || !body.nome) {
    throw createError({
      statusCode: 400,
      message: "Nome do kit é obrigatório",
    });
  }

  const { data, error } = await client.rpc("nxt_insert_kit", {
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
