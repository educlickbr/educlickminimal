import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event)
	const query = getQuery(event)
	const id = query.id as string

	if (!id) {
		throw createError({ statusCode: 400, statusMessage: 'id é obrigatório' })
	}

	const { data, error } = await client.rpc('acd_delete_horario', {
		p_id: id,
	} as any)

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	return data || { success: true }
})
