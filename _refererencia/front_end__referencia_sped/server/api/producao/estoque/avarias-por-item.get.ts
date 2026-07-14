import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const query = getQuery(event);
  const idItem = query.id_item as string;

  const { data, error } = await client.rpc("nxt_get_avarias_por_item", {
    p_id_item: idItem,
  } as any);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
