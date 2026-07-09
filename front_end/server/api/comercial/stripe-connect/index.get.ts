import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id_entidade = typeof query.id_entidade === 'string' ? query.id_entidade : undefined

  if (!id_entidade) {
    throw createError({ statusCode: 400, message: 'id_entidade é obrigatório' })
  }

  const clientId = process.env.STRIPE_CLIENT_ID
  if (!clientId) {
    throw createError({ statusCode: 500, message: 'STRIPE_CLIENT_ID não configurado' })
  }

  const proto = getRequestProtocol(event)
  const host = getRequestHost(event)
  const callbackUrl = `${proto}://${host}/api/comercial/stripe-connect/callback`

  const state = Buffer.from(JSON.stringify({ id_entidade, timestamp: Date.now() })).toString('base64')

  const url = new URL('https://connect.stripe.com/oauth/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('scope', 'read_write')
  url.searchParams.set('redirect_uri', callbackUrl)
  url.searchParams.set('state', state)

  return { success: true, url: url.toString() }
})
