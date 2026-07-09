import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const query = getQuery(event);
  const slug = getRouterParam(event, "slug");
  const id_entidade =
    typeof query.id_entidade === "string" ? query.id_entidade : undefined;

  if (!slug) {
    throw createError({ statusCode: 400, message: "slug é obrigatório" });
  }

  const { data, error } = await client.rpc("com_get_oferta_por_slug", {
    p_slug: slug,
    p_id_entidade: id_entidade || null,
  } as any);

  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});
