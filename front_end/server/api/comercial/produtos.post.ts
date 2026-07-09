import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const body = await readBody(event);

  const {
    id,
    id_entidade,
    id_programa,
    nome_produto,
    descricao,
    is_ativo,
    usuario_id,
  } = body;

  if (!id_entidade || !id_programa) {
    throw createError({
      statusCode: 400,
      message: "id_entidade e id_programa são obrigatórios",
    });
  }

  const { data, error } = await client.rpc("com_upsert_produto", {
    p_id: id || null,
    p_id_entidade: id_entidade,
    p_id_programa: id_programa,
    p_nome_produto: nome_produto || null,
    p_descricao: descricao || null,
    p_is_ativo: is_ativo !== undefined ? is_ativo : true,
    p_usuario_id: usuario_id || null,
  } as any);

  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});
