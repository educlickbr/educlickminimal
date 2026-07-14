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

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required",
    });
  }

  // A RPC nxt_justificativa_delete já valida:
  // - Se a solicitação existe
  // - Se o status é 'Aguardando'
  // - Lança exceção com mensagem adequada se alguma validação falhar
  const { error } = await (client.rpc as any)("nxt_justificativa_delete", {
    p_id: id,
  });

  if (error) {
    console.error("Error deleting justificativa:", error);
    throw createError({
      statusCode: 409,
      statusMessage: error.message,
    });
  }

  return { success: true };
});
