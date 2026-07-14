import { $fetch as ofetch } from "ofetch";

export function useSelecaoAcoes() {
    const matricularCandidato = async (pIdTurma: string, pIdUser: string) => {
        await ofetch("/api/selecao/matricular", {
            method: "POST",
            body: { p_id_turma: pIdTurma, p_id_user: pIdUser },
        });
    };

    const deletarInscricao = async (pProcessoId: string) => {
        await ofetch("/api/selecao/deletar-inscricao", {
            method: "POST",
            body: { p_processo_id: pProcessoId },
        });
    };

    const matricularLote = async (
        idTurma: string,
        idsProcessos: string[],
    ) => {
        const response: any = await ofetch("/api/selecao/matricular-lote", {
            method: "POST",
            body: { id_turma: idTurma, ids_processos: idsProcessos },
        });
        return response;
    };

    const autorizarExcepcional = async (
        idProcesso: string,
        dtIniMatSup: string,
        dtFimMatSup: string,
    ) => {
        const response: any = await ofetch(
            "/api/selecao/autorizar-excepcional",
            {
                method: "POST",
                body: {
                    id_processo: idProcesso,
                    matricula_suplente: true,
                    dt_ini_mat_sup: dtIniMatSup,
                    dt_fim_mat_sup: dtFimMatSup,
                },
            },
        );
        return response;
    };

    return {
        matricularCandidato,
        deletarInscricao,
        matricularLote,
        autorizarExcepcional,
    };
}
