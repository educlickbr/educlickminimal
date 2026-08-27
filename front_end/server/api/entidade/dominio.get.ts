import { serverSupabaseClient } from "#supabase/server";
import { getRequestHost, getRequestURL } from "h3";

/**
 * BFF público: resolve a entidade pelo domínio (host) da requisição.
 *
 * Usado por páginas DESLOGADAS (auth/landing) para aplicar o tema e o
 * branding da entidade (ex.: ensi abre claro + laranja).
 *
 * Segurança (acordo servidor_ssr_bff.md §5.2): o client anônimo NUNCA
 * chama a RPC direto. Aqui o BFF (service_role) chama
 * `app_resolver_entidade_por_dominio` (SECURITY DEFINER, grant só
 * service_role) e expõe apenas o necessário para a página pública.
 */
export default defineEventHandler(async (event) => {
    // 0. Query params — página pode já saber a entidade (ex.: oferta?ID=entidade)
    const query = getQuery(event);
    const p_id = (query.id as string) || (query.id_entidade as string) || "".trim();

    // 1. Resolve o host (remove a porta)
    const url = getRequestURL(event);
    const host = (getRequestHost(event) || url.hostname || "").replace(
        /:\d+$/,
        "",
    );

    const client = await serverSupabaseClient(event);

    // 2. Em dev (localhost), permite forçar uma entidade via env p/ teste.
    //    Fora isso, resolve pelo domínio (white label).
    const config = useRuntimeConfig();
    const isLocalhost =
        !host ||
        host === "localhost" ||
        host.startsWith("localhost:") ||
        host.startsWith("127.0.0.1");
    const fallbackId = (config.fallbackEntidadeId || "").trim();

    let entidade: any = null;
    let error: any = null;

    // prioridade: query id > fallback de dev > domínio
    if (p_id) {
        const rpc = await (client.rpc as any)("app_resolver_entidade_por_id", {
            p_id,
        });
        entidade = (rpc.data as any) || null;
        error = rpc.error;
    } else if (isLocalhost && fallbackId) {
        // dev: força a entidade do .env (ex.: ensi) p/ visualizar deslogado
        const rpc = await (client.rpc as any)("app_resolver_entidade_por_id", {
            p_id: fallbackId,
        });
        entidade = (rpc.data as any) || null;
        error = rpc.error;
    } else if (host) {
        const rpc = await (client.rpc as any)(
            "app_resolver_entidade_por_dominio",
            { p_dominio: host },
        );
        entidade = (rpc.data as any) || null;
        error = rpc.error;
    }

    if (error || !entidade?.id) {
        return {
            success: false,
            message: "Entidade não encontrada para o domínio",
        };
    }

    // 3. Expor apenas o necessário para a página pública
    return {
        success: true,
        id: entidade.id,
        nome: entidade.nome || entidade.nome_entidade,
        url: entidade.url,
        tema: entidade.tema || "dark",
        branding: entidade.branding || {},
    };
});
