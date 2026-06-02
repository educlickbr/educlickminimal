import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const id_programa = typeof query.id_programa === 'string' ? query.id_programa : undefined

  if (!id_programa) {
    return { success: false, message: 'id_programa é obrigatório' }
  }

  // Busca os ciclos associados a esse programa na tabela associativa
  const { data, error } = await client
    .from('aca_ciclo_programa')
    .select('id_ciclo, aca_ciclo (id_modulo)')
    .eq('id_programa', id_programa)

  if (error) return { success: false, message: error.message }
  
  // Retorna os dados em formato fácil para o frontend consumir
  const items = (data as any[]) || []
  
  // Extrai o id_modulo do primeiro ciclo (são todos do mesmo módulo/curso no contexto de um programa)
  let idModulo = null
  if (items.length > 0) {
    const first = items[0]
    if (Array.isArray(first.aca_ciclo)) {
      idModulo = first.aca_ciclo[0]?.id_modulo
    } else {
      idModulo = first.aca_ciclo?.id_modulo
    }
  }

  return {
    success: true,
    ciclos: items.map((row: any) => row.id_ciclo),
    id_modulo: idModulo || null
  }
})
