
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    // Endpoint preservado por compatibilidade com integrações existentes.
    // O fluxo de aluno/faltas não o aciona mais automaticamente.
    // 1. Auth Check - optional for internal tools but good practice
    // Sometimes user session might be tricky if called in background?
    // But since it's called from client while user is logged in, it should be fine.
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    // 2. Read Body
    const body = await readBody(event);
    const {
        nome_aluno,
        sobrenome_aluno,
        email_aluno,
        nome_curso,
        cod_turma,
        turno,
        texto,
        data_inicio,
        data_fim,
        arquivo_anexo_path,
        ficha_justificativa_path
    } = body;

    const config = useRuntimeConfig();
    const webhookUrl = config.powerAutomateJustificativaWebhook;

    if (!webhookUrl) {
        console.error("Missing POWER_AUTOMATE_JUSTIFICATIVA_WEBHOOK env var");
        // Don't crash the UI, just log error
        return { success: false, error: "Webhook not configured" };
    }

    // Helper to extract clean filename
    const getCleanFilename = (path: string | null) => {
        if (!path) return "Nenhum";
        // Remove 'secretaria/' prefix if present
        return path.replace(/^secretaria\//, '');
    };

    const payload = {
        aluno: `${nome_aluno} ${sobrenome_aluno}`,
        email: email_aluno,
        curso: nome_curso,
        turma: cod_turma,
        turno: turno,
        motivo: texto,
        periodo: `${data_inicio} a ${data_fim}`,
        arquivo_anexo: getCleanFilename(arquivo_anexo_path),
        arquivo_ficha: getCleanFilename(ficha_justificativa_path),
        data_envio: new Date().toISOString()
    };

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Power Automate Error:", response.status, text);
            return { success: false, error: `External service error: ${text}` };
        }

        return { success: true };

    } catch (err) {
        console.error("Notification Failed:", err);
        return { success: false, error: "Network error" };
    }
});
