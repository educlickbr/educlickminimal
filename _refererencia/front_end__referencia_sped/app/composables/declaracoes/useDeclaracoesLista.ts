import { ref } from "vue"
import { $fetch as ofetch } from "ofetch"
import { useAppStore } from "~/stores/app"

export function useDeclaracoesLista() {
    const store = useAppStore()
    const loading = ref(false)
    const declaracoes = ref<any[]>([])

    const fetchDeclaracoes = async () => {
        if (!store.user_expandido_id) return
        loading.value = true
        try {
            const data = await ofetch("/api/aluno/historico-declaracoes", {
                params: { id_aluno: store.user_expandido_id },
            })
            declaracoes.value = data || []
        } catch (e) {
            console.error("Erro ao buscar declarações:", e)
        } finally {
            loading.value = false
        }
    }

    return {
        declaracoes,
        loading,
        fetchDeclaracoes,
    }
}
