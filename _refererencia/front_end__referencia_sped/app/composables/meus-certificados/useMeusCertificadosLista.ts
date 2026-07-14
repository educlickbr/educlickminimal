import { $fetch as ofetch } from "ofetch"

export function useMeusCertificadosLista() {
    const fetchMeusCertificados = async (params: {
        busca: string | null
        page: number
        limit: number
    }) => {
        const data: any = await ofetch("/api/aluno/meus-certificados", { params })
        return data
    }

    return {
        fetchMeusCertificados,
    }
}
