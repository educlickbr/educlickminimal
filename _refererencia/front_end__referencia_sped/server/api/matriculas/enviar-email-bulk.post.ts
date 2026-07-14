import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const body = await readBody(event);
    const { scope, filters, subject, message, id_user_origem } = body;

    if (!scope || !filters || !subject || !message || !id_user_origem) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields'
        });
    }

    const client = await serverSupabaseClient(event);

    // Call RPC to create/check thread
    const { data: rpcData, error: rpcError } = await client.rpc('email_threads_upsert', {
        p_assunto: subject,
        p_mensagem: message,
        p_escopo: scope.toLowerCase(),
        p_id_user_origem: id_user_origem,
        p_ano_semestre: filters.ano_semestre,
        p_status_thread: 'pendente',

        // Scope specific params
        p_id_turma: scope === 'turma' ? filters.id_turma : null,
        p_id_user_destino: null,
        // Pass area if scope is area to ensure correct deduplication and storage
        // If scope is NOT area (e.g. turma), pass null as per requirement for non-area scopes
        p_filtro_area: scope === 'area' ? filters.area : null
    } as any);

    if (rpcError) {
        console.error('Error creating email thread:', rpcError);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error creating email thread: ' + rpcError.message
        });
    }

    return {
        success: true,
        message: 'Bulk email request processed',
        data: rpcData
    };
});
