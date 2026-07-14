import { serverSupabaseClient } from '#supabase/server'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
    const supabase = await serverSupabaseClient(event)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
        throw createError({ statusCode: 401, message: 'Não autenticado' })
    }
    const user = userData.user

    const { signatureData } = await readBody(event)
    if (!signatureData) {
        throw createError({ statusCode: 400, message: 'Assinatura não fornecida' })
    }

    try {
        // 1. Obter id do user_expandido
        const { data: ux, error: uxError } = await (supabase as any)
            .from('user_expandido')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (uxError || !ux?.id) {
            throw createError({ statusCode: 400, message: 'Usuário expandido não encontrado.' })
        }

        const userId = ux.id

        // 2. Verificar se já existe uma assinatura e apagar do storage
        const { data: existingSignature } = await (supabase as any)
            .from('avl_avaliador_assinatura')
            .select('caminho_storage')
            .eq('id_user_expandido', userId)
            .single()

        if (existingSignature?.caminho_storage) {
            await supabase.storage
                .from('usr_crd')
                .remove([existingSignature.caminho_storage])
        }

        const filePath = `${userId}/${randomUUID()}.png`

        // 3. Extrair base64 e subir para storage
        const base64Content = signatureData.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Content, 'base64')

        const { error: uploadError } = await supabase.storage
            .from('usr_crd')
            .upload(filePath, buffer, {
                contentType: 'image/png',
                upsert: true
            })

        if (uploadError) {
            throw createError({ statusCode: 500, message: 'Erro ao fazer upload da assinatura: ' + uploadError.message })
        }

        // 4. Registrar caminho na tabela
        const { error: dbError } = await (supabase as any)
            .from('avl_avaliador_assinatura')
            .upsert(
                { id_user_expandido: userId, caminho_storage: filePath },
                { onConflict: 'id_user_expandido' }
            )

        if (dbError) {
            throw createError({ statusCode: 500, message: 'Erro ao registrar assinatura: ' + dbError.message })
        }

        return { success: true, path: filePath }

    } catch (e: any) {
        throw createError({
            statusCode: e.statusCode || 500,
            message: e.message || 'Erro interno.'
        })
    }
})
