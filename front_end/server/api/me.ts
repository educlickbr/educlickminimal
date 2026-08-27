import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { getRequestHost, getRequestURL } from "h3";

/**
 * Resolve o domínio (host) da requisição.
 * Em dev/localhost sem entidade mapeada, cai no fallback (primeira entidade do usuário).
 */
async function resolveEntidadeAtiva(event: any, client: any, userId: string) {
    const url = getRequestURL(event);
    const host = (getRequestHost(event) || url.hostname || "").replace(
        /:\d+$/,
        "",
    ); // remove porta

    if (!host) return null;

    const { data: res } = await (client.rpc as any)(
        "app_resolver_entidade_por_dominio",
        { p_dominio: host },
    );
    const resolved = (res as any) || {};
    if (resolved?.success && resolved?.id) return resolved;
    return null;
}

/**
 * Resolve uma entidade pelo ID via RPC (SECURITY DEFINER, chamada no BFF).
 * Não exige vínculo com o usuário. Usado apenas no bypass de dev/localhost.
 * Acordo (servidor_ssr_bff.md): BFF → RPC, nunca query direta em tabela.
 */
async function buscarEntidadePorId(client: any, id: string) {
    const { data, error } = await (client.rpc as any)(
        "app_resolver_entidade_por_id",
        { p_id: id },
    );
    const r = (data as any) || {};
    if (error || !r?.id) return null;
    return r;
}

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);

    if (!user) {
        return { user: null, profile: null, role: null };
    }

    const client = await serverSupabaseClient(event);
    const userId = user.id || (user as any).sub;

    try {
        // 1. Fetch signed URL hash from Edge Function 'hash_app'
        const { data: hashData } = await client.functions.invoke("hash_app", {
            body: {
                user_id: userId,
                path: "/usr/",
            },
        });

        // 2. Fetch Full Session Data from DB (legado — não quebra compat)
        const { data: sessionData, error: rpcError } =
            await (client.rpc as any)(
                "nxt_get_user_session_v1",
                { p_auth_id: userId },
            );

        if (rpcError) {
            console.error("RPC Error in /api/me:", rpcError);
        }

        const session = (sessionData as any) || {};
        const usuario = session.usuario || {};

        const nome_completo_str = usuario.nome_completo || "";
        const parts = nome_completo_str.trim().split(" ");
        const nome_str = parts[0] || null;
        const sobrenome_str = parts.length > 1 ? parts.slice(1).join(" ") : null;

        // 3. Resolve entidade ativa pelo domínio (host)
        const entidadePorDominio = await resolveEntidadeAtiva(event, client, userId);

        // Entidades do usuário (legado) — usadas como fallback p/ dev/localhost
        const entidades = session.entidades || [];

        // Ordem de resolução:
        //  1. Em dev (localhost): EDUCLICK_FALLBACK_ENTIDADE_ID prevalece,
        //     se o usuário pertencer à entidade — permite testar branding/tema
        //     de qualquer entidade (ex.: ensi) mesmo com outra no dominios.
        //  2. Senão: resolução por domínio (white label) — a educlick tem
        //     `localhost` no `dominios`, então SEM a priorização acima ela
        //     sempre venceria e o fallback de dev nunca rodaria.
        //  3. Último recurso: 1ª empresa do usuário.
        const config = useRuntimeConfig();
        const isLocalhost =
            !getRequestHost(event) ||
            getRequestHost(event) === "localhost" ||
            getRequestHost(event)?.startsWith("localhost:") ||
            getRequestHost(event)?.startsWith("127.0.0.1");

        let entidadeAtivaId = (entidadePorDominio?.id as string) || null;
        let entidadeAtivaObj = entidadePorDominio || null;
        // Em dev (localhost) com EDUCLICK_FALLBACK_ENTIDADE_ID, permite ver uma
        // entidade mesmo sem pertencer a ela (bypass de teste): trata como admin.
        let isDevBypass = false;

        if (isLocalhost) {
            const fallbackId = (config.fallbackEntidadeId || "").trim();
            if (fallbackId) {
                const peloFallback = (entidades as any[]).find(
                    (e: any) => e.id === fallbackId,
                );
                if (peloFallback) {
                    // usuário pertence: fluxo normal
                    entidadeAtivaObj = peloFallback;
                    entidadeAtivaId = peloFallback.id;
                } else {
                    // usuário NÃO pertence: busca direto no banco (bypass dev)
                    const direto = await buscarEntidadePorId(client, fallbackId);
                    if (direto) {
                        entidadeAtivaObj = direto;
                        entidadeAtivaId = direto.id;
                        isDevBypass = true;
                    }
                }
            }
        }

        // domínio (produção / white label) ou 1ª empresa se ainda não resolveu
        if (!entidadeAtivaId) {
            entidadeAtivaObj =
                (entidades as any[]).find((e: any) => e.tipo === "empresa") ||
                (entidades as any[])[0] ||
                entidadeAtivaObj ||
                null;
            entidadeAtivaId = entidadeAtivaObj?.id || null;
        }

        // 3.1 Gate de acesso por produto (Fase F):
        // a entidade tem ao menos 1 produto ativo em entidade_produto?
        // se não, sem_acesso (front avisa + desloga).
        // O bypass de dev NÃO bloqueia (é ferramenta local de teste).
        const produtosEntidade = entidadeAtivaObj?.produtos || [];
        const temProdutoAtivo = Array.isArray(produtosEntidade)
            ? produtosEntidade.some((p: any) => p.ativo === true)
            : false;

        if (entidadeAtivaId && !temProdutoAtivo && !isDevBypass) {
            return {
                success: false,
                sem_acesso: true,
                message: "Seu acesso a este produto não está ativo nesta entidade.",
                usuario: { id: usuario.id, email: user.email },
            };
        }

        // 4. Sessão com permissões (correção do papel por entidade)
        let permissoesData: any = {};
        if (entidadeAtivaId) {
            if (isDevBypass) {
                // dev: usuário não pertence à entidade, então o RPC falharia.
                // Monta a sessão como admin (vê tudo) para poder testar
                // branding/tema/permissões da entidade localmente.
                permissoesData = {
                    success: true,
                    is_admin: true,
                    entidade_ativa: entidadeAtivaObj
                        ? {
                              id: entidadeAtivaObj.id,
                              nome: entidadeAtivaObj.nome_entidade || entidadeAtivaObj.nome,
                              tipo: entidadeAtivaObj.tipo,
                              url: entidadeAtivaObj.url,
                              dominios: entidadeAtivaObj.dominios || [],
                              rota_inicial: entidadeAtivaObj.rota_inicial || "/",
                              tema: entidadeAtivaObj.tema || "dark",
                              branding: entidadeAtivaObj.branding || {},
                          }
                        : null,
                    entidades: [],
                    papeis: [],
                    permissoes: [],
                    rota_inicial: entidadeAtivaObj?.rota_inicial || "/",
                    tema: entidadeAtivaObj?.tema || "dark",
                };
            } else {
                const { data: sessaoRes, error: sessaoErr } =
                    await (client.rpc as any)(
                        "app_get_minha_sessao",
                        { p_id_entidade: entidadeAtivaId },
                    );
                if (sessaoErr) {
                    console.error("RPC app_get_minha_sessao error:", sessaoErr);
                }
                permissoesData = (sessaoRes as any) || {};
            }
        }

        // 5. Papel global de fallback (decisão: papel por entidade é a fonte; isso não quebra hasRole)
        const primeiroPapel = (permissoesData?.papeis || [])[0] || null;

        return {
            success: session.success || false,
            usuario: {
                id: usuario.id || null,
                id_auth: usuario.id_user || userId,
                email: usuario.email || user.email,
                nome_completo: nome_completo_str || null,
            },
            // Facilita o acesso direto no front-end para compatibilidade
            user_expandido_id: usuario.id || null,
            nome_completo: nome_completo_str || null,
            nome: nome_str,
            sobrenome: sobrenome_str,

            // Dados de acesso (legado)
            entidades: session.entidades || [],
            hash_base: hashData?.url || null,

            // NOVO — multientidade/permissões
            entidade_ativa: permissoesData?.entidade_ativa || entidadeAtivaObj || null,
            entidades_completo: permissoesData?.entidades || [],
            papeis: permissoesData?.papeis || [],
            permissoes: permissoesData?.permissoes || [],
            is_admin: permissoesData?.is_admin || false,
            rota_inicial: permissoesData?.rota_inicial || "/",
            // Tema padrão da entidade (claro/escuro) — item 2
            tema: permissoesData?.tema || null,
            // Gate de produto: lista de produtos ativos da entidade (Fase F)
            sem_acesso: false,
            produtos: produtosEntidade
                .filter((p: any) => p.ativo === true)
                .map((p: any) => ({ id: p.id, slug: p.slug, nome: p.nome })),
            // Papel por entidade ativa (corrige o bug do store.role)
            role: primeiroPapel
                ? { papel_id: primeiroPapel.id, nome: primeiroPapel.nome }
                : null,
        };
    } catch (err) {
        console.error("General error in /api/me:", err);
        return {
            success: false,
            error: (err as any).message,
        };
    }
});
