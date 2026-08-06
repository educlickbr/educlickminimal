import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event)
	const query = getQuery(event)

	const idEntidade = query.id_entidade as string
	const start = query.start as string
	const end = query.end as string

	if (!idEntidade) {
		throw createError({ statusCode: 400, statusMessage: 'id_entidade é obrigatório' })
	}
	if (!start || !end) {
		throw createError({ statusCode: 400, statusMessage: 'start e end são obrigatórios' })
	}

	const { data, error } = await client.rpc('acd_get_aulas_sem_reserva', {
		p_id_entidade: idEntidade,
		p_data_inicio: start,
		p_data_fim: end,
	} as any)

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	return data || []
})
