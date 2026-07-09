import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { id_oferta } = body

  if (!id_oferta) {
    throw createError({ statusCode: 400, message: "id_oferta é obrigatório" })
  }

  const { data: sessionData } = await client.auth.getSession()
  const user = sessionData?.session?.user
  if (!user?.id) {
    throw createError({ statusCode: 401, message: "Usuário não autenticado" })
  }

  const { data: ofertaRow, error: errOferta } = await client
    .from("com_oferta")
    .select("id, slug, nome_curto, valor_centavos, tipo_pagamento, disponivel_ate, com_produto!inner(nome_produto, id_programa, aca_programa!inner(descricao, id_entidade))")
    .eq("id", id_oferta)
    .single() as any

  if (errOferta || !ofertaRow) {
    throw createError({ statusCode: 404, message: "Oferta não encontrada" })
  }

  const id_entidade = ofertaRow.com_produto?.aca_programa?.id_entidade
  if (!id_entidade) {
    throw createError({ statusCode: 400, message: "Entidade não encontrada" })
  }

  const { data: userEx, error: errUser } = await client
    .from("user_expandido")
    .select("id, nome_completo, email")
    .eq("id_user", user.id)
    .maybeSingle() as any

  if (errUser) throw createError({ statusCode: 500, message: errUser.message })
  if (!userEx) throw createError({ statusCode: 404, message: "Usuário não encontrado" })

  if (ofertaRow.valor_centavos <= 0) {
    const { data: rpcData, error: rpcErr } = await client.rpc("com_criar_pedido", {
      p_id_entidade: id_entidade, p_id_oferta: id_oferta,
      p_id_usuario: userEx.id, p_id_inscricao: null, p_usuario_id: userEx.id,
    } as any)
    if (rpcErr) throw createError({ statusCode: 500, message: rpcErr.message })

    // Criar matrícula acadêmica (fluxo grátis)
    const id_programa = (ofertaRow.com_produto as any)?.id_programa
    if (id_programa) {
      const pedidoId = (rpcData as any)?.id
      await client.rpc("aca_criar_matricula", {
        p_id_entidade: id_entidade,
        p_id_programa: id_programa,
        p_id_usuario: userEx.id,
        p_id_pedido: pedidoId || null,
        p_usuario_id: userEx.id,
      } as any)
    }

    return { ...((rpcData as any) || {}), redirect: null }
  }

  const stripe = getStripe()
  const proto = getRequestProtocol(event)
  const host = getRequestHost(event)

  const { data: configRow } = await client
    .from("com_config_gateway")
    .select("stripe_account_id")
    .eq("id_entidade", id_entidade)
    .maybeSingle() as any

  const { data: pedidoRow, error: pedidoErr } = await client
    .from("com_pedido")
    .insert({
      id_entidade, id_oferta, id_usuario: userEx.id,
      status: "pendente", valor_pago_centavos: ofertaRow.valor_centavos,
      criado_por: userEx.id, modificado_por: userEx.id,
    } as any)
    .select().single() as any

  if (pedidoErr) throw createError({ statusCode: 500, message: pedidoErr.message })

  try {
    const stripeOpts: any = {}
    if (configRow?.stripe_account_id) {
      stripeOpts.stripeAccount = configRow.stripe_account_id
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: { currency: "brl", unit_amount: ofertaRow.valor_centavos, product_data: { name: ofertaRow.nome_curto || "Curso" } },
        quantity: 1,
      }],
      metadata: { pedido_id: pedidoRow.id, id_oferta, id_programa: ofertaRow.com_produto?.id_programa, id_entidade, id_usuario: userEx.id },
      success_url: `${proto}://${host}/checkout/sucesso`,
      cancel_url: `${proto}://${host}/checkout/${ofertaRow.slug}`,
      customer_email: userEx.email,
    }, stripeOpts)

    const { error: updateErr } = await (client.from("com_pedido") as any)
      .update({ stripe_checkout_id: session.id })
      .eq("id", pedidoRow.id)

    if (updateErr) {
      throw createError({ statusCode: 500, message: `Erro ao salvar stripe_checkout_id: ${updateErr.message}` })
    }

    return { success: true, id: pedidoRow.id, status: "pendente", redirect: session.url }
  } catch (stripeError: any) {
    throw createError({ statusCode: 500, message: stripeError.message || "Erro ao criar sessão Stripe" })
  }
})
