
import { serverSupabaseClient } from '#supabase/server'
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { credentials, answers, queryParams, authUserId, papel_id } = body

    // Support both new structure (credentials) and old (answers map) for robustness
    const email = credentials?.email || answers?.email
    const password = credentials?.senha || answers?.senha
    const confirmPassword = credentials?.confirmar_senha || answers?.confirmar_senha
    const nome = credentials?.nome || answers?.nome
    const sobrenome = credentials?.sobrenome || answers?.sobrenome

    // Validate Password Match
    if (password !== confirmPassword) {
        throw createError({
            statusCode: 400,
            statusMessage: 'As senhas não conferem.'
        })
    }

    if (!email || !password || !nome || !sobrenome) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Preencha todos os campos obrigatórios.'
        })
    }

    const userId = authUserId
    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID de usuário Auth não fornecido.'
        })
    }

    let userExpandidoId = null
    const client = await serverSupabaseClient(event)

    // Upsert user_expandido using the standard RPC
    // Use papel_id from frontend (form load) or fallback to generic if really missing
    const roleId = papel_id || queryParams?.papel || 'd19ba89e-9a15-4194-929a-db47695fb2be'

    const { data: upsertData, error: upsertError } = await (client as any).rpc('nxt_upsert_user_expandido', {
        p_user_id: userId,
        p_nome: nome,
        p_sobrenome: sobrenome,
        p_email: email,
        p_papel_id: roleId
    })

    if (upsertError) {
        console.error('Error in nxt_upsert_user_expandido:', upsertError)
        // If error is 42501 (RLS), it means the migration v8 (SECURITY DEFINER) was not applied correctly
        const isRlsError = upsertError.code === '42501'
        throw createError({
            statusCode: 500,
            statusMessage: isRlsError
                ? 'Erro de permissão: Por favor, aplique a migration v8 no Supabase (precisa de SECURITY DEFINER).'
                : `Erro ao criar perfil de usuário: ${upsertError.message || upsertError.code}`
        })
    }

    // Extract properly from JSONB return { success: bool, user_expandido_id: uuid, ... }
    userExpandidoId = upsertData?.user_expandido_id || upsertData

    // Save Answers (if provided as array)
    if (answers && Array.isArray(answers) && answers.length > 0 && userExpandidoId) {

        // 1. Process File Uploads (Base64 -> Bunny.net)
        const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
        const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
        if (STORAGE_ZONE_NAME && ACCESS_KEY) {
            const REGION = process.env.BUNNY_REGION || "br";
            const hostname = `${REGION}.storage.bunnycdn.com`;

            for (const ans of answers) {
                // If the answer is base64 (very long, no spaces, starts with data if not stripped)
                if (ans.resposta && typeof ans.resposta === 'string' && ans.resposta.length > 500 && !ans.resposta.includes(' ')) {
                    try {
                        const extension = ans.nome_arquivo_original?.split('.').pop() || 'png';
                        // Generate safe UUID filename
                        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                            const r = Math.random() * 16 | 0;
                            const v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                        const uuidName = `${uuid}.${extension}`;

                        // Decode base64
                        const base64Data = ans.resposta.includes('base64,') ? ans.resposta.split('base64,')[1] : ans.resposta;
                        if (!base64Data) continue;

                        const binaryData = Buffer.from(base64Data, "base64");
                        const bunnyUrl = `https://${hostname}/${STORAGE_ZONE_NAME}/usr/${encodeURIComponent(uuidName)}`;

                        const bunnyRes = await fetch(bunnyUrl, {
                            method: "PUT",
                            headers: {
                                "AccessKey": ACCESS_KEY,
                                "Content-Type": "application/octet-stream",
                            },
                            body: binaryData,
                        });

                        if (bunnyRes.ok) {
                            ans.resposta = uuidName; // Swap base64 for the filename
                        }
                    } catch (e) {
                        console.error('Registration File Upload Error:', e);
                    }
                }
            }
        }

        const { error: saveError } = await (client as any).rpc('nxt_salvar_respostas_usuario', {
            p_id_usuario: userId,
            p_respostas: answers,
            p_id_turma: null,
            p_user_expandido_id: userExpandidoId
        })

        if (saveError) {
            console.error('Error saving answers:', saveError)
            // Should we fail the whole registration? Maybe just log error but allow account creation.
            // But user expects answers saved.
            throw createError({
                statusCode: 500,
                statusMessage: 'Conta criada, mas erro ao salvar respostas.'
            })
        }
    }

    return { success: true }
})
