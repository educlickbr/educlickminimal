import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event)
	const body = await readBody(event)

	const { id, id_entidade, nome, cor, capacidade, ativo, user_id } = body

	if (!id_entidade || !nome) {
		throw createError({ statusCode: 400, statusMessage: 'id_entidade e nome são obrigatórios' })
	}

	const { data, error } = await client.rpc('acd_upsert_sala', {
		p_id: id || null,
		p_id_entidade: id_entidade,
		p_nome: nome,
		p_cor: cor || '#8b5cf6',
		p_capacidade: capacidade || null,
		p_ativo: ativo !== undefined ? ativo : true,
		p_usuario_id: user_id || null,
	} as any)

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	return data || { success: true }
})
