
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await client.auth.getUser();

    // Validar se o usuário está logado
    if (!user.data.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        });
    }

    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const isPublicView = String(query.public_view) === 'true';

    const { data, error } = await (client.rpc as any)('nxt_edt_edital_get_paginado', {
        p_ano_semestre: query.ano_semestre || null,
        p_page: page,
        p_limit: limit,
        p_public_view: isPublicView
    });

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }

    let result = Array.isArray(data) ? data : [];

    const shouldHydrateEtapas =
        isPublicView &&
        result.some((edital: any) => Number(edital?.total_etapas || 0) > 0 && (!Array.isArray(edital?.etapas) || edital.etapas.length === 0));

    if (shouldHydrateEtapas) {
        const { data: adminData, error: adminError } = await (client.rpc as any)('nxt_edt_edital_get_paginado', {
            p_ano_semestre: query.ano_semestre || null,
            p_page: page,
            p_limit: limit,
            p_public_view: false
        });

        if (!adminError && Array.isArray(adminData)) {
            const now = new Date();
            const byId = new Map(adminData.map((edital: any) => [edital.id, edital]));

            result = result.map((edital: any) => {
                const source = byId.get(edital.id);
                const sourceEtapas = Array.isArray(source?.etapas) ? source.etapas : [];

                const visibleEtapas = sourceEtapas.filter((etapa: any) => {
                    if (!etapa?.is_publicado) return false;

                    const publicadoEm = etapa?.publicado_em ? new Date(etapa.publicado_em) : null;
                    const desativadoEm = etapa?.desativado_em ? new Date(etapa.desativado_em) : null;

                    if (publicadoEm && publicadoEm > now) return false;
                    if (desativadoEm && desativadoEm < now) return false;

                    return true;
                });

                return {
                    ...edital,
                    etapas: visibleEtapas,
                    total_etapas: visibleEtapas.length
                };
            });
        }
    }

    return result;
});
