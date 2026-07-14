import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const body = await readBody(event);

    if (!body.nome_grupo || !body.email_contato) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing required fields: nome_grupo, email_contato",
        });
    }

    const client = await serverSupabaseClient(event);

    try {
        // @ts-expect-error - RPC types need to be regenerated
        const { data, error } = await client.rpc('nxt_jnpta_criar_grupo', {
            p_nome_grupo: body.nome_grupo,
            p_email_contato: body.email_contato,
            p_redes_sociais: body.redes_sociais || null,
            p_nome_empresa: body.nome_empresa || null,
            p_razao_social: body.razao_social || null,
            p_cnpj: body.cnpj || null,
            p_telefone_fixo: body.telefone_fixo || null,
            p_telefone_celular: body.telefone_celular || null,
            p_regiao_administrativa: body.regiao_administrativa || null,
            p_endereco: body.endereco || null,
            p_numero: body.numero || null,
            p_complemento: body.complemento || null,
            p_cep: body.cep || null,
            p_cidade: body.cidade || null,
            p_banco: body.banco || null,
            p_agencia: body.agencia || null,
            p_conta_corrente: body.conta_corrente || null,
            p_pix: body.pix || null,
        }) as any;

        if (error) {
            console.error('Error creating grupo:', error);
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to create grupo',
            });
        }

        if (!data || !data.ok) {
            throw createError({
                statusCode: 400,
                statusMessage: data?.erro || 'Failed to create grupo',
            });
        }

        return data;
    } catch (err: any) {
        console.error('Unexpected error creating grupo:', err);
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal server error',
        });
    }
});
