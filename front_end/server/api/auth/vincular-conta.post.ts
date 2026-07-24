import { serverSupabaseClient } from "#supabase/server";

/**
 * POST /api/auth/vincular-conta
 * Body: { id_user_expandido?, id_user, email, nome? }
 *
 * Após o signUp, vincula o auth user ao user_expandido
 * e atribui papel automaticamente (docente, estudante ou candidato).
 *
 * Se id_user_expandido não for informado, usa RPC DEFINER
 * para buscar ou criar o user_expandido (bypassa RLS).
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const body = await readBody(event);
    const config = useRuntimeConfig();

    if (!body.id_user || !body.email) {
        throw createError({ statusCode: 400, message: "Dados incompletos." });
    }

    const idUser = body.id_user;
    let idUserExpandido = body.id_user_expandido ? String(body.id_user_expandido) : undefined;

    // Se não veio id_user_expandido, busca ou cria pelo email
    // via RPC SECURITY DEFINER (bypassa RLS para usuário não logado)
    if (!idUserExpandido) {
        const { data: ueId, error: ueError } = await (client as any).rpc(
            "aca_find_or_create_user_expandido",
            { p_email: body.email, p_nome: body.nome || "" }
        );

        if (ueError || !ueId) {
            throw createError({ statusCode: 500, message: "Erro ao localizar usuário." });
        }
        idUserExpandido = String(ueId);
    }

    // 1. Vincula id_user ao user_expandido
    const { error: linkError } = await (client as any).rpc("aca_vincular_auth_user", {
        p_id_user_expandido: idUserExpandido,
        p_id_user: idUser,
    });

    if (linkError) {
        throw createError({ statusCode: 500, message: "Erro ao vincular conta." });
    }

    // 2. Determina e atribui papel
    const papelNome = await determinarPapel(client, idUserExpandido);
    if (papelNome) {
        const { data: papelData } = await (client as any)
            .from("user_papeis")
            .select("id")
            .eq("nome", papelNome)
            .single();

        if (papelData?.id) {
            await (client as any).rpc("aca_atribuir_papel_auth", {
                p_id_user: idUser,
                p_id_papel: papelData.id,
            });
        }
    }

    // 3. Webhook convite
    const conviteWebhook = config.powerAutomateConvite;
    if (conviteWebhook) {
        const { data: ue } = await (client as any)
            .from("user_expandido")
            .select("nome_completo")
            .eq("id", idUserExpandido)
            .single();

        const origin = getRequestProtocol(event) + "://" + getRequestHost(event);

        $fetch(conviteWebhook, {
            method: "POST",
            body: {
                email: body.email,
                nome: ue?.nome_completo || "",
                link: `${origin}/auth/login`,
            },
        }).catch((err) => {
            console.warn("[Power Automate] Falha webhook convite:", err.message);
        });
    }

    return {
        success: true,
        message: "Conta vinculada com sucesso!",
        papel: papelNome,
        id_user_expandido: idUserExpandido,
    };
});

async function buscarEntidadeDoUsuario(client: any, idUserExpandido: string): Promise<string | null> {
    const { data: doc } = await (client as any)
        .from("aca_docente")
        .select("id_entidade")
        .eq("id_user_expandido", idUserExpandido)
        .maybeSingle();
    if (doc?.id_entidade) return doc.id_entidade;

    const { data: mat } = await (client as any)
        .from("aca_matricula")
        .select("id_entidade")
        .eq("id_usuario", idUserExpandido)
        .maybeSingle();
    if (mat?.id_entidade) return mat.id_entidade;

    return null;
}

async function determinarPapel(client: any, idUserExpandido: string): Promise<string> {
    const { data: docente } = await (client as any)
        .from("aca_docente")
        .select("id")
        .eq("id_user_expandido", idUserExpandido)
        .maybeSingle();
    if (docente) return "aca_docente";

    const { data: estudante } = await (client as any)
        .from("aca_matricula")
        .select("id")
        .eq("id_usuario", idUserExpandido)
        .maybeSingle();
    if (estudante) return "aca_estudante";

    return "aca_candidato";
}
