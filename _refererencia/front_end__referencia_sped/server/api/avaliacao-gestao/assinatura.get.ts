import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const supabase = await serverSupabaseClient(event)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
        throw createError({ statusCode: 401, message: 'Não autenticado' })
    }
    const user = userData.user

    try {
        // 1. Obter id do user_expandido
        const { data: ux, error: uxError } = await (supabase as any)
            .from('user_expandido')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (uxError || !ux?.id) {
            throw createError({ statusCode: 404, message: 'Usuário expandido não encontrado.' })
        }

        const userId = ux.id

        // 2. Verificar se já existe uma assinatura e apagar do storage
        const { data: existingSignature } = await (supabase as any)
            .from('avl_avaliador_assinatura')
            .select('caminho_storage')
            .eq('id_user_expandido', userId)
            .single()

        if (!existingSignature?.caminho_storage) {
            return { success: true, url: null }
        }

        // 3. Gerar URL temporária para visualização (válida por 1 hora)
        const { data: signData, error: signError } = await supabase.storage
            .from('usr_crd')
            .createSignedUrl(existingSignature.caminho_storage, 60 * 60)

        if (signError || !signData?.signedUrl) {
            throw createError({ statusCode: 500, message: 'Erro ao gerar URL da assinatura' })
        }

        return { success: true, url: signData.signedUrl }

    } catch (e: any) {
        throw createError({
            statusCode: e.statusCode || 500,
            message: e.message || 'Erro interno.'
        })
    }
})
