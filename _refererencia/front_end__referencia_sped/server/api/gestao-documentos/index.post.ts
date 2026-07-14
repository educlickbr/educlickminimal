import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Não autenticado' });
    }

    const body = await readBody(event);
    const userId = user?.id || (user as any)?.sub;

    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'ID de Usuário ausente no Token JWT' });
    }

    // Converte data YYYY-MM-DD para meia-noite em São Paulo (UTC-3)
    const toSaoPauloISO = (dateStr: string | null | undefined): string | null => {
        if (!dateStr || dateStr === 'null' || dateStr === '') return null;
        // Adiciona horário 00:00:00 com offset -03:00 (São Paulo)
        return `${dateStr}T00:00:00-03:00`;
    };

    const pDadosObj = {
        auth_user_id: userId,
        id: body.id ?? null,
        nome_documento: body.nome_documento,
        descricao: body.descricao ?? null,
        arquivo: body.arquivo ?? null,
        escopo: body.escopo,
        area: body.area ?? null,
        id_turma: body.id_turma ?? null,
        publicado: body.publicado ?? false,
        vigencia_ini: toSaoPauloISO(body.vigencia_ini),
        vigencia_fim: toSaoPauloISO(body.vigencia_fim),
    };

    const { data, error } = await (client.rpc as any)('nxt_upsert_documento_curso', {
        p_dados: pDadosObj
    });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    return data;
});
