import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

// Email de preview da secretaria: ignora data de início mas respeita data de fim
const PREVIEW_EMAIL = "aluno.seletivo@spescoladedanca.org.br";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    // Default to 'estudante' if not provided
    const tipoCandidatura = query.tipo_candidatura || "estudante";

    // Current timestamp for filtering
    const now = new Date().toISOString();

    // Verifica se é o email de preview (secretaria avaliando antes da abertura)
    const user = await serverSupabaseUser(event);
    const isPreviewUser = user?.email === PREVIEW_EMAIL;

    // Preview: passa null para a RPC (sem filtro de data) e aplica apenas o filtro de fim manualmente
    const rpcData = isPreviewUser ? null : now;
    const todayStr = now.slice(0, 10); // YYYY-MM-DD

    try {
        let resultData = [];

        if (tipoCandidatura === "docente") {
            const { data, error } = await (client as any).rpc(
                "listar_turmas_disponiveis_docente",
                { p_data: rpcData, p_area: null, p_ano_semestre: null },
            );
            if (error) throw error;
            resultData = data || [];
        } else {
            const { data, error } = await (client as any).rpc(
                "listar_turmas_disponiveis_v2",
                { p_data: rpcData, p_area: null, p_ano_semestre: null },
            );
            if (error) throw error;
            resultData = data || [];
        }

        // Para o preview, a RPC retornou tudo (sem filtro de data).
        // Aplicamos apenas o filtro de data de FIM para não exibir turmas encerradas.
        if (isPreviewUser) {
            resultData = resultData.filter((turma: any) => {
                const dtFim = turma.dt_fim_inscri; // formato YYYY-MM-DD
                return !dtFim || dtFim >= todayStr;
            });
        }

        // Return raw data, frontend will handle filtering/display
        return {
            items: resultData,
            source: tipoCandidatura,
        };
    } catch (err: any) {
        throw createError({
            statusCode: 500,
            statusMessage: "Erro ao buscar cursos disponíveis.",
            data: err.message,
        });
    }
});
