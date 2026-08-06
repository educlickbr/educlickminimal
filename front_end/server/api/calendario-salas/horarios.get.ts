import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event)
	const query = getQuery(event)
	const idEntidade = query.id_entidade as string

	if (!idEntidade) {
		throw createError({ statusCode: 400, statusMessage: 'id_entidade é obrigatório' })
	}

	const { data, error } = await client.rpc('acd_get_salas_horarios', {
		p_id_entidade: idEntidade,
	} as any)

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	return data || []
})
