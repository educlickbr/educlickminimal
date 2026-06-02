import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await client
    .rpc('nxt_upsert_area', {
      p_id: body.id,
      p_nome_area: body.nome_area,
      p_descricao: body.descricao,
      p_id_entidade: body.id_entidade,
      p_criado_por: body.usuario_id
    }as any)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true, id: data }
})
