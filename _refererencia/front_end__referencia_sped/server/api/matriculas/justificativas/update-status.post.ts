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
  const { id, status, avaliacao_submissao } = body;
  const allowedStatus = new Set([
    "Aguardando",
    "Em Análise",
    "Aprovado",
    "Reprovado",
  ]);

  if (!id || !status) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing ID or Status",
    });
  }

  if (!allowedStatus.has(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid status",
    });
  }

  const rpcParams: any = {
    p_id: id,
    p_status: status,
    p_user_id: user.data.user.id,
  };
  if (status === "Reprovado" && avaliacao_submissao !== undefined) {
    rpcParams.p_avaliacao_submissao = avaliacao_submissao;
  }

  const { error } = await (client.rpc as any)(
    "nxt_justificativa_update_status",
    rpcParams,
  );

  if (error) {
    console.error("Error updating status:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { success: true };
});
