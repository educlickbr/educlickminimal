import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';
import { fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
        throw createError({
            statusCode: 401,
            message: "Usuário não autenticado",
        });
    }

    // Cloudflare Worker: read from query params (DELETE with body is problematic)
    const query = getQuery(event);
    const id_matricula = query.id_matricula as string;
    const data = query.data as string;
    const aula = query.aula as string;

    if (!id_matricula?.trim() || !data?.trim() || !aula?.trim()) {
        throw createError({
            statusCode: 400,
            message: "Missing required params: id_matricula, data, aula",
        });
    }

    if (![1, 2, 3, 4, "1", "2", "3", "4"].includes(aula)) {
        throw createError({
            statusCode: 400,
            message: "Parâmetro aula inválido",
        });
    }

    const authUserId = user.id || (user as any).sub;
    const { data: userExpandido, error: userError } = await client
        .from("user_expandido")
        .select("id")
        .eq("user_id", authUserId)
        .single();

    if (userError || !userExpandido) {
        throw createError({
            statusCode: 500,
            message: "Erro ao buscar dados do usuário",
        });
    }

    const userId = (userExpandido as any).id;
    const dateOnly = typeof data === "string" ? data.split("T")[0] : format(new Date(data), "yyyy-MM-dd");
    const dataSP = fromZonedTime(`${dateOnly} 00:00:00`, "America/Sao_Paulo");

    try {
        const { data: result, error } = await client.rpc("nxt_diario_apagar_presenca", {
            p_id_matricula: id_matricula,
            p_data: dataSP,
            p_aula: Number(aula),
            p_modificador: userId,
        } as any);

        const rpcResult = result as any;

        if (error) {
            throw createError({
                statusCode: 500,
                message: error.message,
            });
        }

        if (!rpcResult?.ok) {
            throw createError({
                statusCode: 400,
                message: rpcResult?.erro || "Falha ao apagar presença",
            });
        }

        return rpcResult;
    } catch (err) {
        console.error("Error in /api/educacional/diario-presenca DELETE:", err);
        throw createError({
            statusCode: 500,
            message: (err as any).message || "Erro ao apagar presença",
        });
    }
});
