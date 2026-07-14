import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

const allowedStatus = new Set(["rascunho", "enviada", "em_analise", "aprovada", "reprovada"]);

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const idCandidatura = getRouterParam(event, "id_candidatura");
  if (!idCandidatura) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing id_candidatura",
    });
  }

  const body = await readBody<{ status?: string }>(event);
  const status = body?.status;

  if (!status || !allowedStatus.has(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid status",
    });
  }

  const client = await serverSupabaseClient(event);

  const { data, error } = await (client as any)
    .from("jnpta_candidaturas")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", idCandidatura)
    .select("id, status")
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to update candidatura status",
    });
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: "Candidatura not found",
    });
  }

  return {
    ok: true,
    candidatura: data,
  };
});
