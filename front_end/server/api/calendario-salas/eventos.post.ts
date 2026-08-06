import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event)
	const body = await readBody(event)

	const { id_entidade, nome_evento, data, user_id } = body

	if (!id_entidade || !nome_evento || !data) {
		throw createError({ statusCode: 400, statusMessage: 'id_entidade, nome_evento e data são obrigatórios' })
	}

	// Criar evento em aca_evento via query direta (sem tipos, usar as any)
	const { data: newEvent, error } = await (client as any)
		.from('aca_evento')
		.insert({
			id_entidade,
			nome_evento,
			descricao: '',
			data_inicio: data,
			data_fim: data,
			sobrescrever_calendario: false,
			criado_por: user_id || null,
		})
		.select('id')
		.single()

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	return { success: true, id: newEvent.id }
})
