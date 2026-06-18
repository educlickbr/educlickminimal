import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await client
    .rpc('frm_upsert_pergunta', {
      p_id: body.id || null,
      p_id_entidade: body.id_entidade,
      p_nome_interno: body.nome_interno,
      p_label: body.label,
      p_placeholder: body.placeholder || '',
      p_tipo_pergunta: body.tipo_pergunta,
      p_opcoes: body.opcoes || null
    } as any)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
