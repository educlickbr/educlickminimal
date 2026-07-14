import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id_antigo, email_novo } = body

    if (!id_antigo || !email_novo) {
        throw createError({
            statusCode: 400,
            statusMessage: 'O ID do aluno antigo e o novo email são obrigatórios'
        })
    }

    const client = await serverSupabaseClient(event)

    // 1. Check if the new email exists and get its user_expandido id
    const { data: newUserCheck, error: emailError } = await (client.rpc as any)('nxt_checar_email_expandido', {
        p_email: email_novo
    })

    if (emailError) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao checar novo email: ' + emailError.message
        })
    }

    // Se nxt_checar_email_expandido retornar null ou undefined, significa que não achou o email (pelo que vi do bff check-email)
    // O retorno costuma ser { email_existe: boolean, user_expandido_id: uuid, nome: string... } (ajuste se necessário)
    // Se o email não existir, rejeita.
    const userFound = newUserCheck?.[0] || newUserCheck; // dependendo de como a RPC retorna (array vs objeto)

    if (!userFound || !userFound.user_expandido_id) {
        throw createError({
            statusCode: 404,
            statusMessage: 'O e-mail informado não foi encontrado. Instrua o aluno a criar a conta normalmente como candidato.'
        })
    }

    const id_novo = userFound.user_expandido_id;

    // 2. Garante que a nova conta seja do papel "Estudante"
    const PAPEL_ESTUDANTE_ID = '9a33b6e1-13ae-4029-85f9-ec02fba4b5f2'

    // Atualiza o papel do user expandido_novo usando o nxt_update_colaborador_papel (que serve para qualquer papel na vdd)
    const { error: updateRoleError } = await (client.rpc as any)('nxt_update_colaborador_papel', {
        p_id: id_novo,
        p_papel_id: PAPEL_ESTUDANTE_ID
    });

    if (updateRoleError) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao atualizar o papel do novo usuário para Estudante: ' + updateRoleError.message
        })
    }


    // 3. Executa a unificação/migração dos dados
    const { data: resultData, error: unificationError } = await (client.rpc as any)('nxt_mc_unificar_perfil_estudante', {
        id_antigo: id_antigo,
        id_novo: id_novo
    })

    if (unificationError) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao realizar a unificação de perfis: ' + unificationError.message
        })
    }

    if (resultData?.status === 'error') {
        throw createError({
            statusCode: 500,
            statusMessage: resultData.message || 'Erro interno na função de unificação.'
        })
    }

    return {
        success: true,
        message: 'Conta unificada com sucesso.',
        data: resultData
    }
})
