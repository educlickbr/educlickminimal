import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const client = await serverSupabaseClient(event);

  const { p_area, p_ano_semestre } = query;

  try {
    const { data, error } = await (client.rpc as any)(
      "nxt_get_turmas_seletivo",
      {
        p_area: p_area || null,
        p_ano_semestre: p_ano_semestre || null,
      }
    );

    if (error) throw error;

    return data;
  } catch (e: any) {
    console.error("Erro no endpoint turmas:", e);
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage:
        e.statusMessage || "Erro ao buscar turmas do seletivo.",
    });
  }
});
