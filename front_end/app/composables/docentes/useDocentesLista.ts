import { ref, computed } from "vue";

/**
 * Composable para listagem, cadastro e vínculos de docentes.
 */
export function useDocentesLista(idEntidade: () => string) {
    // ── Estado ──────────────────────────────────────────────
    const loading = ref(false);
    const docentes = ref<any[]>([]);

    // ── Filtros ─────────────────────────────────────────────
    const filtroBusca = ref("");

    // ── Paginação ──────────────────────────────────────────
    const pagina = ref(1);
    const total = ref(0);
    const limite = 20;
    const totalPaginas = computed(() => Math.ceil(total.value / limite) || 1);

    // ── Componentes disponíveis para vínculo ────────────────
    const componentesDisponiveis = ref<any[]>([]);

    async function fetchComponentes() {
        try {
            const res = (await $fetch("/api/docentes/componentes", {
                params: { id_entidade: idEntidade() },
            })) as any;
            if (res?.success) {
                componentesDisponiveis.value = res.itens || [];
            }
        } catch (e) {
            console.error("Erro ao carregar componentes:", e);
        }
    }

    // ── Fetch docentes ──────────────────────────────────────
    async function fetchDocentes() {
        loading.value = true;
        try {
            const res = (await $fetch("/api/docentes/docentes", {
                params: {
                    id_entidade: idEntidade(),
                    busca: filtroBusca.value || null,
                    pagina: String(pagina.value),
                    limite: String(limite),
                },
            })) as any;
            if (res?.success) {
                docentes.value = res.itens || [];
                total.value = res.total || 0;
            }
        } catch (e) {
            console.error("Erro ao carregar docentes:", e);
        } finally {
            loading.value = false;
        }
    }

    // ── Ativar/desativar docente ────────────────────────────
    async function toggleDocente(id: string, ativo: boolean): Promise<boolean> {
        try {
            const res = (await $fetch("/api/docentes/docentes", {
                method: "DELETE",
                params: { id, ativo: String(ativo) },
            })) as any;
            if (res?.success) {
                const item = docentes.value.find((d) => d.id === id);
                if (item) item.ativo = ativo;
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao alternar status do docente:", e);
            return false;
        }
    }

    // ── Vínculos ────────────────────────────────────────────
    async function fetchVinculos(
        idDocente: string,
    ): Promise<any[]> {
        try {
            const res = (await $fetch("/api/docentes/vinculos", {
                params: { id_docente: idDocente },
            })) as any;
            return res?.itens || [];
        } catch (e) {
            console.error("Erro ao carregar vínculos:", e);
            return [];
        }
    }

    async function salvarVinculos(
        idDocente: string,
        vinculos: any[],
    ): Promise<boolean> {
        try {
            const res = (await $fetch("/api/docentes/vinculos", {
                method: "POST",
                body: { id_docente: idDocente, vinculos },
            })) as any;
            if (res?.success) {
                await fetchDocentes(); // refresh para atualizar componentes no card
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao salvar vínculos:", e);
            return false;
        }
    }

    // ── Paginação ───────────────────────────────────────────
    function irParaPagina(p: number) {
        pagina.value = p;
    }

    return {
        loading,
        docentes,
        filtroBusca,
        pagina,
        total,
        totalPaginas,
        componentesDisponiveis,
        fetchDocentes,
        fetchComponentes,
        toggleDocente,
        fetchVinculos,
        salvarVinculos,
        irParaPagina,
    };
}

export type UseDocentesListaReturn = ReturnType<typeof useDocentesLista>;
