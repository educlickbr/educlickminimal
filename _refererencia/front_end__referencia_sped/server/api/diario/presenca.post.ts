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

    const body = await readBody(event);
    const {
        id_matricula,
        data,
        status,
        aula,
        qtd_periodos,
        area,
        justificativa,
    } = body;

    // Validate required fields
    if (!id_matricula || !data || !status) {
        throw createError({
            statusCode: 400,
            message: "Parâmetros obrigatórios: id_matricula, data, status",
        });
    }

    // Determine which period columns to update based on qtd_periodos and aula
    // Convert status to lowercase to match enum (presente, falta, abonada, justificada)
    const statusLower = status.toLowerCase();

    let p1 = null;
    let p2 = null;
    let p3 = null;
    let p4 = null;

    if (qtd_periodos === 1) {
        // Only one period: update p1, rest null
        p1 = statusLower;
    } else if (qtd_periodos > 1) {
        // Multiple periods: update based on selected aula
        if (aula === 1 || aula === "1") {
            p1 = statusLower;
        } else if (aula === 2 || aula === "2") {
            p2 = statusLower;
        } else if (aula === 3 || aula === "3") {
            p3 = statusLower;
        } else if (aula === 4 || aula === "4") {
            p4 = statusLower;
        }
    }

    // Get user_expandido_id from database
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

    // Normalização de Data para America/Sao_Paulo (Midnight)
    // Extrai apenas a parte da data (YYYY-MM-DD) da string original para evitar conversões de fuso indesejadas
    const dateOnly = typeof data === 'string' ? data.split('T')[0] : format(new Date(data), 'yyyy-MM-dd');
    const dataSP = fromZonedTime(`${dateOnly} 00:00:00`, 'America/Sao_Paulo');

    console.log("[DEBUG] User Expandido ID:", userId);
    console.log("[DEBUG] Original Data:", data);
    console.log("[DEBUG] Date Only Extracted:", dateOnly);
    console.log("[DEBUG] Data SP (UTC):", dataSP.toISOString());

    console.log("[DEBUG] Sending to RPC:", {
        p_id_matricula: id_matricula,
        p_data: dataSP,
        p_p1: p1,
        p_p2: p2,
        p_p3: p3,
        p_p4: p4,
        p_justificativa: null,
        p_criador: userId,
        p_area: area || null,
    });

    try {
        const { data: result, error } = await client.rpc(
            "nxt_diario_registrar_presenca",
            {
                p_id_matricula: id_matricula,
                p_data: dataSP,
                p_p1: p1,
                p_p2: p2,
                p_p3: p3,
                p_p4: p4,
                p_justificativa: justificativa || null,
                p_criador: userId,
                p_area: area || null,
            } as any,
        );

        if (error) {
            throw createError({
                statusCode: 500,
                message: error.message,
            });
        }

        return result;
    } catch (err) {
        console.error("Error in /api/educacional/diario-presenca:", err);
        throw createError({
            statusCode: 500,
            message: (err as any).message || "Erro ao registrar presença",
        });
    }
});
