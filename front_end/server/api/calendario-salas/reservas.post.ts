import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event)
	const body = await readBody(event)

	const { reservas, user_id } = body

	if (!reservas || !Array.isArray(reservas) || reservas.length === 0) {
		throw createError({ statusCode: 400, statusMessage: 'reservas é obrigatório' })
	}
	if (!user_id) {
		throw createError({ statusCode: 400, statusMessage: 'user_id é obrigatório' })
	}

	const { data, error } = await client.rpc('acd_upsert_reserva_batch', {
		p_reservas: reservas,
		p_usuario_id: user_id,
	} as any)

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	return data || { success: true }
})
