import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const user = await client.auth.getUser();

  if (!user.data.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { id, avaliacao_submissao } = body;

  if (!id || avaliacao_submissao === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing ID or avaliacao_submissao",
    });
  }

  const { error } = await (client.rpc as any)(
    "nxt_justificativa_update_avaliacao",
    {
      p_id: id,
      p_avaliacao_submissao: avaliacao_submissao,
      p_user_id: user.data.user.id,
    },
  );

  if (error) {
    console.error("Error updating avaliacao:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { success: true };
});
