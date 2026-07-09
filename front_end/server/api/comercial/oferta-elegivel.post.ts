import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const body = await readBody(event);

  const { id, id_entidade, id_oferta, cpf, email, expirado_em, usuario_id } =
    body;

  if (!id_entidade || !id_oferta || !cpf) {
    throw createError({
      statusCode: 400,
      message: "id_entidade, id_oferta e cpf são obrigatórios",
    });
  }

  const { data, error } = await client.rpc("com_upsert_elegivel", {
    p_id: id || null,
    p_id_entidade: id_entidade,
    p_id_oferta: id_oferta,
    p_cpf: cpf,
    p_email: email || null,
    p_expirado_em: expirado_em || null,
    p_usuario_id: usuario_id || null,
  } as any);

  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});
