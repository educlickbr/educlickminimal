import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event)
	const body = await readBody(event)

	const { id, id_entidade, indice, nome_turno, hora_ini, hora_fim, ativo, is_intervalo } = body

	if (!id_entidade || indice === undefined || !nome_turno || !hora_ini || !hora_fim) {
		throw createError({ statusCode: 400, statusMessage: 'id_entidade, indice, nome_turno, hora_ini e hora_fim são obrigatórios' })
	}

	const { data, error } = await client.rpc('acd_upsert_horario', {
		p_id: id || null,
		p_id_entidade: id_entidade,
		p_indice: indice,
		p_nome_turno: nome_turno,
		p_hora_ini: hora_ini,
		p_hora_fim: hora_fim,
		p_ativo: ativo !== undefined ? ativo : true,
		p_is_intervalo: is_intervalo !== undefined ? is_intervalo : false,
	} as any)

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	return data || { success: true }
})
