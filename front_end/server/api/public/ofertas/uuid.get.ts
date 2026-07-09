import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const query = getQuery(event);
  const id_oferta = query.id_oferta as string;

  if (!id_oferta) {
    throw createError({ statusCode: 400, message: "id_oferta é obrigatório" });
  }

  const { data, error } = await client.rpc("com_get_oferta_por_id", {
    p_id: id_oferta,
  } as any);

  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});
